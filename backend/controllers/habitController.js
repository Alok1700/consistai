import Habit from '../models/Habit.js';
import HabitCheckIn from '../models/HabitCheckIn.js';
import Goal from '../models/Goal.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

export const createHabit = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      frequency,
      daysOfWeek,
      targetDaysPerWeek,
      timeOfDay,
      linkedGoals
    } = req.body;

    // Resolve scheduled days of week
    let resolvedDays = daysOfWeek;
    if (!resolvedDays || !Array.isArray(resolvedDays) || resolvedDays.length === 0) {
      if (frequency === 'weekdays') {
        resolvedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      } else if (frequency === 'weekends') {
        resolvedDays = ['Sat', 'Sun'];
      } else {
        resolvedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      }
    }

    const habit = await Habit.create({
      user: req.user.id,
      title,
      description,
      category: category || 'DSA & Coding',
      frequency: frequency || 'daily',
      daysOfWeek: resolvedDays,
      timeOfDay: timeOfDay || 'anytime',
      targetDaysPerWeek: resolvedDays.length || Number(targetDaysPerWeek || 7),
      linkedGoals: linkedGoals || []
    });

    if (linkedGoals && linkedGoals.length > 0) {
      await Goal.updateMany(
        { _id: { $in: linkedGoals } },
        { $addToSet: { linkedHabits: habit._id } }
      );
    }

    // Resync today's analytics with updated habit schedule
    const todayStr = new Date().toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, todayStr);

    res.status(201).json({ success: true, habit });
  } catch (err) {
    next(err);
  }
};

export const updateHabit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      frequency,
      daysOfWeek,
      timeOfDay,
      targetDaysPerWeek,
      linkedGoals
    } = req.body;

    let habit = await Habit.findOne({ _id: id, user: req.user.id });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found.' });
    }

    if (title) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (category) habit.category = category;
    if (frequency) habit.frequency = frequency;
    if (timeOfDay) habit.timeOfDay = timeOfDay;

    if (daysOfWeek && Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
      habit.daysOfWeek = daysOfWeek;
      habit.targetDaysPerWeek = daysOfWeek.length;
    } else if (targetDaysPerWeek) {
      habit.targetDaysPerWeek = Number(targetDaysPerWeek);
    }

    if (linkedGoals) habit.linkedGoals = linkedGoals;

    await habit.save();

    const todayStr = new Date().toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, todayStr);

    res.json({ success: true, habit });
  } catch (err) {
    next(err);
  }
};

