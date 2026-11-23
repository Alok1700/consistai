import mongoose from 'mongoose';

const habitCheckInSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300
  }
}, {
  timestamps: true
});

habitCheckInSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

export default mongoose.model('HabitCheckIn', habitCheckInSchema);
