import mongoose from 'mongoose';
import Task from '../../models/Task.js';
import Goal from '../../models/Goal.js';
import GoalFolder from '../../models/GoalFolder.js';
import GoalMilestone from '../../models/GoalMilestone.js';
import GoalModule from '../../models/GoalModule.js';
import Habit from '../../models/Habit.js';
import ConversationMessage from '../../models/ConversationMessage.js';

/**
 * EntityResolver — Contextual resolution of natural-language record references
 * Resolves references like "this goal", "my java task", "module 5", "the reading habit"
 * to actual MongoDB documents with ownership validation.
 */
export const entityResolver = {
  /**
   * Resolve a Task by ID, title match, or recent context
   */
  async resolveTask({ userId, taskId, taskTitle, conversationId = null }) {
    if (taskId && mongoose.Types.ObjectId.isValid(taskId)) {
      const task = await Task.findOne({ _id: taskId, user: userId });
      if (task) return task;
    }

    if (taskTitle && taskTitle.trim()) {
      const cleanTitle = taskTitle.trim();
      // 1. Exact match
      let task = await Task.findOne({
        user: userId,
        title: { $regex: new RegExp(`^${escapeRegex(cleanTitle)}$`, 'i') }
      }).sort({ updatedAt: -1 });
      if (task) return task;

      // 2. Contains match
      task = await Task.findOne({
        user: userId,
        title: { $regex: new RegExp(escapeRegex(cleanTitle), 'i') }
      }).sort({ updatedAt: -1 });
      if (task) return task;
    }

    // 3. Fallback to most recently mentioned or updated pending task
    if (conversationId) {
      const recentTask = await Task.findOne({ user: userId, status: { $ne: 'completed' } })
        .sort({ updatedAt: -1 });
      if (recentTask) return recentTask;
    }

    return null;
  },

  /**
   * Resolve a Goal by ID, title, or recent context
   */
  async resolveGoal({ userId, goalId, goalTitle, conversationId = null }) {
    if (goalId && mongoose.Types.ObjectId.isValid(goalId)) {
      const goal = await Goal.findOne({ _id: goalId, user: userId });
      if (goal) return goal;
    }

    if (goalTitle && goalTitle.trim()) {
      const cleanTitle = goalTitle.trim();
      let goal = await Goal.findOne({
        user: userId,
        title: { $regex: new RegExp(`^${escapeRegex(cleanTitle)}$`, 'i') }
      }).sort({ updatedAt: -1 });
      if (goal) return goal;

      goal = await Goal.findOne({
        user: userId,
        title: { $regex: new RegExp(escapeRegex(cleanTitle), 'i') }
      }).sort({ updatedAt: -1 });
      if (goal) return goal;
    }

    // Fallback: active primary or most recently updated active goal
    const fallbackGoal = await Goal.findOne({ user: userId, status: 'active' })
      .sort({ isFavorite: -1, updatedAt: -1 });
    return fallbackGoal;
  },

  /**
   * Resolve a Goal Folder by ID or name
   */
  async resolveFolder({ userId, folderId, folderName }) {
    if (folderId && mongoose.Types.ObjectId.isValid(folderId)) {
      const folder = await GoalFolder.findOne({ _id: folderId, user: userId });
      if (folder) return folder;
    }

    if (folderName && folderName.trim()) {
      const clean = folderName.trim();
      const folder = await GoalFolder.findOne({
        user: userId,
        name: { $regex: new RegExp(`^${escapeRegex(clean)}$`, 'i') }
      });
      if (folder) return folder;
    }

    return null;
  },

  /**
   * Resolve a Milestone under a goal
   */
  async resolveMilestone({ userId, goalId, milestoneId, milestoneTitle, order }) {
    if (milestoneId && mongoose.Types.ObjectId.isValid(milestoneId)) {
      const ms = await GoalMilestone.findOne({ _id: milestoneId, user: userId });
      if (ms) return ms;
    }

    const query = { user: userId };
    if (goalId && mongoose.Types.ObjectId.isValid(goalId)) {
      query.goal = goalId;
    }

    if (order && Number(order) > 0) {
      const ms = await GoalMilestone.findOne({ ...query, order: Number(order) });
      if (ms) return ms;
    }

    if (milestoneTitle && milestoneTitle.trim()) {
      const clean = milestoneTitle.trim();
      let ms = await GoalMilestone.findOne({
        ...query,
        title: { $regex: new RegExp(escapeRegex(clean), 'i') }
      }).sort({ updatedAt: -1 });
      if (ms) return ms;
    }

    // Default to the first in-progress or not-started milestone, or any milestone under the goal
    let ms = await GoalMilestone.findOne({ ...query, status: { $ne: 'completed' } }).sort({ order: 1 });
    if (!ms) {
      ms = await GoalMilestone.findOne(query).sort({ order: 1 });
    }
    return ms;
  },

  /**
   * Resolve a Module under a milestone or goal
   */
  async resolveModule({ userId, goalId, milestoneId, moduleId, moduleTitle, moduleOrder }) {
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      const mod = await GoalModule.findOne({ _id: moduleId, user: userId });
      if (mod) return mod;
    }

    const query = { user: userId };
    if (goalId && mongoose.Types.ObjectId.isValid(goalId)) query.goal = goalId;
    if (milestoneId && mongoose.Types.ObjectId.isValid(milestoneId)) query.milestone = milestoneId;

    if (moduleOrder && Number(moduleOrder) > 0) {
      const mod = await GoalModule.findOne({ ...query, order: Number(moduleOrder) });
      if (mod) return mod;
    }

    if (moduleTitle && moduleTitle.trim()) {
      const clean = moduleTitle.trim();
      // Handle "module 5" or "5"
      const numMatch = clean.match(/module\s*(\d+)/i) || clean.match(/^(\d+)$/);
      if (numMatch) {
        const orderNum = parseInt(numMatch[1], 10);
        const modByNum = await GoalModule.findOne({ ...query, order: orderNum });
        if (modByNum) return modByNum;
      }

      let mod = await GoalModule.findOne({
        ...query,
        title: { $regex: new RegExp(escapeRegex(clean), 'i') }
      }).sort({ updatedAt: -1 });
      if (mod) return mod;
    }

    // Default to next incomplete module
    return await GoalModule.findOne({ ...query, isCompleted: false }).sort({ order: 1 });
  },

  /**
   * Resolve a Habit by ID or title
   */
  async resolveHabit({ userId, habitId, habitTitle }) {
    if (habitId && mongoose.Types.ObjectId.isValid(habitId)) {
      const habit = await Habit.findOne({ _id: habitId, user: userId });
      if (habit) return habit;
    }

    if (habitTitle && habitTitle.trim()) {
      const clean = habitTitle.trim();
      let habit = await Habit.findOne({
        user: userId,
        title: { $regex: new RegExp(`^${escapeRegex(clean)}$`, 'i') }
      });
      if (habit) return habit;

      habit = await Habit.findOne({
        user: userId,
        title: { $regex: new RegExp(escapeRegex(clean), 'i') }
      });
      if (habit) return habit;
    }

    return null;
  }
};

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export default entityResolver;
