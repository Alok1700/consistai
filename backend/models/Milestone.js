import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 1
  },
  weight: {
    type: Number,
    required: true,
    default: 1.0,
    min: 0.1
  },
  targetQuantity: {
    type: Number,
    default: 1
  },
  achievedQuantity: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['not_started', 'pending', 'in_progress', 'completed', 'skipped'],
    default: 'not_started',
    index: true
  },
  skipReason: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  targetDate: {
    type: Date
  },
  sequenceNumber: {
    type: Number,
    default: 1
  },
  completedAt: {
    type: Date
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  }],
  completionCriteria: {
    type: String,
    trim: true,
    default: ''
  },
  estimatedEffort: {
    type: String,
    trim: true,
    default: ''
  },
  resources: [{
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    resourceType: { type: String, default: 'link', trim: true }
  }]
}, {
  timestamps: true
});

milestoneSchema.index({ goal: 1, order: 1 });

export default mongoose.model('Milestone', milestoneSchema);
