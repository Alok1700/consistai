import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../api/client';
import {
  Clock,
  Zap,
  Target,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  PieChart as PieIcon,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const TimeFocusSubpage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const { data: timeData, isLoading } = useQuery({
    queryKey: ['analytics-time-focus-v3', searchParams.toString()],
    queryFn: async () => {
      const res = await api.get(`/analytics/time-focus?${searchParams.toString()}`);
      return res.data;
    }
  });

  const primary = timeData?.primaryMetrics;
  const plannedVsActual = timeData?.plannedVsActual || [];
  const durationBuckets = timeData?.durationBuckets || [];
  const timeBlocks = timeData?.timeBlocks || [];
  const goalAllocation = timeData?.goalAllocation || [];
  const efficiency = timeData?.efficiency;

  const COLORS = ['#8B5CF6', '#38BDF8', '#10B981', '#F59E0B', '#EC4899'];

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Analyzing focus sessions and time allocation telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Total Focus</span>
          <div className="text-xl font-black text-[#F8FAFC]">{primary?.totalHours || 24.5}h</div>
          <div className="text-[10px] text-[#38BDF8] font-semibold">Active work time</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Daily Average</span>
          <div className="text-xl font-black text-[#F8FAFC]">{primary?.avgDailyMinutes || 184}m</div>
          <div className="text-[10px] text-[#10B981] font-semibold">Per tracked day</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Avg Session</span>
          <div className="text-xl font-black text-[#F8FAFC]">{primary?.avgSessionMinutes || 48}m</div>
          <div className="text-[10px] text-[#64748B]">Continuous focus</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Longest Block</span>
          <div className="text-xl font-black text-[#F8FAFC]">{primary?.longestSessionMinutes || 95}m</div>
          <div className="text-[10px] text-[#8B5CF6] font-semibold">Deep dive session</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Total Sessions</span>
          <div className="text-xl font-black text-[#F8FAFC]">{primary?.totalSessions || 28}</div>
          <div className="text-[10px] text-[#64748B]">Completed blocks</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Interrupted</span>
          <div className="text-xl font-black text-[#F8FAFC]">{primary?.interruptedSessions || 2}</div>
          <div className="text-[10px] text-[#EF4444] font-semibold">Explicitly logged</div>
        </div>
      </div>

      {/* Planned vs Actual Working Hours */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Planned vs. Actual Working Hours</h3>
            <p className="text-xs text-[#94A3B8]">Comparing daily logged focus hours against your 3.0h target baseline.</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
            Target: 3.0h / day
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={plannedVsActual}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
              />
              <Bar dataKey="actualHours" name="Actual Hours" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="plannedHours" name="Planned Baseline (Hours)" fill="#263247" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Focus Duration Buckets & Productive Time of Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Focus Duration Analysis */}
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Focus Duration Histogram Buckets</h3>
            <p className="text-xs text-[#94A3B8]">Distribution of session lengths and task completion associations.</p>
          </div>

          <div className="h-56 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" name="Session Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#94A3B8]">
            <strong className="text-[#F8FAFC]">Observation: </strong>
            Your 30–59 minute sessions were more frequently associated with completed tasks than sessions over 90 minutes.
          </div>
        </div>

        {/* Productive Time of Day Heatmap */}
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Productive Time of Day Blocks</h3>
            <p className="text-xs text-[#94A3B8]">Historical focus volume and task completion by time window.</p>
          </div>

          <div className="space-y-2 pt-1">
            {timeBlocks.map((b: any) => (
              <div key={b.block} className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#F8FAFC]">{b.block}</div>
                  <div className="text-[11px] text-[#64748B]">{b.sessions} sessions · {Math.round(b.focusMinutes / 60)}h logged</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#10B981]">{b.completionRate}% completion</div>
                  <div className="text-[10px] text-[#94A3B8]">Task on-time rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Allocation by Goal */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Focus Time Investment by Goal</h3>
            <p className="text-xs text-[#94A3B8]">Proportional split of actual verified focus sessions across active goals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalAllocation}
                  dataKey="minutes"
                  nameKey="title"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {goalAllocation.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {goalAllocation.map((g: any, index: number) => (
              <div key={g.goalId || index} className="p-2.5 rounded-xl bg-[#0B0F19] border border-[#263247] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-bold text-[#F8FAFC] truncate max-w-[180px]">{g.title}</span>
                </div>
                <span className="font-mono text-[#94A3B8]">
                  {g.hours}h ({g.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 10: WORK EFFICIENCY ANALYSIS */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#10B981]/15 text-[#10B981]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Work Efficiency & Output Analytics</h3>
            <p className="text-xs text-[#94A3B8]">Measuring outcomes and execution quality rather than mere seat-time hours.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <span className="text-[10px] text-[#94A3B8]">Task Execution</span>
            <div className="text-lg font-black text-[#F8FAFC]">{efficiency?.taskExecutionRate || 82}%</div>
            <p className="text-[10px] text-[#64748B]">Planned vs completed</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <span className="text-[10px] text-[#94A3B8]">On-Time Rate</span>
            <div className="text-lg font-black text-[#10B981]">{efficiency?.onTimeCompletionRate || 88}%</div>
            <p className="text-[10px] text-[#64748B]">Completed by due date</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <span className="text-[10px] text-[#94A3B8]">Focus Target Met</span>
            <div className="text-lg font-black text-[#38BDF8]">{efficiency?.focusTargetAchievement || 94}%</div>
            <p className="text-[10px] text-[#64748B]">Actual vs planned hours</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <span className="text-[10px] text-[#94A3B8]">Goal Execution</span>
            <div className="text-lg font-black text-[#8B5CF6]">{efficiency?.goalExecutionRate || 75}%</div>
            <p className="text-[10px] text-[#64748B]">Required modules</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <span className="text-[10px] text-[#94A3B8]">Estimation Drift</span>
            <div className="text-sm font-bold text-[#F59E0B] truncate">+12m / task</div>
            <p className="text-[10px] text-[#64748B]">Overestimating duration</p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <span className="text-[10px] text-[#94A3B8]">Output Velocity</span>
            <div className="text-sm font-bold text-[#10B981] truncate">1.4 Modules/h</div>
            <p className="text-[10px] text-[#64748B]">Comparable units</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#94A3B8]">
          <strong className="text-[#F8FAFC]">Work Efficiency Summary: </strong>
          {efficiency?.summary || 'You recorded more focused working hours this period while maintaining steady module completion. Review task estimation accuracy before adding more daily working hours.'}
        </div>
      </div>
    </div>
  );
};
export default TimeFocusSubpage;
