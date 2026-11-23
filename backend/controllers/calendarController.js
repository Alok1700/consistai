import DailyAnalytics from '../models/DailyAnalytics.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import HabitCheckIn from '../models/HabitCheckIn.js';
import WorkSession from '../models/WorkSession.js';
import ScreenTimeRecord from '../models/ScreenTimeRecord.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

export const getMonthCalendar = async (req, res, next) => {
  try {
    const { year, month, goalId } = req.query;
    const now = new Date();
    const currentYear = year ? parseInt(year) : now.getFullYear();
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1;

    // Pad month
    const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
    const startPrefix = `${currentYear}-${monthStr}-01`;

    // End date of the month
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
    const endPrefix = `${currentYear}-${monthStr}-${lastDayOfMonth < 10 ? '0' + lastDayOfMonth : lastDayOfMonth}`;

    const analytics = await DailyAnalytics.find({
      user: req.user.id,
      date: { $gte: startPrefix, $lte: endPrefix }
    }).sort({ date: 1 });

    // Optional: Goal-specific filtering
    const goalEventsMap = {};
    const goalTasksMap = {};
    if (goalId && goalId !== 'all') {
      const [goalEvents, goalTasks] = await Promise.all([
        GoalProgressEvent.find({
          user: req.user.id,
          goal: goalId,
          date: { $gte: startPrefix, $lte: endPrefix }
        }).populate('milestone', 'title'),
        Task.find({
          user: req.user.id,
          goal: goalId,
          dueDate: {
            $gte: new Date(`${startPrefix}T00:00:00.000Z`),
            $lte: new Date(`${endPrefix}T23:59:59.999Z`)
          }
        })
      ]);

      goalEvents.forEach(e => {
        if (!goalEventsMap[e.date]) {
          goalEventsMap[e.date] = {
            progressDelta: 0,
            milestonesCompletedCount: 0,
            events: []
          };
        }
        goalEventsMap[e.date].progressDelta += Number(e.progressDelta || 0);
        if (e.eventType === 'milestone_completed') {
          goalEventsMap[e.date].milestonesCompletedCount += 1;
        }
        goalEventsMap[e.date].events.push({
          id: e._id,
          eventType: e.eventType,
          progressDelta: e.progressDelta,
          milestoneTitle: e.milestone ? e.milestone.title : null
        });
      });

      goalTasks.forEach(t => {
        const dStr = t.dueDate ? t.dueDate.toISOString().slice(0, 10) : null;
        if (dStr) {
          if (!goalTasksMap[dStr]) {
            goalTasksMap[dStr] = { planned: 0, completed: 0 };
          }
          goalTasksMap[dStr].planned += 1;
          if (t.status === 'completed') {
            goalTasksMap[dStr].completed += 1;
          }
        }
      });
    }

    // Format map of date -> analytics record
    const dateMap = {};
    analytics.forEach(a => {
      const gSpecific = goalEventsMap[a.date];
      const tSpecific = goalTasksMap[a.date];
      const gDelta = (goalId && goalId !== 'all') ? (gSpecific ? Number(gSpecific.progressDelta.toFixed(1)) : 0) : a.goalProgressDelta;
      const mCount = (goalId && goalId !== 'all') ? (gSpecific ? gSpecific.milestonesCompletedCount : 0) : a.milestonesCompletedCount;

      dateMap[a.date] = {
        date: a.date,
        consistencyScore: a.consistencyScore,
        taskCompletionRate: a.taskCompletionRate,
        completedTasks: a.completedTasks,
        plannedTasks: a.plannedTasks,
        goalRelevantCompletedTasks: a.goalRelevantCompletedTasks || 0,
        habitAdherenceRate: a.habitAdherenceRate,
        completedHabits: a.completedHabits,
        scheduledHabits: a.scheduledHabits,
        completedHabitNames: a.completedHabitNames || [],
        totalWorkMinutes: a.totalWorkMinutes,
        goalWorkMinutes: a.goalWorkMinutes,
        distractingScreenMinutes: a.distractingScreenMinutes,
        productiveScreenMinutes: a.productiveScreenMinutes,
        goalProgressDelta: gDelta,
        milestonesCompletedCount: mCount,
        hasMeaningfulProgress: gDelta >= 1.0 || mCount > 0,
        hasHighConsistency: a.consistencyScore >= 75,
        isHolidayOrRestDay: a.isHolidayOrRestDay,
        restDayNote: a.restDayNote,
        goalSpecificEvents: gSpecific ? gSpecific.events : [],
        goalSpecificTasks: tSpecific || null
      };
    });

    // Also inject any goal events on days where DailyAnalytics doc wasn't created yet
    if (goalId && goalId !== 'all') {
      Object.keys(goalEventsMap).forEach(d => {
        if (!dateMap[d]) {
          const gSpecific = goalEventsMap[d];
          const tSpecific = goalTasksMap[d];
          dateMap[d] = {
            date: d,
            consistencyScore: 0,
            taskCompletionRate: tSpecific && tSpecific.planned > 0 ? tSpecific.completed / tSpecific.planned : 0,
            completedTasks: tSpecific ? tSpecific.completed : 0,
            plannedTasks: tSpecific ? tSpecific.planned : 0,
            goalRelevantCompletedTasks: tSpecific ? tSpecific.completed : 0,
            habitAdherenceRate: 0,
            completedHabits: 0,
            scheduledHabits: 0,
            completedHabitNames: [],
            totalWorkMinutes: 0,
            goalWorkMinutes: 0,
            distractingScreenMinutes: 0,
            productiveScreenMinutes: 0,
            goalProgressDelta: Number(gSpecific.progressDelta.toFixed(1)),
            milestonesCompletedCount: gSpecific.milestonesCompletedCount,
            hasMeaningfulProgress: gSpecific.progressDelta >= 1.0 || gSpecific.milestonesCompletedCount > 0,
            hasHighConsistency: false,
            isHolidayOrRestDay: false,
            restDayNote: null,
            goalSpecificEvents: gSpecific.events,
            goalSpecificTasks: tSpecific || null
          };
        }
      });
    }

    res.json({
      success: true,
      year: currentYear,
      month: currentMonth,
      daysInMonth: lastDayOfMonth,
      daysData: dateMap
    });
  } catch (err) {
    next(err);
  }
};

