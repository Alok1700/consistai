import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Habit from '../models/Habit.js';
import Task from '../models/Task.js';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE = 'http://127.0.0.1:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/consistai_ml';
const JWT_SECRET = process.env.JWT_SECRET || 'consistai_jwt_secret_key_2026';

async function runE2EVerification() {
  console.log('🚀 Starting ConsistAI End-to-End Ollama Assistant Verification...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // 1. Create or retrieve test user
  let user = await User.findOne({ email: 'e2e_verifier@consistai.local' });
  if (!user) {
    user = await User.create({
      name: 'E2E Verifier',
      email: 'e2e_verifier@consistai.local',
      password: 'SecurePassword123!'
    });
  }
  const token = jwt.sign({ id: user._id, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '1d' });
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Step 1: GET /api/assistant/health
  console.log('Step 1: Testing /api/assistant/health...');
  const healthRes = await fetch(`${API_BASE}/assistant/health`, { headers: authHeaders });
  assert.equal(healthRes.status, 200, `Health status returned ${healthRes.status}`);
  const healthData = await healthRes.json();
  console.log('✔ Health response:', {
    online: healthData.online,
    activeModel: healthData.activeModel,
    latencyMs: healthData.latencyMs,
    supportsTools: healthData.supportsTools
  });
  assert.equal(healthData.online, true, 'Ollama should be online');
  assert.ok(healthData.activeModel, 'Active model must be present');

  // Step 2: GET /api/assistant/models
  console.log('\nStep 2: Testing /api/assistant/models...');
  const modelsRes = await fetch(`${API_BASE}/assistant/models`, { headers: authHeaders });
  assert.equal(modelsRes.status, 200);
  const modelsData = await modelsRes.json();
  console.log('✔ Models discovered:', modelsData.models.map(m => `${m.name} (tools: ${m.supportsTools}, size: ${m.sizeGb}GB)`));
  assert.ok(modelsData.models.length > 0, 'At least 1 installed model should be discovered');

  // Step 3: POST /api/assistant/test-connection
  console.log('\nStep 3: Testing /api/assistant/test-connection...');
  const testConnRes = await fetch(`${API_BASE}/assistant/test-connection`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ model: healthData.activeModel })
  });
  assert.equal(testConnRes.status, 200);
  const testConnData = await testConnRes.json();
  console.log('✔ Test Connection diagnostic:', testConnData);
  assert.equal(testConnData.success, true, 'Test connection must succeed');

  // Step 4: POST /api/assistant/chat (English Habit Creation Tool)
  console.log('\nStep 4: Testing Assistant Chat Tool Calling: Habit Creation...');
  const habitPrompt = 'Add habit: Drink 2L water daily';
  const chatRes1 = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ message: habitPrompt })
  });
  assert.equal(chatRes1.status, 200);
  const chatData1 = await chatRes1.json();
  console.log('✔ Assistant Response:', chatData1.reply);
  console.log('✔ Tool Executions:', chatData1.toolResults?.map(t => ({ tool: t.toolName, result: t.result?.title || t.result?.message })));
  
  // Verify habit exists in DB
  const habit = await Habit.findOne({ user: user._id, title: /Drink 2L water/i });
  assert.ok(habit, 'Habit must be created in MongoDB');
  console.log(`✔ Verified habit saved in database with ID: ${habit._id}`);

  // Step 5: Verify habit appears in GET /api/habits
  console.log('\nStep 5: Verifying GET /api/habits endpoint...');
  const habitsListRes = await fetch(`${API_BASE}/habits`, { headers: authHeaders });
  assert.equal(habitsListRes.status, 200);
  const habitsListData = await habitsListRes.json();
  const matchedHabit = (habitsListData.habits || []).find(h => h._id.toString() === habit._id.toString());
  assert.ok(matchedHabit, 'Created habit must be returned by GET /api/habits');
  console.log(`✔ Confirmed habit "${matchedHabit.title}" returned by /api/habits`);

  // Step 6: POST /api/assistant/chat (Hinglish Task Creation Tool)
  console.log('\nStep 6: Testing Assistant Chat Tool Calling in Hinglish: Task Creation...');
  const taskPrompt = 'Kal subah 9 baje study session task add karo';
  const chatRes2 = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ message: taskPrompt })
  });
  assert.equal(chatRes2.status, 200);
  const chatData2 = await chatRes2.json();
  console.log('✔ Assistant Hinglish Response:', chatData2.reply || chatData2.message);
  console.log('✔ Tool Executions:', chatData2.toolResults?.map(t => ({ tool: t.toolName, result: t.result?.title || t.result?.message })));

  // Verify task exists in DB
  const task = await Task.findOne({ user: user._id, title: /study/i });
  assert.ok(task, 'Task must be created in MongoDB from Hinglish prompt');
  console.log(`✔ Verified task saved in database with ID: ${task._id}, title: "${task.title}"`);

  // Step 7: GET /api/assistant/summary/daily
  console.log('\nStep 7: Verifying GET /api/assistant/summary/daily...');
  const summaryRes = await fetch(`${API_BASE}/assistant/summary/daily`, { headers: authHeaders });
  assert.equal(summaryRes.status, 200);
  const summaryData = await summaryRes.json();
  console.log('✔ Daily Summary Factual Stats:', summaryData.factual);
  assert.ok(summaryData.factual, 'Factual daily metrics must be returned');

  // Step 8: AI completes an existing task
  console.log('\nStep 8: Testing Task Completion Tool via Assistant...');
  const completePrompt = `Mark task "${task.title}" as completed`;
  const completeRes = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ message: completePrompt })
  });
  assert.equal(completeRes.status, 200);
  const updatedTask = await Task.findById(task._id);
  assert.equal(updatedTask.status, 'completed', 'Task must be marked completed in MongoDB');
  console.log(`✔ Verified task "${updatedTask.title}" marked as completed in DB`);

  // Step 9: "What did I forget?" endpoint
  console.log('\nStep 9: Verifying GET /api/assistant/what-did-i-forget...');
  const forgetRes = await fetch(`${API_BASE}/assistant/what-did-i-forget`, { headers: authHeaders });
  assert.equal(forgetRes.status, 200);
  const forgetData = await forgetRes.json();
  console.log('✔ Forgotten items summary:', forgetData.summary);
  assert.ok(forgetData.factual, 'Factual forget data must be present');

  // Step 10: Interactive Reminder Response Endpoint
  console.log('\nStep 10: Testing Reminder creation and response...');
  const reminderRes = await fetch(`${API_BASE}/assistant/reminders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: 'Practice LeetCode Trees',
      scheduledAt: new Date(Date.now() + 600000).toISOString()
    })
  });
  assert.equal(reminderRes.status, 201);
  const reminderData = await reminderRes.json();
  const createdReminderId = reminderData.reminder._id;

  const respondRes = await fetch(`${API_BASE}/assistant/reminders/${createdReminderId}/respond`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'still_working', snoozeMinutes: 30 })
  });
  assert.equal(respondRes.status, 200);
  const respondData = await respondRes.json();
  console.log('✔ Reminder interaction response:', respondData.message);
  assert.equal(respondData.action, 'still_working');

  console.log('\n🎉 ALL 10 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY!');
  await mongoose.disconnect();
}

runE2EVerification().catch(err => {
  console.error('❌ E2E Verification failed:', err);
  process.exit(1);
});
