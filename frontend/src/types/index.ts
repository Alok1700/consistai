export interface GoalMilestone {
  _id: string;
  goal: string;
  title: string;
  description?: string;
  order: number;
  sequenceNumber?: number;
  weight: number;
  startDate?: string;
  targetDate?: string;
  moduleCount: number;
  completedModuleCount: number;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalModule {
  _id: string;
  goal: string;
  milestone: string;
  title: string;
  description?: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  isCompleted: boolean;
  completedAt?: string | null;
  estimatedMinutes?: number;
  notes?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'professional' | 'researcher' | 'admin';
  preferences?: {
    dailyWorkHourTarget: number;
    maxDistractingScreenTime: number;
    theme: string;
    notificationsEnabled: boolean;
    workingDays?: string[];
    timezone?: string;
    primaryGoalId?: string;
  };
}

export interface Milestone {
  _id: string;
  goal: string;
  title: string;
  description?: string;
  order: number;
  sequenceNumber?: number;
  weight: number;
  targetQuantity: number;
  achievedQuantity: number;
  progressPercentage: number;
  isCompleted: boolean;
  status?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  skipReason?: string;
  notes?: string;
  targetDate?: string;
  completedAt?: string;
  dependencies?: string[];
  completionCriteria?: string;
  estimatedEffort?: string;
  resources?: Array<{ _id?: string; title: string; url: string; resourceType?: string }>;
  tasks?: Task[];
}

export interface GoalPacing {
  actual_goal_progress_pct: number;
  elapsed_time_pct: number;
  progress_gap_pct: number;
  pacing_status: 'ahead' | 'on_pace' | 'mild_deficit' | 'critical_deficit';
  pacing_label: string;
  days_elapsed?: number;
  days_remaining?: number;
  total_duration_days?: number;
  milestones_total_weight?: number;
  milestones_completed_weight?: number;
  average_daily_progress?: number;
  required_daily_progress_to_finish?: number;
  pacing_interpretation?: string;
  is_fallback?: boolean;
}

export interface YearlyTarget {
  _id?: string;
  target: string;
  targetDate?: string;
  isAchieved: boolean;
  achievedAt?: string;
}

export interface Achievement {
  _id: string;
  user: string;
  goal: string | Goal;
  milestone?: string | Milestone;
  achievementType:
    | 'first_task_completed'
    | 'first_milestone_completed'
    | 'milestone_completed'
    | 'progress_25'
    | 'progress_50'
    | 'progress_75'
    | 'goal_completed'
    | 'consistency_streak_7'
    | 'consistency_streak_14';
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: string;
  celebrated: boolean;
}

export interface GoalFolder {
  _id: string;
  name: string;
  parentFolderId?: string | null;
  description?: string;
  color: string;
  icon: string;
  sortOrder?: number;
  goalCount?: number;
  subfolderCount?: number;
  children?: GoalFolder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  _id: string;
  title: string;
  description?: string;
  category: string;
  folder?: string;
  folderId?: string | GoalFolder;
  color?: string;
  icon?: string;
  startDate: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetOutcome?: string;
  measurementUnit: string;
  progressType: 'numerical' | 'milestone_based' | 'checklist';
  moduleCount?: number;
  milestoneCount?: number;
  targetQuantity: number;
  achievedQuantity: number;
  currentProgressPercentage: number;
  status: 'active' | 'completed' | 'paused' | 'abandoned' | 'archived';
  isFavorite?: boolean;
  isArchived?: boolean;
  imageUrl?: string;
  theme?: string;
  displayPreference?: 'roadmap' | 'timeline' | 'dashboard';
  isPrimaryGoal?: boolean;
  completedAt?: string;
  reflectionNote?: string;
  yearlyTargets?: YearlyTarget[];
  linkedHabits?: Habit[];
  linkedTasks?: Task[];
  milestones?: Milestone[];
  milestoneStats?: {
    total: number;
    completed: number;
  };
  taskStats?: {
    daily: { total: number; completed: number };
    weekly: { total: number; completed: number };
    monthly: { total: number; completed: number };
    yearly: { total: number; completed: number };
  };
  tasks?: Task[];
  achievements?: Achievement[];
  pacing?: GoalPacing;
  pacingStatus?: string;
  pacingGap?: number;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  goal?: Goal | string;
  linkedMilestone?: Milestone | string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  taskType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dueDate: string;
  estimatedMinutes: number;
  actualMinutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isGoalRelevant: boolean;
  onTime?: boolean;
}

export interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'General' | 'Study' | 'Coding' | 'Project' | 'Work' | 'Personal';
  dueDate?: string;
  goal?: Goal;
  convertedToTask?: boolean;
  linkedTask?: Task;
  createdAt: string;
  updatedAt: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface Habit {
  _id: string;
  title: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';
  daysOfWeek?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  targetDaysPerWeek: number;
  linkedGoals?: Goal[] | string[];
  currentStreak: number;
  longestStreak: number;
  active: boolean;
  isCheckedToday?: boolean;
  isScheduledToday?: boolean;
  weeklyCompletions?: number;
  weeklyAdherenceRate?: number;
  monthlyCompletions?: number;
  monthlyScheduledDays?: number;
  monthlyAdherenceRate?: number;
  completionHistory?: Record<string, boolean>;
}

export interface WorkSession {
  _id: string;
  goal?: Goal;
  task?: Task;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  sessionType: 'timer' | 'manual';
  date: string;
  notes?: string;
}

export interface AppUsage {
  appName: string;
  category: string;
  minutes: number;
  isDistracting: boolean;
}

export interface ScreenTimeRecord {
  _id: string;
  date: string;
  totalMinutes: number;
  productiveMinutes: number;
  distractingMinutes: number;
  neutralMinutes: number;
  appUsage: AppUsage[];
  source: 'manual_entry' | 'csv_import';
  notes?: string;
}

export interface DailyAnalytics {
  _id?: string;
  date: string;
  plannedTasks: number;
  completedTasks: number;
  goalRelevantCompletedTasks: number;
  taskCompletionRate: number;
  scheduledHabits: number;
  completedHabits: number;
  habitAdherenceRate: number;
  completedHabitNames?: string[];
  totalWorkMinutes: number;
  goalWorkMinutes: number;
  focusSessionCount: number;
  totalScreenMinutes: number;
  distractingScreenMinutes: number;
  productiveScreenMinutes: number;
  goalProgressDelta: number;
  milestonesCompletedCount: number;
  consistencyScore: number;
  isHolidayOrRestDay: boolean;
  restDayNote?: string;
}

export interface ClusterItem {
  cluster_id: number;
  cluster_name: string;
  description: string;
  sample_count: number;
  percentage_of_days: number;
  avg_focused_work_minutes: number;
  avg_habit_adherence_rate: number;
  avg_task_completion_rate: number;
  avg_distracting_screen_time: number;
  avg_goal_specific_work_minutes: number;
  avg_planned_tasks: number;
  avg_goal_progress_delta: number;
  is_high_progress_cluster: boolean;
}

export interface ClusterResults {
  status: string;
  data_points: number;
  optimal_k: number;
  silhouette_score: number;
  clusters: ClusterItem[];
  key_findings: string[];
  methodology_note: string;
}

export interface AnomalyItem {
  date: string;
  anomaly_score: number;
  is_anomaly: boolean;
  is_holiday_or_rest_day: boolean;
  rest_day_note?: string;
  severity: 'mild' | 'moderate' | 'severe';
  contributing_factors: {
    feature: string;
    readable_feature: string;
    actual_value: number;
    baseline_mean: number;
    z_score: number;
    direction: string;
  }[];
  summary: string;
}

export interface AnomalyResults {
  status: string;
  total_days: number;
  anomaly_count: number;
  user_marked_rest_days: number;
  unexplained_anomalies: number;
  anomalies: AnomalyItem[];
  methodology_note: string;
}

export interface AssociationRuleItem {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
  observation_count: number;
  interpretation: string;
}

export interface AssociationResults {
  status: string;
  total_transactions: number;
  rules_count: number;
  rules: AssociationRuleItem[];
  top_habit_influences: string[];
  caution_statement: string;
}

export interface CorrelationPair {
  feature_a: string;
  feature_b: string;
  pearson_r: number;
  pearson_p_value: number;
  spearman_rho: number;
  spearman_p_value: number;
  direction: string;
  strength: string;
  interpretation: string;
}

export interface CorrelationResults {
  status: string;
  total_samples: number;
  correlations: CorrelationPair[];
  key_takeaways: string[];
  scientific_disclaimer: string;
}

export interface WorkflowRecommendation {
  _id: string;
  recommendationKey: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  observedIssue: string;
  supportingData: string;
  suggestedChange: string;
  expectedBenefitHypothesis: string;
  confidenceLevel: 'high' | 'moderate' | 'preliminary';
  dataLimitationNote: string;
  suggestedExperimentDays: number;
  suggestedTargetBehavior: string;
  status: 'active' | 'dismissed' | 'testing' | 'completed';
  linkedGoal?: Goal;
  linkedExperiment?: WorkflowExperiment;
}

export interface WorkflowExperiment {
  _id: string;
  title: string;
  hypothesis: string;
  targetBehavior: string;
  linkedRecommendation?: WorkflowRecommendation;
  linkedGoal?: Goal;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed' | 'abandoned';
  baselineMetrics: {
    avgGoalProgressDaily: number;
    avgFocusMinutes: number;
    avgTaskCompletionRate: number;
    avgDistractingMinutes: number;
    avgHabitAdherence: number;
  };
  experimentMetrics: {
    avgGoalProgressDaily: number;
    avgFocusMinutes: number;
    avgTaskCompletionRate: number;
    avgDistractingMinutes: number;
    avgHabitAdherence: number;
  };
  comparisonResult?: {
    goalProgressChange: number;
    focusMinutesChange: number;
    distractingScreenTimeChange: number;
    habitAdherenceChange: number;
    summaryEvaluation: string;
    outcomeStatement: string;
  };
  dailyLogs: {
    date: string;
    adhered: boolean;
    notes?: string;
    workMinutes: number;
    distractingMinutes: number;
    goalProgressDelta: number;
  }[];
}
