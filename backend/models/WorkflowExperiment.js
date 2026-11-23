import mongoose from 'mongoose';

const dailyExperimentLogSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  adhered: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  workMinutes: {
    type: Number,
    default: 0
  },
  distractingMinutes: {
    type: Number,
    default: 0
  },
  goalProgressDelta: {
    type: Number,
    default: 0
  }
}, { _id: false });

const workflowExperimentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  hypothesis: {
    type: String,
    required: true
  },
  targetBehavior: {
    type: String,
    required: true
  },
  linkedRecommendation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkflowRecommendation'
  },
  linkedGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  durationDays: {
    type: Number,
    default: 14,
    min: 3,
    max: 90
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed', 'abandoned'],
    default: 'active'
  },
  baselineMetrics: {
    avgGoalProgressDaily: { type: Number, default: 0 },
    avgFocusMinutes: { type: Number, default: 0 },
    avgTaskCompletionRate: { type: Number, default: 0 },
    avgDistractingMinutes: { type: Number, default: 0 },
    avgHabitAdherence: { type: Number, default: 0 }
  },
  experimentMetrics: {
    avgGoalProgressDaily: { type: Number, default: 0 },
    avgFocusMinutes: { type: Number, default: 0 },
    avgTaskCompletionRate: { type: Number, default: 0 },
    avgDistractingMinutes: { type: Number, default: 0 },
    avgHabitAdherence: { type: Number, default: 0 }
  },
  comparisonResult: {
    goalProgressChange: { type: Number, default: 0 }, // percentage points delta
    focusMinutesChange: { type: Number, default: 0 },
    distractingScreenTimeChange: { type: Number, default: 0 },
    habitAdherenceChange: { type: Number, default: 0 },
    summaryEvaluation: { type: String, default: 'Experiment in progress.' },
    outcomeStatement: { type: String, default: 'Data being collected.' }
  },
  dailyLogs: [dailyExperimentLogSchema]
}, {
  timestamps: true
});

workflowExperimentSchema.index({ user: 1, status: 1 });

export default mongoose.model('WorkflowExperiment', workflowExperimentSchema);
