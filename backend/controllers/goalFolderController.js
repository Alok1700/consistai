import GoalFolder from '../models/GoalFolder.js';
import Goal from '../models/Goal.js';
import { goalFolderService } from '../services/goalFolderService.js';

export const getFolders = async (req, res, next) => {
  try {
    const { folders, folderTree } = await goalFolderService.getFolderTree(req.user.id);
    res.json({
      success: true,
      count: folders.length,
      folders,
      folderTree
    });
  } catch (err) {
    next(err);
  }
};

export const createFolder = async (req, res, next) => {
  try {
    const { name, parentFolderId, description, color, icon, sortOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required.' });
    }

    if (parentFolderId) {
      const parent = await GoalFolder.findOne({ _id: parentFolderId, user: req.user.id });
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent folder not found.' });
      }
    }

    const existing = await GoalFolder.findOne({
      user: req.user.id,
      name: name.trim(),
      parentFolderId: parentFolderId || null
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A folder with this name already exists in this directory.' });
    }

    const folder = await GoalFolder.create({
      user: req.user.id,
      name: name.trim(),
      parentFolderId: parentFolderId || null,
      description: description ? description.trim() : '',
      color: color || '#6366f1',
      icon: icon || 'Folder',
      sortOrder: Number(sortOrder || 0)
    });

    res.status(201).json({
      success: true,
      folder: {
        ...folder.toObject(),
        goalCount: 0,
        subfolderCount: 0
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateFolder = async (req, res, next) => {
  try {
    const { name, parentFolderId, description, color, icon, sortOrder } = req.body;
    const folder = await GoalFolder.findOne({ _id: req.params.id, user: req.user.id });

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found.' });
    }

    const oldName = folder.name;
    const newName = name ? name.trim() : oldName;

    // Prevent making a folder its own parent or descendant (circular)
    if (parentFolderId) {
      if (parentFolderId.toString() === folder._id.toString()) {
        return res.status(400).json({ success: false, message: 'A folder cannot be its own parent.' });
      }
      const isCycle = await goalFolderService.isDescendant(req.user.id, folder._id, parentFolderId);
      if (isCycle) {
        return res.status(400).json({ success: false, message: 'A folder cannot be moved into itself or into one of its descendants.' });
      }
    }

    folder.name = newName;
    if (parentFolderId !== undefined) folder.parentFolderId = parentFolderId || null;
    if (description !== undefined) folder.description = description.trim();
    if (color) folder.color = color;
    if (icon) folder.icon = icon;
    if (sortOrder !== undefined) folder.sortOrder = Number(sortOrder);
    await folder.save();

    // If folder name changed, cascade update existing goals
    if (newName !== oldName) {
      await Goal.updateMany(
        { user: req.user.id, $or: [{ folderId: folder._id }, { folder: oldName }] },
        { folder: newName }
      );
    }

    const goalCount = await Goal.countDocuments({
      user: req.user.id,
      $or: [{ folderId: folder._id }, { folder: newName }]
    });

    res.json({
      success: true,
      folder: {
        ...folder.toObject(),
        goalCount
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteFolder = async (req, res, next) => {
  try {
    const { migrateTo, forceDelete } = req.body || {};
    const result = await goalFolderService.deleteFolder(req.user.id, req.params.id, { migrateTo, forceDelete });
    res.json({
      success: true,
      message: `Folder "${result.deletedFolder.name}" deleted safely. Goals migrated to "${result.targetName}".`
    });
  } catch (err) {
    next(err);
  }
};

export const moveFolder = async (req, res, next) => {
  try {
    const { parentFolderId } = req.body;
    const folder = await goalFolderService.moveFolder(req.user.id, req.params.id, parentFolderId);
    res.json({ success: true, folder });
  } catch (err) {
    next(err);
  }
};
