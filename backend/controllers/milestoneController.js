import Milestone from '../models/Milestone.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';
import { moduleService } from '../services/moduleService.js';

// Helper to recalculate goal progress from all active milestones
const recalculateGoalAndNotify = async ({ goalId, userId, triggeringMilestone = null, notes = '', date = null }) => {
  const goal = await Goal.findById(goalId);
  if (!goal) return { newGoalProgress: 0, delta: 0, event: null, newAchievements: [] };

  const prevGoalProgress = goal.currentProgressPercentage || 0;
  const allMilestones = await Milestone.find({ goal: goal._id });
  const activeMilestones = allMilestones.filter(m => m.status !== 'skipped');

  const totalWeight = activeMilestones.reduce((sum, m) => sum + (m.weight || 1), 0);
  const weightedCompleted = activeMilestones.reduce((sum, m) => {
    const w = m.weight || 1;
    const pct = m.progressPercentage || (m.isCompleted ? 100 : 0);
    return sum + (w * (pct / 100));
  }, 0);

  const newGoalProgress = totalWeight > 0 ? Number(Math.min(100, (weightedCompleted / totalWeight) * 100).toFixed(1)) : 0;
  const delta = Number((newGoalProgress - prevGoalProgress).toFixed(1));

  goal.currentProgressPercentage = newGoalProgress;
  goal.milestoneCount = allMilestones.length;
  if (newGoalProgress >= 100) {
    goal.status = 'completed';
    if (!goal.completedAt) goal.completedAt = new Date();
  } else if (goal.status === 'completed' && newGoalProgress < 100) {
    goal.status = 'active';
    goal.completedAt = null;
  }
  await goal.save();

  const todayStr = date || new Date().toISOString().slice(0, 10);
  let event = null;
  if (delta !== 0 || (triggeringMilestone && triggeringMilestone.isCompleted)) {
    event = await GoalProgressEvent.create({
      user: userId,
      goal: goal._id,
      milestone: triggeringMilestone ? triggeringMilestone._id : null,
      date: todayStr,
      previousProgress: prevGoalProgress,
      newProgress: newGoalProgress,
      progressDelta: delta,
      eventType: triggeringMilestone?.isCompleted ? 'milestone_completed' : 'milestone_advanced',
      notes: notes || `Goal progress updated to ${newGoalProgress}%`
    });

    await syncDailyAnalytics(userId, todayStr);
  }

  const newAchievements = await checkAndAwardAchievements({
    userId,
    goalId: goal._id,
    milestoneId: triggeringMilestone?.isCompleted ? triggeringMilestone._id : null
  });

  return { newGoalProgress, delta, event, newAchievements, goal };
};

