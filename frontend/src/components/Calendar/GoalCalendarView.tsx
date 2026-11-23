import React from 'react';
import {
  Target,
  Trophy,
  Star,
  Clock,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { DayMetric } from '../../pages/CalendarPage';
import { Goal } from '../../types';

interface GoalCalendarViewProps {
  year: number;
  month: number;
  daysData: Record<string, DayMetric>;
  goals?: Goal[];
  selectedGoalId?: string;
  onSelectGoalId?: (goalId: string) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectDate: (date: string) => void;
  hideHeaderNav?: boolean;
}

export const GoalCalendarView: React.FC<GoalCalendarViewProps> = ({
  year,
  month,
  daysData,
  goals = [],
  selectedGoalId = 'all',
  onSelectGoalId,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  hideHeaderNav = false
}) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // Goal KPI calculations
  const list = Object.values(daysData);
  let totalDelta = 0;
  let totalMilestones = 0;
  let meaningfulDays = 0;
  let totalGoalMinutes = 0;
  let restDays = 0;

  list.forEach(d => {
    totalDelta += d.goalProgressDelta || 0;
    totalMilestones += d.milestonesCompletedCount || 0;
    if (d.hasMeaningfulProgress) meaningfulDays += 1;
    totalGoalMinutes += d.goalWorkMinutes || 0;
    if (d.isHolidayOrRestDay) restDays += 1;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Goal Manager & Milestones Calendar</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/60 border border-teal-700/60 text-teal-300 font-semibold">
                Goals Module
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Tracks verified milestone achievements, quantitative goal progress deltas, and study sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Goal Selector */}
          {onSelectGoalId && goals.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={selectedGoalId}
                onChange={(e) => onSelectGoalId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Tracked Goals</option>
                {goals.map(g => (
                  <option key={g._id} value={g._id} className="bg-slate-900 text-white">
                    🎯 {g.title} ({g.currentProgressPercentage}%)
                  </option>
                ))}
              </select>
            </div>
          )}

          {!hideHeaderNav && onPrevMonth && onNextMonth && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={onPrevMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-xs text-white px-2 min-w-[110px] text-center">
                {monthNames[month - 1]} {year}
              </span>
              <button
                onClick={onNextMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Goal Specific KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40">
          <span className="text-[10px] font-medium text-teal-400 flex items-center gap-1">
            <Target className="w-3 h-3" /> Net Progress Gained
          </span>
          <p className="text-lg font-bold text-teal-400 mt-0.5">+{totalDelta.toFixed(1)}%</p>
        </div>
        <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40">
          <span className="text-[10px] font-medium text-teal-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" /> Milestones Completed
          </span>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{totalMilestones} Milestones</p>
        </div>
        <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40">
          <span className="text-[10px] font-medium text-teal-400 flex items-center gap-1">
            <Star className="w-3 h-3 text-emerald-400" /> Breakthrough Days
          </span>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{meaningfulDays} Days</p>
        </div>
        <div className="p-2.5 rounded-xl bg-teal-950/20 border border-teal-800/40">
          <span className="text-[10px] font-medium text-teal-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" /> Goal Work Hours
          </span>
          <p className="text-lg font-bold text-cyan-400 mt-0.5">{Math.round(totalGoalMinutes / 60)} hrs</p>
        </div>
      </div>

      {/* Goal Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 px-3 py-2 rounded-xl">
        <span className="font-semibold text-slate-300">Goal Heatmap:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-[8px] shadow-xs shadow-amber-400/50">★</div>
          <span>Milestone Achieved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          <span>Progress Jump (&ge; 2.0%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-teal-500/80" />
          <span>Progress Gained (&gt; 0%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-slate-800" />
          <span>Routine Maintenance / Zero Delta</span>
        </div>
      </div>

      {/* 7-Day Calendar Grid */}
      <div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-800">
          <span className="text-rose-400/80">Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span className="text-indigo-400/80">Sat</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[92px] rounded-xl bg-slate-950/20 border border-transparent" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const data = daysData[dStr];
            const isToday = dStr === todayStr;
            const isRest = data?.isHolidayOrRestDay;
            const hasMilestone = (data?.milestonesCompletedCount || 0) > 0;
            const goalDelta = data ? data.goalProgressDelta : 0;

            let tileClass = 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 opacity-80';
            if (isRest) {
              tileClass = 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600/70 opacity-100';
            } else if (hasMilestone) {
              tileClass = 'bg-amber-950/25 border-amber-400/80 hover:border-amber-300 shadow-md shadow-amber-500/10 opacity-100';
            } else if (goalDelta >= 2.0) {
              tileClass = 'bg-emerald-950/35 border-emerald-500/70 hover:border-emerald-400 shadow-sm opacity-100';
            } else if (goalDelta > 0) {
              tileClass = 'bg-teal-950/25 border-teal-600/50 hover:border-teal-400 opacity-100';
            }

            return (
              <div
                key={dStr}
                onClick={() => onSelectDate(dStr)}
                className={`min-h-[95px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${tileClass} ${
                  isToday ? 'ring-2 ring-teal-500/80' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isToday ? 'text-teal-400 bg-teal-500/15 px-1 rounded' : isRest ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    {dayNum}
                  </span>
                  <div className="flex items-center gap-1">
                    {isRest && (
                      <span title={data?.restDayNote || 'Rest Day'} className="text-amber-400">
                        <Coffee className="w-3 h-3" />
                      </span>
                    )}
                    {hasMilestone && (
                      <span title={`${data?.milestonesCompletedCount} Milestone Completed!`} className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px]">
                        ★
                      </span>
                    )}
                  </div>
                </div>

                {data ? (
                  <div className="space-y-1 my-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Gain:</span>
                      <span className={`font-bold px-1 py-0.2 rounded text-[9px] ${
                        hasMilestone
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : goalDelta >= 2.0
                          ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/70'
                          : goalDelta > 0
                          ? 'bg-teal-950/70 text-teal-300 border border-teal-700/60'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {goalDelta > 0 ? `+${goalDelta}%` : '0%'}
                      </span>
                    </div>

                    {hasMilestone ? (
                      <div className="px-1 py-0.5 rounded bg-amber-950/50 border border-amber-500/40 text-[9px] font-bold text-amber-300 text-center truncate">
                        ★ Milestone Done!
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[9px] text-slate-400">
                        <span>Work:</span>
                        <span className="text-cyan-400 font-medium">
                          {Math.round((data.goalWorkMinutes || 0) / 60)}h
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                      <span>Milestones:</span>
                      <span className={data.milestonesCompletedCount > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                        {data.milestonesCompletedCount} done
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic py-2 text-center">No Activity</div>
                )}

                <div className="pt-0.5 border-t border-slate-800/60 text-[9px] text-slate-500 flex justify-between font-mono">
                  <span>Goal</span>
                  <span className={goalDelta > 0 ? 'text-teal-400 font-bold' : 'text-slate-500'}>
                    {goalDelta > 0 ? 'Progress' : 'Routine'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};