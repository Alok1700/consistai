import axios from 'axios';
import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import WorkSession from '../models/WorkSession.js';
import ScreenTimeRecord from '../models/ScreenTimeRecord.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import MLAnalysisRun from '../models/MLAnalysisRun.js';
import ollamaService from './ai/ollamaService.js';

/**
 * ConsistAI Intelligent AI Engine
 * Supports external LLM providers (Google Gemini / OpenAI) when configured in .env,
 * with a high-fidelity local heuristic expert fallback when no API key is provided.
 */

// 1. Natural Language Goal Planner
export const generateGoalPlan = async ({
  goalDescription,
  targetDate,
  experienceLevel = 'intermediate',
  dailyHours = 2,
  preferredDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  restDays = ['Sun'],
  desiredOutcome = ''
}) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const target = new Date(targetDate);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const totalDays = Math.max(7, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const availableWorkDays = Math.round((totalDays / 7) * preferredDays.length);
  const totalAvailableHours = Math.round(availableWorkDays * dailyHours);

  // 1. Primary: Local Ollama Planning Engine (skipped during fast unit tests unless TEST_LIVE_OLLAMA is set)
  if (process.env.NODE_ENV !== 'test' || process.env.TEST_LIVE_OLLAMA === 'true') {
    try {
      const prompt = `You are the ConsistAI Academic Goal Planning Assistant.
Create a structured roadmap for a student/professional with:
- Goal Description: "${goalDescription}"
- Target Timeline: ${totalDays} days (Available work days: ${availableWorkDays}, Daily hours: ${dailyHours}h, Total available hours: ${totalAvailableHours}h)
- Experience Level: ${experienceLevel}
- Preferred Days: ${preferredDays.join(', ')}
- Rest Days: ${restDays.join(', ')}
- Desired Outcome: "${desiredOutcome || 'Master the subject with measurable milestone targets'}"

Respond ONLY with valid JSON (no markdown formatting, no code fencing, pure JSON) adhering to this schema:
{
  "title": "string (concise goal title)",
  "category": "DSA & Coding" | "System Design" | "Web Development" | "Academics" | "Placement Prep" | "General Skill",
  "measurementUnit": "Problems" | "Chapters" | "Modules" | "Projects" | "Hours",
  "targetQuantity": number,
  "feasibilityAssessment": {
    "isRealistic": boolean,
    "estimatedTotalHours": number,
    "availableTotalHours": ${totalAvailableHours},
    "feasibilityNotes": "string explanation",
    "potentialRisks": ["string risk 1", "string risk 2"]
  },
  "milestones": [
    { "title": "string", "order": 1, "weight": 20, "targetQuantity": 30, "description": "string" },
    { "title": "string", "order": 2, "weight": 25, "targetQuantity": 35, "description": "string" },
    { "title": "string", "order": 3, "weight": 25, "targetQuantity": 35, "description": "string" },
    { "title": "string", "order": 4, "weight": 30, "targetQuantity": 40, "description": "string" }
  ],
  "weeklyObjectives": [
    { "weekNumber": 1, "objective": "string", "focusTopics": ["string"] }
  ],
  "suggestedTasks": [
    { "title": "string", "taskType": "daily" | "weekly" | "monthly", "priority": "high" | "medium" | "urgent", "estimatedMinutes": 45, "dayOffset": 1 }
  ],
  "suggestedHabits": [
    { "title": "string", "frequency": "weekdays" | "daily", "targetDaysPerWeek": 5, "timeOfDay": "morning" | "afternoon" | "evening" }
  ]
}`;

    const ollamaRes = await ollamaService.chat({
      messages: [{ role: 'user', content: prompt }],
      format: 'json',
      temperature: 0.2
    });

    if (ollamaRes.success && ollamaRes.content) {
      const parsed = JSON.parse(ollamaRes.content);
      if (parsed.title && Array.isArray(parsed.milestones)) {
        return { ...parsed, provider: 'ollama' };
      }
    }
  } catch (err) {
    console.warn('[AI Service] Ollama goal plan generation fallback:', err.message);
  }
  }

  // Local Rule-Based Expert Planning Fallback
  return generateDeterministicGoalPlan({
    goalDescription,
    targetDate,
    totalDays,
    availableWorkDays,
    dailyHours,
    totalAvailableHours,
    experienceLevel,
    preferredDays,
    restDays,
    desiredOutcome
  });
};

