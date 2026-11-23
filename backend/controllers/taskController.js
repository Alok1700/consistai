import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Reminder from '../models/Reminder.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      goal,
      linkedMilestone,
      priority,
      taskType,
      dueDate,
      estimatedMinutes,
      isGoalRelevant
    } = req.body;

    const task = await Task.create({
      user: req.user.id,
      title,
      description,
      goal: goal || null,
      linkedMilestone: linkedMilestone || null,
      priority: priority || 'medium',
      taskType: taskType || 'daily',
      dueDate: dueDate || new Date(),
      estimatedMinutes: Number(estimatedMinutes || 45),
      isGoalRelevant: Boolean(isGoalRelevant || goal)
    });

    if (goal) {
      await Goal.findByIdAndUpdate(goal, { $addToSet: { linkedTasks: task._id } });
    }

    const dateStr = new Date(task.dueDate).toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, dateStr);

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

export const getTasks = async (req, res, next) => {
  try {
    const { status, goal, date, isGoalRelevant, timeframe, taskType, sortBy, createdDate } = req.query;
    const query = { user: req.user.id };

    if (status) query.status = status;
    if (goal) query.goal = goal;
    if (isGoalRelevant !== undefined) query.isGoalRelevant = isGoalRelevant === 'true';

    // Exact taskType filter
    if (taskType && ['daily', 'weekly', 'monthly', 'yearly'].includes(taskType)) {
      query.taskType = taskType;
    }

    // Created Date filter (filter tasks by when they were created)
    if (createdDate) {
      const startOfDay = new Date(`${createdDate}T00:00:00.000Z`);
      const endOfDay = new Date(`${createdDate}T23:59:59.999Z`);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // Timeframe / Cadence filter (matches explicit taskType OR relevant due date interval)
    if (timeframe) {
      const now = new Date();
      if (timeframe === 'daily') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.$or = [
          { taskType: 'daily' },
          { dueDate: { $gte: startOfDay, $lte: endOfDay } }
        ];
      } else if (timeframe === 'weekly') {
        const dayOfWeek = now.getDay();
        const diffToMon = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMon);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        query.$or = [
          { taskType: 'weekly' },
          { dueDate: { $gte: startOfWeek, $lte: endOfWeek } }
        ];
      } else if (timeframe === 'monthly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.$or = [
          { taskType: 'monthly' },
          { dueDate: { $gte: startOfMonth, $lte: endOfMonth } }
        ];
      } else if (timeframe === 'yearly') {
        const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        query.$or = [
          { taskType: 'yearly' },
          { dueDate: { $gte: startOfYear, $lte: endOfYear } }
        ];
      }
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      query.$or = [
        { dueDate: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      ];
    }

    // Sort order: default to createdAt: -1 so newly created tasks appear at the top immediately
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'dueDate') {
      sortOptions = { dueDate: 1, priority: -1, createdAt: -1 };
    } else if (sortBy === 'priority') {
      sortOptions = { priority: -1, dueDate: 1, createdAt: -1 };
    } else if (sortBy === 'created_asc') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'created') {
      sortOptions = { createdAt: -1 };
    }

    const tasks = await Task.find(query)
      .populate('goal', 'title category')
      .populate('linkedMilestone', 'title progressPercentage')
      .sort(sortOptions);

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const goalRelevant = tasks.filter(t => t.isGoalRelevant).length;
    const goalRelevantCompleted = tasks.filter(t => t.isGoalRelevant && t.status === 'completed').length;

    // All user tasks counts by cadence
    const allUserTasks = await Task.find({ user: req.user.id });
    const dailyCount = allUserTasks.filter(t => t.taskType === 'daily').length;
    const weeklyCount = allUserTasks.filter(t => t.taskType === 'weekly').length;
    const monthlyCount = allUserTasks.filter(t => t.taskType === 'monthly').length;
    const yearlyCount = allUserTasks.filter(t => t.taskType === 'yearly').length;

    res.json({
      success: true,
      count: total,
      stats: {
        total,
        completed,
        pending: total - completed,
        goalRelevant,
        goalRelevantCompleted,
        dailyCount,
        weeklyCount,
        monthlyCount,
        yearlyCount,
        completionRate: total > 0 ? Number((completed / total).toFixed(2)) : 0
      },
      tasks
    });
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Synchronize scheduled reminders on task status or due date update
    if (task.status === 'completed' || task.status === 'cancelled') {
      await Reminder.updateMany({ taskId: task._id, status: 'scheduled' }, { status: 'dismissed' });
    } else if (req.body.dueDate) {
      await Reminder.updateMany(
        { taskId: task._id, status: 'scheduled' },
        { scheduledAt: new Date(new Date(req.body.dueDate).getTime() - 15 * 60000) }
      );
    }

    const dateStr = new Date(task.dueDate).toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, dateStr);

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

export const toggleTaskComplete = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const isNowCompleted = task.status !== 'completed';
    task.status = isNowCompleted ? 'completed' : 'pending';
    task.completedAt = isNowCompleted ? new Date() : null;

    if (req.body.actualMinutes !== undefined) {
      task.actualMinutes = Number(req.body.actualMinutes);
    } else if (isNowCompleted && task.actualMinutes === 0) {
      task.actualMinutes = task.estimatedMinutes;
    }

    // Check on-time completion
    if (isNowCompleted) {
      task.onTime = new Date() <= new Date(task.dueDate);
      // Automatically dismiss scheduled reminders on completion
      await Reminder.updateMany({ taskId: task._id, status: 'scheduled' }, { status: 'dismissed' });
    }

    await task.save();

    const dateStr = new Date(task.dueDate).toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, dateStr);

    let newAchievements = [];
    if (isNowCompleted && task.goal) {
      newAchievements = await checkAndAwardAchievements({
        userId: req.user.id,
        goalId: task.goal
      });
    }

    res.json({ success: true, task, newAchievements });
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (task.goal) {
      await Goal.findByIdAndUpdate(task.goal, { $pull: { linkedTasks: task._id } });
    }

    // Remove pending reminders
    await Reminder.deleteMany({ taskId: task._id });

    const dateStr = new Date(task.dueDate).toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, dateStr);

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
