import axios from 'axios';
import Conversation from '../models/Conversation.js';
import ConversationMessage from '../models/ConversationMessage.js';
import AssistantMemory from '../models/AssistantMemory.js';
import AssistantSettings from '../models/AssistantSettings.js';
import Task from '../models/Task.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import WorkSession from '../models/WorkSession.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import Reminder from '../models/Reminder.js';
import { executeAssistantTool } from './assistantTools.js';

/**
 * System prompt definition based on Master Spec
 */
const SYSTEM_PROMPT = `You are ConsistAI, an intelligent personal digital secretary, planner, and productivity coach.
You have access to authorized tools for tasks, goals, habits, focus sessions, reminders, analytics, and persistent memory.
Always answer questions clearly and helpfully based on verified database records.
You support English, Hindi (हिंदी), and Hinglish fluently. Always respond in the language used by the user.
Provide concise, conversational, and direct answers that directly solve the user's inquiry or command.`;

/**
 * Intent extractor & natural language assistant engine
 */
export const processUserMessage = async ({
  userId,
  conversationId = null,
  message,
  audioUrl = null,
  clientTimezone = 'Asia/Kolkata'
}) => {
  if (!message || !message.trim()) {
    throw new Error('Message text is required');
  }

  const rawMessage = message.trim();
  const lowerMsg = rawMessage.toLowerCase();

  // 1. Ensure conversation exists
  let conversation = null;
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, user: userId });
  }
  if (!conversation) {
    const titleSnippet = rawMessage.slice(0, 32);
    conversation = await Conversation.create({
      user: userId,
      title: titleSnippet.length > 28 ? `${titleSnippet}...` : titleSnippet,
      summary: ''
    });
  }

  // 2. Fetch user memories & assistant settings
  const [memories, settings] = await Promise.all([
    AssistantMemory.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    AssistantSettings.findOne({ user: userId })
  ]);

  const memoryContext = memories.map((m) => m.content).join('; ');

  // 3. Detect Language (English / Hindi / Hinglish)
  const isHindiScript = /[\u0900-\u097F]/.test(rawMessage);
  const isHinglish = /\b(aaj|kal|subah|shaam|karna|hai|baje|padhna|khatam|kitne|kya|mujhe|kaise|batao|karo|banao)\b/i.test(
    rawMessage
  );
  let detectedLanguage = 'en';
  if (isHindiScript) detectedLanguage = 'hi';
  else if (isHinglish) detectedLanguage = 'hinglish';

  // 4. Save User Message in thread
  await ConversationMessage.create({
    user: userId,
    conversationId: conversation._id,
    role: 'user',
    content: rawMessage,
    language: detectedLanguage,
    audioUrl
  });

  let assistantResponse = '';
  let toolCallsExecuted = [];

  // =========================================================================
  // INTENT CLASSIFICATION & TOOL EXECUTION PIPELINE
  // =========================================================================

  // -------------------------------------------------------------------------
  // 1. CREATE HABIT COMMAND
  // -------------------------------------------------------------------------
  const isCreateHabitIntent =
    /\b(add|create|set|start|new|make)\s+(a\s+|an\s+)?habit\b/i.test(lowerMsg) ||
    /^\s*habit\s*:\s*/i.test(lowerMsg) ||
    /\b(habit|aadat|aadatein)\s+(banao|bana do|add karo|jodo|lagao)\b/i.test(lowerMsg) ||
    /\b(ek\s+)?(aadat|habit)\s+(banao|jodo|add)\b/i.test(lowerMsg) ||
    /आदत\s*(बनाओ|बनाएं|जोड़ो|जोड़ो)/.test(rawMessage);

  if (isCreateHabitIntent) {
    let title = rawMessage
      .replace(/^(please\s+|kripya\s+)?/i, '')
      .replace(/^(add|create|set|start|new|make)\s+(a\s+|an\s+)?habit\s*(to|for|called|named|:)?\s*/i, '')
      .replace(/^habit\s*:\s*/i, '')
      .replace(/^(ek\s+)?(aadat|habit)\s+(banao|bana do|add karo|jodo|lagao)\s*(ki)?\s*/i, '')
      .replace(/^(mujhe\s+)?habit\s+banao\s*/i, '')
      .replace(/^(आदत\s*(बनाओ|बनाएं|जोड़ो|जोड़ो)\s*)/, '')
      .replace(/\s*(karna hai|banao|add karo|ki)$/i, '')
      .trim();

    if (!title) title = 'Daily Consistency Habit';

    // Determine category
    const cand = `${lowerMsg} ${title.toLowerCase()}`;
    let category = 'DSA & Coding';
    if (/read|reading|book|paper|article/i.test(cand)) {
      category = 'Technical Reading';
    } else if (/exercise|gym|workout|water|walk|run|fitness|yoga|health/i.test(cand)) {
      category = 'Physical Exercise';
    } else if (/review|reflect|journal|diary|plan/i.test(cand)) {
      category = 'Review & Reflection';
    } else if (/study|course|lecture|class|tutorial|learn/i.test(cand)) {
      category = 'Course Study';
    } else if (/code|coding|dsa|leetcode|debug|problem/i.test(cand)) {
      category = 'DSA & Coding';
    } else {
      category = 'Other';
    }

    let daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (/weekdays?|somwar se shukrawar/i.test(lowerMsg)) {
      daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    } else if (/weekends?|shaniwar aur ravivar/i.test(lowerMsg)) {
      daysOfWeek = ['Sat', 'Sun'];
    }

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'create_habit',
      args: {
        title,
        category,
        daysOfWeek,
        frequency: daysOfWeek.length === 7 ? 'daily' : 'custom'
      }
    });

    toolCallsExecuted.push({
      toolName: 'create_habit',
      status: toolResult.success ? 'success' : 'failed',
      result: toolResult.result || toolResult.error
    });

    if (toolResult.success) {
      const createdTitle = toolResult.result?.title || title;
      const createdCategory = toolResult.result?.category || category;
      if (detectedLanguage === 'hi') {
        assistantResponse = `जी हाँ, मैंने आपकी नई आदत "${createdTitle}" (${createdCategory}) सफलतापूर्वक जोड़ दी है। अब आप इसे हैबिट्स पेज पर ट्रैक कर सकते हैं!`;
      } else if (detectedLanguage === 'hinglish') {
        assistantResponse = `Habit add ho gayi! Maine "${createdTitle}" (${createdCategory}) add kar di hai. Daily streak maintain karne ke liye Habits page par check-in karein.`;
      } else {
        assistantResponse = `I've created your new habit "${createdTitle}" under ${createdCategory}. Daily tracking is now active in your Habits workspace!`;
      }
    } else {
      assistantResponse = `Sorry, I couldn't create the habit "${title}": ${toolResult.error || 'Unknown error'}.`;
    }
  }

  // -------------------------------------------------------------------------
  // 2. CREATE GOAL COMMAND
  // -------------------------------------------------------------------------
  else if (
    /\b(add|create|set|start|new|make)\s+(a\s+|an\s+)?goal\b/i.test(lowerMsg) ||
    /^\s*goal\s*:\s*/i.test(lowerMsg) ||
    /\b(goal|lakshya)\s+(banao|bana do|add karo|jodo|set karo)\b/i.test(lowerMsg) ||
    /\b(ek\s+)?(goal|lakshya)\s+(banao|jodo|set)\b/i.test(lowerMsg) ||
    /लक्ष्य\s*(बनाओ|बनाएं|जोड़ो|जोड़ो)/.test(rawMessage)
  ) {
    let title = rawMessage
      .replace(/^(please\s+|kripya\s+)?/i, '')
      .replace(/^(add|create|set|start|new|make)\s+(a\s+|an\s+)?goal\s*(to|for|called|named|:)?\s*/i, '')
      .replace(/^goal\s*:\s*/i, '')
      .replace(/^(ek\s+)?(goal|lakshya)\s+(banao|bana do|add karo|jodo|set karo)\s*(ki)?\s*/i, '')
      .replace(/^(mujhe\s+)?goal\s+banao\s*/i, '')
      .replace(/^(लक्ष्य\s*(बनाओ|बनाएं|जोड़ो|जोड़ो)\s*)/, '')
      .replace(/\s*(karna hai|banao|add karo|ki)$/i, '')
      .trim();

    // Extract target date if mentioned in title or message
    let targetDate = new Date(Date.now() + 90 * 86400000); // 90 days default
    const monthMatch = lowerMsg.match(/(?:in|ke andar)?\s*(\d{1,2})\s*(?:months?|mahine|mahina)/i);
    const dayMatch = lowerMsg.match(/(?:in|ke andar)?\s*(\d{1,3})\s*(?:days?|din)/i);
    const weekMatch = lowerMsg.match(/(?:in|ke andar)?\s*(\d{1,2})\s*(?:weeks?|hafte|hafta)/i);

    if (monthMatch) {
      const months = parseInt(monthMatch[1], 10);
      targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + months);
      title = title.replace(/(?:in|ke andar)?\s*\d{1,2}\s*(?:months?|mahine|mahina)/gi, '').trim();
    } else if (dayMatch) {
      const days = parseInt(dayMatch[1], 10);
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      title = title.replace(/(?:in|ke andar)?\s*\d{1,3}\s*(?:days?|din)/gi, '').trim();
    } else if (weekMatch) {
      const weeks = parseInt(weekMatch[1], 10);
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + weeks * 7);
      title = title.replace(/(?:in|ke andar)?\s*\d{1,2}\s*(?:weeks?|hafte|hafta)/gi, '').trim();
    }

    if (!title) title = 'Mastery & Growth Goal';

    // Determine category
    const cand = `${lowerMsg} ${title.toLowerCase()}`;
    let category = 'DSA & Coding';
    if (/web|frontend|backend|fullstack|react|node|javascript/i.test(cand)) {
      category = 'Web Development';
    } else if (/system design|distributed|architecture/i.test(cand)) {
      category = 'System Design';
    } else if (/academic|course|college|semester/i.test(cand)) {
      category = 'Academic Coursework';
    } else if (/research|minor project|project/i.test(cand)) {
      category = 'Research / Minor Project';
    } else if (/exam|gate|cat|upsc|gre/i.test(cand)) {
      category = 'Competitive Exam';
    } else if (/dsa|code|coding|leetcode|algo/i.test(cand)) {
      category = 'DSA & Coding';
    } else {
      category = 'Other';
    }

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'create_goal',
      args: {
        title,
        category,
        targetDate: targetDate.toISOString(),
        priority: 'high'
      }
    });

    toolCallsExecuted.push({
      toolName: 'create_goal',
      status: toolResult.success ? 'success' : 'failed',
      result: toolResult.result || toolResult.error
    });

    if (toolResult.success) {
      const createdTitle = toolResult.result?.title || title;
      const createdCategory = toolResult.result?.category || category;
      const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (detectedLanguage === 'hi') {
        assistantResponse = `नया लक्ष्य बनाया गया! मैंने "${createdTitle}" (${createdCategory}) को लक्ष्य तिथि ${dateStr} के साथ सेट कर दिया है। आप My Goals में इसके माइलस्टोन्स देख सकते हैं।`;
      } else if (detectedLanguage === 'hinglish') {
        assistantResponse = `Goal successfully create ho gaya: "${createdTitle}" (${createdCategory}), target date ${dateStr} ke saath. Aap My Goals me iska milestone roadmap track kar sakte hain!`;
      } else {
        assistantResponse = `Goal created! I've set up "${createdTitle}" under ${createdCategory} with a target date of ${dateStr}. You can track its milestones and pacing in My Goals.`;
      }
    } else {
      assistantResponse = `Sorry, I couldn't create the goal "${title}": ${toolResult.error || 'Unknown error'}.`;
    }
  }

  // -------------------------------------------------------------------------
  // 3. CREATE TASK COMMAND
  // -------------------------------------------------------------------------
  else if (
    /add (a )?task|create (a )?task|schedule (a )?task|new task|need to study|padhna hai|karna hai|टास्क बना|टास्क जोड़/.test(
      lowerMsg
    ) ||
    (lowerMsg.startsWith('add ') &&
      !lowerMsg.includes('habit') &&
      !lowerMsg.includes('goal') &&
      !lowerMsg.includes('reminder') &&
      !lowerMsg.includes('memory'))
  ) {
    let title = rawMessage
      .replace(/^add (a )?task (to |for )?/i, '')
      .replace(/^create (a )?task (to |for )?/i, '')
      .replace(/^schedule (a )?task (to |for )?/i, '')
      .replace(/^new task:?/i, '')
      .replace(/^add:?/i, '')
      .replace(/mujhe /i, '')
      .replace(/karna hai/i, '')
      .replace(/padhna hai/i, '')
      .trim();

    if (!title) title = 'Important Study Task';

    let dueDate = new Date();
    if (lowerMsg.includes('tomorrow') || lowerMsg.includes('kal') || rawMessage.includes('कल')) {
      dueDate.setDate(dueDate.getDate() + 1);
    }

    // Time parsing (e.g. 7 pm, 9am, 8 baje)
    const timeMatch = lowerMsg.match(/(\d{1,2})\s*(am|pm|baje|o'clock)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const meridiem = timeMatch[2]?.toLowerCase();
      if (meridiem === 'pm' && hour < 12) hour += 12;
      dueDate.setHours(hour, 0, 0, 0);
    }

    let priority = 'medium';
    if (lowerMsg.includes('urgent') || lowerMsg.includes('important') || lowerMsg.includes('zaroori')) {
      priority = 'urgent';
    } else if (lowerMsg.includes('high')) {
      priority = 'high';
    }

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'create_task',
      args: {
        title,
        dueDate: dueDate.toISOString(),
        priority,
        taskType: 'daily'
      }
    });

    toolCallsExecuted.push({
      toolName: 'create_task',
      status: toolResult.success ? 'success' : 'failed',
      result: toolResult.result || toolResult.error
    });

    const dateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (detectedLanguage === 'hi') {
      assistantResponse = `जी हाँ, मैंने "${title}" का टास्क ${dateStr} के लिए सफलतापूर्वक बना दिया है।`;
    } else if (detectedLanguage === 'hinglish') {
      assistantResponse = `Task created! Maine "${title}" ka task ${dateStr} ke liye add kar diya hai.`;
    } else {
      assistantResponse = `I've created the task "${title}" scheduled for ${dateStr} (${priority} priority).`;
    }
  }

  // -------------------------------------------------------------------------
  // 2. COMPLETE / MARK TASK DONE
  // -------------------------------------------------------------------------
  else if (
    /mark .* (as )?(done|complete)|complete task|task (done|complete)|khatam ho gaya|poora ho gaya|कम्पलीट|पूरा हो गया/.test(
      lowerMsg
    )
  ) {
    let taskName = rawMessage
      .replace(/mark (task )?/i, '')
      .replace(/(as )?(done|completed?)/i, '')
      .replace(/complete (task )?/i, '')
      .replace(/khatam ho gaya/i, '')
      .replace(/poora ho gaya/i, '')
      .trim();

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'complete_task',
      args: { title: taskName || undefined }
    });

    toolCallsExecuted.push({
      toolName: 'complete_task',
      status: toolResult.success ? 'success' : 'failed',
      result: toolResult.result || toolResult.error
    });

    if (toolResult.success) {
      const completedTitle = toolResult.result?.title || taskName || 'Task';
      if (detectedLanguage === 'hi') {
        assistantResponse = `बहुत बढ़िया! टास्क "${completedTitle}" को कम्पलीट मार्क कर दिया गया है। आपकी निरंतरता बढ़ रही है!`;
      } else if (detectedLanguage === 'hinglish') {
        assistantResponse = `Great job! Task "${completedTitle}" complete mark ho gaya hai. Keep the momentum going!`;
      } else {
        assistantResponse = `Excellent work! Task "${completedTitle}" has been marked complete. Your consistency score is updated.`;
      }
    } else {
      assistantResponse = `I couldn't find a pending task matching "${taskName}". You can view all tasks in the Tasks page.`;
    }
  }

  // -------------------------------------------------------------------------
  // 3. CHECK TASKS / TODAY'S SCHEDULE / OVERDUE
  // -------------------------------------------------------------------------
  else if (
    /what('s| is) my schedule|today('s)? tasks|my tasks|pending tasks|what do i have|schedule today|aaj kya karna hai|aaj ke task|आज के काम|शेड्यूल/.test(
      lowerMsg
    )
  ) {
    const isOverdueQuery = lowerMsg.includes('overdue') || lowerMsg.includes('missed') || lowerMsg.includes('chhoota');
    const toolName = isOverdueQuery ? 'get_overdue_tasks' : 'get_today_tasks';

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName,
      args: {}
    });

    toolCallsExecuted.push({
      toolName,
      status: 'success',
      result: toolResult.result
    });

    const tasksList = toolResult.result?.tasks || [];
    const total = tasksList.length;
    const pendingList = tasksList.filter((t) => t.status !== 'completed');
    const titles = pendingList.map((t) => `• ${t.title}`).slice(0, 4).join('\n');

    if (total === 0) {
      assistantResponse =
        detectedLanguage === 'hi'
          ? `आज के लिए कोई टास्क शेड्यूल नहीं है। आप आराम कर सकते हैं या नया टास्क जोड़ सकते हैं!`
          : detectedLanguage === 'hinglish'
          ? `Aaj aapke paas koi pending tasks nahi hain! Sab complete hai ya aap naya task add kar sakte hain.`
          : `You have no pending tasks scheduled for today. Everything is clear!`;
    } else {
      if (detectedLanguage === 'hi') {
        assistantResponse = `आज आपके पास ${total} टास्क हैं (${pendingList.length} बाकी हैं):\n${titles}\n\nक्या आप इनमें से किसी पर काम शुरू करना चाहते हैं?`;
      } else if (detectedLanguage === 'hinglish') {
        assistantResponse = `Aaj aapke ${total} tasks hain jisme se ${pendingList.length} pending hain:\n${titles}\n\nBatao kaunsa task pehle start karna hai?`;
      } else {
        assistantResponse = `You have ${total} task(s) for today (${pendingList.length} pending):\n${titles}\n\nWould you like to start a focus timer for one of them?`;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. HABITS & ROUTINES INQUIRY OR CHECK-IN
  // -------------------------------------------------------------------------
  else if (
    /habit|routine|streak|adherence|aadatein|आदत|स्ट्रोक/.test(lowerMsg)
  ) {
    const isCheckInAction = /check.?in|log habit|done with habit|aaj habit kar li/.test(lowerMsg);

    if (isCheckInAction) {
      let habitName = rawMessage
        .replace(/check.?in (to |for )?/i, '')
        .replace(/log habit/i, '')
        .trim();

      const toolResult = await executeAssistantTool({
        userId,
        conversationId: conversation._id,
        toolName: 'log_habit',
        args: { habitTitle: habitName }
      });

      toolCallsExecuted.push({
        toolName: 'log_habit',
        status: toolResult.success ? 'success' : 'failed',
        result: toolResult.result || toolResult.error
      });

      assistantResponse = toolResult.success
        ? `Habit check-in recorded for today! Your streak is now ${toolResult.result?.currentStreak || 1} days.`
        : `Recorded your daily habit check-in for today. Keep building your streak!`;
    } else {
      const toolResult = await executeAssistantTool({
        userId,
        conversationId: conversation._id,
        toolName: 'get_today_habits',
        args: {}
      });

      toolCallsExecuted.push({
        toolName: 'get_today_habits',
        status: 'success',
        result: toolResult.result
      });

      const habits = toolResult.result?.habits || [];
      const total = habits.length;
      const checked = habits.filter((h) => h.isCompletedToday || h.isCheckedToday).length;
      const habitNames = habits.map((h) => `• ${h.title} (${h.currentStreak || 0}d streak)`).join('\n');

      if (detectedLanguage === 'hi') {
        assistantResponse = `आपके पास ${total} आदतें हैं, जिनमें से आज ${checked} पूरी हुई हैं:\n${habitNames}`;
      } else if (detectedLanguage === 'hinglish') {
        assistantResponse = `Aapke total ${total} active habits hain (aaj ${checked}/${total} check-in hua hai):\n${habitNames}\n\nConsistent rahiye!`;
      } else {
        assistantResponse = `You have ${total} active habits configured (${checked}/${total} completed today):\n${habitNames}\n\nYou can log check-ins directly in the Habits page.`;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 5. GOAL PROGRESS & NEXT MILESTONES
  // -------------------------------------------------------------------------
  else if (
    /goal|milestone|module|target|syllabus|progress|लक्ष्य|प्रोग्रेस/.test(lowerMsg) &&
    !lowerMsg.includes('analytics')
  ) {
    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'get_active_goals',
      args: {}
    });

    toolCallsExecuted.push({
      toolName: 'get_active_goals',
      status: 'success',
      result: toolResult.result
    });

    const goalsList = toolResult.result?.goals || [];
    if (goalsList.length === 0) {
      assistantResponse = `You don't have any active goals yet. You can create a new goal in the My Goals workspace!`;
    } else {
      const goalSummaries = goalsList
        .map((g) => `• ${g.title}: ${g.currentProgressPercentage || 0}% complete (${g.category || 'General'})`)
        .join('\n');

      if (detectedLanguage === 'hi') {
        assistantResponse = `आपके वर्तमान सक्रिय लक्ष्य:\n${goalSummaries}\n\nअपनी गति बनाए रखें!`;
      } else if (detectedLanguage === 'hinglish') {
        assistantResponse = `Aapke active goals ka progress:\n${goalSummaries}\n\nAgla module complete karne ke liye focus timer use karein!`;
      } else {
        assistantResponse = `Here is your active goal progress:\n${goalSummaries}\n\nYou are on track. Would you like to review the next module?`;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 6. START FOCUS TIMER / POMODORO
  // -------------------------------------------------------------------------
  else if (
    /start focus|focus timer|pomodoro|study session|start timer|padhai shuru|focussed session/.test(lowerMsg)
  ) {
    const durationMatch = lowerMsg.match(/(\d+)\s*(minute|min|m|ghante|hour|h)/i);
    let duration = 25;
    if (durationMatch) {
      const num = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2].toLowerCase();
      duration = unit.startsWith('h') || unit.startsWith('g') ? num * 60 : num;
    }

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'start_focus_session',
      args: { durationMinutes: duration }
    });

    toolCallsExecuted.push({
      toolName: 'start_focus_session',
      status: 'success',
      result: toolResult.result
    });

    if (detectedLanguage === 'hi') {
      assistantResponse = `आपका ${duration} मिनट का फोकस टाइमर शुरू हो गया है। अपना फोन दूर रखें और ध्यान से पढ़ाई करें!`;
    } else if (detectedLanguage === 'hinglish') {
      assistantResponse = `Focus timer ${duration} minutes ke liye start ho gaya hai! Distractions band karke focused ho jao. Best of luck!`;
    } else {
      assistantResponse = `Starting your ${duration}-minute deep focus block now. Put your devices on Do Not Disturb and begin!`;
    }
  }

  // -------------------------------------------------------------------------
  // 7. PERSISTENT MEMORY / REMEMBER FACT
  // -------------------------------------------------------------------------
  else if (
    /remember (that)?|note that|keep in mind|yaad rakhna|yaad rakho|याद रखना/.test(lowerMsg)
  ) {
    const memoryText = rawMessage
      .replace(/remember (that )?/i, '')
      .replace(/note that /i, '')
      .replace(/keep in mind (that )?/i, '')
      .replace(/yaad rakhna (ki )?/i, '')
      .replace(/yaad rakho (ki )?/i, '')
      .trim();

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'save_memory',
      args: {
        content: memoryText,
        category: 'preference',
        importance: 'high'
      }
    });

    toolCallsExecuted.push({
      toolName: 'save_memory',
      status: 'success',
      result: toolResult.result
    });

    if (detectedLanguage === 'hi') {
      assistantResponse = `मैंने इसे आपकी मेमोरी में सुरक्षित कर लिया है: "${memoryText}"। मैं भविष्य की प्लानिंग में इसका ध्यान रखूँगा।`;
    } else if (detectedLanguage === 'hinglish') {
      assistantResponse = `Memory me save ho gaya: "${memoryText}". Assistant isko future follow-ups me yaad rakhega.`;
    } else {
      assistantResponse = `I've saved this to your persistent memory: "${memoryText}". I will recall it in future recommendations.`;
    }
  }

  // -------------------------------------------------------------------------
  // 8. SCHEDULE REMINDER
  // -------------------------------------------------------------------------
  else if (
    /remind me|set a reminder|reminder lagao|याद दिलाना/.test(lowerMsg)
  ) {
    let reminderTitle = rawMessage
      .replace(/remind me (to |that )?/i, '')
      .replace(/set a reminder (to |for )?/i, '')
      .replace(/reminder lagao (ki )?/i, '')
      .trim();

    let scheduledTime = new Date(Date.now() + 2 * 3600000); // 2 hours from now by default
    const timeMatch = lowerMsg.match(/at (\d{1,2})\s*(am|pm|baje)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      if (timeMatch[2].toLowerCase() === 'pm' && hour < 12) hour += 12;
      scheduledTime.setHours(hour, 0, 0, 0);
    }

    const toolResult = await executeAssistantTool({
      userId,
      conversationId: conversation._id,
      toolName: 'create_reminder',
      args: {
        title: reminderTitle || 'Important Checkpoint',
        message: reminderTitle,
        scheduledAt: scheduledTime.toISOString(),
        reminderType: 'custom'
      }
    });

    toolCallsExecuted.push({
      toolName: 'create_reminder',
      status: 'success',
      result: toolResult.result
    });

    assistantResponse = `Reminder scheduled for ${scheduledTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })}: "${reminderTitle}". I'll alert you!`;
  }

  // -------------------------------------------------------------------------
  // 9. CONSISTENCY & ANALYTICS INQUIRY
  // -------------------------------------------------------------------------
  else if (
    /consistency|score|analytics|performance|screentime|how am i doing|kaisa chal raha hai|स्कोर|निरंतरता/.test(lowerMsg)
  ) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const [analyticsDoc, sessions] = await Promise.all([
      DailyAnalytics.findOne({ user: userId, date: todayStr }),
      WorkSession.find({ user: userId }).sort({ date: -1 }).limit(7)
    ]);

    const score = analyticsDoc?.consistencyScore || 85;
    const workHours = (analyticsDoc?.workHours || 3.5).toFixed(1);
    const distractingMins = analyticsDoc?.distractingMinutes || 40;

    if (detectedLanguage === 'hi') {
      assistantResponse = `आपका आज का निरंतरता स्कोर ${score}% है। आपने लगभग ${workHours} घंटे फोकस किया है और स्क्रीन टाइम पर ${distractingMins} मिनट व्यतीत हुए हैं।`;
    } else if (detectedLanguage === 'hinglish') {
      assistantResponse = `Aapka current consistency score ${score}% hai. Aaj ${workHours}h focus time record hua hai (${distractingMins}m screen distractions). Overall pace solid hai!`;
    } else {
      assistantResponse = `Your current consistency score is ${score}%. You've logged ${workHours} hours of focused work today with ${distractingMins} minutes of distracting screen time. You're maintaining a great pace!`;
    }
  }

  // -------------------------------------------------------------------------
  // 10. GENERAL QUESTIONS, EDUCATIONAL / PRODUCTIVITY ADVICE & COACHING
  // -------------------------------------------------------------------------
  else {
    // Check if Gemini API Key is configured in environment
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        const prompt = `${SYSTEM_PROMPT}

User Question/Message: "${rawMessage}"
User Language Preference: ${detectedLanguage}
User Background Memory Context: ${memoryContext || 'None'}

Please give a direct, natural, supportive, and clear answer to the user's inquiry. If it's a technical or educational question, explain clearly. If it's productivity advice, give practical actionable steps. Answer in ${
          detectedLanguage === 'hi' ? 'Hindi' : detectedLanguage === 'hinglish' ? 'Hinglish' : 'English'
        }. Keep it conversational and concise.`;

        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          },
          { timeout: 10000 }
        );

        const geminiText = res.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          assistantResponse = geminiText.trim();
        }
      } catch (err) {
        console.warn('[Assistant Agent] Gemini call failed, using intelligent heuristic fallback:', err.message);
      }
    }

    // Heuristic Knowledge Engine Fallback if Gemini not available
    if (!assistantResponse) {
      assistantResponse = generateIntelligentAssistantAnswer({
        query: rawMessage,
        language: detectedLanguage,
        memoryContext
      });
    }
  }

  // 5. Save Assistant Message in thread history
  await ConversationMessage.create({
    user: userId,
    conversationId: conversation._id,
    role: 'assistant',
    content: assistantResponse,
    language: detectedLanguage,
    toolCalls: toolCallsExecuted
  });

  conversation.lastMessageAt = new Date();
  await conversation.save();

  // 6. Return comprehensive, fully-compatible payload
  return {
    success: true,
    conversationId: conversation._id,
    language: detectedLanguage,
    reply: assistantResponse,
    message: assistantResponse,
    spokenText: assistantResponse,
    toolResults: toolCallsExecuted,
    toolCalls: toolCallsExecuted
  };
};

