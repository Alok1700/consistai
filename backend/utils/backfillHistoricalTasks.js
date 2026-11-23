import mongoose from 'mongoose';
import Task from '../models/Task.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import Goal from '../models/Goal.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/consistai_ml';

const taskCatalog = [
  { title: 'Implement Breadth-First Search on Binary Tree', cat: 'dsa', est: 45, prio: 'high' },
  { title: 'Solve LeetCode #102: Binary Tree Level Order Traversal', cat: 'dsa', est: 40, prio: 'high' },
  { title: 'Review Graph Cycle Detection (Tarjan & Kosaraju Algorithm)', cat: 'dsa', est: 55, prio: 'urgent' },
  { title: 'Read System Design Chapter: Distributed Caching with Redis', cat: 'web', est: 45, prio: 'medium' },
  { title: 'Draft Engineering Notes on B-Trees & LSM Trees for DB Storage', cat: 'general', est: 35, prio: 'medium' },
  { title: 'Solve Two Sum & 3-Sum Optimal Pointer Approaches', cat: 'dsa', est: 30, prio: 'high' },
  { title: 'Implement Dynamic Programming 0/1 Knapsack & Memoization', cat: 'dsa', est: 60, prio: 'urgent' },
  { title: 'Build JWT Authentication Middleware & Cookie Handler', cat: 'web', est: 50, prio: 'high' },
  { title: 'Review REST API Idempotency & Rate Limiting Headers', cat: 'web', est: 30, prio: 'medium' },
  { title: 'Debug Memory Leaks in Node.js Event Loop', cat: 'general', est: 40, prio: 'medium' }
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const analyticsRecords = await DailyAnalytics.find({}).sort({ date: 1 });
  console.log(`Found ${analyticsRecords.length} daily analytics records`);

  const goals = await Goal.find({});
  const dsaGoal = goals.find(g => g.title.includes('DSA')) || goals[0];
  const webGoal = goals.find(g => !g.title.includes('DSA')) || goals[1] || goals[0];

  let totalTasksInserted = 0;

  for (const record of analyticsRecords) {
    const { date, user, plannedTasks, completedTasks } = record;
    if (plannedTasks === 0) continue;

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const existingCount = await Task.countDocuments({
      user,
      dueDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingCount > 0) continue;

    const countToGenerate = plannedTasks;
    const completedCount = completedTasks;

    const tasksToInsert = [];
    for (let i = 0; i < countToGenerate; i++) {
      const template = taskCatalog[(i + date.charCodeAt(date.length - 1)) % taskCatalog.length];
      const isCompleted = i < completedCount;

      let goalToLink = null;
      if (template.cat === 'dsa') goalToLink = dsaGoal?._id || null;
      else if (template.cat === 'web') goalToLink = webGoal?._id || null;

      const dueDateTime = new Date(`${date}T10:00:00.000Z`);
      dueDateTime.setMinutes(i * 15);

      tasksToInsert.push({
        user,
        goal: goalToLink,
        title: template.title,
        priority: template.prio,
        dueDate: dueDateTime,
        estimatedMinutes: template.est,
        actualMinutes: isCompleted ? template.est : null,
        status: isCompleted ? 'completed' : 'pending',
        isGoalRelevant: Boolean(goalToLink),
        onTime: isCompleted
      });
    }

    if (tasksToInsert.length > 0) {
      await Task.insertMany(tasksToInsert);
      totalTasksInserted += tasksToInsert.length;
    }
  }

  console.log(`Successfully backfilled ${totalTasksInserted} individual task documents.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});