import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import 'dotenv/config';

import User from '../models/User.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import GoalFolder from '../models/GoalFolder.js';
import GoalMilestone from '../models/GoalMilestone.js';
import GoalModule from '../models/GoalModule.js';
import Milestone from '../models/Milestone.js';
import Habit from '../models/Habit.js';
import HabitCheckIn from '../models/HabitCheckIn.js';
import AssistantToolExecution from '../models/AssistantToolExecution.js';
import Conversation from '../models/Conversation.js';

import { executeTool } from '../services/assistant/toolExecutor.js';
import assistantAgentService from '../services/assistant/assistantAgentService.js';
import { confirmationService } from '../services/assistant/confirmationService.js';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/consistai_test';

test.before(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
});

test.after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

test('1. Autonomous Agent: Task Lifecycle with Instant Undo', async () => {
  const user = await User.create({
    name: 'Task Life Tester',
    email: `tasklife_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  // A. Create Task
  const createRes = await executeTool({
    userId: user._id,
    toolName: 'create_task',
    args: {
      title: 'Review System Architecture Document',
      priority: 'high',
      dueDate: 'tomorrow',
      category: 'Engineering'
    }
  });

  assert.equal(createRes.success, true);
  assert.ok(createRes.executionId);
  const taskId = createRes.result.taskId;
  const createdTask = await Task.findById(taskId);
  assert.equal(createdTask.title, 'Review System Architecture Document');
  assert.equal(createdTask.priority, 'high');
  assert.equal(createdTask.status, 'pending');

  // B. Complete Task
  const completeRes = await executeTool({
    userId: user._id,
    toolName: 'complete_task',
    args: { taskId }
  });
  assert.equal(completeRes.success, true);
  const completedTask = await Task.findById(taskId);
  assert.equal(completedTask.status, 'completed');

  // C. Undo Task Completion
  const undoRes = await executeTool({
    userId: user._id,
    toolName: 'undo_last_action',
    args: { executionId: completeRes.executionId }
  });
  assert.equal(undoRes.success, true);
  const restoredTask = await Task.findById(taskId);
  assert.equal(restoredTask.status, 'pending', 'Task status should be restored back to pending');
});

test('2. Autonomous Agent: Goal Creation, 30 Module Generation, Bulk Completion & Recalculation', async () => {
  const user = await User.create({
    name: 'Goal Master Tester',
    email: `goalmaster_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  // A. Create Goal with 30 modules directly
  const goalRes = await executeTool({
    userId: user._id,
    toolName: 'create_goal',
    args: {
      title: 'Master Java Spring Boot Microservices',
      category: 'DSA & Coding',
      moduleCount: 30,
      targetDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      priority: 'high'
    }
  });
  assert.equal(goalRes.success, true);
  const goalId = goalRes.result.goalId;

  const totalModules = await GoalModule.countDocuments({ goal: goalId });
  assert.equal(totalModules, 30, 'Goal should have exactly 30 modules');

  // B. Bulk Complete First 6 Modules (6 / 30 = 20%)
  const bulkRes = await executeTool({
    userId: user._id,
    toolName: 'bulk_complete_modules',
    args: {
      goalId,
      count: 6
    }
  });
  assert.equal(bulkRes.success, true);
  assert.equal(bulkRes.result.completedCount, 6);
  assert.equal(bulkRes.result.goalProgress, 20);

  const updatedGoal = await Goal.findById(goalId);
  assert.equal(updatedGoal.currentProgressPercentage, 20, 'Goal progress percentage should update to 20%');

  // C. Query Next Module
  const nextRes = await executeTool({
    userId: user._id,
    toolName: 'get_next_module',
    args: { goalId }
  });
  assert.equal(nextRes.success, true);
  assert.equal(nextRes.result.order, 7, 'Next pending module should be order 7');
});

test('3. Autonomous Agent: Habit Check-In & Streak Reversal', async () => {
  const user = await User.create({
    name: 'Habit Streak Tester',
    email: `habitstreak_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  // A. Create Habit
  const createHabitRes = await executeTool({
    userId: user._id,
    toolName: 'create_habit',
    args: {
      title: 'Daily 45 Min LeetCode',
      frequency: 'daily',
      category: 'DSA & Coding'
    }
  });
  assert.equal(createHabitRes.success, true);
  const habitId = createHabitRes.result.habitId;

  // B. Check In Habit
  const checkinRes = await executeTool({
    userId: user._id,
    toolName: 'log_habit_checkin',
    args: {
      habitId,
      status: 'completed'
    }
  });
  assert.equal(checkinRes.success, true);
  assert.equal(checkinRes.result.currentStreak, 1);
  const checkinCount = await HabitCheckIn.countDocuments({ habit: habitId });
  assert.equal(checkinCount, 1);

  // C. Undo Check-In
  const undoCheckin = await executeTool({
    userId: user._id,
    toolName: 'undo_last_action',
    args: { executionId: checkinRes.executionId }
  });
  assert.equal(undoCheckin.success, true);

  const restoredHabit = await Habit.findById(habitId);
  assert.equal(restoredHabit.currentStreak, 0, 'Streak should revert back to 0 on undo');
  const postUndoCount = await HabitCheckIn.countDocuments({ habit: habitId });
  assert.equal(postUndoCount, 0, 'Checkin record should be removed on undo');
});

test('4. Autonomous Agent: High-Risk Action Confirmation Protocol', async () => {
  const user = await User.create({
    name: 'Security Protocol Tester',
    email: `sec_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  const goal = await Goal.create({
    user: user._id,
    title: 'Sensitive Goal To Delete',
    category: 'DSA & Coding',
    targetDate: new Date(Date.now() + 30 * 86400000)
  });

  // Attempt delete without confirmation token
  const deleteAttempt = await executeTool({
    userId: user._id,
    toolName: 'delete_goal',
    args: { goalId: goal._id }
  });

  assert.equal(deleteAttempt.success, true);
  assert.equal(deleteAttempt.requiresConfirmation, true);
  assert.ok(deleteAttempt.confirmationToken);

  // Goal must NOT be deleted yet
  let goalInDb = await Goal.findById(goal._id);
  assert.ok(goalInDb, 'Goal must still exist pending confirmation');

  // Now confirm with valid token
  const confirmRes = await executeTool({
    userId: user._id,
    toolName: 'confirm_pending_action',
    args: { confirmationToken: deleteAttempt.confirmationToken }
  });

  assert.equal(confirmRes.success, true);
  assert.ok(confirmRes.result.message.includes('Goal "Sensitive Goal To Delete" and its modules deleted'));

  // Goal must now be deleted
  goalInDb = await Goal.findById(goal._id);
  assert.equal(goalInDb, null, 'Goal must be permanently deleted after confirmation');

  // Replay attempt with consumed token must fail
  const replayAttempt = await executeTool({
    userId: user._id,
    toolName: 'confirm_pending_action',
    args: { confirmationToken: deleteAttempt.confirmationToken }
  });
  assert.equal(replayAttempt.success, false, 'Replaying consumed token must fail');
});

test('5. Autonomous Agent: Natural Language & Hinglish Instant Handlers', async () => {
  const user = await User.create({
    name: 'Hinglish Tester',
    email: `hinglish_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  const conv = await Conversation.create({
    user: user._id,
    title: 'Hinglish Test Session'
  });

  // Create and complete a task to have an action to undo
  const task = await Task.create({
    user: user._id,
    title: 'Hinglish Reversible Task',
    status: 'completed',
    completedAt: new Date()
  });

  await AssistantToolExecution.create({
    user: user._id,
    conversationId: conv._id,
    toolName: 'complete_task',
    validatedArguments: { taskId: task._id },
    executionStatus: 'success',
    sanitizedResult: { message: 'Completed task' },
    undoData: { action: 'reopen_task', taskId: task._id },
    isUndone: false
  });

  // Test Undo command via Hinglish
  const hinglishUndo = await assistantAgentService.processMessage({
    userId: user._id,
    conversationId: conv._id,
    message: 'undo karo'
  });

  assert.equal(hinglishUndo.success, true);
  assert.equal(hinglishUndo.modelUsed, 'instant_handler');
  const restoredTask = await Task.findById(task._id);
  assert.equal(restoredTask.status, 'pending', 'Task reopened via Hinglish undo');

  // Register a pending destructive confirmation
  const confReq = confirmationService.requestConfirmation({
    userId: user._id,
    action: 'delete_task',
    payload: { taskId: task._id },
    preview: 'Delete Hinglish Reversible Task'
  });

  // Test Affirmative Confirmation command in Hinglish
  const hinglishConfirm = await assistantAgentService.processMessage({
    userId: user._id,
    conversationId: conv._id,
    message: 'haan proceed karo'
  });

  assert.equal(hinglishConfirm.success, true);
  assert.equal(hinglishConfirm.modelUsed, 'instant_handler');
  const deletedTask = await Task.findById(task._id);
  assert.equal(deletedTask, null, 'Task deleted via Hinglish affirmative confirmation');
});
