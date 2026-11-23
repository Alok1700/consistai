import express from 'express';
import {
  createHabit,
  getHabits,
  updateHabit,
  toggleHabitCheckIn,
  deleteHabit
} from '../controllers/habitController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createHabit)
  .get(getHabits);

router.route('/:id')
  .put(updateHabit)
  .delete(deleteHabit);

router.post('/:habitId/check-in', toggleHabitCheckIn);
router.post('/:habitId/checkin', toggleHabitCheckIn);

export default router;
