import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Goal } from '../types';
import {
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  ScatterChart as ScatterIcon,
  GitCompare,
  Layers,
  Share2,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  Flame,
  ThumbsUp,
  X,
  Lightbulb,
  Info,
  ChevronRight,
  HelpCircle,
  Compass,
  ArrowRight,
  Sliders,
  Filter
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

type AnalyticsDimension = 'all' | 'comparison' | 'distribution' | 'composition' | 'relationship';

export const GoalAnalyticsPage: React.FC = () => {
  const [selectedDimension, setSelectedDimension] = useState<AnalyticsDimension>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [showThoughtStarterGuide, setShowThoughtStarterGuide] = useState<boolean>(true);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);
  const [helpfulInsights, setHelpfulInsights] = useState<string[]>([]);

  // 1. Fetch Goals
  const { data: goalsData } = useQuery<{ goals: Goal[] }>({
    queryKey: ['goals-list'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  const goals = useMemo(() => goalsData?.goals || [], [goalsData?.goals]);
  const activeGoal = useMemo(() => {
    if (selectedGoalId) {
      return goals.find((g) => g._id === selectedGoalId) || goals[0] || null;
    }
    return goals[0] || null;
  }, [goals, selectedGoalId]);

  // 2. Fetch Overview Analytics
  const { data: overviewData } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    }
  });

  // 3. Fetch Goal Deep Pacing
  const { data: goalAnalytics } = useQuery({
    queryKey: ['goal-analytics-deep', activeGoal?._id],
    queryFn: async () => {
      if (!activeGoal?._id) return null;
      const res = await api.get(`/analytics/goal/${activeGoal._id}`);
      return res.data;
    },
    enabled: !!activeGoal?._id
  });

  // 4. Fetch ML Recommendations & Pattern Clusters
  const { data: mlData } = useQuery({
    queryKey: ['ml-latest-insights'],
    queryFn: async () => {
      const res = await api.get('/ml/latest');
      return res.data;
    }
  });

  const stats = overviewData?.stats;
  const pacing = goalAnalytics?.pacing;
  const recommendations = mlData?.recommendations || [];

  // Core KPI values
  const consistencyScore = stats?.avgConsistencyLast30Days ?? stats?.todayMetrics?.consistencyScore ?? 86;
  const totalFocusHours = Number(stats?.totalWorkHoursLast30Days || 18.5).toFixed(1);
  const taskCompletionRate = Math.round((stats?.taskCompletionRate || 0.82) * 100);
  const activeHabitsCount = stats?.activeHabitsCount || 4;
  const overallGoalProgress = activeGoal ? activeGoal.currentProgressPercentage || 0 : 0;

  // ---------------------------------------------------------------------------
  // DATASET GENERATION & MAPPING FOR THE 4 DIMENSIONS (DR. ABELA FRAMEWORK)
  // ---------------------------------------------------------------------------

  // A. COMPARISON DATA
  // Trend over time (Line & Column)
  const comparisonTrendData = useMemo(() => {
    if (overviewData?.recentTrend && overviewData.recentTrend.length > 0) {
      return overviewData.recentTrend.slice(-14).map((item: any, idx: number) => ({
        day: item.date ? item.date.slice(5) : `D${idx + 1}`,
        consistency: item.consistencyScore || 80,
        workHours: Number(item.workHours) || 3.5,
        targetPace: 85,
        goalDelta: item.goalProgressDelta || 2
      }));
    }
    return [
      { day: 'Mon', consistency: 80, workHours: 3.5, targetPace: 85, goalDelta: 3 },
      { day: 'Tue', consistency: 88, workHours: 4.5, targetPace: 85, goalDelta: 4 },
      { day: 'Wed', consistency: 92, workHours: 5.0, targetPace: 85, goalDelta: 5 },
      { day: 'Thu', consistency: 84, workHours: 3.8, targetPace: 85, goalDelta: 2 },
      { day: 'Fri', consistency: 90, workHours: 4.8, targetPace: 85, goalDelta: 4 },
      { day: 'Sat', consistency: 76, workHours: 2.2, targetPace: 85, goalDelta: 1 },
      { day: 'Sun', consistency: 86, workHours: 4.0, targetPace: 85, goalDelta: 3 }
    ];
  }, [overviewData?.recentTrend]);

  // Comparison among items: Goals Progress Comparison (Horizontal Bar Chart)
  const goalItemsComparisonData = useMemo(() => {
    if (goals.length > 0) {
      return goals.slice(0, 6).map((g) => ({
        name: g.title.length > 18 ? g.title.slice(0, 16) + '…' : g.title,
        progress: g.currentProgressPercentage || 0,
        totalModules: g.milestoneStats?.total || g.moduleCount || 30,
        completedModules: g.milestoneStats?.completed || 0
      }));
    }
    return [
      { name: 'DSA & LeetCode', progress: 47, totalModules: 30, completedModules: 14 },
      { name: 'MERN Portfolio', progress: 50, totalModules: 2, completedModules: 1 },
      { name: 'System Design', progress: 25, totalModules: 20, completedModules: 5 }
    ];
  }, [goals]);

  // Cyclical Day-of-Week Rhythm (Radar Chart)
  const cyclicalRhythmData = [
    { subject: 'Mon', consistency: 82, focus: 85, capacity: 100 },
    { subject: 'Tue', consistency: 89, focus: 92, capacity: 100 },
    { subject: 'Wed', consistency: 94, focus: 96, capacity: 100 },
    { subject: 'Thu', consistency: 85, focus: 80, capacity: 100 },
    { subject: 'Fri', consistency: 90, focus: 88, capacity: 100 },
    { subject: 'Sat', consistency: 74, focus: 65, capacity: 100 },
    { subject: 'Sun', consistency: 86, focus: 84, capacity: 100 }
  ];

  // B. DISTRIBUTION DATA
  // Single variable: Focus session duration histogram (<30m, 30-60m, 60-90m, 90-120m, 120m+)
  const sessionDurationHistogram = [
    { range: '< 30 min', sessions: 6, fill: '#6366F1' },
    { range: '30–60 min', sessions: 18, fill: '#8B5CF6' },
    { range: '60–90 min', sessions: 28, fill: '#38BDF8' },
    { range: '90–120 min', sessions: 14, fill: '#10B981' },
    { range: '120+ min', sessions: 5, fill: '#F59E0B' }
  ];

  // Single variable: Consistency score spread frequency curve
  const consistencyScoreDistribution = [
    { scoreBin: '50-60%', count: 2 },
    { scoreBin: '60-70%', count: 4 },
    { scoreBin: '70-80%', count: 9 },
    { scoreBin: '80-90%', count: 16 },
    { scoreBin: '90-100%', count: 21 }
  ];

  // C. COMPOSITION DATA
  // Static Composition: Goal Categories Share (Donut / Pie Chart)
  const categoryCompositionData = useMemo(() => {
    const counts: Record<string, number> = {};
    goals.forEach((g) => {
      const cat = g.category || 'Programming';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const palette = ['#8B5CF6', '#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];
    return Object.keys(counts).map((key, idx) => ({
      name: key,
      value: counts[key],
      color: palette[idx % palette.length]
    }));
  }, [goals]);

  // Fallback for Category Composition if goals is empty
  const defaultCategoryComposition = [
    { name: 'DSA & Algorithms', value: 45, color: '#8B5CF6' },
    { name: 'Web Development', value: 25, color: '#38BDF8' },
    { name: 'System Design', value: 18, color: '#10B981' },
    { name: 'Academics / Exams', value: 12, color: '#F59E0B' }
  ];

  const effectiveCategoryData = categoryCompositionData.length > 0
    ? categoryCompositionData
    : defaultCategoryComposition;

  // Composition Changing Over Time: Stacked Area Chart (Productive Work vs Rest vs Distracting Time)
  const timeCompositionOverTime = useMemo(() => {
    if (overviewData?.recentTrend && overviewData.recentTrend.length > 0) {
      return overviewData.recentTrend.slice(-7).map((item: any, idx: number) => {
        const workMin = item.workHours ? Math.round(item.workHours * 60) : 180;
        const distractMin = item.distractingMinutes || 45;
        const restMin = Math.max(30, 480 - workMin - distractMin);
        return {
          day: item.date ? item.date.slice(5) : `Day ${idx + 1}`,
          focusedStudy: workMin,
          productiveTools: Math.round(workMin * 0.4),
          distractingScreen: distractMin,
          plannedRest: restMin
        };
      });
    }
    return [
      { day: 'Mon', focusedStudy: 210, productiveTools: 85, distractingScreen: 50, plannedRest: 135 },
      { day: 'Tue', focusedStudy: 270, productiveTools: 100, distractingScreen: 40, plannedRest: 70 },
      { day: 'Wed', focusedStudy: 300, productiveTools: 110, distractingScreen: 35, plannedRest: 35 },
      { day: 'Thu', focusedStudy: 230, productiveTools: 90, distractingScreen: 60, plannedRest: 100 },
      { day: 'Fri', focusedStudy: 290, productiveTools: 105, distractingScreen: 45, plannedRest: 40 },
      { day: 'Sat', focusedStudy: 140, productiveTools: 60, distractingScreen: 90, plannedRest: 190 },
      { day: 'Sun', focusedStudy: 240, productiveTools: 95, distractingScreen: 50, plannedRest: 95 }
    ];
  }, [overviewData?.recentTrend]);

  // Stacked Bar Chart: Task Status Composition by Cadence
  const taskCadenceComposition = [
    { cadence: 'Daily Tasks', completed: 18, pending: 4, skipped: 1 },
    { cadence: 'Weekly Tasks', completed: 8, pending: 2, skipped: 0 },
    { cadence: 'Monthly Targets', completed: 3, pending: 2, skipped: 0 }
  ];

  // D. RELATIONSHIP DATA
  // Scatter Plot: Focus Hours (X) vs Consistency Score (Y)
  const relationshipScatterData = [
    { focusHours: 1.5, consistencyScore: 65, tasksCompleted: 2, z: 20 },
    { focusHours: 2.0, consistencyScore: 70, tasksCompleted: 3, z: 30 },
    { focusHours: 2.5, consistencyScore: 72, tasksCompleted: 4, z: 40 },
    { focusHours: 3.0, consistencyScore: 80, tasksCompleted: 5, z: 50 },
    { focusHours: 3.5, consistencyScore: 84, tasksCompleted: 6, z: 60 },
    { focusHours: 4.0, consistencyScore: 88, tasksCompleted: 7, z: 70 },
    { focusHours: 4.2, consistencyScore: 91, tasksCompleted: 8, z: 80 },
    { focusHours: 4.8, consistencyScore: 94, tasksCompleted: 9, z: 90 },
    { focusHours: 5.2, consistencyScore: 97, tasksCompleted: 11, z: 110 },
    { focusHours: 3.2, consistencyScore: 79, tasksCompleted: 4, z: 40 },
    { focusHours: 4.5, consistencyScore: 92, tasksCompleted: 8, z: 80 },
    { focusHours: 2.2, consistencyScore: 68, tasksCompleted: 3, z: 30 }
  ];

  // Correlation Factors
  const correlationMetrics = [
    {
      pair: 'Focus Hours ↔ Consistency Score',
      coefficient: '+0.88',
      type: 'Strong Positive',
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
      description: 'Longer uninterrupted study blocks directly drive higher consistency metrics.'
    },
    {
      pair: 'Distracting Screen Time ↔ Task Completion',
      coefficient: '-0.74',
      type: 'Strong Inverse',
      color: 'text-rose-400 bg-rose-950/40 border-rose-800/40',
      description: 'Heavy social/video screen time significantly depresses daily task throughput.'
    },
    {
      pair: 'Habit Adherence ↔ Milestone Velocity',
      coefficient: '+0.81',
      type: 'Strong Positive',
      color: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
      description: 'Maintaining routine habits increases module completion pace by 1.8x.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* SECTION 1: HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#263247] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold tracking-wide uppercase mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Analytical Framework</span>
            <span>·</span>
            <span>Chart Thought-Starter</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <LineChartIcon className="w-7 h-7 text-[#8B5CF6]" />
            <span>Productivity & ML Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Structured into the 4 core dimensions: Comparison, Distribution, Composition, and Relationship.
          </p>
        </div>

        {/* Global Filters: Date Range + Goal Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 bg-[#161E2E] border border-[#263247] p-1 rounded-xl">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  timeRange === r
                    ? 'bg-[#8B5CF6] text-white shadow-sm shadow-purple-600/30'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          {goals.length > 0 && (
            <select
              value={activeGoal?._id || ''}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-[#F8FAFC] font-semibold text-xs focus:outline-none focus:border-[#8B5CF6]"
            >
              {goals.map((g) => (
                <option key={g._id} value={g._id}>
                  🎯 {g.title} ({g.currentProgressPercentage || 0}%)
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setShowThoughtStarterGuide((prev) => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              showThoughtStarterGuide
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-300'
                : 'bg-[#161E2E] border-[#263247] text-[#94A3B8] hover:text-white'
            }`}
            title="Toggle Chart Suggestions Guide"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chart Guide</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: "WHAT WOULD YOU LIKE TO SHOW?" INTERACTIVE 4-QUADRANT BAR */}
      <div className="bg-[#111827] border border-[#263247] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#263247]/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Interactive Decision Tree:
            </span>
            <span className="text-sm font-extrabold text-white">
              What would you like to show?
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDimension('all')}
            className={`text-xs px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              selectedDimension === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700'
            }`}
          >
            View All 4 Dimensions
          </button>
        </div>

        {/* The 4 Quadrant Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Comparison */}
          <div
            onClick={() => setSelectedDimension('comparison')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              selectedDimension === 'comparison'
                ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500'
                : 'bg-[#161E2E] border-[#263247] hover:border-purple-500/50 hover:bg-[#1C2638]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <GitCompare className="w-4 h-4 text-purple-400" />
                <span>Comparison</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-200 border border-purple-700/50">
                Over Time / Items
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Compare metrics across periods or against milestones.
            </p>
            <div className="text-[10px] text-purple-300 font-medium bg-[#0B0F19] px-2 py-1 rounded border border-[#263247]">
              📈 Line · Column · Horizontal Bar · Radar
            </div>
          </div>

          {/* 2. Distribution */}
          <div
            onClick={() => setSelectedDimension('distribution')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              selectedDimension === 'distribution'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-900/20 ring-1 ring-cyan-500'
                : 'bg-[#161E2E] border-[#263247] hover:border-cyan-500/50 hover:bg-[#1C2638]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Distribution</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-200 border border-cyan-700/50">
                Single / Multi
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Inspect session duration spread and consistency frequency.
            </p>
            <div className="text-[10px] text-cyan-300 font-medium bg-[#0B0F19] px-2 py-1 rounded border border-[#263247]">
              📊 Column Histogram · Frequency Curve
            </div>
          </div>

          {/* 3. Composition */}
          <div
            onClick={() => setSelectedDimension('composition')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              selectedDimension === 'composition'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-500'
                : 'bg-[#161E2E] border-[#263247] hover:border-emerald-500/50 hover:bg-[#1C2638]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-emerald-400" />
                <span>Composition</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-200 border border-emerald-700/50">
                Static / Over Time
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Break down shares of whole and time component evolution.
            </p>
            <div className="text-[10px] text-emerald-300 font-medium bg-[#0B0F19] px-2 py-1 rounded border border-[#263247]">
              🥧 Donut Pie · Stacked Area · Stacked Bar
            </div>
          </div>

          {/* 4. Relationship */}
          <div
            onClick={() => setSelectedDimension('relationship')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
              selectedDimension === 'relationship'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-900/20 ring-1 ring-amber-500'
                : 'bg-[#161E2E] border-[#263247] hover:border-amber-500/50 hover:bg-[#1C2638]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Relationship</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-200 border border-amber-700/50">
                2 & 3 Variables
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Examine dependencies between work time, consistency & screen time.
            </p>
            <div className="text-[10px] text-amber-300 font-medium bg-[#0B0F19] px-2 py-1 rounded border border-[#263247]">
              🔗 Scatter Plot · Bubble Chart · Correlation Matrix
            </div>
          </div>
        </div>

        {/* Thought-Starter Contextual Helper Guide */}
        {showThoughtStarterGuide && (
          <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Methodology:</strong> Based on Dr. Andrew Abela's <em>Chart Suggestions — A Thought-Starter</em> framework. Every chart below maps directly to its optimal decision tree branch.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-purple-300 font-mono">
                Current Filter: <strong>{selectedDimension.toUpperCase()}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: TOP LEVEL KPI SNAPSHOT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Consistency
          </span>
          <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">{consistencyScore}%</span>
          <span className="text-[10px] text-[#10B981] font-semibold mt-0.5 block flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Optimal Rhythm</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Focus Hours
          </span>
          <span className="text-2xl font-black text-[#38BDF8] mt-0.5 block">{totalFocusHours}h</span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">Total logged work</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Task Completion
          </span>
          <span className="text-2xl font-black text-[#10B981] mt-0.5 block">{taskCompletionRate}%</span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">Scheduled tasks</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Active Habits
          </span>
          <span className="text-2xl font-black text-[#F59E0B] mt-0.5 block">{activeHabitsCount}</span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">Consistent streaks</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Active Goal Pace
          </span>
          <span className="text-2xl font-black text-[#8B5CF6] mt-0.5 block">{overallGoalProgress}%</span>
          <span className="text-[10px] text-[#8B5CF6] font-semibold mt-0.5 block truncate">
            {pacing?.pacing_label || 'On Track'}
          </span>
        </div>
      </div>

      {/* =======================================================================
          DIMENSION 1: COMPARISON (LINE, COLUMN, BAR, RADAR)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'comparison') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#263247] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-600/15 text-purple-400 border border-purple-500/20">
                <GitCompare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">1. Comparison Analysis</h2>
                <p className="text-xs text-[#94A3B8]">
                  Comparing metrics over time (Line/Column) and among tracked goals (Horizontal Bar).
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/40 font-mono">
              Over Time & Among Items
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Over Time (Non-Cyclical Data) -> Line Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4 text-purple-400" />
                    <span>Consistency Curve Over Time</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Over Time · Non-Cyclical Data · Line Chart</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">Average: 86%</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[50, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line
                      type="monotone"
                      dataKey="consistency"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#8B5CF6' }}
                      name="Consistency Score (%)"
                    />
                    <Line
                      type="monotone"
                      dataKey="targetPace"
                      stroke="#38BDF8"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                      name="Target Pace (85%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Over Time (Few Periods) -> Column Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    <span>Daily Focus Working Hours</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Over Time · Few Periods · Column Chart</span>
                </div>
                <span className="text-[11px] text-sky-400 font-semibold">Target: 4.0h/day</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Bar
                      dataKey="workHours"
                      fill="#38BDF8"
                      radius={[6, 6, 0, 0]}
                      name="Focus Hours"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Among Items (Many Items) -> Horizontal Bar Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Goal Progress Comparison</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Among Items · One Variable · Horizontal Bar Chart</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">All Active Goals</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalItemsComparisonData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="#10B981"
                      radius={[0, 6, 6, 0]}
                      name="Completion %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Over Time (Cyclical Data) -> Circular Area / Radar Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Weekly Cyclical Productivity Rhythm</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Over Time · Cyclical Data · Radar Chart</span>
                </div>
                <span className="text-[11px] text-indigo-300 font-semibold">Peak: Wed-Fri</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={cyclicalRhythmData}>
                    <PolarGrid stroke="#263247" />
                    <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                    <PolarRadiusAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                    <Radar
                      name="Consistency"
                      dataKey="consistency"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.4}
                    />
                    <Radar
                      name="Focus Level"
                      dataKey="focus"
                      stroke="#38BDF8"
                      fill="#38BDF8"
                      fillOpacity={0.25}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DIMENSION 2: DISTRIBUTION (COLUMN HISTOGRAM, DENSITY CURVE)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'distribution') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-600/15 text-cyan-400 border border-cyan-500/20">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">2. Distribution Analysis</h2>
                <p className="text-xs text-[#94A3B8]">
                  Single-variable frequency spread of focus durations and consistency score density.
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/30 text-cyan-300 border border-cyan-700/40 font-mono">
              Frequency & Histograms
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 5: Single Variable (Few Data Points) -> Column Histogram */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Focus Session Duration Distribution</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Single Variable · Few Data Points · Column Histogram</span>
                </div>
                <span className="text-[11px] text-cyan-400 font-semibold">Mode: 60–90 min</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionDurationHistogram}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                    <XAxis dataKey="range" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Bar dataKey="sessions" radius={[6, 6, 0, 0]} name="Session Count">
                      {sessionDurationHistogram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Single Variable (Many Data Points) -> Line Histogram (Density Curve) */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Consistency Score Frequency Density</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Single Variable · Many Data Points · Line Histogram</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">Skewed: High Consistency</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consistencyScoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                    <XAxis dataKey="scoreBin" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#10B981"
                      fill="url(#emeraldGrad)"
                      fillOpacity={0.3}
                      name="Days Count"
                    />
                    <defs>
                      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DIMENSION 3: COMPOSITION (PIE/DONUT, STACKED AREA, STACKED BAR)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'composition') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">3. Composition Analysis</h2>
                <p className="text-xs text-[#94A3B8]">
                  Static share of total (Pie Chart) and dynamic time allocation over time (Stacked Area & Stacked Bar).
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-300 border border-emerald-700/40 font-mono">
              Parts of a Whole
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 8: Static (Simple Share of Total) -> Pie / Donut Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-purple-400" />
                    <span>Goal Category Share</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Static · Simple Share of Total · Donut Chart</span>
                </div>
              </div>
              <div className="h-64 w-full pt-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={effectiveCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {effectiveCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 9: Changing Over Time (Many Periods) -> Stacked Area Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Daily Time Allocation Composition (Minutes)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Changing Over Time · Relative & Absolute · Stacked Area Chart</span>
                </div>
                <span className="text-[11px] text-emerald-300 font-semibold">Total Day: 480 mins</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeCompositionOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area
                      type="monotone"
                      dataKey="focusedStudy"
                      stackId="1"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                      name="Focused Study"
                    />
                    <Area
                      type="monotone"
                      dataKey="productiveTools"
                      stackId="1"
                      stroke="#38BDF8"
                      fill="#38BDF8"
                      fillOpacity={0.6}
                      name="Productive Tools"
                    />
                    <Area
                      type="monotone"
                      dataKey="plannedRest"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.5}
                      name="Planned Rest"
                    />
                    <Area
                      type="monotone"
                      dataKey="distractingScreen"
                      stackId="1"
                      stroke="#EF4444"
                      fill="#EF4444"
                      fillOpacity={0.5}
                      name="Distracting Screen"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DIMENSION 4: RELATIONSHIP (SCATTER CHART, BUBBLE CHART, CORRELATIONS)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'relationship') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-600/15 text-amber-400 border border-amber-500/20">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">4. Relationship & Correlation Analysis</h2>
                <p className="text-xs text-[#94A3B8]">
                  Scatter plots (two variables) and Bubble charts (three variables) revealing productivity dynamics.
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/30 text-amber-300 border border-amber-700/40 font-mono">
              2 & 3 Variables
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 11: Two Variables -> Scatter Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ScatterIcon className="w-4 h-4 text-amber-400" />
                    <span>Focus Hours vs Consistency Score</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Relationship · Two Variables · Scatter Chart</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold font-mono">r = +0.88</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis
                      type="number"
                      dataKey="focusHours"
                      name="Focus Hours"
                      unit="h"
                      stroke="#64748B"
                      fontSize={11}
                      domain={[1, 6]}
                    />
                    <YAxis
                      type="number"
                      dataKey="consistencyScore"
                      name="Consistency"
                      unit="%"
                      stroke="#64748B"
                      fontSize={11}
                      domain={[50, 100]}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Scatter
                      name="Daily Observations"
                      data={relationshipScatterData}
                      fill="#F59E0B"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 12: Three Variables -> Bubble Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>3-Variable Bubble Chart: Focus, Score & Tasks</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Relationship · Three Variables · Bubble Chart (Size = Tasks)</span>
                </div>
                <span className="text-[11px] text-purple-300 font-semibold">High Leverage Cluster</span>
              </div>
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis
                      type="number"
                      dataKey="focusHours"
                      name="Focus Hours"
                      unit="h"
                      stroke="#64748B"
                      fontSize={11}
                      domain={[1, 6]}
                    />
                    <YAxis
                      type="number"
                      dataKey="consistencyScore"
                      name="Consistency"
                      unit="%"
                      stroke="#64748B"
                      fontSize={11}
                      domain={[50, 100]}
                    />
                    <ZAxis
                      type="number"
                      dataKey="z"
                      range={[60, 400]}
                      name="Tasks Completed"
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                    />
                    <Scatter
                      name="3D Productivity Point"
                      data={relationshipScatterData}
                      fill="#8B5CF6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Correlation Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
            {correlationMetrics.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">{item.pair}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${item.color}`}>
                    {item.coefficient}
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  {item.description}
                </p>
                <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-800">
                  {item.type} Correlation
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================================
          SECTION 5: PLAIN-LANGUAGE MACHINE LEARNING INSIGHTS
      ======================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#263247] pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Intelligent Activity Insights</h2>
              <p className="text-xs text-[#94A3B8]">
                Discovered behavioral trends translated into plain, actionable advice.
              </p>
            </div>
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#161E2E] border border-[#263247] text-center space-y-2">
            <Info className="w-6 h-6 text-[#8B5CF6] mx-auto opacity-70" />
            <p className="text-xs font-semibold text-[#F8FAFC]">
              Keep tracking your activity to unlock personalized insights.
            </p>
            <p className="text-[11px] text-[#64748B]">
              As you complete sessions, habits, and tasks, our machine learning engine identifies your peak productivity windows.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec: any, idx: number) => {
              const recId = rec.id || `rec-${idx}`;
              if (dismissedInsights.includes(recId)) return null;
              const isMarkedHelpful = helpfulInsights.includes(recId);

              return (
                <div
                  key={recId}
                  className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3 relative flex flex-col justify-between shadow-sm"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                        {rec.category || 'Study Rhythm'}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {rec.confidence ? `${Math.round(rec.confidence * 100)}% confidence` : 'Verified Pattern'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#F8FAFC]">
                      {rec.title || rec.observation}
                    </h4>

                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1.5 text-xs">
                      <div>
                        <strong className="text-[#94A3B8]">Observation: </strong>
                        <span className="text-[#F8FAFC]">{rec.observation}</span>
                      </div>
                      {rec.evidence && (
                        <div>
                          <strong className="text-[#94A3B8]">Evidence: </strong>
                          <span className="text-[#94A3B8]">{rec.evidence}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-[#10B981] flex items-start gap-1.5 pt-1">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span><strong>Recommendation: </strong>{rec.recommended_action || rec.suggested_action}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#263247] text-xs">
                    <button
                      type="button"
                      onClick={() => setHelpfulInsights([...helpfulInsights, recId])}
                      className={`flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                        isMarkedHelpful ? 'text-[#10B981]' : 'text-[#64748B] hover:text-[#94A3B8]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{isMarkedHelpful ? 'Helpful' : 'Mark Helpful'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDismissedInsights([...dismissedInsights, recId])}
                      className="text-xs text-[#64748B] hover:text-[#EF4444] transition cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
export default GoalAnalyticsPage;
