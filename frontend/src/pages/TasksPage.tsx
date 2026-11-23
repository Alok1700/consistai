import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Task, Goal } from '../types';
import { useTimerStore } from '../store/timerStore';
import { useNavigate } from 'react-router-dom';
import { CreateTaskModal } from '../components/Common/CreateTaskModal';
import {
  CheckSquare,
  Plus,
  Clock,
  Target,
  Trash2,
  Calendar,
  AlertCircle,
  Check,
  Timer,
  Search,
  Flag,
  CalendarRange,
  CalendarDays,
  Filter,
  ArrowUpDown,
  Sparkles,
  Layers
} from 'lucide-react';

const getLocalDateString = (dateVal?: string | Date | null) => {
  if (!dateVal) return '';
  const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { startTimer } = useTimerStore();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed' | 'all'>('today');
  const [createdDateFilter, setCreatedDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [cadenceFilter, setCadenceFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'goal_linked'>('all');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'due_date' | 'priority'>('created_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [quickCadence, setQuickCadence] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const todayStr = getLocalDateString(new Date());

  // Fetch all tasks from backend with sorting by createdAt
  const { data: tasksData, isLoading } = useQuery<{ tasks: Task[]; stats: any }>({
    queryKey: ['tasks', sortBy],
    queryFn: async () => {
      const sortParam = sortBy === 'created_desc' ? 'created' : sortBy === 'created_asc' ? 'created_asc' : sortBy === 'due_date' ? 'dueDate' : 'priority';
      const res = await api.get(`/tasks?sortBy=${sortParam}`);
      return res.data;
    }
  });

  const tasks: Task[] = tasksData?.tasks || [];

  // Toggle completion
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.patch(`/tasks/${taskId}/toggle`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview-v3'] });
    }
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview-v3'] });
    }
  });

  // Inline quick create (creates task for today, default daily cadence)
  const quickCreateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/tasks', {
        title: quickTitle.trim(),
        dueDate: todayStr,
        priority: quickPriority,
        taskType: quickCadence,
        estimatedMinutes: 45
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview-v3'] });
      setQuickTitle('');
    }
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    quickCreateMutation.mutate();
  };

  const handleStartFocus = (task: Task) => {
    startTimer(
      task.estimatedMinutes || 25,
      (task.goal as any)?._id || (task.goal as string) || null,
      task._id,
      'Task Execution',
      task.title
    );
    navigate('/focus');
  };

  // Helper date arithmetic for week & month
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = (now.getDay() + 6) % 7; // Mon = 0
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  const startOfWeekStr = getLocalDateString(startOfWeek);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfMonthStr = getLocalDateString(startOfMonth);

  // Filter tasks based on activeTab, createdDateFilter, cadenceFilter, and search query
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!t.title.toLowerCase().includes(q)) return false;
      }

      // 2. Created Date Filter
      const createdStr = getLocalDateString(t.createdAt);
      if (createdDateFilter === 'today') {
        if (createdStr !== todayStr) return false;
      } else if (createdDateFilter === 'week') {
        if (!createdStr || createdStr < startOfWeekStr) return false;
      } else if (createdDateFilter === 'month') {
        if (!createdStr || createdStr < startOfMonthStr) return false;
      }

      // 3. Cadence / Type Filter
      if (cadenceFilter === 'daily' && t.taskType !== 'daily') return false;
      if (cadenceFilter === 'weekly' && t.taskType !== 'weekly') return false;
      if (cadenceFilter === 'monthly' && t.taskType !== 'monthly') return false;
      if (cadenceFilter === 'goal_linked' && !t.isGoalRelevant && !t.goal) return false;

      // 4. Status & Schedule Tab Filter
      const isCompleted = t.status === 'completed';
      const dueStr = getLocalDateString(t.dueDate);
      const isCreatedToday = createdStr === todayStr;
      const isDueToday = dueStr === todayStr;

      if (activeTab === 'completed') return isCompleted;
      if (isCompleted && activeTab !== 'all') return false;

      if (activeTab === 'today') {
        // A task belongs in Today if it was created today, is due today, has daily cadence, or has no due date
        return isDueToday || isCreatedToday || t.taskType === 'daily' || !dueStr;
      }

      if (activeTab === 'upcoming') {
        // Due after today and not completed
        if (!dueStr) return false;
        return dueStr > todayStr && !isCompleted;
      }

      if (activeTab === 'overdue') {
        // Due before today and not completed, and not created today
        if (!dueStr) return false;
        return dueStr < todayStr && !isCompleted && !isCreatedToday;
      }

      // 'all'
      return true;
    }).sort((a, b) => {
      if (sortBy === 'created_desc') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === 'created_asc') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      } else if (sortBy === 'due_date') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      } else if (sortBy === 'priority') {
        const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityRank[b.priority] || 2) - (priorityRank[a.priority] || 2);
      }
      return 0;
    });
  }, [tasks, activeTab, createdDateFilter, cadenceFilter, sortBy, searchQuery, todayStr, startOfWeekStr, startOfMonthStr]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    tasks.forEach((t) => {
      const isCompleted = t.status === 'completed';
      if (isCompleted) {
        completedCount++;
        return;
      }
      const dueStr = getLocalDateString(t.dueDate);
      const createdStr = getLocalDateString(t.createdAt);
      const isCreatedToday = createdStr === todayStr;
      const isDueToday = dueStr === todayStr;

      if (isDueToday || isCreatedToday || t.taskType === 'daily' || !dueStr) {
        todayCount++;
      } else if (dueStr > todayStr) {
        upcomingCount++;
      } else if (dueStr < todayStr && !isCreatedToday) {
        overdueCount++;
      }
    });

    return {
      today: todayCount,
      upcoming: upcomingCount,
      overdue: overdueCount,
      completed: completedCount,
      all: tasks.length
    };
  }, [tasks, todayStr]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263247] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-[#8B5CF6]" />
            <span>Tasks</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Organize daily actions, track execution by creation date, and filter by milestone cadences.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-md shadow-[#8B5CF6]/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Primary Status Tabs: Today, Upcoming, Overdue, Completed, All */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#161E2E] border border-[#263247]">
        <div className="flex items-center gap-1 overflow-x-auto p-0.5 no-scrollbar">
          {[
            { id: 'today', label: 'Today', count: tabCounts.today },
            { id: 'upcoming', label: 'Upcoming', count: tabCounts.upcoming },
            { id: 'overdue', label: 'Overdue', count: tabCounts.overdue, alert: tabCounts.overdue > 0 },
            { id: 'completed', label: 'Completed', count: tabCounts.completed },
            { id: 'all', label: 'All Tasks', count: tabCounts.all }
          ].map((tab) => {
            const isMatch = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isMatch
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isMatch
                      ? 'bg-white/20 text-white'
                      : tab.alert
                      ? 'bg-[#EF4444]/20 text-[#EF4444] font-bold'
                      : 'bg-[#1C2638] text-[#94A3B8]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative px-2 sm:px-0">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full sm:w-48 pl-8 pr-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
      </div>

      {/* Secondary Filter & Sort Toolbar (Filter by Task Created & Cadence) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#161E2E] border border-[#263247] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Created Date Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247]">
            <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="text-[#94A3B8]">Created:</span>
            <select
              value={createdDateFilter}
              onChange={(e) => setCreatedDateFilter(e.target.value as any)}
              className="bg-transparent text-[#F8FAFC] font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#161E2E]">All Creation Dates</option>
              <option value="today" className="bg-[#161E2E]">Created Today</option>
              <option value="week" className="bg-[#161E2E]">Created This Week</option>
              <option value="month" className="bg-[#161E2E]">Created This Month</option>
            </select>
          </div>

          {/* Cadence Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247]">
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#94A3B8]">Cadence:</span>
            <select
              value={cadenceFilter}
              onChange={(e) => setCadenceFilter(e.target.value as any)}
              className="bg-transparent text-[#F8FAFC] font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-[#161E2E]">All Cadences</option>
              <option value="daily" className="bg-[#161E2E]">Daily Tasks</option>
              <option value="weekly" className="bg-[#161E2E]">Weekly Tasks</option>
              <option value="monthly" className="bg-[#161E2E]">Monthly Tasks</option>
              <option value="goal_linked" className="bg-[#161E2E]">Goal-Linked Only</option>
            </select>
          </div>
        </div>

        {/* Sort By Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247]">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-[#94A3B8]">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[#F8FAFC] font-semibold outline-none cursor-pointer text-xs"
          >
            <option value="created_desc" className="bg-[#161E2E]">Created (Newest First)</option>
            <option value="created_asc" className="bg-[#161E2E]">Created (Oldest First)</option>
            <option value="due_date" className="bg-[#161E2E]">Due Date (Soonest)</option>
            <option value="priority" className="bg-[#161E2E]">Priority (Urgent First)</option>
          </select>
        </div>
      </div>

      {/* Inline Quick Create Bar */}
      <form
        onSubmit={handleQuickSubmit}
        className="p-3 rounded-2xl bg-[#161E2E] border border-[#263247] flex flex-wrap sm:flex-nowrap items-center gap-2 shadow-sm"
      >
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Add a new task: e.g. Solve 2 Sliding Window LeetCode problems..."
          className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
        />

        <select
          value={quickCadence}
          onChange={(e) => setQuickCadence(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
        >
          <option value="daily">Daily Cadence</option>
          <option value="weekly">Weekly Cadence</option>
          <option value="monthly">Monthly Cadence</option>
        </select>

        <select
          value={quickPriority}
          onChange={(e) => setQuickPriority(e.target.value as any)}
          className="px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <button
          type="submit"
          disabled={!quickTitle.trim() || quickCreateMutation.isPending}
          className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{quickCreateMutation.isPending ? 'Adding...' : 'Add'}</span>
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-12 p-6 rounded-2xl bg-[#161E2E] border border-[#263247] text-xs text-[#94A3B8]">
            Loading tasks according to created date and schedule...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 p-6 rounded-2xl bg-[#161E2E] border border-dashed border-[#263247] text-[#94A3B8]">
            <CheckSquare className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#F8FAFC]">No tasks match this filter</p>
            <p className="text-xs text-[#64748B] mt-1">
              {createdDateFilter !== 'all'
                ? `No tasks were created ${createdDateFilter === 'today' ? 'today' : createdDateFilter === 'week' ? 'this week' : 'this month'}. Change the Created filter to "All Creation Dates".`
                : 'Use the quick add bar above or click "+ New Task" to create your next action item.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === 'completed';
            const goalObj = typeof task.goal === 'object' ? task.goal : null;
            const createdStr = getLocalDateString(task.createdAt);
            const dueStr = getLocalDateString(task.dueDate);
            const isCreatedToday = createdStr === todayStr;

            return (
              <div
                key={task._id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-[#161E2E]/50 border-[#263247]/60 opacity-75'
                    : 'bg-[#161E2E] border-[#263247] hover:border-[#8B5CF6]/40'
                }`}
              >
                {/* Left: Square Checkbox + Title */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleTaskMutation.mutate(task._id)}
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                      isDone
                        ? 'bg-[#10B981] border border-[#10B981] text-white'
                        : 'bg-[#0B0F19] border-2 border-[#263247] hover:border-[#10B981]'
                    }`}
                  >
                    {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs sm:text-sm font-medium block truncate ${
                        isDone ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-[#64748B]">
                      {/* Created Date Badge */}
                      {task.createdAt && (
                        <span className={`flex items-center gap-1 font-mono px-1.5 py-0.5 rounded-md ${
                          isCreatedToday
                            ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold'
                            : 'bg-[#0B0F19] text-[#94A3B8]'
                        }`}>
                          <span>Created {isCreatedToday ? 'Today' : createdStr}</span>
                        </span>
                      )}

                      {/* Due Date Badge */}
                      {task.dueDate && (
                        <span className="flex items-center gap-1 bg-[#0B0F19] px-1.5 py-0.5 rounded-md">
                          <Calendar className="w-3 h-3 text-[#38BDF8]" />
                          <span>Due {dueStr === todayStr ? 'Today' : dueStr}</span>
                        </span>
                      )}

                      {/* Cadence Badge */}
                      {task.taskType && (
                        <span className="flex items-center gap-1 bg-[#0B0F19] px-1.5 py-0.5 rounded-md capitalize text-[#94A3B8]">
                          <Layers className="w-3 h-3 text-[#10B981]" />
                          <span>{task.taskType}</span>
                        </span>
                      )}

                      {/* Goal Link */}
                      {goalObj && (
                        <span className="flex items-center gap-1 text-[#8B5CF6] truncate max-w-[150px] bg-[#8B5CF6]/10 px-1.5 py-0.5 rounded-md">
                          <Target className="w-3 h-3 shrink-0" />
                          <span className="truncate">{goalObj.title}</span>
                        </span>
                      )}

                      {/* Estimated duration */}
                      {task.estimatedMinutes && (
                        <span className="flex items-center gap-1 text-[#64748B]">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimatedMinutes}m</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Priority tag + Focus timer + Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      task.priority === 'urgent'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30'
                        : task.priority === 'high'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30'
                        : task.priority === 'medium'
                        ? 'bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30'
                        : 'bg-[#1C2638] text-[#94A3B8]'
                    }`}
                  >
                    {task.priority}
                  </span>

                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => handleStartFocus(task)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#8B5CF6] hover:bg-[#1C2638] transition cursor-pointer"
                      title="Focus on this task"
                    >
                      <Timer className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteTaskMutation.mutate(task._id)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#1C2638] transition cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultDate={todayStr}
      />
    </div>
  );
};
export default TasksPage;
