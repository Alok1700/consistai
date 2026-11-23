import mongoose from 'mongoose';

const monthlyReflectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  achievements: {
    type: String,
    trim: true,
    default: ''
  },
  difficulties: {
    type: String,
    trim: true,
    default: ''
  },
  improvements: {
    type: String,
    trim: true,
    default: ''
  },
  nextMonthPriorities: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

monthlyReflectionSchema.index({ user: 1, year: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthlyReflection', monthlyReflectionSchema);
