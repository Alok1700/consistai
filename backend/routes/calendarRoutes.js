import express from 'express';
import {
  getMonthCalendar,
  getDayDetail,
  markHolidayOrRestDay
} from '../controllers/calendarController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/month', getMonthCalendar);
router.get('/day/:date', getDayDetail);
router.post('/day/:date/rest-day', markHolidayOrRestDay);

export default router;
