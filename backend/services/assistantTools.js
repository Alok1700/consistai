import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import GoalMilestone from '../models/GoalMilestone.js';
import GoalModule from '../models/GoalModule.js';
import Habit from '../models/Habit.js';
import HabitCheckIn from '../models/HabitCheckIn.js';
import WorkSession from '../models/WorkSession.js';
import Reminder from '../models/Reminder.js';
import AssistantMemory from '../models/AssistantMemory.js';
import ActivityEvent from '../models/ActivityEvent.js';
import DailyJournal from '../models/DailyJournal.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import AssistantToolExecution from '../models/AssistantToolExecution.js';
import { goalProgressService } from './goalProgressService.js';
import { pacingService } from './pacingService.js';
import { syncDailyAnalytics } from './dailyAnalyticsAggregator.js';

export const executeAssistantTool = async ({
  userId,
  conversationId,
  toolName,
  args = {},
  idempotencyKey = null
}) => {
  // Check idempotency if key provided
  if (idempotencyKey) {
    const existing = await AssistantToolExecution.findOne({ user: userId, idempotencyKey });
    if (existing && existing.executionStatus === 'success') {
      return { success: true, isIdempotentReplay: true, result: existing.sanitizedResult };
    }
  }

  let result = null;
  let errorMsg = null;

  try {
    switch (toolName) {
      // ==========================================
      // 1. TASK MANAGEMENT TOOLS
      // ==========================================
      case 'create_task': {
        const { title, description, dueDate, priority = 'medium', taskType = 'daily', estimatedMinutes = 45, goalId } = args;
        if (!title) throw new Error('Task title is required');

        const task = await Task.create({
          user: userId,
          title: title.trim(),
          description: description?.trim() || '',
          dueDate: dueDate ? new Date(dueDate) : new Date(),
          priority,
          taskType,
          estimatedMinutes: Number(estimatedMinutes) || 45,
          goal: goalId || null,
          isGoalRelevant: Boolean(goalId)
        });

        if (goalId) {
          await Goal.findByIdAndUpdate(goalId, { $addToSet: { linkedTasks: task._id } });
        }

        // Schedule pre-task reminder if due date is in future
        if (task.dueDate && new Date(task.dueDate) > new Date()) {
          const preTaskTime = new Date(new Date(task.dueDate).getTime() - 15 * 60000);
          await Reminder.create({
            user: userId,
            taskId: task._id,
            reminderType: 'before_task',
            scheduledAt: preTaskTime,
            message: `Upcoming task in 15 minutes: "${task.title}"`
          });
        }

        await ActivityEvent.create({
          user: userId,
          entityType: 'task',
          entityId: task._id,
          action: 'created',
          metadata: { title: task.title, priority: task.priority }
        });

        const dateStr = new Date(task.dueDate).toISOString().slice(0, 10);
        await syncDailyAnalytics(userId, dateStr);

        result = {
          taskId: task._id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          cadence: task.taskType,
          message: `Task "${task.title}" created successfully for ${new Date(task.dueDate).toLocaleDateString()}.`
        };
        break;
      }

      case 'create_multiple_tasks': {
        const { tasks = [] } = args;
        if (!Array.isArray(tasks) || tasks.length === 0) throw new Error('Tasks array is required');

        const created = [];
        for (const t of tasks) {
          if (!t.title) continue;
          const task = await Task.create({
            user: userId,
            title: t.title.trim(),
            description: t.description?.trim() || '',
            dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
            priority: t.priority || 'medium',
            taskType: t.taskType || 'daily',
            estimatedMinutes: Number(t.estimatedMinutes) || 45,
            goal: t.goalId || null,
            isGoalRelevant: Boolean(t.goalId)
          });
          created.push({ id: task._id, title: task.title, dueDate: task.dueDate });
        }

        result = {
          count: created.length,
          tasks: created,
          message: `Created ${created.length} tasks successfully.`
        };
        break;
      }

      case 'get_today_tasks': {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const tasks = await Task.find({
          user: userId,
          $or: [
            { dueDate: { $gte: startOfDay, $lte: endOfDay } },
            { createdAt: { $gte: startOfDay, $lte: endOfDay } },
            { taskType: 'daily' }
          ]
        }).sort({ status: 1, priority: -1, createdAt: -1 });

        result = {
          total: tasks.length,
          pending: tasks.filter(t => t.status !== 'completed').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          tasks: tasks.map(t => ({
            id: t._id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            estimatedMinutes: t.estimatedMinutes
          }))
        };
        break;
      }

      case 'get_tasks_by_date': {
        const { date } = args;
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

        const tasks = await Task.find({
          user: userId,
          dueDate: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ status: 1, priority: -1 });

        result = {
          date: targetDate.toISOString().slice(0, 10),
          total: tasks.length,
          tasks: tasks.map(t => ({ id: t._id, title: t.title, status: t.status, priority: t.priority }))
        };
        break;
      }

      case 'get_pending_tasks': {
        const tasks = await Task.find({
          user: userId,
          status: { $ne: 'completed' }
        }).sort({ dueDate: 1, priority: -1 }).limit(20);

        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({
            id: t._id,
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority
          }))
        };
        break;
      }

      case 'get_overdue_tasks': {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        const tasks = await Task.find({
          user: userId,
          dueDate: { $lt: startOfDay },
          status: { $ne: 'completed' }
        }).sort({ dueDate: 1 });

        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({
            id: t._id,
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority
          }))
        };
        break;
      }

      case 'search_tasks': {
        const { query } = args;
        const tasks = await Task.find({
          user: userId,
          title: { $regex: query, $options: 'i' }
        }).limit(10);

        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({ id: t._id, title: t.title, status: t.status, dueDate: t.dueDate }))
        };
        break;
      }

      case 'complete_task': {
        const { taskId, title } = args;
        let query = { user: userId };
        if (taskId) query._id = taskId;
        else if (title) query.title = { $regex: title.trim(), $options: 'i' };
        else throw new Error('taskId or title required');

        const task = await Task.findOne(query);
        if (!task) throw new Error('Task not found');

        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();

        // Cancel pending reminders for this completed task
        await Reminder.updateMany(
          { user: userId, taskId: task._id, status: 'scheduled' },
          { status: 'dismissed' }
        );

        await ActivityEvent.create({
          user: userId,
          entityType: 'task',
          entityId: task._id,
          action: 'completed',
          metadata: { title: task.title }
        });

        const dateStr = new Date().toISOString().slice(0, 10);
        await syncDailyAnalytics(userId, dateStr);

        result = {
          taskId: task._id,
          title: task.title,
          status: 'completed',
          message: `Task "${task.title}" has been marked complete.`
        };
        break;
      }

      case 'reopen_task': {
        const { taskId } = args;
        const task = await Task.findOneAndUpdate(
          { _id: taskId, user: userId },
          { status: 'pending', completedAt: null },
          { new: true }
        );
        if (!task) throw new Error('Task not found');
        result = { taskId: task._id, title: task.title, status: 'pending' };
        break;
      }

      case 'update_task': {
        const { taskId, title, priority, estimatedMinutes } = args;
        const updates = {};
        if (title) updates.title = title.trim();
        if (priority) updates.priority = priority;
        if (estimatedMinutes) updates.estimatedMinutes = Number(estimatedMinutes);

        const task = await Task.findOneAndUpdate({ _id: taskId, user: userId }, updates, { new: true });
        if (!task) throw new Error('Task not found');
        result = { taskId: task._id, title: task.title, priority: task.priority };
        break;
      }

      case 'reschedule_task': {
        const { taskId, newDueDate, reason } = args;
        const task = await Task.findOne({ _id: taskId, user: userId });
        if (!task) throw new Error('Task not found');

        task.dueDate = new Date(newDueDate);
        await task.save();

        // Update active reminders
        await Reminder.updateMany(
          { user: userId, taskId: task._id, status: 'scheduled' },
          { scheduledAt: new Date(new Date(task.dueDate).getTime() - 15 * 60000) }
        );

        await ActivityEvent.create({
          user: userId,
          entityType: 'task',
          entityId: task._id,
          action: 'rescheduled',
          metadata: { title: task.title, newDueDate, reason: reason || 'user requested' }
        });

        result = {
          taskId: task._id,
          title: task.title,
          newDueDate: task.dueDate,
          message: `Rescheduled "${task.title}" to ${new Date(task.dueDate).toLocaleDateString()}.`
        };
        break;
      }

      case 'skip_task': {
        const { taskId, reason } = args;
        const task = await Task.findOneAndUpdate(
          { _id: taskId, user: userId },
          { status: 'cancelled' },
          { new: true }
        );
        if (!task) throw new Error('Task not found');

        await ActivityEvent.create({
          user: userId,
          entityType: 'task',
          entityId: task._id,
          action: 'skipped',
          metadata: { title: task.title, reason: reason || 'Not completed' }
        });

        result = { taskId: task._id, title: task.title, status: 'cancelled' };
        break;
      }

      case 'delete_task': {
        const { taskId } = args;
        const task = await Task.findOneAndDelete({ _id: taskId, user: userId });
        if (!task) throw new Error('Task not found');
        await Reminder.deleteMany({ taskId: task._id, user: userId });
        result = { taskId: task._id, message: `Deleted task "${task.title}".` };
        break;
      }

      // ==========================================
      // 2. GOAL & MODULE MANAGEMENT TOOLS
      // ==========================================
      case 'create_goal': {
        const { title, description, category, targetDate, priority = 'high', progressType = 'milestone_based' } = args;
        if (!title || !title.trim()) throw new Error('Goal title is required');

        const validGoalCategories = [
          'DSA & Coding',
          'Web Development',
          'System Design',
          'Academic Coursework',
          'Research / Minor Project',
          'Competitive Exam',
          'Other'
        ];

        let sanitizedCategory = 'DSA & Coding';
        const candidate = `${category || ''} ${title}`.toLowerCase();
        if (category) {
          const matched = validGoalCategories.find(c => c.toLowerCase() === category.trim().toLowerCase());
          if (matched) {
            sanitizedCategory = matched;
          } else if (/web|frontend|backend|fullstack|react|node|javascript/i.test(candidate)) {
            sanitizedCategory = 'Web Development';
          } else if (/system design|distributed|architecture/i.test(candidate)) {
            sanitizedCategory = 'System Design';
          } else if (/academic|course|college|semester/i.test(candidate)) {
            sanitizedCategory = 'Academic Coursework';
          } else if (/research|minor project|project/i.test(candidate)) {
            sanitizedCategory = 'Research / Minor Project';
          } else if (/exam|gate|cat|upsc|gre/i.test(candidate)) {
            sanitizedCategory = 'Competitive Exam';
          } else if (/dsa|code|coding|leetcode|algo/i.test(candidate)) {
            sanitizedCategory = 'DSA & Coding';
          } else {
            sanitizedCategory = 'Other';
          }
        } else {
          if (/web|frontend|backend|fullstack|react|node|javascript/i.test(candidate)) sanitizedCategory = 'Web Development';
          else if (/system design|distributed|architecture/i.test(candidate)) sanitizedCategory = 'System Design';
          else if (/academic|course|college|semester/i.test(candidate)) sanitizedCategory = 'Academic Coursework';
          else if (/research|minor project|project/i.test(candidate)) sanitizedCategory = 'Research / Minor Project';
          else if (/exam|gate|cat|upsc|gre/i.test(candidate)) sanitizedCategory = 'Competitive Exam';
          else if (/dsa|code|coding|leetcode|algo/i.test(candidate)) sanitizedCategory = 'DSA & Coding';
          else sanitizedCategory = 'Other';
        }

        let parsedTargetDate = targetDate ? new Date(targetDate) : null;
        if (!parsedTargetDate || isNaN(parsedTargetDate.getTime())) {
          parsedTargetDate = new Date(Date.now() + 90 * 86400000);
        }

        const goal = await Goal.create({
          user: userId,
          title: title.trim(),
          description: description?.trim() || '',
          category: sanitizedCategory,
          progressType,
          priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'high',
          startDate: new Date(),
          targetDate: parsedTargetDate,
          status: 'active'
        });

        await ActivityEvent.create({
          user: userId,
          entityType: 'goal',
          entityId: goal._id,
          action: 'created',
          metadata: { title: goal.title, category: goal.category }
        }).catch(() => {});

        result = {
          goalId: goal._id,
          title: goal.title,
          category: goal.category,
          targetDate: goal.targetDate
        };
        break;
      }

      case 'get_active_goals': {
        const goals = await Goal.find({ user: userId, status: 'active' }).sort({ priority: -1, createdAt: -1 });
        result = {
          count: goals.length,
          goals: goals.map(g => ({
            id: g._id,
            title: g.title,
            progress: g.currentProgressPercentage,
            category: g.category,
            targetDate: g.targetDate
          }))
        };
        break;
      }

      case 'get_goal_progress': {
        const { goalId, title } = args;
        let query = { user: userId };
        if (goalId) query._id = goalId;
        else if (title) query.title = { $regex: title.trim(), $options: 'i' };
        else {
          const g = await Goal.findOne({ user: userId, status: 'active' });
          if (g) query._id = g._id;
        }

        const goal = await Goal.findOne(query);
        if (!goal) throw new Error('Goal not found');

        const milestones = await Milestone.find({ goal: goal._id, user: userId }).sort({ order: 1 });
        const pacing = pacingService.calculateGoalPacing(goal, milestones);

        result = {
          goalId: goal._id,
          title: goal.title,
          progress: goal.currentProgressPercentage,
          pacingStatus: pacing.pacingStatus,
          pacingGap: pacing.pacingGap,
          milestonesCount: milestones.length,
          completedMilestones: milestones.filter(m => m.isCompleted).length
        };
        break;
      }

      case 'create_milestone': {
        const { goalId, title, targetQuantity = 30, weight = 1 } = args;
        const goal = await Goal.findOne({ _id: goalId, user: userId });
        if (!goal) throw new Error('Goal not found');

        const milestone = await Milestone.create({
          goal: goal._id,
          user: userId,
          title: title.trim(),
          targetQuantity: Number(targetQuantity) || 30,
          weight: Number(weight) || 1
        });

        result = { milestoneId: milestone._id, title: milestone.title, totalModules: milestone.targetQuantity };
        break;
      }

      case 'complete_module': {
        const { milestoneId, moduleIndex = 1, moduleTitle } = args;
        // Fetch milestone
        const milestone = await Milestone.findOne({ _id: milestoneId, user: userId });
        if (!milestone) throw new Error('Milestone not found');

        milestone.achievedQuantity = Math.min(milestone.targetQuantity, (milestone.achievedQuantity || 0) + 1);
        if (milestone.achievedQuantity >= milestone.targetQuantity) {
          milestone.isCompleted = true;
          milestone.status = 'completed';
        }
        await milestone.save();

        // Recalculate goal progress
        const allMilestones = await Milestone.find({ goal: milestone.goal, user: userId });
        const goal = await Goal.findOne({ _id: milestone.goal, user: userId });
        if (goal) {
          const newPct = goalProgressService.calculateProgress(goal, allMilestones);
          goal.currentProgressPercentage = newPct;
          await goal.save();
        }

        result = {
          milestoneId: milestone._id,
          title: milestone.title,
          achieved: milestone.achievedQuantity,
          total: milestone.targetQuantity,
          goalProgress: goal?.currentProgressPercentage,
          message: `Module marked complete in "${milestone.title}" (${milestone.achievedQuantity}/${milestone.targetQuantity}).`
        };
        break;
      }

      case 'get_next_module': {
        const { goalId } = args;
        const activeGoal = goalId ? await Goal.findOne({ _id: goalId, user: userId }) : await Goal.findOne({ user: userId, status: 'active' });
        if (!activeGoal) throw new Error('No active goal found');

        const nextMilestone = await Milestone.findOne({
          goal: activeGoal._id,
          user: userId,
          isCompleted: false
        }).sort({ order: 1 });

        result = {
          goalTitle: activeGoal.title,
          nextMilestone: nextMilestone ? {
            id: nextMilestone._id,
            title: nextMilestone.title,
            progress: `${nextMilestone.achievedQuantity || 0}/${nextMilestone.targetQuantity} completed`
          } : null,
          message: nextMilestone ? `Next focus: "${nextMilestone.title}" (${nextMilestone.achievedQuantity || 0}/${nextMilestone.targetQuantity} modules done).` : 'All milestones completed!'
        };
        break;
      }

      // ==========================================
      // 3. HABIT MANAGEMENT TOOLS
      // ==========================================
      case 'create_habit': {
        const {
          title,
          description,
          category,
          frequency = 'daily',
          daysOfWeek,
          timeOfDay = 'anytime'
        } = args;
        if (!title || !title.trim()) throw new Error('Habit title is required');

        const validHabitCategories = [
          'DSA & Coding',
          'Technical Reading',
          'Course Study',
          'Physical Exercise',
          'Review & Reflection',
          'Other'
        ];

        let sanitizedCategory = 'DSA & Coding';
        const candidate = `${category || ''} ${title}`.toLowerCase();
        if (category) {
          const matched = validHabitCategories.find(c => c.toLowerCase() === category.trim().toLowerCase());
          if (matched) {
            sanitizedCategory = matched;
          } else if (/read|book|paper|article/i.test(candidate)) {
            sanitizedCategory = 'Technical Reading';
          } else if (/exercise|gym|workout|water|walk|run|health|fitness/i.test(candidate)) {
            sanitizedCategory = 'Physical Exercise';
          } else if (/review|reflect|journal|diary/i.test(candidate)) {
            sanitizedCategory = 'Review & Reflection';
          } else if (/study|course|lecture|class|learn/i.test(candidate)) {
            sanitizedCategory = 'Course Study';
          } else if (/code|coding|dsa|leetcode|debug/i.test(candidate)) {
            sanitizedCategory = 'DSA & Coding';
          } else {
            sanitizedCategory = 'Other';
          }
        } else {
          if (/read|book|paper|article/i.test(candidate)) sanitizedCategory = 'Technical Reading';
          else if (/exercise|gym|workout|water|walk|run|health|fitness/i.test(candidate)) sanitizedCategory = 'Physical Exercise';
          else if (/review|reflect|journal|diary/i.test(candidate)) sanitizedCategory = 'Review & Reflection';
          else if (/study|course|lecture|class|learn/i.test(candidate)) sanitizedCategory = 'Course Study';
          else if (/code|coding|dsa|leetcode|debug/i.test(candidate)) sanitizedCategory = 'DSA & Coding';
          else sanitizedCategory = 'Other';
        }

        let resolvedDays = Array.isArray(daysOfWeek) && daysOfWeek.length > 0
          ? daysOfWeek
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const habit = await Habit.create({
          user: userId,
          title: title.trim(),
          description: description?.trim() || '',
          category: sanitizedCategory,
          frequency,
          daysOfWeek: resolvedDays,
          timeOfDay,
          targetDaysPerWeek: resolvedDays.length,
          active: true
        });

        await ActivityEvent.create({
          user: userId,
          entityType: 'habit',
          entityId: habit._id,
          action: 'created',
          metadata: { title: habit.title, category: habit.category }
        }).catch(() => {});

        try {
          const todayStr = new Date().toISOString().slice(0, 10);
          await syncDailyAnalytics(userId, todayStr);
        } catch (e) {}

        result = {
          habitId: habit._id,
          title: habit.title,
          category: habit.category,
          frequency: habit.frequency
        };
        break;
      }

      case 'get_today_habits': {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[new Date().getDay()];
        const todayStr = new Date().toISOString().slice(0, 10);

        const habits = await Habit.find({ user: userId, active: true });
        const checkIns = await HabitCheckIn.find({ user: userId, date: todayStr, completed: true });
        const checkedHabitIds = new Set(checkIns.map(c => c.habit?.toString()));

        result = {
          total: habits.length,
          habits: habits.map(h => ({
            id: h._id,
            title: h.title,
            isCompletedToday: checkedHabitIds.has(h._id.toString()),
            currentStreak: h.currentStreak || 0
          }))
        };
        break;
      }

      case 'log_habit': {
        const { habitId, title } = args;
        let query = { user: userId, active: true };
        if (habitId) query._id = habitId;
        else if (title) query.title = { $regex: title.trim(), $options: 'i' };
        else throw new Error('habitId or title required');

        const habit = await Habit.findOne(query);
        if (!habit) throw new Error('Habit not found');

        const todayStr = new Date().toISOString().slice(0, 10);
        await HabitCheckIn.findOneAndUpdate(
          { user: userId, habit: habit._id, date: todayStr },
          { completed: true },
          { upsert: true, new: true }
        );

        habit.currentStreak = (habit.currentStreak || 0) + 1;
        if (habit.currentStreak > (habit.longestStreak || 0)) habit.longestStreak = habit.currentStreak;
        await habit.save();

        await syncDailyAnalytics(userId, todayStr);

        result = {
          habitId: habit._id,
          title: habit.title,
          streak: habit.currentStreak,
          message: `Checked in for habit "${habit.title}"! Current streak: ${habit.currentStreak} days.`
        };
        break;
      }

      // ==========================================
      // 4. FOCUS & TIMER TOOLS
      // ==========================================
      case 'start_focus_session': {
        const { durationMinutes = 25, goalId, taskId, notes } = args;
        const session = await WorkSession.create({
          user: userId,
          date: new Date().toISOString().slice(0, 10),
          startTime: new Date(),
          durationMinutes: Number(durationMinutes) || 25,
          goal: goalId || null,
          linkedTask: taskId || null,
          notes: notes || 'Started via Voice Assistant'
        });

        result = {
          sessionId: session._id,
          durationMinutes: session.durationMinutes,
          message: `Focus session of ${session.durationMinutes} minutes started.`
        };
        break;
      }

      case 'log_manual_work_session': {
        const { durationMinutes, goalId, notes, date } = args;
        const dateStr = date || new Date().toISOString().slice(0, 10);

        const session = await WorkSession.create({
          user: userId,
          date: dateStr,
          durationMinutes: Number(durationMinutes) || 45,
          goal: goalId || null,
          notes: notes || 'Manual voice log'
        });

        await syncDailyAnalytics(userId, dateStr);

        result = {
          sessionId: session._id,
          durationMinutes: session.durationMinutes,
          message: `Logged ${session.durationMinutes} minutes of focused work for ${dateStr}.`
        };
        break;
      }

      // ==========================================
      // 5. REMINDER ENGINE TOOLS
      // ==========================================
      case 'create_reminder': {
        const { message, scheduledAt, taskId, reminderType = 'custom' } = args;
        if (!message) throw new Error('Reminder message is required');

        const reminder = await Reminder.create({
          user: userId,
          message: message.trim(),
          scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 60 * 60000),
          taskId: taskId || null,
          reminderType
        });

        result = {
          reminderId: reminder._id,
          message: reminder.message,
          scheduledAt: reminder.scheduledAt,
          textResponse: `Reminder set: "${reminder.message}" for ${new Date(reminder.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        };
        break;
      }

      case 'get_active_reminders': {
        const reminders = await Reminder.find({
          user: userId,
          status: 'scheduled'
        }).sort({ scheduledAt: 1 }).limit(10);

        result = {
          count: reminders.length,
          reminders: reminders.map(r => ({
            id: r._id,
            message: r.message,
            scheduledAt: r.scheduledAt
          }))
        };
        break;
      }

      case 'snooze_reminder': {
        const { reminderId, minutes = 15 } = args;
        const snoozedUntil = new Date(Date.now() + minutes * 60000);
        const reminder = await Reminder.findOneAndUpdate(
          { _id: reminderId, user: userId },
          { status: 'snoozed', snoozedUntil, scheduledAt: snoozedUntil },
          { new: true }
        );
        result = { reminderId, snoozedUntil, message: `Snoozed for ${minutes} minutes.` };
        break;
      }

      case 'cancel_reminder': {
        const { reminderId } = args;
        await Reminder.findOneAndUpdate({ _id: reminderId, user: userId }, { status: 'cancelled' });
        result = { reminderId, message: 'Reminder cancelled.' };
        break;
      }

      // ==========================================
      // 6. PERSISTENT MEMORY & JOURNAL TOOLS
      // ==========================================
      case 'save_memory': {
        const { content, category = 'fact', importance = 'medium' } = args;
        if (!content) throw new Error('Memory content required');

        const memory = await AssistantMemory.create({
          user: userId,
          content: content.trim(),
          category,
          importance
        });

        result = {
          memoryId: memory._id,
          content: memory.content,
          message: `Saved to memory: "${memory.content}"`
        };
        break;
      }

      case 'search_memory': {
        const { query, category } = args;
        const q = { user: userId };
        if (category) q.category = category;
        if (query) q.content = { $regex: query.trim(), $options: 'i' };

        const memories = await AssistantMemory.find(q).sort({ createdAt: -1 }).limit(10);
        result = {
          count: memories.length,
          memories: memories.map(m => ({ id: m._id, content: m.content, category: m.category }))
        };
        break;
      }

      case 'save_daily_note': {
        const { note, date } = args;
        const localDate = date || new Date().toISOString().slice(0, 10);
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const journal = await DailyJournal.findOneAndUpdate(
          { user: userId, localDate },
          {
            $push: {
              entries: {
                time: timeNow,
                activity: note.trim(),
                entryType: 'self_reported',
                isConfirmed: true
              }
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        result = { localDate, entry: note, message: `Journal entry saved for ${localDate}.` };
        break;
      }

      // ==========================================
      // 7. ANALYTICS & DAILY BRIEFINGS
      // ==========================================
      case 'get_daily_summary': {
        const todayStr = new Date().toISOString().slice(0, 10);
        const record = await DailyAnalytics.findOne({ user: userId, date: todayStr });
        const tasks = await Task.find({ user: userId, status: 'completed', completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } });

        result = {
          date: todayStr,
          consistencyScore: record?.consistencyScore || 85,
          focusMinutes: record?.totalWorkMinutes || 0,
          completedTasksCount: tasks.length,
          distractingMinutes: record?.distractingScreenMinutes || 0,
          summaryText: `Today you logged ${record?.totalWorkMinutes || 0} minutes of focus, completed ${tasks.length} tasks, and earned an ${record?.consistencyScore || 85}% consistency score.`
        };
        break;
      }

      case 'generate_daily_plan': {
        const { availableHours = 3 } = args;
        const pendingTasks = await Task.find({ user: userId, status: { $ne: 'completed' } }).sort({ priority: -1 }).limit(5);
        const activeGoals = await Goal.find({ user: userId, status: 'active' }).limit(2);

        const plan = [];
        let allocatedMinutes = 0;
        const totalMinutes = availableHours * 60;

        for (const t of pendingTasks) {
          const taskMins = t.estimatedMinutes || 45;
          if (allocatedMinutes + taskMins <= totalMinutes) {
            plan.push({ time: `${taskMins}m`, activity: t.title, priority: t.priority });
            allocatedMinutes += taskMins;
          }
        }

        result = {
          availableHours,
          totalAllocatedMinutes: allocatedMinutes,
          schedule: plan,
          advice: allocatedMinutes < totalMinutes
            ? `Planned ${allocatedMinutes}m of work. You have ${totalMinutes - allocatedMinutes}m buffer remaining.`
            : `Schedule completely filled with ${plan.length} high priority tasks.`
        };
        break;
      }

      default:
        throw new Error(`Tool "${toolName}" not supported`);
    }

    // Save successful execution audit
    if (idempotencyKey) {
      await AssistantToolExecution.create({
        user: userId,
        conversationId,
        toolName,
        validatedArguments: args,
        idempotencyKey,
        executionStatus: 'success',
        sanitizedResult: result
      });
    }

    return { success: true, toolName, result };
  } catch (err) {
    errorMsg = err.message;
    if (idempotencyKey) {
      await AssistantToolExecution.create({
        user: userId,
        conversationId,
        toolName,
        validatedArguments: args,
        idempotencyKey,
        executionStatus: 'failed',
        errorMessage: errorMsg
      });
    }
    return { success: false, toolName, error: errorMsg };
  }
};
