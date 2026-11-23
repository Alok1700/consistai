import mongoose from 'mongoose';

const moduleProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  moduleId: {
    type: String,
    required: true,
    index: true
  },
  moduleNumber: {
    type: Number,
    required: true,
    index: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

moduleProgressSchema.index({ user: 1, moduleId: 1 }, { unique: true });
moduleProgressSchema.index({ user: 1, moduleNumber: 1 });

export default mongoose.model('ModuleProgress', moduleProgressSchema);

