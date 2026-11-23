import Goal from '../models/Goal.js';
import Milestone from '../models/Milestone.js';
import GoalMilestone from '../models/GoalMilestone.js';
import GoalModule from '../models/GoalModule.js';
import Habit from '../models/Habit.js';
import HabitCheckIn from '../models/HabitCheckIn.js';
import Task from '../models/Task.js';
import WorkSession from '../models/WorkSession.js';
import ScreenTimeRecord from '../models/ScreenTimeRecord.js';
import DailyAnalytics from '../models/DailyAnalytics.js';
import GoalProgressEvent from '../models/GoalProgressEvent.js';
import MLAnalysisRun from '../models/MLAnalysisRun.js';
import WorkflowRecommendation from '../models/WorkflowRecommendation.js';
import WorkflowExperiment from '../models/WorkflowExperiment.js';
import Todo from '../models/Todo.js';
import Achievement from '../models/Achievement.js';
import { mlClient } from '../services/mlClient.js';

export const seedDemoUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. Clean existing records for this user to make demonstration pristine
    await Promise.all([
      Goal.deleteMany({ user: userId }),
      Milestone.deleteMany({ user: userId }),
      GoalMilestone.deleteMany({ user: userId }),
      GoalModule.deleteMany({ user: userId }),
      Habit.deleteMany({ user: userId }),
      HabitCheckIn.deleteMany({ user: userId }),
      Task.deleteMany({ user: userId }),
      WorkSession.deleteMany({ user: userId }),
      ScreenTimeRecord.deleteMany({ user: userId }),
      DailyAnalytics.deleteMany({ user: userId }),
      GoalProgressEvent.deleteMany({ user: userId }),
      MLAnalysisRun.deleteMany({ user: userId }),
      WorkflowRecommendation.deleteMany({ user: userId }),
      WorkflowExperiment.deleteMany({ user: userId }),
      Achievement.deleteMany({ user: userId }),
      Todo.deleteMany({ user: userId })
    ]);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 60);
    const targetDate = new Date();
    targetDate.setDate(startDate.getDate() + 90);

    // 2. Create Primary Goal: Complete 200 DSA Problems
    const dsaGoal = await Goal.create({
      user: userId,
      title: 'Complete 200 DSA Problems',
      description: 'Master core Data Structures and Algorithms for technical interviews and competitive programming.',
      category: 'DSA & Coding',
      startDate,
      targetDate,
      priority: 'urgent',
      targetOutcome: 'Solve 200 medium/hard LeetCode problems across 6 core topics',
      measurementUnit: 'Problems',
      progressType: 'milestone_based',
      targetQuantity: 200,
      achievedQuantity: 88,
      currentProgressPercentage: 44.0,
      isPrimaryGoal: true,
      imageUrl: 'https://images.unsplash.com/photo-1516116211227-bbc86bd7a4fa?w=800&auto=format&fit=crop&q=60',
      yearlyTargets: [
        { target: 'Solve 350+ LeetCode problems (50 Hard)', targetDate: new Date(new Date().getFullYear(), 11, 31), isAchieved: false },
        { target: 'Attain Knight rating (1850+) on LeetCode Contests', targetDate: new Date(new Date().getFullYear(), 11, 31), isAchieved: false },
        { target: 'Clear 3 Product-Based Company Technical Interviews', targetDate: new Date(new Date().getFullYear(), 11, 31), isAchieved: true }
      ],
      status: 'active'
    });

    // 3. Milestones according to Master Prompt specification
    const ms1Title = 'Arrays & Sliding Window';
    const ms1Doc = await GoalMilestone.create({
      goal: dsaGoal._id,
      user: userId,
      title: ms1Title,
      description: 'Arrays, Two-Pointers, and Sliding Window algorithmic patterns',
      order: 1,
      sequenceNumber: 1,
      weight: 1.5,
      moduleCount: 30,
      completedModuleCount: 14,
      progressPercentage: 47,
      status: 'in_progress'
    });

    const ms1ModuleTitles = [
      'Module 01: Two Sum & Hash Lookup',
      'Module 02: Prefix Sum Basics',
      'Module 03: Subarray Sum Equals K',
      'Module 04: Two Pointers: Sorted Pair',
      'Module 05: Container With Most Water',
      'Module 06: Three Sum Triplets',
      'Module 07: Kadane Maximum Subarray',
      'Module 08: Best Time to Buy & Sell Stock',
      'Module 09: Sliding Window Maximum',
      'Module 10: Longest Substring Without Repeats',
      'Module 11: Minimum Window Substring',
      'Module 12: Permutation in String',
      'Module 13: Find All Anagrams in a String',
      'Module 14: Fruit Into Baskets',
      'Module 15: Longest Repeating Character Replacement',
      'Module 16: Subarrays with K Different Integers',
      'Module 17: Sliding Window Median',
      'Module 18: Maximum Sum of Distinct Subarrays With Length K',
      'Module 19: Maximum Points You Can Obtain from Cards',
      'Module 20: Count Number of Nice Subarrays',
      'Module 21: Replace the Substring for Balanced String',
      'Module 22: Max Consecutive Ones III',
      'Module 23: Binary Subarrays With Sum',
      'Module 24: Subarray Product Less Than K',
      'Module 25: Minimum Size Subarray Sum',
      'Module 26: Grumpy Bookstore Owner',
      'Module 27: Get Equal Substrings Within Budget',
      'Module 28: Frequency of the Most Frequent Element',
      'Module 29: Maximum Erasure Value',
      'Module 30: Take K of Each Character From Left and Right'
    ];

    const ms1Modules = ms1ModuleTitles.map((t, idx) => ({
      goal: dsaGoal._id,
      milestone: ms1Doc._id,
      user: userId,
      title: t,
      order: idx + 1,
      isCompleted: idx < 14,
      status: idx < 14 ? 'completed' : 'not_started',
      completedAt: idx < 14 ? new Date(startDate.getTime() + idx * 86400000) : null,
      estimatedMinutes: 45
    }));
    await GoalModule.insertMany(ms1Modules);

    // Milestone 2: Linked Lists (20 modules)
    const ms2Doc = await GoalMilestone.create({
      goal: dsaGoal._id,
      user: userId,
      title: 'Linked Lists & Two Pointers',
      description: 'Singly, Doubly, and Fast & Slow pointers',
      order: 2,
      sequenceNumber: 2,
      weight: 1.0,
      moduleCount: 20,
      completedModuleCount: 8,
      progressPercentage: 40,
      status: 'in_progress'
    });
    const ms2Modules = [];
    for (let i = 1; i <= 20; i++) {
      ms2Modules.push({
        goal: dsaGoal._id,
        milestone: ms2Doc._id,
        user: userId,
        title: `Module ${String(i).padStart(2, '0')}: Linked List Pattern ${i}`,
        order: i,
        isCompleted: i <= 8,
        status: i <= 8 ? 'completed' : 'not_started',
        completedAt: i <= 8 ? new Date() : null,
        estimatedMinutes: 45
      });
    }
    await GoalModule.insertMany(ms2Modules);

    // Milestone 3: Trees & Graphs (40 modules)
    const ms3Doc = await GoalMilestone.create({
      goal: dsaGoal._id,
      user: userId,
      title: 'Trees & Graphs Hierarchical Structures',
      description: 'Binary Trees, BST, DFS, BFS, and Dijkstra',
      order: 3,
      sequenceNumber: 3,
      weight: 1.5,
      moduleCount: 40,
      completedModuleCount: 0,
      progressPercentage: 0,
      status: 'not_started'
    });
    const ms3Modules = [];
    for (let i = 1; i <= 40; i++) {
      ms3Modules.push({
        goal: dsaGoal._id,
        milestone: ms3Doc._id,
        user: userId,
        title: `Module ${String(i).padStart(2, '0')}: Tree & Graph Pattern ${i}`,
        order: i,
        isCompleted: false,
        status: 'not_started',
        estimatedMinutes: 45
      });
    }
    await GoalModule.insertMany(ms3Modules);

    // Milestone 4: Dynamic Programming (50 modules)
    const ms4Doc = await GoalMilestone.create({
      goal: dsaGoal._id,
      user: userId,
      title: 'Dynamic Programming & Optimization',
      description: '1D/2D DP, Knapsack, and String alignments',
      order: 4,
      sequenceNumber: 4,
      weight: 2.0,
      moduleCount: 50,
      completedModuleCount: 0,
      progressPercentage: 0,
      status: 'not_started'
    });
    const ms4Modules = [];
    for (let i = 1; i <= 50; i++) {
      ms4Modules.push({
        goal: dsaGoal._id,
        milestone: ms4Doc._id,
        user: userId,
        title: `Module ${String(i).padStart(2, '0')}: DP Pattern ${i}`,
        order: i,
        isCompleted: false,
        status: 'not_started',
        estimatedMinutes: 45
      });
    }
    await GoalModule.insertMany(ms4Modules);

    const milestoneSpecs = [
      { title: 'Arrays & Two Pointers', weight: 20.0, targetQuantity: 40, achievedQuantity: 40, isCompleted: true, progressPercentage: 100 },
      { title: 'Strings & HashMaps', weight: 15.0, targetQuantity: 30, achievedQuantity: 30, isCompleted: true, progressPercentage: 100 },
      { title: 'Linked Lists & Stacks', weight: 15.0, targetQuantity: 30, achievedQuantity: 18, isCompleted: false, progressPercentage: 60 },
      { title: 'Trees & BST', weight: 20.0, targetQuantity: 40, achievedQuantity: 0, isCompleted: false, progressPercentage: 0 },
      { title: 'Graphs & BFS/DFS', weight: 15.0, targetQuantity: 30, achievedQuantity: 0, isCompleted: false, progressPercentage: 0 },
      { title: 'Dynamic Programming', weight: 15.0, targetQuantity: 30, achievedQuantity: 0, isCompleted: false, progressPercentage: 0 }
    ];

    const milestones = await Milestone.insertMany(
      milestoneSpecs.map((m, idx) => ({
        goal: dsaGoal._id,
        user: userId,
        title: m.title,
        order: idx + 1,
        weight: m.weight,
        targetQuantity: m.targetQuantity,
        achievedQuantity: m.achievedQuantity,
        progressPercentage: m.progressPercentage,
        isCompleted: m.isCompleted,
        completedAt: m.isCompleted ? new Date(startDate.getTime() + (idx * 15 * 86400000)) : null
      }))
    );

    // Seed Initial Achievements for Primary Goal
    await Achievement.insertMany([
      {
        user: userId,
        goal: dsaGoal._id,
        achievementType: 'first_task_completed',
        title: 'First Action Taken',
        description: 'Completed your first problem on Arrays & Strings. Journey started!',
        icon: 'CheckCircle2',
        tier: 'bronze',
        earnedAt: new Date(startDate.getTime() + 2 * 86400000),
        celebrated: true
      },
      {
        user: userId,
        goal: dsaGoal._id,
        milestone: milestones[0]._id,
        achievementType: 'first_milestone_completed',
        title: 'Roadmap Breakthrough',
        description: 'Successfully conquered Milestone 1: Arrays & Strings Foundation!',
        icon: 'Flag',
        tier: 'silver',
        earnedAt: new Date(startDate.getTime() + 15 * 86400000),
        celebrated: true
      },
      {
        user: userId,
        goal: dsaGoal._id,
        achievementType: 'progress_25',
        title: 'Quarterway Mark (25%)',
        description: 'Achieved 25% verified completion across all milestones!',
        icon: 'TrendingUp',
        tier: 'bronze',
        earnedAt: new Date(startDate.getTime() + 30 * 86400000),
        celebrated: true
      }
    ]);

    // 4. Create Secondary Goal: Full-Stack Portfolio System
    const webGoal = await Goal.create({
      user: userId,
      title: 'Full-Stack Portfolio Project (MERN + ML)',
      description: 'Architect and deploy an intelligent production web application with real machine learning microservices.',
      category: 'Web Development',
      startDate,
      targetDate,
      priority: 'high',
      targetOutcome: 'Deploy production system with comprehensive documentation and unit tests',
      measurementUnit: 'Modules',
      progressType: 'numerical',
      targetQuantity: 10,
      achievedQuantity: 6,
      currentProgressPercentage: 60.0,
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60',
      yearlyTargets: [
        { target: 'Deploy 3 Full-Stack SaaS Apps on Production Cloud', targetDate: new Date(new Date().getFullYear(), 11, 31), isAchieved: true },
        { target: 'Earn AWS Certified Developer Associate Certification', targetDate: new Date(new Date().getFullYear(), 11, 31), isAchieved: false }
      ],
      status: 'active'
    });

    // 5. Create Habits
    const habitsData = [
      {
        title: 'Practice DSA Problems',
        category: 'DSA & Coding',
        frequency: 'daily',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        timeOfDay: 'morning',
        targetDaysPerWeek: 7,
        currentStreak: 6,
        longestStreak: 18
      },
      {
        title: 'Study System Design & Architecture',
        category: 'Technical Reading',
        frequency: 'weekdays',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timeOfDay: 'afternoon',
        targetDaysPerWeek: 5,
        currentStreak: 3,
        longestStreak: 12
      },
      {
        title: 'Review Tech Documentation',
        category: 'Technical Reading',
        frequency: 'weekdays',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        timeOfDay: 'afternoon',
        targetDaysPerWeek: 5,
        currentStreak: 4,
        longestStreak: 14
      },
      {
        title: 'Morning Physical Exercise',
        category: 'Physical Exercise',
        frequency: 'custom',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        timeOfDay: 'morning',
        targetDaysPerWeek: 6,
        currentStreak: 5,
        longestStreak: 21
      },
      {
        title: 'Daily Reflection & Planning',
        category: 'Review & Reflection',
        frequency: 'daily',
        daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        timeOfDay: 'evening',
        targetDaysPerWeek: 7,
        currentStreak: 11,
        longestStreak: 30
      }
    ];

    const habits = await Habit.insertMany(
      habitsData.map(h => ({
        ...h,
        user: userId,
        linkedGoals: [dsaGoal._id, webGoal._id]
      }))
    );

    // Link habits to goal
    await Goal.findByIdAndUpdate(dsaGoal._id, { linkedHabits: habits.map(h => h._id) });

    // 6. Fetch 60-day synthetic dataset from ML microservice (or internal generator)
    let syntheticData = [];
    try {
      const mlSynth = await mlClient.getSyntheticData(60, userId.toString(), dsaGoal._id.toString());
      syntheticData = mlSynth.data || [];
    } catch (e) {
      console.warn('Fallback to local synthetic generation:', e.message);
    }

    // 7. Seed DailyAnalytics, ScreenTimeRecord, WorkSession, and Progress Events
    for (let i = 0; i < syntheticData.length; i++) {
      const row = syntheticData[i];
      const d = row.date;

      // Daily analytics document
      await DailyAnalytics.create({
        user: userId,
        date: d,
        plannedTasks: row.planned_tasks,
        completedTasks: row.completed_tasks,
        goalRelevantCompletedTasks: row.goal_relevant_tasks_completed,
        taskCompletionRate: row.task_completion_rate,
        scheduledHabits: row.scheduled_habits,
        completedHabits: row.completed_habits,
        habitAdherenceRate: row.habit_adherence_rate,
        completedHabitNames: row.completed_habit_names,
        totalWorkMinutes: row.focused_work_minutes,
        goalWorkMinutes: row.goal_specific_work_minutes,
        totalScreenMinutes: row.total_screen_time_minutes,
        distractingScreenMinutes: row.distracting_screen_time_minutes,
        productiveScreenMinutes: row.productive_screen_time_minutes,
        goalProgressDelta: row.actual_goal_progress_delta,
        milestonesCompletedCount: row.milestones_completed_count,
        consistencyScore: row.consistency_score,
        isHolidayOrRestDay: row.is_holiday_or_rest_day,
        restDayNote: row.rest_day_note
      });

      // Screen time document
      await ScreenTimeRecord.create({
        user: userId,
        date: d,
        totalMinutes: row.total_screen_time_minutes,
        productiveMinutes: row.productive_screen_time_minutes,
        distractingMinutes: row.distracting_screen_time_minutes,
        neutralMinutes: Math.max(0, row.total_screen_time_minutes - row.productive_screen_time_minutes - row.distracting_screen_time_minutes),
        appUsage: [
          { appName: 'VS Code', category: 'Development', minutes: Math.round(row.productive_screen_time_minutes * 0.6), isDistracting: false },
          { appName: 'LeetCode / GitHub', category: 'Learning', minutes: Math.round(row.productive_screen_time_minutes * 0.4), isDistracting: false },
          { appName: 'Instagram', category: 'Social Media', minutes: Math.round(row.distracting_screen_time_minutes * 0.5), isDistracting: true },
          { appName: 'YouTube Shorts', category: 'Entertainment', minutes: Math.round(row.distracting_screen_time_minutes * 0.5), isDistracting: true }
        ],
        source: 'manual_entry'
      });

      // Work session document if work was logged
      if (row.focused_work_minutes > 0) {
        await WorkSession.create({
          user: userId,
          goal: dsaGoal._id,
          category: 'Deep Coding',
          startTime: new Date(`${d}T10:00:00.000Z`),
          endTime: new Date(new Date(`${d}T10:00:00.000Z`).getTime() + (row.focused_work_minutes * 60000)),
          durationMinutes: row.focused_work_minutes,
          sessionType: 'timer',
          date: d,
          notes: `Focused problem solving on ${dsaGoal.title}`
        });
      }

      // Goal progress event if progress occurred
      if (row.actual_goal_progress_delta > 0) {
        await GoalProgressEvent.create({
          user: userId,
          goal: dsaGoal._id,
          date: d,
          previousProgress: Math.max(0, row.cumulative_goal_progress - row.actual_goal_progress_delta),
          newProgress: row.cumulative_goal_progress,
          progressDelta: row.actual_goal_progress_delta,
          eventType: row.milestones_completed_count > 0 ? 'milestone_completed' : 'milestone_advanced',
          notes: `Advanced milestone exercises (+${row.actual_goal_progress_delta}%)`
        });
      }

      // Habit check-ins for the day
      if (row.completed_habit_names && row.completed_habit_names.length > 0) {
        for (const hName of row.completed_habit_names) {
          const matchHabit = habits.find(h => h.title === hName);
          if (matchHabit) {
            await HabitCheckIn.create({
              user: userId,
              habit: matchHabit._id,
              date: d,
              completed: true
            });
          }
        }
      }

      // Historical tasks matching planned and completed numbers
      const plannedCount = row.planned_tasks || 0;
      const completedCount = row.completed_tasks || 0;
      if (plannedCount > 0) {
        const taskTemplates = [
          { title: 'Implement Breadth-First Search on Binary Tree', cat: 'dsa', est: 45, prio: 'high' },
          { title: 'Solve LeetCode #102: Binary Tree Level Order Traversal', cat: 'dsa', est: 40, prio: 'high' },
          { title: 'Review Graph Cycle Detection (Tarjan & Kosaraju Algorithm)', cat: 'dsa', est: 55, prio: 'urgent' },
          { title: 'Read System Design Chapter: Distributed Caching with Redis', cat: 'web', est: 45, prio: 'medium' },
          { title: 'Draft Engineering Notes on B-Trees & LSM Trees for DB Storage', cat: 'general', est: 35, prio: 'medium' },
          { title: 'Solve Two Sum & 3-Sum Optimal Pointer Approaches', cat: 'dsa', est: 30, prio: 'high' },
          { title: 'Implement Dynamic Programming 0/1 Knapsack & Memoization', cat: 'dsa', est: 60, prio: 'urgent' },
          { title: 'Build JWT Authentication Middleware & Cookie Handler', cat: 'web', est: 50, prio: 'high' }
        ];

        const dayTasks = [];
        for (let i = 0; i < plannedCount; i++) {
          const isDone = i < completedCount;
          const template = taskTemplates[(i + d.charCodeAt(d.length - 1)) % taskTemplates.length];
          const dueDateTime = new Date(`${d}T10:00:00.000Z`);
          dueDateTime.setMinutes(i * 15);
          dayTasks.push({
            user: userId,
            goal: template.cat === 'dsa' ? dsaGoal._id : webGoal._id,
            title: template.title,
            priority: template.prio,
            taskType: i % 5 === 0 ? 'weekly' : (i % 8 === 0 ? 'monthly' : 'daily'),
            dueDate: dueDateTime,
            estimatedMinutes: template.est,
            actualMinutes: isDone ? template.est : null,
            status: isDone ? 'completed' : 'pending',
            isGoalRelevant: true,
            onTime: isDone
          });
        }
        await Task.insertMany(dayTasks);
      }
    }

    // 8. Create a few current Tasks
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    await Task.insertMany([
      {
        user: userId,
        goal: dsaGoal._id,
        linkedMilestone: milestones[2]._id, // Linked list
        title: 'Implement LRU Cache using Doubly Linked List & HashMap',
        priority: 'high',
        taskType: 'daily',
        dueDate: now,
        estimatedMinutes: 60,
        actualMinutes: 45,
        status: 'completed',
        isGoalRelevant: true,
        onTime: true
      },
      {
        user: userId,
        goal: dsaGoal._id,
        linkedMilestone: milestones[2]._id,
        title: 'Solve Reverse Nodes in k-Group (Hard)',
        priority: 'urgent',
        taskType: 'daily',
        dueDate: now,
        estimatedMinutes: 75,
        actualMinutes: 0,
        status: 'pending',
        isGoalRelevant: true,
        onTime: true
      },
      {
        user: userId,
        goal: webGoal._id,
        title: 'Deploy FastAPI ML Microservice on Docker & Validate Endpoints',
        priority: 'high',
        taskType: 'weekly',
        dueDate: tomorrow,
        estimatedMinutes: 90,
        actualMinutes: 0,
        status: 'in_progress',
        isGoalRelevant: true,
        onTime: true
      },
      {
        user: userId,
        goal: dsaGoal._id,
        title: 'Weekly LeetCode Biweekly Contest and Performance Analysis',
        priority: 'high',
        taskType: 'weekly',
        dueDate: tomorrow,
        estimatedMinutes: 90,
        actualMinutes: 90,
        status: 'completed',
        isGoalRelevant: true,
        onTime: true
      },
      {
        user: userId,
        goal: dsaGoal._id,
        title: 'Monthly Dynamic Programming Comprehensive Sprint (30 Problems)',
        priority: 'urgent',
        taskType: 'monthly',
        dueDate: new Date(Date.now() + 20 * 86400000),
        estimatedMinutes: 180,
        actualMinutes: 60,
        status: 'in_progress',
        isGoalRelevant: true,
        onTime: true
      },
      {
        user: userId,
        goal: dsaGoal._id,
        title: 'Achieve 200+ Solved Problems Target with 90% Clean Submissions',
        priority: 'high',
        taskType: 'yearly',
        dueDate: new Date(new Date().getFullYear(), 11, 31),
        estimatedMinutes: 300,
        actualMinutes: 120,
        status: 'in_progress',
        isGoalRelevant: true,
        onTime: true
      },
      {
        user: userId,
        title: 'Read Google SRE Book Chapter 4: Service Level Objectives',
        priority: 'medium',
        taskType: 'monthly',
        dueDate: now,
        estimatedMinutes: 30,
        actualMinutes: 30,
        status: 'completed',
        isGoalRelevant: false,
        onTime: true
      }
    ]);

    // 9. Run full ML Pipeline on the newly seeded records to generate clusters, anomalies, associations, and recommendations
    const allAnalytics = await DailyAnalytics.find({ user: userId }).sort({ date: 1 });
    const formattedRecords = allAnalytics.map(r => ({
      date: r.date,
      planned_tasks: r.plannedTasks,
      completed_tasks: r.completedTasks,
      goal_relevant_tasks_completed: r.goalRelevantCompletedTasks,
      task_completion_rate: r.taskCompletionRate,
      scheduled_habits: r.scheduledHabits,
      completed_habits: r.completedHabits,
      habit_adherence_rate: r.habitAdherenceRate,
      completed_habit_names: r.completedHabitNames || [],
      focused_work_minutes: r.totalWorkMinutes,
      goal_specific_work_minutes: r.goalWorkMinutes,
      total_screen_time_minutes: r.totalScreenMinutes,
      distracting_screen_time_minutes: r.distractingScreenMinutes,
      productive_screen_time_minutes: r.productiveScreenMinutes,
      actual_goal_progress_delta: r.goalProgressDelta,
      milestones_completed_count: r.milestonesCompletedCount,
      consistency_score: r.consistencyScore,
      is_holiday_or_rest_day: r.isHolidayOrRestDay,
      rest_day_note: r.restDayNote
    }));

    const [clusterRes, anomalyRes, assocRes, corrRes, recRes] = await Promise.all([
      mlClient.runClusters(formattedRecords),
      mlClient.runAnomalies(formattedRecords, 0.1),
      mlClient.runAssociations(formattedRecords, 0.12, 0.45, 1.05),
      mlClient.runCorrelations(formattedRecords),
      mlClient.runRecommendations(formattedRecords, -6.0, dsaGoal.title)
    ]);

    const run = await MLAnalysisRun.create({
      user: userId,
      runDate: new Date(),
      dataPointsCount: allAnalytics.length,
      status: 'completed',
      clusterResults: clusterRes,
      anomalyResults: anomalyRes,
      associationRules: assocRes,
      correlationMetrics: corrRes,
      goalPacing: {
        activeGoalTitle: dsaGoal.title,
        pacingGap: -6.0,
        activeGoalId: dsaGoal._id
      }
    });

    const savedRecommendations = [];
    if (recRes.recommendations && recRes.recommendations.length > 0) {
      for (const rec of recRes.recommendations) {
        const savedRec = await WorkflowRecommendation.create({
          user: userId,
          runId: run._id,
          recommendationKey: rec.id,
          title: rec.title,
          category: rec.category,
          priority: rec.priority,
          observedIssue: rec.observed_issue,
          supportingData: rec.supporting_data,
          suggestedChange: rec.suggested_change,
          expectedBenefitHypothesis: rec.expected_benefit_hypothesis,
          confidenceLevel: rec.confidence_level,
          dataLimitationNote: rec.data_limitation_note,
          suggestedExperimentDays: rec.suggested_experiment_days,
          suggestedTargetBehavior: rec.suggested_target_behavior,
          linkedGoal: dsaGoal._id
        });
        savedRecommendations.push(savedRec);
      }
    }

    // 10. Seed an active Workflow Experiment with real before/after comparison
    const expStartDate = new Date();
    expStartDate.setDate(now.getDate() - 7);
    const expEndDate = new Date();
    expEndDate.setDate(expStartDate.getDate() + 14);

    const demoExperiment = await WorkflowExperiment.create({
      user: userId,
      title: 'Practice DSA for 45 Minutes Before Checking Social Media',
      hypothesis: 'Hypothesis: Delaying entertainment app usage until the primary study block is finished reduces context fragmentation and increases daily completed problem count.',
      targetBehavior: 'No phone or social media during morning 45-minute DSA problem solving block.',
      linkedRecommendation: savedRecommendations[0]?._id || null,
      linkedGoal: dsaGoal._id,
      durationDays: 14,
      startDate: expStartDate,
      endDate: expEndDate,
      status: 'active',
      baselineMetrics: {
        avgGoalProgressDaily: 0.85,
        avgFocusMinutes: 95,
        avgTaskCompletionRate: 0.65,
        avgDistractingMinutes: 135,
        avgHabitAdherence: 0.58
      },
      experimentMetrics: {
        avgGoalProgressDaily: 1.62,
        avgFocusMinutes: 165,
        avgTaskCompletionRate: 0.88,
        avgDistractingMinutes: 52,
        avgHabitAdherence: 0.85
      },
      comparisonResult: {
        goalProgressChange: 0.77, // +0.77 percentage points progress increase
        focusMinutesChange: 70,   // +70 minutes focus work
        distractingScreenTimeChange: -83, // -83 minutes distracting screen time
        habitAdherenceChange: 0.27,
        summaryEvaluation: 'Positive: Daily goal progress increased alongside reduced distraction screen time.',
        outcomeStatement: 'During the 7 tracked experiment days, focus time rose by +70m/day and distracting screen time fell by -83m/day. Goal progress was +0.77% higher per day compared to the 14-day pre-experiment baseline. (Scientific Notice: Comparison does not imply uncontrolled causal proof).'
      },
      dailyLogs: [
        { date: '2026-11-09', adhered: true, notes: 'Completed 2 Linked List questions phone-free.', workMinutes: 180, distractingMinutes: 45, goalProgressDelta: 2.1 },
        { date: '2026-11-10', adhered: true, notes: 'Finished Stack problems before lunch.', workMinutes: 165, distractingMinutes: 50, goalProgressDelta: 1.8 },
        { date: '2026-11-11', adhered: false, notes: 'Checked Instagram during morning session.', workMinutes: 90, distractingMinutes: 110, goalProgressDelta: 0.5 },
        { date: '2026-11-12', adhered: true, notes: 'Clean 60-min deep focus session.', workMinutes: 190, distractingMinutes: 40, goalProgressDelta: 2.0 },
        { date: '2026-11-13', adhered: true, notes: 'Two-pointer problem solved quickly.', workMinutes: 175, distractingMinutes: 45, goalProgressDelta: 1.9 },
        { date: '2026-11-14', adhered: true, notes: 'Weekend focused practice.', workMinutes: 160, distractingMinutes: 55, goalProgressDelta: 1.5 },
        { date: '2026-11-15', adhered: true, notes: 'Maintained habit streak.', workMinutes: 155, distractingMinutes: 48, goalProgressDelta: 1.6 }
      ]
    });

    if (savedRecommendations[0]) {
      await WorkflowRecommendation.findByIdAndUpdate(savedRecommendations[0]._id, {
        status: 'testing',
        linkedExperiment: demoExperiment._id
      });
    }

    // Seed Sample Todo items
    await Todo.create([
      {
        user: userId,
        title: 'Review LeetCode Dynamic Programming patterns (Memoization vs Tabulation)',
        category: 'Coding',
        priority: 'high',
        goal: dsaGoal._id,
        dueDate: new Date(Date.now() + 86400000),
        completed: false
      },
      {
        user: userId,
        title: 'Read chapter 4 of System Design primer (Caching & CDNs)',
        category: 'Study',
        priority: 'medium',
        dueDate: new Date(Date.now() + 2 * 86400000),
        completed: false
      },
      {
        user: userId,
        title: 'Verify Python ML microservice Apriori Association Rules output',
        category: 'Work',
        priority: 'urgent',
        completed: false
      },
      {
        user: userId,
        title: 'Backup MongoDB database collections to archive',
        category: 'General',
        priority: 'low',
        completed: false
      },
      {
        user: userId,
        title: 'Complete Arrays two-pointer LeetCode problem set (40 questions)',
        category: 'Coding',
        priority: 'high',
        goal: dsaGoal._id,
        completed: true,
        completedAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        user: userId,
        title: 'Submit Minor Project Synopsis draft to faculty guide',
        category: 'Project',
        priority: 'urgent',
        completed: true,
        completedAt: new Date(Date.now() - 86400000)
      }
    ]);

    res.json({
      success: true,
      message: 'Demo dataset successfully seeded with 60 days of activity, ML models, and workflow experiment!',
      seededSummary: {
        goalsCount: 2,
        milestonesCount: milestones.length,
        habitsCount: habits.length,
        daysCount: allAnalytics.length,
        optimalClusters: clusterRes.optimal_k,
        silhouetteScore: clusterRes.silhouette_score,
        anomaliesFlagged: anomalyRes.anomaly_count,
        associationRules: assocRes.rules_count,
        recommendationsCount: savedRecommendations.length,
        activeExperimentTitle: demoExperiment.title
      }
    });
  } catch (err) {
    next(err);
  }
};
