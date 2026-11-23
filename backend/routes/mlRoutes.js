import express from 'express';
import { runFullMLAnalysis, getLatestMLAnalysis } from '../controllers/mlController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/run-analysis', runFullMLAnalysis);
router.get('/latest', getLatestMLAnalysis);

export default router;