export const addMilestone = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const { title, description, weight, targetQuantity, order, sequenceNumber } = req.body;

    const goal = await Goal.findOne({ _id: goalId, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    const currentCount = await Milestone.countDocuments({ goal: goal._id });
    const nextOrder = order || currentCount + 1;

    const milestone = await Milestone.create({
      goal: goal._id,
      user: req.user.id,
      title,
      description: description || '',
      weight: Number(weight || 1.0),
      targetQuantity: Number(targetQuantity || 1),
      order: Number(nextOrder),
      sequenceNumber: Number(sequenceNumber || nextOrder),
      status: 'not_started'
    });

    await Goal.findByIdAndUpdate(goal._id, { $inc: { milestoneCount: 1 } });

    res.status(201).json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
};

export const updateMilestone = async (req, res, next) => {
  try {
    const { achievedQuantity, isCompleted, title, description, weight, notes, date, status } = req.body;
    const milestone = await Milestone.findOne({ _id: req.params.id, user: req.user.id });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found.' });
    }

    if (title !== undefined) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (weight !== undefined) milestone.weight = Number(weight);
    if (notes !== undefined) milestone.notes = notes;

    if (achievedQuantity !== undefined) {
      milestone.achievedQuantity = Math.max(0, Number(achievedQuantity));
      if (milestone.targetQuantity > 0) {
        milestone.progressPercentage = Number(Math.min(100, (milestone.achievedQuantity / milestone.targetQuantity) * 100).toFixed(1));
        if (milestone.progressPercentage >= 100) {
          milestone.isCompleted = true;
          milestone.status = 'completed';
          milestone.completedAt = new Date();
        } else if (milestone.progressPercentage > 0) {
          milestone.isCompleted = false;
          milestone.status = 'in_progress';
          milestone.completedAt = null;
        } else {
          milestone.isCompleted = false;
          milestone.status = 'not_started';
          milestone.completedAt = null;
        }
      }
    }

    if (isCompleted !== undefined) {
      milestone.isCompleted = Boolean(isCompleted);
      if (milestone.isCompleted) {
        milestone.status = 'completed';
        milestone.progressPercentage = 100;
        milestone.achievedQuantity = milestone.targetQuantity;
        milestone.completedAt = new Date();
      } else {
        milestone.status = milestone.progressPercentage > 0 ? 'in_progress' : 'not_started';
        milestone.completedAt = null;
      }
    }

    if (status !== undefined) {
      milestone.status = status;
      if (status === 'completed') {
        milestone.isCompleted = true;
        milestone.progressPercentage = 100;
        milestone.achievedQuantity = milestone.targetQuantity;
        milestone.completedAt = new Date();
      } else if (status === 'not_started') {
        milestone.isCompleted = false;
        milestone.progressPercentage = 0;
        milestone.achievedQuantity = 0;
        milestone.completedAt = null;
      }
    }

    await milestone.save();

    const { newGoalProgress, delta, event, newAchievements } = await recalculateGoalAndNotify({
      goalId: milestone.goal,
      userId: req.user.id,
      triggeringMilestone: milestone,
      notes: notes || `Milestone '${milestone.title}' updated to ${milestone.progressPercentage}%`,
      date
    });

    res.json({
      success: true,
      milestone,
      goalProgress: newGoalProgress,
      progressDelta: delta,
      event,
      newAchievements
    });
  } catch (err) {
    next(err);
  }
};

export const updateMilestoneStatus = async (req, res, next) => {
  try {
    const { status, skipReason, notes, date } = req.body;
    const milestone = await Milestone.findOne({ _id: req.params.id, user: req.user.id });

    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found.' });
    }

    milestone.status = status;
    if (status === 'completed') {
      milestone.isCompleted = true;
      milestone.progressPercentage = 100;
      milestone.achievedQuantity = milestone.targetQuantity;
      milestone.completedAt = new Date();
      milestone.skipReason = '';
    } else if (status === 'not_started') {
      milestone.isCompleted = false;
      milestone.progressPercentage = 0;
      milestone.achievedQuantity = 0;
      milestone.completedAt = null;
      milestone.skipReason = '';
    } else if (status === 'in_progress') {
      milestone.isCompleted = false;
      if (milestone.progressPercentage === 0 || milestone.progressPercentage === 100) {
        milestone.progressPercentage = 50;
      }
      milestone.completedAt = null;
      milestone.skipReason = '';
    } else if (status === 'skipped') {
      milestone.isCompleted = false;
      milestone.progressPercentage = 0;
      milestone.completedAt = null;
      if (skipReason) milestone.skipReason = skipReason;
    }

    if (notes !== undefined) milestone.notes = notes;
    await milestone.save();

    const { newGoalProgress, delta, event, newAchievements, goal } = await recalculateGoalAndNotify({
      goalId: milestone.goal,
      userId: req.user.id,
      triggeringMilestone: milestone,
      notes: notes || `Milestone '${milestone.title}' marked ${status}`,
      date
    });

    res.json({
      success: true,
      milestone,
      goalProgress: newGoalProgress,
      progressDelta: delta,
      event,
      newAchievements,
      goal
    });
  } catch (err) {
    next(err);
  }
};

