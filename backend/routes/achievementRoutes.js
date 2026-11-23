import express from 'express';
import {
  getGoalAchievements,
  getLatestAchievements,
  markAchievementCelebrated
} from '../controllers/achievementController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/latest', getLatestAchievements);
router.get('/goal/:goalId', getGoalAchievements);
router.patch('/:id/celebrated', markAchievementCelebrated);

export default router;
