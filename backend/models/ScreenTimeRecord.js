import mongoose from 'mongoose';

const appUsageItemSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Development', 'Learning', 'Research', 'Social Media', 'Entertainment', 'Communication', 'Other'],
    default: 'Other'
  },
  minutes: {
    type: Number,
    required: true,
    min: 0
  },
  isDistracting: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const screenTimeRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  totalMinutes: {
    type: Number,
    required: true,
    default: 0
  },
  productiveMinutes: {
    type: Number,
    required: true,
    default: 0
  },
  distractingMinutes: {
    type: Number,
    required: true,
    default: 0
  },
  neutralMinutes: {
    type: Number,
    default: 0
  },
  appUsage: [appUsageItemSchema],
  source: {
    type: String,
    enum: ['manual_entry', 'csv_import'],
    default: 'manual_entry'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

screenTimeRecordSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('ScreenTimeRecord', screenTimeRecordSchema);
