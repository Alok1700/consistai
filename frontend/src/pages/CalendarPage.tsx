import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Goal } from '../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Target,
  Sparkles,
  ListTodo,
  Layers,
  RotateCcw,
  LayoutGrid
} from 'lucide-react';
import { TaskCalendarView } from '../components/Calendar/TaskCalendarView';
import { HabitCalendarView } from '../components/Calendar/HabitCalendarView';
import { GoalCalendarView } from '../components/Calendar/GoalCalendarView';
import { DayDetailModal } from '../components/Calendar/DayDetailModal';

export type CalendarDisplayMode = 'all_three_separate' | 'tasks_only' | 'habits_only' | 'goals_only' | 'combined';

export interface DayMetric {
  date: string;
  consistencyScore: number;
  taskCompletionRate: number;
  completedTasks: number;
  plannedTasks: number;
  goalRelevantCompletedTasks: number;
  habitAdherenceRate: number;
  completedHabits: number;
  scheduledHabits: number;
  completedHabitNames?: string[];
  totalWorkMinutes: number;
  goalWorkMinutes: number;
  distractingScreenMinutes: number;
  productiveScreenMinutes: number;
  goalProgressDelta: number;
  milestonesCompletedCount: number;
  hasMeaningfulProgress: boolean;
  hasHighConsistency: boolean;
  isHolidayOrRestDay: boolean;
  restDayNote?: string | null;
  goalSpecificEvents?: any[];
  goalSpecificTasks?: { planned: number; completed: number } | null;
}