// Deterministic heuristic goal planner (Grounded fallback)
function generateDeterministicGoalPlan({
  goalDescription,
  targetDate,
  totalDays,
  availableWorkDays,
  dailyHours,
  totalAvailableHours,
  experienceLevel,
  preferredDays,
  restDays,
  desiredOutcome
}) {
  const lower = goalDescription.toLowerCase();
  let category = 'Academics';
  let unit = 'Modules';
  let targetQty = 50;
  let milestones = [];
  let weeklyObjectives = [];
  let suggestedTasks = [];
  let suggestedHabits = [];
  let estimatedHours = Math.round(availableWorkDays * dailyHours * 0.85);

  if (lower.includes('dsa') || lower.includes('algorithm') || lower.includes('leetcode') || lower.includes('coding')) {
    category = 'DSA & Coding';
    unit = 'Problems';
    targetQty = lower.includes('200') ? 200 : (lower.includes('100') ? 100 : 150);
    milestones = [
      { title: 'Arrays, Two-Pointers & Sliding Window', order: 1, weight: 20, targetQuantity: Math.round(targetQty * 0.2), description: 'Core linear data structures and two-pointer traversal optimization' },
      { title: 'Linked Lists, Stacks & Queues', order: 2, weight: 20, targetQuantity: Math.round(targetQty * 0.2), description: 'Pointer manipulation, monotonicity, and recursion fundamentals' },
      { title: 'Binary Trees, BSTs & Graph Traversals (BFS/DFS)', order: 3, weight: 30, targetQuantity: Math.round(targetQty * 0.3), description: 'Tree properties, DAGs, cycle detection, and topological sorting' },
      { title: 'Dynamic Programming & Memoization', order: 4, weight: 30, targetQuantity: Math.round(targetQty * 0.3), description: 'Optimal substructure, tabulation, and 0/1 knapsack variants' }
    ];
    suggestedTasks = [
      { title: 'Solve 3 Medium Two-Pointer Problems on LeetCode', taskType: 'daily', priority: 'high', estimatedMinutes: 60, dayOffset: 1 },
      { title: 'Review Linked List Cycle Detection (Floyd Cycle Algorithm)', taskType: 'daily', priority: 'medium', estimatedMinutes: 45, dayOffset: 2 },
      { title: 'Weekly Timed Mock Contest & Speed Benchmark', taskType: 'weekly', priority: 'urgent', estimatedMinutes: 90, dayOffset: 6 }
    ];
    suggestedHabits = [
      { title: 'Daily Algorithm Practice (45m)', frequency: 'daily', targetDaysPerWeek: 7, timeOfDay: 'morning' },
      { title: 'Review Solution Approaches & Write Editorial Notes', frequency: 'weekdays', targetDaysPerWeek: 5, timeOfDay: 'evening' }
    ];
  } else if (lower.includes('mern') || lower.includes('web') || lower.includes('react') || lower.includes('full stack')) {
    category = 'Web Development';
    unit = 'Projects & Modules';
    targetQty = 12;
    milestones = [
      { title: 'Node.js & Express.js REST API with MongoDB & Mongoose', order: 1, weight: 25, targetQuantity: 3, description: 'Authentication, middleware, schema design, and error handlers' },
      { title: 'React 18+, TypeScript & Tailwind CSS Component Architecture', order: 2, weight: 25, targetQuantity: 3, description: 'State management, custom hooks, and responsive UX' },
      { title: 'Full Stack Integration with TanStack Query & Secure Cookies', order: 3, weight: 25, targetQuantity: 3, description: 'Cache invalidation, optimistic updates, and JWT security' },
      { title: 'Production Deployment, CI/CD & Automated Testing', order: 4, weight: 25, targetQuantity: 3, description: 'Docker containerization, unit testing, and live hosting' }
    ];
    suggestedTasks = [
      { title: 'Implement JWT Auth Controller with HttpOnly Cookies', taskType: 'daily', priority: 'high', estimatedMinutes: 60, dayOffset: 1 },
      { title: 'Design Database Schemas and Indexing Strategy', taskType: 'daily', priority: 'medium', estimatedMinutes: 45, dayOffset: 2 },
      { title: 'Weekly Full-Stack Code Review & Refactoring Sprint', taskType: 'weekly', priority: 'urgent', estimatedMinutes: 90, dayOffset: 7 }
    ];
    suggestedHabits = [
      { title: 'Build Full-Stack Code Modules', frequency: 'weekdays', targetDaysPerWeek: 5, timeOfDay: 'afternoon' },
      { title: 'Read Technical Docs & Architecture Articles', frequency: 'weekdays', targetDaysPerWeek: 4, timeOfDay: 'evening' }
    ];
  } else if (lower.includes('placement') || lower.includes('interview') || lower.includes('job')) {
    category = 'Placement Prep';
    unit = 'Topics & Assessments';
    targetQty = 40;
    milestones = [
      { title: 'Core DSA & Problem Solving Foundation', order: 1, weight: 35, targetQuantity: 15, description: 'Top 100 interview questions on LeetCode' },
      { title: 'CS Core Fundamentals (OS, DBMS, CN, OOPS)', order: 2, weight: 25, targetQuantity: 10, description: 'Operating Systems threads/locks, SQL queries, TCP/IP, Design Patterns' },
      { title: 'System Design & High-Level Architecture Basics', order: 3, weight: 20, targetQuantity: 8, description: 'Caching, CDNs, load balancing, sharding, and rate limiters' },
      { title: 'Mock Technical Interviews & Behavioral Prep', order: 4, weight: 20, targetQuantity: 7, description: 'STAR format answers, resume walk-through, live coding mocks' }
    ];
    suggestedTasks = [
      { title: 'Practice 2 Medium Trees / Graph Problems', taskType: 'daily', priority: 'high', estimatedMinutes: 50, dayOffset: 1 },
      { title: 'Revise DBMS SQL Joins & Normalization Notes', taskType: 'daily', priority: 'medium', estimatedMinutes: 40, dayOffset: 2 },
      { title: 'Conduct Peer Technical Mock Interview', taskType: 'weekly', priority: 'urgent', estimatedMinutes: 60, dayOffset: 7 }
    ];
    suggestedHabits = [
      { title: 'Placement Preparation Study Block', frequency: 'daily', targetDaysPerWeek: 6, timeOfDay: 'morning' },
      { title: 'Revise CS Fundamentals Flashcards', frequency: 'weekdays', targetDaysPerWeek: 5, timeOfDay: 'evening' }
    ];
  } else {
    milestones = [
      { title: 'Phase 1: Foundation & Core Principles', order: 1, weight: 25, targetQuantity: Math.round(targetQty * 0.25), description: 'Fundamental concepts, setup, and key literature' },
      { title: 'Phase 2: Structured Practice & Skill Building', order: 2, weight: 25, targetQuantity: Math.round(targetQty * 0.25), description: 'Applied exercises, problem sets, and guided drills' },
      { title: 'Phase 3: Advanced Implementation & Synthesis', order: 3, weight: 25, targetQuantity: Math.round(targetQty * 0.25), description: 'Complex modules, comprehensive reviews, and projects' },
      { title: 'Phase 4: Final Evaluation, Polish & Mastery', order: 4, weight: 25, targetQuantity: Math.round(targetQty * 0.25), description: 'Mock tests, performance audits, and synthesis' }
    ];
    suggestedTasks = [
      { title: 'Complete Chapter 1 Exercises & Document Notes', taskType: 'daily', priority: 'high', estimatedMinutes: 45, dayOffset: 1 },
      { title: 'Deep Work Session on Core Topic Fundamentals', taskType: 'daily', priority: 'medium', estimatedMinutes: 60, dayOffset: 2 },
      { title: 'Weekly Milestone Progress Review', taskType: 'weekly', priority: 'high', estimatedMinutes: 45, dayOffset: 7 }
    ];
    suggestedHabits = [
      { title: 'Focused Study Routine (45m)', frequency: 'weekdays', targetDaysPerWeek: 5, timeOfDay: 'morning' },
      { title: 'Daily Reflection & Planning', frequency: 'daily', targetDaysPerWeek: 7, timeOfDay: 'evening' }
    ];
  }

  const isRealistic = totalAvailableHours >= estimatedHours * 0.8;

  return {
    title: goalDescription.length > 50 ? goalDescription.slice(0, 47) + '...' : goalDescription,
    category,
    measurementUnit: unit,
    targetQuantity: targetQty,
    feasibilityAssessment: {
      isRealistic,
      estimatedTotalHours: estimatedHours,
      availableTotalHours: totalAvailableHours,
      feasibilityNotes: isRealistic
        ? `Feasible: Your planned commitment (${totalAvailableHours} available hours across ${totalDays} days) safely covers the estimated requirement (~${estimatedHours} hours).`
        : `Tight Schedule: You need approximately ${estimatedHours} focused hours, but have only ~${totalAvailableHours} available hours based on ${dailyHours}h/day. Consider dedicating +30m more per day or extending deadline by 2 weeks.`,
      potentialRisks: [
        'Frequent task switching between multiple subtopics reduces retention.',
        'High distracting screen time during morning hours can compromise consistency.'
      ]
    },
    milestones,
    weeklyObjectives: [
      { weekNumber: 1, objective: 'Build active momentum and solidify core terminology', focusTopics: [milestones[0]?.title || 'Foundation'] },
      { weekNumber: 2, objective: 'Advance through 50% of first major milestone', focusTopics: [milestones[0]?.title || 'Practice'] },
      { weekNumber: Math.max(3, Math.round(totalDays / 14)), objective: 'Transition into intermediate and combined application', focusTopics: [milestones[1]?.title || 'Intermediate'] }
    ],
    suggestedTasks,
    suggestedHabits,
    provider: 'local_expert'
  };
}

