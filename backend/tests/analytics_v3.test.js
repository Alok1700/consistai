import { test, describe } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import DailyAnalytics from '../models/DailyAnalytics.js';
import MonthlyReflection from '../models/MonthlyReflection.js';
import InsightFeedback from '../models/InsightFeedback.js';
import WorkflowExperiment from '../models/WorkflowExperiment.js';

describe('Analytics 3.0 Models & Consistency Calculations', () => {
  test('DailyAnalytics score component breakdown and rest day baseline', () => {
    const doc = new DailyAnalytics({
      user: new mongoose.Types.ObjectId(),
      date: '2026-11-18',
      isHolidayOrRestDay: true,
      consistencyScore: 85,
      scoreComponentBreakdown: {
        habitScore: 85,
        taskScore: 85,
        focusScore: 85,
        goalWorkScore: 85
      }
    });

    assert.strictEqual(doc.isHolidayOrRestDay, true);
    assert.strictEqual(doc.consistencyScore, 85);
    assert.strictEqual(doc.scoreComponentBreakdown.habitScore, 85);
    assert.strictEqual(doc.scoreConfigVersion, '3.0');
  });

  test('MonthlyReflection schema validation', () => {
    const ref = new MonthlyReflection({
      user: new mongoose.Types.ObjectId(),
      year: 2026,
      month: 11,
      achievements: 'Completed all sliding window problems',
      difficulties: 'Late night fatigue',
      improvements: 'Dedicated morning sessions',
      nextMonthPriorities: 'Trees and Graphs'
    });

    assert.strictEqual(ref.year, 2026);
    assert.strictEqual(ref.month, 11);
    assert.strictEqual(ref.achievements, 'Completed all sliding window problems');
  });

  test('InsightFeedback schema validation', () => {
    const fb = new InsightFeedback({
      user: new mongoose.Types.ObjectId(),
      insightId: 'rec_distraction_block',
      feedbackType: 'helpful'
    });

    assert.strictEqual(fb.insightId, 'rec_distraction_block');
    assert.strictEqual(fb.feedbackType, 'helpful');
  });

  test('WorkflowExperiment schema validation with baseline metrics', () => {
    const exp = new WorkflowExperiment({
      user: new mongoose.Types.ObjectId(),
      title: 'Phone-Free Morning Blocks',
      hypothesis: 'Reduces distraction by 30%',
      targetBehavior: 'Keep phone in other room for 45 mins',
      durationDays: 14,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 86400000),
      baselineMetrics: {
        avgFocusMinutes: 45,
        avgDistractingMinutes: 75,
        avgGoalProgressDaily: 0.5
      }
    });

    assert.strictEqual(exp.title, 'Phone-Free Morning Blocks');
    assert.strictEqual(exp.durationDays, 14);
    assert.strictEqual(exp.baselineMetrics.avgFocusMinutes, 45);
    assert.strictEqual(exp.status, 'active');
  });
});
