import WorkflowExperiment from '../models/WorkflowExperiment.js';
import WorkflowRecommendation from '../models/WorkflowRecommendation.js';
import DailyAnalytics from '../models/DailyAnalytics.js';

export const startExperiment = async (req, res, next) => {
  try {
    const {
      title,
      hypothesis,
      targetBehavior,
      linkedRecommendationId,
      linkedGoalId,
      durationDays,
      metric,
      desiredDirection,
      personalTarget,
      notes
    } = req.body;

    const days = Number(durationDays || 14);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    // Compute baseline metrics from the preceding `days`
    const baselineStartDate = new Date();
    baselineStartDate.setDate(startDate.getDate() - days);
    const startStr = baselineStartDate.toISOString().slice(0, 10);
    const endStr = startDate.toISOString().slice(0, 10);

    const baselineRecords = await DailyAnalytics.find({
      user: req.user.id,
      date: { $gte: startStr, $lt: endStr }
    });

    let bProgress = 0, bFocus = 0, bTask = 0, bDistract = 0, bHabit = 0;
    if (baselineRecords.length > 0) {
      bProgress = Number((baselineRecords.reduce((s, r) => s + r.goalProgressDelta, 0) / baselineRecords.length).toFixed(2));
      bFocus = Math.round(baselineRecords.reduce((s, r) => s + r.totalWorkMinutes, 0) / baselineRecords.length);
      bTask = Number((baselineRecords.reduce((s, r) => s + r.taskCompletionRate, 0) / baselineRecords.length).toFixed(2));
      bDistract = Math.round(baselineRecords.reduce((s, r) => s + r.distractingScreenMinutes, 0) / baselineRecords.length);
      bHabit = Number((baselineRecords.reduce((s, r) => s + r.habitAdherenceRate, 0) / baselineRecords.length).toFixed(2));
    }

    const experiment = await WorkflowExperiment.create({
      user: req.user.id,
      title,
      hypothesis: hypothesis || 'Testing targeted workflow intervention.',
      targetBehavior: targetBehavior || title,
      linkedRecommendation: linkedRecommendationId || null,
      linkedGoal: linkedGoalId || null,
      durationDays: days,
      startDate,
      endDate,
      status: 'active',
      baselineMetrics: {
        avgGoalProgressDaily: bProgress,
        avgFocusMinutes: bFocus,
        avgTaskCompletionRate: bTask,
        avgDistractingMinutes: bDistract,
        avgHabitAdherence: bHabit
      }
    });

    // Mark recommendation as testing
    if (linkedRecommendationId) {
      await WorkflowRecommendation.findByIdAndUpdate(linkedRecommendationId, {
        status: 'testing',
        linkedExperiment: experiment._id
      });
    }

    res.status(201).json({ success: true, experiment });
  } catch (err) {
    next(err);
  }
};

export const getExperiments = async (req, res, next) => {
  try {
    const experiments = await WorkflowExperiment.find({ user: req.user.id })
      .populate('linkedRecommendation', 'title category expectedBenefitHypothesis')
      .populate('linkedGoal', 'title category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: experiments.length,
      experiments
    });
  } catch (err) {
    next(err);
  }
};

export const getExperimentById = async (req, res, next) => {
  try {
    const experiment = await WorkflowExperiment.findOne({ _id: req.params.id, user: req.user.id })
      .populate('linkedRecommendation')
      .populate('linkedGoal');

    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found.' });
    }

    res.json({ success: true, experiment });
  } catch (err) {
    next(err);
  }
};

export const updateExperiment = async (req, res, next) => {
  try {
    const experiment = await WorkflowExperiment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );

    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found.' });
    }

    res.json({ success: true, experiment });
  } catch (err) {
    next(err);
  }
};