// 2. AI Plan Adjustment ("Adjust My Plan")
export const generatePlanAdjustment = async ({ goalId, userId }) => {
  const goal = await Goal.findOne({ _id: goalId, user: userId }).populate('milestones');
  if (!goal) throw new Error('Goal not found');

  const milestones = await Milestone.find({ goal: goalId }).sort({ order: 1 });
  const pendingMilestones = milestones.filter(m => !m.isCompleted);
  const completedMilestones = milestones.filter(m => m.isCompleted);

  const now = new Date();
  const targetDate = new Date(goal.targetDate);
  const remainingDays = Math.max(1, Math.ceil((targetDate - now) / (1000 * 60 * 60 * 24)));

  const overdueTasks = await Task.find({
    user: userId,
    goal: goalId,
    status: { $ne: 'completed' },
    dueDate: { $lt: now }
  });

  const adjustment = {
    goalTitle: goal.title,
    currentProgressPct: goal.currentProgressPercentage,
    completedMilestonesCount: completedMilestones.length,
    remainingMilestonesCount: pendingMilestones.length,
    overdueTasksCount: overdueTasks.length,
    remainingDays,
    proposal: {
      action: remainingDays < 14 && pendingMilestones.length > 2 ? 'recommend_deadline_extension' : 'rebalance_milestones',
      suggestedNewTargetDate: remainingDays < 14 && pendingMilestones.length > 2
        ? new Date(now.getTime() + (pendingMilestones.length * 10 * 86400000)).toISOString().slice(0, 10)
        : goal.targetDate.toISOString().slice(0, 10),
      redistributedMilestones: pendingMilestones.map((m, idx) => ({
        _id: m._id,
        title: m.title,
        currentWeight: m.weight,
        suggestedWeight: Math.round(100 / (pendingMilestones.length || 1)),
        suggestedTargetDate: new Date(now.getTime() + ((idx + 1) * Math.max(5, Math.floor(remainingDays / pendingMilestones.length)) * 86400000)).toISOString().slice(0, 10)
      })),
      recommendedDailyWorkloadMinutes: Math.min(180, Math.max(45, Math.round((pendingMilestones.length * 20 * 60) / remainingDays))),
      rescheduledOverdueTasks: overdueTasks.slice(0, 5).map((t, i) => ({
        _id: t._id,
        title: t.title,
        oldDueDate: t.dueDate,
        newDueDate: new Date(now.getTime() + (i + 1) * 86400000).toISOString().slice(0, 10)
      })),
      justification: `Preserving your ${completedMilestones.length} completed milestone achievements (${goal.currentProgressPercentage}% progress). Rebalancing remaining ${pendingMilestones.length} milestones across ${remainingDays} days to eliminate schedule stress without compromising outcome quality.`
    }
  };

  return adjustment;
};

