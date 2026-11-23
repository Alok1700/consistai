import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import AssistantMemory from '../models/AssistantMemory.js';
import Reminder from '../models/Reminder.js';
import AssistantSettings from '../models/AssistantSettings.js';
import { executeAssistantTool } from '../services/assistantTools.js';

test('ConsistAI Voice Assistant Engine & Models', async (t) => {
  await t.test('AssistantMemory schema validates correct category & fields', () => {
    const memory = new AssistantMemory({
      user: new mongoose.Types.ObjectId(),
      category: 'preference',
      content: 'User prefers studying deep algorithmic concepts in morning sessions',
      importance: 'high',
      confidenceScore: 0.95
    });
    const err = memory.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(memory.category, 'preference');
    assert.strictEqual(memory.confirmationStatus, 'confirmed');
  });

  await t.test('Reminder schema validates scheduledAt and recurrence', () => {
    const reminder = new Reminder({
      user: new mongoose.Types.ObjectId(),
      title: 'Review System Design Module 3',
      message: 'Review System Design Module 3 before evening standup',
      reminderType: 'before_task',
      scheduledAt: new Date(Date.now() + 3600000),
      recurrence: 'daily'
    });
    const err = reminder.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(reminder.status, 'scheduled');
    assert.strictEqual(reminder.deliveryChannels.includes('in_app'), true);
  });

  await t.test('AssistantSettings default preferences', () => {
    const settings = new AssistantSettings({
      user: new mongoose.Types.ObjectId()
    });
    const err = settings.validateSync();
    assert.strictEqual(err, undefined);
    assert.strictEqual(settings.preferredLanguage, 'auto');
    assert.strictEqual(settings.preferredVoice, 'default');
    assert.strictEqual(settings.morningBriefingTime, '08:00');
    assert.strictEqual(settings.eveningReviewTime, '20:30');
  });

  await t.test('executeAssistantTool safely handles unknown tool', async () => {
    const res = await executeAssistantTool({
      userId: new mongoose.Types.ObjectId(),
      toolName: 'non_existent_tool',
      toolArgs: {}
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.error.includes('not supported'), true);
  });
});
