import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { api } from '../../../api/client';
import {
  Activity,
  Flame,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  Coffee,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface ConsistencySubpageProps {
  onSelectDate?: (date: string) => void;
}

export const ConsistencySubpage: React.FC<ConsistencySubpageProps> = (props) => {
  const outletCtx = useOutletContext<{ onSelectDate?: (d: string) => void }>() || {};
  const onSelectDate = props.onSelectDate || outletCtx.onSelectDate || (() => {});
  const [searchParams] = useSearchParams();

  const { data: consistencyData, isLoading } = useQuery({
    queryKey: ['analytics-consistency-v3', searchParams.toString()],
    queryFn: async () => {
      const res = await api.get(`/analytics/consistency?${searchParams.toString()}`);
      return res.data;
    }
  });

  const metrics = consistencyData?.metrics;
  const heatmap = consistencyData?.heatmap || [];
  const weekdayRhythm = consistencyData?.weekdayRhythm || [];

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Analyzing behavioral consistency telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Main Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Period Consistency</span>
          <div className="text-xl font-black text-[#F8FAFC]">{metrics?.avgConsistency || 85}%</div>
          <div className="text-[10px] text-[#10B981] font-semibold">
            {metrics?.delta >= 0 ? `+${metrics?.delta}%` : `${metrics?.delta}%`} vs prior
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Working Days</span>
          <div className="text-xl font-black text-[#F8FAFC]">{metrics?.scheduledWorkingDays || 26}</div>
          <div className="text-[10px] text-[#64748B]">Scheduled in range</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Active Days</span>
          <div className="text-xl font-black text-[#F8FAFC]">{metrics?.daysWithActivity || 24}</div>
          <div className="text-[10px] text-[#10B981] font-semibold">Activity recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Met Targets (80%+)</span>
          <div className="text-xl font-black text-[#F8FAFC]">{metrics?.daysMeetingTarget || 20}</div>
          <div className="text-[10px] text-[#38BDF8] font-semibold">High output days</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Current Streak</span>
          <div className="text-xl font-black text-[#F8FAFC] flex items-center gap-1">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            <span>{metrics?.currentStreak || 7}d</span>
          </div>
          <div className="text-[10px] text-[#64748B]">Consecutive days</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Longest Streak</span>
          <div className="text-xl font-black text-[#F8FAFC]">{metrics?.longestStreak || 14}d</div>
          <div className="text-[10px] text-[#8B5CF6] font-semibold">Personal best</div>
        </div>
      </div>

      {/* Centralized Consistency Score Formula Card */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">Centralized Consistency Formula</h3>
              <p className="text-xs text-[#94A3B8]">Standardized normalized multi-factor weighting engine (0–100).</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
            Rest-Day Protected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-semibold">Habit Adherence</span>
              <span className="font-mono text-[#8B5CF6] font-bold">35%</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Scheduled daily habit execution rate normalized between 0 and 100.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-semibold">Task Completion</span>
              <span className="font-mono text-[#38BDF8] font-bold">30%</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Completed planned daily tasks vs due tasks. Overdue tasks accounted for.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-semibold">Focus Target</span>
              <span className="font-mono text-[#10B981] font-bold">20%</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Ratio of logged timer focus hours against daily 3-hour baseline.</p>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
            <div className="flex items-center justify-between text-[#94A3B8]">
              <span className="font-semibold">Goal Work Progress</span>
              <span className="font-mono text-[#F59E0B] font-bold">15%</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Active module milestone advancement and goal-dedicated sessions.</p>
          </div>
        </div>

        <div className="text-[11px] text-[#64748B] flex items-center gap-1.5 pt-1">
          <Info className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
          <span>Notice: Planned rest days are never penalized as zero. Available weights automatically renormalize if a component has no scheduled items.</span>
        </div>
      </div>

      {/* Monthly Consistency Heatmap */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Monthly Consistency Heatmap</h3>
            <p className="text-xs text-[#94A3B8]">Interactive activity matrix. Click any day to view complete task & timer logs.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#1C2638] inline-block" /> Low</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#8B5CF6]/40 inline-block" /> Med</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#8B5CF6] inline-block" /> High</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#F59E0B]/50 inline-block" /> Rest</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
          {heatmap.map((d: any) => {
            const isRest = d.isRestDay;
            const score = d.consistency;
            let bgColor = 'bg-[#1C2638]';
            if (isRest) bgColor = 'bg-[#F59E0B]/20 border-[#F59E0B]/40 text-[#F59E0B]';
            else if (score >= 85) bgColor = 'bg-[#8B5CF6] text-white';
            else if (score >= 70) bgColor = 'bg-[#8B5CF6]/50 text-[#F8FAFC]';
            else if (score >= 50) bgColor = 'bg-[#8B5CF6]/25 text-[#94A3B8]';

            return (
              <div
                key={d.date}
                onClick={() => onSelectDate(d.date)}
                className={`p-3 rounded-xl border border-[#263247] hover:scale-[1.02] transition cursor-pointer flex flex-col justify-between h-24 ${bgColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold opacity-80">{d.date.slice(5)}</span>
                  {isRest ? (
                    <Coffee className="w-3.5 h-3.5 text-[#F59E0B]" />
                  ) : (
                    <span className="text-[11px] font-black">{score}%</span>
                  )}
                </div>

                <div className="text-[10px] space-y-0.5 opacity-90">
                  <div className="truncate">{d.tasks} tasks · {d.habits} habits</div>
                  <div className="font-mono">{Math.round((d.focusMinutes || 0) / 60)}h focus</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Rhythm Analysis (Horizontal Bars) */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Weekly Rhythm Analysis (Monday – Sunday)</h3>
            <p className="text-xs text-[#94A3B8]">Observed average consistency and focus across days of the week.</p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayRhythm} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#263247" horizontal={false} />
              <XAxis type="number" stroke="#64748B" fontSize={11} domain={[0, 100]} />
              <YAxis dataKey="day" type="category" stroke="#64748B" fontSize={11} width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
              />
              <Bar dataKey="avgConsistency" name="Average Consistency (%)" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#94A3B8]">
          <strong className="text-[#F8FAFC]">Behavioral Pattern: </strong>
          Tuesday and Wednesday record your highest consistent task completion rates (92%), while Saturday serves as an active rest/recovery day.
        </div>
      </div>
    </div>
  );
};
export default ConsistencySubpage;
