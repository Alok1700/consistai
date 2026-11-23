import GoalFolder from '../models/GoalFolder.js';
import Goal from '../models/Goal.js';

const DEFAULT_FOLDERS = [
  { name: 'General', description: 'General goals and projects', color: '#6366f1', icon: 'Folder' },
  { name: 'Programming', description: 'Data structures, algorithms & software engineering', color: '#7c3aed', icon: 'Code' },
  { name: 'College & Academics', description: 'Curriculum, coursework & examinations', color: '#10b981', icon: 'GraduationCap' },
  { name: 'Career & Placements', description: 'Interviews, resume & career milestones', color: '#f59e0b', icon: 'Briefcase' },
  { name: 'Personal Growth', description: 'Habits, reading & fitness objectives', color: '#06b6d4', icon: 'Sparkles' }
];

export const goalFolderService = {
  /**
   * Seed default 5 folders if user has no folders yet
   */
  async ensureDefaultFolders(userId) {
    let folders = await GoalFolder.find({ user: userId }).sort({ sortOrder: 1, createdAt: 1 });
    if (folders.length === 0) {
      folders = await GoalFolder.insertMany(
        DEFAULT_FOLDERS.map((f, idx) => ({ ...f, user: userId, sortOrder: idx }))
      );
    }
    return folders;
  },

  /**
   * Get folder tree with recursive children and counts
   */
  async getFolderTree(userId) {
    const folders = await this.ensureDefaultFolders(userId);

    // Compute goal counts and subfolder counts
    const foldersWithStats = await Promise.all(
      folders.map(async (f) => {
        const goalCount = await Goal.countDocuments({
          user: userId,
          $or: [{ folderId: f._id }, { folder: f.name }]
        });
        const subfolderCount = await GoalFolder.countDocuments({
          user: userId,
          parentFolderId: f._id
        });
        return {
          ...f.toObject(),
          goalCount,
          subfolderCount
        };
      })
    );

    const folderMap = {};
    const rootFolders = [];

    foldersWithStats.forEach(f => {
      folderMap[f._id.toString()] = { ...f, children: [] };
    });

    foldersWithStats.forEach(f => {
      const pId = f.parentFolderId ? f.parentFolderId.toString() : null;
      if (pId && folderMap[pId]) {
        folderMap[pId].children.push(folderMap[f._id.toString()]);
      } else {
        rootFolders.push(folderMap[f._id.toString()]);
      }
    });

    return {
      folders: foldersWithStats,
      folderTree: rootFolders
    };
  },

  /**
   * Checks if targetParentId is a descendant of sourceFolderId (cycle check)
   */
  async isDescendant(userId, sourceFolderId, targetParentId) {
    if (!targetParentId || !sourceFolderId) return false;
    if (sourceFolderId.toString() === targetParentId.toString()) return true;

    let current = await GoalFolder.findOne({ _id: targetParentId, user: userId });
    while (current && current.parentFolderId) {
      if (current.parentFolderId.toString() === sourceFolderId.toString()) {
        return true;
      }
      current = await GoalFolder.findOne({ _id: current.parentFolderId, user: userId });
    }
    return false;
  },

  /**
   * Safe move folder
   */
  async moveFolder(userId, folderId, targetParentId) {
    const folder = await GoalFolder.findOne({ _id: folderId, user: userId });
    if (!folder) throw new Error('Folder not found.');

    if (targetParentId) {
      const isCycle = await this.isDescendant(userId, folderId, targetParentId);
      if (isCycle) {
        throw new Error('A folder cannot be moved into itself or into one of its descendants.');
      }

      const parent = await GoalFolder.findOne({ _id: targetParentId, user: userId });
      if (!parent) throw new Error('Target parent folder not found.');
    }

    folder.parentFolderId = targetParentId || null;
    await folder.save();
    return folder;
  },

  /**
   * Safe delete folder
   * Default behavior:
   * - Move goals to General
   * - Move immediate subfolders to deleted folder's parent (or General if deleted folder was root)
   * - Preserve all goal history
   * - Prevent deletion of General
   */
  async deleteFolder(userId, folderId, options = {}) {
    const { migrateTo = null, forceDelete = false } = options;
    const folder = await GoalFolder.findOne({ _id: folderId, user: userId });
    if (!folder) throw new Error('Folder not found.');

    if (folder.name === 'General' && !folder.parentFolderId) {
      throw new Error('Cannot delete default General folder.');
    }

    // Determine target folder for goals
    let targetFolder = null;
    if (migrateTo && migrateTo !== 'general') {
      targetFolder = await GoalFolder.findOne({ _id: migrateTo, user: userId });
    }
    if (!targetFolder) {
      targetFolder = await GoalFolder.findOne({ user: userId, name: 'General', parentFolderId: null });
    }
    const targetName = targetFolder ? targetFolder.name : 'General';
    const targetId = targetFolder ? targetFolder._id : null;

    if (forceDelete) {
      await Goal.deleteMany({ user: userId, $or: [{ folderId: folder._id }, { folder: folder.name }] });
    } else {
      await Goal.updateMany(
        { user: userId, $or: [{ folderId: folder._id }, { folder: folder.name }] },
        { folder: targetName, folderId: targetId }
      );
    }

    // Move child subfolders to parent of deleted folder or null
    await GoalFolder.updateMany(
      { user: userId, parentFolderId: folder._id },
      { parentFolderId: folder.parentFolderId || null }
    );

    await GoalFolder.deleteOne({ _id: folder._id });
    return {
      deletedFolder: folder,
      targetName,
      targetId
    };
  }
};
