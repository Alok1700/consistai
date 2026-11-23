import axios from 'axios';
import mongoose from 'mongoose';
import 'dotenv/config';

const BACKEND_URL = 'http://127.0.0.1:5000';
const FRONTEND_URL = 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/consistai_ml';

async function verifySystem() {
  console.log('====================================================');
  console.log('🔍 CONSISTAI FULL SYSTEM HEALTH AUDIT');
  console.log('====================================================\n');

  const report = [];

  // 1. Check MongoDB Connection directly
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ [Database] MongoDB connected successfully');
    report.push({ service: 'MongoDB', status: 'PASS', details: 'Connected to ' + MONGODB_URI });
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ [Database] MongoDB connection failed:', err.message);
    report.push({ service: 'MongoDB', status: 'FAIL', details: err.message });
  }

  // 2. Check Backend Server Health
  try {
    const res = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 4000 });
    console.log('✅ [Backend API] /api/health is online:', res.data.status);
    report.push({ service: 'Backend /api/health', status: 'PASS', details: res.data });
  } catch (err) {
    console.error('❌ [Backend API] /api/health unreachable:', err.message);
    report.push({ service: 'Backend /api/health', status: 'FAIL', details: err.message });
  }

  // 3. Check Local Ollama AI Assistant Health
  try {
    const res = await axios.get(`${BACKEND_URL}/api/assistant/health`, { timeout: 5000 });
    console.log('✅ [Ollama AI] /api/assistant/health is online. Active Model:', res.data.activeModel, 'Latency:', res.data.latencyMs, 'ms');
    report.push({ service: 'Ollama AI Assistant', status: 'PASS', details: `Model: ${res.data.activeModel}, Latency: ${res.data.latencyMs}ms` });
  } catch (err) {
    console.error('❌ [Ollama AI] /api/assistant/health failed:', err.message);
    report.push({ service: 'Ollama AI Assistant', status: 'FAIL', details: err.message });
  }

  // 4. Test User Authentication (Register / Login)
  let authToken = null;
  const testEmail = `health_check_${Date.now()}@consistai.local`;
  try {
    const regRes = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      name: 'System Health Checker',
      email: testEmail,
      password: 'Password123!'
    }, { timeout: 5000 });

    authToken = regRes.data.token;
    console.log('✅ [Auth] Registration & JWT issuance succeeded for:', testEmail);
    report.push({ service: 'Authentication (Register)', status: 'PASS', details: 'JWT received' });
  } catch (err) {
    console.error('❌ [Auth] Registration failed:', err.response?.data || err.message);
    report.push({ service: 'Authentication (Register)', status: 'FAIL', details: err.message });
  }

  const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };

  // 5. Check Tasks API
  let createdTaskId = null;
  try {
    const taskRes = await axios.post(`${BACKEND_URL}/api/tasks`, {
      title: 'Verify System Health End-to-End',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      category: 'System'
    }, authHeaders);
    createdTaskId = taskRes.data.task?._id || taskRes.data._id;
    console.log('✅ [Tasks API] Task created successfully:', createdTaskId);

    const getTasksRes = await axios.get(`${BACKEND_URL}/api/tasks`, authHeaders);
    console.log('✅ [Tasks API] Tasks listed successfully. Count:', getTasksRes.data.tasks?.length ?? getTasksRes.data.length);
    report.push({ service: 'Tasks API', status: 'PASS', details: `Created and retrieved task ID ${createdTaskId}` });
  } catch (err) {
    console.error('❌ [Tasks API] Failed:', err.response?.data || err.message);
    report.push({ service: 'Tasks API', status: 'FAIL', details: err.message });
  }

  // 6. Check Goals & Milestones API
  let createdGoalId = null;
  try {
    const goalRes = await axios.post(`${BACKEND_URL}/api/goals`, {
      title: 'Master System Reliability Engineering',
      category: 'DSA & Coding',
      targetDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      priority: 'high',
      moduleCount: 10
    }, authHeaders);
    createdGoalId = goalRes.data.goal?._id || goalRes.data._id;
    console.log('✅ [Goals API] Goal created successfully:', createdGoalId);

    const getGoalRes = await axios.get(`${BACKEND_URL}/api/goals/${createdGoalId}`, authHeaders);
    console.log('✅ [Goals API] Goal details & pacing retrieved. Pacing status:', getGoalRes.data.goal?.pacingStatus || 'on_pace');
    report.push({ service: 'Goals & Pacing API', status: 'PASS', details: `Created goal ID ${createdGoalId}` });
  } catch (err) {
    console.error('❌ [Goals API] Failed:', err.response?.data || err.message);
    report.push({ service: 'Goals & Pacing API', status: 'FAIL', details: err.message });
  }

  // 7. Check Habits & Check-In API
  let createdHabitId = null;
  try {
    const habitRes = await axios.post(`${BACKEND_URL}/api/habits`, {
      title: 'Daily 30-Minute Architecture Review',
      category: 'Technical Reading',
      frequency: 'daily',
      timeOfDay: 'morning'
    }, authHeaders);
    createdHabitId = habitRes.data.habit?._id || habitRes.data._id;
    console.log('✅ [Habits API] Habit created successfully:', createdHabitId);

    const checkInRes = await axios.post(`${BACKEND_URL}/api/habits/${createdHabitId}/checkin`, {
      date: new Date().toISOString().slice(0, 10),
      notes: 'Checked during automated health run'
    }, authHeaders);
    console.log('✅ [Habits API] Habit check-in logged. Current streak:', checkInRes.data.habit?.currentStreak);
    report.push({ service: 'Habits API', status: 'PASS', details: `Created habit & checked in for today` });
  } catch (err) {
    console.error('❌ [Habits API] Failed:', err.response?.data || err.message);
    report.push({ service: 'Habits API', status: 'FAIL', details: err.message });
  }

  // 8. Check Focus Work Sessions API
  try {
    const sessionRes = await axios.post(`${BACKEND_URL}/api/sessions`, {
      startTime: new Date(Date.now() - 30 * 60000).toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: 30,
      sessionType: 'pomodoro',
      goalId: createdGoalId,
      taskId: createdTaskId,
      notes: 'Automated test focus session'
    }, authHeaders);
    console.log('✅ [Focus Sessions API] Work session recorded successfully');
    report.push({ service: 'Focus Sessions API', status: 'PASS', details: 'Logged 30m work session' });
  } catch (err) {
    console.error('❌ [Focus Sessions API] Failed:', err.response?.data || err.message);
    report.push({ service: 'Focus Sessions API', status: 'FAIL', details: err.message });
  }

  // 9. Check Analytics API
  try {
    const analyticsRes = await axios.get(`${BACKEND_URL}/api/analytics/overview`, authHeaders);
    console.log('✅ [Analytics API] /api/analytics/overview retrieved successfully. Consistency Score:', analyticsRes.data.metrics?.consistencyScore ?? 0);
    report.push({ service: 'Analytics API', status: 'PASS', details: 'Overview analytics fetched' });
  } catch (err) {
    console.error('❌ [Analytics API] Failed:', err.response?.data || err.message);
    report.push({ service: 'Analytics API', status: 'FAIL', details: err.message });
  }

  // 10. Check AI Assistant Chat & Action Execution
  try {
    const chatRes = await axios.post(`${BACKEND_URL}/api/assistant/chat`, {
      message: 'Create a high priority task named "Complete System Health Validation" for tomorrow'
    }, authHeaders);
    console.log('✅ [AI Agent Chat] Response received:', chatRes.data.reply?.slice(0, 80) + '...');
    console.log('✅ [AI Agent Tools] Executed tools count:', chatRes.data.toolResults?.length || 0);

    const historyRes = await axios.get(`${BACKEND_URL}/api/assistant/actions/history`, authHeaders);
    console.log('✅ [AI Action History] History fetched. Total executed actions logged:', historyRes.data.count);
    report.push({ service: 'AI Agent & Tool Execution', status: 'PASS', details: 'Chat response & action history operational' });
  } catch (err) {
    console.error('❌ [AI Agent Chat] Failed:', err.response?.data || err.message);
    report.push({ service: 'AI Agent & Tool Execution', status: 'FAIL', details: err.message });
  }

  // 11. Check Frontend Dev/Production Server
  try {
    const frontRes = await axios.get(FRONTEND_URL, { timeout: 4000 });
    console.log('✅ [Frontend Web App] HTTP', frontRes.status, 'HTML content served from', FRONTEND_URL);
    report.push({ service: 'Frontend Client (Vite)', status: 'PASS', details: `HTTP ${frontRes.status} serving index.html` });
  } catch (err) {
    console.error('❌ [Frontend Web App] Unreachable at', FRONTEND_URL, ':', err.message);
    report.push({ service: 'Frontend Client (Vite)', status: 'FAIL', details: err.message });
  }

  console.log('\n====================================================');
  console.log('📊 AUDIT SUMMARY TABLE');
  console.log('====================================================');
  console.table(report);

  const allPassed = report.every(r => r.status === 'PASS');
  if (allPassed) {
    console.log('\n🎉 ALL 11 CORE APPLICATION SUBSYSTEMS ARE WORKING PROPERLY!');
  } else {
    console.log('\n⚠️ SOME SERVICES FAILED THE HEALTH AUDIT.');
  }
}

verifySystem().catch(console.error);
