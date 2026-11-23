import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import HabitCheckIn from '../models/HabitCheckIn.js';
import WorkSession from '../models/WorkSession.js';
import ScreenTimeRecord from '../models/ScreenTimeRecord.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import DailyAnalytics from '../models/DailyAnalytics.js';

export const syncDailyAnalytics = async (userId, dateStr) => {
  try {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    // 1. Tasks
    const dayTasks = await Task.find({
      user: userId,
      dueDate: { $gte: startOfDay, $lte: endOfDay }
    });
    const plannedTasks = dayTasks.length;
    const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
    const goalRelevantCompleted = dayTasks.filter(t => t.status === 'completed' && (t.isGoalRelevant || t.goal)).length;
    const taskCompletionRate = plannedTasks > 0 ? Number((completedTasks / plannedTasks).toFixed(2)) : 0;

    // 2. Habits (Accurately scheduled by day of week)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const targetDateObj = new Date(`${dateStr}T12:00:00Z`);
    const dayOfWeekName = dayNames[targetDateObj.getUTCDay()];

    const activeHabits = await Habit.find({ user: userId, active: true });
    const scheduledHabitsList = activeHabits.filter(h => {
      if (!h.daysOfWeek || h.daysOfWeek.length === 0) return true;
      return h.daysOfWeek.includes(dayOfWeekName);
    });
    const scheduledHabits = scheduledHabitsList.length;

    const checkIns = await HabitCheckIn.find({
      user: userId,
      date: dateStr,
      completed: true
    }).populate('habit');

    const completedHabits = checkIns.length;
    const completedHabitNames = checkIns.map(c => c.habit?.title).filter(Boolean);
    const habitAdherenceRate = scheduledHabits > 0
      ? Number(Math.min(1.0, completedHabits / scheduledHabits).toFixed(2))
      : (activeHabits.length > 0 ? 1.0 : 0);

    // 3. Work Sessions
    const sessions = await WorkSession.find({
      user: userId,
      date: dateStr
    });
    const totalWorkMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const goalWorkMinutes = sessions.filter(s => s.goal).reduce((sum, s) => sum + s.durationMinutes, 0);
    const focusSessionCount = sessions.length;

    // 4. Screen Time
    const screenRecord = await ScreenTimeRecord.findOne({ user: userId, date: dateStr });
    const totalScreenMinutes = screenRecord?.totalMinutes || 0;
    const distractingScreenMinutes = screenRecord?.distractingMinutes || 0;
    const productiveScreenMinutes = screenRecord?.productiveMinutes || 0;

    // 5. Goal Progress Delta
    const progressEvents = await GoalProgressEvent.find({ user: userId, date: dateStr });
    const goalProgressDelta = Number(progressEvents.reduce((sum, e) => sum + (e.progressDelta || 0), 0).toFixed(2));
    const milestonesCompletedCount = progressEvents.filter(e => e.eventType === 'milestone_completed').length;

    // Check existing analytics for rest day flags
    const existing = await DailyAnalytics.findOne({ user: userId, date: dateStr });
    const isHolidayOrRestDay = existing?.isHolidayOrRestDay || false;
    const restDayNote = existing?.restDayNote || null;

    // 6. Centralized Consistency Score Calculation (Section 8 Formula)
    // Habit adherence: 35%, Task completion: 30%, Focus target achievement: 20%, Goal work completion: 15%
    let consistencyScore = 0;
    let habitScore = 0;
    let taskScore = 0;
    let focusScore = 0;
    let goalWorkScore = 0;
    const plannedFocusMinutes = 180; // Standard 3-hour baseline daily focus target

    if (isHolidayOrRestDay) {
      consistencyScore = 85.0; // Rest days do not penalize consistency
      habitScore = 85;
      taskScore = 85;
      focusScore = 85;
      goalWorkScore = 85;
    } else {
      let weightSum = 0;
      let weightedTotal = 0;

      // Habit adherence (weight: 0.35)
      if (scheduledHabits > 0) {
        habitScore = Math.min(100, Math.round(habitAdherenceRate * 100));
        weightedTotal += habitScore * 0.35;
        weightSum += 0.35;
      }

      // Task completion (weight: 0.30)
      if (plannedTasks > 0) {
        taskScore = Math.min(100, Math.round(taskCompletionRate * 100));
        weightedTotal += taskScore * 0.30;
        weightSum += 0.30;
      }

      // Focus target achievement (weight: 0.20)
      focusScore = Math.min(100, Math.round((totalWorkMinutes / plannedFocusMinutes) * 100));
      weightedTotal += focusScore * 0.20;
      weightSum += 0.20;

      // Goal work completion (weight: 0.15)
      const goalNorm = Math.min(100, Math.round(((goalWorkMinutes / 60) * 50) + (goalProgressDelta * 20)));
      goalWorkScore = goalNorm;
      weightedTotal += goalWorkScore * 0.15;
      weightSum += 0.15;

      // Renormalize available weights so missing targets don't artificially reduce scores
      consistencyScore = weightSum > 0
        ? Number(Math.min(100, weightedTotal / weightSum).toFixed(1))
        : 75.0;
    }

    const updated = await DailyAnalytics.findOneAndUpdate(
      { user: userId, date: dateStr },
      {
        plannedTasks,
        completedTasks,
        goalRelevantCompletedTasks: goalRelevantCompleted,
        taskCompletionRate,
        scheduledHabits,
        completedHabits,
        habitAdherenceRate,
        completedHabitNames,
        totalWorkMinutes,
        goalWorkMinutes,
        focusSessionCount,
        totalScreenMinutes,
        distractingScreenMinutes,
        productiveScreenMinutes,
        goalProgressDelta,
        milestonesCompletedCount,
        consistencyScore,
        scoreComponentBreakdown: {
          habitScore,
          taskScore,
          focusScore,
          goalWorkScore
        },
        plannedFocusMinutes,
        scoreConfigVersion: '3.0',
        isHolidayOrRestDay,
        restDayNote
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return updated;
  } catch (err) {
    console.error(`Error syncing daily analytics for ${dateStr}:`, err);
    return null;
  }
};
