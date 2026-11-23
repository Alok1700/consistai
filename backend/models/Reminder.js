import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  reminderType: {
    type: String,
    enum: [
      'before_task',
      'at_start',
      'at_deadline',
      'overdue_check',
      'recurring',
      'custom',
      'morning_briefing',
      'evening_review'
    ],
    default: 'custom'
  },
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  scheduleVersion: {
    type: Number,
    default: 1
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekdays', 'weekly'],
    default: 'none'
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'snoozed', 'cancelled', 'dismissed'],
    default: 'scheduled',
    index: true
  },
  deliveryChannels: {
    type: [String],
    default: ['in_app', 'voice']
  },
  sentAt: {
    type: Date
  },
  snoozedUntil: {
    type: Date
  }
}, {
  timestamps: true
});

reminderSchema.index({ user: 1, status: 1, scheduledAt: 1 });

export default mongoose.model('Reminder', reminderSchema);
