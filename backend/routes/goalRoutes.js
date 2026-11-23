import express from 'express';
import {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal,
  recordNumericalProgress,
  addYearlyTarget,
  toggleYearlyTarget,
  deleteYearlyTarget,
  setPrimaryGoal,
  completeGoalWithReflection,
  moveGoal,
  toggleFavoriteGoal,
  toggleArchiveGoal,
  duplicateGoal,
  getGoalTemplates,
  createGoalFromTemplate,
  searchGoalsGlobal
} from '../controllers/goalController.js';
import {
  addMilestone,
  getMilestonesForGoal,
  generateMilestones,
  importModules
} from '../controllers/milestoneController.js';
import {
  getMilestonesForGoal as getGoalMilestones,
  addGoalMilestone,
  getGoalProgress
} from '../controllers/goalMilestoneController.js';
import goalFolderRoutes from './goalFolderRoutes.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/templates', getGoalTemplates);
router.post('/from-template', createGoalFromTemplate);
router.get('/search', searchGoalsGlobal);
router.use('/folders', goalFolderRoutes);

router.route('/')
  .post(createGoal)
  .get(getGoals);

router.route('/:id')
  .get(getGoalById)
  .put(updateGoal)
  .patch(updateGoal)
  .delete(deleteGoal);

router.put('/:id/primary', setPrimaryGoal);
router.post('/:id/complete', completeGoalWithReflection);
router.get('/:id/progress', getGoalProgress);
router.post('/:id/progress', recordNumericalProgress);
router.patch('/:id/move', moveGoal);
router.patch('/:id/favorite', toggleFavoriteGoal);
router.patch('/:id/archive', toggleArchiveGoal);
router.post('/:id/duplicate', duplicateGoal);
router.post('/:goalId/milestones', addMilestone);
router.get('/:goalId/milestones', getMilestonesForGoal);
router.post('/:goalId/milestones/generate', generateMilestones);
router.post('/:goalId/milestones/import', importModules);

// Aliases for unified Level 2 Module API
router.post('/:goalId/modules', addMilestone);
router.get('/:goalId/modules', getMilestonesForGoal);
router.post('/:goalId/modules/generate', generateMilestones);
router.post('/:goalId/modules/import', importModules);

// New 3-level hierarchy: Goal → GoalMilestone (container) → GoalModule (leaf)
router.get('/:goalId/goal-milestones', getGoalMilestones);
router.post('/:goalId/goal-milestones', addGoalMilestone);

// Yearly targets for goal
router.post('/:id/yearly-targets', addYearlyTarget);
router.patch('/:id/yearly-targets/:targetId/toggle', toggleYearlyTarget);
router.delete('/:id/yearly-targets/:targetId', deleteYearlyTarget);

export default router;
