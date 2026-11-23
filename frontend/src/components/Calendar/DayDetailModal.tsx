import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../UI/Modal';
import {
  ListTodo,
  Sparkles,
  Target,
  Clock,
  Coffee,
  Smartphone,
  CheckCircle2,
  Circle,
  AlertCircle,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Flame
} from 'lucide-react';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null;
  initialTab?: 'agenda' | 'tasks' | 'habits' | 'goals' | 'time';
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  initialTab = 'agenda'
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'agenda' | 'tasks' | 'habits' | 'goals' | 'time'>(initialTab);
  const [agendaFilter, setAgendaFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [habitFilter, setHabitFilter] = useState<'all' | 'checked' | 'unchecked' | 'off_day'>('all');
  const [restDayNoteInput, setRestDayNoteInput] = useState('Scheduled Rest / Holiday');

  // Sync initial tab when changed
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, selectedDate]);

  const { data: dayDetailData, isLoading } = useQuery({
    queryKey: ['day-detail', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return null;
      const res = await api.get(`/calendar/day/${selectedDate}`);
      return res.data;
    },
    enabled: !!selectedDate && isOpen
  });

  const toggleRestDayMutation = useMutation({
    mutationFn: async ({ date, isRest, note }: { date: string; isRest: boolean; note?: string }) => {
      const res = await api.post(`/calendar/day/${date}/rest-day`, {
        isHolidayOrRestDay: isRest,
        restDayNote: note
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-month'] });
      queryClient.invalidateQueries({ queryKey: ['day-detail', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    }
  });

  // Master Agenda aggregation
  const masterAgenda = dayDetailData?.masterAgenda || [];
  const scheduledHabits = dayDetailData?.scheduledHabits || [];
  const activeHabitsOnDay = dayDetailData?.activeHabitsOnDay || scheduledHabits;
  const checkedHabitsOnDay = dayDetailData?.checkedHabitsOnDay || scheduledHabits.filter((h: any) => h.isCompleted);
  const uncheckedHabitsOnDay = dayDetailData?.uncheckedHabitsOnDay || scheduledHabits.filter((h: any) => !h.isCompleted);
  const offDayHabitsOnDay = dayDetailData?.offDayHabitsOnDay || [];

  const tasks = dayDetailData?.tasks || [];
  const progressEvents = dayDetailData?.progressEvents || [];
  const sessions = dayDetailData?.sessions || [];
  const screenRecord = dayDetailData?.screenRecord;
  const analytics = dayDetailData?.analytics;

  const totalItemsCount = masterAgenda.length;
  const completedItemsCount = masterAgenda.filter((item: any) => item.isCompleted).length;
  const pendingItemsCount = totalItemsCount - completedItemsCount;
  const overallCompletionPct = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

  const filteredAgenda = masterAgenda.filter((item: any) => {
    if (agendaFilter === 'completed') return item.isCompleted;
    if (agendaFilter === 'pending') return !item.isCompleted;
    return true;
  });

  const displayedHabits = habitFilter === 'checked'
    ? checkedHabitsOnDay
    : habitFilter === 'unchecked'
    ? uncheckedHabitsOnDay
    : habitFilter === 'off_day'
    ? offDayHabitsOnDay
    : activeHabitsOnDay;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Activity Log & Details — ${selectedDate || ''}`}
      maxWidth="max-w-3xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading activity records for {selectedDate}...</div>
      ) : dayDetailData ? (
        <div className="space-y-4 text-xs">
          {/* Rest Day / Holiday Annotation Banner */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-white flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Rest Day / Holiday Annotation</span>
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mark intentional rest or holidays so pause in activity is treated as planned recovery.
              </p>
              {analytics?.isHolidayOrRestDay && analytics?.restDayNote && (
                <p className="text-[11px] text-amber-300 font-medium mt-1">
                  Note: "{analytics.restDayNote}"
                </p>
              )}
            </div>
            <button
              onClick={() => toggleRestDayMutation.mutate({
                date: selectedDate!,
                isRest: !analytics?.isHolidayOrRestDay,
                note: restDayNoteInput
              })}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition shrink-0 ${
                analytics?.isHolidayOrRestDay
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {analytics?.isHolidayOrRestDay ? 'Remove Rest Day' : 'Mark as Rest Day'}
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="text-slate-400 text-[10px] block">Consistency</span>
              <span className="text-base font-bold text-white">{analytics?.consistencyScore || 0}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="text-slate-400 text-[10px] block">Tasks Completed</span>
              <span className="text-base font-bold text-emerald-400">
                {tasks.filter((t: any) => t.status === 'completed').length} / {tasks.length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="text-slate-400 text-[10px] block">Habits Done</span>
              <span className="text-base font-bold text-indigo-400">
                {scheduledHabits.filter((h: any) => h.isCompleted).length} / {scheduledHabits.length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/50">
              <span className="text-slate-400 text-[10px] block">Goal Progress</span>
              <span className="text-base font-bold text-teal-400">+{analytics?.goalProgressDelta || 0}%</span>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex border-b border-slate-700 overflow-x-auto">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'agenda'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Events To-Do ({totalItemsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'tasks'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks ({tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('habits')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'habits'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Scheduled Habits ({scheduledHabits.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('goals')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'goals'
                  ? 'border-teal-500 text-teal-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Goal Events ({progressEvents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('time')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 transition flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === 'time'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Work & Screen ({Math.round((analytics?.totalWorkMinutes || 0) / 60)}h)</span>
            </button>
          </div>

          {/* TAB 0: MASTER AGENDA — ALL EVENTS THAT HAD TO BE DONE */}
          {activeTab === 'agenda' && (
            <div className="space-y-3">
              {/* Overall Agenda Progress Bar */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">Events Scheduled for this Day</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
                      {completedItemsCount} Done / {pendingItemsCount} Pending
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs text-white">{overallCompletionPct}% Completed</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{ width: `${overallCompletionPct}%` }}
                  />
                </div>

                {/* Filter Selector */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Filter:</span>
                  {(['all', 'pending', 'completed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setAgendaFilter(f)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition capitalize ${
                        agendaFilter === f
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f === 'all' ? `All (${totalItemsCount})` : f === 'pending' ? `Pending To-Do (${pendingItemsCount})` : `Completed (${completedItemsCount})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of All Events */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredAgenda.length > 0 ? (
                  filteredAgenda.map((item: any) => {
                    const isDone = item.isCompleted;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isDone
                            ? 'bg-emerald-950/15 border-emerald-800/40'
                            : 'bg-slate-800/80 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                            ) : (
                              <Circle className="w-4 h-4 text-amber-400" />
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-xs ${isDone ? 'text-slate-300' : 'text-white'}`}>
                                {item.title}
                              </span>

                              {/* Kind Tag */}
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                                item.kind === 'task'
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50'
                                  : item.kind === 'habit'
                                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50'
                                  : 'bg-teal-950/60 text-teal-300 border border-teal-700/50'
                              }`}>
                                {item.kind === 'task' ? 'Task' : item.kind === 'habit' ? 'Habit' : 'Goal Event'}
                              </span>

                              {item.priority && (
                                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded uppercase ${
                                  item.priority === 'urgent' ? 'bg-rose-950/50 text-rose-300' : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {item.priority}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              {item.goalTitle && (
                                <span className="text-teal-400 font-medium">🎯 {item.goalTitle}</span>
                              )}
                              {item.category && <span>{item.category}</span>}
                              {item.durationMinutes && (
                                <span className="flex items-center gap-1 font-mono text-cyan-400">
                                  <Clock className="w-2.5 h-2.5" /> {item.durationMinutes}m
                                </span>
                              )}
                              {item.timeOfDay && (
                                <span className="capitalize text-slate-400">Cadence: {item.timeOfDay}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Label */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize shrink-0 ${
                          isDone
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                            : 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
                        }`}>
                          {item.statusLabel}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-500 italic py-6 text-center">No events match the selected filter.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Task Completion Bar */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Tasks Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 font-bold">
                    {tasks.filter((t: any) => t.status === 'completed').length} Done
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-700/50 font-bold">
                    {tasks.filter((t: any) => t.status !== 'completed').length} NOT Done
                  </span>
                </div>
                <span className="text-slate-400 font-mono font-bold">
                  {tasks.length > 0 ? Math.round((tasks.filter((t: any) => t.status === 'completed').length / tasks.length) * 100) : 0}% Done
                </span>
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {/* Completed Tasks */}
                  {tasks.filter((t: any) => t.status === 'completed').map((t: any) => (
                    <div key={t._id} className="p-3 rounded-xl border bg-emerald-950/15 border-emerald-800/40 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-slate-200">
                          ✓ {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {t.goal?.title && <span className="text-teal-400 font-medium">🎯 {t.goal.title}</span>}
                          <span>Duration: {t.actualMinutes || t.estimatedMinutes || 30}m</span>
                          {t.priority && <span className="uppercase text-slate-400">Priority: {t.priority}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                        ✓ DONE
                      </span>
                    </div>
                  ))}

                  {/* Pending / NOT Done Tasks */}
                  {tasks.filter((t: any) => t.status !== 'completed').map((t: any) => (
                    <div key={t._id} className="p-3 rounded-xl border bg-slate-800/80 border-slate-700/70 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-semibold block text-white">
                          ⏳ {t.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {t.goal?.title && <span className="text-teal-400 font-medium">🎯 {t.goal.title}</span>}
                          <span>Est: {t.estimatedMinutes || 30}m</span>
                          {t.priority && <span className="uppercase text-amber-400 font-semibold">Priority: {t.priority}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-950/70 text-amber-300 border border-amber-700/60">
                        ⏳ NOT DONE
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic py-4 text-center">No tasks scheduled for this day.</p>
              )}
            </div>
          )}

          {/* TAB 2: SCHEDULED HABITS */}
          {activeTab === 'habits' && (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Habit Completion Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">Habit Routine Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 font-bold">
                    {checkedHabitsOnDay.length} Done / Checked
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-700/50 font-bold">
                    {uncheckedHabitsOnDay.length} Unchecked / Due
                  </span>
                  <span className="text-slate-400 font-mono">
                    ({activeHabitsOnDay.length} Active Habits on this day)
                  </span>
                </div>
                <span className="text-indigo-400 font-mono font-bold self-end sm:self-auto">
                  {activeHabitsOnDay.length > 0 ? Math.round((checkedHabitsOnDay.length / activeHabitsOnDay.length) * 100) : 0}% Adherence
                </span>
              </div>

              {/* Sub-Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-medium">Show:</span>
                {[
                  { id: 'all', label: `All Active (${activeHabitsOnDay.length})` },
                  { id: 'checked', label: `Done Checked (${checkedHabitsOnDay.length})` },
                  { id: 'unchecked', label: `Unchecked Due (${uncheckedHabitsOnDay.length})` },
                  ...(offDayHabitsOnDay.length > 0 ? [{ id: 'off_day', label: `Off-Day (${offDayHabitsOnDay.length})` }] : [])
                ].map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => setHabitFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
                      habitFilter === f.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-850 text-slate-400 hover:text-white border border-slate-750'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Habits List */}
              {displayedHabits.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {displayedHabits.map((h: any) => {
                    const isChecked = h.isCompleted;
                    const isOffDay = habitFilter === 'off_day' || !h.isScheduledToday;

                    return (
                      <div
                        key={h._id}
                        className={`p-3 rounded-xl border flex flex-col justify-between gap-2 transition ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-700/60 shadow-xs'
                            : isOffDay
                            ? 'bg-slate-900/60 border-slate-800/80 opacity-70'
                            : 'bg-slate-850 border-slate-700/80 hover:border-slate-650'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                              {h.category}
                            </span>
                            {h.currentStreak !== undefined && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/20">
                                <Flame className="w-3 h-3 fill-amber-400" />
                                <span>{h.currentStreak}d</span>
                              </span>
                            )}
                          </div>

                          <h4 className={`text-xs font-bold leading-snug ${isChecked ? 'text-emerald-300' : 'text-white'}`}>
                            {isChecked ? '✓ ' : '⏳ '}{h.title}
                          </h4>

                          {h.description && (
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                              {h.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 capitalize flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-slate-500" />
                            <span>{h.timeOfDay || 'Anytime'}</span>
                          </span>

                          <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                            isChecked
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                              : isOffDay
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
                          }`}>
                            {isChecked ? '✓ DONE' : isOffDay ? 'OFF-DAY' : 'NOT DONE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic py-6 text-center">No habits match the selected filter.</p>
              )}
            </div>
          )}

          {/* TAB 3: GOAL PROGRESS EVENTS */}
          {activeTab === 'goals' && (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {progressEvents.length > 0 ? (
                progressEvents.map((e: any) => (
                  <div key={e._id} className="p-3 rounded-xl bg-teal-950/25 border border-teal-800/40 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-teal-300 flex items-center gap-1.5">
                        {e.eventType === 'milestone_completed' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                            ★ MILESTONE COMPLETED
                          </span>
                        ) : (
                          <span>🎯 {e.goal?.title || 'Goal Progress'}</span>
                        )}
                      </span>
                      <p className="text-[11px] text-slate-300">
                        {e.milestone?.title ? `Milestone: ${e.milestone.title}` : (e.notes || 'Numerical advancement')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-teal-400">+{e.progressDelta}%</span>
                      <p className="text-[10px] text-slate-500">{e.previousProgress}% &rarr; {e.newProgress}%</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic py-4 text-center">No goal progress events recorded on this day.</p>
              )}
            </div>
          )}

          {/* TAB 4: TIME & SCREEN */}
          {activeTab === 'time' && (
            <div className="space-y-3">
              <div>
                <h5 className="font-semibold text-slate-300 mb-1.5">Focus Work Sessions ({sessions.length})</h5>
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {sessions.length > 0 ? (
                    sessions.map((s: any) => (
                      <div key={s._id} className="p-2 rounded-lg bg-slate-800 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-medium text-slate-200">{s.category || 'Study'}</span>
                          {s.goal?.title && <span className="text-teal-400 ml-2 text-[10px]">🎯 {s.goal.title}</span>}
                        </div>
                        <span className="font-mono text-cyan-400 font-bold">{s.durationMinutes} min</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic">No focus sessions recorded.</p>
                  )}
                </div>
              </div>

              {screenRecord ? (
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2">
                  <h5 className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Digital Screen Time Usage</span>
                  </h5>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900">
                      <span className="text-slate-400 block text-[10px]">Productive</span>
                      <span className="font-bold text-emerald-400">{screenRecord.productiveMinutes} min</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900">
                      <span className="text-slate-400 block text-[10px]">Distracting</span>
                      <span className="font-bold text-rose-400">{screenRecord.distractingMinutes} min</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900">
                      <span className="text-slate-400 block text-[10px]">Total Recorded</span>
                      <span className="font-bold text-white">{screenRecord.totalMinutes} min</span>
                    </div>
                  </div>

                  {screenRecord.appUsage && screenRecord.appUsage.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold block mb-1">App Usage Breakdown:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {screenRecord.appUsage.map((app: any, idx: number) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              app.isDistracting ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                            }`}
                          >
                            {app.appName}: {app.minutes}m
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-800/40 text-center text-slate-500 italic">
                  No screen time log recorded for this date.
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};