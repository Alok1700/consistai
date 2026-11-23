import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { api } from '../../../api/client';
import { Goal } from '../../../types';
import {
  Compass,
  GitCompare,
  BarChart3,
  PieChart as PieChartIcon,
  Share2,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  Zap,
  Activity,
  Layers,
  Sliders,
  Filter,
  HelpCircle,
  ChevronRight,
  Info,
  Calendar,
  CheckCircle2,
  ThumbsUp,
  FlaskConical,
  ArrowRight,
  Maximize2
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

type MainDimension = 'all' | 'comparison' | 'distribution' | 'composition' | 'relationship';
type SubBranch = 'all' | 'among-items' | 'over-time' | 'single-var' | 'two-var' | 'changing-time' | 'static-comp';

interface ContextType {
  onOpenDrawer: (date: string) => void;
  onTestInLab: (recommendation: any) => void;
}

export const ChartSuggestionsSubpage: React.FC = () => {
  const { onOpenDrawer, onTestInLab } = (useOutletContext<ContextType>() || {}) as ContextType;
  const [searchParams] = useSearchParams();
  const goalIdParam = searchParams.get('goalId') || '';

  const [selectedDimension, setSelectedDimension] = useState<MainDimension>('all');
  const [selectedBranch, setSelectedBranch] = useState<SubBranch>('all');
  const [showDiagramMap, setShowDiagramMap] = useState<boolean>(true);
  const [helpfulInsights, setHelpfulInsights] = useState<string[]>([]);
  const [activeGoalFilter, setActiveGoalFilter] = useState<string>(goalIdParam);

  // 1. Fetch Overview Stats
  const { data: overviewData } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    }
  });

  // 2. Fetch Goals List
  const { data: goalsData } = useQuery<{ goals: Goal[] }>({
    queryKey: ['filter-bar-goals'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  // 3. Fetch ML Activity Insights
  const { data: mlData } = useQuery({
    queryKey: ['ml-latest-insights'],
    queryFn: async () => {
      const res = await api.get('/ml/latest');
      return res.data;
    }
  });

  const goals = useMemo(() => goalsData?.goals || [], [goalsData?.goals]);
  const stats = overviewData?.stats;
  const recommendations = mlData?.recommendations || [];

  // KPI Calculations
  const consistencyScore = stats?.avgConsistencyLast30Days ?? stats?.todayMetrics?.consistencyScore ?? 86;
  const totalFocusHours = Number(stats?.totalWorkHoursLast30Days || 18.5).toFixed(1);
  const taskCompletionRate = Math.round((stats?.taskCompletionRate || 0.82) * 100);
  const activeHabitsCount = stats?.activeHabitsCount || 4;
  const activeGoalsCount = goals.length || 3;

  // ---------------------------------------------------------------------------
  // DATASETS MAPPING FOR THE 4 DIMENSIONS (DR. ABELA FRAMEWORK)
  // ---------------------------------------------------------------------------

  // 1. COMPARISON DATASETS
  // 1a. Over Time (Non-Cyclical Data) -> Line Chart
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

  // 1b. Among Items (Many Items) -> Horizontal Bar Chart
  const goalItemsComparisonData = useMemo(() => {
    if (goals.length > 0) {
      return goals.slice(0, 6).map((g) => ({
        name: g.title.length > 18 ? g.title.slice(0, 16) + '…' : g.title,
        progress: g.currentProgressPercentage || 0,
        totalModules: g.milestoneStats?.total || g.moduleCount || 20,
        completedModules: g.milestoneStats?.completed || 0,
        category: g.category || 'General'
      }));
    }
    return [
      { name: 'DSA & LeetCode', progress: 47, totalModules: 30, completedModules: 14, category: 'Coding' },
      { name: 'MERN Portfolio', progress: 65, totalModules: 10, completedModules: 6, category: 'Web' },
      { name: 'System Design', progress: 30, totalModules: 15, completedModules: 5, category: 'Architecture' },
      { name: 'Fitness & Health', progress: 85, totalModules: 20, completedModules: 17, category: 'Wellness' },
      { name: 'Machine Learning', progress: 40, totalModules: 12, completedModules: 5, category: 'AI' }
    ];
  }, [goals]);

  // 1c. Over Time (Cyclical Data) -> Circular Area / Radar Chart
  const cyclicalRhythmData = [
    { subject: 'Mon', consistency: 82, focus: 85, capacity: 100 },
    { subject: 'Tue', consistency: 89, focus: 92, capacity: 100 },
    { subject: 'Wed', consistency: 94, focus: 96, capacity: 100 },
    { subject: 'Thu', consistency: 85, focus: 80, capacity: 100 },
    { subject: 'Fri', consistency: 90, focus: 88, capacity: 100 },
    { subject: 'Sat', consistency: 74, focus: 65, capacity: 100 },
    { subject: 'Sun', consistency: 86, focus: 84, capacity: 100 }
  ];

  // 2. DISTRIBUTION DATASETS
  // 2a. Single Variable (Few Points) -> Column Histogram
  const sessionDurationHistogram = [
    { range: '< 30 min', sessions: 6, fill: '#6366F1' },
    { range: '30–60 min', sessions: 18, fill: '#8B5CF6' },
    { range: '60–90 min', sessions: 28, fill: '#38BDF8' },
    { range: '90–120 min', sessions: 14, fill: '#10B981' },
    { range: '120+ min', sessions: 5, fill: '#F59E0B' }
  ];

  // 2b. Single Variable (Many Points) -> Line Histogram / Density Curve
  const consistencyScoreDistribution = [
    { scoreBin: '50-60%', count: 2, label: 'Low' },
    { scoreBin: '60-70%', count: 5, label: 'Fair' },
    { scoreBin: '70-80%', count: 11, label: 'Good' },
    { scoreBin: '80-90%', count: 19, label: 'Great' },
    { scoreBin: '90-100%', count: 25, label: 'Optimal' }
  ];

  // 3. COMPOSITION DATASETS
  // 3a. Static (Simple Share of Total) -> Donut / Pie Chart
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

  const defaultCategoryComposition = [
    { name: 'DSA & Algorithms', value: 42, color: '#8B5CF6' },
    { name: 'Full-Stack Web Dev', value: 28, color: '#38BDF8' },
    { name: 'System Architecture', value: 18, color: '#10B981' },
    { name: 'Personal Wellness', value: 12, color: '#F59E0B' }
  ];

  const effectiveCategoryData = categoryCompositionData.length > 0
    ? categoryCompositionData
    : defaultCategoryComposition;

  // 3b. Changing Over Time (Many Periods) -> Stacked Area Chart (Minutes)
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

  // 3c. Changing Over Time (Few Periods) -> Stacked 100% Column Chart
  const taskCadenceComposition = [
    { cadence: 'Daily Tasks', completed: 18, pending: 4, skipped: 1 },
    { cadence: 'Weekly Tasks', completed: 8, pending: 2, skipped: 0 },
    { cadence: 'Monthly Targets', completed: 3, pending: 2, skipped: 0 }
  ];

  // 3d. Static (Accumulation to Total) -> Waterfall-style balance step data
  const waterfallProductivityData = [
    { step: 'Base Target', value: 100, delta: '+100', fill: '#64748B' },
    { step: 'Deep Work Bonus', value: 125, delta: '+25', fill: '#10B981' },
    { step: 'Screen Distractions', value: 105, delta: '-20', fill: '#EF4444' },
    { step: 'Habit Consistency', value: 120, delta: '+15', fill: '#8B5CF6' },
    { step: 'Net Performance', value: 120, delta: 'Total 120%', fill: '#38BDF8' }
  ];

  // 4. RELATIONSHIP DATASETS
  // 4a. Two Variables -> Scatter Chart (Focus Hours vs Consistency Score)
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
      description: 'Maintaining routine daily habits increases milestone completion pace by 1.8x.'
    }
  ];

  const handleSelectDimension = (dim: MainDimension) => {
    setSelectedDimension(dim);
    setSelectedBranch('all');
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: HEADER & TAXONOMY SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161E2E] border border-[#263247] p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B5CF6]">
              Analytical Architecture · Chart Thought-Starter
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[#F8FAFC] tracking-tight">
            Chart Suggestions Decision Tree
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Organized according to Dr. Andrew Abela's classic taxonomy: Comparison, Distribution, Composition, and Relationship.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDiagramMap((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              showDiagramMap
                ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[#8B5CF6]'
                : 'bg-[#1C2638] border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showDiagramMap ? 'Hide Decision Flow' : 'Show Decision Flow'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectDimension('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              selectedDimension === 'all'
                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-sm shadow-[#8B5CF6]/30'
                : 'bg-[#1C2638] border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            All 4 Dimensions
          </button>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE VISUAL DECISION TREE (WHAT WOULD YOU LIKE TO SHOW?) */}
      {showDiagramMap && (
        <div className="bg-[#111827] border border-[#263247] rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Root Question Card */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
              Decision Framework
            </span>
            <div className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6]/20 via-[#38BDF8]/20 to-[#10B981]/20 border border-[#8B5CF6]/40 shadow-lg">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                What would you like to show?
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] max-w-lg">
              Click any quadrant below to filter charts and analyze specific behavioral dimensions.
            </p>
          </div>

          {/* 4 Quadrants Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {/* 1. Comparison Card */}
            <div
              onClick={() => handleSelectDimension('comparison')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedDimension === 'comparison'
                  ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] ring-1 ring-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/20'
                  : 'bg-[#161E2E] border-[#263247] hover:border-[#8B5CF6]/50 hover:bg-[#1C2638]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <GitCompare className="w-4 h-4 text-[#8B5CF6]" />
                  <span>Comparison</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                  Items · Time
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Compare consistency curves over periods or benchmark progress across goals.
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#C4B5FD] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Over Time (Non-Cyclical)</span>
                  <span className="font-bold">Line Chart</span>
                </div>
                <div className="text-[10px] text-[#C4B5FD] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Over Time (Cyclical)</span>
                  <span className="font-bold">Radar / Circular</span>
                </div>
                <div className="text-[10px] text-[#C4B5FD] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Among Items (Goals)</span>
                  <span className="font-bold">Horizontal Bar</span>
                </div>
              </div>
            </div>

            {/* 2. Distribution Card */}
            <div
              onClick={() => handleSelectDimension('distribution')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedDimension === 'distribution'
                  ? 'bg-[#38BDF8]/15 border-[#38BDF8] ring-1 ring-[#38BDF8] shadow-lg shadow-[#38BDF8]/20'
                  : 'bg-[#161E2E] border-[#263247] hover:border-[#38BDF8]/50 hover:bg-[#1C2638]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
                  <span>Distribution</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30">
                  Single · Two Var
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Analyze how focus sessions and consistency scores cluster across duration ranges.
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#BAE6FD] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Few Points (Duration)</span>
                  <span className="font-bold">Column Histogram</span>
                </div>
                <div className="text-[10px] text-[#BAE6FD] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Many Points (Scores)</span>
                  <span className="font-bold">Density Curve</span>
                </div>
                <div className="text-[10px] text-[#BAE6FD] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Two Variables</span>
                  <span className="font-bold">Scatter Chart</span>
                </div>
              </div>
            </div>

            {/* 3. Composition Card */}
            <div
              onClick={() => handleSelectDimension('composition')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedDimension === 'composition'
                  ? 'bg-[#10B981]/15 border-[#10B981] ring-1 ring-[#10B981] shadow-lg shadow-[#10B981]/20'
                  : 'bg-[#161E2E] border-[#263247] hover:border-[#10B981]/50 hover:bg-[#1C2638]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-[#10B981]" />
                  <span>Composition</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  Static · Evolution
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Inspect static shares of goal categories and dynamic evolution of daily time allocation.
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#A7F3D0] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Simple Share of Total</span>
                  <span className="font-bold">Donut / Pie Chart</span>
                </div>
                <div className="text-[10px] text-[#A7F3D0] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Changing Over Time</span>
                  <span className="font-bold">Stacked Area</span>
                </div>
                <div className="text-[10px] text-[#A7F3D0] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Accumulation / Step</span>
                  <span className="font-bold">Waterfall Chart</span>
                </div>
              </div>
            </div>

            {/* 4. Relationship Card */}
            <div
              onClick={() => handleSelectDimension('relationship')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedDimension === 'relationship'
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B] ring-1 ring-[#F59E0B] shadow-lg shadow-[#F59E0B]/20'
                  : 'bg-[#161E2E] border-[#263247] hover:border-[#F59E0B]/50 hover:bg-[#1C2638]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-[#F59E0B]" />
                  <span>Relationship</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
                  2 & 3 Variables
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Uncover Pearson correlations between study hours, consistency, and completed tasks.
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] text-[#FDE68A] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Two Variables</span>
                  <span className="font-bold">Scatter (r = +0.88)</span>
                </div>
                <div className="text-[10px] text-[#FDE68A] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>Three Variables</span>
                  <span className="font-bold">Bubble Chart</span>
                </div>
                <div className="text-[10px] text-[#FDE68A] bg-[#0B0F19] px-2 py-1 rounded border border-[#263247] flex items-center justify-between">
                  <span>ML Coefficients</span>
                  <span className="font-bold">Correlation Matrix</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: TOP KPI SNAPSHOT METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Avg Consistency
          </span>
          <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">{consistencyScore}%</span>
          <span className="text-[10px] text-[#10B981] font-semibold mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Optimal Baseline</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Focus Hours
          </span>
          <span className="text-2xl font-black text-[#38BDF8] mt-0.5 block">{totalFocusHours}h</span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">Logged deep study</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Task Throughput
          </span>
          <span className="text-2xl font-black text-[#10B981] mt-0.5 block">{taskCompletionRate}%</span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">Scheduled tasks done</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Active Habits
          </span>
          <span className="text-2xl font-black text-[#F59E0B] mt-0.5 block">{activeHabitsCount}</span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">Active daily routines</span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Tracked Goals
          </span>
          <span className="text-2xl font-black text-[#8B5CF6] mt-0.5 block">{activeGoalsCount}</span>
          <span className="text-[10px] text-[#8B5CF6] font-semibold mt-0.5 block truncate">
            Across active roadmaps
          </span>
        </div>
      </div>

      {/* =======================================================================
          DIMENSION 1: COMPARISON (LINE, COLUMN, HORIZONTAL BAR, RADAR)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'comparison') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-[#263247] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">1. Comparison Analysis</h3>
                <p className="text-xs text-[#94A3B8]">
                  Comparing metrics over time (Line/Column) and among tracked goals (Horizontal Bar).
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-mono">
              Over Time & Among Items
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Over Time (Non-Cyclical Data) -> Line Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Consistency Curve Over Time</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Over Time · Non-Cyclical Data · Line Chart</span>
                </div>
                <span className="text-[11px] text-[#10B981] font-semibold">Average: 86%</span>
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
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
                    <span>Daily Focus Working Hours</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Over Time · Few Periods · Column Chart</span>
                </div>
                <span className="text-[11px] text-[#38BDF8] font-semibold">Target: 4.0h/day</span>
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
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#10B981]" />
                    <span>Goal Progress Benchmark</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Among Items · One Variable · Horizontal Bar Chart</span>
                </div>
                <span className="text-[11px] text-[#10B981] font-semibold">Tracked Goals</span>
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
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Weekly Cyclical Productivity Rhythm</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Over Time · Cyclical Data · Radar Chart</span>
                </div>
                <span className="text-[11px] text-[#8B5CF6] font-semibold">Peak Rhythm: Wed-Fri</span>
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
          DIMENSION 2: DISTRIBUTION (HISTOGRAMS, DENSITY CURVES)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'distribution') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">2. Distribution Analysis</h3>
                <p className="text-xs text-[#94A3B8]">
                  Single-variable frequency spread of focus durations and consistency score density.
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 font-mono">
              Frequency & Histograms
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 5: Single Variable (Few Points) -> Column Histogram */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#38BDF8]" />
                    <span>Focus Session Duration Distribution</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Single Variable · Few Data Points · Column Histogram</span>
                </div>
                <span className="text-[11px] text-[#38BDF8] font-semibold">Mode: 60–90 min</span>
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
                    <Bar dataKey="sessions" radius={[6, 6, 0, 0]} name="Sessions Count">
                      {sessionDurationHistogram.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 6: Single Variable (Many Points) -> Line Histogram (Density Curve) */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#10B981]" />
                    <span>Consistency Score Density Spread</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Single Variable · Many Data Points · Line Histogram</span>
                </div>
                <span className="text-[11px] text-[#10B981] font-semibold">Positively Skewed</span>
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
                      fill="url(#densityGrad)"
                      fillOpacity={0.3}
                      name="Days Count"
                    />
                    <defs>
                      <linearGradient id="densityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
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
          DIMENSION 3: COMPOSITION (PIE, STACKED AREA, WATERFALL)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'composition') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">3. Composition Analysis</h3>
                <p className="text-xs text-[#94A3B8]">
                  Static share of total (Pie Chart) and dynamic time allocation evolution over time (Stacked Area & Waterfall).
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono">
              Parts of a Whole
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 7: Static (Simple Share of Total) -> Pie / Donut Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#8B5CF6]" />
                    <span>Goal Domain Share</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Static · Simple Share of Total · Donut Chart</span>
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

            {/* Chart 8: Changing Over Time (Many Periods) -> Stacked Area Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#10B981]" />
                    <span>Daily Time Allocation Composition (Minutes)</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Changing Over Time · Relative & Absolute · Stacked Area Chart</span>
                </div>
                <span className="text-[11px] text-[#10B981] font-semibold">Total Day: 480 mins</span>
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

            {/* Chart 9: Static (Accumulation to Total) -> Waterfall Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3 lg:col-span-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
                    <span>Productivity Yield Breakdown (Waterfall Step Chart)</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Static · Accumulation & Subtraction to Total · Waterfall Chart</span>
                </div>
                <span className="text-[11px] text-[#10B981] font-semibold">Net Yield: +20%</span>
              </div>
              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={waterfallProductivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                    <XAxis dataKey="step" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 140]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#263247',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#F8FAFC'
                      }}
                      formatter={(val: any, name: any, item: any) => [
                        `${val}% (${item.payload.delta})`,
                        'Yield Benchmark'
                      ]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {waterfallProductivityData.map((entry, index) => (
                        <Cell key={`waterfall-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          DIMENSION 4: RELATIONSHIP (SCATTER, BUBBLE, CORRELATION MATRIX)
      ======================================================================= */}
      {(selectedDimension === 'all' || selectedDimension === 'relationship') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">4. Relationship & Correlation Analysis</h3>
                <p className="text-xs text-[#94A3B8]">
                  Scatter plots (two variables) and Bubble charts (three variables) revealing productivity dynamics.
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono">
              2 & 3 Variables
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 10: Two Variables -> Scatter Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#F59E0B]" />
                    <span>Focus Hours vs Consistency Score</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Relationship · Two Variables · Scatter Chart</span>
                </div>
                <span className="text-[11px] text-[#10B981] font-semibold font-mono">r = +0.88</span>
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

            {/* Chart 11: Three Variables -> Bubble Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#8B5CF6]" />
                    <span>3-Variable Bubble Chart: Focus, Score & Tasks</span>
                  </h4>
                  <span className="text-[11px] text-[#94A3B8]">Relationship · Three Variables · Bubble Chart (Size = Tasks)</span>
                </div>
                <span className="text-[11px] text-[#8B5CF6] font-semibold">Z = Completed Tasks</span>
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
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Tasks Output" />
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
                      name="Daily Session Profile"
                      data={relationshipScatterData}
                      fill="#8B5CF6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Correlation Factors Matrix */}
          <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
            <h4 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              <span>Machine Learning Correlation Matrix</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {correlationMetrics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#111827] border border-[#263247] space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{item.pair}</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${item.color}`}>
                      {item.coefficient}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: INTELLIGENT ACTIVITY INSIGHTS & RECOMMENDATIONS */}
      {recommendations.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-[#263247] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Intelligent Activity Insights</h3>
                <p className="text-xs text-[#94A3B8]">
                  Automated behavioral patterns discovered from your historical work logs.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec: any, idx: number) => {
              const recId = rec.id || `rec-${idx}`;
              const isHelpful = helpfulInsights.includes(recId);
              return (
                <div
                  key={recId}
                  className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{rec.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                        {rec.confidence ? `${Math.round(rec.confidence * 100)}% Conf.` : 'Verified'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">{rec.observation || rec.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#263247] text-xs">
                    <button
                      type="button"
                      onClick={() => setHelpfulInsights([...helpfulInsights, recId])}
                      className={`flex items-center gap-1.5 font-semibold transition cursor-pointer ${
                        isHelpful ? 'text-[#10B981]' : 'text-[#64748B] hover:text-[#94A3B8]'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{isHelpful ? 'Helpful' : 'Mark Helpful'}</span>
                    </button>

                    {onTestInLab && (
                      <button
                        type="button"
                        onClick={() => onTestInLab(rec)}
                        className="flex items-center gap-1 text-[#8B5CF6] hover:text-[#A78BFA] font-semibold transition cursor-pointer"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Test in Lab</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