export const logExperimentDailyAdherence = async (req, res, next) => {
  try {
    const { adhered, notes, date } = req.body;
    const experiment = await WorkflowExperiment.findOne({ _id: req.params.id, user: req.user.id });

    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found.' });
    }

    const logDate = date || new Date().toISOString().slice(0, 10);
    const dayAnalytics = await DailyAnalytics.findOne({ user: req.user.id, date: logDate });

    // Remove existing log for this date if present
    experiment.dailyLogs = experiment.dailyLogs.filter(l => l.date !== logDate);

    experiment.dailyLogs.push({
      date: logDate,
      adhered: Boolean(adhered),
      notes: notes || '',
      workMinutes: dayAnalytics?.totalWorkMinutes || 0,
      distractingMinutes: dayAnalytics?.distractingScreenMinutes || 0,
      goalProgressDelta: dayAnalytics?.goalProgressDelta || 0
    });

    // Recompute experiment metrics
    const logs = experiment.dailyLogs;
    if (logs.length > 0) {
      const expProgress = Number((logs.reduce((s, l) => s + l.goalProgressDelta, 0) / logs.length).toFixed(2));
      const expFocus = Math.round(logs.reduce((s, l) => s + l.workMinutes, 0) / logs.length);
      const expDistract = Math.round(logs.reduce((s, l) => s + l.distractingMinutes, 0) / logs.length);

      const adheredLogs = logs.filter(l => l.adhered).length;
      const adherenceRate = Number((adheredLogs / logs.length).toFixed(2));

      experiment.experimentMetrics.avgGoalProgressDaily = expProgress;
      experiment.experimentMetrics.avgFocusMinutes = expFocus;
      experiment.experimentMetrics.avgDistractingMinutes = expDistract;
      experiment.experimentMetrics.avgHabitAdherence = adherenceRate;

      // Before vs After comparisons
      const deltaProg = Number((expProgress - experiment.baselineMetrics.avgGoalProgressDaily).toFixed(2));
      const deltaFocus = expFocus - experiment.baselineMetrics.avgFocusMinutes;
      const deltaDistract = expDistract - experiment.baselineMetrics.avgDistractingMinutes;

      let summary = 'Neutral: Similar activity levels observed.';
      if (deltaProg > 0.4 && deltaDistract < 0) {
        summary = 'Positive: Daily goal progress increased alongside reduced distraction screen time.';
      } else if (deltaProg > 0.2) {
        summary = 'Moderate Improvement: Higher recorded goal progress observed during test period.';
      } else if (deltaProg < -0.3) {
        summary = 'Decline: Lower progress recorded; behavior adjustment may need recalibration.';
      }

      experiment.comparisonResult = {
        goalProgressChange: deltaProg,
        focusMinutesChange: deltaFocus,
        distractingScreenTimeChange: deltaDistract,
        habitAdherenceChange: Number((adherenceRate - experiment.baselineMetrics.avgHabitAdherence).toFixed(2)),
        summaryEvaluation: summary,
        outcomeStatement: `Observed change: ${deltaProg >= 0 ? '+' : ''}${deltaProg}% daily progress, ${deltaFocus >= 0 ? '+' : ''}${deltaFocus}m focus time, ${deltaDistract >= 0 ? '+' : ''}${deltaDistract}m distraction. (Scientific Notice: Observed comparison reflects correlation and does not imply uncontrolled causal proof).`
      };
    }

    await experiment.save();

    res.json({ success: true, experiment });
  } catch (err) {
    next(err);
  }
};

export const completeExperiment = async (req, res, next) => {
  try {
    const { status, reflection } = req.body; // 'completed' or 'abandoned'
    const experiment = await WorkflowExperiment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      {
        status: status || 'completed',
        ...(reflection ? { 'comparisonResult.outcomeStatement': reflection } : {})
      },
      { new: true }
    );

    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found.' });
    }

    if (experiment.linkedRecommendation) {
      await WorkflowRecommendation.findByIdAndUpdate(experiment.linkedRecommendation, {
        status: status === 'completed' ? 'completed' : 'active'
      });
    }

    res.json({ success: true, experiment });
  } catch (err) {
    next(err);
  }
};

export const getExperimentResults = async (req, res, next) => {
  try {
    const experiment = await WorkflowExperiment.findOne({ _id: req.params.id, user: req.user.id })
      .populate('linkedRecommendation')
      .populate('linkedGoal');

    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment not found.' });
    }

    res.json({
      success: true,
      baseline: experiment.baselineMetrics,
      experiment: experiment.experimentMetrics,
      comparison: experiment.comparisonResult,
      dailyLogs: experiment.dailyLogs
    });
  } catch (err) {
    next(err);
  }
};
