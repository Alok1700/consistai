import GoalMilestone from '../models/GoalMilestone.js';
import GoalModule from '../models/GoalModule.js';
import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

/**
 * Recompute and save Goal.currentProgressPercentage and counts from its milestones and modules.
 * Method A (Default): Unweighted Module Proportion = Total Completed Modules / Total Required Modules * 100
 * Method B: Weighted Milestone Progress = Sum of (Milestone Progress * Milestone Weight) / Sum of Milestone Weights
 */
export async function updateGoalProgress(goalId, userId = null) {
  const goal = await Goal.findById(goalId);
  if (!goal) return 0;

  const milestones = await GoalMilestone.find({ goal: goalId });
  if (!milestones.length) {
    // If no milestone containers exist, check if legacy milestones exist
    const legacyMilestones = await Milestone.find({ goal: goalId });
    if (legacyMilestones.length > 0) {
      const completedLegacy = legacyMilestones.filter(m => m.isCompleted || m.status === 'completed').length;
      const legacyPct = Math.round((completedLegacy / legacyMilestones.length) * 100);
      goal.currentProgressPercentage = legacyPct;
      goal.moduleCount = legacyMilestones.length;
      goal.milestoneCount = legacyMilestones.length;
      await goal.save();
      return legacyPct;
    }
    return 0;
  }

  // Count total and completed modules across all milestone containers
  const totalModules = await GoalModule.countDocuments({ goal: goalId });
  const completedModules = await GoalModule.countDocuments({ goal: goalId, isCompleted: true });

  let goalProgress = 0;
  const isWeighted = goal.progressCalculationMethod === 'weighted';

  if (isWeighted) {
    const totalWeight = milestones.reduce((sum, m) => sum + (Number(m.weight) || 1), 0);
    const weightedProgress = milestones.reduce((sum, m) => {
      const w = Number(m.weight) || 1;
      return sum + (Number(m.progressPercentage) || 0) * w;
    }, 0);
    goalProgress = totalWeight > 0 ? Number(Math.min(100, weightedProgress / totalWeight).toFixed(1)) : 0;
  } else {
    // Method A: Unweighted module proportion (authoritative)
    goalProgress = totalModules > 0 ? Number(Math.min(100, (completedModules / totalModules) * 100).toFixed(1)) : 0;
  }

  const prevProgress = goal.currentProgressPercentage || 0;
  goal.currentProgressPercentage = goalProgress;
  goal.moduleCount = totalModules;
  goal.milestoneCount = milestones.length;

  if (goalProgress >= 100) {
    goal.status = 'completed';
    if (!goal.completedAt) goal.completedAt = new Date();
  } else if (goal.status === 'completed' && goalProgress < 100) {
    goal.status = 'active';
    goal.completedAt = null;
  }

  await goal.save();

  // Record audit progress event and daily analytics
  const targetUser = userId || goal.user;
  if (targetUser && Math.abs(goalProgress - prevProgress) >= 0.1) {
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      await GoalProgressEvent.create({
        user: targetUser,
        goal: goal._id,
        date: todayStr,
        previousProgress: prevProgress,
        newProgress: goalProgress,
        progressDelta: Number((goalProgress - prevProgress).toFixed(1)),
        eventType: goalProgress >= 100 ? 'milestone_completed' : 'milestone_advanced',
        notes: `Goal progress calculated at ${goalProgress}%`
      });
      await syncDailyAnalytics(targetUser, todayStr);
      await checkAndAwardAchievements({ userId: targetUser, goalId: goal._id });
    } catch (e) {
      // Non-fatal logging
    }
  }

  return goalProgress;
}

