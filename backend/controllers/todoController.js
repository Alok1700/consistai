import Todo from '../models/Todo.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

export const getTodos = async (req, res, next) => {
  try {
    const { completed, priority, category, goal, q } = req.query;
    const query = { user: req.user.id };

    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    if (priority) {
      query.priority = priority;
    }
    if (category) {
      query.category = category;
    }
    if (goal) {
      query.goal = goal;
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Sort order: uncompleted first, then by priority (urgent -> high -> medium -> low), then newest
    const todos = await Todo.find(query)
      .populate('goal', 'title category')
      .populate('linkedTask', 'title status dueDate')
      .sort({ completed: 1, createdAt: -1 });

    // Aggregate quick stats for this user
    const allUserTodos = await Todo.find({ user: req.user.id });
    const total = allUserTodos.length;
    const completedCount = allUserTodos.filter(t => t.completed).length;
    const pendingCount = total - completedCount;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    res.json({
      success: true,
      todos,
      stats: {
        total,
        completed: completedCount,
        pending: pendingCount,
        completionRate
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createTodo = async (req, res, next) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      dueDate,
      goal
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Todo title is required.' });
    }

    const todo = await Todo.create({
      user: req.user.id,
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      category: category || 'General',
      dueDate: dueDate || null,
      goal: goal || null
    });

    const populatedTodo = await Todo.findById(todo._id).populate('goal', 'title category');

    res.status(201).json({
      success: true,
      todo: populatedTodo
    });
  } catch (err) {
    next(err);
  }
};

export const updateTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo item not found.' });
    }

    const {
      title,
      description,
      priority,
      category,
      dueDate,
      goal,
      completed
    } = req.body;

    if (title !== undefined) todo.title = title.trim();
    if (description !== undefined) todo.description = description.trim();
    if (priority !== undefined) todo.priority = priority;
    if (category !== undefined) todo.category = category;
    if (dueDate !== undefined) todo.dueDate = dueDate || null;
    if (goal !== undefined) todo.goal = goal || null;

    if (completed !== undefined && completed !== todo.completed) {
      todo.completed = Boolean(completed);
      todo.completedAt = todo.completed ? new Date() : null;
    }

    await todo.save();

    const populatedTodo = await Todo.findById(todo._id)
      .populate('goal', 'title category')
      .populate('linkedTask', 'title status dueDate');

    res.json({
      success: true,
      todo: populatedTodo
    });
  } catch (err) {
    next(err);
  }
};

export const toggleTodoComplete = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo item not found.' });
    }

    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? new Date() : null;

    await todo.save();

    const populatedTodo = await Todo.findById(todo._id)
      .populate('goal', 'title category')
      .populate('linkedTask', 'title status dueDate');

    res.json({
      success: true,
      todo: populatedTodo
    });
  } catch (err) {
    next(err);
  }
};

export const deleteTodo = async (req, res, next) => {
  try {
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo item not found.' });
    }

    res.json({
      success: true,
      message: 'Todo item deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};

export const clearCompletedTodos = async (req, res, next) => {
  try {
    const result = await Todo.deleteMany({ user: req.user.id, completed: true });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleared ${result.deletedCount} completed todo items.`
    });
  } catch (err) {
    next(err);
  }
};

export const convertTodoToTask = async (req, res, next) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo item not found.' });
    }

    const dueDate = todo.dueDate || new Date();
    const task = await Task.create({
      user: req.user.id,
      title: todo.title,
      description: todo.description || `Promoted from Todo item on ${new Date().toLocaleDateString()}`,
      goal: todo.goal || null,
      priority: todo.priority || 'medium',
      dueDate,
      estimatedMinutes: 45,
      actualMinutes: 0,
      status: todo.completed ? 'completed' : 'pending',
      completedAt: todo.completed ? (todo.completedAt || new Date()) : null,
      isGoalRelevant: Boolean(todo.goal)
    });

    if (todo.goal) {
      await Goal.findByIdAndUpdate(todo.goal, { $addToSet: { linkedTasks: task._id } });
    }

    const dateStr = new Date(dueDate).toISOString().slice(0, 10);
    await syncDailyAnalytics(req.user.id, dateStr);

    todo.convertedToTask = true;
    todo.linkedTask = task._id;
    await todo.save();

    const populatedTodo = await Todo.findById(todo._id)
      .populate('goal', 'title category')
      .populate('linkedTask', 'title status dueDate');

    res.status(201).json({
      success: true,
      message: 'Todo successfully converted to a trackable Task.',
      todo: populatedTodo,
      task
    });
  } catch (err) {
    next(err);
  }
};
