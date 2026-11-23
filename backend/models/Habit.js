import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Habit title is required'],
    trim: true,
    maxlength: 150
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['DSA & Coding', 'Technical Reading', 'Course Study', 'Physical Exercise', 'Review & Reflection', 'Other'],
    default: 'DSA & Coding'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekdays', 'weekends', 'weekly', 'custom'],
    default: 'daily'
  },
  daysOfWeek: {
    type: [String],
    enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'anytime'],
    default: 'anytime'
  },
  targetDaysPerWeek: {
    type: Number,
    default: 7,
    min: 1,
    max: 7
  },
  linkedGoals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

habitSchema.index({ user: 1, active: 1 });

export default mongoose.model('Habit', habitSchema);
