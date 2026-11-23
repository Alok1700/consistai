import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import GoalFolder from '../models/GoalFolder.js';
import Task from '../models/Task.js';
import { generateAIMilestones, generateGoalAssistance, generateMilestoneModules } from '../services/aiService.js';

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

test('Goal Workspace: Dynamic Slot Generation & Proportional Recalculation', async (t) => {
  const user = await User.create({
    name: 'Workspace Tester',
    email: `workspacetest_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  // 1. Create a goal with 30 modules
  const goal30 = await Goal.create({
    user: user._id,
    title: 'Complete Java DSA Course',
    category: 'DSA & Coding',
    targetDate: new Date(Date.now() + 60 * 86400000),
    progressType: 'milestone_based',
    moduleCount: 30,
    milestoneCount: 30
  });

  const slots = [];
  for (let i = 1; i <= 30; i++) {
    slots.push({
      goal: goal30._id,
      user: user._id,
      title: `Module ${String(i).padStart(2, '0')}`,
      order: i,
      sequenceNumber: i,
      weight: 1.0,
      targetQuantity: 1,
      achievedQuantity: 0,
      progressPercentage: 0,
      isCompleted: false,
      status: 'not_started'
    });
  }
  await Milestone.insertMany(slots);

  const countSlots = await Milestone.countDocuments({ goal: goal30._id });
  assert.equal(countSlots, 30, 'Should have exactly 30 generated milestone slots');

  // 2. Complete 12 modules -> progress should be exactly 40.0%
  const first12 = await Milestone.find({ goal: goal30._id }).sort({ order: 1 }).limit(12);
  for (const m of first12) {
    m.isCompleted = true;
    m.status = 'completed';
    m.progressPercentage = 100;
    m.achievedQuantity = 1;
    await m.save();
  }

  const all30 = await Milestone.find({ goal: goal30._id });
  const totalWeight = all30.reduce((sum, m) => sum + (m.weight || 1), 0);
  const weightedCompleted = all30.reduce((sum, m) => {
    const w = m.weight || 1;
    const pct = m.progressPercentage || (m.isCompleted ? 100 : 0);
    return sum + (w * (pct / 100));
  }, 0);
  const calculatedProgress = Number(((weightedCompleted / totalWeight) * 100).toFixed(1));
  assert.equal(calculatedProgress, 40.0, '12 of 30 modules completed must equal exactly 40.0%');

  // 3. Mark 1 module as in_progress (50%) -> (12 + 0.5) / 30 = 41.67 -> 41.7%
  const thirteenth = await Milestone.findOne({ goal: goal30._id, order: 13 });
  thirteenth.status = 'in_progress';
  thirteenth.progressPercentage = 50;
  await thirteenth.save();

  const all30After13 = await Milestone.find({ goal: goal30._id });
  const weightedWithPartial = all30After13.reduce((sum, m) => sum + ((m.weight || 1) * ((m.progressPercentage || 0) / 100)), 0);
  const progressWithPartial = Number(((weightedWithPartial / totalWeight) * 100).toFixed(1));
  assert.equal(progressWithPartial, 41.7, '12.5 of 30 modules completed must equal 41.7%');

  // Cleanup
  await Goal.deleteOne({ _id: goal30._id });
  await Milestone.deleteMany({ goal: goal30._id });
  await User.deleteOne({ _id: user._id });
});

test('Goal Workspace: Nested Folders and Subfolders', async (t) => {
  const user = await User.create({
    name: 'Folder Tester',
    email: `foldertest_${Date.now()}@example.com`,
    password: 'Password123!'
  });

  // 1. Create root folder "Computer Science"
  const rootFolder = await GoalFolder.create({
    user: user._id,
    name: 'Computer Science',
    color: '#6366f1',
    icon: 'Folder'
  });

  // 2. Create subfolder "Data Structures" under "Computer Science"
  const subFolder = await GoalFolder.create({
    user: user._id,
    name: 'Data Structures',
    parentFolderId: rootFolder._id,
    color: '#7c3aed',
    icon: 'Code'
  });

  assert.equal(subFolder.parentFolderId.toString(), rootFolder._id.toString());

  // 3. Create goal in subFolder
  const goalInSub = await Goal.create({
    user: user._id,
    title: 'LeetCode 75',
    category: 'DSA & Coding',
    targetDate: new Date(Date.now() + 30 * 86400000),
    folderId: subFolder._id,
    folder: subFolder.name
  });

  assert.equal(goalInSub.folderId.toString(), subFolder._id.toString());
  assert.equal(goalInSub.folder, 'Data Structures');

  // Move goal to rootFolder
  goalInSub.folderId = rootFolder._id;
  goalInSub.folder = rootFolder.name;
  await goalInSub.save();

  const refreshedGoal = await Goal.findById(goalInSub._id);
  assert.equal(refreshedGoal.folderId.toString(), rootFolder._id.toString());
  assert.equal(refreshedGoal.folder, 'Computer Science');

  // Cleanup
  await Goal.deleteOne({ _id: goalInSub._id });
  await GoalFolder.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });
});

test('Goal Workspace: AI Milestone Generator generates exact count', async (t) => {
  const generated15 = await generateAIMilestones({
    goalTitle: 'Master Dynamic Programming',
    count: 15,
    category: 'DSA & Coding'
  });

  assert.equal(generated15.length, 15, 'Must generate exactly 15 sequential modules');
  assert.equal(generated15[0].order, 1);
  assert.equal(generated15[14].order, 15);
  assert.ok(generated15[0].title.includes('Module 01'));
  assert.ok(generated15[14].title.includes('Module 15'));
});

test('Goal Workspace: AI Milestone Modules Generator generates sequential module titles', async (t) => {
  const modules = await generateMilestoneModules({
    milestoneTitle: 'Binary Search & Monotonic Predicates',
    count: 8,
    category: 'DSA & Coding'
  });

  assert.equal(modules.length, 8, 'Must generate exactly 8 sequential module titles');
  assert.ok(modules[0].startsWith('Module 01:'));
  assert.ok(modules[7].startsWith('Module 08:'));
});
