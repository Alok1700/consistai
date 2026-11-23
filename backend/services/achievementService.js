import Achievement from '../models/Achievement.js';
import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';

export const checkAndAwardAchievements = async ({ userId, goalId, milestoneId = null }) => {
  const newAchievements = [];
  try {
    const goal = await Goal.findOne({ _id: goalId, user: userId });
    if (!goal) return [];

    const milestones = await Milestone.find({ goal: goalId });
    const completedMilestones = milestones.filter(m => m.isCompleted);
    const tasks = await Task.find({ goal: goalId, user: userId });
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const progress = goal.currentProgressPercentage || 0;

    // Helper to safely create an achievement once
    const awardIfMissing = async ({ type, title, description, icon = 'Trophy', tier = 'silver', mId = null }) => {
      const query = {
        user: userId,
        goal: goalId,
        achievementType: type,
        milestone: mId || null
      };

      const existing = await Achievement.findOne(query);
      if (!existing) {
        try {
          const created = await Achievement.create({
            ...query,
            title,
            description,
            icon,
            tier,
            earnedAt: new Date(),
            celebrated: false
          });
          newAchievements.push(created);
        } catch (e) {
          // Ignore unique index collision gracefully
        }
      }
    };

    // 1. First Task Completed
    if (completedTasks.length >= 1) {
      await awardIfMissing({
        type: 'first_task_completed',
        title: 'First Action Taken',
        description: `Completed first execution task for "${goal.title}". The journey begins!`,
        icon: 'CheckCircle2',
        tier: 'bronze'
      });
    }

    // 2. Specific Milestone Completed
    if (milestoneId) {
      const targetMilestone = milestones.find(m => m._id.toString() === milestoneId.toString());
      if (targetMilestone && targetMilestone.isCompleted) {
        await awardIfMissing({
          type: 'milestone_completed',
          title: `Milestone Conquered: ${targetMilestone.title}`,
          description: `Successfully achieved all targets for milestone "${targetMilestone.title}".`,
          icon: 'Sparkles',
          tier: 'silver',
          mId: targetMilestone._id
        });
      }
    }

    // 3. First Milestone Completed
    if (completedMilestones.length >= 1) {
      await awardIfMissing({
        type: 'first_milestone_completed',
        title: 'Roadmap Breakthrough',
        description: `Finished your very first milestone in "${goal.title}". Momentum is building!`,
        icon: 'Flag',
        tier: 'silver'
      });
    }

    // 4. Progress 25%
    if (progress >= 25) {
      await awardIfMissing({
        type: 'progress_25',
        title: 'Quarterway Mark (25%)',
        description: `Achieved 25% verifiable progress on "${goal.title}".`,
        icon: 'TrendingUp',
        tier: 'bronze'
      });
    }

    // 5. Progress 50%
    if (progress >= 50) {
      await awardIfMissing({
        type: 'progress_50',
        title: 'Halfway Champion (50%)',
        description: `Passed the halfway threshold (50%) on "${goal.title}"! Over the hill!`,
        icon: 'Award',
        tier: 'silver'
      });
    }

    // 6. Progress 75%
    if (progress >= 75) {
      await awardIfMissing({
        type: 'progress_75',
        title: 'The Final Stretch (75%)',
        description: `Crossed 75% goal completion on "${goal.title}". The finish line is in sight!`,
        icon: 'Zap',
        tier: 'gold'
      });
    }

    // 7. Goal Completed (100%)
    if (progress >= 100) {
      await awardIfMissing({
        type: 'goal_completed',
        title: `Goal Achieved: ${goal.title}`,
        description: `100% verified completion reached! You conquered the entire roadmap.`,
        icon: 'Trophy',
        tier: 'platinum'
      });

      if (goal.status !== 'completed') {
        goal.status = 'completed';
        goal.completedAt = goal.completedAt || new Date();
        await goal.save();
      }
    }

    return newAchievements;
  } catch (error) {
    console.error('[AchievementService] Error checking achievements:', error.message);
    return [];
  }
};
