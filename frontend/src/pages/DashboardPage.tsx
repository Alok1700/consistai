import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useTimerStore } from '../store/timerStore';
import { Goal, Task, Habit, Milestone } from '../types';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Timer,
  PlayCircle,
  Flame,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Target,
  Clock,
  Lightbulb,
  Check,
  ChevronRight,
  Layers,
  Zap,
  BarChart2
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { startTimer } = useTimerStore();

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const formattedDate = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Time-aware greeting
  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // 1. Fetch Goals
  const { data: goalsData } = useQuery<{ goals: Goal[] }>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  // 2. Fetch Tasks for Today
  const { data: tasksData } = useQuery<{ tasks: Task[]; stats: any }>({
    queryKey: ['tasks-today', todayStr],
    queryFn: async () => {
      const res = await api.get(`/tasks?date=${todayStr}`);
      return res.data;
    }
  });

  // 3. Fetch Habits
  const { data: habitsData } = useQuery<{ habits: Habit[] }>({
    queryKey: ['habits'],
    queryFn: async () => {
      const res = await api.get('/habits');
      return res.data;
    }
  });

  // 4. Fetch Overview Stats
  const { data: overview } = useQuery({
    queryKey: ['overview-stats'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    }
  });

  // 5. Fetch Latest ML / Analytical Recommendation
  const { data: latestML } = useQuery({
    queryKey: ['latest-ml'],
    queryFn: async () => {
      const res = await api.get('/ml/latest');
      return res.data;
    }
  });

  // Task Mutations
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.patch(`/tasks/${taskId}/toggle`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const quickAddTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post('/tasks', {
        title,
        dueDate: todayStr,
        taskType: 'daily',
        priority: 'medium'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      setNewTaskTitle('');
    }
  });

  // Habit Check-in Mutation
  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: string) => {
      const res = await api.post(`/habits/${habitId}/checkin`, { date: todayStr });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    }
  });

  const goals = goalsData?.goals || [];
  const primaryGoal =
    goals.find((g) => g.isPrimaryGoal && g.status === 'active') ||
    goals.find((g) => g.status === 'active') ||
    null;

  const milestones: any[] = (primaryGoal?.milestones as any[]) || [];
  const nextModule =
    milestones.find((m) => !m.isCompleted && m.status !== 'completed' && m.status !== 'skipped') ||
    null;

  const tasks = tasksData?.tasks || [];
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  const habits = habitsData?.habits || [];
  const activeHabits = habits.filter((h) => h.active);

  const stats = overview?.stats;
  const consistencyScore = stats?.consistencyScore ?? 85;
  const focusHoursToday = Number(stats?.todayWorkHours || 0).toFixed(1);

  // Top Actionable Improvement Insight
  const topInsight =
    latestML?.recommendations && latestML.recommendations.length > 0
      ? latestML.recommendations[0]
      : null;

  const handleStartModuleFocus = () => {
    if (!primaryGoal) return;
    if (nextModule) {
      startTimer(45, primaryGoal._id, null, 'Module Study', `Module: ${nextModule.title}`);
    } else {
      startTimer(45, primaryGoal._id, null, 'Goal Study', `Goal: ${primaryGoal.title}`);
    }
    navigate('/focus');
  };

  const handleStartTaskFocus = (task: Task) => {
    startTimer(
      task.estimatedMinutes || 25,
      (task.goal as any)?._id || (task.goal as string) || null,
      task._id,
      'Task Execution',
      task.title
    );
    navigate('/focus');
  };

  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    quickAddTaskMutation.mutate(newTaskTitle.trim());
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header: Greeting & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#263247]">
        <div>
          <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Scholar'}
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Focus on what moves the needle today. Build consistency, one milestone at a time.
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/focus"
            className="px-3.5 py-1.5 rounded-xl bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <Timer className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Focus Mode</span>
          </Link>
          <Link
            to="/goals"
            className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#8B5CF6]/20"
          >
            <Target className="w-3.5 h-3.5" />
            <span>My Goals</span>
          </Link>
        </div>
      </div>

      {/* 2. Daily Summary: 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Consistency Score */}
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              Consistency
            </span>
            <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">
              {consistencyScore}%
            </span>
            <span className="text-[10px] text-[#10B981] font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Optimal Rhythm</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Focus Hours */}
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              Focus Hours
            </span>
            <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">
              {focusHoursToday}h
            </span>
            <span className="text-[10px] text-[#94A3B8] font-medium block mt-0.5">
              Target: 4.0h daily
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Tasks Completed */}
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              Tasks Done
            </span>
            <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">
              {completedTasks.length}/{tasks.length}
            </span>
            <span className="text-[10px] text-[#94A3B8] font-medium block mt-0.5">
              {pendingTasks.length} pending
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Habits Completed */}
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              Active Habits
            </span>
            <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">
              {activeHabits.length}
            </span>
            <span className="text-[10px] text-[#F59E0B] font-semibold flex items-center gap-1 mt-0.5">
              <Flame className="w-3 h-3" />
              <span>Daily routines</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Continue Working: Primary Active Goal */}
      {primaryGoal ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263247] pb-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Primary Goal Roadmap</span>
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#F8FAFC] mt-0.5">
                {primaryGoal.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-[#F8FAFC] block">
                  {primaryGoal.currentProgressPercentage || 0}% Completed
                </span>
                <span className="text-[11px] text-[#94A3B8] block">
                  {primaryGoal.category} · Target: {new Date(primaryGoal.targetDate).toLocaleDateString()}
                </span>
              </div>
              <Link
                to={`/goals/${primaryGoal._id}`}
                className="px-3.5 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition flex items-center gap-1"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#0B0F19] rounded-full h-2 overflow-hidden border border-[#263247]">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, primaryGoal.currentProgressPercentage || 0)}%` }}
            />
          </div>

          {/* Next Immediate Action Module */}
          {nextModule ? (
            <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#263247] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                    Next Incomplete Module
                  </span>
                  <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                    #{String(nextModule.sequenceNumber || nextModule.order || 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#F8FAFC] truncate">{nextModule.title}</h3>
                <p className="text-xs text-[#94A3B8] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>Estimated: {nextModule.estimatedEffort || '45 mins'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/goals/${primaryGoal._id}`}
                  className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>View Checklist</span>
                </Link>

                <button
                  type="button"
                  onClick={handleStartModuleFocus}
                  className="px-3.5 py-2 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-[#94A3B8] hover:text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Timer className="w-4 h-4 text-[#8B5CF6]" />
                  <span>45m Focus</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-xs text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl font-medium">
              All modules in your primary roadmap are complete! Set your next milestone in My Goals.
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#161E2E] border border-[#263247] text-center space-y-3">
          <Target className="w-8 h-8 text-[#8B5CF6] mx-auto opacity-70" />
          <div>
            <h2 className="text-sm font-bold text-[#F8FAFC]">No Active Goal Selected</h2>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto mt-0.5">
              Create or select a primary roadmap to track sequential modules, milestones, and daily pacing right here.
            </p>
          </div>
          <Link
            to="/goals"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition"
          >
            <span>Explore Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Two-Column Execution: Today's Work & Habits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Column A: Today's Work */}
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Today's Work ({completedTasks.length}/{tasks.length})</span>
            </h3>
            <Link to="/tasks" className="text-xs text-[#8B5CF6] hover:text-[#7C3AED] font-semibold">
              View All Tasks →
            </Link>
          </div>

          {/* Quick Add Input */}
          <form onSubmit={handleQuickAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add action item for today..."
              className="flex-1 px-3 py-2 bg-[#0B0F19] border border-[#263247] rounded-xl text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || quickAddTaskMutation.isPending}
              className="px-3.5 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Tasks List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B] italic bg-[#0B0F19] rounded-xl border border-dashed border-[#263247]">
                No tasks scheduled for today. Add quick action items above.
              </div>
            ) : (
              tasks.map((t) => {
                const isDone = t.status === 'completed';
                return (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-2.5 bg-[#0B0F19] border border-[#263247] rounded-xl text-xs hover:border-[#8B5CF6]/30 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleTaskMutation.mutate(t._id)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition cursor-pointer ${
                          isDone
                            ? 'bg-[#10B981] border border-[#10B981] text-white'
                            : 'bg-[#111827] border-2 border-[#263247] hover:border-[#10B981]'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span className={`truncate font-medium ${isDone ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => handleStartTaskFocus(t)}
                          className="p-1 text-[#64748B] hover:text-[#8B5CF6] transition cursor-pointer"
                          title="Start focus timer"
                        >
                          <Timer className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          t.priority === 'urgent'
                            ? 'bg-[#EF4444]/20 text-[#EF4444]'
                            : t.priority === 'high'
                            ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                            : 'bg-[#1C2638] text-[#94A3B8]'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column B: Today's Habits */}
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#F59E0B]" />
              <span>Today's Habits</span>
            </h3>
            <Link to="/habits" className="text-xs text-[#8B5CF6] hover:text-[#7C3AED] font-semibold">
              Manage Habits →
            </Link>
          </div>

          <div className="space-y-2">
            {activeHabits.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#64748B] italic bg-[#0B0F19] rounded-xl border border-dashed border-[#263247]">
                No active habits configured. Create your routines in Habits.
              </div>
            ) : (
              activeHabits.map((h) => {
                return (
                  <div
                    key={h._id}
                    className="flex items-center justify-between p-2.5 bg-[#0B0F19] border border-[#263247] rounded-xl text-xs hover:border-[#8B5CF6]/30 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleHabitMutation.mutate(h._id)}
                        className="w-5 h-5 rounded-md bg-[#111827] border-2 border-[#263247] hover:border-[#10B981] hover:bg-[#10B981]/20 flex items-center justify-center transition cursor-pointer text-[#10B981]"
                        title="Log habit check-in"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div className="truncate">
                        <span className="text-[#F8FAFC] font-medium block truncate">{h.title}</span>
                        <span className="text-[10px] text-[#64748B] block">{h.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[#F59E0B] font-bold text-xs">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{h.currentStreak || 0}d streak</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Intelligent Insight: One actionable observation with View Analysis */}
      {topInsight && (
        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#8B5CF6]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">
                  Actionable Productivity Insight
                </span>
                <span className="text-[10px] text-[#64748B]">Evidence-based pattern</span>
              </div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">{topInsight.title || topInsight.observation}</h4>
              <p className="text-[#94A3B8] leading-relaxed">
                {topInsight.recommended_action || topInsight.suggested_action || topInsight.observation}
              </p>
            </div>
          </div>

          <Link
            to="/analytics"
            className="px-3.5 py-2 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-[#8B5CF6] hover:text-[#7C3AED] font-bold text-xs transition flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>View Analysis</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
