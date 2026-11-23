import mongoose from 'mongoose';

const dailyAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  // Task metrics
  plannedTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  goalRelevantCompletedTasks: { type: Number, default: 0 },
  taskCompletionRate: { type: Number, default: 0, min: 0, max: 1 },

  // Habit metrics
  scheduledHabits: { type: Number, default: 0 },
  completedHabits: { type: Number, default: 0 },
  habitAdherenceRate: { type: Number, default: 0, min: 0, max: 1 },
  completedHabitNames: [{ type: String }],

  // Work session metrics
  totalWorkMinutes: { type: Number, default: 0 },
  goalWorkMinutes: { type: Number, default: 0 },
  focusSessionCount: { type: Number, default: 0 },

  // Screen time metrics
  totalScreenMinutes: { type: Number, default: 0 },
  distractingScreenMinutes: { type: Number, default: 0 },
  productiveScreenMinutes: { type: Number, default: 0 },

  // Goal outcome & consistency
  goalProgressDelta: { type: Number, default: 0 }, // Progress % gained on this day
  consistencyScore: { type: Number, default: 0, min: 0, max: 100 },
  scoreComponentBreakdown: {
    habitScore: { type: Number, default: 0 },
    taskScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    goalWorkScore: { type: Number, default: 0 }
  },
  plannedFocusMinutes: { type: Number, default: 180 },
  plannedModuleCount: { type: Number, default: 0 },
  completedModuleCount: { type: Number, default: 0 },
  scoreConfigVersion: { type: String, default: '3.0' },
  milestonesCompletedCount: { type: Number, default: 0 },

  // Rest day & holiday annotation
  isHolidayOrRestDay: { type: Boolean, default: false },
  restDayNote: { type: String, trim: true, default: null }
}, {
  timestamps: true
});

dailyAnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
