import Conversation from '../models/Conversation.js';
import ConversationMessage from '../models/ConversationMessage.js';
import AssistantMemory from '../models/AssistantMemory.js';
import Reminder from '../models/Reminder.js';
import DailyJournal from '../models/DailyJournal.js';
import AssistantSettings from '../models/AssistantSettings.js';
import AssistantToolExecution from '../models/AssistantToolExecution.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import assistantAgentService from '../services/assistant/assistantAgentService.js';
import { executeTool } from '../services/assistant/toolExecutor.js';
import ollamaService from '../services/ai/ollamaService.js';
import modelService from '../services/ai/modelService.js';
import summaryService from '../services/assistant/summaryService.js';
import memoryService from '../services/assistant/memoryService.js';

/**
 * Chat with assistant (Voice transcript or text input via Ollama)
 */
export const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, conversationId, audioUrl, clientTimezone } = req.body;
    const response = await assistantAgentService.processMessage({
      userId: req.user.id,
      conversationId,
      message,
      audioUrl,
      clientTimezone
    });

    res.json(response);
  } catch (err) {
    next(err);
  }
};

/**
 * Health check for local Ollama server
 */
export const getAssistantHealth = async (req, res, next) => {
  try {
    const health = await ollamaService.checkHealth();
    const effective = await modelService.getEffectiveModel(req.user?.id);
    res.json({
      success: true,
      status: health.online ? 'ok' : 'offline',
      online: Boolean(health.online),
      ...health,
      activeModel: effective.modelName,
      supportsTools: effective.supportsTools
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Discover installed models from local Ollama
 */
export const getOllamaModels = async (req, res, next) => {
  try {
    const models = await ollamaService.getInstalledModels();
    const running = await ollamaService.getRunningModels();
    const effective = await modelService.getEffectiveModel(req.user?.id);

    res.json({
      success: true,
      count: models.length,
      activeModel: effective.modelName,
      models,
      runningModels: running
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Test Connection with specified local model
 */
export const testOllamaConnection = async (req, res, next) => {
  try {
    const { model } = req.body;
    const testResult = await ollamaService.testConnection(model);
    res.json(testResult);
  } catch (err) {
    next(err);
  }
};

/**
 * Transcribe Audio (Mock Whisper fallback + Speech API endpoint)
 */
export const transcribeAudio = async (req, res, next) => {
  try {
    const { audioText } = req.body;
    res.json({
      success: true,
      transcript: audioText || 'Task created via voice command.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Text-to-speech audio metadata endpoint
 */
export const speakText = async (req, res, next) => {
  try {
    const { text, language = 'en' } = req.body;
    res.json({
      success: true,
      text,
      language,
      voiceEngine: 'WebSpeechSynthesis'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Conversations
 */
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(30);

    res.json({ success: true, count: conversations.length, conversations });
  } catch (err) {
    next(err);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, user: req.user.id });
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });

    const messages = await ConversationMessage.find({ conversationId: conversation._id, user: req.user.id })
      .sort({ createdAt: 1 });

    res.json({ success: true, conversation, messages });
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    await ConversationMessage.deleteMany({ conversationId: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * Memory Management Endpoints
 */
export const getMemories = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    if (search) {
      const memories = await memoryService.searchMemories(req.user.id, search);
      return res.json({ success: true, count: memories.length, memories });
    }

    const query = { user: req.user.id };
    if (category && category !== 'all') query.category = category;

    const memories = await AssistantMemory.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: memories.length, memories });
  } catch (err) {
    next(err);
  }
};

export const createMemory = async (req, res, next) => {
  try {
    const { content, category = 'preference', importance = 'medium' } = req.body;
    const memory = await memoryService.saveMemory({
      userId: req.user.id,
      content,
      category,
      importance
    });
    res.status(201).json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

export const updateMemory = async (req, res, next) => {
  try {
    const memory = await AssistantMemory.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });
    res.json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

export const deleteMemory = async (req, res, next) => {
  try {
    await AssistantMemory.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Memory removed from index' });
  } catch (err) {
    next(err);
  }
};

/**
 * Assistant Settings
 */
export const getAssistantSettings = async (req, res, next) => {
  try {
    let settings = await AssistantSettings.findOne({ user: req.user.id });
    if (!settings) {
      settings = await AssistantSettings.create({
        user: req.user.id,
        preferredModel: process.env.OLLAMA_MODEL || 'qwen3.5:4b'
      });
    }
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

export const updateAssistantSettings = async (req, res, next) => {
  try {
    const settings = await AssistantSettings.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

/**
 * Activity Summaries
 */
export const getDailySummaryEndpoint = async (req, res, next) => {
  try {
    const summary = await summaryService.getDailySummary(req.user.id, req.query.date);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getWeeklySummaryEndpoint = async (req, res, next) => {
  try {
    const summary = await summaryService.getWeeklySummary(req.user.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

export const getMonthlySummaryEndpoint = async (req, res, next) => {
  try {
    const summary = await summaryService.getMonthlySummary(req.user.id, req.query.month);
    res.json(summary);
  } catch (err) {
    next(err);
  }
};

/**
 * Morning Briefing
 */
export const getDailyBriefing = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [tasks, overdue, activeGoals] = await Promise.all([
      Task.find({ user: req.user.id, dueDate: { $gte: startOfDay, $lte: endOfDay } }),
      Task.find({ user: req.user.id, dueDate: { $lt: startOfDay }, status: 'pending' }),
      Goal.find({ user: req.user.id, status: 'active' }).limit(3)
    ]);

    const briefingText = `Good morning! You have ${tasks.length} scheduled tasks today, with ${overdue.length} items rolling over from yesterday. Your primary active goal is "${activeGoals[0]?.title || 'Placement Preparation'}".`;

    res.json({
      success: true,
      date: today.toISOString().slice(0, 10),
      scheduledTasksCount: tasks.length,
      overdueTasksCount: overdue.length,
      activeGoalsCount: activeGoals.length,
      primaryGoalTitle: activeGoals[0]?.title || 'Main Goal',
      briefingText,
      tasks: tasks.slice(0, 5).map(t => ({ id: t._id, title: t.title, priority: t.priority }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Evening Review
 */
export const getDailyReview = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const [analytics, completedTasks, pendingTasks] = await Promise.all([
      DailyAnalytics.findOne({ user: req.user.id, date: todayStr }),
      Task.find({ user: req.user.id, status: 'completed', completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Task.find({ user: req.user.id, status: 'pending' })
    ]);

    const reviewText = `Evening Review: Today you completed ${completedTasks.length} tasks and logged ${analytics?.totalWorkMinutes || 0} minutes of focused work. You have an ${analytics?.consistencyScore || 85}% consistency score today.`;

    res.json({
      success: true,
      date: todayStr,
      consistencyScore: analytics?.consistencyScore || 85,
      focusMinutes: analytics?.totalWorkMinutes || 0,
      completedTasksCount: completedTasks.length,
      pendingTasksCount: pendingTasks.length,
      reviewText,
      completedTasks: completedTasks.map(t => ({ id: t._id, title: t.title })),
      pendingTasks: pendingTasks.slice(0, 5).map(t => ({ id: t._id, title: t.title }))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Recall forgotten commitments: unfinished tasks, overdue items, pending reminders
 */
export const getForgottenItemsEndpoint = async (req, res, next) => {
  try {
    const data = await summaryService.getForgottenItems(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * Reminders
 */
export const getReminders = async (req, res, next) => {
  try {
    const reminders = await Reminder.find({ user: req.user.id, status: 'scheduled' })
      .populate('taskId', 'title')
      .sort({ scheduledAt: 1 });

    res.json({ success: true, count: reminders.length, reminders });
  } catch (err) {
    next(err);
  }
};

export const createReminder = async (req, res, next) => {
  try {
    const { message, scheduledAt, taskId, reminderType } = req.body;
    const reminder = await Reminder.create({
      user: req.user.id,
      message,
      scheduledAt: new Date(scheduledAt),
      taskId: taskId || null,
      reminderType: reminderType || 'custom'
    });

    res.status(201).json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
};

export const snoozeReminder = async (req, res, next) => {
  try {
    const { minutes = 15 } = req.body;
    const snoozedUntil = new Date(Date.now() + minutes * 60000);
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: 'snoozed', snoozedUntil, scheduledAt: snoozedUntil },
      { new: true }
    );
    res.json({ success: true, reminder });
  } catch (err) {
    next(err);
  }
};

export const deleteReminder = async (req, res, next) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Reminder removed' });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle interactive responses to reminders (Voice or UI quick actions: completed, still_working, snooze, reschedule, skip)
 */
export const respondToReminder = async (req, res, next) => {
  try {
    const { action, newDueDate, snoozeMinutes = 30 } = req.body;
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user.id }).populate('taskId');
    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found' });
    }

    const task = reminder.taskId;

    if (action === 'completed') {
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
        await task.save();
      }
      reminder.status = 'dismissed';
      await reminder.save();
      return res.json({ success: true, action, message: `Marked "${task ? task.title : 'Task'}" as completed.` });
    }

    if (action === 'still_working') {
      const snoozedUntil = new Date(Date.now() + snoozeMinutes * 60000);
      reminder.status = 'snoozed';
      reminder.scheduledAt = snoozedUntil;
      reminder.snoozedUntil = snoozedUntil;
      await reminder.save();
      return res.json({ success: true, action, message: `Keep going! Reminder snoozed for ${snoozeMinutes} minutes.` });
    }

    if (action === 'snooze' || action === 'remind_later') {
      const snoozedUntil = new Date(Date.now() + (snoozeMinutes || 15) * 60000);
      reminder.status = 'snoozed';
      reminder.scheduledAt = snoozedUntil;
      reminder.snoozedUntil = snoozedUntil;
      await reminder.save();
      return res.json({ success: true, action, message: `Reminder snoozed for ${snoozeMinutes || 15} minutes.` });
    }

    if (action === 'reschedule') {
      const targetDate = newDueDate ? new Date(newDueDate) : new Date(Date.now() + 24 * 3600000);
      if (task) {
        task.dueDate = targetDate;
        await task.save();
      }
      reminder.scheduledAt = targetDate;
      reminder.status = 'scheduled';
      await reminder.save();
      return res.json({ success: true, action, message: `Rescheduled to ${targetDate.toLocaleDateString()}.` });
    }

    if (action === 'skip' || action === 'dismiss') {
      reminder.status = 'dismissed';
      await reminder.save();
      return res.json({ success: true, action, message: 'Reminder dismissed.' });
    }

    return res.status(400).json({ success: false, message: `Unknown action "${action}"` });
  } catch (err) {
    next(err);
  }
};

/**
 * Daily Journal
 */
export const getDailyJournal = async (req, res, next) => {
  try {
    const date = req.params.date || new Date().toISOString().slice(0, 10);
    const journal = await DailyJournal.findOne({ user: req.user.id, localDate: date });
    res.json({ success: true, date, journal: journal || { localDate: date, entries: [], reflection: '' } });
  } catch (err) {
    next(err);
  }
};

export const saveJournalEntry = async (req, res, next) => {
  try {
    const { date, entry, reflection } = req.body;
    const localDate = date || new Date().toISOString().slice(0, 10);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const journal = await DailyJournal.findOneAndUpdate(
      { user: req.user.id, localDate },
      {
        ...(entry ? {
          $push: {
            entries: {
              time: timeNow,
              activity: entry,
              entryType: 'self_reported'
            }
          }
        } : {}),
        ...(reflection ? { reflection } : {})
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, journal });
  } catch (err) {
    next(err);
  }
};

/**
 * Get recent AI action execution history with undo capability
 */
export const getActionHistory = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 30;
    const executions = await AssistantToolExecution.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const history = executions.map(e => ({
      id: e._id,
      toolName: e.toolName,
      executionStatus: e.executionStatus,
      arguments: e.validatedArguments,
      result: e.sanitizedResult,
      errorMessage: e.errorMessage,
      canUndo: Boolean(e.undoData && !e.isUndone),
      isUndone: Boolean(e.isUndone),
      createdAt: e.createdAt
    }));

    res.json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
};

/**
 * Undo an action by execution ID
 */
export const undoAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const undoRes = await executeTool({
      userId: req.user.id,
      toolName: 'undo_last_action',
      args: { executionId: id }
    });

    res.json(undoRes);
  } catch (err) {
    next(err);
  }
};

/**
 * Confirm and execute a pending high-risk action
 */
export const confirmAction = async (req, res, next) => {
  try {
    const { confirmationToken } = req.body;
    if (!confirmationToken) {
      return res.status(400).json({ success: false, message: 'confirmationToken is required.' });
    }

    const confirmRes = await executeTool({
      userId: req.user.id,
      toolName: 'confirm_pending_action',
      args: { confirmationToken }
    });

    res.json(confirmRes);
  } catch (err) {
    next(err);
  }
};
