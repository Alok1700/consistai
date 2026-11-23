import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Habit } from '../types';
import { CreateHabitModal } from '../components/Common/CreateHabitModal';
import {
  Flame,
  Plus,
  Check,
  Calendar,
  CalendarDays,
  Sparkles,
  Trash2,
  TrendingUp,
  Target,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Activity,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const HabitsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHabitForDetail, setSelectedHabitForDetail] = useState<Habit | null>(null);

  // View Mode: 'month' (default as requested), 'week', or 'calendar'
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'calendar'>('month');

  // Month & Year state (defaults to current date)
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1); // 1-indexed

  const monthQueryStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear((y) => y - 1);
      setSelectedMonth(12);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear((y) => y + 1);
      setSelectedMonth(1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleResetCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
  };

  // Compute all days in the selected month (1 to 28/29/30/31)
  const monthDays = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();
    const days: Array<{
      dayNum: number;
      dateStr: string;
      dayOfWeekLabel: string;
      shortDayLabel: string;
      isToday: boolean;
      isWeekend: boolean;
      dayOfWeekIndex: number;
    }> = [];

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(selectedYear, selectedMonth - 1, d);
      const str = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayIndex = dateObj.getDay(); // 0 is Sunday, 1 is Monday
      const adjustedDayIndex = (dayIndex + 6) % 7; // 0 is Mon, 6 is Sun
      const dayLabel = DAY_LABELS[adjustedDayIndex];

      days.push({
        dayNum: d,
        dateStr: str,
        dayOfWeekLabel: dayLabel,
        shortDayLabel: dayLabel[0],
        isToday: str === todayStr,
        isWeekend: dayIndex === 0 || dayIndex === 6,
        dayOfWeekIndex: adjustedDayIndex
      });
    }
    return days;
  }, [selectedYear, selectedMonth, todayStr]);

  // Compute current week's 7 days for the weekly view
  const currentWeekDays = useMemo(() => {
    const d = new Date(today);
    const dayOfWeek = d.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    d.setDate(d.getDate() - distanceToMonday);

    const week: Array<{ label: string; dateStr: string; isToday: boolean; dayNum: number }> = [];
    for (let i = 0; i < 7; i++) {
      const dateCopy = new Date(d);
      dateCopy.setDate(d.getDate() + i);
      const str = dateCopy.toISOString().slice(0, 10);
      week.push({
        label: DAY_LABELS[i],
        dateStr: str,
        isToday: str === todayStr,
        dayNum: dateCopy.getDate()
      });
    }
    return week;
  }, [todayStr]);

  // Fetch Habits for the selected month
  const { data: habitsData, isLoading } = useQuery<{ habits: Habit[] }>({
    queryKey: ['habits', monthQueryStr],
    queryFn: async () => {
      const res = await api.get(`/habits?month=${monthQueryStr}&date=${todayStr}`);
      return res.data;
    }
  });

  const habits: Habit[] = habitsData?.habits || [];

  // Toggle Check-in Mutation (accepts date)
  const toggleCheckInMutation = useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date?: string }) => {
      const res = await api.post(`/habits/${habitId}/checkin`, { date: date || todayStr });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    }
  });

  // Delete Habit Mutation
  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      await api.delete(`/habits/${habitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      if (selectedHabitForDetail) setSelectedHabitForDetail(null);
    }
  });

  // KPI Calculations across the selected month
  const totalHabits = habits.length;
  const checkedTodayCount = habits.filter((h) => h.isCheckedToday).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak || 0), 0);

  // Month aggregate check-ins
  const totalMonthCheckIns = habits.reduce((acc, h) => {
    return acc + (h.monthlyCompletions || Object.keys(h.completionHistory || {}).length);
  }, 0);

  const avgMonthlyAdherence =
    totalHabits > 0
      ? Math.round(
          (habits.reduce((sum, h) => sum + (h.monthlyAdherenceRate || h.weeklyAdherenceRate || 0.8), 0) /
            totalHabits) *
            100
        )
      : 85;

  // Calendar matrix calculation for 'calendar' view mode
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const leadingBlanks = (firstDayIndex + 6) % 7; // Monday-first
    return { leadingBlanks, days: monthDays };
  }, [selectedYear, selectedMonth, monthDays]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* SECTION 1: HEADER & VIEW SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263247] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
              <Flame className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Habits & Routines
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
              Full Month View
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Build sustained behavioral momentum with full-month consistency matrices and real-time check-in logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#161E2E] border border-[#263247] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Full Month</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <span>Week View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-md shadow-[#8B5CF6]/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: MONTH NAVIGATION BAR */}
      <div className="bg-[#161E2E] border border-[#263247] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#111827] border border-[#263247] rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1C2638] transition cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 py-1 text-center min-w-[150px]">
              <span className="text-xs font-black text-white">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1C2638] transition cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {(selectedYear !== today.getFullYear() || selectedMonth !== today.getMonth() + 1) && (
            <button
              type="button"
              onClick={handleResetCurrentMonth}
              className="px-2.5 py-1.5 rounded-xl bg-[#1C2638] border border-[#263247] text-xs font-semibold text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>This Month</span>
            </button>
          )}
        </div>

        {/* Month Context Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-[#263247] text-[#94A3B8]">
            Days in month: <strong className="text-white">{monthDays.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-[#263247] text-[#94A3B8]">
            Monthly check-ins: <strong className="text-[#10B981]">{totalMonthCheckIns}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0B0F19] border border-[#263247] text-[#94A3B8]">
            Month Adherence: <strong className="text-[#8B5CF6]">{avgMonthlyAdherence}%</strong>
          </span>
        </div>
      </div>

      {/* SECTION 3: TOP LEVEL SUMMARY METRIC TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Today's Progress
          </span>
          <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">
            {checkedTodayCount} / {totalHabits}
          </span>
          <span className="text-[10px] text-[#10B981] font-semibold mt-0.5 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{totalHabits > 0 ? Math.round((checkedTodayCount / totalHabits) * 100) : 0}% done today</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Longest Active Streak
          </span>
          <span className="text-2xl font-black text-[#F59E0B] mt-0.5 block flex items-center gap-1">
            <Flame className="w-5 h-5 fill-[#F59E0B]" />
            <span>{longestStreak} Days</span>
          </span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">
            Consistent routine cadence
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            {MONTH_NAMES[selectedMonth - 1]} Adherence
          </span>
          <span className="text-2xl font-black text-[#8B5CF6] mt-0.5 block">
            {avgMonthlyAdherence}%
          </span>
          <span className="text-[10px] text-[#8B5CF6] font-medium mt-0.5 block">
            Monthly adherence rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Tracked Routines
          </span>
          <span className="text-2xl font-black text-[#38BDF8] mt-0.5 block">
            {totalHabits} Habits
          </span>
          <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5 block">
            {totalMonthCheckIns} total logs this month
          </span>
        </div>
      </div>

      {/* SECTION 4A: FULL MONTH MATRIX VIEW (HABITS VERTICAL, ALL 28-31 DAYS HORIZONTAL) */}
      {viewMode === 'month' && (
        <div className="bg-[#161E2E] border border-[#263247] rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <div className="min-w-[1050px]">
              {/* Table Header */}
              <div className="flex border-b border-[#263247] bg-[#111827] text-xs font-bold text-[#94A3B8]">
                {/* Sticky Left Column: Habit Title */}
                <div className="sticky left-0 bg-[#111827] z-20 w-64 p-3.5 border-r border-[#263247] uppercase tracking-wider text-[11px] shrink-0 flex items-center justify-between">
                  <span>Habit Routine</span>
                  <span className="text-[10px] font-mono font-normal text-[#64748B]">
                    {MONTH_NAMES[selectedMonth - 1].slice(0, 3)}
                  </span>
                </div>

                {/* Days of Month Header Columns (1 to 28/29/30/31) */}
                <div className="flex-1 flex">
                  {monthDays.map((d) => (
                    <div
                      key={d.dateStr}
                      className={`flex-1 min-w-[34px] max-w-[44px] py-2 text-center border-r border-[#263247]/50 flex flex-col justify-center items-center ${
                        d.isToday
                          ? 'bg-[#8B5CF6]/20 border-b-2 border-b-[#8B5CF6] text-[#8B5CF6]'
                          : d.isWeekend
                          ? 'bg-[#0B0F19]/40 text-[#64748B]'
                          : 'text-[#94A3B8]'
                      }`}
                      title={`${d.dayOfWeekLabel}, ${MONTH_NAMES[selectedMonth - 1]} ${d.dayNum}`}
                    >
                      <span className="text-[10px] font-semibold">{d.shortDayLabel}</span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          d.isToday ? 'text-[#8B5CF6] underline' : ''
                        }`}
                      >
                        {d.dayNum}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Columns: Monthly Performance & Streak */}
                <div className="w-36 p-3 border-l border-[#263247] text-right uppercase tracking-wider text-[10px] shrink-0 flex items-center justify-end">
                  <span>Month / Streak</span>
                </div>
              </div>

              {/* Habit Rows */}
              <div className="divide-y divide-[#263247]">
                {habits.length === 0 ? (
                  <div className="text-center py-16 text-[#94A3B8]">
                    <Flame className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-[#F8FAFC]">No habits configured yet</p>
                    <p className="text-xs text-[#64748B] mt-1">
                      Click "+ New Habit" above to create daily habits and build monthly streaks.
                    </p>
                  </div>
                ) : (
                  habits.map((habit) => {
                    const scheduledDays =
                      habit.daysOfWeek && habit.daysOfWeek.length > 0 ? habit.daysOfWeek : DAY_LABELS;
                    const isCheckedToday = habit.isCheckedToday;
                    const completionHistory = habit.completionHistory || {};

                    const monthCompletedCount =
                      habit.monthlyCompletions !== undefined
                        ? habit.monthlyCompletions
                        : monthDays.filter((d) => completionHistory[d.dateStr]).length;

                    const monthScheduledCount =
                      habit.monthlyScheduledDays !== undefined
                        ? habit.monthlyScheduledDays
                        : monthDays.filter((d) => scheduledDays.includes(d.dayOfWeekLabel)).length;

                    const monthPercent =
                      monthScheduledCount > 0
                        ? Math.round((monthCompletedCount / monthScheduledCount) * 100)
                        : 0;

                    return (
                      <div
                        key={habit._id}
                        className="flex items-center hover:bg-[#1C2638]/40 transition group"
                      >
                        {/* Sticky Left Column: Habit Info */}
                        <div className="sticky left-0 bg-[#161E2E] group-hover:bg-[#1C2638] z-20 w-64 p-3 border-r border-[#263247] shrink-0 flex items-center gap-2.5 min-w-0 transition-colors shadow-sm">
                          <button
                            type="button"
                            onClick={() =>
                              toggleCheckInMutation.mutate({ habitId: habit._id, date: todayStr })
                            }
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                              isCheckedToday
                                ? 'bg-[#10B981] border border-[#10B981] text-white shadow-sm'
                                : 'bg-[#0B0F19] border border-[#263247] hover:border-[#10B981] text-transparent'
                            }`}
                            title={isCheckedToday ? 'Completed today' : 'Click to complete today'}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <span
                              onClick={() => setSelectedHabitForDetail(habit)}
                              className="text-xs font-bold text-[#F8FAFC] hover:text-[#8B5CF6] transition truncate cursor-pointer block"
                              title={habit.title}
                            >
                              {habit.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#64748B]">
                              <span className="px-1.5 py-0.2 rounded bg-[#0B0F19] border border-[#263247] text-[#94A3B8]">
                                {habit.category}
                              </span>
                              <span>{scheduledDays.length}d/wk</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Columns: Day Checkboxes (1 to 28/29/30/31) */}
                        <div className="flex-1 flex">
                          {monthDays.map((d) => {
                            const isScheduled = scheduledDays.includes(d.dayOfWeekLabel);
                            const isCompleted =
                              Boolean(completionHistory[d.dateStr]) ||
                              (d.isToday && Boolean(isCheckedToday));

                            if (!isScheduled) {
                              return (
                                <div
                                  key={d.dateStr}
                                  className={`flex-1 min-w-[34px] max-w-[44px] h-10 border-r border-[#263247]/40 flex items-center justify-center text-[#64748B] text-[10px] select-none ${
                                    d.isToday ? 'bg-[#8B5CF6]/10' : d.isWeekend ? 'bg-[#0B0F19]/30' : ''
                                  }`}
                                  title={`${d.dateStr}: Unscheduled rest day`}
                                >
                                  —
                                </div>
                              );
                            }

                            return (
                              <div
                                key={d.dateStr}
                                className={`flex-1 min-w-[34px] max-w-[44px] h-10 border-r border-[#263247]/40 flex items-center justify-center p-0.5 ${
                                  d.isToday ? 'bg-[#8B5CF6]/10' : d.isWeekend ? 'bg-[#0B0F19]/20' : ''
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleCheckInMutation.mutate({
                                      habitId: habit._id,
                                      date: d.dateStr
                                    })
                                  }
                                  className={`w-6 h-6 rounded-md flex items-center justify-center transition cursor-pointer border ${
                                    isCompleted
                                      ? 'bg-[#10B981] border-[#10B981] text-white shadow-xs'
                                      : d.isToday
                                      ? 'bg-[#0B0F19] border-[#8B5CF6] hover:bg-[#8B5CF6]/20 text-[#8B5CF6]'
                                      : 'bg-[#0B0F19]/70 border-[#263247] hover:border-[#64748B] text-transparent'
                                  }`}
                                  title={`${d.dayOfWeekLabel} (${d.dateStr}): ${
                                    isCompleted ? 'Completed (Click to uncheck)' : 'Click to log check-in'
                                  }`}
                                >
                                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Right Summary: Progress & Streak */}
                        <div className="w-36 p-3 border-l border-[#263247] shrink-0 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold text-white block">
                              {monthCompletedCount}/{monthScheduledCount}d
                            </span>
                            <span className="text-[10px] text-[#10B981] font-mono block">
                              {monthPercent}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-1.5 py-0.5 rounded border border-[#F59E0B]/20">
                              <Flame className="w-3 h-3 fill-[#F59E0B]" />
                              <span>{habit.currentStreak || 0}d</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => deleteHabitMutation.mutate(habit._id)}
                              className="p-1 rounded text-[#64748B] hover:text-[#EF4444] transition cursor-pointer"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4B: WEEKLY VIEW (CLASSIC 7-DAY VIEW) */}
      {viewMode === 'week' && (
        <div className="bg-[#161E2E] border border-[#263247] rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 border-b border-[#263247] bg-[#111827] text-xs font-bold text-[#94A3B8]">
            <div className="col-span-12 sm:col-span-5 uppercase tracking-wider text-[11px]">
              Habit Routine
            </div>

            <div className="hidden sm:grid col-span-5 grid-cols-7 gap-1 text-center">
              {currentWeekDays.map((d) => (
                <div
                  key={d.dateStr}
                  className={`py-1 rounded-lg ${
                    d.isToday ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30' : ''
                  }`}
                >
                  <span className="block text-[11px] font-bold">{d.label}</span>
                  <span className="block text-[10px] font-mono text-[#64748B]">{d.dayNum}</span>
                </div>
              ))}
            </div>

            <div className="hidden sm:block col-span-2 text-right uppercase tracking-wider text-[11px] pr-2">
              Streak / Action
            </div>
          </div>

          {/* Habits Rows */}
          <div className="divide-y divide-[#263247]">
            {habits.length === 0 ? (
              <div className="text-center py-12 p-6 text-[#94A3B8]">
                <Flame className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#F8FAFC]">No habits configured yet</p>
              </div>
            ) : (
              habits.map((habit) => {
                const scheduledDays =
                  habit.daysOfWeek && habit.daysOfWeek.length > 0 ? habit.daysOfWeek : DAY_LABELS;
                const isCheckedToday = habit.isCheckedToday;

                return (
                  <div
                    key={habit._id}
                    className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-[#1C2638]/40 transition group"
                  >
                    <div className="col-span-12 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          toggleCheckInMutation.mutate({ habitId: habit._id, date: todayStr })
                        }
                        className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                          isCheckedToday
                            ? 'bg-[#10B981] border border-[#10B981] text-white shadow-sm'
                            : 'bg-[#0B0F19] border-2 border-[#263247] hover:border-[#10B981] text-transparent'
                        }`}
                        title={isCheckedToday ? 'Checked in today' : 'Click to check in today'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          onClick={() => setSelectedHabitForDetail(habit)}
                          className="text-sm font-bold text-[#F8FAFC] hover:text-[#8B5CF6] transition truncate cursor-pointer block"
                        >
                          {habit.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
                          <span className="px-1.5 py-0.2 rounded bg-[#0B0F19] border border-[#263247] text-[10px] text-[#94A3B8]">
                            {habit.category}
                          </span>
                          <span>{scheduledDays.length} days/week</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-5 grid grid-cols-7 gap-1 items-center mt-3 sm:mt-0">
                      {currentWeekDays.map((d) => {
                        const isScheduled = scheduledDays.includes(d.label);
                        const isCompletedOnDay =
                          (d.isToday && isCheckedToday) ||
                          (habit.completionHistory && habit.completionHistory[d.dateStr]);

                        if (!isScheduled) {
                          return (
                            <div
                              key={d.dateStr}
                              className="h-8 rounded-lg bg-[#0B0F19]/40 border border-[#263247]/30 flex items-center justify-center text-[#64748B] text-[11px]"
                            >
                              —
                            </div>
                          );
                        }

                        return (
                          <button
                            key={d.dateStr}
                            type="button"
                            onClick={() =>
                              toggleCheckInMutation.mutate({ habitId: habit._id, date: d.dateStr })
                            }
                            className={`h-8 rounded-lg flex items-center justify-center transition cursor-pointer border ${
                              isCompletedOnDay
                                ? 'bg-[#10B981] border-[#10B981] text-white shadow-sm'
                                : d.isToday
                                ? 'bg-[#0B0F19] border-[#8B5CF6] hover:bg-[#8B5CF6]/20 text-[#8B5CF6]'
                                : 'bg-[#0B0F19] border-[#263247] hover:border-[#94A3B8] text-transparent'
                            }`}
                          >
                            {isCompletedOnDay && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="col-span-12 sm:col-span-2 flex items-center justify-end gap-2 mt-2 sm:mt-0">
                      <span className="flex items-center gap-1 text-xs font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-full border border-[#F59E0B]/20">
                        <Flame className="w-3.5 h-3.5 fill-[#F59E0B]" />
                        <span>{habit.currentStreak || 0}d</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => deleteHabitMutation.mutate(habit._id)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition cursor-pointer"
                        title="Delete habit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SECTION 4C: MONTHLY CALENDAR GRID VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-[#161E2E] border border-[#263247] rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#263247]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#8B5CF6]" />
              <span>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Habit Execution Grid
              </span>
            </h3>
            <span className="text-xs text-[#94A3B8]">
              {monthDays.length} days · Click any day to log check-ins
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map((dayLabel) => (
              <div
                key={dayLabel}
                className="py-1.5 text-center text-xs font-bold text-[#94A3B8] uppercase tracking-wider bg-[#111827] rounded-lg border border-[#263247]"
              >
                {dayLabel}
              </div>
            ))}

            {/* Leading blank slots */}
            {Array.from({ length: calendarCells.leadingBlanks }).map((_, idx) => (
              <div
                key={`blank-${idx}`}
                className="min-h-[90px] rounded-xl bg-[#0B0F19]/30 border border-transparent"
              />
            ))}

            {/* Day Cells */}
            {monthDays.map((d) => {
              // Count how many habits were completed on this day
              const dayCompletions = habits.filter((h) => {
                if (d.isToday && h.isCheckedToday) return true;
                return h.completionHistory && h.completionHistory[d.dateStr];
              });

              const dayScheduled = habits.filter((h) => {
                const days = h.daysOfWeek && h.daysOfWeek.length > 0 ? h.daysOfWeek : DAY_LABELS;
                return days.includes(d.dayOfWeekLabel);
              });

              const isPerfectDay = dayScheduled.length > 0 && dayCompletions.length >= dayScheduled.length;
              const hasCompletions = dayCompletions.length > 0;

              return (
                <div
                  key={d.dateStr}
                  className={`min-h-[95px] p-2 rounded-xl border flex flex-col justify-between transition ${
                    d.isToday
                      ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] ring-1 ring-[#8B5CF6]'
                      : isPerfectDay
                      ? 'bg-emerald-950/20 border-emerald-800/40'
                      : hasCompletions
                      ? 'bg-[#161E2E] border-[#263247]'
                      : d.isWeekend
                      ? 'bg-[#0B0F19]/40 border-[#263247]/50'
                      : 'bg-[#111827] border-[#263247]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        d.isToday
                          ? 'text-[#8B5CF6] px-1.5 py-0.5 rounded-full bg-[#8B5CF6]/20'
                          : 'text-white'
                      }`}
                    >
                      {d.dayNum}
                    </span>

                    {isPerfectDay && (
                      <span className="text-[10px] text-[#10B981] font-semibold flex items-center gap-0.5">
                        <Sparkles className="w-3 h-3" />
                        <span>All</span>
                      </span>
                    )}
                  </div>

                  {/* Day mini badges */}
                  <div className="space-y-1 my-1">
                    {dayScheduled.length > 0 ? (
                      <div className="text-[10px] text-[#94A3B8]">
                        <span className="font-bold text-white">{dayCompletions.length}</span> /{' '}
                        <span>{dayScheduled.length} done</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#64748B] italic">Rest day</div>
                    )}

                    {/* Progress micro-bar */}
                    {dayScheduled.length > 0 && (
                      <div className="w-full bg-[#0B0F19] h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#10B981] rounded-full transition-all"
                          style={{
                            width: `${Math.round((dayCompletions.length / dayScheduled.length) * 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-[#64748B] font-mono text-right">
                    {d.dayOfWeekLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: DETAIL MODAL WITH MONTH HEATMAP FOR SELECTED HABIT */}
      {selectedHabitForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#161E2E] border border-[#263247] rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#263247]">
              <div>
                <h3 className="font-bold text-base text-[#F8FAFC]">
                  {selectedHabitForDetail.title}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {selectedHabitForDetail.category} · {selectedHabitForDetail.frequency}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHabitForDetail(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#263247]">
                <span className="text-[#64748B] block">Current Streak</span>
                <span className="text-xl font-bold text-[#F59E0B] mt-0.5 block flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-[#F59E0B]" />
                  <span>{selectedHabitForDetail.currentStreak || 0}d</span>
                </span>
              </div>

              <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#263247]">
                <span className="text-[#64748B] block">Best Streak</span>
                <span className="text-xl font-bold text-[#8B5CF6] mt-0.5 block">
                  {selectedHabitForDetail.longestStreak || 0}d
                </span>
              </div>

              <div className="p-3 bg-[#0B0F19] rounded-xl border border-[#263247]">
                <span className="text-[#64748B] block">Month Rate</span>
                <span className="text-xl font-bold text-[#10B981] mt-0.5 block">
                  {Math.round(
                    (selectedHabitForDetail.monthlyAdherenceRate ||
                      selectedHabitForDetail.weeklyAdherenceRate ||
                      0.8) * 100
                  )}
                  %
                </span>
              </div>
            </div>

            {/* Complete Month Check-in Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  {MONTH_NAMES[selectedMonth - 1]} {selectedYear} Activity Grid
                </span>
                <span className="text-[#94A3B8]">
                  {selectedHabitForDetail.monthlyCompletions || 0} / {monthDays.length} days completed
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5 p-3 rounded-xl bg-[#0B0F19] border border-[#263247]">
                {monthDays.map((d) => {
                  const isCompleted =
                    Boolean(selectedHabitForDetail.completionHistory?.[d.dateStr]) ||
                    (d.isToday && Boolean(selectedHabitForDetail.isCheckedToday));
                  return (
                    <div
                      key={d.dateStr}
                      className={`h-7 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold transition ${
                        isCompleted
                          ? 'bg-[#10B981] text-white shadow-xs'
                          : d.isToday
                          ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[#8B5CF6]'
                          : 'bg-[#1C2638] text-[#64748B] border border-[#263247]/60'
                      }`}
                      title={`${d.dayOfWeekLabel} (${d.dateStr}): ${
                        isCompleted ? 'Completed' : 'Pending'
                      }`}
                    >
                      {d.dayNum}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-[#64748B]">
                Green tiles represent verified daily habit executions for this month.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#263247]">
              <button
                type="button"
                onClick={() => setSelectedHabitForDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Habit Modal */}
      <CreateHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
