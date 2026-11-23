import express from 'express';
import {
  startExperiment,
  getExperiments,
  getExperimentById,
  updateExperiment,
  logExperimentDailyAdherence,
  completeExperiment,
  getExperimentResults
} from '../controllers/experimentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(startExperiment)
  .get(getExperiments);

router.route('/:id')
  .get(getExperimentById)
  .patch(updateExperiment);

router.post('/:id/log', logExperimentDailyAdherence);
router.post('/:id/check-in', logExperimentDailyAdherence); // alias
router.patch('/:id/complete', completeExperiment);
router.get('/:id/results', getExperimentResults);

export default router;
