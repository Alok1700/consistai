import DailyAnalytics from '../models/DailyAnalytics.js';
import MLAnalysisRun from '../models/MLAnalysisRun.js';
import WorkflowRecommendation from '../models/WorkflowRecommendation.js';
import Goal from '../models/Goal.js';
import { mlClient } from '../services/mlClient.js';

export const runFullMLAnalysis = async (req, res, next) => {
  try {
    const records = await DailyAnalytics.find({ user: req.user.id }).sort({ date: 1 });

    if (!records || records.length < 3) {
      return res.status(200).json({
        success: true,
        status: 'insufficient_data',
        message: 'Fewer than 3 days of activity data logged. Log a few more daily tasks and study sessions or load demo data.',
        dataPointsCount: records ? records.length : 0
      });
    }

    // Find primary active goal to compute pacing gap
    const activeGoal = await Goal.findOne({ user: req.user.id, status: 'active' }).sort({ priority: -1, createdAt: -1 });
    let pacingGap = null;
    let goalTitle = 'Primary Goal';

    if (activeGoal) {
      goalTitle = activeGoal.title;
      const totalDays = Math.max(1, Math.round((new Date(activeGoal.targetDate) - new Date(activeGoal.startDate)) / (1000 * 60 * 60 * 24)));
      const daysElapsed = Math.max(0, Math.round((new Date() - new Date(activeGoal.startDate)) / (1000 * 60 * 60 * 24)));
      const elapsedPct = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
      pacingGap = Number((activeGoal.currentProgressPercentage - elapsedPct).toFixed(1));
    }

    // Format records for ML service
    const formattedRecords = records.map(r => ({
      date: r.date,
      planned_tasks: r.plannedTasks,
      completed_tasks: r.completedTasks,
      goal_relevant_tasks_completed: r.goalRelevantCompletedTasks,
      task_completion_rate: r.taskCompletionRate,
      scheduled_habits: r.scheduledHabits,
      completed_habits: r.completedHabits,
      habit_adherence_rate: r.habitAdherenceRate,
      completed_habit_names: r.completedHabitNames || [],
      focused_work_minutes: r.totalWorkMinutes,
      goal_specific_work_minutes: r.goalWorkMinutes,
      total_screen_time_minutes: r.totalScreenMinutes,
      distracting_screen_time_minutes: r.distractingScreenMinutes,
      productive_screen_time_minutes: r.productiveScreenMinutes,
      actual_goal_progress_delta: r.goalProgressDelta,
      milestones_completed_count: r.milestonesCompletedCount,
      consistency_score: r.consistencyScore,
      is_holiday_or_rest_day: r.isHolidayOrRestDay,
      rest_day_note: r.restDayNote
    }));

    // Concurrently trigger ML endpoints
    const [clusterRes, anomalyRes, assocRes, corrRes, recRes] = await Promise.all([
      mlClient.runClusters(formattedRecords),
      mlClient.runAnomalies(formattedRecords, 0.1),
      mlClient.runAssociations(formattedRecords, 0.12, 0.45, 1.05),
      mlClient.runCorrelations(formattedRecords),
      mlClient.runRecommendations(formattedRecords, pacingGap, goalTitle)
    ]);

    // Persist ML Run in MongoDB
    const run = await MLAnalysisRun.create({
      user: req.user.id,
      runDate: new Date(),
      dataPointsCount: records.length,
      status: 'completed',
      clusterResults: clusterRes,
      anomalyResults: anomalyRes,
      associationRules: assocRes,
      correlationMetrics: corrRes,
      goalPacing: {
        activeGoalTitle: goalTitle,
        pacingGap,
        activeGoalId: activeGoal?._id || null
      }
    });

    // Save or update workflow recommendations
    if (recRes.recommendations && recRes.recommendations.length > 0) {
      for (const rec of recRes.recommendations) {
        await WorkflowRecommendation.findOneAndUpdate(
          { user: req.user.id, recommendationKey: rec.id },
          {
            runId: run._id,
            title: rec.title,
            category: rec.category,
            priority: rec.priority,
            observedIssue: rec.observed_issue,
            supportingData: rec.supporting_data,
            suggestedChange: rec.suggested_change,
            expectedBenefitHypothesis: rec.expected_benefit_hypothesis,
            confidenceLevel: rec.confidence_level,
            dataLimitationNote: rec.data_limitation_note,
            suggestedExperimentDays: rec.suggested_experiment_days,
            suggestedTargetBehavior: rec.suggested_target_behavior,
            linkedGoal: activeGoal?._id || null
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    res.json({
      success: true,
      runId: run._id,
      dataPointsCount: records.length,
      clusterResults: clusterRes,
      anomalyResults: anomalyRes,
      associationRules: assocRes,
      correlationMetrics: corrRes,
      recommendations: recRes.recommendations,
      pacing: {
        activeGoalTitle: goalTitle,
        pacingGap
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getLatestMLAnalysis = async (req, res, next) => {
  try {
    const latestRun = await MLAnalysisRun.findOne({ user: req.user.id }).sort({ runDate: -1 });

    if (!latestRun) {
      return res.json({
        success: true,
        hasRun: false,
        message: 'No ML analysis run found. Click "Run ML Analysis" to analyze historical data.'
      });
    }

    const recommendations = await WorkflowRecommendation.find({ user: req.user.id, status: { $ne: 'dismissed' } });

    res.json({
      success: true,
      hasRun: true,
      run: latestRun,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};
