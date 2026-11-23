import express from 'express';
import {
  getTodos,
  createTodo,
  updateTodo,
  toggleTodoComplete,
  deleteTodo,
  clearCompletedTodos,
  convertTodoToTask
} from '../controllers/todoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTodos)
  .post(createTodo);

router.delete('/completed/clear', clearCompletedTodos);

router.route('/:id')
  .put(updateTodo)
  .delete(deleteTodo);

router.patch('/:id/toggle', toggleTodoComplete);
router.post('/:id/convert-to-task', convertTodoToTask);

export default router;
