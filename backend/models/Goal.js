import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['DSA & Coding', 'Web Development', 'System Design', 'Academic Coursework', 'Research / Minor Project', 'Competitive Exam', 'Other'],
    default: 'DSA & Coding'
  },
  folder: {
    type: String,
    default: 'General',
    trim: true,
    index: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalFolder',
    default: null,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  targetDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'high'
  },
  targetOutcome: {
    type: String,
    trim: true,
    default: ''
  },
  measurementUnit: {
    type: String,
    trim: true,
    default: 'Problems' // e.g. Problems, Modules, Chapters, Hours
  },
  progressType: {
    type: String,
    enum: ['numerical', 'milestone_based', 'checklist'],
    default: 'milestone_based'
  },
  progressCalculationMethod: {
    type: String,
    enum: ['unweighted', 'weighted'],
    default: 'unweighted'
  },
  moduleCount: {
    type: Number,
    default: 0
  },
  milestoneCount: {
    type: Number,
    default: 0
  },
  targetQuantity: {
    type: Number,
    default: 100
  },
  achievedQuantity: {
    type: Number,
    default: 0
  },
  currentProgressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  pacingGap: {
    type: Number,
    default: 0 // Progress % - Elapsed Time %
  },
  pacingStatus: {
    type: String,
    enum: ['ahead', 'on_pace', 'mild_deficit', 'critical_deficit'],
    default: 'on_pace'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned', 'archived'],
    default: 'active'
  },
  icon: {
    type: String,
    default: 'Target'
  },
  color: {
    type: String,
    default: '#7C3AED'
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  theme: {
    type: String,
    default: 'purple'
  },
  displayPreference: {
    type: String,
    enum: ['roadmap', 'timeline', 'dashboard'],
    default: 'roadmap'
  },
  isPrimaryGoal: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date
  },
  reflectionNote: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String,
    default: '',
    trim: true
  },
  yearlyTargets: [{
    target: {
      type: String,
      required: true,
      trim: true
    },
    targetDate: {
      type: Date
    },
    isAchieved: {
      type: Boolean,
      default: false
    },
    achievedAt: {
      type: Date
    }
  }],
  linkedHabits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit'
  }],
  linkedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

goalSchema.virtual('milestones', {
  ref: 'Milestone',
  localField: '_id',
  foreignField: 'goal'
});

goalSchema.virtual('goalMilestones', {
  ref: 'GoalMilestone',
  localField: '_id',
  foreignField: 'goal'
});

goalSchema.index({ user: 1, status: 1 });

export default mongoose.model('Goal', goalSchema);
