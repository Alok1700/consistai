import express from 'express';
import {
  planGoal,
  saveApprovedGoalPlan,
  adjustPlan,
  applyPlanAdjustment,
  chatCoach,
  quickCapture,
  generateMilestonesAI,
  goalAssistanceAI,
  generateMilestoneModulesController
} from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/plan-goal', planGoal);
router.post('/save-approved-goal', saveApprovedGoalPlan);
router.post('/adjust-plan', adjustPlan);
router.post('/apply-plan-adjustment', applyPlanAdjustment);
router.post('/chat', chatCoach);
router.post('/quick-capture', quickCapture);
router.post('/generate-milestones', generateMilestonesAI);
router.post('/goal-assistance', goalAssistanceAI);
router.post('/generate-milestone-modules', generateMilestoneModulesController);

export default router;
