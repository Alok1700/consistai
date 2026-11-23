import express from 'express';
import {
  getRecommendations,
  updateRecommendationStatus
} from '../controllers/recommendationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getRecommendations);
router.patch('/:id/status', updateRecommendationStatus);

export default router;
