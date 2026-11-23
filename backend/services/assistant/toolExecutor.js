import Task from '../../models/Task.js';
import Goal from '../../models/Goal.js';
import Milestone from '../../models/Milestone.js';
import GoalMilestone from '../../models/GoalMilestone.js';
import GoalModule from '../../models/GoalModule.js';
import GoalFolder from '../../models/GoalFolder.js';
import Habit from '../../models/Habit.js';
import HabitCheckIn from '../../models/HabitCheckIn.js';
import WorkSession from '../../models/WorkSession.js';
import Reminder from '../../models/Reminder.js';
import AssistantMemory from '../../models/AssistantMemory.js';
import DailyJournal from '../../models/DailyJournal.js';
import DailyAnalytics from '../../models/DailyAnalytics.js';
import AssistantToolExecution from '../../models/AssistantToolExecution.js';
import entityResolver from './entityResolver.js';
import confirmationService from './confirmationService.js';
import { updateGoalProgress } from '../../controllers/goalMilestoneController.js';
import { pacingService } from '../pacingService.js';
import { syncDailyAnalytics } from '../dailyAnalyticsAggregator.js';

/**
 * ToolExecutor — Authoritative Tool Execution Engine for ConsistAI Autonomous Agent
 * Executes validated application operations across Tasks, Goals, Milestones, Modules,
 * Habits, Focus, Reminders, Memory, and Analytics with persistence and Undo tracking.
 */
