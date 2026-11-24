export const DEMO_GOALS = [
  {
    _id: 'goal_dsa_101',
    title: 'Master Data Structures & Algorithms',
    description: 'Solve 250 problems covering Arrays, Graphs, Dynamic Programming, and Trees for software engineer placement.',
    category: 'DSA & Coding',
    targetDate: '2026-12-30T00:00:00.000Z',
    isPrimary: true,
    progress: 42.5,
    pacingGap: 4.8,
    pacingStatus: 'Ahead of Schedule',
    status: 'in_progress',
    folderId: 'folder_placement_01',
    milestones: [
      {
        _id: 'ms_arrays_01',
        title: 'Arrays & Two Pointers',
        description: 'Complete top 30 foundational array interview questions',
        weight: 20,
        progress: 100,
        isCompleted: true,
        order: 1,
        modules: [
          { _id: 'mod_1', title: 'Two Sum', isCompleted: true, order: 1 },
          { _id: 'mod_2', title: 'Best Time to Buy & Sell Stock', isCompleted: true, order: 2 },
          { _id: 'mod_3', title: 'Contains Duplicate', isCompleted: true, order: 3 },
          { _id: 'mod_4', title: 'Product of Array Except Self', isCompleted: true, order: 4 },
          { _id: 'mod_5', title: 'Maximum Subarray (Kadane)', isCompleted: true, order: 5 }
        ]
      },
      {
        _id: 'ms_linkedlist_02',
        title: 'Linked Lists & Fast/Slow Pointers',
        description: 'Pointer manipulation, reversal, and cycle detection',
        weight: 15,
        progress: 60,
        isCompleted: false,
        order: 2,
        modules: [
          { _id: 'mod_6', title: 'Reverse a Linked List', isCompleted: true, order: 1 },
          { _id: 'mod_7', title: 'Merge Two Sorted Lists', isCompleted: true, order: 2 },
          { _id: 'mod_8', title: 'Linked List Cycle', isCompleted: true, order: 3 },
          { _id: 'mod_9', title: 'Reorder List', isCompleted: false, order: 4 },
          { _id: 'mod_10', title: 'Remove Nth Node From End', isCompleted: false, order: 5 }
        ]
      },
      {
        _id: 'ms_dp_03',
        title: 'Dynamic Programming & Memoization',
        description: '0/1 Knapsack, LCS, LIS, and grid traversals',
        weight: 35,
        progress: 20,
        isCompleted: false,
        order: 3,
        modules: [
          { _id: 'mod_11', title: 'Climbing Stairs', isCompleted: true, order: 1 },
          { _id: 'mod_12', title: 'Coin Change (Unbounded Knapsack)', isCompleted: false, order: 2 },
          { _id: 'mod_13', title: 'Longest Increasing Subsequence', isCompleted: false, order: 3 }
        ]
      }
    ]
  },
  {
    _id: 'goal_minor_proj_102',
    title: 'ConsistAI Autonomous Assistant Project',
    description: 'Build and deploy full-stack autonomous AI productivity system with retrospective ML analytics.',
    category: 'Academics & Semester',
    targetDate: '2026-11-28T00:00:00.000Z',
    isPrimary: false,
    progress: 92.0,
    pacingGap: 12.4,
    pacingStatus: 'Ahead of Schedule',
    status: 'in_progress',
    folderId: 'folder_projects_02'
  }
];

export const DEMO_FOLDERS = [
  { _id: 'folder_placement_01', name: 'Placement Preparation', color: '#6366F1', icon: 'briefcase', goalCount: 1 },
  { _id: 'folder_projects_02', name: 'Academic Minor Project', color: '#0EA5E9', icon: 'code', goalCount: 1 },
  { _id: 'folder_fitness_03', name: 'Fitness & Health', color: '#10B981', icon: 'activity', goalCount: 0 }
];

export const DEMO_TASKS = [
  {
    _id: 'task_001',
    title: 'Solve Reorder List (LeetCode #143)',
    description: 'Find midpoint using fast/slow pointers, reverse second half, and interleave.',
    priority: 'high',
    status: 'pending',
    dueDate: new Date().toISOString(),
    scheduledDate: new Date().toISOString().slice(0, 10),
    goalId: 'goal_dsa_101',
    estimatedMinutes: 45
  },
  {
    _id: 'task_002',
    title: 'Review Isolation Forest & K-Means for Minor Project Viva',
    description: 'Prepare mathematical derivations for Silhouette score and anomaly path lengths.',
    priority: 'urgent',
    status: 'pending',
    dueDate: new Date().toISOString(),
    scheduledDate: new Date().toISOString().slice(0, 10),
    goalId: 'goal_minor_proj_102',
    estimatedMinutes: 60
  },
  {
    _id: 'task_003',
    title: 'Practice 15-Minute Technical Speech for Presentation',
    description: 'Rehearse slide transitions using the companion speaker notes.',
    priority: 'medium',
    status: 'completed',
    dueDate: new Date().toISOString(),
    scheduledDate: new Date().toISOString().slice(0, 10),
    goalId: 'goal_minor_proj_102',
    estimatedMinutes: 30
  }
];

export const DEMO_HABITS = [
  {
    _id: 'habit_001',
    name: 'Daily DSA Practice (2 Problems)',
    trackingType: 'quantitative',
    targetValue: 2,
    unit: 'problems',
    frequency: 'daily',
    streak: 14,
    bestStreak: 21,
    todayCheckIn: { completed: true, value: 2 },
    goalId: 'goal_dsa_101'
  },
  {
    _id: 'habit_002',
    name: 'Deep Focus Work Block (60 Mins Phone-Free)',
    trackingType: 'duration',
    targetValue: 60,
    unit: 'minutes',
    frequency: 'daily',
    streak: 9,
    bestStreak: 12,
    todayCheckIn: { completed: false, value: 45 }
  },
  {
    _id: 'habit_003',
    name: 'Limit Social Media Screen Time (< 45 Mins)',
    trackingType: 'limit',
    targetValue: 45,
    unit: 'minutes',
    frequency: 'daily',
    streak: 6,
    bestStreak: 8,
    todayCheckIn: { completed: true, value: 32 }
  }
];

export const DEMO_ANALYTICS_OVERVIEW = {
  consistencyScore: 87.5,
  focusMinutesToday: 135,
  tasksCompletedToday: 3,
  habitsCompletedToday: 2,
  primaryGoalProgress: 42.5,
  pacingGap: 4.8,
  activeCluster: {
    clusterId: 1,
    name: 'Deep Flow & Routine',
    description: 'High focus duration, low distraction ratio, and high milestone velocity.',
    expectedProgressDelta: '+1.87% / day'
  },
  experiments: [
    {
      _id: 'exp_001',
      title: 'Phone-Free Morning Focus Block',
      hypothesis: 'Studying DSA for 45 min before opening social media increases daily completion by >50%.',
      status: 'active',
      currentDay: 8,
      durationDays: 14,
      baselineFocusMinutes: 95,
      currentFocusMinutes: 165
    }
  ]
};
