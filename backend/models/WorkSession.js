import mongoose from 'mongoose';

const workSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    index: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  category: {
    type: String,
    enum: ['Deep Coding', 'Problem Solving', 'System Design', 'Reading & Research', 'Assignment', 'Exam Prep', 'Other'],
    default: 'Problem Solving'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  sessionType: {
    type: String,
    enum: ['timer', 'manual', 'pomodoro', 'stopwatch'],
    default: 'timer'
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

workSessionSchema.index({ user: 1, date: 1 });

export default mongoose.model('WorkSession', workSessionSchema);
