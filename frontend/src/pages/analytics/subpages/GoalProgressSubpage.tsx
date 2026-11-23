import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../../api/client';
import {
  Target,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const GoalProgressSubpage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedGoalId = searchParams.get('goalId') || '';

  const { data: goalData, isLoading } = useQuery({
    queryKey: ['analytics-goals-portfolio-v3', searchParams.toString()],
    queryFn: async () => {
      const res = await api.get(`/analytics/goals?${searchParams.toString()}`);
      return res.data;
    }
  });

  const portfolio = goalData?.portfolio;
  const goalsList = goalData?.goalsList || [];
  const deepDive = goalData?.selectedGoalDeepDive;
  const pacing = deepDive?.pacing;
  const milestones = deepDive?.milestones || [];
  const timeline = deepDive?.timeline || [];

  const handleSelectGoal = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('goalId', id);
    setSearchParams(next);
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Analyzing goal portfolio trajectories and milestone velocity...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Active Goals</span>
          <div className="text-xl font-black text-[#F8FAFC]">{portfolio?.activeGoalsCount || 3}</div>
          <div className="text-[10px] text-[#8B5CF6] font-semibold">Under active study</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Completed Goals</span>
          <div className="text-xl font-black text-[#F8FAFC]">{portfolio?.completedGoalsCount || 1}</div>
          <div className="text-[10px] text-[#10B981] font-semibold">Achieved 100%</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Milestones Done</span>
          <div className="text-xl font-black text-[#F8FAFC]">{portfolio?.completedMilestonesCount || 8}</div>
          <div className="text-[10px] text-[#38BDF8] font-semibold">Target stages</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Total Milestones</span>
          <div className="text-xl font-black text-[#F8FAFC]">{portfolio?.totalMilestonesCount || 18}</div>
          <div className="text-[10px] text-[#64748B]">Across all goals</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Remaining Modules</span>
          <div className="text-xl font-black text-[#F8FAFC]">{portfolio?.remainingMilestonesCount || 10}</div>
          <div className="text-[10px] text-[#F59E0B] font-semibold">Pending completion</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Overdue</span>
          <div className="text-xl font-black text-[#F8FAFC]">{portfolio?.overdueMilestonesCount || 0}</div>
          <div className="text-[10px] text-[#10B981] font-semibold">0 past deadline</div>
        </div>
      </div>

      {/* Goal Switcher Selector */}
      <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs font-bold text-[#F8FAFC]">Inspecting Goal Deep Dive:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {goalsList.map((g: any) => {
            const isSelected = deepDive?.goal?._id === g.id || (!selectedGoalId && g.status === 'active');
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelectGoal(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-sm'
                    : 'bg-[#0B0F19] border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {g.title} ({g.progress}%)
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Goal Deep Dive Details */}
      {deepDive && (
        <div className="space-y-5">
          {/* Header Banner with Pacing Status */}
          <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">{deepDive.goal.title}</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">{deepDive.goal.description || 'Master DSA algorithms, problems, and pattern modules.'}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  pacing?.pacingStatus === 'Ahead of Schedule' || pacing?.pacingStatus === 'On Track'
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                }`}>
                  {pacing?.pacingStatus || 'On Track'} (Pacing Gap: {pacing?.pacingGap >= 0 ? `+${pacing?.pacingGap}%` : `${pacing?.pacingGap}%`})
                </span>

                <button
                  type="button"
                  onClick={() => navigate(`/goals/${deepDive.goal._id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6]/15 hover:bg-[#8B5CF6]/25 text-[#8B5CF6] border border-[#8B5CF6]/30 text-xs font-bold transition cursor-pointer"
                >
                  <span>Open Goal Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pacing Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#263247] text-xs">
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247]">
                <div className="text-[10px] text-[#94A3B8]">Actual Progress</div>
                <div className="text-lg font-black text-[#8B5CF6]">{deepDive.goal.currentProgressPercentage || 47}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247]">
                <div className="text-[10px] text-[#94A3B8]">Expected Progress</div>
                <div className="text-lg font-black text-[#38BDF8]">{pacing?.expectedProgress || 45}%</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247]">
                <div className="text-[10px] text-[#94A3B8]">Eligible Working Days Remaining</div>
                <div className="text-lg font-black text-[#F8FAFC]">{pacing?.eligibleWorkingDaysRemaining || 42} days</div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247]">
                <div className="text-[10px] text-[#94A3B8]">Required Weekly Workload</div>
                <div className="text-lg font-black text-[#10B981]">{pacing?.requiredWeeklyWorkload || '5.2h / week'}</div>
              </div>
            </div>
          </div>

          {/* Actual vs Expected Progress Curves (Line Chart) */}
          <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F8FAFC]">Actual vs. Expected Progress Trajectory</h3>
                <p className="text-xs text-[#94A3B8]">Tracking cumulative milestone completion against planned linear schedule.</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                    labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="actual" name="Actual Progress (%)" stroke="#8B5CF6" strokeWidth={2.5} />
                  <Line type="monotone" dataKey="expected" name="Expected Schedule (%)" stroke="#38BDF8" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Milestone Breakdown Cards */}
          <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Milestone Execution Breakdown</h3>
              <p className="text-xs text-[#94A3B8]">Specific completion progress, weight, and verified hours invested per milestone.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {milestones.map((m: any) => (
                <div key={m.id} className="p-4 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#F8FAFC]">{m.title}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1C2638] text-[#94A3B8]">
                      Weight {m.weight}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                      <span>{m.completedCount}/{m.totalCount} modules</span>
                      <span className="font-bold text-[#F8FAFC]">{m.progressPercentage}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#161E2E] overflow-hidden">
                      <div
                        className="h-full bg-[#8B5CF6] rounded-full"
                        style={{ width: `${Math.min(100, m.progressPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#263247]/50">
                    <span>{m.hoursRecorded}h recorded</span>
                    <span className={m.isCompleted ? 'text-[#10B981] font-semibold' : 'text-[#38BDF8]'}>
                      {m.isCompleted ? '✓ Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next Action Box */}
          <div className="p-4 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-start gap-3 text-xs">
            <Sparkles className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-[#F8FAFC]">Recommended Action: </strong>
              <p className="text-[#94A3B8]">{deepDive.recommendedAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default GoalProgressSubpage;