// 3. Conversational AI Progress Coach
export const chatWithProgressCoach = async ({ userId, message, history = [] }) => {
  // Aggregate factual context from MongoDB
  const [goals, tasksToday, habits, recentSessions, screenRecord, latestML] = await Promise.all([
    Goal.find({ user: userId, status: 'active' }).populate('milestones'),
    Task.find({
      user: userId,
      dueDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    Habit.find({ user: userId, active: true }),
    WorkSession.find({ user: userId }).sort({ date: -1 }).limit(7),
    ScreenTimeRecord.findOne({ user: userId }).sort({ date: -1 }),
    MLAnalysisRun.findOne({ user: userId }).sort({ runDate: -1 })
  ]);

  const primaryGoal = goals[0] || null;
  const primaryPacing = primaryGoal?.pacing;
  const totalFocusHoursLast7Days = Math.round(recentSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60);
  const completedTasksToday = tasksToday.filter(t => t.status === 'completed').length;

  const contextSummary = {
    primaryGoal: primaryGoal ? {
      title: primaryGoal.title,
      progressPct: primaryGoal.currentProgressPercentage,
      pacingGap: primaryPacing?.progress_gap_pct ?? (primaryGoal.currentProgressPercentage - 50),
      pacingStatus: primaryPacing?.pacing_status ?? 'on_pace'
    } : null,
    todayExecution: {
      tasksPlanned: tasksToday.length,
      tasksCompleted: completedTasksToday,
      activeHabitsCount: habits.length
    },
    weeklyWorkHours: totalFocusHoursLast7Days,
    distractingScreenMinutesLatest: screenRecord?.distractingMinutes || 0,
    hasMLAnalysis: !!latestML,
    mlClusters: latestML?.clusterResults?.optimal_k || null,
    mlAnomaliesCount: latestML?.anomalyResults?.anomaly_count || 0
  };

  // 1. Primary: Local Ollama Coach
  if (process.env.NODE_ENV !== 'test' || process.env.TEST_LIVE_OLLAMA === 'true') {
    try {
      const systemPrompt = `You are ConsistAI Academic Progress Coach.
Analyze the student's question strictly using their verified system context.
Never invent metrics, never claim future forecasting, and never claim causal proof.

User Context:
${JSON.stringify(contextSummary, null, 2)}

User Question: "${message}"

Respond strictly in valid JSON (no markdown formatting, pure JSON) adhering to this schema:
{
  "situationSummary": "concise objective summary of where user stands based on data",
  "supportingEvidence": "exact metrics supporting the finding (e.g. 42% progress, 55% elapsed duration, -13% pacing gap)",
  "possibleExplanation": "probable workflow pattern observed in the data",
  "practicalRecommendation": "specific, realistic adjustment to try",
  "suggestedAction": {
    "label": "string button label (e.g., 'Start 45m Focus Session', 'View Tasks')",
    "route": "/timer" | "/tasks" | "/calendar" | "/experiments" | "/goals"
  }
}`;

      const ollamaRes = await ollamaService.chat({
        messages: [{ role: 'user', content: systemPrompt }],
        format: 'json',
        temperature: 0.2
      });

      if (ollamaRes.success && ollamaRes.content) {
        const parsed = JSON.parse(ollamaRes.content);
        if (parsed.situationSummary) {
          return { ...parsed, provider: 'ollama' };
        }
      }
    } catch (err) {
      console.warn('[AI Coach] Ollama coach error, falling back to local coach:', err.message);
    }
  }

  // Deterministic Grounded Coach
  return generateDeterministicCoachResponse({ message, contextSummary });
};

function generateDeterministicCoachResponse({ message, contextSummary }) {
  const lower = message.toLowerCase();
  const goal = contextSummary.primaryGoal;

  if (lower.includes('progress') || lower.includes('goal') || lower.includes('behind')) {
    if (goal) {
      const gap = goal.pacingGap;
      const isBehind = gap < -5;
      return {
        situationSummary: `You are currently tracking "${goal.title}" at ${goal.progressPct}% recorded milestone completion.`,
        supportingEvidence: `Current actual progress is ${goal.progressPct}%. Your pacing indicator is ${gap > 0 ? '+' + gap : gap} percentage points relative to elapsed timeline.`,
        possibleExplanation: isBehind
          ? 'Historical logs indicate that days with frequent task switching had lower recorded problem completions than single-topic focus blocks.'
          : 'Your consistent daily habit streaks are keeping your milestone velocity steady.',
        practicalRecommendation: isBehind
          ? 'Try dedicating one uninterrupted 45-minute focus session strictly to your current milestone before switching to ad-hoc tasks.'
          : 'Maintain your current pace; your milestone execution aligns with your target schedule.',
        suggestedAction: {
          label: isBehind ? 'Start 45m Focus Session' : 'View Goal Milestones',
          route: isBehind ? '/timer' : '/goals'
        },
        provider: 'local_expert'
      };
    }
  }

  if (lower.includes('today') || lower.includes('priorit') || lower.includes('work on')) {
    return {
      situationSummary: `Today you have ${contextSummary.todayExecution.tasksPlanned} tasks planned with ${contextSummary.todayExecution.tasksCompleted} completed so far.`,
      supportingEvidence: `${contextSummary.todayExecution.activeHabitsCount} active scheduled habits are enrolled in your routine.`,
      possibleExplanation: 'Prioritizing goal-relevant tasks early in your day prevents late-day task postponement.',
      practicalRecommendation: 'Complete your highest priority goal-linked task before opening messaging apps or browsing social media.',
      suggestedAction: {
        label: 'Open Tasks List',
        route: '/tasks'
      },
      provider: 'local_expert'
    };
  }

  if (lower.includes('habit') || lower.includes('routine')) {
    return {
      situationSummary: `You have ${contextSummary.todayExecution.activeHabitsCount} active scheduled habits configured.`,
      supportingEvidence: `Logged ${contextSummary.weeklyWorkHours} focused hours over the past 7 days.`,
      possibleExplanation: 'Habits scheduled for specific times of day (morning vs evening) consistently achieve higher weekly adherence.',
      practicalRecommendation: 'Keep habit check-ins linked to specific anchors (e.g. "Practice DSA right after morning breakfast").',
      suggestedAction: {
        label: 'View Habit Tracker',
        route: '/habits'
      },
      provider: 'local_expert'
    };
  }

  // Default general coaching
  return {
    situationSummary: goal
      ? `Tracking "${goal.title}" at ${goal.progressPct}% progress with ${contextSummary.weeklyWorkHours} hours focused this week.`
      : 'Your daily activity logs are active and synchronizing with your consistency calendar.',
    supportingEvidence: `Recent logged focus time: ${contextSummary.weeklyWorkHours} hours. Screen time: ${contextSummary.distractingScreenMinutesLatest}m distracting usage.`,
    possibleExplanation: 'Analysis of your activity logs shows that consistency is driven by predictable daily start times rather than long sporadic hours.',
    practicalRecommendation: 'Keep daily sessions consistent (45–60 minutes per session) and test small workflow adjustments using 14-day experiments.',
    suggestedAction: {
      label: 'Explore ML Insights',
      route: '/insights'
    },
    provider: 'local_expert'
  };
}

// 4. Quick Capture Natural Language Parser
export const parseQuickCaptureTask = async ({ text, userGoals = [] }) => {
  const lower = text.toLowerCase();
  let title = text.trim();
  let estimatedMinutes = 45;
  let priority = 'medium';
  let matchedGoalId = null;

  // Extract duration if present: "for 30 minutes", "45 mins", "1 hour", "90m"
  const minMatch = lower.match(/(\d+)\s*(?:mins?|minutes?|m\b)/);
  const hourMatch = lower.match(/(\d+)\s*(?:hours?|hrs?|h\b)/);
  if (minMatch) {
    estimatedMinutes = parseInt(minMatch[1], 10);
  } else if (hourMatch) {
    estimatedMinutes = parseInt(hourMatch[1], 10) * 60;
  }

  // Extract priority
  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) {
    priority = 'urgent';
  } else if (lower.includes('important') || lower.includes('high priority')) {
    priority = 'high';
  } else if (lower.includes('low priority') || lower.includes('someday')) {
    priority = 'low';
  }

  // Match goal
  for (const g of userGoals) {
    const gTitle = g.title.toLowerCase();
    if (lower.includes(gTitle) || (g.category && lower.includes(g.category.toLowerCase()))) {
      matchedGoalId = g._id;
      break;
    }
  }

  return {
    title,
    priority,
    estimatedMinutes,
    goalId: matchedGoalId
  };
};

// 5. Intelligent Milestone Syllabus Generator (Exactly N Modules)
export const generateAIMilestones = async ({
  goalTitle,
  count = 10,
  category = 'DSA & Coding',
  experienceLevel = 'intermediate'
}) => {
  const numModules = Math.min(100, Math.max(1, Number(count || 10)));

  // 1. Primary: Local Ollama Curriculum Generation
  if (process.env.NODE_ENV !== 'test' || process.env.TEST_LIVE_OLLAMA === 'true') {
    try {
      const prompt = `You are the ConsistAI Curriculum Architect.
Generate an exact curriculum of exactly ${numModules} sequential learning modules for this goal:
Goal Title: "${goalTitle}"
Category: "${category}"
Experience Level: "${experienceLevel}"

Respond ONLY with valid JSON array containing exactly ${numModules} objects. No markdown, no code block backticks.
Schema:
[
  {
    "order": 1,
    "sequenceNumber": 1,
    "title": "Module 01: [Topic Title]",
    "description": "Concise summary of learning objectives and target outcomes",
    "estimatedEffort": "4-6 hours",
    "subtasks": ["Subtask 1", "Subtask 2", "Subtask 3"],
    "resources": [
      { "title": "Reference Guide", "url": "https://developer.mozilla.org", "resourceType": "documentation" }
    ]
  }
]`;

      const ollamaRes = await ollamaService.chat({
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        temperature: 0.3
      });

      if (ollamaRes.success && ollamaRes.content) {
        const cleaned = ollamaRes.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, numModules).map((m, idx) => ({
            ...m,
            order: idx + 1,
            sequenceNumber: idx + 1,
            title: m.title?.startsWith('Module') ? m.title : `Module ${String(idx + 1).padStart(2, '0')}: ${m.title || 'Core Practice'}`
          }));
        }
      }
    } catch (e) {
      console.warn('[AI Service] Ollama generateAIMilestones fallback to heuristic generator:', e.message);
    }
  }

  // Heuristic Curriculum Generators based on Domain / Subject
  const dsaTopics = [
    { title: 'Time & Space Complexity and Big-O Analysis', effort: '3h', subtasks: ['Analyze loop complexities', 'Space overhead of recursion'] },
    { title: 'Arrays & Two-Pointer Patterns', effort: '5h', subtasks: ['Opposite-end pointers', 'Slow and fast pointer', 'Container with most water'] },
    { title: 'Sliding Window & Substring Problems', effort: '5h', subtasks: ['Fixed window size max sum', 'Dynamic window min subarray'] },
    { title: 'Prefix Sums & Frequency Maps', effort: '4h', subtasks: ['Subarray sum equals K', 'Range sum queries'] },
    { title: 'Hashing & Hash Table Collisions', effort: '4h', subtasks: ['Group anagrams', 'Two sum optimization', 'Custom hash functions'] },
    { title: 'String Manipulation & Pattern Searching', effort: '4h', subtasks: ['Palindrome validation', 'String rotation and matching'] },
    { title: 'Linked Lists (Singly & Doubly)', effort: '5h', subtasks: ['Reverse linked list', 'Detect cycle (Floyd cycle detection)', 'Merge sorted lists'] },
    { title: 'Stacks & Monotonic Stack Variations', effort: '5h', subtasks: ['Valid parentheses', 'Next greater element', 'Daily temperatures'] },
    { title: 'Queues & Circular Buffers', effort: '4h', subtasks: ['Implement queue using stacks', 'Sliding window maximum'] },
    { title: 'Recursion Fundamentals & Call Stacks', effort: '5h', subtasks: ['Recursive factorial and fibonacci', 'Call stack memory visualization'] },
    { title: 'Binary Search & Search Space Reduction', effort: '6h', subtasks: ['Rotated sorted array search', 'Find minimum in rotated array', 'Matrix binary search'] },
    { title: 'Binary Trees & Traversals (DFS/BFS)', effort: '6h', subtasks: ['Inorder/Preorder/Postorder traversals', 'Level-order traversal BFS'] },
    { title: 'Binary Search Trees & Validation', effort: '5h', subtasks: ['Validate BST properties', 'LCA in BST', 'Inorder successor'] },
    { title: 'Tree Diameters & Path Sums', effort: '6h', subtasks: ['Max path sum', 'Diameter of binary tree', 'Path sum II'] },
    { title: 'Priority Queues & Heaps (Min/Max)', effort: '5h', subtasks: ['Kth largest element', 'Merge K sorted lists', 'Median of data stream'] },
    { title: 'Backtracking & Permutations', effort: '6h', subtasks: ['Generate parentheses', 'Subsets and combinations', 'N-Queens problem'] },
    { title: 'Graph Representations & BFS/DFS', effort: '6h', subtasks: ['Adjacency list vs matrix', 'Connected components', 'Clone graph'] },
    { title: 'Topological Sort & Cycle Detection', effort: '6h', subtasks: ['Course Schedule I & II', 'Kahn algorithm vs DFS'] },
    { title: 'Shortest Path Algorithms (Dijkstra, Bellman-Ford)', effort: '7h', subtasks: ['Network delay time', 'Dijkstra with priority queue'] },
    { title: 'Disjoint Set Union (Union-Find)', effort: '5h', subtasks: ['Path compression & rank', 'Redundant connection'] },
    { title: '1D Dynamic Programming Foundations', effort: '7h', subtasks: ['Climbing stairs', 'House robber', 'Coin change'] },
    { title: 'Longest Increasing Subsequence & Variants', effort: '6h', subtasks: ['LIS in O(N^2) and O(N log N)', 'Russian doll envelopes'] },
    { title: '2D Dynamic Programming (Grid Paths)', effort: '7h', subtasks: ['Unique paths I & II', 'Minimum path sum in grid'] },
    { title: '0/1 Knapsack & Partition Subsets', effort: '7h', subtasks: ['Partition equal subset sum', 'Target sum'] },
    { title: 'String DP (Longest Common Subsequence & Edit Distance)', effort: '8h', subtasks: ['LCS memoization & tabulation', 'Edit distance Levenshtein'] },
    { title: 'Greedy Algorithms & Interval Scheduling', effort: '5h', subtasks: ['Meeting rooms II', 'Non-overlapping intervals', 'Gas station'] },
    { title: 'Bit Manipulation & XOR Tricks', effort: '4h', subtasks: ['Single number', 'Counting bits', 'Bitwise AND of numbers range'] },
    { title: 'Trie (Prefix Tree) Implementations', effort: '5h', subtasks: ['Implement Trie', 'Word search II prefix lookup'] },
    { title: 'Segment Trees & Fenwick Trees (Binary Indexed Tree)', effort: '8h', subtasks: ['Range sum query mutable', 'Point update & range query'] },
    { title: 'Comprehensive Mock Interview & Timed Contest Assessment', effort: '8h', subtasks: ['Simulated LeetCode contest', 'Full writeup & post-mortem analysis'] }
  ];

  const webDevTopics = [
    { title: 'HTML5 Semantic Structure & Modern Accessibility', effort: '4h', subtasks: ['Semantic landmarks', 'WCAG color & screen reader tags'] },
    { title: 'Modern CSS Layouts (Flexbox, Grid & Subgrid)', effort: '5h', subtasks: ['Responsive hero layouts', 'Holy grail grid layout'] },
    { title: 'CSS Architecture (Tailwind CSS, Variables & Responsive Design)', effort: '5h', subtasks: ['Dark mode theming', 'Mobile-first breakpoint system'] },
    { title: 'JavaScript ES6+ Deep Dive (Closures, Prototypes & Event Loop)', effort: '6h', subtasks: ['Microtask vs macrotask execution', 'Lexical scoping'] },
    { title: 'Asynchronous JavaScript (Promises, Async/Await & Fetch)', effort: '6h', subtasks: ['Concurrent Promise.allSettled', 'Error handling pipelines'] },
    { title: 'DOM Manipulation, Browser Events & Storage APIs', effort: '5h', subtasks: ['Event delegation', 'LocalStorage vs IndexedDB storage'] },
    { title: 'TypeScript Fundamentals & Strong Typing', effort: '6h', subtasks: ['Interfaces vs types', 'Generics and utility types'] },
    { title: 'React Core Principles & JSX Rendering Pipeline', effort: '6h', subtasks: ['Virtual DOM reconciliation', 'Component tree composition'] },
    { title: 'React State Management & Standard Hooks', effort: '6h', subtasks: ['useState & useEffect pitfalls', 'useCallback & useMemo caching'] },
    { title: 'Advanced React (useReducer, Context & Custom Hooks)', effort: '6h', subtasks: ['Complex state machines', 'Encapsulated domain hooks'] },
    { title: 'Client-Side Routing & Navigation Architecture', effort: '5h', subtasks: ['Protected nested route guards', 'Dynamic query parameter state'] },
    { title: 'Frontend Performance & Code Splitting', effort: '5h', subtasks: ['React.lazy & Suspense', 'Bundle analysis & tree-shaking'] },
    { title: 'Node.js Runtime & Event-Driven Architecture', effort: '6h', subtasks: ['Event loop phases', 'Streams and Buffer processing'] },
    { title: 'Express.js Framework & Middleware Design Patterns', effort: '6h', subtasks: ['Custom logging & rate-limiters', 'Centralized error handler'] },
    { title: 'RESTful API Design & Validation Schemas', effort: '6h', subtasks: ['HTTP status codes', 'Zod / Joi payload validation'] },
    { title: 'MongoDB Data Modeling & Mongoose Schemas', effort: '7h', subtasks: ['Embedding vs referencing', 'Compound indexing strategy'] },
    { title: 'Mongoose Aggregation Pipelines & Complex Queries', effort: '7h', subtasks: ['Match, group, unwind phases', 'Facet multi-stage analytics'] },
    { title: 'Authentication, Authorization & JWT Token Rotations', effort: '7h', subtasks: ['Access vs refresh tokens', 'HttpOnly cookie guards'] },
    { title: 'Password Security & Rate Limiting', effort: '5h', subtasks: ['Bcrypt hashing salt rounds', 'Redis IP rate-limiting middleware'] },
    { title: 'Full-Stack Integration (Client-Server Data Binding)', effort: '7h', subtasks: ['Axios interceptors for token refresh', 'Optimistic UI updates'] },
    { title: 'File Uploads & Media Storage Integration', effort: '5h', subtasks: ['Multer multipart/form-data', 'Cloud storage upload signed URLs'] },
    { title: 'WebSockets & Real-Time Communication', effort: '6h', subtasks: ['Socket.IO server rooms', 'Bi-directional live updates'] },
    { title: 'Automated Testing: Unit & Integration (Jest / Vitest)', effort: '6h', subtasks: ['React component unit tests', 'Supertest API route tests'] },
    { title: 'End-to-End Testing (Playwright / Cypress)', effort: '6h', subtasks: ['Authentication e2e workflow', 'Form submission verification'] },
    { title: 'Docker Containerization & Multi-Stage Builds', effort: '6h', subtasks: ['Dockerfile for Node & Vite', 'Docker Compose multi-service'] },
    { title: 'CI/CD Pipelines (GitHub Actions Automation)', effort: '6h', subtasks: ['Automated lint & test runners', 'Continuous delivery deployment'] },
    { title: 'Cloud Deployment (Vercel, Render & Managed DBs)', effort: '5h', subtasks: ['Environment variable security', 'Production domain SSL setup'] },
    { title: 'Web Security Hardening (CORS, CSP, Helmet & XSS Prevention)', effort: '5h', subtasks: ['Security response headers', 'Input sanitization against injection'] },
    { title: 'Observability, Logging & Error Monitoring (Sentry / Winston)', effort: '5h', subtasks: ['Structured JSON logging', 'Error capture & alert triggers'] },
    { title: 'Final Capstone Project Polish, Documentation & Portfolio Showcase', effort: '8h', subtasks: ['Architecture documentation', 'Live demo recording & README'] }
  ];

  let topicCatalog = dsaTopics;
  if (category.toLowerCase().includes('web') || category.toLowerCase().includes('front') || category.toLowerCase().includes('stack')) {
    topicCatalog = webDevTopics;
  }

  const generated = [];
  for (let i = 1; i <= numModules; i++) {
    const topic = topicCatalog[(i - 1) % topicCatalog.length];
    const moduleNumStr = String(i).padStart(2, '0');
    generated.push({
      order: i,
      sequenceNumber: i,
      title: `Module ${moduleNumStr}: ${topic.title}`,
      description: `Structured study of ${topic.title} tailored for ${goalTitle}. Covers core fundamentals, implementation patterns, and hands-on exercises.`,
      estimatedEffort: topic.effort,
      subtasks: topic.subtasks,
      resources: [
        {
          title: `${topic.title} Study Guide`,
          url: 'https://developer.mozilla.org',
          resourceType: 'documentation'
        }
      ]
    });
  }

  return generated;
};

