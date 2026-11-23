import mongoose from 'mongoose';

const assistantToolExecutionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  toolName: {
    type: String,
    required: true,
    index: true
  },
  validatedArguments: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  idempotencyKey: {
    type: String,
    index: true
  },
  executionStatus: {
    type: String,
    enum: ['success', 'failed', 'rejected'],
    default: 'success'
  },
  sanitizedResult: {
    type: mongoose.Schema.Types.Mixed
  },
  errorMessage: {
    type: String
  },
  undoData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isUndone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

assistantToolExecutionSchema.index({ user: 1, idempotencyKey: 1 });

export default mongoose.model('AssistantToolExecution', assistantToolExecutionSchema);
