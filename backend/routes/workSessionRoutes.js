import express from 'express';
import {
  logWorkSession,
  getWorkSessions,
  deleteWorkSession
} from '../controllers/workSessionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(logWorkSession)
  .get(getWorkSessions);

router.route('/:id')
  .delete(deleteWorkSession);

export default router;