// 5b. Intelligent Milestone Modules Breakdown Generator (Returns List of Formatted Module Titles)
export const generateMilestoneModules = async ({
  goalId,
  goalTitle,
  milestoneTitle,
  description = '',
  count = 8,
  category
}) => {
  const numModules = Math.min(50, Math.max(1, Number(count || 8)));

  let resolvedGoalTitle = goalTitle || '';
  let resolvedCategory = category || '';

  if (goalId && (!resolvedGoalTitle || !resolvedCategory)) {
    try {
      const g = await Goal.findById(goalId).select('title category');
      if (g) {
        if (!resolvedGoalTitle) resolvedGoalTitle = g.title;
        if (!resolvedCategory) resolvedCategory = g.category;
      }
    } catch (_) {}
  }

  // 1. Primary: Local Ollama Generation (skipped during fast unit tests unless TEST_LIVE_OLLAMA is set)
  if (process.env.NODE_ENV !== 'test' || process.env.TEST_LIVE_OLLAMA === 'true') {
    try {
      const prompt = `You are an expert curriculum architect and personal productivity coach.
Generate an ordered list of exactly ${numModules} sequential learning or practice modules for this milestone.

Context:
- Overarching Goal: "${resolvedGoalTitle || 'Personal Mastery'}"
- Category: "${resolvedCategory || 'Skill Mastery'}"
- Milestone Title: "${milestoneTitle}"
${description ? `- Milestone Context/Description: "${description}"` : ''}

Rules:
1. Provide exactly ${numModules} actionable module topics that build logically from initial foundations to advanced mastery.
2. Keep each module name clean, concise, and focused (e.g., "Module 01: [Topic Title]").
3. Respond ONLY with valid JSON. Do not include markdown formatting or backticks.
Schema:
{
  "modules": [
    "Module 01: Core Topic Name",
    "Module 02: Next Topic Name"
  ]
}`;

      const ollamaRes = await ollamaService.chat({
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        temperature: 0.2,
        think: false
      });

      if (ollamaRes.success && ollamaRes.content) {
        const cleaned = ollamaRes.content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        let extractedModules = [];
        if (Array.isArray(parsed)) {
          extractedModules = parsed;
        } else if (Array.isArray(parsed.modules)) {
          extractedModules = parsed.modules;
        }

        if (extractedModules.length > 0) {
          return extractedModules.slice(0, numModules).map((item, idx) => {
            const rawTitle = typeof item === 'string' ? item.trim() : (item.title || item.name || `Topic ${idx + 1}`);
            const padded = String(idx + 1).padStart(2, '0');
            if (/^Module\s+\d+[:\-]/i.test(rawTitle)) {
              return rawTitle.replace(/^Module\s+\d+[:\-]\s*/i, `Module ${padded}: `);
            }
            return `Module ${padded}: ${rawTitle}`;
          });
        }
      }
    } catch (err) {
      console.warn('[AI Service] Ollama generateMilestoneModules fallback:', err.message);
    }
  }

  // 2. Deterministic Fallback Generator
  return generateDeterministicModules({
    milestoneTitle,
    goalTitle: resolvedGoalTitle,
    category: resolvedCategory,
    count: numModules
  });
};