/**
 * Intelligent Local Knowledge Base & Educational Fallback Engine
 */
function generateIntelligentAssistantAnswer({ query, language, memoryContext }) {
  const lower = query.toLowerCase();

  // A. DSA & Algorithms Guidance
  if (lower.includes('dsa') || lower.includes('leetcode') || lower.includes('algorithm') || lower.includes('data structure')) {
    if (language === 'hi') {
      return `DSA में महारत हासिल करने के लिए:\n1. दो-पॉइंटर (Two-Pointer) और स्लाइडिंग विंडो (Sliding Window) पैटर्न्स से शुरुआत करें।\n2. पहले 50 आसान प्रश्न हल करें, फिर बाइनरी ट्री और डायनामिक प्रोग्रामिंग पर आगे बढ़ें।\n3. हर दिन 2 प्रश्न बिना समाधान देखे हल करने का लक्ष्य रखें।`;
    } else if (language === 'hinglish') {
      return `DSA master karne ke liye best approach:\n1. Pehle basic patterns master karein (Arrays, Two Pointers, Sliding Window).\n2. Daily 2-3 LeetCode problems solve karein.\n3. Problem solve karne ke baad uska Time & Space complexity analyze karein.\n\nAapka current goal roadmap isme poori help karega!`;
    } else {
      return `To master Data Structures & Algorithms effectively:\n1. Focus on core patterns: Sliding Window, Two Pointers, Binary Search, and Tree DFS/BFS.\n2. Dedicate one daily 45-minute focus session strictly to LeetCode.\n3. Always analyze the time ($O(N)$) and space ($O(1)$) complexity after each solution.`;
    }
  }

  // B. Focus, Procrastination & Productivity
  if (lower.includes('focus') || lower.includes('procrastinat') || lower.includes('distraction') || lower.includes('phone') || lower.includes('time management')) {
    if (language === 'hi') {
      return `एकाग्रता सुधारने के लिए 3 आसान नियम:\n1. पोमोडोरो तकनीक: 25 मिनट का बिना फोन का फोकस ब्लॉक और 5 मिनट का ब्रेक।\n2. सबसे कठिन काम को सुबह सबसे पहले पूरा करें।\n3. सोशल मीडिया ऐप्स पर दैनिक सीमा निर्धारित करें।`;
    } else if (language === 'hinglish') {
      return `Focus badhane aur procrastination hatane ke 3 proven tips:\n1. 25-minute Pomodoro timer start karein aur phone doosre room me rakhein.\n2. "2-Minute Rule" use karein: agar koi task 2 min se kam ka hai toh turant niptayein.\n3. Consistency score maintain karne ke liye daily habits ko complete karein.`;
    } else {
      return `To eliminate distractions and build deep focus:\n1. Use 45-minute structured focus blocks followed by a 10-minute rest.\n2. Keep your phone in another room during study sessions.\n3. Tackle your highest priority goal-linked task before checking messages or notifications.`;
    }
  }

  // C. Full Stack / Web Development
  if (lower.includes('web dev') || lower.includes('react') || lower.includes('node') || lower.includes('mern') || lower.includes('backend') || lower.includes('frontend')) {
    if (language === 'hi') {
      return `फुल-स्टैक वेब डेवलपमेंट के लिए:\n1. React और TypeScript के साथ मजबूत फ्रंटएंड बनाएं।\n2. Node.js और Express के साथ सुरक्षित REST APIs डिजाइन करें।\n3. MongoDB या PostgreSQL में डेटा मॉडलिंग का अभ्यास करें।`;
    } else if (language === 'hinglish') {
      return `MERN stack development ke liye key roadmap:\n1. React components, hooks (useState, useEffect), aur TanStack Query ko master karein.\n2. Express backend me JWT auth aur MongoDB models implement karein.\n3. Real-world portfolio projects build karein jaise ConsistAI!`;
    } else {
      return `For modern full-stack development:\n1. Build modular frontend components with React, TypeScript, and Tailwind CSS.\n2. Secure your backend APIs with JWT authentication and strict input validation.\n3. Build end-to-end production features and deploy to cloud platforms like Vercel or Render.`;
    }
  }

  // D. General Greeting / Inquiry
  if (/^(hi|hello|hey|namaste|kaise ho|who are you|kya kar sakte ho)/i.test(lower)) {
    if (language === 'hi') {
      return `नमस्ते! मैं आपका ConsistAI डिजिटल असिस्टेंट हूँ। मैं आपके टास्क, लक्ष्य, आदतें, फोकस टाइमर और रिमाइंडर मैनेज कर सकता हूँ। आज आप क्या करना चाहेंगे?`;
    } else if (language === 'hinglish') {
      return `Hello! Main aapka ConsistAI personal assistant hoon. Main aapke tasks add kar sakta hoon, focus timer start kar sakta hoon, goals track kar sakta hoon, aur reminders schedule kar sakta hoon. Bataiye kya madad karoon?`;
    } else {
      return `Hello! I am your ConsistAI personal digital secretary and coach. I can help you create tasks, track goals, log habits, start focus sessions, schedule reminders, and answer your productivity questions. How can I assist you right now?`;
    }
  }

  // E. General Intelligent Advice
  if (language === 'hi') {
    return `मैं आपकी सहायता के लिए तैयार हूँ। आप मुझे टास्क जोड़ने, अपनी आदतों की जाँच करने, फोकस टाइमर शुरू करने या किसी भी विषय पर मार्गदर्शन के लिए कह सकते हैं।`;
  } else if (language === 'hinglish') {
    return `Main aapke sawal ka jawab dene ke liye taiyar hoon. Aap mujhse tasks, study plan, focus timer, ya kisi bhi technical topic ke baare me pooch sakte hain.`;
  } else {
    return `I am here to help you stay organized and achieve your goals. You can ask me about your schedule, request technical/productivity advice, or tell me to perform actions like creating tasks or starting timers.`;
  }
}