export const executeTool = async ({
  userId,
  conversationId = null,
  toolName,
  args = {},
  idempotencyKey = null
}) => {
  // 1. Idempotency check
  if (idempotencyKey) {
    const existing = await AssistantToolExecution.findOne({ user: userId, idempotencyKey });
    if (existing && existing.executionStatus === 'success') {
      return { success: true, isIdempotentReplay: true, result: existing.sanitizedResult };
    }
  }

  let result = null;
  let undoData = null;
  let errorMsg = null;

  try {
    switch (toolName) {
      // =====================================================================
      // 1. TASK MANAGEMENT
      // =====================================================================
      case 'create_task': {
        const {
          title,
          description = '',
          dueDate,
          priority = 'medium',
          taskType = 'daily',
          estimatedMinutes = 45,
          goalId,
          reminderMinutesBefore
        } = args;

        if (!title || !title.trim()) throw new Error('Task title is required');

        // Check if user is referencing an existing pending task that they want to mark complete
        if (/^(done|completed|finished)\b/i.test(title)) {
          const stripped = title.replace(/^(done|completed|finished)\s+/i, '').trim();
          const existingPending = await entityResolver.resolveTask({ userId, taskTitle: stripped, conversationId });
          if (existingPending) {
            existingPending.status = 'completed';
            existingPending.completedAt = new Date();
            await existingPending.save();
            await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));
            result = {
              taskId: existingPending._id,
              title: existingPending.title,
              status: 'completed',
              message: `Marked existing task "${existingPending.title}" as completed.`
            };
            undoData = { action: 'reopen_task', taskId: existingPending._id };
            break;
          }
        }

        let resolvedGoalId = goalId || null;
        if (!resolvedGoalId && args.goalTitle) {
          const g = await entityResolver.resolveGoal({ userId, goalTitle: args.goalTitle });
          if (g) resolvedGoalId = g._id;
        }

        const task = await Task.create({
          user: userId,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate ? parseNaturalDate(dueDate) : new Date(),
          priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'medium',
          taskType: ['daily', 'weekly', 'monthly', 'yearly'].includes(taskType) ? taskType : 'daily',
          estimatedMinutes: Number(estimatedMinutes) || 45,
          goal: resolvedGoalId,
          isGoalRelevant: Boolean(resolvedGoalId)
        });

        if (resolvedGoalId) {
          await Goal.findByIdAndUpdate(resolvedGoalId, { $addToSet: { linkedTasks: task._id } });
        }

        // Automatic reminder if requested
        if (reminderMinutesBefore && Number(reminderMinutesBefore) > 0) {
          const scheduledAt = new Date(new Date(task.dueDate).getTime() - Number(reminderMinutesBefore) * 60000);
          await Reminder.create({
            user: userId,
            taskId: task._id,
            scheduledAt,
            message: `Upcoming Task: "${task.title}" starts in ${reminderMinutesBefore} minutes.`
          });
        }

        const dateStr = new Date(task.dueDate).toISOString().slice(0, 10);
        await syncDailyAnalytics(userId, dateStr);

        result = {
          taskId: task._id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          message: `Task "${task.title}" created successfully for ${new Date(task.dueDate).toLocaleDateString()}.`
        };
        undoData = { action: 'delete_task', taskId: task._id };
        break;
      }

      case 'create_multiple_tasks': {
        const { tasks: taskList } = args;
        if (!Array.isArray(taskList) || taskList.length === 0) {
          throw new Error('Tasks array is required for batch task creation');
        }

        const createdDocs = [];
        for (const item of taskList) {
          if (!item.title) continue;
          const doc = await Task.create({
            user: userId,
            title: item.title.trim(),
            description: item.description?.trim() || '',
            dueDate: item.dueDate ? parseNaturalDate(item.dueDate) : new Date(),
            priority: ['low', 'medium', 'high', 'urgent'].includes(item.priority) ? item.priority : 'medium',
            estimatedMinutes: Number(item.estimatedMinutes) || 45,
            goal: item.goalId || null,
            isGoalRelevant: Boolean(item.goalId)
          });
          createdDocs.push(doc);
        }

        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));

        result = {
          count: createdDocs.length,
          tasks: createdDocs.map(t => ({ id: t._id, title: t.title, dueDate: t.dueDate })),
          message: `Created ${createdDocs.length} tasks successfully.`
        };
        undoData = { action: 'delete_tasks', taskIds: createdDocs.map(t => t._id) };
        break;
      }

      case 'search_tasks': {
        const { query, status = 'all', priority } = args;
        const filter = { user: userId };
        if (query) {
          filter.$or = [
            { title: { $regex: new RegExp(escapeRegex(query.trim()), 'i') } },
            { description: { $regex: new RegExp(escapeRegex(query.trim()), 'i') } }
          ];
        }
        if (status === 'pending') filter.status = { $ne: 'completed' };
        else if (status === 'completed') filter.status = 'completed';
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter).sort({ dueDate: 1 }).limit(20);
        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({
            id: t._id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate
          }))
        };
        break;
      }

      case 'get_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found');
        result = { task };
        break;
      }

      case 'get_today_tasks': {
        const dateStr = args.date || new Date().toISOString().slice(0, 10);
        const start = new Date(`${dateStr}T00:00:00.000Z`);
        const end = new Date(`${dateStr}T23:59:59.999Z`);

        const tasks = await Task.find({
          user: userId,
          dueDate: { $gte: start, $lte: end }
        }).sort({ priority: -1, createdAt: 1 });

        result = {
          date: dateStr,
          count: tasks.length,
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

      case 'get_pending_tasks': {
        const limit = Number(args.limit) || 15;
        const filter = { user: userId, status: { $ne: 'completed' } };
        if (args.goalId) filter.goal = args.goalId;

        const tasks = await Task.find(filter).sort({ dueDate: 1 }).limit(limit);
        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({ id: t._id, title: t.title, dueDate: t.dueDate, priority: t.priority }))
        };
        break;
      }

      case 'get_completed_tasks': {
        const limit = Number(args.limit) || 15;
        const filter = { user: userId, status: 'completed' };
        if (args.date) {
          const start = new Date(`${args.date}T00:00:00.000Z`);
          const end = new Date(`${args.date}T23:59:59.999Z`);
          filter.completedAt = { $gte: start, $lte: end };
        }

        const tasks = await Task.find(filter).sort({ completedAt: -1 }).limit(limit);
        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({ id: t._id, title: t.title, completedAt: t.completedAt }))
        };
        break;
      }

      case 'get_overdue_tasks': {
        const now = new Date();
        const tasks = await Task.find({
          user: userId,
          status: { $ne: 'completed' },
          dueDate: { $lt: now }
        }).sort({ dueDate: 1 });

        result = {
          count: tasks.length,
          tasks: tasks.map(t => ({ id: t._id, title: t.title, dueDate: t.dueDate, priority: t.priority }))
        };
        break;
      }

      case 'update_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to update');

        const prevSnapshot = {
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedMinutes: task.estimatedMinutes
        };

        if (args.title) task.title = args.title.trim();
        if (args.description !== undefined) task.description = args.description.trim();
        if (args.priority) task.priority = args.priority;
        if (args.dueDate) task.dueDate = parseNaturalDate(args.dueDate);
        if (args.estimatedMinutes) task.estimatedMinutes = Number(args.estimatedMinutes);

        await task.save();
        await syncDailyAnalytics(userId, new Date(task.dueDate).toISOString().slice(0, 10));

        result = {
          taskId: task._id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          message: `Task "${task.title}" updated successfully.`
        };
        undoData = { action: 'update_task', taskId: task._id, prevSnapshot };
        break;
      }

      case 'complete_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to complete');

        const prevStatus = task.status;
        const prevCompletedAt = task.completedAt;

        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();

        // Dismiss pending reminders for this task
        await Reminder.updateMany({ taskId: task._id, status: 'scheduled' }, { status: 'dismissed' });

        const dateStr = new Date().toISOString().slice(0, 10);
        await syncDailyAnalytics(userId, dateStr);

        result = {
          taskId: task._id,
          title: task.title,
          status: 'completed',
          message: `Task "${task.title}" marked as complete.`
        };
        undoData = { action: 'reopen_task', taskId: task._id, prevStatus, prevCompletedAt };
        break;
      }

      case 'reopen_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to reopen');

        task.status = 'pending';
        task.completedAt = null;
        await task.save();

        result = {
          taskId: task._id,
          title: task.title,
          status: 'pending',
          message: `Task "${task.title}" reopened back to pending.`
        };
        undoData = { action: 'complete_task', taskId: task._id };
        break;
      }

      case 'reschedule_task': {
        const { newDueDate } = args;
        if (!newDueDate) throw new Error('newDueDate is required to reschedule');

        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to reschedule');

        const prevDueDate = task.dueDate;
        task.dueDate = parseNaturalDate(newDueDate);
        await task.save();

        // Update scheduled reminders
        await Reminder.updateMany(
          { taskId: task._id, status: 'scheduled' },
          { scheduledAt: new Date(new Date(task.dueDate).getTime() - 15 * 60000) }
        );

        result = {
          taskId: task._id,
          title: task.title,
          newDueDate: task.dueDate,
          message: `Task "${task.title}" rescheduled to ${new Date(task.dueDate).toLocaleDateString()}.`
        };
        undoData = { action: 'reschedule_task', taskId: task._id, prevDueDate };
        break;
      }

      case 'skip_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to skip');

        task.status = 'cancelled';
        if (args.reason) task.description = `${task.description || ''} [Skipped: ${args.reason}]`.trim();
        await task.save();

        result = { taskId: task._id, title: task.title, message: `Task "${task.title}" skipped.` };
        undoData = { action: 'reopen_task', taskId: task._id };
        break;
      }

      case 'archive_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to archive');

        task.status = 'cancelled';
        await task.save();

        result = { taskId: task._id, title: task.title, message: `Task "${task.title}" archived.` };
        undoData = { action: 'restore_task', taskId: task._id };
        break;
      }

      case 'restore_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to restore');

        task.status = 'pending';
        await task.save();

        result = { taskId: task._id, title: task.title, message: `Task "${task.title}" restored back to active.` };
        undoData = { action: 'archive_task', taskId: task._id };
        break;
      }

      case 'delete_task': {
        const task = await entityResolver.resolveTask({
          userId,
          taskId: args.taskId,
          taskTitle: args.taskTitle,
          conversationId
        });
        if (!task) throw new Error('Task not found to delete');

        if (args.permanent) {
          if (!args.confirmed && !args.confirmationToken) {
            result = confirmationService.requestConfirmation({
              userId,
              action: 'delete_task',
              payload: { taskId: task._id, permanent: true },
              preview: `Permanently delete task "${task.title}". This cannot be undone.`
            });
            break;
          }
          if (!args.confirmed && args.confirmationToken) {
            const verified = confirmationService.verifyAndConsume({ userId, token: args.confirmationToken });
            if (!verified.valid) throw new Error(verified.message);
          }
        }

        const taskSnapshot = task.toObject();
        await Task.deleteOne({ _id: task._id });
        await Reminder.deleteMany({ taskId: task._id });

        result = {
          taskId: taskSnapshot._id,
          title: taskSnapshot.title,
          message: `Task "${taskSnapshot.title}" deleted.`
        };
        undoData = { action: 'restore_deleted_task', taskSnapshot };
        break;
      }

      case 'bulk_update_tasks': {
        const { action, filter = 'today_unfinished', newDueDate, taskIds, confirmationToken } = args;
        let query = { user: userId };

        if (Array.isArray(taskIds) && taskIds.length > 0) {
          query._id = { $in: taskIds };
        } else if (filter === 'today_unfinished') {
          const todayStr = new Date().toISOString().slice(0, 10);
          query.dueDate = {
            $gte: new Date(`${todayStr}T00:00:00.000Z`),
            $lte: new Date(`${todayStr}T23:59:59.999Z`)
          };
          query.status = { $ne: 'completed' };
        } else if (filter === 'overdue') {
          query.dueDate = { $lt: new Date() };
          query.status = { $ne: 'completed' };
        } else if (filter === 'completed_last_week') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
          query.completedAt = { $gte: sevenDaysAgo };
          query.status = 'completed';
        }

        const matchingTasks = await Task.find(query);
        if (matchingTasks.length === 0) {
          result = { message: 'No matching tasks found for bulk update.' };
          break;
        }

        if (action === 'delete') {
          if (!confirmationToken) {
            return confirmationService.requestConfirmation({
              userId,
              action: 'bulk_update_tasks',
              payload: { action: 'delete', taskIds: matchingTasks.map(t => t._id) },
              preview: `Permanently delete ${matchingTasks.length} tasks matching "${filter}".`
            });
          }
          const verified = confirmationService.verifyAndConsume({ userId, token: confirmationToken });
          if (!verified.valid) throw new Error(verified.message);

          await Task.deleteMany({ _id: { $in: matchingTasks.map(t => t._id) } });
          result = { count: matchingTasks.length, message: `Successfully deleted ${matchingTasks.length} tasks.` };
          break;
        }

        if (action === 'complete') {
          await Task.updateMany({ _id: { $in: matchingTasks.map(t => t._id) } }, { status: 'completed', completedAt: new Date() });
          result = { count: matchingTasks.length, message: `Marked ${matchingTasks.length} tasks as completed.` };
        } else if (action === 'reschedule') {
          const targetDate = newDueDate ? parseNaturalDate(newDueDate) : new Date(Date.now() + 86400000);
          await Task.updateMany({ _id: { $in: matchingTasks.map(t => t._id) } }, { dueDate: targetDate });
          result = { count: matchingTasks.length, message: `Rescheduled ${matchingTasks.length} tasks to ${targetDate.toLocaleDateString()}.` };
        } else if (action === 'archive') {
          await Task.updateMany({ _id: { $in: matchingTasks.map(t => t._id) } }, { status: 'cancelled' });
          result = { count: matchingTasks.length, message: `Archived ${matchingTasks.length} tasks.` };
        }

        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));
        break;
      }

      // =====================================================================
      // 2. GOALS & FOLDERS
      // =====================================================================
      case 'create_goal': {
        const {
          title,
          category = 'DSA & Coding',
          targetDate,
          startDate,
          priority = 'high',
          moduleCount = 10,
          targetQuantity = 100,
          measurementUnit = 'Problems',
          folderName,
          folderId,
          description = ''
        } = args;

        if (!title || !title.trim()) throw new Error('Goal title is required');

        let resolvedFolderId = folderId || null;
        let resolvedFolderName = folderName || 'General';

        if (!resolvedFolderId && folderName) {
          let folder = await GoalFolder.findOne({ user: userId, name: new RegExp(`^${escapeRegex(folderName.trim())}$`, 'i') });
          if (!folder) {
            folder = await GoalFolder.create({ user: userId, name: folderName.trim() });
          }
          resolvedFolderId = folder._id;
          resolvedFolderName = folder.name;
        }

        const target = targetDate ? parseNaturalDate(targetDate) : new Date(Date.now() + 60 * 86400000);

        const goal = await Goal.create({
          user: userId,
          title: title.trim(),
          description: description.trim(),
          category,
          targetDate: target,
          startDate: startDate ? parseNaturalDate(startDate) : new Date(),
          priority: ['low', 'medium', 'high', 'urgent'].includes(priority) ? priority : 'high',
          targetQuantity: Number(targetQuantity) || 100,
          measurementUnit,
          moduleCount: Number(moduleCount) || 10,
          currentProgressPercentage: 0,
          status: 'active',
          folderId: resolvedFolderId,
          folder: resolvedFolderName
        });

        // Create default milestone container and initial modules
        const numModules = Number(moduleCount) || 10;
        const initialMilestone = await GoalMilestone.create({
          goal: goal._id,
          user: userId,
          title: 'Milestone 1: Core Syllabus',
          order: 1,
          sequenceNumber: 1,
          weight: 1.0,
          moduleCount: numModules,
          status: 'not_started'
        });

        const initialModules = [];
        for (let i = 1; i <= Math.min(numModules, 50); i++) {
          initialModules.push({
            goal: goal._id,
            milestone: initialMilestone._id,
            user: userId,
            title: `Module ${String(i).padStart(2, '0')}`,
            order: i,
            status: 'not_started',
            isCompleted: false,
            estimatedMinutes: 45
          });
        }
        await GoalModule.insertMany(initialModules);

        await updateGoalProgress(goal._id, userId);

        result = {
          goalId: goal._id,
          title: goal.title,
          category: goal.category,
          targetDate: goal.targetDate,
          moduleCount: numModules,
          folder: resolvedFolderName,
          message: `Goal "${goal.title}" created with ${numModules} modules in "${resolvedFolderName}".`
        };
        undoData = { action: 'delete_goal', goalId: goal._id };
        break;
      }

      case 'search_goals': {
        const { query, category, status } = args;
        const filter = { user: userId };
        if (query) {
          filter.$or = [
            { title: { $regex: new RegExp(escapeRegex(query.trim()), 'i') } },
            { description: { $regex: new RegExp(escapeRegex(query.trim()), 'i') } }
          ];
        }
        if (category) filter.category = category;
        if (status && status !== 'all') filter.status = status;

        const goals = await Goal.find(filter).sort({ updatedAt: -1 }).limit(10);
        result = {
          count: goals.length,
          goals: goals.map(g => ({
            id: g._id,
            title: g.title,
            progress: g.currentProgressPercentage,
            status: g.status,
            category: g.category
          }))
        };
        break;
      }

      case 'get_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found');

        const milestones = await GoalMilestone.find({ goal: goal._id }).sort({ order: 1 });
        result = {
          goal: {
            id: goal._id,
            title: goal.title,
            category: goal.category,
            progress: goal.currentProgressPercentage,
            pacingStatus: goal.pacingStatus,
            folder: goal.folder,
            targetDate: goal.targetDate,
            milestones: milestones.map(m => ({ id: m._id, title: m.title, progress: m.progressPercentage, moduleCount: m.moduleCount }))
          }
        };
        break;
      }

      case 'get_all_goals':
      case 'get_goals': {
        const filter = { user: userId };
        if (args.status && args.status !== 'all') filter.status = args.status;
        if (args.folderId) filter.folderId = args.folderId;

        const goals = await Goal.find(filter).sort({ isFavorite: -1, updatedAt: -1 });
        result = {
          count: goals.length,
          goals: goals.map(g => ({
            id: g._id,
            title: g.title,
            category: g.category,
            progress: g.currentProgressPercentage,
            pacingStatus: g.pacingStatus,
            status: g.status,
            folder: g.folder,
            targetDate: g.targetDate
          }))
        };
        break;
      }

      case 'get_goal_progress': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found');

        const milestones = await GoalMilestone.find({ goal: goal._id, user: userId });
        const pacing = pacingService.calculateGoalPacing(goal, milestones);

        result = {
          goalId: goal._id,
          title: goal.title,
          progress: goal.currentProgressPercentage,
          pacingStatus: pacing.pacing_status,
          pacingGap: pacing.progress_gap_pct,
          recommendation: pacing.actionable_recommendation
        };
        break;
      }

      case 'update_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found to update');

        if (args.title) goal.title = args.title.trim();
        if (args.description !== undefined) goal.description = args.description.trim();
        if (args.targetDate) goal.targetDate = parseNaturalDate(args.targetDate);
        if (args.category) goal.category = args.category;
        if (args.priority) goal.priority = args.priority;

        await goal.save();
        await updateGoalProgress(goal._id, userId);

        result = {
          goalId: goal._id,
          title: goal.title,
          targetDate: goal.targetDate,
          message: `Goal "${goal.title}" updated successfully.`
        };
        break;
      }

      case 'archive_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found to archive');

        goal.status = 'archived';
        await goal.save();

        result = { goalId: goal._id, title: goal.title, message: `Goal "${goal.title}" archived.` };
        undoData = { action: 'restore_goal', goalId: goal._id };
        break;
      }

      case 'restore_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found to restore');

        goal.status = 'active';
        await goal.save();

        result = { goalId: goal._id, title: goal.title, message: `Goal "${goal.title}" restored back to active.` };
        undoData = { action: 'archive_goal', goalId: goal._id };
        break;
      }

      case 'delete_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found to delete');

        // Check confirmation
        if (!args.confirmed && !args.confirmationToken) {
          const msCount = await GoalMilestone.countDocuments({ goal: goal._id });
          const modCount = await GoalModule.countDocuments({ goal: goal._id });
          const taskCount = await Task.countDocuments({ goal: goal._id });

          result = confirmationService.requestConfirmation({
            userId,
            action: 'delete_goal',
            payload: { goalId: goal._id },
            preview: `Permanently delete Goal "${goal.title}" containing ${msCount} milestones, ${modCount} modules, and ${taskCount} linked tasks.`
          });
          break;
        }

        if (!args.confirmed && args.confirmationToken) {
          const verified = confirmationService.verifyAndConsume({ userId, token: args.confirmationToken });
          if (!verified.valid) throw new Error(verified.message);
        }

        await Goal.deleteOne({ _id: goal._id });
        await GoalMilestone.deleteMany({ goal: goal._id });
        await GoalModule.deleteMany({ goal: goal._id });
        await Milestone.deleteMany({ goal: goal._id });
        await Task.updateMany({ goal: goal._id }, { goal: null, isGoalRelevant: false });

        result = { goalId: goal._id, title: goal.title, message: `Goal "${goal.title}" and its modules deleted.` };
        break;
      }

      case 'move_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found to move');

        let folder = await entityResolver.resolveFolder({
          userId,
          folderId: args.targetFolderId,
          folderName: args.targetFolderName
        });

        if (!folder && args.targetFolderName) {
          folder = await GoalFolder.create({ user: userId, name: args.targetFolderName.trim() });
        }

        goal.folderId = folder ? folder._id : null;
        goal.folder = folder ? folder.name : 'General';
        await goal.save();

        result = {
          goalId: goal._id,
          title: goal.title,
          folder: goal.folder,
          message: `Moved Goal "${goal.title}" into folder "${goal.folder}".`
        };
        break;
      }

      case 'set_primary_goal': {
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found');

        // Unset previous favorites
        await Goal.updateMany({ user: userId }, { isFavorite: false });
        goal.isFavorite = true;
        await goal.save();

        result = { goalId: goal._id, title: goal.title, message: `"${goal.title}" is now your primary goal.` };
        break;
      }

      case 'create_folder': {
        const { name, parentFolderName, parentFolderId, description, color, icon } = args;
        if (!name || !name.trim()) throw new Error('Folder name is required');

        let pId = parentFolderId || null;
        if (!pId && parentFolderName) {
          const parent = await GoalFolder.findOne({ user: userId, name: new RegExp(`^${escapeRegex(parentFolderName.trim())}$`, 'i') });
          if (parent) pId = parent._id;
        }

        const folder = await GoalFolder.create({
          user: userId,
          name: name.trim(),
          parentFolderId: pId,
          description: description?.trim() || '',
          color: color || '#6366f1',
          icon: icon || 'Folder'
        });

        result = {
          folderId: folder._id,
          name: folder.name,
          message: `Folder "${folder.name}" created successfully.`
        };
        undoData = { action: 'delete_folder', folderId: folder._id };
        break;
      }

      case 'rename_folder': {
        const { newName, currentName, folderId } = args;
        if (!newName || !newName.trim()) throw new Error('New folder name is required');

        const folder = await entityResolver.resolveFolder({ userId, folderId, folderName: currentName });
        if (!folder) throw new Error('Folder not found to rename');

        const oldName = folder.name;
        folder.name = newName.trim();
        await folder.save();

        // Update goals in this folder
        await Goal.updateMany({ folderId: folder._id }, { folder: folder.name });

        result = { folderId: folder._id, name: folder.name, message: `Folder renamed from "${oldName}" to "${folder.name}".` };
        break;
      }

      case 'move_folder': {
        const folder = await entityResolver.resolveFolder({ userId, folderId: args.folderId, folderName: args.folderName });
        if (!folder) throw new Error('Folder not found to move');

        let targetPId = args.targetParentFolderId || null;
        if (!targetPId && args.targetParentFolderName) {
          const parent = await GoalFolder.findOne({ user: userId, name: new RegExp(`^${escapeRegex(args.targetParentFolderName.trim())}$`, 'i') });
          if (parent) targetPId = parent._id;
        }

        folder.parentFolderId = targetPId;
        await folder.save();

        result = { folderId: folder._id, name: folder.name, message: `Folder "${folder.name}" moved successfully.` };
        break;
      }

      case 'delete_folder': {
        const folder = await entityResolver.resolveFolder({ userId, folderId: args.folderId, folderName: args.folderName });
        if (!folder) throw new Error('Folder not found to delete');

        // Safe deletion per spec: migrate contained goals to root / General folder
        await Goal.updateMany({ folderId: folder._id }, { folderId: null, folder: 'General' });
        // Migrate subfolders to root
        await GoalFolder.updateMany({ parentFolderId: folder._id }, { parentFolderId: null });

        await GoalFolder.deleteOne({ _id: folder._id });

        result = { folderId: folder._id, name: folder.name, message: `Folder "${folder.name}" deleted. All contained goals were preserved in General.` };
        break;
      }

      case 'log_goal_progress': {
        const { quantityAdded = 1, notes = '' } = args;
        const goal = await entityResolver.resolveGoal({
          userId,
          goalId: args.goalId,
          goalTitle: args.goalTitle,
          conversationId
        });
        if (!goal) throw new Error('Goal not found to log progress');

        goal.achievedQuantity = (goal.achievedQuantity || 0) + Number(quantityAdded);
        if (goal.targetQuantity > 0) {
          goal.currentProgressPercentage = Math.min(100, Math.round((goal.achievedQuantity / goal.targetQuantity) * 100));
        }
        await goal.save();
        await updateGoalProgress(goal._id, userId);

        result = {
          goalId: goal._id,
          title: goal.title,
          achievedQuantity: goal.achievedQuantity,
          progress: goal.currentProgressPercentage,
          message: `Logged ${quantityAdded} ${goal.measurementUnit || 'units'} for "${goal.title}". New progress: ${goal.currentProgressPercentage}%.`
        };
        break;
      }

      // =====================================================================
      // 3. MILESTONES & MODULES
      // =====================================================================
      case 'create_milestone':
      case 'add_milestone': {
        const { goalTitle, goalId, title, description = '', weight = 1.0, moduleCount = 0, moduleNames } = args;
        if (!title || !title.trim()) throw new Error('Milestone title is required');

        const goal = await entityResolver.resolveGoal({ userId, goalId, goalTitle, conversationId });
        if (!goal) throw new Error('Target goal not found for milestone');

        const lastMs = await GoalMilestone.findOne({ goal: goal._id }).sort({ order: -1 });
        const nextOrder = lastMs ? lastMs.order + 1 : 1;

        const milestone = await GoalMilestone.create({
          goal: goal._id,
          user: userId,
          title: title.trim(),
          description: description.trim(),
          order: nextOrder,
          sequenceNumber: nextOrder,
          weight: Math.max(0.1, Number(weight) || 1.0),
          moduleCount: 0,
          status: 'not_started'
        });

        // Generate module slots or named modules if provided
        let namesArray = [];
        if (Array.isArray(moduleNames)) {
          namesArray = moduleNames.map(n => String(n).trim()).filter(Boolean);
        }
        const effectiveCount = Math.max(Number(moduleCount) || 0, namesArray.length);

        if (effectiveCount > 0) {
          const modDocs = [];
          for (let i = 1; i <= effectiveCount; i++) {
            const padded = String(i).padStart(2, '0');
            const modTitle = namesArray[i - 1] || `Module ${padded}`;
            modDocs.push({
              goal: goal._id,
              milestone: milestone._id,
              user: userId,
              title: modTitle,
              order: i,
              status: 'not_started',
              isCompleted: false,
              estimatedMinutes: 45
            });
          }
          await GoalModule.insertMany(modDocs);
          milestone.moduleCount = effectiveCount;
          await milestone.save();
        }

        await updateGoalProgress(goal._id, userId);

        result = {
          milestoneId: milestone._id,
          goalTitle: goal.title,
          title: milestone.title,
          moduleCount: effectiveCount,
          message: `Milestone "${milestone.title}" added to goal "${goal.title}" with ${effectiveCount} modules.`
        };
        undoData = { action: 'delete_milestone', milestoneId: milestone._id };
        break;
      }

      case 'search_milestones': {
        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        const query = { user: userId };
        if (goal) query.goal = goal._id;
        if (args.query) query.title = new RegExp(escapeRegex(args.query.trim()), 'i');

        const milestones = await GoalMilestone.find(query).sort({ order: 1 });
        result = {
          count: milestones.length,
          milestones: milestones.map(m => ({
            id: m._id,
            title: m.title,
            progress: m.progressPercentage,
            moduleCount: m.moduleCount,
            completedCount: m.completedModuleCount
          }))
        };
        break;
      }

      case 'update_milestone': {
        const ms = await entityResolver.resolveMilestone({
          userId,
          goalId: args.goalId,
          milestoneId: args.milestoneId,
          milestoneTitle: args.milestoneTitle
        });
        if (!ms) throw new Error('Milestone not found to update');

        if (args.title) ms.title = args.title.trim();
        if (args.description !== undefined) ms.description = args.description.trim();
        if (args.weight) ms.weight = Number(args.weight);
        if (args.targetDate) ms.targetDate = parseNaturalDate(args.targetDate);

        await ms.save();
        await updateGoalProgress(ms.goal, userId);

        result = { milestoneId: ms._id, title: ms.title, message: `Milestone "${ms.title}" updated.` };
        break;
      }

      case 'delete_milestone': {
        const ms = await entityResolver.resolveMilestone({
          userId,
          goalId: args.goalId,
          milestoneId: args.milestoneId,
          milestoneTitle: args.milestoneTitle
        });
        if (!ms) throw new Error('Milestone not found to delete');

        if (!args.confirmationToken) {
          const modCount = await GoalModule.countDocuments({ milestone: ms._id });
          return confirmationService.requestConfirmation({
            userId,
            action: 'delete_milestone',
            payload: { milestoneId: ms._id },
            preview: `Delete Milestone "${ms.title}" and all its ${modCount} modules.`
          });
        }

        const verified = confirmationService.verifyAndConsume({ userId, token: args.confirmationToken });
        if (!verified.valid) throw new Error(verified.message);

        const goalId = ms.goal;
        await GoalModule.deleteMany({ milestone: ms._id });
        await GoalMilestone.deleteOne({ _id: ms._id });
        await updateGoalProgress(goalId, userId);

        result = { milestoneId: ms._id, title: ms.title, message: `Milestone "${ms.title}" and its modules deleted.` };
        break;
      }

      case 'get_milestone_progress': {
        const ms = await entityResolver.resolveMilestone({
          userId,
          goalId: args.goalId,
          milestoneId: args.milestoneId,
          milestoneTitle: args.milestoneTitle
        });
        if (!ms) throw new Error('Milestone not found');

        result = {
          milestoneId: ms._id,
          title: ms.title,
          progress: ms.progressPercentage,
          completedModules: ms.completedModuleCount,
          totalModules: ms.moduleCount
        };
        break;
      }

      case 'add_module': {
        const { title, description = '', estimatedMinutes = 45 } = args;
        if (!title || !title.trim()) throw new Error('Module title is required');

        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        if (!goal) throw new Error('Goal not found for adding module');

        const ms = await entityResolver.resolveMilestone({
          userId,
          goalId: goal._id,
          milestoneId: args.milestoneId,
          milestoneTitle: args.milestoneTitle
        });
        if (!ms) throw new Error('Milestone container not found');

        const lastMod = await GoalModule.findOne({ milestone: ms._id }).sort({ order: -1 });
        const nextOrder = lastMod ? lastMod.order + 1 : 1;

        const mod = await GoalModule.create({
          goal: goal._id,
          milestone: ms._id,
          user: userId,
          title: title.trim(),
          description: description.trim(),
          order: nextOrder,
          status: 'not_started',
          isCompleted: false,
          estimatedMinutes: Number(estimatedMinutes) || 45
        });

        ms.moduleCount = (ms.moduleCount || 0) + 1;
        await ms.save();
        await updateGoalProgress(goal._id, userId);

        result = {
          moduleId: mod._id,
          title: mod.title,
          milestone: ms.title,
          goal: goal.title,
          message: `Added module "${mod.title}" to "${ms.title}".`
        };
        undoData = { action: 'delete_module', moduleId: mod._id };
        break;
      }

      case 'generate_module_slots':
      case 'generate_modules': {
        const { count = 10 } = args;
        const exactCount = Math.min(100, Math.max(1, Number(count)));

        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        if (!goal) throw new Error('Target goal not found');

        let ms = await entityResolver.resolveMilestone({
          userId,
          goalId: goal._id,
          milestoneId: args.milestoneId,
          milestoneTitle: args.milestoneTitle
        });

        if (!ms) {
          ms = await GoalMilestone.create({
            goal: goal._id,
            user: userId,
            title: 'Milestone 1: Core Syllabus',
            order: 1,
            sequenceNumber: 1,
            weight: 1.0,
            moduleCount: 0,
            status: 'not_started'
          });
        }

        const existingCount = await GoalModule.countDocuments({ milestone: ms._id });
        const newDocs = [];
        for (let i = 1; i <= exactCount; i++) {
          const slotNum = existingCount + i;
          const padded = String(slotNum).padStart(2, '0');
          newDocs.push({
            goal: goal._id,
            milestone: ms._id,
            user: userId,
            title: `Module ${padded}`,
            order: slotNum,
            status: 'not_started',
            isCompleted: false,
            estimatedMinutes: 45
          });
        }
        await GoalModule.insertMany(newDocs);

        ms.moduleCount = existingCount + exactCount;
        await ms.save();
        await updateGoalProgress(goal._id, userId);

        result = {
          milestoneTitle: ms.title,
          goalTitle: goal.title,
          slotsCreated: exactCount,
          totalModules: ms.moduleCount,
          message: `Created exactly ${exactCount} module slots under "${ms.title}".`
        };
        break;
      }

      case 'populate_module_slots': {
        const { moduleNames } = args;
        if (!Array.isArray(moduleNames) || moduleNames.length === 0) {
          throw new Error('moduleNames array is required to populate slots');
        }

        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        if (!goal) throw new Error('Target goal not found');

        const ms = await entityResolver.resolveMilestone({
          userId,
          goalId: goal._id,
          milestoneId: args.milestoneId,
          milestoneTitle: args.milestoneTitle
        });
        if (!ms) throw new Error('Milestone container not found');

        const existingModules = await GoalModule.find({ milestone: ms._id }).sort({ order: 1 });
        const updated = [];

        for (let i = 0; i < moduleNames.length; i++) {
          const name = String(moduleNames[i]).trim();
          if (!name) continue;

          if (existingModules[i]) {
            // Update existing slot instead of duplicating
            existingModules[i].title = name;
            await existingModules[i].save();
            updated.push(existingModules[i].title);
          } else {
            // Create additional slot if needed
            const newMod = await GoalModule.create({
              goal: goal._id,
              milestone: ms._id,
              user: userId,
              title: name,
              order: i + 1,
              status: 'not_started',
              isCompleted: false,
              estimatedMinutes: 45
            });
            updated.push(newMod.title);
          }
        }

        ms.moduleCount = Math.max(ms.moduleCount, updated.length);
        await ms.save();
        await updateGoalProgress(goal._id, userId);

        result = {
          milestoneTitle: ms.title,
          populatedCount: updated.length,
          message: `Populated ${updated.length} module slots in "${ms.title}".`
        };
        break;
      }

      case 'search_modules': {
        const { query } = args;
        const filter = { user: userId };
        if (query) filter.title = new RegExp(escapeRegex(query.trim()), 'i');

        const modules = await GoalModule.find(filter).sort({ order: 1 }).limit(20);
        result = {
          count: modules.length,
          modules: modules.map(m => ({ id: m._id, title: m.title, order: m.order, isCompleted: m.isCompleted }))
        };
        break;
      }

      case 'rename_module': {
        const { newTitle, moduleOrder, moduleId } = args;
        if (!newTitle || !newTitle.trim()) throw new Error('New title is required to rename module');

        const mod = await entityResolver.resolveModule({
          userId,
          moduleId,
          moduleOrder,
          milestoneTitle: args.milestoneTitle
        });
        if (!mod) throw new Error('Module not found to rename');

        const oldTitle = mod.title;
        mod.title = newTitle.trim();
        await mod.save();

        result = {
          moduleId: mod._id,
          order: mod.order,
          title: mod.title,
          message: `Module renamed from "${oldTitle}" to "${mod.title}".`
        };
        break;
      }

      case 'complete_module': {
        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        const mod = await entityResolver.resolveModule({
          userId,
          goalId: goal ? goal._id : null,
          milestoneTitle: args.milestoneTitle,
          moduleId: args.moduleId,
          moduleTitle: args.moduleTitle,
          moduleOrder: args.moduleOrder
        });

        if (!mod) {
          // Check legacy Milestone model if present
          if (goal) {
            const legacyMs = await Milestone.findOne({
              goal: goal._id,
              user: userId,
              status: { $ne: 'completed' }
            }).sort({ order: 1 });
            if (legacyMs) {
              legacyMs.isCompleted = true;
              legacyMs.status = 'completed';
              legacyMs.completedAt = new Date();
              await legacyMs.save();
              await updateGoalProgress(goal._id, userId);
              result = { title: legacyMs.title, message: `Completed module "${legacyMs.title}".` };
              break;
            }
          }
          throw new Error('Module not found to complete');
        }

        mod.isCompleted = true;
        mod.status = 'completed';
        mod.completedAt = new Date();
        await mod.save();

        const goalProgress = await updateGoalProgress(mod.goal, userId);
        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));

        result = {
          moduleId: mod._id,
          order: mod.order,
          title: mod.title,
          goalProgress,
          message: `Completed "${mod.title}". Overall goal progress is now ${goalProgress}%.`
        };
        undoData = { action: 'reopen_module', moduleId: mod._id };
        break;
      }

      case 'reopen_module': {
        const mod = await entityResolver.resolveModule({
          userId,
          moduleId: args.moduleId,
          moduleTitle: args.moduleTitle,
          moduleOrder: args.moduleOrder
        });
        if (!mod) throw new Error('Module not found to reopen');

        mod.isCompleted = false;
        mod.status = 'not_started';
        mod.completedAt = null;
        await mod.save();

        const goalProgress = await updateGoalProgress(mod.goal, userId);

        result = {
          moduleId: mod._id,
          title: mod.title,
          goalProgress,
          message: `Reopened module "${mod.title}". Goal progress recalculated to ${goalProgress}%.`
        };
        undoData = { action: 'complete_module', moduleId: mod._id };
        break;
      }

      case 'delete_module': {
        const mod = await entityResolver.resolveModule({
          userId,
          moduleId: args.moduleId,
          moduleOrder: args.moduleOrder,
          milestoneTitle: args.milestoneTitle
        });
        if (!mod) throw new Error('Module not found to delete');

        const goalId = mod.goal;
        const modSnapshot = mod.toObject();
        await GoalModule.deleteOne({ _id: mod._id });
        await updateGoalProgress(goalId, userId);

        result = { moduleId: modSnapshot._id, title: modSnapshot.title, message: `Module "${modSnapshot.title}" deleted.` };
        break;
      }

      case 'reorder_modules': {
        const { milestoneId, orderedModuleIds } = args;
        if (!milestoneId || !Array.isArray(orderedModuleIds)) {
          throw new Error('milestoneId and orderedModuleIds array are required');
        }

        for (let i = 0; i < orderedModuleIds.length; i++) {
          await GoalModule.findOneAndUpdate(
            { _id: orderedModuleIds[i], milestone: milestoneId, user: userId },
            { order: i + 1 }
          );
        }

        result = { count: orderedModuleIds.length, message: `Reordered ${orderedModuleIds.length} modules.` };
        break;
      }

      case 'bulk_complete_modules': {
        const { fromOrder = 1, toOrder, count } = args;
        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        if (!goal) throw new Error('Goal not found');

        const ms = await entityResolver.resolveMilestone({
          userId,
          goalId: goal._id,
          milestoneTitle: args.milestoneTitle
        });
        if (!ms) throw new Error('Milestone not found');

        const query = { milestone: ms._id, user: userId, isCompleted: false };
        if (toOrder) {
          query.order = { $gte: Number(fromOrder), $lte: Number(toOrder) };
        }

        let modulesToComplete = await GoalModule.find(query).sort({ order: 1 });
        if (count && Number(count) > 0) {
          modulesToComplete = modulesToComplete.slice(0, Number(count));
        }

        if (modulesToComplete.length === 0) {
          result = { message: 'All specified modules are already completed.' };
          break;
        }

        const ids = modulesToComplete.map(m => m._id);
        await GoalModule.updateMany({ _id: { $in: ids } }, { isCompleted: true, status: 'completed', completedAt: new Date() });

        const goalProgress = await updateGoalProgress(goal._id, userId);
        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));

        result = {
          completedCount: ids.length,
          milestoneTitle: ms.title,
          goalProgress,
          message: `Completed ${ids.length} modules in "${ms.title}". Goal progress is now ${goalProgress}%.`
        };
        undoData = { action: 'reopen_modules', moduleIds: ids };
        break;
      }

      case 'get_next_module': {
        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        const mod = await entityResolver.resolveModule({
          userId,
          goalId: goal ? goal._id : null,
          milestoneTitle: args.milestoneTitle
        });

        if (!mod) {
          result = { message: 'Congratulations! All modules for this milestone are already completed.' };
          break;
        }

        result = {
          moduleId: mod._id,
          order: mod.order,
          title: mod.title,
          estimatedMinutes: mod.estimatedMinutes,
          message: `Next module to tackle: Module ${mod.order} — "${mod.title}" (${mod.estimatedMinutes}m).`
        };
        break;
      }

      case 'get_remaining_modules': {
        const goal = await entityResolver.resolveGoal({ userId, goalId: args.goalId, goalTitle: args.goalTitle, conversationId });
        const query = { user: userId, isCompleted: false };
        if (goal) query.goal = goal._id;

        const remaining = await GoalModule.find(query).sort({ order: 1 }).limit(15);
        result = {
          count: remaining.length,
          modules: remaining.map(m => ({ id: m._id, order: m.order, title: m.title }))
        };
        break;
      }

      // =====================================================================
      // 4. HABITS
      // =====================================================================
      case 'create_habit': {
        const {
          title,
          description = '',
          category = 'DSA & Coding',
          frequency = 'daily',
          targetDaysPerWeek = 7,
          timeOfDay = 'anytime',
          targetQuantity = 1,
          measurementUnit = 'check-in',
          goalId
        } = args;

        if (!title || !title.trim()) throw new Error('Habit title is required');

        const habit = await Habit.create({
          user: userId,
          title: title.trim(),
          description: description.trim(),
          category,
          frequency,
          targetDaysPerWeek: Number(targetDaysPerWeek) || 7,
          timeOfDay,
          targetQuantity: Number(targetQuantity) || 1,
          measurementUnit,
          linkedGoals: goalId ? [goalId] : [],
          currentStreak: 0,
          longestStreak: 0,
          active: true
        });

        result = {
          habitId: habit._id,
          title: habit.title,
          frequency: habit.frequency,
          timeOfDay: habit.timeOfDay,
          message: `Habit "${habit.title}" created (${habit.frequency}, ${habit.timeOfDay}).`
        };
        undoData = { action: 'delete_habit', habitId: habit._id };
        break;
      }

      case 'search_habits': {
        const query = args.query?.trim() || '';
        const habits = await Habit.find({
          user: userId,
          title: { $regex: new RegExp(escapeRegex(query), 'i') }
        });
        result = {
          count: habits.length,
          habits: habits.map(h => ({ id: h._id, title: h.title, streak: h.currentStreak, active: h.active }))
        };
        break;
      }

      case 'get_habits': {
        const filter = { user: userId };
        if (args.activeOnly !== false) filter.active = true;
        const habits = await Habit.find(filter).sort({ currentStreak: -1 });
        result = {
          count: habits.length,
          habits: habits.map(h => ({
            id: h._id,
            title: h.title,
            frequency: h.frequency,
            streak: h.currentStreak,
            active: h.active
          }))
        };
        break;
      }

      case 'get_today_habits': {
        const dateStr = args.date || new Date().toISOString().slice(0, 10);
        const habits = await Habit.find({ user: userId, active: true });
        const checkIns = await HabitCheckIn.find({ user: userId, date: dateStr });
        const completedHabitIds = new Set(checkIns.map(c => c.habit.toString()));

        result = {
          date: dateStr,
          count: habits.length,
          habits: habits.map(h => ({
            id: h._id,
            title: h.title,
            completedToday: completedHabitIds.has(h._id.toString()),
            streak: h.currentStreak
          }))
        };
        break;
      }

      case 'update_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found to update');

        if (args.title) habit.title = args.title.trim();
        if (args.targetQuantity) habit.targetQuantity = Number(args.targetQuantity);
        if (args.frequency) habit.frequency = args.frequency;
        if (args.timeOfDay) habit.timeOfDay = args.timeOfDay;

        await habit.save();
        result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" updated.` };
        break;
      }

      case 'log_habit_checkin':
      case 'log_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found for check-in');

        const dateStr = args.date || new Date().toISOString().slice(0, 10);

        let checkIn = await HabitCheckIn.findOne({ user: userId, habit: habit._id, date: dateStr });
        if (!checkIn) {
          checkIn = await HabitCheckIn.create({
            user: userId,
            habit: habit._id,
            date: dateStr,
            completed: true,
            notes: args.notes?.trim() || ''
          });
          habit.currentStreak = (habit.currentStreak || 0) + 1;
          if (habit.currentStreak > (habit.longestStreak || 0)) {
            habit.longestStreak = habit.currentStreak;
          }
          await habit.save();
        } else {
          checkIn.completed = true;
          if (args.notes) checkIn.notes = args.notes.trim();
          await checkIn.save();
        }

        await syncDailyAnalytics(userId, dateStr);

        result = {
          habitId: habit._id,
          title: habit.title,
          date: dateStr,
          currentStreak: habit.currentStreak,
          message: `Checked in "${habit.title}" for ${dateStr}! Streak: ${habit.currentStreak} days 🔥.`
        };
        undoData = { action: 'undo_habit_checkin', checkInId: checkIn._id, habitId: habit._id, date: dateStr };
        break;
      }

      case 'undo_habit_checkin': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found');

        const dateStr = args.date || new Date().toISOString().slice(0, 10);
        const deleted = await HabitCheckIn.findOneAndDelete({ user: userId, habit: habit._id, date: dateStr });

        if (deleted) {
          habit.currentStreak = Math.max(0, (habit.currentStreak || 1) - 1);
          await habit.save();
          await syncDailyAnalytics(userId, dateStr);
        }

        result = { habitId: habit._id, title: habit.title, message: `Check-in for "${habit.title}" removed.` };
        break;
      }

      case 'pause_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found to pause');

        habit.active = false;
        await habit.save();

        result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" paused.` };
        undoData = { action: 'resume_habit', habitId: habit._id };
        break;
      }

      case 'resume_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found to resume');

        habit.active = true;
        await habit.save();

        result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" resumed.` };
        undoData = { action: 'pause_habit', habitId: habit._id };
        break;
      }

      case 'archive_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found to archive');

        habit.active = false;
        await habit.save();

        result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" archived.` };
        undoData = { action: 'restore_habit', habitId: habit._id };
        break;
      }

      case 'restore_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found to restore');

        habit.active = true;
        await habit.save();

        result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" restored.` };
        undoData = { action: 'archive_habit', habitId: habit._id };
        break;
      }

      case 'delete_habit': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found to delete');

        if (args.permanent) {
          if (!args.confirmationToken) {
            return confirmationService.requestConfirmation({
              userId,
              action: 'delete_habit',
              payload: { habitId: habit._id },
              preview: `Permanently delete Habit "${habit.title}" and its streak history.`
            });
          }
          const verified = confirmationService.verifyAndConsume({ userId, token: args.confirmationToken });
          if (!verified.valid) throw new Error(verified.message);

          await Habit.deleteOne({ _id: habit._id });
          await HabitCheckIn.deleteMany({ habit: habit._id });
          result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" permanently removed.` };
        } else {
          habit.active = false;
          await habit.save();
          result = { habitId: habit._id, title: habit.title, message: `Habit "${habit.title}" archived safely.` };
          undoData = { action: 'restore_habit', habitId: habit._id };
        }
        break;
      }

      case 'get_habit_history': {
        const habit = await entityResolver.resolveHabit({ userId, habitId: args.habitId, habitTitle: args.habitTitle });
        if (!habit) throw new Error('Habit not found');

        const days = Number(args.days) || 30;
        const sinceDate = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
        const checkIns = await HabitCheckIn.find({
          user: userId,
          habit: habit._id,
          date: { $gte: sinceDate }
        }).sort({ date: -1 });

        result = {
          habitId: habit._id,
          title: habit.title,
          totalCheckIns: checkIns.length,
          currentStreak: habit.currentStreak,
          longestStreak: habit.longestStreak,
          history: checkIns.map(c => ({ date: c.date, completed: c.completed }))
        };
        break;
      }

      // =====================================================================
      // 5. FOCUS & WORK SESSIONS
      // =====================================================================
      case 'start_focus_session': {
        const duration = Number(args.durationMinutes) || 25;
        const session = await WorkSession.create({
          user: userId,
          durationMinutes: duration,
          subject: args.subject?.trim() || 'General Focus',
          sessionType: args.sessionType || 'pomodoro',
          startTime: new Date(),
          goal: args.goalId || null,
          status: 'active'
        });
        result = { sessionId: session._id, duration, subject: session.subject, message: `Focus timer started for ${duration} minutes on "${session.subject}".` };
        break;
      }

      case 'pause_focus_session': {
        const session = await WorkSession.findOneAndUpdate(
          { user: userId, status: 'active' },
          { status: 'paused', pausedAt: new Date() },
          { new: true }
        );
        result = { message: session ? 'Focus session paused.' : 'No active focus session to pause.' };
        break;
      }

      case 'resume_focus_session': {
        const session = await WorkSession.findOneAndUpdate(
          { user: userId, status: 'paused' },
          { status: 'active', pausedAt: null },
          { new: true }
        );
        result = { message: session ? 'Focus session resumed.' : 'No paused session found.' };
        break;
      }

      case 'finish_focus_session': {
        const session = await WorkSession.findOne({ user: userId, status: { $in: ['active', 'paused'] } }).sort({ createdAt: -1 });
        if (!session) {
          result = { message: 'No active focus session found.' };
          break;
        }

        session.status = args.completionStatus || 'completed';
        session.endTime = new Date();
        if (args.notes) session.notes = args.notes.trim();
        await session.save();

        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));
        result = { durationMinutes: session.durationMinutes, message: `Focus session finished (${session.durationMinutes} mins recorded).` };
        break;
      }

      case 'log_work_session': {
        const duration = Number(args.durationMinutes);
        if (!duration || duration <= 0) throw new Error('Valid durationMinutes is required');

        const session = await WorkSession.create({
          user: userId,
          durationMinutes: duration,
          subject: args.subject?.trim() || 'Productive Work',
          sessionType: 'free_flow',
          startTime: new Date(Date.now() - duration * 60000),
          endTime: new Date(),
          notes: args.notes?.trim() || '',
          status: 'completed'
        });

        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));
        result = { durationMinutes: duration, subject: session.subject, message: `Logged ${duration} minutes of ${session.subject}.` };
        break;
      }

      case 'get_working_hours': {
        const dateStr = args.date || new Date().toISOString().slice(0, 10);
        const start = new Date(`${dateStr}T00:00:00.000Z`);
        const end = new Date(`${dateStr}T23:59:59.999Z`);

        const sessions = await WorkSession.find({
          user: userId,
          startTime: { $gte: start, $lte: end },
          status: 'completed'
        });

        const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        const hours = (totalMinutes / 60).toFixed(1);
        result = { date: dateStr, totalMinutes, totalHours: hours, sessionCount: sessions.length };
        break;
      }

      // =====================================================================
      // 6. REMINDERS
      // =====================================================================
      case 'create_reminder': {
        const { message, scheduledAt, minutesFromNow } = args;
        if (!message) throw new Error('Reminder message is required');

        let when = new Date();
        if (minutesFromNow) {
          when = new Date(Date.now() + Number(minutesFromNow) * 60000);
        } else if (scheduledAt) {
          when = parseNaturalDate(scheduledAt);
        } else {
          when = new Date(Date.now() + 60 * 60000); // 1 hour default
        }

        const reminder = await Reminder.create({
          user: userId,
          message: message.trim(),
          scheduledAt: when,
          status: 'scheduled'
        });

        result = {
          reminderId: reminder._id,
          message: reminder.message,
          scheduledAt: reminder.scheduledAt,
          formatted: `Reminder set: "${reminder.message}" for ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        };
        break;
      }

      case 'snooze_reminder': {
        const snoozeMins = Number(args.snoozeMinutes) || 15;
        const rem = await Reminder.findOne({ _id: args.reminderId, user: userId });
        if (!rem) throw new Error('Reminder not found');

        rem.scheduledAt = new Date(Date.now() + snoozeMins * 60000);
        rem.status = 'scheduled';
        await rem.save();

        result = { reminderId: rem._id, snoozedUntil: rem.scheduledAt, message: `Reminder snoozed for ${snoozeMins} minutes.` };
        break;
      }

      case 'reschedule_reminder': {
        const rem = await Reminder.findOne({ _id: args.reminderId, user: userId });
        if (!rem) throw new Error('Reminder not found');

        rem.scheduledAt = parseNaturalDate(args.newScheduledAt);
        rem.status = 'scheduled';
        await rem.save();

        result = { reminderId: rem._id, newTime: rem.scheduledAt, message: `Reminder rescheduled.` };
        break;
      }

      case 'cancel_reminder': {
        await Reminder.findOneAndUpdate(
          { _id: args.reminderId, user: userId },
          { status: 'dismissed' }
        );
        result = { message: 'Reminder dismissed.' };
        break;
      }

      // =====================================================================
      // 7. MEMORY & JOURNAL
      // =====================================================================
      case 'save_memory': {
        const { content, category = 'general', importance = 3 } = args;
        if (!content) throw new Error('Memory content is required');

        const mem = await AssistantMemory.create({
          user: userId,
          content: content.trim(),
          category,
          importance: Math.min(5, Math.max(1, Number(importance))),
          source: 'explicit'
        });

        result = { memoryId: mem._id, content: mem.content, category: mem.category, message: `Remembered: "${mem.content}".` };
        break;
      }

      case 'search_memory': {
        const memories = await AssistantMemory.find({
          user: userId,
          content: { $regex: new RegExp(escapeRegex(args.query.trim()), 'i') }
        }).limit(10);

        result = {
          count: memories.length,
          memories: memories.map(m => ({ id: m._id, category: m.category, content: m.content }))
        };
        break;
      }

      case 'update_memory': {
        const mem = await AssistantMemory.findOneAndUpdate(
          { _id: args.memoryId, user: userId },
          { content: args.content.trim() },
          { new: true }
        );
        if (!mem) throw new Error('Memory not found');
        result = { memoryId: mem._id, content: mem.content, message: 'Memory updated.' };
        break;
      }

      case 'delete_memory': {
        const query = { user: userId };
        if (args.memoryId) query._id = args.memoryId;
        else if (args.query) query.content = new RegExp(escapeRegex(args.query.trim()), 'i');

        const deleted = await AssistantMemory.findOneAndDelete(query);
        result = { message: deleted ? 'Memory deleted.' : 'Memory not found.' };
        break;
      }

      case 'save_daily_note': {
        const dateStr = args.date || new Date().toISOString().slice(0, 10);
        let journal = await DailyJournal.findOne({ user: userId, date: dateStr });
        if (!journal) {
          journal = await DailyJournal.create({ user: userId, date: dateStr, content: args.content.trim() });
        } else {
          journal.content += `\n${args.content.trim()}`;
          await journal.save();
        }
        result = { date: dateStr, message: `Note saved to daily reflection for ${dateStr}.` };
        break;
      }

      // =====================================================================
      // 8. ANALYTICS, RECALL & UNDO
      // =====================================================================
      case 'get_daily_summary': {
        const dateStr = args.date || new Date().toISOString().slice(0, 10);
        const start = new Date(`${dateStr}T00:00:00.000Z`);
        const end = new Date(`${dateStr}T23:59:59.999Z`);

        const [tasksDone, tasksPending, habitsDone, habitsTotal, workSessions] = await Promise.all([
          Task.countDocuments({ user: userId, status: 'completed', completedAt: { $gte: start, $lte: end } }),
          Task.countDocuments({ user: userId, status: { $ne: 'completed' }, dueDate: { $gte: start, $lte: end } }),
          HabitCheckIn.countDocuments({ user: userId, date: dateStr, completed: true }),
          Habit.countDocuments({ user: userId, active: true }),
          WorkSession.find({ user: userId, startTime: { $gte: start, $lte: end }, status: 'completed' })
        ]);

        const totalMinutes = workSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

        result = {
          date: dateStr,
          completedTasks: tasksDone,
          pendingTasks: tasksPending,
          completedHabits: habitsDone,
          totalHabits: habitsTotal,
          focusHours: (totalMinutes / 60).toFixed(1),
          summary: `On ${dateStr}: ${tasksDone} tasks completed (${tasksPending} pending), ${habitsDone}/${habitsTotal} habits checked in, and ${(totalMinutes / 60).toFixed(1)} focus hours recorded.`
        };
        break;
      }

      case 'get_forgotten_items': {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        const [overdueTasks, activeHabits, todayCheckIns] = await Promise.all([
          Task.find({ user: userId, status: { $ne: 'completed' }, dueDate: { $lt: now } }).select('title dueDate priority').limit(5),
          Habit.find({ user: userId, active: true }).select('title'),
          HabitCheckIn.find({ user: userId, date: todayStr, completed: true }).select('habit')
        ]);

        const completedHabitIds = new Set(todayCheckIns.map(c => c.habit.toString()));
        const pendingHabits = activeHabits.filter(h => !completedHabitIds.has(h._id.toString())).map(h => h.title);

        result = {
          overdueTasksCount: overdueTasks.length,
          overdueTasks: overdueTasks.map(t => t.title),
          pendingHabitsCount: pendingHabits.length,
          pendingHabits,
          message: `You have ${overdueTasks.length} overdue tasks and ${pendingHabits.length} pending habits for today.`
        };
        break;
      }

      case 'undo_last_action': {
        let execution = null;
        if (args.executionId) {
          execution = await AssistantToolExecution.findOne({ _id: args.executionId, user: userId, isUndone: false });
        } else {
          execution = await AssistantToolExecution.findOne({
            user: userId,
            isUndone: false,
            undoData: { $ne: null }
          }).sort({ createdAt: -1 });
        }

        if (!execution || !execution.undoData) {
          result = { message: 'No reversible action found to undo.' };
          break;
        }

        const uData = execution.undoData;
        if (uData.action === 'delete_task') {
          await Task.deleteOne({ _id: uData.taskId });
          result = { message: 'Undid task creation: Task removed.' };
        } else if (uData.action === 'reopen_task') {
          await Task.updateOne({ _id: uData.taskId }, { status: 'pending', completedAt: null });
          result = { message: 'Undid task completion: Task reopened.' };
        } else if (uData.action === 'complete_task') {
          await Task.updateOne({ _id: uData.taskId }, { status: 'completed', completedAt: new Date() });
          result = { message: 'Undid task reopening: Task completed.' };
        } else if (uData.action === 'reschedule_task') {
          await Task.updateOne({ _id: uData.taskId }, { dueDate: uData.prevDueDate });
          result = { message: 'Undid task reschedule: Restored previous date.' };
        } else if (uData.action === 'restore_deleted_task') {
          await Task.create(uData.taskSnapshot);
          result = { message: `Undid deletion: Restored task "${uData.taskSnapshot.title}".` };
        } else if (uData.action === 'delete_goal') {
          await Goal.deleteOne({ _id: uData.goalId });
          result = { message: 'Undid goal creation: Goal removed.' };
        } else if (uData.action === 'restore_goal') {
          await Goal.updateOne({ _id: uData.goalId }, { status: 'active' });
          result = { message: 'Undid goal archive: Goal restored.' };
        } else if (uData.action === 'archive_goal') {
          await Goal.updateOne({ _id: uData.goalId }, { status: 'archived' });
          result = { message: 'Undid goal restore: Goal archived.' };
        } else if (uData.action === 'delete_milestone') {
          await GoalMilestone.deleteOne({ _id: uData.milestoneId });
          await GoalModule.deleteMany({ milestone: uData.milestoneId });
          result = { message: 'Undid milestone creation: Milestone removed.' };
        } else if (uData.action === 'reopen_module') {
          await GoalModule.updateOne({ _id: uData.moduleId }, { isCompleted: false, status: 'not_started', completedAt: null });
          result = { message: 'Undid module completion: Module reopened.' };
        } else if (uData.action === 'complete_module') {
          await GoalModule.updateOne({ _id: uData.moduleId }, { isCompleted: true, status: 'completed', completedAt: new Date() });
          result = { message: 'Undid module reopening: Module completed.' };
        } else if (uData.action === 'delete_module') {
          await GoalModule.deleteOne({ _id: uData.moduleId });
          result = { message: 'Undid module addition: Module deleted.' };
        } else if (uData.action === 'undo_habit_checkin') {
          await HabitCheckIn.deleteOne({ _id: uData.checkInId });
          await Habit.updateOne({ _id: uData.habitId }, { $inc: { currentStreak: -1 } });
          result = { message: 'Undid habit check-in.' };
        } else if (uData.action === 'delete_habit') {
          await Habit.deleteOne({ _id: uData.habitId });
          result = { message: 'Undid habit creation: Habit removed.' };
        } else if (uData.action === 'resume_habit') {
          await Habit.updateOne({ _id: uData.habitId }, { active: true });
          result = { message: 'Undid habit pause: Habit resumed.' };
        } else if (uData.action === 'pause_habit') {
          await Habit.updateOne({ _id: uData.habitId }, { active: false });
          result = { message: 'Undid habit resume: Habit paused.' };
        } else {
          result = { message: 'Undid previous action.' };
        }

        execution.isUndone = true;
        await execution.save();
        await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));
        break;
      }

      case 'confirm_pending_action': {
        const { confirmationToken } = args;
        const verified = confirmationService.verifyAndConsume({ userId, token: confirmationToken });
        if (!verified.valid) {
          throw new Error(verified.message);
        }

        // Re-execute authorized action with confirmed flag
        return await executeTool({
          userId,
          conversationId,
          toolName: verified.action,
          args: { ...verified.payload, confirmed: true }
        });
      }

      default:
        throw new Error(`Unsupported application tool: "${toolName}"`);
    }
  } catch (err) {
    errorMsg = err.message;
  }

  // 2. Persist tool execution record
  let executionRecord = null;
  try {
    executionRecord = await AssistantToolExecution.create({
      user: userId,
      conversationId,
      toolName,
      validatedArguments: args,
      idempotencyKey,
      executionStatus: errorMsg ? 'failed' : 'success',
      sanitizedResult: result,
      errorMessage: errorMsg,
      undoData,
      isUndone: false
    });
  } catch (e) {
    console.warn('[ToolExecutor] Failed to log tool execution:', e.message);
  }

  if (errorMsg) {
    return {
      success: false,
      toolName,
      error: errorMsg,
      executionId: executionRecord?._id
    };
  }

  if (result?.requiresConfirmation) {
    return {
      success: true,
      toolName,
      requiresConfirmation: true,
      confirmationToken: result.confirmationToken,
      preview: result.preview,
      result,
      executionId: executionRecord?._id
    };
  }

  return {
    success: true,
    toolName,
    result,
    executionId: executionRecord?._id
  };
};

/**
 * Natural date parser helper (e.g. "tomorrow", "next monday", "2026-11-25")
 */
function parseNaturalDate(input) {
  if (!input) return new Date();
  if (input instanceof Date) return input;
  const str = String(input).trim().toLowerCase();

  const now = new Date();
  if (str === 'today' || str === 'aaj') return now;
  if (str === 'tomorrow' || str === 'kal') {
    return new Date(now.getTime() + 86400000);
  }
  if (str === 'day after tomorrow' || str === 'parso') {
    return new Date(now.getTime() + 2 * 86400000);
  }

  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed;
  return now;
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export default executeTool;
