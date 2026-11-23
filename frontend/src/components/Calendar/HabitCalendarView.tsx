import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Flame,
  Coffee,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DayMetric } from '../../pages/CalendarPage';

interface HabitCalendarViewProps {
  year: number;
  month: number;
  daysData: Record<string, DayMetric>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectDate: (date: string) => void;
  hideHeaderNav?: boolean;
}

export const HabitCalendarView: React.FC<HabitCalendarViewProps> = ({
  year,
  month,
  daysData,
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

  // Habit KPI calculations
  const list = Object.values(daysData);
  let totalScheduled = 0;
  let totalCompleted = 0;
  let daysWithHabits = 0;
  let sumRate = 0;
  let highAdherenceDays = 0;
  let restDays = 0;

  list.forEach(d => {
    totalScheduled += d.scheduledHabits || 0;
    totalCompleted += d.completedHabits || 0;
    if (d.scheduledHabits > 0) {
      daysWithHabits += 1;
      sumRate += d.habitAdherenceRate || 0;
      if (d.habitAdherenceRate >= 0.8) highAdherenceDays += 1;
    }
    if (d.isHolidayOrRestDay) restDays += 1;
  });

  const avgAdherenceRate = daysWithHabits > 0 ? Math.round((sumRate / daysWithHabits) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Habit Tracker Consistency Calendar</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-700/60 text-indigo-300 font-semibold">
                Habits Module
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Tracks daily routine check-ins, habit fidelity %, and sustained routine momentum.
            </p>
          </div>
        </div>

        {!hideHeaderNav && onPrevMonth && onNextMonth && (
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl self-start sm:self-auto">
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

      {/* Habit Specific KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
          <span className="text-[10px] font-medium text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Habit Check-Ins
          </span>
          <p className="text-lg font-bold text-white mt-0.5">
            {totalCompleted} <span className="text-xs font-normal text-slate-400">/ {totalScheduled}</span>
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
          <span className="text-[10px] font-medium text-indigo-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Routine Adherence
          </span>
          <p className="text-lg font-bold text-indigo-400 mt-0.5">{avgAdherenceRate}%</p>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
          <span className="text-[10px] font-medium text-indigo-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" /> High Adherence Days
          </span>
          <p className="text-lg font-bold text-orange-400 mt-0.5">{highAdherenceDays} Days</p>
        </div>
        <div className="p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40">
          <span className="text-[10px] font-medium text-indigo-400 flex items-center gap-1">
            <Coffee className="w-3 h-3 text-amber-400" /> Rest Days
          </span>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{restDays} Days</p>
        </div>
      </div>

      {/* Habit Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 px-3 py-2 rounded-xl">
        <span className="font-semibold text-slate-300">Habit Heatmap:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-indigo-500 shadow-xs shadow-indigo-500/50" />
          <span>&ge; 85% High Fidelity</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-blue-500/80" />
          <span>60% - 84% Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-slate-700" />
          <span>&lt; 60% Low Adherence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coffee className="w-3 h-3 text-amber-400" />
          <span>Rest Day</span>
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
            const habitRate = data ? data.habitAdherenceRate : 0;

            let tileClass = 'bg-slate-900/60 border-slate-800 hover:border-slate-700';
            if (isRest) {
              tileClass = 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600/70';
            } else if (data && data.scheduledHabits > 0) {
              if (habitRate >= 0.85) {
                tileClass = 'bg-indigo-950/35 border-indigo-500/60 hover:border-indigo-400 shadow-sm';
              } else if (habitRate >= 0.6) {
                tileClass = 'bg-blue-950/25 border-blue-600/50 hover:border-blue-400';
              } else {
                tileClass = 'bg-slate-850 border-slate-750 hover:border-slate-650';
              }
            }

            return (
              <div
                key={dStr}
                onClick={() => onSelectDate(dStr)}
                className={`min-h-[95px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${tileClass} ${
                  isToday ? 'ring-2 ring-indigo-500/80' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isToday ? 'text-indigo-400 bg-indigo-500/15 px-1 rounded' : isRest ? 'text-amber-400' : 'text-slate-300'
                  }`}>
                    {dayNum}
                  </span>
                  {isRest && (
                    <span title={data?.restDayNote || 'Rest Day'} className="text-amber-400">
                      <Coffee className="w-3 h-3" />
                    </span>
                  )}
                </div>

                {data ? (
                  <div className="space-y-1 my-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Fidelity:</span>
                      <span className={`font-bold px-1 py-0.2 rounded text-[9px] ${
                        habitRate >= 0.85
                          ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/60'
                          : habitRate >= 0.6
                          ? 'bg-blue-950/60 text-blue-300'
                          : data.scheduledHabits > 0
                          ? 'bg-slate-800 text-slate-400'
                          : 'text-slate-500'
                      }`}>
                        {data.scheduledHabits > 0 ? `${Math.round(habitRate * 100)}%` : '0%'}
                      </span>
                    </div>

                    {/* Check-In Dots */}
                    <div className="flex items-center gap-1 py-0.5">
                      {Array.from({ length: Math.min(5, data.scheduledHabits || 0) }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            idx < (data.completedHabits || 0)
                              ? 'bg-indigo-400 shadow-xs shadow-indigo-400'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>{data.completedHabits}/{data.scheduledHabits}</span>
                      {habitRate >= 0.8 && (
                        <span title="Streak Maintained" className="text-orange-400">🔥</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic py-2 text-center">No Habits</div>
                )}

                <div className="pt-0.5 border-t border-slate-800/60 text-[9px] text-slate-500 flex justify-between font-mono">
                  <span>Habits</span>
                  <span>{data?.scheduledHabits || 0} active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};