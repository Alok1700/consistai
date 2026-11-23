import mongoose from 'mongoose';

const goalProgressEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  goalMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalMilestone'
  },
  goalModule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalModule'
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  previousProgress: {
    type: Number,
    required: true
  },
  newProgress: {
    type: Number,
    required: true
  },
  progressDelta: {
    type: Number,
    required: true
  },
  eventType: {
    type: String,
    enum: ['milestone_advanced', 'milestone_completed', 'quantity_incremented', 'manual_adjustment'],
    default: 'milestone_advanced'
  },
  quantityAdded: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

goalProgressEventSchema.index({ goal: 1, date: 1 });
goalProgressEventSchema.index({ user: 1, date: 1 });

export default mongoose.model('GoalProgressEvent', goalProgressEventSchema);