export const getDayDetail = async (req, res, next) => {
  try {
    const { date } = req.params;
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeekName = dayNames[new Date(`${date}T12:00:00Z`).getUTCDay()];

    const [analytics, tasks, checkIns, sessions, screenRecord, progressEvents, allActiveHabits] = await Promise.all([
      DailyAnalytics.findOne({ user: req.user.id, date }),
      Task.find({ user: req.user.id, dueDate: { $gte: startOfDay, $lte: endOfDay } }).populate('goal', 'title category'),
      HabitCheckIn.find({ user: req.user.id, date }).populate('habit', 'title category'),
      WorkSession.find({ user: req.user.id, date }).populate('goal', 'title category').populate('task', 'title'),
      ScreenTimeRecord.findOne({ user: req.user.id, date }),
      GoalProgressEvent.find({ user: req.user.id, date }).populate('goal', 'title category').populate('milestone', 'title'),
      Habit.find({ user: req.user.id, active: true }).populate('linkedGoals', 'title category')
    ]);

    // Format complete scheduled habits with check-in status
    const checkedInHabitIds = new Set(
      checkIns
        .filter(c => c.completed)
        .map(c => (c.habit?._id ? c.habit._id.toString() : c.habit?.toString()))
        .filter(Boolean)
    );

    const completedNamesSet = new Set((analytics?.completedHabitNames || []).map(n => n.toLowerCase().trim()));

    // Categorize habits into active scheduled, checked/done, and unchecked/pending
    const activeHabitsOnDay = [];
    const checkedHabitsOnDay = [];
    const uncheckedHabitsOnDay = [];
    const offDayHabitsOnDay = [];

    allActiveHabits.forEach(h => {
      const hTitleLower = h.title.toLowerCase().trim();
      const isScheduledToday = !h.daysOfWeek || h.daysOfWeek.length === 0 || h.daysOfWeek.includes(dayOfWeekName);
      const isChecked = checkedInHabitIds.has(h._id.toString()) ||
        completedNamesSet.has(hTitleLower) ||
        Array.from(completedNamesSet).some(cn => hTitleLower.includes(cn) || cn.includes(hTitleLower));

      const habitInfo = {
        _id: h._id,
        title: h.title,
        category: h.category,
        timeOfDay: h.timeOfDay || 'anytime',
        description: h.description,
        frequency: h.frequency,
        daysOfWeek: h.daysOfWeek || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        currentStreak: h.currentStreak || 0,
        longestStreak: h.longestStreak || 0,
        isCompleted: isChecked,
        isScheduledToday
      };

      if (isScheduledToday) {
        activeHabitsOnDay.push(habitInfo);
        if (isChecked) {
          checkedHabitsOnDay.push(habitInfo);
        } else {
          uncheckedHabitsOnDay.push(habitInfo);
        }
      } else {
        offDayHabitsOnDay.push(habitInfo);
        if (isChecked) {
          checkedHabitsOnDay.push({ ...habitInfo, isBonus: true });
        }
      }
    });

    const scheduledHabits = activeHabitsOnDay;

    // Build unified Master Agenda of all events/items that had to be done on this date
    const masterAgenda = [];

    // 1. Tasks
    tasks.forEach(t => {
      masterAgenda.push({
        id: t._id,
        kind: 'task',
        title: t.title,
        category: t.goal?.category || 'General Task',
        goalTitle: t.goal?.title || null,
        priority: t.priority,
        durationMinutes: t.actualMinutes || t.estimatedMinutes || 30,
        isCompleted: t.status === 'completed',
        statusLabel: t.status === 'completed' ? 'Completed' : 'Pending To-Do'
      });
    });

    // 2. Scheduled Habits
    scheduledHabits.forEach(h => {
      masterAgenda.push({
        id: h._id,
        kind: 'habit',
        title: h.title,
        category: h.category,
        timeOfDay: h.timeOfDay,
        description: h.description,
        isCompleted: h.isCompleted,
        statusLabel: h.isCompleted ? 'Checked In' : 'Routine Due'
      });
    });

    // 3. Goal Progress Events
    progressEvents.forEach(e => {
      masterAgenda.push({
        id: e._id,
        kind: 'goal_event',
        title: e.milestone?.title ? `Milestone: ${e.milestone.title}` : (e.goal?.title ? `Goal: ${e.goal.title}` : 'Goal Advancement'),
        category: e.goal?.category || 'Goal Progress',
        progressDelta: e.progressDelta,
        eventType: e.eventType,
        isCompleted: true,
        statusLabel: `+${e.progressDelta}% Progress Gained`
      });
    });

    res.json({
      success: true,
      date,
      dayOfWeek: dayOfWeekName,
      analytics: analytics || {
        date,
        consistencyScore: 0,
        taskCompletionRate: 0,
        habitAdherenceRate: 0,
        totalWorkMinutes: 0,
        goalProgressDelta: 0,
        isHolidayOrRestDay: false
      },
      tasks,
      checkIns,
      scheduledHabits,
      activeHabitsOnDay,
      checkedHabitsOnDay,
      uncheckedHabitsOnDay,
      offDayHabitsOnDay,
      masterAgenda,
      sessions,
      screenRecord,
      progressEvents
    });
  } catch (err) {
    next(err);
  }
};

export const markHolidayOrRestDay = async (req, res, next) => {
  try {
    const { date } = req.params;
    const { isHolidayOrRestDay, restDayNote } = req.body;

    const updated = await DailyAnalytics.findOneAndUpdate(
      { user: req.user.id, date },
      {
        isHolidayOrRestDay: Boolean(isHolidayOrRestDay),
        restDayNote: restDayNote || (isHolidayOrRestDay ? 'Scheduled Rest Day' : null)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate daily analytics consistency with the rest day status
    await syncDailyAnalytics(req.user.id, date);

    res.json({
      success: true,
      message: isHolidayOrRestDay ? 'Day marked as rest day / holiday.' : 'Rest day flag removed.',
      analytics: updated
    });
  } catch (err) {
    next(err);
  }
};
