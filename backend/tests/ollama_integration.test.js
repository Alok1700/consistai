import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import Reminder from '../models/Reminder.js';
import AssistantMemory from '../models/AssistantMemory.js';
import Conversation from '../models/Conversation.js';
import ConversationMessage from '../models/ConversationMessage.js';
import ollamaService from '../services/ai/ollamaService.js';
import modelService from '../services/ai/modelService.js';
import { executeTool } from '../services/assistant/toolExecutor.js';
import assistantAgentService from '../services/assistant/assistantAgentService.js';
import summaryService from '../services/assistant/summaryService.js';

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

test('1. Ollama Server Live Health & Model Discovery', async () => {
  const health = await ollamaService.checkHealth();
  assert.equal(health.online, true, 'Ollama server should be online at http://127.0.0.1:11434');
  assert.ok(health.latencyMs >= 0);
  assert.ok(health.modelsCount > 0, 'Ollama should have installed models');

  const models = await ollamaService.getInstalledModels();
  assert.ok(models.length > 0);
  const qwen35 = models.find(m => m.name.includes('qwen') || m.name.includes('gemma'));
  assert.ok(qwen35, 'Expected qwen or gemma model to be installed');
  assert.ok(typeof qwen35.supportsTools === 'boolean');
});

test('2. ModelService: Resolves effective model & capability validation', async () => {
  const effective = await modelService.getEffectiveModel();
  assert.ok(effective.modelName);
  assert.equal(effective.isInstalled, true);
  assert.equal(effective.supportsTools, true);
});

test('3. ToolExecutor: Executes Task, Goal, Habit, Focus, Reminder, and Memory Tools', async () => {
  const testUser = await User.create({
    name: 'Tool Executor Tester',
    email: `tooltest_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  // A. Create Task Tool
  const taskRes = await executeTool({
    userId: testUser._id,
    toolName: 'create_task',
    args: {
      title: 'Study Dynamic Programming',
      dueDate: new Date().toISOString().slice(0, 10),
      priority: 'high',
      estimatedMinutes: 60,
      reminderMinutesBefore: 15
    }
  });
  assert.equal(taskRes.success, true);
  assert.equal(taskRes.result.title, 'Study Dynamic Programming');
  assert.equal(taskRes.result.priority, 'high');

  // Verify task was created in DB
  const savedTask = await Task.findById(taskRes.result.taskId);
  assert.ok(savedTask);
  assert.equal(savedTask.title, 'Study Dynamic Programming');

  // Verify automatic reminder was scheduled
  const scheduledReminder = await Reminder.findOne({ taskId: savedTask._id });
  assert.ok(scheduledReminder);
  assert.equal(scheduledReminder.status, 'scheduled');

  // B. Complete Task Tool
  const completeRes = await executeTool({
    userId: testUser._id,
    toolName: 'complete_task',
    args: { taskId: savedTask._id.toString() }
  });
  assert.equal(completeRes.success, true);

  // Verify reminder was dismissed upon task completion
  const updatedReminder = await Reminder.findById(scheduledReminder._id);
  assert.equal(updatedReminder.status, 'dismissed');

  // C. Create Goal Tool
  const goalRes = await executeTool({
    userId: testUser._id,
    toolName: 'create_goal',
    args: {
      title: 'Full Stack Mastery in 60 Days',
      category: 'Web Development',
      moduleCount: 12
    }
  });
  assert.equal(goalRes.success, true);
  assert.equal(goalRes.result.moduleCount, 12);

  // D. Create Habit Tool
  const habitRes = await executeTool({
    userId: testUser._id,
    toolName: 'create_habit',
    args: {
      title: 'Morning 20m Technical Reading',
      category: 'Technical Reading',
      frequency: 'daily'
    }
  });
  assert.equal(habitRes.success, true);
  assert.equal(habitRes.result.category, 'Technical Reading');

  // E. Save Memory Tool
  const memRes = await executeTool({
    userId: testUser._id,
    toolName: 'save_memory',
    args: {
      content: 'User prefers studying in 45-minute focus intervals',
      category: 'preference',
      importance: 'high'
    }
  });
  assert.equal(memRes.success, true);
  const savedMem = await AssistantMemory.findById(memRes.result.memoryId);
  assert.ok(savedMem);
  assert.equal(savedMem.category, 'preference');

  // F. Save Daily Journal Note
  const noteRes = await executeTool({
    userId: testUser._id,
    toolName: 'save_daily_note',
    args: {
      note: 'Finished 5 sliding window problems today with great momentum',
      category: 'study'
    }
  });
  assert.equal(noteRes.success, true);
});

test('4. SummaryService: Compiles factual activities and daily summary', async () => {
  const testUser = await User.create({
    name: 'Summary Tester',
    email: `summarytest_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  const summary = await summaryService.getDailySummary(testUser._id);
  assert.equal(summary.success, true);
  assert.ok(summary.factual);
  assert.ok(typeof summary.factual.consistencyScore === 'number');
  assert.ok(typeof summary.summary === 'string');
});

test('5. AssistantAgentService: End-to-End Chat & Tool Calling via Local Ollama', async () => {
  const testUser = await User.create({
    name: 'Agent Live Tester',
    email: `agenttest_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  const response = await assistantAgentService.processMessage({
    userId: testUser._id,
    message: 'Add a task to study System Design tomorrow at 5 PM',
    clientTimezone: 'Asia/Kolkata'
  });

  assert.equal(response.success, true);
  assert.ok(response.conversationId);
  assert.ok(response.message);
  assert.ok(response.toolResults);

  // Check that task was created in DB
  const createdTask = await Task.findOne({
    user: testUser._id,
    title: /System Design/i
  });
  assert.ok(createdTask, 'Task "Study System Design" should be persisted to MongoDB via Ollama tool execution');

  // Check conversation messages persisted
  const messages = await ConversationMessage.find({ conversationId: response.conversationId });
  assert.equal(messages.length, 2, 'Should persist 1 user message and 1 assistant message');
  assert.equal(messages[0].role, 'user');
  assert.equal(messages[1].role, 'assistant');
});
