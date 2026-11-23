import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import {
  generateGoalPlan,
  generatePlanAdjustment,
  chatWithProgressCoach,
  parseQuickCaptureTask,
  generateAIMilestones,
  generateMilestoneModules,
  generateGoalAssistance
} from '../services/aiService.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

// POST /api/ai/plan-goal
export const planGoal = async (req, res, next) => {
  try {
    const {
      goalDescription,
      targetDate,
      experienceLevel,
      dailyHours,
      preferredDays,
      restDays,
      desiredOutcome
    } = req.body;

    if (!goalDescription || !targetDate) {
      return res.status(400).json({ success: false, message: 'Goal description and target date are required.' });
    }

    const plan = await generateGoalPlan({
      goalDescription,
      targetDate,
      experienceLevel,
      dailyHours: Number(dailyHours || 2),
      preferredDays: preferredDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      restDays: restDays || ['Sun'],
      desiredOutcome
    });

    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/save-approved-goal
export const saveApprovedGoalPlan = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      startDate,
      targetDate,
      priority,
      targetOutcome,
      measurementUnit,
      targetQuantity,
      milestones,
      suggestedTasks,
      suggestedHabits
    } = req.body;

    const userId = req.user.id;

    // 1. Create Goal
    const goal = await Goal.create({
      user: userId,
      title,
      description: description || `Created via AI Goal Planner on ${new Date().toLocaleDateString()}`,
      category: category || 'General Skill',
      startDate: startDate || new Date(),
      targetDate: new Date(targetDate),
      priority: priority || 'high',
      targetOutcome: targetOutcome || '',
      measurementUnit: measurementUnit || 'Units',
      progressType: 'milestone_based',
      targetQuantity: Number(targetQuantity || 100),
      achievedQuantity: 0,
      currentProgressPercentage: 0,
      status: 'active'
    });

    // 2. Create Milestones
    const createdMilestones = [];
    if (milestones && milestones.length > 0) {
      for (const m of milestones) {
        const milestoneDoc = await Milestone.create({
          user: userId,
          goal: goal._id,
          title: m.title,
          description: m.description || '',
          order: m.order || 1,
          weight: m.weight || Math.round(100 / milestones.length),
          targetQuantity: m.targetQuantity || Math.round((targetQuantity || 100) / milestones.length),
          achievedQuantity: 0,
          progressPercentage: 0,
          isCompleted: false
        });
        createdMilestones.push(milestoneDoc._id);
      }
      goal.milestones = createdMilestones;
      await goal.save();
    }

    // 3. Create Suggested Tasks
    const createdTasks = [];
    if (suggestedTasks && suggestedTasks.length > 0) {
      for (const t of suggestedTasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (t.dayOffset || 1));
        const taskDoc = await Task.create({
          user: userId,
          goal: goal._id,
          title: t.title,
          description: `Planned step for ${goal.title}`,
          priority: t.priority || 'high',
          taskType: t.taskType || 'daily',
          dueDate,
          estimatedMinutes: t.estimatedMinutes || 45,
          actualMinutes: 0,
          status: 'pending',
          isGoalRelevant: true
        });
        createdTasks.push(taskDoc._id);
      }
      await Goal.findByIdAndUpdate(goal._id, { $addToSet: { linkedTasks: { $each: createdTasks } } });
    }

    // 4. Create Suggested Habits
    const createdHabits = [];
    if (suggestedHabits && suggestedHabits.length > 0) {
      for (const h of suggestedHabits) {
        const habitDoc = await Habit.create({
          user: userId,
          title: h.title,
          description: `Supporting routine for ${goal.title}`,
          category: goal.category,
          frequency: h.frequency || 'weekdays',
          daysOfWeek: h.frequency === 'daily'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          timeOfDay: h.timeOfDay || 'morning',
          targetDaysPerWeek: h.targetDaysPerWeek || 5,
          linkedGoals: [goal._id],
          active: true
        });
        createdHabits.push(habitDoc._id);
      }
      await Goal.findByIdAndUpdate(goal._id, { $addToSet: { linkedHabits: { $each: createdHabits } } });
    }

    // Sync daily analytics
    await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));

    const populatedGoal = await Goal.findById(goal._id)
      .populate('milestones')
      .populate('linkedHabits')
      .populate('linkedTasks');

    res.status(201).json({
      success: true,
      message: 'AI-generated Goal roadmap successfully created and enrolled in Goal Manager!',
      goal: populatedGoal
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/adjust-plan
export const adjustPlan = async (req, res, next) => {
  try {
    const { goalId } = req.body;
    if (!goalId) {
      return res.status(400).json({ success: false, message: 'Goal ID is required.' });
    }

    const adjustment = await generatePlanAdjustment({ goalId, userId: req.user.id });
    res.json({ success: true, adjustment });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/apply-plan-adjustment
export const applyPlanAdjustment = async (req, res, next) => {
  try {
    const { goalId, newTargetDate, updatedMilestones, rescheduledTasks } = req.body;
    const userId = req.user.id;

    const goal = await Goal.findOne({ _id: goalId, user: userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    if (newTargetDate) {
      goal.targetDate = new Date(newTargetDate);
      await goal.save();
    }

    if (updatedMilestones && updatedMilestones.length > 0) {
      for (const m of updatedMilestones) {
        await Milestone.findOneAndUpdate(
          { _id: m._id, user: userId },
          { weight: m.suggestedWeight }
        );
      }
    }

    if (rescheduledTasks && rescheduledTasks.length > 0) {
      for (const t of rescheduledTasks) {
        await Task.findOneAndUpdate(
          { _id: t._id, user: userId },
          { dueDate: new Date(t.newDueDate) }
        );
      }
    }

    await syncDailyAnalytics(userId, new Date().toISOString().slice(0, 10));

    res.json({
      success: true,
      message: 'Plan successfully adjusted and schedule recalibrated.'
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/chat
export const chatCoach = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const reply = await chatWithProgressCoach({
      userId: req.user.id,
      message,
      history: history || []
    });

    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/quick-capture
export const quickCapture = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required.' });
    }

    const userGoals = await Goal.find({ user: req.user.id, status: 'active' }).select('title category');
    const parsed = await parseQuickCaptureTask({ text, userGoals });

    res.json({ success: true, task: parsed });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/generate-milestones
export const generateMilestonesAI = async (req, res, next) => {
  try {
    const { goalTitle, count = 10, category = 'DSA & Coding', experienceLevel = 'intermediate' } = req.body;
    if (!goalTitle || !goalTitle.trim()) {
      return res.status(400).json({ success: false, message: 'Goal title is required' });
    }

    const milestones = await generateAIMilestones({
      goalTitle: goalTitle.trim(),
      count: Number(count || 10),
      category,
      experienceLevel
    });

    res.json({ success: true, count: milestones.length, milestones });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/goal-assistance
export const goalAssistanceAI = async (req, res, next) => {
  try {
    const { goalId, question } = req.body;
    if (!goalId || !question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'goalId and question are required' });
    }

    const assistance = await generateGoalAssistance({
      goalId,
      userId: req.user.id,
      question: question.trim()
    });

    res.json({ success: true, assistance });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/generate-milestone-modules
export const generateMilestoneModulesController = async (req, res, next) => {
  try {
    const { goalId, goalTitle, milestoneTitle, description, count = 8, category } = req.body;
    if (!milestoneTitle || !milestoneTitle.trim()) {
      return res.status(400).json({ success: false, message: 'Milestone title is required' });
    }

    const modules = await generateMilestoneModules({
      goalId,
      goalTitle,
      milestoneTitle: milestoneTitle.trim(),
      description: description ? description.trim() : '',
      count: Number(count || 8),
      category
    });

    res.json({ success: true, count: modules.length, modules });
  } catch (err) {
    next(err);
  }
};