export const getHabits = async (req, res, next) => {
  try {
    const todayStr = req.query.date || new Date().toISOString().slice(0, 10);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDayName = dayNames[new Date(`${todayStr}T12:00:00Z`).getUTCDay()];

    // Resolve month date range
    let monthQuery = req.query.month; // e.g. "2026-11"
    if (!monthQuery || !/^\d{4}-\d{2}$/.test(monthQuery)) {
      monthQuery = todayStr.slice(0, 7);
    }

    const [yearNum, monthNum] = monthQuery.split('-').map(Number);
    const lastDayOfMonth = new Date(yearNum, monthNum, 0).getDate();
    const monthStartStr = `${monthQuery}-01`;
    const monthEndStr = `${monthQuery}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const startDate = req.query.startDate || monthStartStr;
    const endDate = req.query.endDate || monthEndStr;

    const habits = await Habit.find({ user: req.user.id, active: true })
      .populate('linkedGoals', 'title category')
      .sort({ createdAt: -1 });

    // Fetch today's check-ins
    const todayCheckIns = await HabitCheckIn.find({
      user: req.user.id,
      date: todayStr
    });
    const checkedInTodaySet = new Set(todayCheckIns.filter(c => c.completed).map(c => c.habit.toString()));

    // Fetch range check-ins (full month)
    const rangeCheckIns = await HabitCheckIn.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate },
      completed: true
    });

    // Map range check-ins by habit
    const checkInsByHabit = {};
    rangeCheckIns.forEach(c => {
      const hId = c.habit.toString();
      if (!checkInsByHabit[hId]) checkInsByHabit[hId] = {};
      checkInsByHabit[hId][c.date] = true;
    });

    // Also fetch last 7 days check-ins for weekly adherence
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().slice(0, 10);

    const weeklyCheckIns = await HabitCheckIn.find({
      user: req.user.id,
      date: { $gte: sevenDaysStr, $lte: todayStr },
      completed: true
    });

    // Compute day counts in month
    const habitDayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };

    const habitsWithStatus = habits.map(h => {
      const hId = h._id.toString();
      const isCheckedToday = checkedInTodaySet.has(hId);
      const scheduledDays = (h.daysOfWeek && h.daysOfWeek.length > 0)
        ? h.daysOfWeek
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      const isScheduledToday = scheduledDays.includes(currentDayName);
      const targetDays = Math.max(1, scheduledDays.length);
      const pastWeekCount = weeklyCheckIns.filter(c => c.habit.toString() === hId).length;
      const weeklyAdherence = Number((pastWeekCount / Math.min(7, targetDays)).toFixed(2));

      const habitHistory = checkInsByHabit[hId] || {};
      const monthlyCompletions = Object.keys(habitHistory).length;

      // Count scheduled days in this month
      let monthlyScheduledCount = 0;
      for (let day = 1; day <= lastDayOfMonth; day++) {
        const dObj = new Date(yearNum, monthNum - 1, day);
        const dName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
        if (scheduledDays.includes(dName)) {
          monthlyScheduledCount++;
        }
      }

      const monthlyAdherence = monthlyScheduledCount > 0
        ? Number((monthlyCompletions / monthlyScheduledCount).toFixed(2))
        : 1.0;

      return {
        ...h.toObject(),
        isCheckedToday,
        isScheduledToday,
        daysOfWeek: scheduledDays,
        timeOfDay: h.timeOfDay || 'anytime',
        weeklyCompletions: pastWeekCount,
        weeklyAdherenceRate: Math.min(1.0, weeklyAdherence),
        completionHistory: habitHistory,
        monthlyCompletions,
        monthlyScheduledDays: monthlyScheduledCount,
        monthlyAdherenceRate: Math.min(1.0, monthlyAdherence)
      };
    });

    res.json({
      success: true,
      count: habitsWithStatus.length,
      todayDate: todayStr,
      currentDayOfWeek: currentDayName,
      month: monthQuery,
      startDate,
      endDate,
      daysInMonth: lastDayOfMonth,
      habits: habitsWithStatus
    });
  } catch (err) {
    next(err);
  }
};

export const toggleHabitCheckIn = async (req, res, next) => {
  try {
    const { habitId } = req.params;
    const { date, notes } = req.body;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const habit = await Habit.findOne({ _id: habitId, user: req.user.id });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found.' });
    }

    let checkIn = await HabitCheckIn.findOne({
      user: req.user.id,
      habit: habit._id,
      date: targetDate
    });

    let isCompleted = true;
    if (checkIn) {
      checkIn.completed = !checkIn.completed;
      if (notes) checkIn.notes = notes;
      await checkIn.save();
      isCompleted = checkIn.completed;
    } else {
      checkIn = await HabitCheckIn.create({
        user: req.user.id,
        habit: habit._id,
        date: targetDate,
        completed: true,
        notes: notes || ''
      });
      isCompleted = true;
    }

    // Update habit streak count
    if (isCompleted) {
      habit.currentStreak = (habit.currentStreak || 0) + 1;
      if (habit.currentStreak > (habit.longestStreak || 0)) {
        habit.longestStreak = habit.currentStreak;
      }
    } else {
      habit.currentStreak = Math.max(0, (habit.currentStreak || 1) - 1);
    }
    await habit.save();

    await syncDailyAnalytics(req.user.id, targetDate);

    res.json({
      success: true,
      checkIn,
      isCompleted,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak
    });
  } catch (err) {
    next(err);
  }
};

export const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found.' });
    }

    await HabitCheckIn.deleteMany({ habit: habit._id });
    await Goal.updateMany({ linkedHabits: habit._id }, { $pull: { linkedHabits: habit._id } });

    res.json({ success: true, message: 'Habit removed successfully.' });
  } catch (err) {
    next(err);
  }
};
