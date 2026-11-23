import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { processUserMessage } from '../services/assistantAgent.js';

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

test('Assistant Question Answering & Intent Processing', async (t) => {
  const mockUserId = new mongoose.Types.ObjectId();

  await t.test('Answers questions on habits and productivity properly', async () => {
    const res = await processUserMessage({
      userId: mockUserId,
      message: 'What are my habits and streaks?'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(typeof res.reply, 'string');
    assert.strictEqual(res.reply.length > 10, true);
    assert.strictEqual(res.reply, res.message);
    assert.strictEqual(res.toolResults.length > 0, true);
    assert.strictEqual(res.toolResults[0].toolName, 'get_today_habits');
  });

  await t.test('Answers technical / educational questions properly', async () => {
    const res = await processUserMessage({
      userId: mockUserId,
      message: 'How should I study DSA and LeetCode?'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(typeof res.reply, 'string');
    assert.strictEqual(
      res.reply.includes('DSA') || res.reply.includes('Sliding Window') || res.reply.includes('LeetCode'),
      true
    );
  });

  await t.test('Answers Hinglish questions accurately', async () => {
    const res = await processUserMessage({
      userId: mockUserId,
      message: 'aaj mujhe kitne tasks complete karne hain batao'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.language, 'hinglish');
    assert.strictEqual(typeof res.reply, 'string');
    assert.strictEqual(res.reply.includes('task') || res.reply.includes('Aaj'), true);
  });

  await t.test('Creates habit via natural language in English and Hinglish', async () => {
    const resEn = await processUserMessage({
      userId: mockUserId,
      message: 'Add habit: Morning 30 mins LeetCode practice'
    });

    assert.strictEqual(resEn.success, true);
    assert.strictEqual(resEn.toolResults.length > 0, true);
    assert.strictEqual(resEn.toolResults[0].toolName, 'create_habit');
    assert.strictEqual(resEn.toolResults[0].status, 'success');
    assert.strictEqual(resEn.toolResults[0].result.category, 'DSA & Coding');

    const resHi = await processUserMessage({
      userId: mockUserId,
      message: 'Habit banao daily 2L water drink'
    });

    assert.strictEqual(resHi.success, true);
    assert.strictEqual(resHi.toolResults.length > 0, true);
    assert.strictEqual(resHi.toolResults[0].toolName, 'create_habit');
    assert.strictEqual(resHi.toolResults[0].status, 'success');
    assert.strictEqual(resHi.toolResults[0].result.category, 'Physical Exercise');
  });

  await t.test('Creates goal via natural language in English and Hinglish', async () => {
    const resEn = await processUserMessage({
      userId: mockUserId,
      message: 'Create goal: Master Web Development'
    });

    assert.strictEqual(resEn.success, true);
    assert.strictEqual(resEn.toolResults.length > 0, true);
    assert.strictEqual(resEn.toolResults[0].toolName, 'create_goal');
    assert.strictEqual(resEn.toolResults[0].status, 'success');
    assert.strictEqual(resEn.toolResults[0].result.category, 'Web Development');

    const resHi = await processUserMessage({
      userId: mockUserId,
      message: 'Goal banao System Design distributed systems in 6 months'
    });

    assert.strictEqual(resHi.success, true);
    assert.strictEqual(resHi.toolResults.length > 0, true);
    assert.strictEqual(resHi.toolResults[0].toolName, 'create_goal');
    assert.strictEqual(resHi.toolResults[0].status, 'success');
    assert.strictEqual(resHi.toolResults[0].result.category, 'System Design');
  });
});
