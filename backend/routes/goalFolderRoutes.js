import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  moveFolder
} from '../controllers/goalFolderController.js';

const router = express.Router();

router.get('/', protect, getFolders);
router.post('/', protect, createFolder);
router.patch('/:id', protect, updateFolder);
router.put('/:id', protect, updateFolder);
router.delete('/:id', protect, deleteFolder);
router.post('/:id/move', protect, moveFolder);

export default router;

