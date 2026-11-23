import mongoose from 'mongoose';

const assistantSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  preferredModel: {
    type: String,
    default: 'qwen3.5:4b'
  },
  preferredLanguage: {
    type: String,
    enum: ['auto', 'en', 'hi', 'hinglish'],
    default: 'auto'
  },
  preferredVoice: {
    type: String,
    default: 'default'
  },
  memoryEnabled: {
    type: Boolean,
    default: true
  },
  transcriptRetention: {
    type: String,
    enum: ['forever', '90d', '30d', 'disabled'],
    default: 'forever'
  },
  audioStorageEnabled: {
    type: Boolean,
    default: false
  },
  morningBriefingTime: {
    type: String,
    default: '08:00'
  },
  eveningReviewTime: {
    type: String,
    default: '20:30'
  },
  accountabilityMode: {
    type: String,
    enum: ['gentle', 'balanced', 'direct'],
    default: 'balanced'
  },
  reminderPreferences: {
    voiceAlerts: { type: Boolean, default: true },
    pushAlerts: { type: Boolean, default: true },
    preTaskMinutes: { type: Number, default: 10 }
  },
  quietHours: {
    enabled: { type: Boolean, default: true },
    start: { type: String, default: '23:00' },
    end: { type: String, default: '07:00' }
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  }
}, {
  timestamps: true
});

export default mongoose.model('AssistantSettings', assistantSettingsSchema);
