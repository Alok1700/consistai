import express from 'express';
import {
  updateModule,
  toggleModuleStatus,
  updateModuleStatus,
  deleteModule,
  reorderModules
} from '../controllers/goalModuleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/reorder', reorderModules);
router.patch('/:id/toggle', toggleModuleStatus);
router.patch('/:id/status', updateModuleStatus);
router.patch('/:id', updateModule);
router.delete('/:id', deleteModule);

export default router;
