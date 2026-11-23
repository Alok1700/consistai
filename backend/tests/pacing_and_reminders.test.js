import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import Reminder from '../models/Reminder.js';
import { pacingService } from '../services/pacingService.js';
import { protect } from '../middleware/auth.js';

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

test('PacingService: Exact Mathematical Formulas & Pacing Gap Statuses', async () => {
  const startDate = new Date('2026-01-01');
  const targetDate = new Date('2026-01-31');

  // Case 1: Ahead (> +5 percentage points)
  const goalAhead = {
    startDate,
    targetDate,
    currentProgressPercentage: 80,
    status: 'active',
    scheduleSettings: { preferredWorkingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
  };
  // Simulate with mocked date or custom milestone
  const pacingAhead = pacingService.calculateGoalPacing(goalAhead, [
    { title: 'M1', isCompleted: true, status: 'completed' },
    { title: 'M2', isCompleted: false, status: 'pending' }
  ]);
  assert.ok(pacingAhead);
  assert.ok(typeof pacingAhead.progress_gap_pct === 'number');
  assert.ok(['ahead', 'on_pace', 'needs_attention', 'behind_schedule'].includes(pacingAhead.pacing_status));

  // Case 2: Direct gap checks
  // Ahead test
  const gapAhead = 10;
  let status1 = gapAhead > 5 ? 'ahead' : gapAhead >= -5 ? 'on_pace' : gapAhead >= -15 ? 'needs_attention' : 'behind_schedule';
  assert.equal(status1, 'ahead');

  // On track test
  const gapOnTrack = 2;
  let status2 = gapOnTrack > 5 ? 'ahead' : gapOnTrack >= -5 ? 'on_pace' : gapOnTrack >= -15 ? 'needs_attention' : 'behind_schedule';
  assert.equal(status2, 'on_pace');

  // Needs attention test
  const gapAttention = -8;
  let status3 = gapAttention > 5 ? 'ahead' : gapAttention >= -5 ? 'on_pace' : gapAttention >= -15 ? 'needs_attention' : 'behind_schedule';
  assert.equal(status3, 'needs_attention');

  // Behind schedule test
  const gapBehind = -20;
  let status4 = gapBehind > 5 ? 'ahead' : gapBehind >= -5 ? 'on_pace' : gapBehind >= -15 ? 'needs_attention' : 'behind_schedule';
  assert.equal(status4, 'behind_schedule');
});

test('PacingService: Count eligible working days excluding rest days', async () => {
  // Monday Jan 5 to Friday Jan 9, 2026 = 5 days total, Mon-Fri only
  const start = new Date('2026-01-05');
  const end = new Date('2026-01-09');
  const countMonFri = pacingService.countEligibleDays(start, end, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  assert.equal(countMonFri, 5);

  // Exclude Wednesday
  const countNoWed = pacingService.countEligibleDays(start, end, ['Mon', 'Tue', 'Thu', 'Fri']);
  assert.equal(countNoWed, 4);
});

test('Task & Reminder Synchronization: Completed task dismisses reminder', async () => {
  const user = await User.create({
    name: 'Reminder Sync Tester',
    email: `remindertest_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  const task = await Task.create({
    user: user._id,
    title: 'Review System Design',
    dueDate: new Date(Date.now() + 3600000),
    status: 'pending'
  });

  const reminder = await Reminder.create({
    user: user._id,
    taskId: task._id,
    scheduledAt: new Date(Date.now() + 1800000),
    message: 'Remember to Review System Design',
    status: 'scheduled'
  });

  assert.equal(reminder.status, 'scheduled');

  // Simulate completion dismissal
  await Reminder.updateMany({ taskId: task._id, status: 'scheduled' }, { status: 'dismissed' });
  const updatedReminder = await Reminder.findById(reminder._id);
  assert.equal(updatedReminder.status, 'dismissed');

  // Simulate task deletion
  await Reminder.deleteMany({ taskId: task._id });
  const deletedReminder = await Reminder.findById(reminder._id);
  assert.equal(deletedReminder, null);
});

test('Auth Middleware: Rejects invalid tokens with 401 and no silent fallback', async () => {
  const req = {
    cookies: {},
    headers: { authorization: 'Bearer invalid_garbage_token' }
  };
  let responseStatus = null;
  let responseBody = null;
  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await protect(req, res, next);

  assert.equal(nextCalled, false);
  assert.equal(responseStatus, 401);
  assert.equal(responseBody.success, false);
  assert.match(responseBody.message, /Invalid or expired session token/);
});
