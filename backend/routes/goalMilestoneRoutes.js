import express from 'express';
import {
  getGoalMilestone,
  updateGoalMilestone,
  deleteGoalMilestone,
  reorderGoalMilestones,
  getMilestoneProgress
} from '../controllers/goalMilestoneController.js';
import {
  getModulesForMilestone,
  addModule,
  generateModules,
  importModules,
  reorderModules,
  batchRenameModules
} from '../controllers/goalModuleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/reorder', reorderGoalMilestones);
router.get('/:id/progress', getMilestoneProgress);

router.route('/:id')
  .get(getGoalMilestone)
  .put(updateGoalMilestone)
  .patch(updateGoalMilestone)
  .delete(deleteGoalMilestone);

// Sub-resource: Modules under milestone
router.get('/:milestoneId/modules', getModulesForMilestone);
router.post('/:milestoneId/modules/generate', generateModules);
router.post('/:milestoneId/modules/import', importModules);
router.post('/:milestoneId/modules/reorder', reorderModules);
router.post('/:milestoneId/modules/rename', batchRenameModules);
router.post('/:milestoneId/modules', addModule);

export default router;
