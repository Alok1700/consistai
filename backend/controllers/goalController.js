import mongoose from 'mongoose';
import Goal from '../models/Goal.js';
import GoalFolder from '../models/GoalFolder.js';
import Milestone from '../models/Milestone.js';
import GoalMilestone from '../models/GoalMilestone.js';
import GoalModule from '../models/GoalModule.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import Achievement from '../models/Achievement.js';
import User from '../models/User.js';
import { GOAL_TEMPLATES } from '../data/goalTemplates.js';
import { mlClient } from '../services/mlClient.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';
import { pacingService } from '../services/pacingService.js';
import { goalProgressService } from '../services/goalProgressService.js';

export const createGoal = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      folder,
      folderId,
      color,
      icon,
      startDate,
      targetDate,
      priority,
      targetOutcome,
      measurementUnit,
      progressType,
      moduleCount,
      milestoneCount,
      targetQuantity,
      imageUrl,
      yearlyTargets,
      dailyTasks,
      weeklyTasks,
      monthlyTasks,
      milestones: initialMilestones,
      linkedHabits
    } = req.body;

    // Resolve folder if specified
    let resolvedFolder = folder || 'General';
    let resolvedFolderId = folderId || null;

    if (folderId) {
      const folderDoc = await GoalFolder.findOne({ _id: folderId, user: req.user.id });
      if (folderDoc) {
        resolvedFolder = folderDoc.name;
        resolvedFolderId = folderDoc._id;
      }
    } else if (folder) {
      const folderDoc = await GoalFolder.findOne({ name: folder, user: req.user.id });
      if (folderDoc) {
        resolvedFolderId = folderDoc._id;
      }
    }

    const calculatedModuleCount = Number(moduleCount || milestoneCount || 0);

    const goal = await Goal.create({
      user: req.user.id,
      title,
      description,
      category: category || 'DSA & Coding',
      folder: resolvedFolder,
      folderId: resolvedFolderId,
      color: color || '#7C3AED',
      icon: icon || 'Target',
      startDate: startDate || new Date(),
      targetDate,
      priority: priority || 'high',
      targetOutcome: targetOutcome || '',
      measurementUnit: measurementUnit || 'Problems',
      progressType: progressType || 'milestone_based',
      moduleCount: calculatedModuleCount,
      milestoneCount: calculatedModuleCount,
      targetQuantity: targetQuantity || (calculatedModuleCount > 0 ? calculatedModuleCount : 100),
      imageUrl: imageUrl || '',
      yearlyTargets: Array.isArray(yearlyTargets) ? yearlyTargets : [],
      achievedQuantity: 0,
      currentProgressPercentage: 0,
      linkedHabits: linkedHabits || []
    });

    // Create initial tasks (daily, weekly, monthly) if provided
    const createdTaskIds = [];
    if (dailyTasks && Array.isArray(dailyTasks)) {
      for (const t of dailyTasks) {
        const titleStr = typeof t === 'string' ? t.trim() : t.title?.trim();
        if (titleStr) {
          const newTask = await Task.create({
            user: req.user.id,
            goal: goal._id,
            title: titleStr,
            priority: t.priority || priority || 'medium',
            taskType: 'daily',
            dueDate: new Date(),
            estimatedMinutes: Number(t.estimatedMinutes || 45),
            isGoalRelevant: true
          });
          createdTaskIds.push(newTask._id);
        }
      }
    }

    if (weeklyTasks && Array.isArray(weeklyTasks)) {
      for (const t of weeklyTasks) {
        const titleStr = typeof t === 'string' ? t.trim() : t.title?.trim();
        if (titleStr) {
          const newTask = await Task.create({
            user: req.user.id,
            goal: goal._id,
            title: titleStr,
            priority: t.priority || priority || 'medium',
            taskType: 'weekly',
            dueDate: new Date(Date.now() + 7 * 86400000),
            estimatedMinutes: Number(t.estimatedMinutes || 90),
            isGoalRelevant: true
          });
          createdTaskIds.push(newTask._id);
        }
      }
    }

    if (monthlyTasks && Array.isArray(monthlyTasks)) {
      for (const t of monthlyTasks) {
        const titleStr = typeof t === 'string' ? t.trim() : t.title?.trim();
        if (titleStr) {
          const newTask = await Task.create({
            user: req.user.id,
            goal: goal._id,
            title: titleStr,
            priority: t.priority || priority || 'medium',
            taskType: 'monthly',
            dueDate: new Date(Date.now() + 30 * 86400000),
            estimatedMinutes: Number(t.estimatedMinutes || 180),
            isGoalRelevant: true
          });
          createdTaskIds.push(newTask._id);
        }
      }
    }

    if (createdTaskIds.length > 0) {
      await Goal.findByIdAndUpdate(goal._id, { $addToSet: { linkedTasks: { $each: createdTaskIds } } });
    }

    // Milestone Generation: Multi-milestone containers or legacy slots
    if (initialMilestones && Array.isArray(initialMilestones) && initialMilestones.length > 0) {
      // Check if items are milestone containers (contain moduleCount or modules or name)
      const hasMilestoneContainers = initialMilestones.some(m => m.moduleCount !== undefined || m.name !== undefined);

      if (hasMilestoneContainers) {
        let totalCreatedModules = 0;
        const legacyMilestoneDocs = [];

        for (let idx = 0; idx < initialMilestones.length; idx++) {
          const m = initialMilestones[idx];
          const mTitle = m.title || m.name || `Milestone ${idx + 1}`;
          const mWeight = Math.max(0.1, Number(m.weight) || 1.0);
          const mCount = Math.max(0, parseInt(m.moduleCount, 10) || 0);

          const goalMilestone = await GoalMilestone.create({
            goal: goal._id,
            user: req.user.id,
            title: mTitle,
            description: m.description || '',
            weight: mWeight,
            order: idx + 1,
            sequenceNumber: idx + 1,
            startDate: m.startDate ? new Date(m.startDate) : undefined,
            targetDate: (m.targetDate || m.deadline) ? new Date(m.targetDate || m.deadline) : undefined,
            moduleCount: mCount,
            completedModuleCount: 0,
            progressPercentage: 0,
            status: 'not_started'
          });

          // Generate modules under this milestone
          let names = [];
          if (Array.isArray(m.moduleNames)) {
            names = m.moduleNames.map(n => String(n).trim()).filter(Boolean);
          } else if (typeof m.moduleNames === 'string') {
            names = m.moduleNames.split(/\r?\n/).map(n => n.trim()).filter(Boolean);
          }

          const effectiveCount = Math.max(mCount, names.length);
          if (effectiveCount > 0) {
            const moduleDocs = [];
            for (let i = 1; i <= effectiveCount; i++) {
              const padded = String(i).padStart(2, '0');
              const modTitle = names[i - 1] || `Module ${padded}`;
              moduleDocs.push({
                goal: goal._id,
                milestone: goalMilestone._id,
                user: req.user.id,
                title: modTitle,
                order: i,
                status: 'not_started',
                isCompleted: false,
                estimatedMinutes: 45
              });

              legacyMilestoneDocs.push({
                goal: goal._id,
                user: req.user.id,
                title: `${mTitle} - ${modTitle}`,
                order: totalCreatedModules + i,
                sequenceNumber: totalCreatedModules + i,
                weight: mWeight,
                targetQuantity: 1,
                achievedQuantity: 0,
                progressPercentage: 0,
                isCompleted: false,
                status: 'not_started'
              });
            }
            await GoalModule.insertMany(moduleDocs);
            totalCreatedModules += effectiveCount;
          }
        }

        if (legacyMilestoneDocs.length > 0) {
          await Milestone.insertMany(legacyMilestoneDocs);
        }

        goal.moduleCount = totalCreatedModules;
        goal.milestoneCount = initialMilestones.length;
        await goal.save();
      } else {
        // Flat checklist or legacy milestones
        const milestoneDocs = initialMilestones.map((m, idx) => ({
          goal: goal._id,
          user: req.user.id,
          title: m.title || m.name || `Item ${idx + 1}`,
          description: m.description || '',
          order: m.order || idx + 1,
          sequenceNumber: m.sequenceNumber || idx + 1,
          weight: Number(m.weight || 1.0),
          targetQuantity: Number(m.targetQuantity || 1),
          achievedQuantity: m.isCompleted ? Number(m.targetQuantity || 1) : (m.achievedQuantity || 0),
          progressPercentage: m.isCompleted ? 100 : (m.progressPercentage || 0),
          isCompleted: Boolean(m.isCompleted),
          status: m.status || (m.isCompleted ? 'completed' : 'not_started'),
          notes: m.notes || '',
          resources: Array.isArray(m.resources) ? m.resources : []
        }));
        await Milestone.insertMany(milestoneDocs);
        await Goal.findByIdAndUpdate(goal._id, { milestoneCount: milestoneDocs.length });

        // Also create a default GoalMilestone and GoalModules
        const defaultContainer = await GoalMilestone.create({
          goal: goal._id,
          user: req.user.id,
          title: 'Milestone 1: Tasks & Modules',
          order: 1,
          sequenceNumber: 1,
          weight: 1.0,
          moduleCount: milestoneDocs.length,
          completedModuleCount: milestoneDocs.filter(m => m.isCompleted).length,
          progressPercentage: milestoneDocs.length > 0 ? Math.round((milestoneDocs.filter(m => m.isCompleted).length / milestoneDocs.length) * 100) : 0,
          status: milestoneDocs.every(m => m.isCompleted) ? 'completed' : (milestoneDocs.some(m => m.isCompleted) ? 'in_progress' : 'not_started')
        });

        const newModules = milestoneDocs.map((lm, idx) => ({
          goal: goal._id,
          milestone: defaultContainer._id,
          user: req.user.id,
          title: lm.title,
          description: lm.description || '',
          order: idx + 1,
          isCompleted: Boolean(lm.isCompleted),
          status: lm.isCompleted ? 'completed' : 'not_started',
          estimatedMinutes: 45
        }));
        await GoalModule.insertMany(newModules);
      }
    } else if (calculatedModuleCount > 0) {
      // Automatically generate exactly N milestone/module slots
      const unitPrefix = measurementUnit === 'Modules' ? 'Module' : (measurementUnit === 'Chapters' ? 'Chapter' : 'Milestone');
      const milestoneDocs = [];
      for (let i = 1; i <= calculatedModuleCount; i++) {
        milestoneDocs.push({
          goal: goal._id,
          user: req.user.id,
          title: `${unitPrefix} ${String(i).padStart(2, '0')}`,
          description: `${unitPrefix} ${i} of ${calculatedModuleCount} for ${title}`,
          order: i,
          sequenceNumber: i,
          weight: 1.0,
          targetQuantity: 1,
          achievedQuantity: 0,
          progressPercentage: 0,
          isCompleted: false,
          status: 'not_started',
          notes: ''
        });
      }
      await Milestone.insertMany(milestoneDocs);

      // Also create GoalMilestone container and GoalModules
      const defaultContainer = await GoalMilestone.create({
        goal: goal._id,
        user: req.user.id,
        title: `Milestone 1: ${title} Syllabus`,
        order: 1,
        sequenceNumber: 1,
        weight: 1.0,
        moduleCount: calculatedModuleCount,
        completedModuleCount: 0,
        progressPercentage: 0,
        status: 'not_started'
      });

      const moduleDocs = [];
      for (let i = 1; i <= calculatedModuleCount; i++) {
        moduleDocs.push({
          goal: goal._id,
          milestone: defaultContainer._id,
          user: req.user.id,
          title: `${unitPrefix} ${String(i).padStart(2, '0')}`,
          order: i,
          status: 'not_started',
          isCompleted: false,
          estimatedMinutes: 45
        });
      }
      await GoalModule.insertMany(moduleDocs);
    }

    const fullGoal = await Goal.findById(goal._id);
    res.status(201).json({ success: true, goal: fullGoal });
  } catch (err) {
    next(err);
  }
};

