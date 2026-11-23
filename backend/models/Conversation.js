import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    default: 'New Voice Session'
  },
  summary: {
    type: String,
    trim: true,
    default: ''
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

conversationSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