export const generateMilestones = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const { count, prefix = 'Module', wipeExisting = false, mode, forceTrim = false } = req.body;

    const goal = await Goal.findOne({ _id: goalId, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (wipeExisting) {
      await Milestone.deleteMany({ goal: goal._id, user: req.user.id });
    }

    const determinedMode = mode || (wipeExisting ? 'append' : 'append');

    const result = await moduleService.generateModuleSlots(goal._id, req.user.id, {
      count: Number(count || 10),
      mode: determinedMode,
      baseTitle: prefix,
      forceTrim
    });

    const updatedGoal = await Goal.findById(goal._id);

    res.status(201).json({
      success: true,
      message: `Generated modules successfully (${result.action})`,
      count: result.totalCount,
      milestones: result.modules,
      goalProgress: updatedGoal.currentProgressPercentage,
      goal: updatedGoal
    });
  } catch (err) {
    next(err);
  }
};

export const reorderMilestones = async (req, res, next) => {
  try {
    const { goalId, orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array required' });
    }
    const goal = await Goal.findOne({ _id: goalId, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    await Promise.all(
      orderedIds.map((id, index) =>
        Milestone.updateOne(
          { _id: id, goal: goal._id, user: req.user.id },
          { $set: { order: index + 1, sequenceNumber: index + 1 } }
        )
      )
    );

    const updated = await Milestone.find({ goal: goal._id }).sort({ order: 1 });
    res.json({ success: true, milestones: updated });
  } catch (err) {
    next(err);
  }
};

export const getMilestonesForGoal = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const goal = await Goal.findOne({ _id: goalId, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const milestones = await Milestone.find({ goal: goal._id }).sort({ order: 1, sequenceNumber: 1 });
    const milestonesWithTasks = await Promise.all(
      milestones.map(async (m) => {
        const tasks = await Task.find({ linkedMilestone: m._id }).sort({ dueDate: 1 });
        return {
          ...m.toObject(),
          tasks
        };
      })
    );

    res.json({ success: true, count: milestonesWithTasks.length, milestones: milestonesWithTasks });
  } catch (err) {
    next(err);
  }
};

export const addMilestoneTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, priority, estimatedMinutes, dueDate, taskType } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Task title is required' });
    }

    const milestone = await Milestone.findOne({ _id: id, user: req.user.id });
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    const task = await Task.create({
      user: req.user.id,
      goal: milestone.goal,
      linkedMilestone: milestone._id,
      title: title.trim(),
      priority: priority || 'medium',
      taskType: taskType || 'daily',
      dueDate: dueDate || new Date(),
      estimatedMinutes: Number(estimatedMinutes || 45),
      isGoalRelevant: true
    });

    await Goal.findByIdAndUpdate(milestone.goal, { $addToSet: { linkedTasks: task._id } });

    res.status(201).json({ success: true, task });
  } catch (err) {
    next(err);
  }
};

export const updateMilestoneNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const milestone = await Milestone.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { notes: notes || '' },
      { new: true }
    );
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });
    res.json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
};

export const addMilestoneResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, url, resourceType } = req.body;
    if (!title || !url) {
      return res.status(400).json({ success: false, message: 'Title and URL are required' });
    }
    const milestone = await Milestone.findOne({ _id: id, user: req.user.id });
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.resources.push({
      title: title.trim(),
      url: url.trim(),
      resourceType: resourceType || 'link'
    });
    await milestone.save();
    res.status(201).json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
};

export const deleteMilestoneResource = async (req, res, next) => {
  try {
    const { id, resourceId } = req.params;
    const milestone = await Milestone.findOne({ _id: id, user: req.user.id });
    if (!milestone) return res.status(404).json({ success: false, message: 'Milestone not found' });

    milestone.resources.pull(resourceId);
    await milestone.save();
    res.json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
};

export const deleteMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found.' });
    }

    await Task.updateMany({ linkedMilestone: milestone._id }, { $unset: { linkedMilestone: 1 } });

    const { newGoalProgress } = await recalculateGoalAndNotify({
      goalId: milestone.goal,
      userId: req.user.id
    });

    res.json({ success: true, message: 'Milestone removed.', goalProgress: newGoalProgress });
  } catch (err) {
    next(err);
  }
};

