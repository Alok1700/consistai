import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    required: true,
    index: true
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  achievementType: {
    type: String,
    enum: [
      'first_task_completed',
      'first_milestone_completed',
      'milestone_completed',
      'progress_25',
      'progress_50',
      'progress_75',
      'goal_completed',
      'consistency_streak_7',
      'consistency_streak_14'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'Trophy'
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'silver'
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  celebrated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Prevent duplicate achievements for the same user, goal, achievementType and milestone
achievementSchema.index({ user: 1, goal: 1, achievementType: 1, milestone: 1 }, { unique: true });

export default mongoose.model('Achievement', achievementSchema);