export const getGoals = async (req, res, next) => {
  try {
    const {
      folderId,
      folder,
      category,
      status,
      isFavorite,
      isArchived,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = { user: req.user.id };

    if (folderId && folderId !== 'all') {
      filter.folderId = folderId;
    } else if (folder && folder !== 'All Folders' && folder !== 'all') {
      filter.folder = folder;
    }

    if (category && category !== 'all' && category !== 'All Categories') {
      filter.category = category;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (isFavorite !== undefined && isFavorite !== '') {
      filter.isFavorite = isFavorite === 'true' || isFavorite === true;
    }

    if (isArchived !== undefined && isArchived !== '') {
      filter.isArchived = isArchived === 'true' || isArchived === true;
    } else {
      filter.isArchived = { $ne: true };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const goals = await Goal.find(filter)
      .populate('linkedHabits', 'title category currentStreak')
      .populate('folderId', 'name color icon parentFolderId')
      .sort(sortOptions);

    const goalsWithStats = await Promise.all(goals.map(async (g) => {
      const milestones = await Milestone.find({ goal: g._id }).sort({ order: 1 });
      let totalMilestones = milestones.length;
      let completedMilestones = milestones.filter(m => m.isCompleted || m.status === 'completed').length;

      if (totalMilestones === 0) {
        const modTotal = await GoalModule.countDocuments({ goal: g._id });
        if (modTotal > 0) {
          totalMilestones = modTotal;
          completedMilestones = await GoalModule.countDocuments({ goal: g._id, isCompleted: true });
        }
      }

      // Cadence task statistics
      const tasks = await Task.find({ goal: g._id });
      const dailyTasks = tasks.filter(t => t.taskType === 'daily');
      const weeklyTasks = tasks.filter(t => t.taskType === 'weekly');
      const monthlyTasks = tasks.filter(t => t.taskType === 'monthly');
      const yearlyTasks = tasks.filter(t => t.taskType === 'yearly');
      const yTargets = g.yearlyTargets || [];

      const taskStats = {
        daily: {
          total: dailyTasks.length,
          completed: dailyTasks.filter(t => t.status === 'completed').length
        },
        weekly: {
          total: weeklyTasks.length,
          completed: weeklyTasks.filter(t => t.status === 'completed').length
        },
        monthly: {
          total: monthlyTasks.length,
          completed: monthlyTasks.filter(t => t.status === 'completed').length
        },
        yearly: {
          total: yTargets.length + yearlyTasks.length,
          completed: yTargets.filter(y => y.isAchieved).length + yearlyTasks.filter(t => t.status === 'completed').length
        }
      };

      // Calculate pacing
      let pacingData = null;
      try {
        pacingData = await mlClient.runGoalProgress({
          start_date: g.startDate.toISOString().slice(0, 10),
          target_date: g.targetDate.toISOString().slice(0, 10),
          progress_type: g.progressType,
          target_quantity: g.targetQuantity,
          achieved_quantity: g.achievedQuantity,
          milestones: milestones.map(m => ({
            id: m._id.toString(),
            title: m.title,
            weight: m.weight,
            target_quantity: m.targetQuantity,
            achieved_quantity: m.achievedQuantity,
            is_completed: m.isCompleted,
            progress_percentage: m.progressPercentage
          }))
        });
      } catch (e) {
        // Fallback pacing calculation if ML service offline
        const totalDays = Math.max(1, Math.round((new Date(g.targetDate) - new Date(g.startDate)) / (1000 * 60 * 60 * 24)));
        const daysElapsed = Math.max(0, Math.round((new Date() - new Date(g.startDate)) / (1000 * 60 * 60 * 24)));
        const elapsedPct = Number(Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100)).toFixed(1));
        const progressGap = Number((g.currentProgressPercentage - elapsedPct).toFixed(1));
        pacingData = {
          actual_goal_progress_pct: g.currentProgressPercentage,
          elapsed_time_pct: elapsedPct,
          progress_gap_pct: progressGap,
          pacing_status: progressGap >= 0 ? 'on_pace' : (progressGap >= -10 ? 'mild_deficit' : 'critical_deficit'),
          pacing_label: `${progressGap}% pacing gap`
        };
      }

      // Find next module to work on
      const nextMod = milestones.find(m => !m.isCompleted && m.status !== 'completed' && m.status !== 'skipped');

      return {
        ...g.toObject(),
        milestones,
        milestoneStats: {
          total: totalMilestones,
          completed: completedMilestones
        },
        nextModule: nextMod ? {
          _id: nextMod._id,
          title: nextMod.title,
          sequenceNumber: nextMod.sequenceNumber || nextMod.order,
          estimatedEffort: nextMod.estimatedEffort || '45 minutes'
        } : null,
        taskStats,
        pacing: pacingData
      };
    }));

    // Compute compact metrics
    const activeGoals = goalsWithStats.filter(g => g.status === 'active' && !g.isArchived);
    const completedGoals = goalsWithStats.filter(g => g.status === 'completed' && !g.isArchived);
    const completedModulesCount = goalsWithStats.reduce((sum, g) => sum + (g.milestoneStats?.completed || 0), 0);
    const onTrackGoals = goalsWithStats.filter(g => {
      const ps = g.pacing?.pacing_status;
      return ps === 'ahead' || ps === 'on_pace';
    });

    const compactMetrics = {
      activeGoalsCount: activeGoals.length,
      completedGoalsCount: completedGoals.length,
      completedModulesCount,
      onTrackGoalsCount: onTrackGoals.length
    };

    // Find Continue Where You Left Off goal
    let continueGoal = null;
    const primaryCandidate = goalsWithStats.find(g => g.isPrimaryGoal && g.status === 'active' && !g.isArchived)
      || activeGoals[0]
      || goalsWithStats[0];

    if (primaryCandidate) {
      const nextMod = (primaryCandidate.milestones || []).find(m => !m.isCompleted && m.status !== 'completed' && m.status !== 'skipped');
      const now = new Date();
      const targetD = new Date(primaryCandidate.targetDate);
      const remainingDays = Math.max(0, Math.ceil((targetD - now) / (1000 * 60 * 60 * 24)));
      const isOverdue = targetD < now && primaryCandidate.status !== 'completed';

      continueGoal = {
        goalId: primaryCandidate._id,
        title: primaryCandidate.title,
        category: primaryCandidate.category,
        folder: primaryCandidate.folder,
        currentProgressPercentage: primaryCandidate.currentProgressPercentage,
        completedModules: primaryCandidate.milestoneStats?.completed || 0,
        totalModules: primaryCandidate.milestoneStats?.total || 0,
        remainingDays,
        isOverdue,
        nextModule: nextMod ? {
          _id: nextMod._id,
          title: nextMod.title,
          sequenceNumber: nextMod.sequenceNumber || nextMod.order,
          estimatedEffort: nextMod.estimatedEffort || '45 minutes'
        } : null
      };
    }

    res.json({
      success: true,
      count: goalsWithStats.length,
      goals: goalsWithStats,
      compactMetrics,
      continueGoal
    });
  } catch (err) {
    next(err);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id })
      .populate('linkedHabits')
      .populate('linkedTasks');

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    const milestones = await Milestone.find({ goal: goal._id }).sort({ order: 1 });
    const progressEvents = await GoalProgressEvent.find({ goal: goal._id }).sort({ createdAt: -1 });
    const tasks = await Task.find({ goal: goal._id }).sort({ dueDate: 1, priority: -1 });

    let pacingData = null;
    let mlServiceOnline = true;
    try {
      pacingData = await mlClient.runGoalProgress({
        start_date: goal.startDate.toISOString().slice(0, 10),
        target_date: goal.targetDate.toISOString().slice(0, 10),
        progress_type: goal.progressType,
        target_quantity: goal.targetQuantity,
        achieved_quantity: goal.achievedQuantity,
        milestones: milestones.map(m => ({
          id: m._id.toString(),
          title: m.title,
          weight: m.weight,
          target_quantity: m.targetQuantity,
          achieved_quantity: m.achievedQuantity,
          is_completed: m.isCompleted,
          progress_percentage: m.progressPercentage
        }))
      });
    } catch (e) {
      mlServiceOnline = false;
      const totalDur = Math.max(1, Math.round((new Date(goal.targetDate) - new Date(goal.startDate)) / (1000 * 60 * 60 * 24)));
      const daysEl = Math.max(0, Math.round((new Date() - new Date(goal.startDate)) / (1000 * 60 * 60 * 24)));
      const daysRem = Math.max(0, Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)));
      const elPct = Number(Math.min(100, Math.max(0, (daysEl / totalDur) * 100)).toFixed(1));
      const gapPct = Number((goal.currentProgressPercentage - elPct).toFixed(1));
      pacingData = {
        elapsed_time_pct: elPct,
        days_elapsed: daysEl,
        days_remaining: daysRem,
        total_duration_days: totalDur,
        progress_gap_pct: gapPct,
        pacing_status: gapPct >= 0 ? 'on_track' : 'behind_schedule',
        average_daily_progress: daysEl > 0 ? Number((goal.currentProgressPercentage / daysEl).toFixed(2)) : 0,
        required_daily_progress_to_finish: daysRem > 0 ? Number(((100 - goal.currentProgressPercentage) / daysRem).toFixed(2)) : 0,
        pacing_interpretation: 'Pacing calculated via local deterministic fallback (ML microservice offline).',
        is_fallback: true
      };
    }

    const achievements = await Achievement.find({ goal: goal._id, user: req.user.id }).sort({ earnedAt: -1 });

    // Level 2 Intelligence: Next Module, Eligible Working Days & Workload via central PacingService
    const nextModule = milestones.find(m => !m.isCompleted && m.status !== 'completed' && m.status !== 'skipped') || null;
    const deterministicPacing = pacingService.calculateGoalPacing(goal, milestones, req.user?.preferences || {});

    res.json({
      success: true,
      goal: {
        ...goal.toObject(),
        milestones,
        progressEvents,
        tasks,
        achievements,
        pacing: pacingData || deterministicPacing,
        intelligence: {
          nextModule: nextModule ? {
            _id: nextModule._id,
            title: nextModule.title,
            sequenceNumber: nextModule.sequenceNumber || nextModule.order,
            estimatedEffort: nextModule.estimatedEffort || '45 minutes',
            description: nextModule.description
          } : null,
          remainingDays: deterministicPacing.days_remaining,
          isOverdue: deterministicPacing.is_overdue,
          overdueDays: deterministicPacing.overdue_days,
          totalEligibleDays: deterministicPacing.total_eligible_days,
          remainingEligibleDays: deterministicPacing.remaining_eligible_days,
          daysPerModule: deterministicPacing.days_per_module,
          bufferDays: deterministicPacing.buffer_days,
          incompleteModulesCount: deterministicPacing.incomplete_modules_count,
          suggestedDailyWorkload: deterministicPacing.suggested_daily_workload,
          actionableRecommendation: deterministicPacing.actionable_recommendation,
          bufferExplanation: deterministicPacing.buffer_explanation,
          restDaysPolicy: deterministicPacing.work_schedule_policy,
          pacingGap: deterministicPacing.progress_gap_pct,
          calculatedPacingStatus: deterministicPacing.pacing_status,
          mlServiceOnline
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    await User.findByIdAndUpdate(req.user.id, { 'preferences.primaryGoalId': goal._id });

    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    await Milestone.deleteMany({ goal: goal._id });
    await GoalProgressEvent.deleteMany({ goal: goal._id });
    await Task.updateMany({ goal: goal._id }, { $unset: { goal: 1, linkedMilestone: 1 } });
    await Habit.updateMany({ linkedGoals: goal._id }, { $pull: { linkedGoals: goal._id } });

    res.json({ success: true, message: 'Goal deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

export const recordNumericalProgress = async (req, res, next) => {
  try {
    const { quantityAdded, notes, date } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    const previousProgress = goal.currentProgressPercentage;
    const newAchieved = Math.max(0, (goal.achievedQuantity || 0) + Number(quantityAdded));
    const target = goal.targetQuantity || 100;
    const newProgress = Number(Math.min(100, (newAchieved / target) * 100).toFixed(1));
    const delta = Number((newProgress - previousProgress).toFixed(1));

    goal.achievedQuantity = newAchieved;
    goal.currentProgressPercentage = newProgress;
    if (newProgress >= 100) goal.status = 'completed';
    await goal.save();

    const todayStr = date || new Date().toISOString().slice(0, 10);
    const event = await GoalProgressEvent.create({
      user: req.user.id,
      goal: goal._id,
      date: todayStr,
      previousProgress,
      newProgress,
      progressDelta: delta,
      eventType: 'quantity_incremented',
      quantityAdded: Number(quantityAdded),
      notes: notes || `Recorded +${quantityAdded} ${goal.measurementUnit}`
    });

    await syncDailyAnalytics(req.user.id, todayStr);

    const newAchievements = await checkAndAwardAchievements({
      userId: req.user.id,
      goalId: goal._id
    });

    res.json({ success: true, goal, event, newAchievements });
  } catch (err) {
    next(err);
  }
};

export const addYearlyTarget = async (req, res, next) => {
  try {
    const { target, targetDate } = req.body;
    if (!target || !target.trim()) {
      return res.status(400).json({ success: false, message: 'Target description is required.' });
    }
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }
    goal.yearlyTargets.push({
      target: target.trim(),
      targetDate: targetDate || new Date(new Date().getFullYear(), 11, 31),
      isAchieved: false
    });
    await goal.save();
    res.status(201).json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const toggleYearlyTarget = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }
    const yTarget = goal.yearlyTargets.id(req.params.targetId);
    if (!yTarget) {
      return res.status(404).json({ success: false, message: 'Yearly target not found.' });
    }
    yTarget.isAchieved = !yTarget.isAchieved;
    yTarget.achievedAt = yTarget.isAchieved ? new Date() : null;
    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const deleteYearlyTarget = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }
    goal.yearlyTargets.pull(req.params.targetId);
    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const setPrimaryGoal = async (req, res, next) => {
  try {
    // Unset primary from all goals of user
    await Goal.updateMany({ user: req.user.id }, { isPrimaryGoal: false });

    // Set primary on this goal
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isPrimaryGoal: true },
      { new: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    await User.findByIdAndUpdate(req.user.id, { 'preferences.primaryGoalId': goal._id });

    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const completeGoalWithReflection = async (req, res, next) => {
  try {
    const { reflectionNote } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found.' });
    }

    goal.status = 'completed';
    goal.currentProgressPercentage = 100;
    goal.completedAt = new Date();
    if (reflectionNote) {
      goal.reflectionNote = reflectionNote.trim();
    }
    await goal.save();

    const newAchievements = await checkAndAwardAchievements({
      userId: req.user.id,
      goalId: goal._id
    });

    res.json({
      success: true,
      message: 'Goal marked completed! Congratulations on conquering your roadmap.',
      goal,
      newAchievements
    });
  } catch (err) {
    next(err);
  }
};

export const moveGoal = async (req, res, next) => {
  try {
    const { folderId, folder } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (folderId) {
      const folderDoc = await GoalFolder.findOne({ _id: folderId, user: req.user.id });
      if (folderDoc) {
        goal.folderId = folderDoc._id;
        goal.folder = folderDoc.name;
      }
    } else if (folder) {
      goal.folder = folder;
      const folderDoc = await GoalFolder.findOne({ name: folder, user: req.user.id });
      if (folderDoc) goal.folderId = folderDoc._id;
    }
    await goal.save();
    res.json({ success: true, goal });
  } catch (err) {
    next(err);
  }
};

export const toggleFavoriteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    goal.isFavorite = !goal.isFavorite;
    await goal.save();
    res.json({ success: true, isFavorite: goal.isFavorite, goal });
  } catch (err) {
    next(err);
  }
};

export const toggleArchiveGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    goal.isArchived = !goal.isArchived;
    if (goal.isArchived) {
      goal.status = 'archived';
    } else if (goal.status === 'archived') {
      goal.status = 'active';
    }
    await goal.save();
    res.json({ success: true, isArchived: goal.isArchived, goal });
  } catch (err) {
    next(err);
  }
};

export const duplicateGoal = async (req, res, next) => {
  try {
    const original = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!original) return res.status(404).json({ success: false, message: 'Goal not found' });

    const copyData = original.toObject();
    delete copyData._id;
    delete copyData.createdAt;
    delete copyData.updatedAt;
    copyData.title = `${original.title} (Copy)`;
    copyData.currentProgressPercentage = 0;
    copyData.achievedQuantity = 0;
    copyData.status = 'active';
    copyData.completedAt = null;

    const duplicatedGoal = await Goal.create(copyData);

    const originalMilestones = await Milestone.find({ goal: original._id }).sort({ order: 1 });
    if (originalMilestones.length > 0) {
      const newMilestones = originalMilestones.map(m => {
        const mData = m.toObject();
        delete mData._id;
        delete mData.createdAt;
        delete mData.updatedAt;
        mData.goal = duplicatedGoal._id;
        mData.isCompleted = false;
        mData.status = 'not_started';
        mData.achievedQuantity = 0;
        mData.progressPercentage = 0;
        mData.completedAt = null;
        return mData;
      });
      await Milestone.insertMany(newMilestones);
    }

    res.status(201).json({ success: true, goal: duplicatedGoal });
  } catch (err) {
    next(err);
  }
};

export const getGoalTemplates = async (req, res, next) => {
  try {
    res.json({ success: true, count: GOAL_TEMPLATES.length, templates: GOAL_TEMPLATES });
  } catch (err) {
    next(err);
  }
};

export const createGoalFromTemplate = async (req, res, next) => {
  try {
    const { templateId, title, folderId, targetDate, startDate } = req.body;
    const template = GOAL_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    let resolvedFolder = 'General';
    let resolvedFolderId = folderId || null;
    if (folderId) {
      const folderDoc = await GoalFolder.findOne({ _id: folderId, user: req.user.id });
      if (folderDoc) {
        resolvedFolder = folderDoc.name;
        resolvedFolderId = folderDoc._id;
      }
    }

    const calculatedTargetDate = targetDate
      ? new Date(targetDate)
      : new Date(Date.now() + (template.estimatedDays || 90) * 86400000);

    const goal = await Goal.create({
      user: req.user.id,
      title: title || template.title,
      description: template.description,
      category: template.category,
      folder: resolvedFolder,
      folderId: resolvedFolderId,
      color: template.color || '#7C3AED',
      icon: template.icon || 'Target',
      startDate: startDate ? new Date(startDate) : new Date(),
      targetDate: calculatedTargetDate,
      priority: 'high',
      progressType: template.progressType || 'milestone_based',
      moduleCount: template.moduleCount || 0,
      milestoneCount: template.moduleCount || 0,
      targetQuantity: template.targetQuantity || 100,
      imageUrl: template.imageUrl || '',
      achievedQuantity: 0,
      currentProgressPercentage: 0
    });

    if (template.modules && template.modules.length > 0) {
      const milestoneDocs = template.modules.map((m, idx) => ({
        goal: goal._id,
        user: req.user.id,
        title: m.title,
        description: m.description || '',
        order: m.order || idx + 1,
        sequenceNumber: m.order || idx + 1,
        weight: 1.0,
        targetQuantity: 1,
        achievedQuantity: 0,
        progressPercentage: 0,
        isCompleted: false,
        status: 'not_started',
        estimatedEffort: m.estimatedEffort || '4 hours'
      }));
      const createdMilestones = await Milestone.insertMany(milestoneDocs);

      for (let i = 0; i < template.modules.length; i++) {
        const tm = template.modules[i];
        const createdM = createdMilestones[i];
        if (tm.subtasks && Array.isArray(tm.subtasks)) {
          for (const st of tm.subtasks) {
            await Task.create({
              user: req.user.id,
              goal: goal._id,
              linkedMilestone: createdM._id,
              title: st,
              priority: 'medium',
              taskType: 'daily',
              dueDate: calculatedTargetDate,
              estimatedMinutes: 45,
              isGoalRelevant: true
            });
          }
        }
      }
    }

    const fullGoal = await Goal.findById(goal._id);
    res.status(201).json({ success: true, goal: fullGoal });
  } catch (err) {
    next(err);
  }
};

export const searchGoalsGlobal = async (req, res, next) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';
    if (!q) {
      return res.json({ success: true, results: { goals: [], folders: [], modules: [], notes: [], tasks: [] } });
    }
    const regex = new RegExp(q, 'i');

    const [matchingGoals, matchingFolders, matchingMilestones, matchingTasks] = await Promise.all([
      Goal.find({ user: req.user.id, $or: [{ title: regex }, { description: regex }, { category: regex }] })
        .select('title category folder currentProgressPercentage targetDate status icon color')
        .limit(8),
      GoalFolder.find({ user: req.user.id, $or: [{ name: regex }, { description: regex }] })
        .select('name color icon parentFolderId')
        .limit(6),
      Milestone.find({ user: req.user.id, $or: [{ title: regex }, { description: regex }, { notes: regex }] })
        .select('title goal isCompleted status notes order sequenceNumber')
        .populate('goal', 'title category')
        .limit(10),
      Task.find({ user: req.user.id, title: regex })
        .select('title status priority dueDate goal')
        .populate('goal', 'title')
        .limit(8)
    ]);

    const matchingNotes = matchingMilestones.filter(m => m.notes && regex.test(m.notes));

    res.json({
      success: true,
      query: q,
      results: {
        goals: matchingGoals,
        folders: matchingFolders,
        modules: matchingMilestones,
        notes: matchingNotes,
        tasks: matchingTasks
      }
    });
  } catch (err) {
    next(err);
  }
};
