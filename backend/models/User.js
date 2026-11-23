import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'professional', 'researcher', 'admin'],
    default: 'student'
  },
  preferences: {
    dailyWorkHourTarget: { type: Number, default: 4 }, // hours
    dailyStudyHours: { type: Number, default: 4 },
    maxDistractingScreenTime: { type: Number, default: 60 }, // minutes
    theme: { type: String, default: 'dark' },
    notificationsEnabled: { type: Boolean, default: true },
    workingDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
    timezone: { type: String, default: 'UTC' },
    primaryGoalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', default: null }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
