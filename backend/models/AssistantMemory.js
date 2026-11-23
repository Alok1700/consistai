import mongoose from 'mongoose';

const assistantMemorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['preference', 'learning_goal', 'important_date', 'commitment', 'fact', 'work_rhythm'],
    default: 'fact'
  },
  importance: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  sourceMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConversationMessage'
  },
  confirmationStatus: {
    type: String,
    enum: ['confirmed', 'inferred', 'pending'],
    default: 'confirmed'
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

assistantMemorySchema.index({ user: 1, category: 1, createdAt: -1 });

export default mongoose.model('AssistantMemory', assistantMemorySchema);
