import mongoose from 'mongoose';

const journalEntrySubSchema = new mongoose.Schema({
  time: { type: String, required: true }, // e.g. "07:30" or "07:30 AM"
  activity: { type: String, required: true, trim: true },
  entryType: {
    type: String,
    enum: ['self_reported', 'system_recorded', 'task_completion', 'focus_session'],
    default: 'self_reported'
  },
  isConfirmed: { type: Boolean, default: true },
  linkedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
}, { _id: false });

const dailyJournalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  localDate: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  entries: [journalEntrySubSchema],
  reflection: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

dailyJournalSchema.index({ user: 1, localDate: 1 }, { unique: true });

export default mongoose.model('DailyJournal', dailyJournalSchema);
