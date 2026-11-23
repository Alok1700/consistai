import mongoose from 'mongoose';

const goalModuleSchema = new mongoose.Schema({
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true, index: true },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'GoalMilestone', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 500 },
  description: { type: String, trim: true, default: '' },
  order: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'skipped'],
    default: 'not_started'
  },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  estimatedMinutes: { type: Number, default: 45 },
  notes: { type: String, trim: true, default: '' }
}, { timestamps: true });

goalModuleSchema.index({ milestone: 1, order: 1 });
goalModuleSchema.index({ goal: 1, status: 1 });

export default mongoose.model('GoalModule', goalModuleSchema);
