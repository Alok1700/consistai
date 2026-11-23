import express from 'express';
import { protect, optionalProtect } from '../middleware/auth.js';
import {
  chatWithAssistant,
  getAssistantHealth,
  getOllamaModels,
  testOllamaConnection,
  transcribeAudio,
  speakText,
  getConversations,
  getConversationById,
  deleteConversation,
  getMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  getAssistantSettings,
  updateAssistantSettings,
  getDailySummaryEndpoint,
  getWeeklySummaryEndpoint,
  getMonthlySummaryEndpoint,
  getDailyBriefing,
  getDailyReview,
  getForgottenItemsEndpoint,
  getReminders,
  createReminder,
  snoozeReminder,
  deleteReminder,
  respondToReminder,
  getDailyJournal,
  saveJournalEntry,
  getActionHistory,
  undoAction,
  confirmAction
} from '../controllers/assistantController.js';

const router = express.Router();

// 1. Ollama Connectivity & Diagnostics (Public / Optional Auth for health polling)
router.get('/health', optionalProtect, getAssistantHealth);

router.use(protect);

router.get('/models', getOllamaModels);
router.post('/test-connection', testOllamaConnection);

// 2. Core Chat & Audio
router.post('/chat', chatWithAssistant);
router.post('/transcribe', transcribeAudio);
router.post('/speak', speakText);

// 3. Conversation History
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);

// 4. Persistent Memory
router.get('/memory', getMemories);
router.get('/memories', getMemories); // alias
router.post('/memory', createMemory);
router.post('/memories', createMemory); // alias
router.patch('/memory/:id', updateMemory);
router.put('/memory/:id', updateMemory); // alias
router.put('/memories/:id', updateMemory); // alias
router.delete('/memory/:id', deleteMemory);
router.delete('/memories/:id', deleteMemory); // alias

// 5. Activity Summaries
router.get('/daily-summary', getDailySummaryEndpoint);
router.get('/weekly-summary', getWeeklySummaryEndpoint);
router.get('/monthly-summary', getMonthlySummaryEndpoint);
router.get('/summary/daily', getDailySummaryEndpoint);
router.get('/summary/weekly', getWeeklySummaryEndpoint);
router.get('/summary/monthly', getMonthlySummaryEndpoint);
router.get('/daily-briefing', getDailyBriefing);
router.get('/daily-review', getDailyReview);
router.get('/what-did-i-forget', getForgottenItemsEndpoint);
router.get('/forgotten-items', getForgottenItemsEndpoint);

// 6. Settings
router.get('/settings', getAssistantSettings);
router.post('/settings', updateAssistantSettings);
router.put('/settings', updateAssistantSettings);

// 7. Reminders
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.patch('/reminders/:id/snooze', snoozeReminder);
router.post('/reminders/:id/respond', respondToReminder);
router.delete('/reminders/:id', deleteReminder);

// 8. Journal
router.get('/journal/:date', getDailyJournal);
router.post('/journal/:date', saveJournalEntry);

// 9. AI Action Execution History & Undo
router.get('/actions/history', getActionHistory);
router.post('/actions/:id/undo', undoAction);
router.post('/actions/confirm', confirmAction);

export default router;