export const CalendarPage: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('all_three_separate');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'tasks' | 'habits' | 'goals' | 'time'>('tasks');

  // Fetch all goals
  const { data: goalsData } = useQuery<{ success: boolean; goals: Goal[] }>({
    queryKey: ['goals-list'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  const goals = goalsData?.goals || [];

  // Fetch monthly calendar data
  const { data: calendarData, isLoading } = useQuery<{
    success: boolean;
    year: number;
    month: number;
    daysInMonth: number;
    daysData: Record<string, DayMetric>;
  }>({
    queryKey: ['calendar-month', currentYear, currentMonth, selectedGoalId],
    queryFn: async () => {
      const goalParam = selectedGoalId && selectedGoalId !== 'all' ? `&goalId=${selectedGoalId}` : '';
      const res = await api.get(`/calendar/month?year=${currentYear}&month=${currentMonth}${goalParam}`);
      return res.data;
    }
  });

  const daysData = calendarData?.daysData || {};

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const openDateModal = (date: string, tab: 'tasks' | 'habits' | 'goals' | 'time') => {
    setSelectedDate(date);
    setDetailModalTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Global Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#161E2E] border border-[#263247] p-4 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[#8B5CF6]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
                Consistency Calendars
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Unified schedule across Tasks, Habits, and Goal Milestones in separate or combined views.
              </p>
            </div>
          </div>
        </div>

        {/* Global Month Navigator */}
        <div className="flex items-center gap-2 bg-[#0B0F19] border border-[#263247] p-1.5 rounded-xl self-start lg:self-auto">
          <button
            onClick={handlePrevMonth}
            title="Previous Month"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-xs text-white px-3 min-w-[120px] text-center">
            {monthNames[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            title="Next Month"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetToCurrentMonth}
            title="Jump to Current Month"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Separate Calendar View Selector */}
      <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1.5">
        <button
          onClick={() => setDisplayMode('all_three_separate')}
          className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
            displayMode === 'all_three_separate'
              ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
        >
          <LayoutGrid className="w-4 h-4 text-cyan-400" />
          <span>View All 3 Separately</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">3 Cards</span>
        </button>

        <button
          onClick={() => setDisplayMode('tasks_only')}
          className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
            displayMode === 'tasks_only'
              ? 'bg-emerald-950/60 text-emerald-300 shadow-sm border border-emerald-700/60'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-850'
          }`}
        >
          <ListTodo className="w-4 h-4 text-emerald-400" />
          <span>Tasks Calendar</span>
        </button>

        <button
          onClick={() => setDisplayMode('habits_only')}
          className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
            displayMode === 'habits_only'
              ? 'bg-indigo-950/60 text-indigo-300 shadow-sm border border-indigo-700/60'
              : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-850'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Habit Tracker Calendar</span>
        </button>

        <button
          onClick={() => setDisplayMode('goals_only')}
          className={`flex-1 min-w-[150px] px-3.5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
            displayMode === 'goals_only'
              ? 'bg-teal-950/60 text-teal-300 shadow-sm border border-teal-700/60'
              : 'text-slate-400 hover:text-teal-300 hover:bg-slate-850'
          }`}
        >
          <Target className="w-4 h-4 text-teal-400" />
          <span>Goal Manager Calendar</span>
        </button>

        <button
          onClick={() => setDisplayMode('combined')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
            displayMode === 'combined'
              ? 'bg-purple-950/60 text-purple-300 shadow-sm border border-purple-700/60'
              : 'text-slate-400 hover:text-purple-300 hover:bg-slate-850'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Combined Overview</span>
        </button>
      </div>

      {/* Main Calendar Content Based on Display Mode */}

      {/* OPTION 1: ALL 3 SEPARATE CALENDARS DISPLAYED CONCURRENTLY */}
      {displayMode === 'all_three_separate' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl">
            <span>Showing all 3 separate calendars simultaneously for <strong>{monthNames[currentMonth - 1]} {currentYear}</strong></span>
            <span className="text-[11px] text-slate-500">Each calendar has its own distinct metrics, heatmap colors, and filters.</span>
          </div>

          {/* Calendar 1: Tasks */}
          <TaskCalendarView
            year={currentYear}
            month={currentMonth}
            daysData={daysData}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectDate={(date) => openDateModal(date, 'tasks')}
            hideHeaderNav
          />

          {/* Calendar 2: Habit Tracker */}
          <HabitCalendarView
            year={currentYear}
            month={currentMonth}
            daysData={daysData}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectDate={(date) => openDateModal(date, 'habits')}
            hideHeaderNav
          />

          {/* Calendar 3: Goal Manager */}
          <GoalCalendarView
            year={currentYear}
            month={currentMonth}
            daysData={daysData}
            goals={goals}
            selectedGoalId={selectedGoalId}
            onSelectGoalId={setSelectedGoalId}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectDate={(date) => openDateModal(date, 'goals')}
            hideHeaderNav
          />
        </div>
      )}

      {/* OPTION 2: TASKS CALENDAR ONLY */}
      {displayMode === 'tasks_only' && (
        <TaskCalendarView
          year={currentYear}
          month={currentMonth}
          daysData={daysData}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={(date) => openDateModal(date, 'tasks')}
        />
      )}

      {/* OPTION 3: HABIT TRACKER CALENDAR ONLY */}
      {displayMode === 'habits_only' && (
        <HabitCalendarView
          year={currentYear}
          month={currentMonth}
          daysData={daysData}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={(date) => openDateModal(date, 'habits')}
        />
      )}

      {/* OPTION 4: GOAL MANAGER CALENDAR ONLY */}
      {displayMode === 'goals_only' && (
        <GoalCalendarView
          year={currentYear}
          month={currentMonth}
          daysData={daysData}
          goals={goals}
          selectedGoalId={selectedGoalId}
          onSelectGoalId={setSelectedGoalId}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectDate={(date) => openDateModal(date, 'goals')}
        />
      )}

      {/* OPTION 5: COMBINED OVERVIEW CALENDAR */}
      {displayMode === 'combined' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Metric Unified Calendar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  All Dimensions
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Displays Tasks (T), Habits (H), and Goal Deltas (G) side-by-side in each tile.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {Array.from({ length: new Date(currentYear, currentMonth - 1, 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[105px] rounded-xl bg-slate-950/20 border border-transparent" />
            ))}

            {Array.from({ length: new Date(currentYear, currentMonth, 0).getDate() }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const data = daysData[dStr];
              const isRest = data?.isHolidayOrRestDay;
              const hasMilestone = (data?.milestonesCompletedCount || 0) > 0;

              return (
                <div
                  key={dStr}
                  onClick={() => openDateModal(dStr, 'tasks')}
                  className="min-h-[105px] p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">{dayNum}</span>
                    {hasMilestone && (
                      <span className="px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px]">★</span>
                    )}
                  </div>

                  {data ? (
                    <div className="space-y-1 text-[9px] my-1">
                      <div className="flex justify-between px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                        <span>T:</span>
                        <span>{data.completedTasks}/{data.plannedTasks}</span>
                      </div>
                      <div className="flex justify-between px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400">
                        <span>H:</span>
                        <span>{Math.round(data.habitAdherenceRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between px-1.5 py-0.5 rounded bg-slate-800 text-teal-400">
                        <span>G:</span>
                        <span>+{data.goalProgressDelta}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-600 italic py-2 text-center">No Log</div>
                  )}

                  <div className="text-[8px] text-slate-500 font-mono text-right">
                    Score: {data?.consistencyScore || 0}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Detail Drilldown Modal */}
      <DayDetailModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        selectedDate={selectedDate}
        initialTab={detailModalTab}
      />
    </div>
  );
};