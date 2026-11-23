import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    index: true
  },
  linkedMilestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  taskType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'daily',
    index: true
  },
  dueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  estimatedMinutes: {
    type: Number,
    default: 45
  },
  actualMinutes: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  isGoalRelevant: {
    type: Boolean,
    default: false
  },
  onTime: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

taskSchema.index({ user: 1, dueDate: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
