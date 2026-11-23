import mongoose from 'mongoose';

const insightFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  insightId: {
    type: String,
    required: true,
    index: true
  },
  feedbackType: {
    type: String,
    enum: ['helpful', 'try_this', 'dismiss', 'view_evidence'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

insightFeedbackSchema.index({ user: 1, insightId: 1, feedbackType: 1 });

export default mongoose.model('InsightFeedback', insightFeedbackSchema);
