import mongoose from 'mongoose';

const activityEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['task', 'goal', 'milestone', 'module', 'habit', 'focus_session', 'reminder', 'journal'],
    required: true,
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  action: {
    type: String,
    enum: ['created', 'completed', 'reopened', 'rescheduled', 'skipped', 'deleted', 'started', 'updated'],
    required: true
  },
  source: {
    type: String,
    enum: ['voice_assistant', 'web_ui', 'system_scheduler'],
    default: 'voice_assistant'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  occurredAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

activityEventSchema.index({ user: 1, occurredAt: -1 });

export default mongoose.model('ActivityEvent', activityEventSchema);
