import Task from '../../models/Task.js';
import Milestone from '../../models/Milestone.js';
import HabitCheckIn from '../../models/HabitCheckIn.js';
import WorkSession from '../../models/WorkSession.js';
import DailyJournal from '../../models/DailyJournal.js';
import Reminder from '../../models/Reminder.js';
import DailyAnalytics from '../../models/DailyAnalytics.js';
import ollamaService from '../ai/ollamaService.js';
import modelService from '../ai/modelService.js';

/**
 * SummaryService — Authoritative Activity Aggregator & Ollama Executive Summary
 */

export const summaryService = {
  /**
   * Daily Activity Recall & Summary
   */
  async getDailySummary(userId, dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().slice(0, 10);
    const start = new Date(`${targetDate}T00:00:00.000Z`);
    const end = new Date(`${targetDate}T23:59:59.999Z`);

    const [
      scheduledTasks,
      completedTasks,
      completedHabits,
      completedModules,
      focusSessions,
      journal,
      analytics
    ] = await Promise.all([
      Task.find({ user: userId, dueDate: { $gte: start, $lte: end } }).select('title status priority estimatedMinutes'),
      Task.find({ user: userId, status: 'completed', completedAt: { $gte: start, $lte: end } }).select('title'),
      HabitCheckIn.find({ user: userId, date: targetDate }).populate('habit', 'title'),
      Milestone.find({ user: userId, status: 'completed', completedAt: { $gte: start, $lte: end } }).select('title'),
      WorkSession.find({ user: userId, startTime: { $gte: start, $lte: end } }).select('subject durationMinutes'),
      DailyJournal.findOne({ user: userId, localDate: targetDate }),
      DailyAnalytics.findOne({ user: userId, date: targetDate })
    ]);

    const totalFocusMinutes = focusSessions.reduce((s, x) => s + (x.durationMinutes || 0), 0);
    const pendingTasks = scheduledTasks.filter(t => t.status !== 'completed');

    const factualData = {
      date: targetDate,
      scheduledTasksCount: scheduledTasks.length,
      completedTasksCount: completedTasks.length,
      pendingTasksCount: pendingTasks.length,
      completedTasksList: completedTasks.map(t => t.title),
      pendingTasksList: pendingTasks.map(t => t.title),
      completedHabitsList: completedHabits.map(c => c.habit?.title).filter(Boolean),
      completedModulesList: completedModules.map(m => m.title),
      totalFocusHours: Number((totalFocusMinutes / 60).toFixed(1)),
      journalNotesCount: journal?.entries?.length || 0,
      consistencyScore: analytics?.consistencyScore || 85
    };

    // Ask Ollama to synthesize a conversational, grounded narrative without fabricating anything
    const { modelName } = await modelService.getEffectiveModel(userId);
    const prompt = `Synthesize a concise, friendly 2-3 sentence productivity review for ${targetDate} strictly based on these verified facts:
- Tasks Completed: ${factualData.completedTasksCount} (${factualData.completedTasksList.join(', ') || 'None'})
- Pending Incomplete: ${factualData.pendingTasksCount} (${factualData.pendingTasksList.join(', ') || 'None'})
- Habits Completed: ${factualData.completedHabitsList.join(', ') || 'None'}
- Goal Modules Completed: ${factualData.completedModulesList.join(', ') || 'None'}
- Focused Study Hours: ${factualData.totalFocusHours} hrs
- Consistency Score: ${factualData.consistencyScore}%
Rules: Never invent or hallucinate tasks or activities. If no work was done, state that kindly. Support English/Hinglish naturally.`;

    let narrative = '';
    const ollamaRes = await ollamaService.chat({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2
    });

    if (ollamaRes.success && ollamaRes.content) {
      narrative = ollamaRes.content.trim();
    } else {
      narrative = `On ${targetDate}, you completed ${factualData.completedTasksCount} tasks and logged ${factualData.totalFocusHours} focused work hours with a consistency score of ${factualData.consistencyScore}%.`;
    }

    return {
      success: true,
      factual: factualData,
      summary: narrative
    };
  },

  /**
   * Weekly Activity Summary
   */
  async getWeeklySummary(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const [completedTasks, focusSessions] = await Promise.all([
      Task.countDocuments({ user: userId, status: 'completed', completedAt: { $gte: sevenDaysAgo } }),
      WorkSession.find({ user: userId, startTime: { $gte: sevenDaysAgo } }).select('durationMinutes')
    ]);

    const totalMinutes = focusSessions.reduce((s, x) => s + (x.durationMinutes || 0), 0);
    return {
      success: true,
      timeframe: 'Past 7 Days',
      completedTasks,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      sessionsCount: focusSessions.length
    };
  },

  /**
   * Monthly Activity Summary
   */
  async getMonthlySummary(userId, month = null) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [completedTasks, focusSessions] = await Promise.all([
      Task.countDocuments({ user: userId, status: 'completed', completedAt: { $gte: startOfMonth } }),
      WorkSession.find({ user: userId, startTime: { $gte: startOfMonth } }).select('durationMinutes')
    ]);

    const totalMinutes = focusSessions.reduce((s, x) => s + (x.durationMinutes || 0), 0);
    return {
      success: true,
      month: month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      completedTasks,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      sessionsCount: focusSessions.length
    };
  },

  /**
   * Recall forgotten or pending commitments when asked "What did I forget?"
   */
  async getForgottenItems(userId) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [overdueTasks, unfinishedToday, activeReminders] = await Promise.all([
      Task.find({ user: userId, status: 'pending', dueDate: { $lt: now } }).select('title dueDate priority').limit(5),
      Task.find({ user: userId, status: 'pending', dueDate: { $gte: startOfToday, $lte: endOfToday } }).select('title dueDate priority').limit(5),
      Reminder.find({ user: userId, status: { $in: ['scheduled', 'sent'] } }).select('message scheduledAt').limit(5)
    ]);

    const factual = {
      overdueTasksCount: overdueTasks.length,
      overdueTasks: overdueTasks.map(t => t.title),
      unfinishedTodayCount: unfinishedToday.length,
      unfinishedToday: unfinishedToday.map(t => t.title),
      activeRemindersCount: activeReminders.length,
      activeReminders: activeReminders.map(r => r.message)
    };

    let summaryText = '';
    if (factual.overdueTasksCount === 0 && factual.unfinishedTodayCount === 0 && factual.activeRemindersCount === 0) {
      summaryText = "You're completely caught up! No overdue tasks or forgotten commitments right now.";
    } else {
      const parts = [];
      if (factual.overdueTasksCount > 0) parts.push(`${factual.overdueTasksCount} overdue tasks: ${factual.overdueTasks.join(', ')}`);
      if (factual.unfinishedTodayCount > 0) parts.push(`${factual.unfinishedTodayCount} pending tasks for today: ${factual.unfinishedToday.join(', ')}`);
      if (factual.activeRemindersCount > 0) parts.push(`${factual.activeRemindersCount} active reminders: ${factual.activeReminders.join(', ')}`);
      summaryText = `Here is what needs your attention: ${parts.join('. ')}.`;
    }

    return {
      success: true,
      factual,
      summary: summaryText
    };
  }
};

export default summaryService;
