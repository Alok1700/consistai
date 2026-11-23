import mongoose from 'mongoose';

const goalFolderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
    maxlength: 100
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GoalFolder',
    default: null,
    index: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    default: '#6366f1',
    trim: true
  },
  icon: {
    type: String,
    default: 'Folder',
    trim: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

goalFolderSchema.virtual('subfolders', {
  ref: 'GoalFolder',
  localField: '_id',
  foreignField: 'parentFolderId'
});

goalFolderSchema.index({ user: 1, name: 1, parentFolderId: 1 });

export default mongoose.model('GoalFolder', goalFolderSchema);

