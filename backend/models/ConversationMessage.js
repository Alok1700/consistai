import mongoose from 'mongoose';

const toolCallSubSchema = new mongoose.Schema({
  toolName: { type: String, required: true },
  arguments: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success' },
  result: { type: mongoose.Schema.Types.Mixed },
  error: { type: String }
}, { _id: false });

const conversationMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'hinglish', 'auto'],
    default: 'auto'
  },
  toolCalls: [toolCallSubSchema],
  audioUrl: {
    type: String
  }
}, {
  timestamps: true
});

conversationMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.model('ConversationMessage', conversationMessageSchema);
