import express from 'express';
import {
  logScreenTime,
  importScreenTimeCSV,
  getScreenTimeHistory
} from '../controllers/screenTimeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(logScreenTime)
  .get(getScreenTimeHistory);

router.post('/import-csv', importScreenTimeCSV);

export default router;
