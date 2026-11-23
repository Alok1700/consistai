import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Todo title is required'],
    trim: true,
    maxlength: 300
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['General', 'Study', 'Coding', 'Project', 'Work', 'Personal'],
    default: 'General'
  },
  dueDate: {
    type: Date
  },
  goal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    index: true
  },
  convertedToTask: {
    type: Boolean,
    default: false
  },
  linkedTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }
}, {
  timestamps: true
});

todoSchema.index({ user: 1, completed: 1, createdAt: -1 });

export default mongoose.model('Todo', todoSchema);
