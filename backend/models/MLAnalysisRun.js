import mongoose from 'mongoose';

const mlAnalysisRunSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  runDate: {
    type: Date,
    default: Date.now
  },
  dataPointsCount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'insufficient_data', 'failed'],
    default: 'completed'
  },
  clusterResults: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  anomalyResults: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  associationRules: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  correlationMetrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  goalPacing: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

mlAnalysisRunSchema.index({ user: 1, runDate: -1 });

export default mongoose.model('MLAnalysisRun', mlAnalysisRunSchema);