export const importModules = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const { text, items, modules, csvText, wipeExisting = false } = req.body;
    const goal = await Goal.findOne({ _id: goalId, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    let rawList = [];
    const candidateList = items || modules;
    if (Array.isArray(candidateList) && candidateList.length > 0) {
      rawList = candidateList.map((it) => (typeof it === 'string' ? { title: it.trim() } : it));
    } else if (text && typeof text === 'string') {
      rawList = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => ({ title: line.replace(/^\d+[\.\)\-:]\s*/, '') }));
    } else if (csvText && typeof csvText === 'string') {
      rawList = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split(',');
          return { title: parts[0]?.trim() || line, description: parts[1]?.trim() || '' };
        });
    }

    if (rawList.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid modules found to import' });
    }

    if (wipeExisting) {
      await Milestone.deleteMany({ goal: goal._id });
    }

    const startOrder = wipeExisting ? 1 : (await Milestone.countDocuments({ goal: goal._id })) + 1;
    const docs = rawList.map((item, idx) => {
      const order = startOrder + idx;
      const numStr = String(order).padStart(2, '0');
      const cleanTitle = item.title.startsWith('Module') ? item.title : `Module ${numStr}: ${item.title}`;
      return {
        goal: goal._id,
        user: req.user.id,
        title: cleanTitle,
        description: item.description || '',
        order,
        sequenceNumber: order,
        weight: 1.0,
        targetQuantity: 1,
        achievedQuantity: 0,
        progressPercentage: 0,
        isCompleted: false,
        status: 'not_started',
        estimatedEffort: item.estimatedEffort || '45 minutes'
      };
    });

    await Milestone.insertMany(docs);

    const totalCount = await Milestone.countDocuments({ goal: goal._id });
    goal.moduleCount = totalCount;
    goal.milestoneCount = totalCount;
    await goal.save();

    const { newGoalProgress, goal: updatedGoal } = await recalculateGoalAndNotify({
      goalId: goal._id,
      userId: req.user.id
    });

    const allMilestones = await Milestone.find({ goal: goal._id }).sort({ order: 1 });

    res.status(201).json({
      success: true,
      message: `Imported ${docs.length} modules successfully`,
      importedCount: docs.length,
      count: allMilestones.length,
      milestones: allMilestones,
      goalProgress: newGoalProgress,
      goal: updatedGoal
    });
  } catch (err) {
    next(err);
  }
};

export const bulkUpdateMilestones = async (req, res, next) => {
  try {
    const { milestoneIds, status, targetDate } = req.body;
    if (!Array.isArray(milestoneIds) || milestoneIds.length === 0) {
      return res.status(400).json({ success: false, message: 'milestoneIds array required' });
    }

    const updateFields = {};
    if (status) {
      updateFields.status = status;
      if (status === 'completed') {
        updateFields.isCompleted = true;
        updateFields.progressPercentage = 100;
        updateFields.completedAt = new Date();
      } else if (status === 'not_started') {
        updateFields.isCompleted = false;
        updateFields.progressPercentage = 0;
        updateFields.completedAt = null;
      } else if (status === 'in_progress') {
        updateFields.isCompleted = false;
        updateFields.progressPercentage = 50;
        updateFields.completedAt = null;
      }
    }
    if (targetDate) {
      updateFields.targetDate = new Date(targetDate);
    }

    await Milestone.updateMany(
      { _id: { $in: milestoneIds }, user: req.user.id },
      { $set: updateFields }
    );

    const sample = await Milestone.findById(milestoneIds[0]);
    if (sample) {
      await recalculateGoalAndNotify({
        goalId: sample.goal,
        userId: req.user.id
      });
    }

    res.json({ success: true, message: `Updated ${milestoneIds.length} modules successfully` });
  } catch (err) {
    next(err);
  }
};