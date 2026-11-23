import test from 'node:test';
import assert from 'node:assert';
process.env.NODE_ENV = 'test';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import Todo from '../models/Todo.js';
import Achievement from '../models/Achievement.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import { generateGoalPlan, chatWithProgressCoach, parseQuickCaptureTask } from '../services/aiService.js';
import { checkAndAwardAchievements } from '../services/achievementService.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

const TEST_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/consistai_ml_test';

test.before(async () => {
  await mongoose.connect(TEST_MONGODB_URI);
  await Promise.all([
    User.deleteMany({ email: /test.*@consistai.edu/ }),
    Goal.deleteMany({}),
    Milestone.deleteMany({}),
    Task.deleteMany({}),
    Habit.deleteMany({}),
    DailyAnalytics.deleteMany({})
  ]);
});

test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('1. User model hashing and password comparison', async () => {
  const user = await User.create({
    name: 'Test Student',
    email: 'test_user_1@consistai.edu',
    password: 'SecurePassword123!',
    role: 'student'
  });

  assert.ok(user._id);
  assert.notStrictEqual(user.password, 'SecurePassword123!');
  const isMatch = await user.comparePassword('SecurePassword123!');
  assert.strictEqual(isMatch, true);
  const isFail = await user.comparePassword('WrongPassword');
  assert.strictEqual(isFail, false);
});

test('2. Goal and Milestone progress calculation', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });

  const goal = await Goal.create({
    user: user._id,
    title: 'Complete 200 DSA Problems',
    startDate: new Date('2026-10-01'),
    targetDate: new Date('2026-12-30'),
    priority: 'urgent',
    progressType: 'milestone_based',
    targetQuantity: 200
  });

  const m1 = await Milestone.create({
    goal: goal._id,
    user: user._id,
    title: 'Arrays (40)',
    weight: 20.0,
    targetQuantity: 40,
    achievedQuantity: 40,
    progressPercentage: 100,
    isCompleted: true
  });

  const m2 = await Milestone.create({
    goal: goal._id,
    user: user._id,
    title: 'Strings (30)',
    weight: 20.0,
    targetQuantity: 30,
    achievedQuantity: 15,
    progressPercentage: 50,
    isCompleted: false
  });

  const totalWeight = m1.weight + m2.weight;
  const weightedProgress = (m1.weight * (m1.progressPercentage / 100)) + (m2.weight * (m2.progressPercentage / 100));
  const goalProgress = (weightedProgress / totalWeight) * 100;

  assert.strictEqual(totalWeight, 40.0);
  assert.strictEqual(weightedProgress, 30.0); // 20 + 10 = 30
  assert.strictEqual(goalProgress, 75.0); // 30 / 40 * 100 = 75%
});

test('3. Daily Analytics Aggregator and Consistency Score', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });
  const todayStr = '2026-11-15';

  const habit = await Habit.create({
    user: user._id,
    title: 'Practice DSA',
    frequency: 'daily',
    targetDaysPerWeek: 7
  });

  await Task.create({
    user: user._id,
    title: 'Two Sum Problem',
    dueDate: new Date(`${todayStr}T10:00:00Z`),
    status: 'completed',
    isGoalRelevant: true
  });

  const analytics = await syncDailyAnalytics(user._id, todayStr);
  assert.ok(analytics);
  assert.strictEqual(analytics.completedTasks, 1);
  assert.strictEqual(analytics.plannedTasks, 1);
  assert.strictEqual(analytics.taskCompletionRate, 1.0);
  assert.strictEqual(typeof analytics.consistencyScore, 'number');
});

test('4. Todo List item creation, completion toggle, and conversion to Task', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });

  const todo = await Todo.create({
    user: user._id,
    title: 'Review Graph BFS traversal',
    priority: 'high',
    category: 'Coding'
  });

  assert.ok(todo._id);
  assert.strictEqual(todo.completed, false);

  // Toggle complete
  todo.completed = true;
  todo.completedAt = new Date();
  await todo.save();
  assert.strictEqual(todo.completed, true);
  assert.ok(todo.completedAt);

  // Convert to task
  const task = await Task.create({
    user: user._id,
    title: todo.title,
    dueDate: new Date(),
    priority: todo.priority
  });
  todo.convertedToTask = true;
  todo.linkedTask = task._id;
  await todo.save();

  assert.strictEqual(todo.convertedToTask, true);
  assert.strictEqual(todo.linkedTask.toString(), task._id.toString());
});

test('5. Task cadence filters (daily, weekly, monthly)', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });

  const dailyTask = await Task.create({
    user: user._id,
    title: 'Daily Algorithm Workout',
    taskType: 'daily',
    dueDate: new Date()
  });

  const weeklyTask = await Task.create({
    user: user._id,
    title: 'Weekly System Design Sprint Review',
    taskType: 'weekly',
    dueDate: new Date()
  });

  const monthlyTask = await Task.create({
    user: user._id,
    title: 'Monthly Mock Interview Simulation',
    taskType: 'monthly',
    dueDate: new Date()
  });

  assert.strictEqual(dailyTask.taskType, 'daily');
  assert.strictEqual(weeklyTask.taskType, 'weekly');
  assert.strictEqual(monthlyTask.taskType, 'monthly');

  const dailyFound = await Task.find({ user: user._id, taskType: 'daily' });
  const weeklyFound = await Task.find({ user: user._id, taskType: 'weekly' });
  const monthlyFound = await Task.find({ user: user._id, taskType: 'monthly' });

  assert.ok(dailyFound.some(t => t.title === 'Daily Algorithm Workout'));
  assert.ok(weeklyFound.some(t => t.title === 'Weekly System Design Sprint Review'));
  assert.ok(monthlyFound.some(t => t.title === 'Monthly Mock Interview Simulation'));
});