export const generateDeterministicModules = ({
  milestoneTitle = '',
  goalTitle = '',
  category = '',
  count = 8
}) => {
  const numModules = Math.min(50, Math.max(1, Number(count || 8)));
  const query = `${milestoneTitle} ${goalTitle} ${category}`.toLowerCase();

  let pool = null;

  if (query.includes('binary search') || query.includes('search space')) {
    pool = [
      'Binary Search Foundations & Discrete Predicates',
      'Monotonic Conditions & Invariant Maintenance',
      'Rotated Sorted Array Searches & Pivots',
      'Binary Search on Answer Space (Allocation Problems)',
      'Find Peak Element & Matrix Binary Search',
      'Two-Pointer Alternatives vs Binary Search Tradeoffs',
      'Advanced Edge Cases: Duplicates & Bounds Checking',
      'Mock LeetCode Timed Binary Search Contest'
    ];
  } else if (query.includes('dynamic programming') || query.includes(' dp')) {
    pool = [
      '1D DP: State Formulation, Memoization vs Tabulation',
      'Classic Subproblem Transitions: Climbing Stairs & Robber',
      'Coin Change & Unbounded Knapsack Optimization',
      '0/1 Knapsack & Subset Sum Partition Variations',
      'Longest Increasing Subsequence & Patience Sorting',
      '2D Grid DP & Matrix Minimum Cost Paths',
      'String DP: Longest Common Subsequence & Edit Distance',
      'State Machine DP & Space-Optimized Rolling Arrays'
    ];
  } else if (query.includes('tree') || query.includes('graph') || query.includes('bfs') || query.includes('dfs')) {
    pool = [
      'Tree Traversals: Preorder, Inorder, Postorder & Level-Order BFS',
      'Binary Search Tree (BST) Validation & Search Mechanics',
      'Lowest Common Ancestor & Tree Diameter Calculations',
      'Graph Representations: Adjacency List & Matrix',
      'Topological Sort & Kahn’s Cycle Detection Algorithm',
      'Shortest Paths: Dijkstra Algorithm with Min-Heap',
      'Disjoint Set Union (Union-Find) with Rank & Compression',
      'Minimum Spanning Tree & Graph Island Traversal Exercises'
    ];
  } else if (query.includes('array') || query.includes('string') || query.includes('two pointer') || query.includes('sliding window')) {
    pool = [
      'Two-Pointer Patterns: Opposite Ends & Fast/Slow',
      'Sliding Window: Fixed Size vs Dynamic Window Minimum',
      'Prefix Sums & Frequency Hash Maps',
      'Subarray Sum Equals K & Hash Table Lookups',
      'Monotonic Stack: Next Greater Element & Daily Temperatures',
      'Interval Merging & Collision Detection',
      'String Manipulation & Palindrome Decompositions',
      'In-Place Array Partitioning & Memory Optimization'
    ];
  } else if (query.includes('react') || query.includes('frontend') || query.includes('ui')) {
    pool = [
      'Component Architecture & Declarative JSX Best Practices',
      'State Management: useState, useReducer & Immutability',
      'Side Effects: useEffect Lifecycles & Race Conditions',
      'Custom Hooks: Encapsulating Reusable Domain Logic',
      'Context API & Global State Optimization',
      'Client-Side Routing & Protected Route Guards',
      'Frontend Performance: useMemo, useCallback & Code Splitting',
      'Automated UI Testing & Component Quality Assurance'
    ];
  } else if (query.includes('node') || query.includes('backend') || query.includes('api') || query.includes('express')) {
    pool = [
      'RESTful API Principles & Resource Endpoint Architecture',
      'Express Middleware Pipeline & Error Handling Boundaries',
      'Mongoose Data Modeling, Schema Validation & Indexing',
      'Authentication: JWT Access/Refresh Cycles & Password Salting',
      'Database Aggregations & Query Performance Profiling',
      'Security Hardening: CORS, Helmet & Input Sanitization',
      'Automated API Testing with Jest & Supertest',
      'Production Deployment, Logging & Health Observability'
    ];
  } else if (query.includes('system design') || query.includes('architecture') || query.includes('scalable')) {
    pool = [
      'High-Level Architecture & Functional/Non-Functional Scoping',
      'Load Balancing & Stateless Web Tier Scaling',
      'Caching Strategies: Redis, Memcached & Eviction Policies',
      'Database Sharding, Replication & CAP Theorem Tradeoffs',
      'Message Queues & Asynchronous Worker Pipelines',
      'Rate Limiting & DDoS Prevention Mechanisms',
      'Content Delivery Networks (CDNs) & Edge Caching',
      'Disaster Recovery, Monitoring & Observability Dashboards'
    ];
  }

  const results = [];
  for (let i = 1; i <= numModules; i++) {
    const padded = String(i).padStart(2, '0');
    let title = '';
    if (pool && pool[i - 1]) {
      title = pool[i - 1];
    } else if (pool) {
      title = `${pool[(i - 1) % pool.length]} (Part ${Math.floor((i - 1) / pool.length) + 1})`;
    } else {
      const genericTemplates = [
        `Foundations & Core Principles of ${milestoneTitle || 'the Topic'}`,
        `Fundamental Architecture & Setup`,
        `Core Implementation Patterns & Practical Mechanics`,
        `Handling Edge Cases & Defensive Execution`,
        `Performance Optimization & Algorithmic Efficiency`,
        `Integration & End-to-End Hands-On Exercises`,
        `Comprehensive Review, Code Quality & Testing`,
        `Final Synthesis & Real-World Application Project`
      ];
      if (i <= genericTemplates.length) {
        title = genericTemplates[i - 1];
      } else {
        title = `Advanced Deep Dive & Extended Mastery (Session ${i - genericTemplates.length})`;
      }
    }
    results.push(`Module ${padded}: ${title}`);
  }

  return results;
};