// GET /api/goals/:goalId/goal-milestones
export async function getMilestonesForGoal(req, res, next) {
  try {
    const { goalId } = req.params;
    const userId = req.user.id;

    let milestones = await GoalMilestone.find({ goal: goalId, user: userId }).sort({ order: 1 });

    // Auto-migration: If no GoalMilestone exists but legacy Milestone records exist, migrate them seamlessly
    if (milestones.length === 0) {
      const legacyMilestones = await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 });
      if (legacyMilestones.length > 0) {
        const defaultMilestone = await GoalMilestone.create({
          goal: goalId,
          user: userId,
          title: 'Milestone 1: Core Modules & Curriculum',
          description: 'Migrated coursework modules',
          order: 1,
          sequenceNumber: 1,
          weight: 1.0,
          moduleCount: legacyMilestones.length,
          completedModuleCount: legacyMilestones.filter(m => m.isCompleted).length,
          progressPercentage: Math.round((legacyMilestones.filter(m => m.isCompleted).length / legacyMilestones.length) * 100),
          status: legacyMilestones.every(m => m.isCompleted) ? 'completed' : (legacyMilestones.some(m => m.isCompleted) ? 'in_progress' : 'not_started')
        });

        const newModules = legacyMilestones.map((lm, idx) => ({
          goal: goalId,
          milestone: defaultMilestone._id,
          user: userId,
          title: lm.title,
          description: lm.description || '',
          order: lm.order || idx + 1,
          isCompleted: Boolean(lm.isCompleted),
          status: lm.isCompleted ? 'completed' : (lm.status || 'not_started'),
          completedAt: lm.completedAt || (lm.isCompleted ? new Date() : null),
          estimatedMinutes: 45,
          notes: lm.notes || ''
        }));

        await GoalModule.insertMany(newModules);
        milestones = [defaultMilestone];
      }
    }

    // Refresh and update cached module counts for each milestone
    const updated = await Promise.all(milestones.map(async (ms) => {
      const total = await GoalModule.countDocuments({ milestone: ms._id });
      const completed = await GoalModule.countDocuments({ milestone: ms._id, isCompleted: true });
      const progressPercentage = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

      let status = 'not_started';
      if (completed === total && total > 0) status = 'completed';
      else if (completed > 0) status = 'in_progress';

      if (
        ms.moduleCount !== total ||
        ms.completedModuleCount !== completed ||
        ms.progressPercentage !== progressPercentage ||
        ms.status !== status
      ) {
        ms.moduleCount = total;
        ms.completedModuleCount = completed;
        ms.progressPercentage = progressPercentage;
        ms.status = status;
        if (status === 'completed' && !ms.completedAt) ms.completedAt = new Date();
        else if (status !== 'completed') ms.completedAt = null;
        await ms.save();
      }
      return ms;
    }));

    const goalProgress = await updateGoalProgress(goalId, userId);

    res.json({
      success: true,
      count: updated.length,
      milestones: updated,
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/goals/:goalId/goal-milestones
export async function addGoalMilestone(req, res, next) {
  try {
    const { goalId } = req.params;
    const userId = req.user.id;
    const {
      title,
      description,
      weight,
      startDate,
      targetDate,
      moduleCount,
      moduleGenerationMethod,
      moduleNames
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Milestone title is required' });
    }

    const lastMs = await GoalMilestone.findOne({ goal: goalId }).sort({ order: -1 });
    const order = lastMs ? lastMs.order + 1 : 1;
    const sequenceNumber = order;

    const milestone = await GoalMilestone.create({
      goal: goalId,
      user: userId,
      title: title.trim(),
      description: description ? description.trim() : '',
      weight: Math.max(0.1, Number(weight) || 1.0),
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      order,
      sequenceNumber,
      moduleCount: 0,
      completedModuleCount: 0,
      progressPercentage: 0,
      status: 'not_started'
    });

    // Auto-generate module records under this milestone
    const count = parseInt(moduleCount, 10) || 0;
    let generatedModules = [];

    let namesArray = [];
    if (Array.isArray(moduleNames)) {
      namesArray = moduleNames.map(n => String(n).trim()).filter(Boolean);
    } else if (typeof moduleNames === 'string') {
      namesArray = moduleNames.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
    }

    const effectiveCount = Math.max(count, namesArray.length);

    if (effectiveCount > 0) {
      const moduleDocs = [];
      for (let i = 1; i <= effectiveCount; i++) {
        const padded = String(i).padStart(2, '0');
        const modTitle = namesArray[i - 1] || `Module ${padded}`;
        moduleDocs.push({
          goal: goalId,
          milestone: milestone._id,
          user: userId,
          title: modTitle,
          order: i,
          status: 'not_started',
          isCompleted: false,
          estimatedMinutes: 45
        });
      }
      generatedModules = await GoalModule.insertMany(moduleDocs);

      milestone.moduleCount = effectiveCount;
      milestone.completedModuleCount = 0;
      milestone.progressPercentage = 0;
      milestone.status = 'not_started';
      await milestone.save();
    }

    const goalProgress = await updateGoalProgress(goalId, userId);

    res.status(201).json({
      success: true,
      milestone,
      modules: generatedModules,
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/goal-milestones/:id
export async function getGoalMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const milestone = await GoalMilestone.findOne({ _id: id, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }
    res.json({ success: true, milestone });
  } catch (err) {
    next(err);
  }
}

// PUT /api/goal-milestones/:id
export async function updateGoalMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, weight, order, startDate, targetDate } = req.body;

    const milestone = await GoalMilestone.findOne({ _id: id, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    if (title !== undefined) milestone.title = title.trim();
    if (description !== undefined) milestone.description = description.trim();
    if (weight !== undefined) milestone.weight = Math.max(0.1, Number(weight) || 1.0);
    if (order !== undefined) milestone.order = Number(order);
    if (startDate !== undefined) milestone.startDate = startDate || null;
    if (targetDate !== undefined) milestone.targetDate = targetDate || null;

    await milestone.save();
    const goalProgress = await updateGoalProgress(milestone.goal, userId);

    res.json({ success: true, milestone, goalProgress });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/goal-milestones/:id
export async function deleteGoalMilestone(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const milestone = await GoalMilestone.findOne({ _id: id, user: userId });
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const goalId = milestone.goal;

    const modulesDeleted = await GoalModule.countDocuments({ milestone: id });
    const completedDeleted = await GoalModule.countDocuments({ milestone: id, isCompleted: true });

    await GoalModule.deleteMany({ milestone: id });
    await GoalMilestone.deleteOne({ _id: id });

    const goalProgress = await updateGoalProgress(goalId, userId);

    res.json({
      success: true,
      message: 'Milestone and all its modules deleted',
      modulesDeleted,
      completedDeleted,
      goalProgress
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/goal-milestones/reorder
export async function reorderGoalMilestones(req, res, next) {
  try {
    const userId = req.user.id;
    const { goalId, orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array required' });
    }

    await Promise.all(
      orderedIds.map((milestoneId, index) =>
        GoalMilestone.findOneAndUpdate(
          { _id: milestoneId, goal: goalId, user: userId },
          { order: index + 1, sequenceNumber: index + 1 },
          { new: true }
        )
      )
    );

    const updated = await GoalMilestone.find({ goal: goalId, user: userId }).sort({ order: 1 });
    res.json({ success: true, milestones: updated });
  } catch (err) {
    next(err);
  }
}

// GET /api/goal-milestones/:id/progress or /api/milestones/:id/progress
export async function getMilestoneProgress(req, res, next) {
  try {
    const { id } = req.params;
    const milestone = await GoalMilestone.findById(id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const total = await GoalModule.countDocuments({ milestone: id });
    const completed = await GoalModule.countDocuments({ milestone: id, isCompleted: true });
    const progressPct = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      milestoneId: id,
      title: milestone.title,
      totalModules: total,
      completedModules: completed,
      progressPercentage: progressPct,
      status: completed === total && total > 0 ? 'completed' : (completed > 0 ? 'in_progress' : 'not_started')
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/goals/:id/progress
export async function getGoalProgress(req, res, next) {
  try {
    const { id } = req.params;
    const goal = await Goal.findById(id);
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const milestones = await GoalMilestone.find({ goal: id }).sort({ order: 1 });
    const totalModules = await GoalModule.countDocuments({ goal: id });
    const completedModules = await GoalModule.countDocuments({ goal: id, isCompleted: true });

    const unweightedPct = totalModules > 0 ? Number(((completedModules / totalModules) * 100).toFixed(1)) : 0;

    const totalWeight = milestones.reduce((sum, m) => sum + (Number(m.weight) || 1), 0);
    const weightedProgress = milestones.reduce((sum, m) => {
      const w = Number(m.weight) || 1;
      return sum + (Number(m.progressPercentage) || 0) * w;
    }, 0);
    const weightedPct = totalWeight > 0 ? Number((weightedProgress / totalWeight).toFixed(1)) : 0;

    const authoritativePct = goal.progressCalculationMethod === 'weighted' ? weightedPct : unweightedPct;

    res.json({
      success: true,
      goalId: id,
      title: goal.title,
      progressPercentage: authoritativePct,
      unweightedProgressPercentage: unweightedPct,
      weightedProgressPercentage: weightedPct,
      totalModules,
      completedModules,
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'completed').length,
      calculationMethod: goal.progressCalculationMethod || 'unweighted',
      milestones: milestones.map(m => ({
        id: m._id,
        title: m.title,
        order: m.order,
        weight: m.weight,
        moduleCount: m.moduleCount,
        completedModuleCount: m.completedModuleCount,
        progressPercentage: m.progressPercentage,
        status: m.status
      }))
    });
  } catch (err) {
    next(err);
  }
}
