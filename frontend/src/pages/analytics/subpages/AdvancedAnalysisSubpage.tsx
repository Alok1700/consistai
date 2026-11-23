import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { Goal } from '../../../types';
import {
  LineChart as LineChartIcon,
  BarChart3,
  PieChart as PieChartIcon,
  ScatterChart as ScatterIcon,
  GitCompare,
  Layers,
  Activity,
  Target,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Sliders,
  HelpCircle,
  Compass,
  ArrowRight
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

export const AdvancedAnalysisSubpage: React.FC = () => {
  const [selectedDimension, setSelectedDimension] = useState<AnalyticsDimension>('all');
  const [showThoughtStarterGuide, setShowThoughtStarterGuide] = useState<boolean>(true);

  // Fetch Overview Analytics
  const { data: overviewData } = useQuery({
    queryKey: ['analytics-overview-advanced'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview?range=30d');
      return res.data;
    }
  });

  const { data: goalsData } = useQuery<{ goals: Goal[] }>({
    queryKey: ['goals-list-advanced'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  const goals = useMemo(() => goalsData?.goals || [], [goalsData?.goals]);

  // Comparison Trend Data
  const comparisonTrendData = useMemo(() => {
    if (overviewData?.trend && overviewData.trend.length > 0) {
      return overviewData.trend.slice(-14).map((item: any, idx: number) => ({
        day: item.date ? item.date.slice(5) : `D${idx + 1}`,
        consistency: item.consistency || 80,
        workHours: Number(item.workHours) || 3.5,
        targetPace: 85,
        goalDelta: item.goalDelta || 2
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
  }, [overviewData?.trend]);

  // Goal Items Comparison
  const goalItemsComparisonData = useMemo(() => {
    if (goals.length > 0) {
      return goals.slice(0, 5).map((g) => ({
        name: g.title.length > 18 ? g.title.slice(0, 16) + '…' : g.title,
        progress: g.currentProgressPercentage || 0,
        totalModules: 30,
        completedModules: Math.round(((g.currentProgressPercentage || 0) / 100) * 30)
      }));
    }
    return [
      { name: 'DSA & LeetCode', progress: 47, totalModules: 30, completedModules: 14 },
      { name: 'MERN Portfolio', progress: 50, totalModules: 2, completedModules: 1 },
      { name: 'System Design', progress: 25, totalModules: 20, completedModules: 5 }
    ];
  }, [goals]);

  // Radar Cyclical Data
  const cyclicalRhythmData = [
    { subject: 'Mon', consistency: 82, focus: 85, capacity: 100 },
    { subject: 'Tue', consistency: 89, focus: 92, capacity: 100 },
    { subject: 'Wed', consistency: 94, focus: 96, capacity: 100 },
    { subject: 'Thu', consistency: 85, focus: 80, capacity: 100 },
    { subject: 'Fri', consistency: 90, focus: 88, capacity: 100 },
    { subject: 'Sat', consistency: 74, focus: 65, capacity: 100 },
    { subject: 'Sun', consistency: 86, focus: 84, capacity: 100 }
  ];

  // Distribution Histograms
  const durationHistogramData = [
    { bucket: '< 30m', count: 4, label: 'Micro Sprint' },
    { bucket: '30-60m', count: 14, label: 'Standard Deep Work' },
    { bucket: '60-90m', count: 9, label: 'Extended Block' },
    { bucket: '90-120m', count: 5, label: 'Marathon' },
    { bucket: '> 120m', count: 2, label: 'Ultra Session' }
  ];

  const consistencyDensityData = [
    { score: '60-65', frequency: 1, density: 0.05 },
    { score: '65-70', frequency: 2, density: 0.10 },
    { score: '70-75', frequency: 4, density: 0.20 },
    { score: '75-80', frequency: 7, density: 0.35 },
    { score: '80-85', frequency: 12, density: 0.60 },
    { score: '85-90', frequency: 18, density: 0.90 },
    { score: '90-95', frequency: 14, density: 0.70 },
    { score: '95-100', frequency: 6, density: 0.30 }
  ];

  // Composition Data
  const categoryShareData = [
    { name: 'Algorithms (DSA)', value: 45, color: '#8B5CF6' },
    { name: 'Frontend Engineering', value: 25, color: '#38BDF8' },
    { name: 'Backend Architecture', value: 20, color: '#10B981' },
    { name: 'System Design', value: 10, color: '#F59E0B' }
  ];

  const timeAllocationCompositionData = [
    { day: 'D1', deepWork: 180, habits: 45, distraction: 30, rest: 60 },
    { day: 'D2', deepWork: 240, habits: 50, distraction: 20, rest: 45 },
    { day: 'D3', deepWork: 210, habits: 40, distraction: 45, rest: 60 },
    { day: 'D4', deepWork: 270, habits: 60, distraction: 15, rest: 30 },
    { day: 'D5', deepWork: 190, habits: 45, distraction: 50, rest: 75 },
    { day: 'D6', deepWork: 120, habits: 30, distraction: 90, rest: 120 },
    { day: 'D7', deepWork: 220, habits: 55, distraction: 35, rest: 50 }
  ];

  // Relationship Data
  const scatterRelationshipData = [
    { focusHours: 1.5, consistencyScore: 68, tasksCompleted: 2 },
    { focusHours: 2.0, consistencyScore: 72, tasksCompleted: 3 },
    { focusHours: 2.5, consistencyScore: 76, tasksCompleted: 3 },
    { focusHours: 3.0, consistencyScore: 82, tasksCompleted: 4 },
    { focusHours: 3.5, consistencyScore: 85, tasksCompleted: 5 },
    { focusHours: 4.0, consistencyScore: 89, tasksCompleted: 6 },
    { focusHours: 4.5, consistencyScore: 92, tasksCompleted: 7 },
    { focusHours: 5.0, consistencyScore: 95, tasksCompleted: 8 }
  ];

  const bubbleMultivariateData = scatterRelationshipData.map((d) => ({
    x: d.focusHours,
    y: d.consistencyScore,
    z: d.tasksCompleted * 12
  }));

  return (
    <div className="space-y-6">
      {/* 4-Quadrant Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs font-bold text-[#F8FAFC]">Framework Dimension:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'comparison', 'distribution', 'composition', 'relationship'] as AnalyticsDimension[]).map((dim) => (
            <button
              key={dim}
              type="button"
              onClick={() => setSelectedDimension(dim)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                selectedDimension === dim
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-[#0B0F19] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#263247]'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Thought-Starter Guide */}
      {showThoughtStarterGuide && (
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-[#263247] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#F8FAFC] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              Dr. Andrew Abela's Chart Suggestions Thought-Starter
            </span>
            <button
              type="button"
              onClick={() => setShowThoughtStarterGuide(false)}
              className="text-[#64748B] hover:text-[#94A3B8] transition cursor-pointer text-xs"
            >
              Dismiss Guide
            </button>
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Every chart type answers a distinct analytical question: <strong>Comparison</strong> contrasts variables over time or among items; <strong>Distribution</strong> maps frequency across ranges; <strong>Composition</strong> calculates static or dynamic component shares; and <strong>Relationship</strong> inspects correlations between multiple continuous variables.
          </p>
        </div>
      )}

      {/* 1. COMPARISON ANALYSIS */}
      {(selectedDimension === 'all' || selectedDimension === 'comparison') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#263247] pb-2">
            <GitCompare className="w-4 h-4 text-[#8B5CF6]" />
            <h3 className="text-base font-bold text-[#F8FAFC]">1. Comparison Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-[#8B5CF6]" />
                Consistency Curve Over Time (Non-Cyclical)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[60, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="consistency" stroke="#8B5CF6" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="targetPace" stroke="#38BDF8" strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Column Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#38BDF8]" />
                Daily Focus Working Hours (Single Category Over Time)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Bar dataKey="workHours" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#10B981]" />
                Goal Progress Comparison (Among Items)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalItemsComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" horizontal={false} />
                    <XAxis type="number" stroke="#64748B" fontSize={11} domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Bar dataKey="progress" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Cyclical Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#8B5CF6]" />
                Weekly Cyclical Rhythm (Radar Periodicity)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={70} data={cyclicalRhythmData}>
                    <PolarGrid stroke="#263247" />
                    <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                    <PolarRadiusAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                    <Radar name="Consistency" dataKey="consistency" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.4} />
                    <Radar name="Focus Depth" dataKey="focus" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DISTRIBUTION ANALYSIS */}
      {(selectedDimension === 'all' || selectedDimension === 'distribution') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#263247] pb-2">
            <Clock className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-base font-bold text-[#F8FAFC]">2. Distribution Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column Histogram */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC]">Focus Session Duration Distribution (Column Histogram)</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationHistogramData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis dataKey="bucket" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Density Curve */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC]">Consistency Score Frequency Density (Smooth Curve)</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consistencyDensityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis dataKey="score" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Area type="basis" dataKey="frequency" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPOSITION ANALYSIS */}
      {(selectedDimension === 'all' || selectedDimension === 'composition') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#263247] pb-2">
            <Layers className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-base font-bold text-[#F8FAFC]">3. Composition Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut Share */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC]">Goal Category Share (Static Share of Total)</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryShareData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {categoryShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stacked Area */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC]">Daily Time Allocation Composition (Minutes Over Time)</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeAllocationCompositionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="deepWork" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="habits" stackId="1" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="distraction" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. RELATIONSHIP & CORRELATION */}
      {(selectedDimension === 'all' || selectedDimension === 'relationship') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#263247] pb-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-base font-bold text-[#F8FAFC]">4. Relationship & Correlation Analysis</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Scatter Plot */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#F8FAFC]">Focus Hours vs. Consistency Score (2 Variables)</h4>
                <span className="text-[10px] font-mono text-[#10B981] font-bold">r = +0.84</span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis type="number" dataKey="focusHours" name="Focus Hours" stroke="#64748B" fontSize={11} unit="h" />
                    <YAxis type="number" dataKey="consistencyScore" name="Consistency" stroke="#64748B" fontSize={11} unit="%" domain={[60, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Scatter name="Days" data={scatterRelationshipData} fill="#F59E0B" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bubble Chart */}
            <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
              <h4 className="text-xs font-bold text-[#F8FAFC]">3-Variable Bubble Chart (Focus, Consistency & Tasks)</h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                    <XAxis type="number" dataKey="x" name="Focus Hours" stroke="#64748B" fontSize={11} unit="h" />
                    <YAxis type="number" dataKey="y" name="Consistency" stroke="#64748B" fontSize={11} unit="%" domain={[60, 100]} />
                    <ZAxis type="number" dataKey="z" range={[60, 400]} name="Tasks" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }} />
                    <Scatter name="Multivariate Days" data={bubbleMultivariateData} fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdvancedAnalysisSubpage;
