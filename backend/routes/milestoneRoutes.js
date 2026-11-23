import express from 'express';
import {
  updateMilestone,
  deleteMilestone,
  updateMilestoneStatus,
  updateMilestoneNotes,
  addMilestoneTask,
  addMilestoneResource,
  deleteMilestoneResource,
  reorderMilestones,
  bulkUpdateMilestones
} from '../controllers/milestoneController.js';
import {
  getModulesForMilestone,
  addModule,
  generateModules,
  importModules,
  batchRenameModules
} from '../controllers/goalModuleController.js';
import { getMilestoneProgress } from '../controllers/goalMilestoneController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/bulk-update', bulkUpdateMilestones);
router.post('/reorder', reorderMilestones);
router.get('/:id/progress', getMilestoneProgress);
router.patch('/:id/status', updateMilestoneStatus);
router.put('/:id/notes', updateMilestoneNotes);
router.post('/:id/tasks', addMilestoneTask);
router.post('/:id/resources', addMilestoneResource);
router.delete('/:id/resources/:resourceId', deleteMilestoneResource);

// Sub-resource routes for modules under milestone
router.get('/:milestoneId/modules', getModulesForMilestone);
router.post('/:milestoneId/modules/generate', generateModules);
router.post('/:milestoneId/modules/import', importModules);
router.post('/:milestoneId/modules/rename', batchRenameModules);
router.post('/:milestoneId/modules', addModule);

router.route('/:id')
  .put(updateMilestone)
  .delete(deleteMilestone);

export default router;