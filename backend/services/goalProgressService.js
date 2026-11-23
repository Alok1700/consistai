import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import GoalMilestone from '../models/GoalMilestone.js';
import GoalModule from '../models/GoalModule.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import Achievement from '../models/Achievement.js';
import { checkAndAwardAchievements } from './achievementService.js';

/**
 * GoalProgressService — Single Source of Truth for Goal Progress Calculation
 * 
 * Rules:
 * - Module/Checklist goals: Progress = (Completed Required Modules / Total Required Modules) * 100
 * - Weighted Module goals: Progress = (Completed Required Weight / Total Required Weight) * 100
 * - Numerical goals: Progress = (Achieved Quantity / Target Quantity) * 100
 * - Progress is strictly clamped between 0 and 100.
 * - Skipped modules are excluded from required weight and count (never penalizing progress).
 * - Safe against division by zero (goals with 0 modules return 0%).
 * - Creates GoalProgressEvent records for audit and analytics.
 * - Reopens goal if status was completed but active incomplete work is added.
 */
export const goalProgressService = {
  /**
   * Calculate progress for a goal given its milestones or numerical state
   */
  calculateProgress(goal, milestones = []) {
    if (goal.progressType === 'numerical') {
      const target = Math.max(1, Number(goal.targetQuantity) || 100);
      const achieved = Math.max(0, Number(goal.achievedQuantity) || 0);
      const pct = (achieved / target) * 100;
      return Number(Math.min(100, Math.max(0, pct)).toFixed(1));
    }

    // For milestone_based and checklist
    const activeMilestones = milestones.filter(m => m.status !== 'skipped');
    if (activeMilestones.length === 0) {
      return 0;
    }

    const hasWeights = activeMilestones.some(m => m.weight && m.weight !== 1.0);

    if (hasWeights) {
      const totalWeight = activeMilestones.reduce((acc, m) => acc + (Number(m.weight) || 1.0), 0);
      if (totalWeight <= 0) return 0;

      const completedWeight = activeMilestones
        .filter(m => m.status === 'completed' || m.isCompleted)
        .reduce((acc, m) => acc + (Number(m.weight) || 1.0), 0);

      const pct = (completedWeight / totalWeight) * 100;
      return Number(Math.min(100, Math.max(0, pct)).toFixed(1));
    } else {
      // Unweighted equal proportion
      const totalCount = activeMilestones.length;
      const completedCount = activeMilestones.filter(m => m.status === 'completed' || m.isCompleted).length;
      const pct = (completedCount / totalCount) * 100;
      return Number(Math.min(100, Math.max(0, pct)).toFixed(1));
    }
  },

  /**
   * Recalculates goal progress canonically, persists it, emits progress event, and updates status
   */
  async recalculateGoalProgress(goalId, userId, options = {}) {
    const { source = 'system', notes = '', eventType = 'module_update', moduleId = null, idempotencyKey = null } = options;

    const goal = await Goal.findOne({ _id: goalId, user: userId });
    if (!goal) return null;

    // Check if goal uses the 3-level GoalMilestone / GoalModule hierarchy
    const goalMilestones = await GoalMilestone.find({ goal: goalId, user: userId });
    if (goalMilestones.length > 0) {
      const totalModules = await GoalModule.countDocuments({ goal: goalId, user: userId });
      const completedModules = await GoalModule.countDocuments({ goal: goalId, user: userId, isCompleted: true });

      let newProgress = 0;
      if (goal.progressCalculationMethod === 'weighted') {
        const totalWeight = goalMilestones.reduce((s, m) => s + (Number(m.weight) || 1), 0);
        const weightedProg = goalMilestones.reduce((s, m) => s + (Number(m.progressPercentage) || 0) * (Number(m.weight) || 1), 0);
        newProgress = totalWeight > 0 ? Number(Math.min(100, weightedProg / totalWeight).toFixed(1)) : 0;
      } else {
        newProgress = totalModules > 0 ? Number(Math.min(100, (completedModules / totalModules) * 100).toFixed(1)) : 0;
      }

      const previousProgress = goal.currentProgressPercentage || 0;
      let newStatus = goal.status;
      if (newProgress >= 100 && newStatus === 'active') {
        newStatus = 'completed';
        goal.completedAt = new Date();
      } else if (newProgress < 100 && newStatus === 'completed') {
        newStatus = 'active';
        goal.completedAt = null;
      }

      goal.currentProgressPercentage = newProgress;
      goal.status = newStatus;
      goal.moduleCount = totalModules;
      goal.milestoneCount = goalMilestones.length;
      await goal.save();

      return {
        goal,
        progressPercentage: newProgress,
        previousProgress,
        status: newStatus,
        newAchievements: []
      };
    }

    const milestones = await Milestone.find({ goal: goalId, user: userId }).sort({ order: 1 });
    const previousProgress = goal.currentProgressPercentage || 0;
    const newProgress = this.calculateProgress(goal, milestones);

    const oldStatus = goal.status;
    let newStatus = oldStatus;

    if (newProgress >= 100 && oldStatus === 'active') {
      newStatus = 'completed';
      goal.completedAt = new Date();
    } else if (newProgress < 100 && oldStatus === 'completed') {
      // Reopening completed goal because new incomplete work was added or module uncompleted
      newStatus = 'active';
      goal.completedAt = null;
    }

    goal.currentProgressPercentage = newProgress;
    goal.status = newStatus;
    goal.moduleCount = milestones.length;
    goal.milestoneCount = milestones.length;
    await goal.save();

    // Record GoalProgressEvent if progress changed or explicitly requested
    if (Math.abs(newProgress - previousProgress) >= 0.1 || options.forceEvent) {
      try {
        await GoalProgressEvent.create({
          user: userId,
          goal: goalId,
          milestone: moduleId,
          eventType,
          source,
          previousPercentage: previousProgress,
          newPercentage: newProgress,
          percentageDelta: Number((newProgress - previousProgress).toFixed(1)),
          notes,
          idempotencyKey: idempotencyKey || `${goalId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        });
      } catch (err) {
        // Ignore duplicate idempotencyKey silently
        if (err.code !== 11000) {
          console.warn('GoalProgressEvent recording warning:', err.message);
        }
      }
    }

    // Trigger gamification achievements
    let newAchievements = [];
    try {
      newAchievements = await checkAndAwardAchievements({ userId, goalId, milestoneId: moduleId });
    } catch (e) {
      console.warn('Achievement trigger warning:', e.message);
    }

    return {
      goal,
      progressPercentage: newProgress,
      previousProgress,
      status: newStatus,
      newAchievements
    };
  }
};
