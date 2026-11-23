import mongoose from 'mongoose';

const workflowRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MLAnalysisRun'
  },
  recommendationKey: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Screen Time', 'Habit Consistency', 'Milestone Sizing', 'Pacing Recovery', 'Workload Optimization', 'Workflow Maintenance', 'General'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  observedIssue: {
    type: String,
    required: true
  },
  supportingData: {
    type: String,
    required: true
  },
  suggestedChange: {
    type: String,
    required: true
  },
  expectedBenefitHypothesis: {
    type: String,
    required: true
  },
  confidenceLevel: {
    type: String,
    enum: ['high', 'moderate', 'preliminary'],
    default: 'moderate'
  },
  dataLimitationNote: {
    type: String,
    default: ''
  },
  suggestedExperimentDays: {
    type: Number,
    default: 14
  },
  suggestedTargetBehavior: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'dismissed', 'testing', 'completed'],
    default: 'active'
  },
  linkedGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  linkedExperiment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowExperiment'
  }
}, {
  timestamps: true
});

workflowRecommendationSchema.index({ user: 1, status: 1 });

export default mongoose.model('WorkflowRecommendation', workflowRecommendationSchema);