test('6. AI Service planning, chat coach, and quick capture', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });

  // 1. Natural Language Goal Planner
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 90);
  const plan = await generateGoalPlan({
    goalDescription: 'Complete 200 DSA Problems in 90 Days',
    targetDate: targetDate.toISOString(),
    experienceLevel: 'intermediate',
    dailyHours: 2
  });

  assert.ok(plan);
  assert.strictEqual(plan.category, 'DSA & Coding');
  assert.ok(plan.milestones.length >= 3);
  assert.ok(plan.feasibilityAssessment.isRealistic);

  // 2. Chat with Progress Coach
  const coachReply = await chatWithProgressCoach({
    userId: user._id,
    message: 'How much progress have I made toward my goal?'
  });

  assert.ok(coachReply);
  assert.ok(coachReply.situationSummary);
  assert.ok(coachReply.supportingEvidence);
  assert.ok(coachReply.practicalRecommendation);

  // 3. Quick Capture Parser
  const parsedTask = await parseQuickCaptureTask({
    text: 'Practice Java trees for 45 minutes urgent',
    userGoals: []
  });

  assert.strictEqual(parsedTask.priority, 'urgent');
  assert.strictEqual(parsedTask.estimatedMinutes, 45);
  assert.ok(parsedTask.title.includes('Practice Java'));
});

test('7. Goal creation with cover image, cadence tasks, and yearly targets', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });

  const goal = await Goal.create({
    user: user._id,
    title: 'Full Stack MERN Mastery',
    category: 'Web Development',
    startDate: new Date(),
    targetDate: new Date(Date.now() + 120 * 86400000),
    priority: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    yearlyTargets: [
      { target: 'Launch 2 Production SaaS Products', isAchieved: false },
      { target: 'Contribute to 5 Open Source Repositories', isAchieved: true }
    ]
  });

  assert.ok(goal._id);
  assert.strictEqual(goal.imageUrl, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085');
  assert.strictEqual(goal.yearlyTargets.length, 2);
  assert.strictEqual(goal.yearlyTargets[0].isAchieved, false);
  assert.strictEqual(goal.yearlyTargets[1].isAchieved, true);

  // Create linked tasks for daily, weekly, monthly
  const dailyTask = await Task.create({
    user: user._id,
    goal: goal._id,
    title: 'Daily React component practice',
    taskType: 'daily',
    dueDate: new Date(),
    priority: 'high'
  });

  const weeklyTask = await Task.create({
    user: user._id,
    goal: goal._id,
    title: 'Weekly Node.js API integration',
    taskType: 'weekly',
    dueDate: new Date(Date.now() + 7 * 86400000),
    priority: 'medium'
  });

  const monthlyTask = await Task.create({
    user: user._id,
    goal: goal._id,
    title: 'Monthly Full Stack project sprint',
    taskType: 'monthly',
    dueDate: new Date(Date.now() + 30 * 86400000),
    priority: 'high'
  });

  assert.strictEqual(dailyTask.taskType, 'daily');
  assert.strictEqual(weeklyTask.taskType, 'weekly');
  assert.strictEqual(monthlyTask.taskType, 'monthly');
});

test('8. Achievement Engine: first task, milestone, and progress threshold celebrations', async () => {
  const user = await User.findOne({ email: 'test_user_1@consistai.edu' });

  const goal = await Goal.create({
    user: user._id,
    title: 'Master Machine Learning Algorithms',
    category: 'Research / Minor Project',
    startDate: new Date(),
    targetDate: new Date(Date.now() + 90 * 86400000),
    priority: 'high',
    currentProgressPercentage: 55.0
  });

  const milestone = await Milestone.create({
    user: user._id,
    goal: goal._id,
    title: 'K-Means & Clustering Mastery',
    weight: 25,
    isCompleted: true,
    progressPercentage: 100
  });

  const task = await Task.create({
    user: user._id,
    goal: goal._id,
    title: 'Implement K-Means from scratch with NumPy',
    status: 'completed',
    dueDate: new Date()
  });

  // Award achievements
  const earned1 = await checkAndAwardAchievements({
    userId: user._id,
    goalId: goal._id,
    milestoneId: milestone._id
  });

  assert.ok(earned1.length >= 3);
  const typesEarned = earned1.map(a => a.achievementType);
  assert.ok(typesEarned.includes('first_task_completed'));
  assert.ok(typesEarned.includes('first_milestone_completed'));
  assert.ok(typesEarned.includes('progress_25'));
  assert.ok(typesEarned.includes('progress_50'));

  // Run again: must not duplicate any achievement!
  const earned2 = await checkAndAwardAchievements({
    userId: user._id,
    goalId: goal._id,
    milestoneId: milestone._id
  });

  assert.strictEqual(earned2.length, 0); // 0 duplicates!
});
