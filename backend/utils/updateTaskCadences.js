import mongoose from 'mongoose';
import Task from '../models/Task.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/consistai_ml');
  const res = await Task.updateMany({ taskType: { $exists: false } }, { $set: { taskType: 'daily' } });
  console.log('Updated tasks with taskType daily:', res.modifiedCount);

  // Assign some tasks to weekly and monthly for variety
  const allTasks = await Task.find({});
  let w = 0, m = 0;
  for (let i = 0; i < allTasks.length; i++) {
    if (i % 6 === 0) {
      allTasks[i].taskType = 'weekly';
      await allTasks[i].save();
      w++;
    } else if (i % 11 === 0) {
      allTasks[i].taskType = 'monthly';
      await allTasks[i].save();
      m++;
    }
  }
  console.log(`Updated ${w} tasks to weekly and ${m} tasks to monthly.`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
