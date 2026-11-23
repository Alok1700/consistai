import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../../api/client';
import {
  Activity,
  Clock,
  CheckCircle2,
  Target,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Calendar,
  Flame,
  Layers,
  ChevronRight,
  Compass,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { RecommendationCard } from '../components/RecommendationCard';

interface OverviewSubpageProps {
  onSelectDate?: (date: string) => void;
  onTestInLab?: (recommendation: any) => void;
}

export const OverviewSubpage: React.FC<OverviewSubpageProps> = (props) => {
  const outletCtx = useOutletContext<{ onSelectDate?: (d: string) => void; onTestInLab?: (r: any) => void }>() || {};
  const onSelectDate = props.onSelectDate || outletCtx.onSelectDate || (() => {});
  const onTestInLab = props.onTestInLab || outletCtx.onTestInLab || (() => {});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { data: overviewData, isLoading } = useQuery({
    queryKey: ['analytics-overview-v3', searchParams.toString()],
    queryFn: async () => {
      const res = await api.get(`/analytics/overview?${searchParams.toString()}`);
      return res.data;
    }
  });

  const kpis = overviewData?.kpis;
  const trend = overviewData?.trend || [];
  const goals = overviewData?.goals || [];
  const recommendations = overviewData?.recommendations || [];

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Synthesizing workspace performance telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SECTION A: PERFORMANCE SUMMARY */}
      <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] flex items-start gap-3 shadow-sm">
        <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-[#F8FAFC]">Executive Performance Summary</div>
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
            {overviewData?.summary || 'Your consistency remains steady. Analyze the detailed breakdowns below to identify optimal focus windows and velocity drivers.'}
          </p>
        </div>
      </div>

      {/* CHART SUGGESTIONS TAXONOMY CALLOUT BANNER */}
      <div 
        onClick={() => navigate('/analytics/chart-suggestions')}
        className="p-4 rounded-2xl bg-gradient-to-r from-[#161E2E] via-[#1C2638] to-[#161E2E] border border-[#8B5CF6]/40 hover:border-[#8B5CF6] transition-all cursor-pointer shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/40 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F8FAFC]">Chart Suggestions — A Thought-Starter</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">4 Dimensions</span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Explore your telemetry across Comparison, Distribution, Composition, and Relationship decision branches.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6] group-hover:translate-x-1 transition-transform self-end sm:self-center shrink-0">
          <span>Open Chart Matrix</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* SECTION B: 4 KEY PERFORMANCE INDICATORS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Consistency Score */}
        <div
          onClick={() => navigate('/analytics/consistency')}
          className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] hover:border-[#8B5CF6]/50 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94A3B8]">Consistency Score</span>
            <div className="p-1.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#F8FAFC]">
              {kpis?.consistency?.current || 86}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {(kpis?.consistency?.delta || 0) >= 0 ? (
                <span className="text-[#10B981] font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.consistency?.delta || 4}%
                </span>
              ) : (
                <span className="text-[#EF4444] font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {kpis?.consistency?.delta}%
                </span>
              )}
              <span className="text-[#64748B]">vs prior period ({kpis?.consistency?.previous || 82}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Focused Working Hours */}
        <div
          onClick={() => navigate('/analytics/time-focus')}
          className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] hover:border-[#38BDF8]/50 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94A3B8]">Focused Hours</span>
            <div className="p-1.5 rounded-lg bg-[#38BDF8]/15 text-[#38BDF8]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#F8FAFC]">
              {kpis?.focusHours?.current || 24.5} <span className="text-xs font-normal text-[#94A3B8]">hrs</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {(kpis?.focusHours?.delta || 0) >= 0 ? (
                <span className="text-[#10B981] font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.focusHours?.delta || 3.2}h
                </span>
              ) : (
                <span className="text-[#EF4444] font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {kpis?.focusHours?.delta}h
                </span>
              )}
              <span className="text-[#64748B]">vs prior period ({kpis?.focusHours?.previous || 21.3}h)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Task Completion Rate */}
        <div
          onClick={() => navigate('/analytics/consistency')}
          className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] hover:border-[#10B981]/50 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94A3B8]">Task Completion Rate</span>
            <div className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#F8FAFC]">
              {kpis?.taskCompletionRate?.current || 82}%
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {(kpis?.taskCompletionRate?.delta || 0) >= 0 ? (
                <span className="text-[#10B981] font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.taskCompletionRate?.delta || 6} pp
                </span>
              ) : (
                <span className="text-[#EF4444] font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {kpis?.taskCompletionRate?.delta} pp
                </span>
              )}
              <span className="text-[#64748B]">vs prior ({kpis?.taskCompletionRate?.previous || 76}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Completed Goal Modules */}
        <div
          onClick={() => navigate('/analytics/goals')}
          className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] hover:border-[#F59E0B]/50 transition cursor-pointer space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#94A3B8]">Completed Modules</span>
            <div className="p-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#F8FAFC]">
              {kpis?.completedModules?.current || 14} <span className="text-xs font-normal text-[#94A3B8]">modules</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {(kpis?.completedModules?.delta || 0) >= 0 ? (
                <span className="text-[#10B981] font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis?.completedModules?.delta || 5}
                </span>
              ) : (
                <span className="text-[#EF4444] font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {kpis?.completedModules?.delta}
                </span>
              )}
              <span className="text-[#64748B]">vs prior period ({kpis?.completedModules?.previous || 9})</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C & D: CHARTS (OVERALL TREND & DAILY WORKING HOURS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section C: Consistency Trend */}
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Overall Consistency Trend</h3>
              <p className="text-xs text-[#94A3B8]">Daily score vs 85% benchmark. Click a date to inspect activities.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
              Target: 85%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} onClick={(state) => {
                if (state && state.activeLabel) onSelectDate(String(state.activeLabel));
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#64748B" fontSize={11} domain={[40, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="consistency"
                  name="Consistency Score"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#8B5CF6' }}
                  activeDot={{ r: 6, fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section D: Daily Working Hours (Actual vs Planned) */}
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Daily Focused Working Hours</h3>
              <p className="text-xs text-[#94A3B8]">Actual hours recorded vs scheduled target (3.0h).</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
              Hours Logged
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} onClick={(state) => {
                if (state && state.activeLabel) onSelectDate(String(state.activeLabel));
              }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 8]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Bar dataKey="workHours" name="Actual Work Hours" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION E: ACTIVE GOALS PERFORMANCE */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Active Goal Portfolios & Pacing</h3>
            <p className="text-xs text-[#94A3B8]">Current milestone progress against scheduled calendar time.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/analytics/goals')}
            className="flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] hover:text-[#7C3AED] transition cursor-pointer"
          >
            <span>View All Goal Analytics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((g: any) => (
            <div
              key={g.id}
              onClick={() => navigate(`/analytics/goals?goalId=${g.id}`)}
              className="p-4 rounded-xl bg-[#0B0F19] border border-[#263247] hover:border-[#8B5CF6]/50 transition cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC] truncate max-w-[180px]">{g.title}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  g.pacingStatus === 'Ahead of Schedule' || g.pacingStatus === 'On Track'
                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                    : 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                }`}>
                  {g.pacingStatus || 'On Track'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                  <span>Progress</span>
                  <span className="font-bold text-[#F8FAFC]">{g.progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#161E2E] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, g.progress)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION F: TOP IMPROVEMENT OPPORTUNITIES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Priority Workflow Improvements</h3>
            <p className="text-xs text-[#94A3B8]">Plain-language behavioral adjustments derived from your recent activity records.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/analytics/improvement-lab')}
            className="flex items-center gap-1 text-xs font-semibold text-[#8B5CF6] hover:text-[#7C3AED] transition cursor-pointer"
          >
            <span>Open Improvement Lab</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#161E2E] border border-[#263247] text-center space-y-1.5 text-xs text-[#94A3B8]">
            <Info className="w-5 h-5 text-[#8B5CF6] mx-auto opacity-70" />
            <p className="font-semibold text-[#F8FAFC]">Keep logging your daily work</p>
            <p>Our machine learning engine will synthesize targeted workflow recommendations once 3+ days of telemetry are logged.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec: any) => (
              <RecommendationCard
                key={rec.id || rec._id}
                recommendation={rec}
                onTestInLab={onTestInLab}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default OverviewSubpage;
