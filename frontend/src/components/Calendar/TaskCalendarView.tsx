import React from 'react';
import {
  ListTodo,
  CheckCircle2,
  Trophy,
  Coffee,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { DayMetric } from '../../pages/CalendarPage';

interface TaskCalendarViewProps {
  year: number;
  month: number;
  daysData: Record<string, DayMetric>;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onSelectDate: (date: string) => void;
  hideHeaderNav?: boolean;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
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

  // Task KPI calculations
  const list = Object.values(daysData);
  let totalPlanned = 0;
  let totalCompleted = 0;
  let daysWithTasks = 0;
  let sumRate = 0;
  let perfectDays = 0;
  let restDays = 0;

  list.forEach(d => {
    totalPlanned += d.plannedTasks || 0;
    totalCompleted += d.completedTasks || 0;
    if (d.plannedTasks > 0) {
      daysWithTasks += 1;
      sumRate += d.taskCompletionRate || 0;
      if (d.taskCompletionRate >= 0.99) perfectDays += 1;
    }
    if (d.isHolidayOrRestDay) restDays += 1;
  });

  const avgCompletionRate = daysWithTasks > 0 ? Math.round((sumRate / daysWithTasks) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Tasks Consistency Calendar</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold">
                Tasks Module
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Tracks task completion rate, planned vs completed work, and on-time task delivery.
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

      {/* Task Specific KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <ListTodo className="w-3 h-3" /> Total Tasks Done
          </span>
          <p className="text-lg font-bold text-white mt-0.5">
            {totalCompleted} <span className="text-xs font-normal text-slate-400">/ {totalPlanned}</span>
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Completion Rate
          </span>
          <p className="text-lg font-bold text-emerald-400 mt-0.5">{avgCompletionRate}%</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" /> 100% Days
          </span>
          <p className="text-lg font-bold text-white mt-0.5">{perfectDays} Days</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40">
          <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
            <Coffee className="w-3 h-3 text-amber-400" /> Rest Days
          </span>
          <p className="text-lg font-bold text-amber-400 mt-0.5">{restDays} Days</p>
        </div>
      </div>

      {/* Task Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/60 px-3 py-2 rounded-xl">
        <span className="font-semibold text-slate-300">Task Heatmap:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          <span>100% Complete</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-amber-500/80" />
          <span>50% - 99% Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded bg-rose-500/80" />
          <span>&lt; 50% Incomplete</span>
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
            const taskRate = data ? data.taskCompletionRate : 0;

            let tileClass = 'bg-slate-900/60 border-slate-800 hover:border-slate-700';
            if (isRest) {
              tileClass = 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600/70';
            } else if (data && data.plannedTasks > 0) {
              if (taskRate >= 0.99) {
                tileClass = 'bg-emerald-950/35 border-emerald-600/60 hover:border-emerald-400 shadow-sm';
              } else if (taskRate >= 0.5) {
                tileClass = 'bg-amber-950/25 border-amber-600/50 hover:border-amber-400';
              } else if (taskRate > 0) {
                tileClass = 'bg-orange-950/25 border-orange-700/50 hover:border-orange-500';
              } else {
                tileClass = 'bg-rose-950/20 border-rose-800/40 hover:border-rose-600';
              }
            }

            return (
              <div
                key={dStr}
                onClick={() => onSelectDate(dStr)}
                className={`min-h-[95px] p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${tileClass} ${
                  isToday ? 'ring-2 ring-emerald-500/80' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isToday ? 'text-emerald-400 bg-emerald-500/15 px-1 rounded' : isRest ? 'text-amber-400' : 'text-slate-300'
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
                      <span className="text-slate-400 font-medium">Rate:</span>
                      <span className={`font-bold px-1 py-0.2 rounded text-[9px] ${
                        taskRate >= 0.99
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                          : taskRate >= 0.5
                          ? 'bg-amber-950/60 text-amber-300'
                          : data.plannedTasks > 0
                          ? 'bg-rose-950/60 text-rose-300'
                          : 'text-slate-500'
                      }`}>
                        {data.plannedTasks > 0 ? `${Math.round(taskRate * 100)}%` : '0%'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          taskRate >= 0.99 ? 'bg-emerald-400' : taskRate >= 0.5 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, taskRate * 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>{data.completedTasks}/{data.plannedTasks}</span>
                      {data.goalRelevantCompletedTasks > 0 && (
                        <span className="text-teal-400 font-semibold" title="Goal-Relevant Tasks">
                          🎯 {data.goalRelevantCompletedTasks}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-600 italic py-2 text-center">No Tasks</div>
                )}

                <div className="pt-0.5 border-t border-slate-800/60 text-[9px] text-slate-500 flex justify-between font-mono">
                  <span>Tasks</span>
                  <span>{data?.plannedTasks || 0} sched</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};