// 6. Context-Aware Goal AI Assistant
export const generateGoalAssistance = async ({ goalId, userId, question }) => {
  const goal = await Goal.findOne({ _id: goalId, user: userId }).populate('linkedHabits');
  if (!goal) throw new Error('Goal not found');

  const milestones = await Milestone.find({ goal: goal._id }).sort({ order: 1 });
  const tasks = await Task.find({ goal: goal._id }).sort({ dueDate: 1 });

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.isCompleted || m.status === 'completed').length;
  const inProgressMilestones = milestones.filter(m => m.status === 'in_progress').length;
  const currentMilestone = milestones.find(m => !m.isCompleted && m.status !== 'completed');

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;

  const totalDays = Math.max(1, Math.round((new Date(goal.targetDate) - new Date(goal.startDate)) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.round((new Date() - new Date(goal.startDate)) / (1000 * 60 * 60 * 24)));
  const elapsedPct = Number(Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100)).toFixed(1));
  const progressGap = Number((goal.currentProgressPercentage - elapsedPct).toFixed(1));

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    try {
      const prompt = `You are ConsistAI's Personal Goal Achievement Coach.
User's Question: "${question}"
Goal Profile:
- Goal: "${goal.title}" (${goal.category})
- Progress: ${goal.currentProgressPercentage}% (Target: 100% by ${new Date(goal.targetDate).toLocaleDateString()})
- Milestones: ${completedMilestones} completed, ${inProgressMilestones} in progress, ${totalMilestones - completedMilestones} remaining out of ${totalMilestones} total.
- Current Active Milestone: "${currentMilestone ? currentMilestone.title : 'All milestones completed'}"
- Pacing Gap: ${progressGap}% (${progressGap >= 0 ? 'On pace / Ahead' : 'Behind schedule by ' + Math.abs(progressGap) + '%'})
- Linked Tasks: ${completedTasks} completed, ${pendingTasks} pending.

Provide a structured, encouraging, highly specific response (3-4 concise paragraphs) advising the user on what action to take next, how to manage pacing, and study tactics for their current milestone.`;

      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 }
        },
        { timeout: 12000 }
      );

      const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return {
          answer: reply,
          provider: 'gemini',
          stats: {
            progressPct: goal.currentProgressPercentage,
            completedMilestones,
            totalMilestones,
            currentMilestoneTitle: currentMilestone?.title || 'None',
            progressGap
          }
        };
      }
    } catch (e) {
      console.warn('Gemini generateGoalAssistance fallback to heuristic:', e.message);
    }
  }

  // Fallback heuristic response
  let pacingAdvice = '';
  if (progressGap >= 5) {
    pacingAdvice = `You are currently +${progressGap}% ahead of your target schedule! Your velocity is excellent. You can use this buffer to tackle deeper, challenging problems or build a solid capstone project.`;
  } else if (progressGap >= -5) {
    pacingAdvice = `You are precisely on pace (${progressGap >= 0 ? '+' : ''}${progressGap}% gap). Continuing your daily cadence will deliver 100% completion right on time.`;
  } else {
    pacingAdvice = `You have a pacing deficit of ${Math.abs(progressGap)}%. To catch up without burnout, add 30 minutes to your daily focus sessions or prioritize the upcoming milestone's primary tasks.`;
  }

  const currentFocus = currentMilestone
    ? `Your immediate next objective is "${currentMilestone.title}". Focus on finishing its subtasks before branching into other topics.`
    : 'All your planned milestones are completed! Time to celebrate or create your next advanced goal.';

  const answer = `### Progress Evaluation for "${goal.title}"

You have completed **${completedMilestones} of ${totalMilestones} milestones** (${goal.currentProgressPercentage}% overall progress).

**Pacing Analysis:** ${pacingAdvice}

**Immediate Recommendation:** ${currentFocus} You have ${pendingTasks} pending tasks linked to this roadmap. Allocate a dedicated 45-minute focus session today to maintain momentum.`;

  return {
    answer,
    provider: 'local_expert',
    stats: {
      progressPct: goal.currentProgressPercentage,
      completedMilestones,
      totalMilestones,
      currentMilestoneTitle: currentMilestone?.title || 'None',
      progressGap
    }
  };
};
