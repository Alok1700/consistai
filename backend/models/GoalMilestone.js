import mongoose from 'mongoose';

const goalMilestoneSchema = new mongoose.Schema({
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, default: '' },
  order: { type: Number, default: 1 },
  sequenceNumber: { type: Number, default: 1 },
  weight: { type: Number, default: 1.0, min: 0.1 },
  startDate: { type: Date },
  targetDate: { type: Date },
  // Cached progress fields (computed from GoalModule collection)
  moduleCount: { type: Number, default: 0 },
  completedModuleCount: { type: Number, default: 0 },
  progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed'], default: 'not_started' },
  completedAt: { type: Date }
}, { timestamps: true });

goalMilestoneSchema.index({ goal: 1, order: 1 });
goalMilestoneSchema.index({ goal: 1, sequenceNumber: 1 });

export default mongoose.model('GoalMilestone', goalMilestoneSchema);
