import express from 'express';
import {
  createTask,
  getTasks,
  updateTask,
  toggleTaskComplete,
  deleteTask
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.patch('/:id/toggle', toggleTaskComplete);

export default router;
