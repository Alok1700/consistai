import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Goal, Milestone, Task, Achievement, GoalFolder, GoalMilestone } from '../types';
import { useTimerStore } from '../store/timerStore';
import { Modal } from '../components/UI/Modal';
import { GoalAchievementJourney } from '../components/Goals/GoalAchievementJourney';
import { GoalProgressTimeline } from '../components/Goals/GoalProgressTimeline';
import { MilestoneGridView } from '../components/Goals/MilestoneGridView';
import { MilestoneDetailDrawer } from '../components/Goals/MilestoneDetailDrawer';
import { GenerateMilestonesModal } from '../components/Goals/GenerateMilestonesModal';
import { BulkImportModulesModal } from '../components/Goals/BulkImportModulesModal';
import { AchievementCelebrationModal } from '../components/Goals/AchievementCelebrationModal';
import { GoalCompletionModal } from '../components/Goals/GoalCompletionModal';
import { GoalForm } from '../components/Goals/GoalForm';
import { MoveGoalModal } from '../components/Goals/MoveGoalModal';
import { AIPlanBuilder } from '../components/Goals/AIPlanBuilder';
import { MilestoneChecklist } from '../components/Goals/MilestoneChecklist';
import { CreateMilestoneModal } from '../components/Goals/CreateMilestoneModal';
import { GoalProgressHeader } from '../components/Goals/GoalProgressHeader';
import {
  Target,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  History,
  Sliders,
  Sun,
  CalendarRange,
  Trophy,
  Trash2,
  Check,
  X,
  Map,
  BarChart3,
  Star,
  Award,
  Zap,
  Flame,
  Bot,
  Grid,
  List,
  Folder,
  PlayCircle,
  Timer,
  Upload,
  CalendarClock,
  CheckSquare,
  Info,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  ChevronDown,
  Edit2,
  Copy,
  Archive,
  Search
} from 'lucide-react';

export const GoalDetailPage: React.FC = () => {
  const { id, moduleId } = useParams<{ id: string; moduleId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { startTimer } = useTimerStore();

  // EXACTLY 4 Navigation Tabs: overview | modules | planner | analytics
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'planner' | 'analytics'>('modules');

  // Modules tab view mode: grid | list | roadmap (all 3 render the exact same milestone records!)
  const [moduleViewMode, setModuleViewMode] = useState<'grid' | 'list' | 'roadmap'>('grid');
  const [moduleStatusFilter, setModuleStatusFilter] = useState<string>('all');
  const [moduleSearchQuery, setModuleSearchQuery] = useState<string>('');

  // Dropdown States
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isAddModulesMenuOpen, setIsAddModulesMenuOpen] = useState(false);

  // Drawer & Slot Generator State
  const [selectedMilestoneForDrawer, setSelectedMilestoneForDrawer] = useState<Milestone | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Modals Local State
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isMoveGoalModalOpen, setIsMoveGoalModalOpen] = useState(false);
  const [isAddSingleMilestoneOpen, setIsAddSingleMilestoneOpen] = useState(false);
  const [isCreateMilestoneModalOpen, setIsCreateMilestoneModalOpen] = useState(false);
  const [isAIPlanBuilderOpen, setIsAIPlanBuilderOpen] = useState(false);
  const [aiBuilderMode, setAiBuilderMode] = useState<'populate_slots' | 'adjust_plan'>('populate_slots');
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [celebratedAchievement, setCelebratedAchievement] = useState<Achievement | null>(null);

  // Single Milestone Form State
  const [mTitle, setMTitle] = useState('');
  const [mEffort, setMEffort] = useState('45 mins');
  const [mDescription, setMDescription] = useState('');

  // Numerical Progress Logging State
  const [numericalAddQty, setNumericalAddQty] = useState(1);
  const [numericalNotes, setNumericalNotes] = useState('');
  const [isLoggingNumerical, setIsLoggingNumerical] = useState(false);

  // Cadence Execution State
  const [activeCadence, setActiveCadence] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newYearlyTargetDate, setNewYearlyTargetDate] = useState('');

  // Work Schedule Settings State (in Planner)
  const [selectedWorkingDays, setSelectedWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [scheduleTargetDate, setScheduleTargetDate] = useState<string>('');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  // 1. Fetch Goal Details
  const { data: goalData, isLoading, refetch } = useQuery<{ goal: Goal & { intelligence?: any } }>({
    queryKey: ['goal-detail', id],
    queryFn: async () => {
      const res = await api.get(`/goals/${id}`);
      return res.data;
    }
  });

  const goal = goalData?.goal;
  const milestones = useMemo(() => goal?.milestones || [], [goal?.milestones]);
  const pacing = goal?.pacing;
  const intelligence = (goal as any)?.intelligence || {};
  const progressEvents = (goal as any)?.progressEvents || [];
  const tasks: Task[] = (goal as any)?.tasks || [];
  const achievements: Achievement[] = (goal as any)?.achievements || [];

  // Fetch 3-Level GoalMilestones (Milestone containers with modules)
  const { data: goalMilestonesData, isLoading: goalMilestonesLoading, refetch: refetchGoalMilestones } = useQuery<{ milestones: GoalMilestone[] }>({
    queryKey: ['goal-milestones', id],
    queryFn: async () => {
      const res = await api.get(`/goals/${id}/goal-milestones`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 15000
  });
  const goalMilestones = useMemo(() => goalMilestonesData?.milestones || [], [goalMilestonesData?.milestones]);

  // 2. Fetch Folders for Move Modal & Form
  const { data: folderData } = useQuery<{ folders: GoalFolder[] }>({
    queryKey: ['goal-folders'],
    queryFn: async () => {
      const res = await api.get('/goal-folders');
      return res.data;
    }
  });
  const folders = useMemo(() => folderData?.folders || [], [folderData?.folders]);

  // Query uncelebrated achievements for this goal
  useQuery<{ achievements: Achievement[] }>({
    queryKey: ['achievements-latest', id],
    queryFn: async () => {
      const res = await api.get(`/achievements/goal/${id}`);
      const uncelebrated = (res.data.achievements || []).find((a: Achievement) => !a.celebrated);
      if (uncelebrated && !celebratedAchievement) {
        setCelebratedAchievement(uncelebrated);
      }
      return res.data;
    },
    enabled: !!id
  });

  // Deep-linking: auto-open milestone drawer if :moduleId is present
  useEffect(() => {
    if (moduleId && milestones.length > 0) {
      const found = milestones.find((m) => m._id === moduleId);
      if (found) {
        setSelectedMilestoneForDrawer(found);
        setIsDrawerOpen(true);
      }
    }
  }, [moduleId, milestones]);

  // Sync initial schedule state from goal
  useEffect(() => {
    if (goal) {
      if ((goal as any).workingDays && Array.isArray((goal as any).workingDays)) {
        setSelectedWorkingDays((goal as any).workingDays);
      }
      if (goal.targetDate) {
        setScheduleTargetDate(new Date(goal.targetDate).toISOString().slice(0, 10));
      }
    }
  }, [goal]);

  // Mutations
  const setPrimaryGoalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/goals/${id}/primary`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/goals/${id}/favorite`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/goals/${id}/archive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      navigate('/goals');
    }
  });

  const duplicateGoalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/goals/${id}/duplicate`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (data?.goal?._id) {
        navigate(`/goals/${data.goal._id}`);
      }
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      navigate('/goals');
    }
  });

  const moveGoalMutation = useMutation({
    mutationFn: async ({ folderId, folderName }: { folderId: string; folderName: string }) => {
      const res = await api.patch(`/goals/${id}/move`, { folderId, folder: folderName });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const updateMilestoneStatusMutation = useMutation({
    mutationFn: async ({ mId, status }: { mId: string; status: string }) => {
      const res = await api.patch(`/milestones/${mId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const addSingleMilestoneMutation = useMutation({
    mutationFn: async () => {
      const nextOrder = milestones.length + 1;
      const res = await api.post(`/goals/${id}/milestones`, {
        title: mTitle.trim(),
        description: mDescription.trim(),
        estimatedEffort: mEffort.trim() || '45 mins',
        sequenceNumber: nextOrder,
        order: nextOrder,
        weight: 1.0,
        targetQuantity: 1
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsAddSingleMilestoneOpen(false);
      setMTitle('');
      setMDescription('');
      setMEffort('45 mins');
    }
  });

  const extendDeadlineMutation = useMutation({
    mutationFn: async (days: number) => {
      const currentTarget = new Date(goal?.targetDate || new Date());
      currentTarget.setDate(currentTarget.getDate() + days);
      const res = await api.patch(`/goals/${id}`, {
        targetDate: currentTarget.toISOString()
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async ({ title, taskType }: { title: string; taskType: string }) => {
      const res = await api.post('/tasks', {
        title,
        taskType,
        goal: id,
        dueDate: new Date().toISOString()
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      setNewTaskTitle('');
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.patch(`/tasks/${taskId}/toggle`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
    }
  });

  const addYearlyTargetMutation = useMutation({
    mutationFn: async ({ target, targetDate }: { target: string; targetDate?: string }) => {
      const res = await api.post(`/goals/${id}/yearly-targets`, { target, targetDate });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      setNewTaskTitle('');
      setNewYearlyTargetDate('');
    }
  });

  const toggleYearlyTargetMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const res = await api.patch(`/goals/${id}/yearly-targets/${targetId}/toggle`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
    }
  });

  const deleteYearlyTargetMutation = useMutation({
    mutationFn: async (targetId: string) => {
      await api.delete(`/goals/${id}/yearly-targets/${targetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
    }
  });

  // Handle Numerical Progress
  const handleLogNumerical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || numericalAddQty <= 0) return;
    try {
      setIsLoggingNumerical(true);
      await api.post(`/goals/${id}/progress`, {
        quantityAdded: Number(numericalAddQty),
        notes: numericalNotes.trim()
      });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setNumericalAddQty(1);
      setNumericalNotes('');
    } catch (err) {
      console.error('Failed to log progress', err);
    } finally {
      setIsLoggingNumerical(false);
    }
  };

  // Handle Save Work Schedule
  const handleSaveSchedule = async () => {
    try {
      setIsSavingSchedule(true);
      await api.patch(`/goals/${id}`, {
        workingDays: selectedWorkingDays,
        targetDate: scheduleTargetDate ? new Date(scheduleTargetDate).toISOString() : goal?.targetDate
      });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    } catch (err) {
      console.error('Failed to update schedule', err);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Cadence task collections
  const dailyTasks = tasks.filter((t) => t.taskType === 'daily');
  const weeklyTasks = tasks.filter((t) => t.taskType === 'weekly');
  const monthlyTasks = tasks.filter((t) => t.taskType === 'monthly');
  const yearlyTasks = tasks.filter((t) => t.taskType === 'yearly');
  const yearlyTargets = goal?.yearlyTargets || [];

  const completedMilestonesCount = milestones.filter(
    (m) => m.isCompleted || m.status === 'completed'
  ).length;

  const nextIncompleteMilestone =
    intelligence?.nextModule ||
    milestones.find((m) => !m.isCompleted && m.status !== 'completed' && m.status !== 'skipped') ||
    null;

  // Filtered milestones for the Modules tab
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      // Status filter
      if (moduleStatusFilter === 'completed' && !m.isCompleted && m.status !== 'completed') return false;
      if (moduleStatusFilter === 'in_progress' && m.status !== 'in_progress') return false;
      if (moduleStatusFilter === 'skipped' && m.status !== 'skipped') return false;
      if (moduleStatusFilter === 'not_started' && (m.isCompleted || (m.status && m.status !== 'not_started'))) return false;

      // Search filter
      if (moduleSearchQuery.trim()) {
        const q = moduleSearchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchDesc = m.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [milestones, moduleStatusFilter, moduleSearchQuery]);

  if (isLoading || !goal) {
    return (
      <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        <span>Loading Goal Command Center...</span>
      </div>
    );
  }

  const isNumerical = goal.progressType === 'numerical';
  const progressPercent = Math.min(100, Math.max(0, goal.currentProgressPercentage || 0));
  const isCompleted = goal.status === 'completed' || progressPercent >= 100;

  const pacingStatus = pacing?.pacing_status || goal.pacingStatus || 'on_pace';
  const isAhead = pacingStatus === 'ahead';
  const isOnPace = pacingStatus === 'on_pace';
  const isBehind = pacingStatus === 'critical_deficit' || pacingStatus === 'behind_schedule';

  const handleStartFocusTimer = () => {
    if (nextIncompleteMilestone) {
      startTimer(45, goal._id, null, 'Module Study', `Module: ${nextIncompleteMilestone.title}`);
      navigate('/focus');
    } else {
      startTimer(45, goal._id, null, 'Goal Study', `Goal: ${goal.title}`);
      navigate('/focus');
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (activeCadence === 'yearly') {
      addYearlyTargetMutation.mutate({
        target: newTaskTitle.trim(),
        targetDate: newYearlyTargetDate || undefined
      });
    } else {
      addTaskMutation.mutate({
        title: newTaskTitle.trim(),
        taskType: activeCadence
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SHARED HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/goals"
            className="text-gray-400 hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Goals</span>
          </Link>
          <span className="text-gray-600">/</span>
          {goal.folder && (
            <>
              <Link
                to={goal.folderId ? `/goals/folder/${goal.folderId}` : '/goals'}
                className="text-gray-400 hover:text-white transition flex items-center gap-1"
              >
                <Folder className="w-3 h-3 text-purple-400" />
                <span>{goal.folder}</span>
              </Link>
              <span className="text-gray-600">/</span>
            </>
          )}
          <span className="text-purple-300 font-bold truncate max-w-xs">{goal.title}</span>
        </div>

        {/* Header Right Actions: Quick Focus Timer + Single 3-Dot Menu */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Start Focus Button */}
          <button
            type="button"
            onClick={handleStartFocusTimer}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
            title="Start 45m Focus Session"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Start Focus</span>
          </button>

          {/* Single 3-Dot Actions Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsHeaderMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white transition"
              title="Goal Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isHeaderMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-950 border border-gray-800 shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsHeaderMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsEditGoalModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit Goal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPrimaryGoalMutation.mutate()}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>{goal.isPrimaryGoal ? 'Unset Primary' : 'Set as Primary'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavoriteMutation.mutate()}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <Star className={`w-3.5 h-3.5 ${goal.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-gray-400'}`} />
                  <span>{goal.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMoveGoalModalOpen(true)}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <Folder className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Move to Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => duplicateGoalMutation.mutate()}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Duplicate Goal</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleArchiveMutation.mutate()}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <Archive className="w-3.5 h-3.5 text-gray-400" />
                  <span>{goal.isArchived ? 'Unarchive' : 'Archive Goal'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${goal.title}"?`)) {
                      deleteGoalMutation.mutate();
                    }
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-2 transition border-t border-gray-900 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete Goal</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. GOAL TITLE & PROGRESS HERO BANNER */}
      <GoalProgressHeader goal={goal} milestones={goalMilestones} />

      {/* Overdue Deadline Alert Banner (if applicable) */}
      {intelligence?.isOverdue && (
        <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">
                Target Deadline Passed ({intelligence?.overdueDays} days overdue)
              </span>
              <p className="text-[11px] text-gray-300">
                Your progress is safe. Extend deadline to recalculate a fresh, sustainable pace.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => extendDeadlineMutation.mutate(14)}
              disabled={extendDeadlineMutation.isPending}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              {extendDeadlineMutation.isPending ? 'Extending...' : 'Extend +14 Days'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAiBuilderMode('adjust_plan');
                setIsAIPlanBuilderOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition"
            >
              Adjust Plan
            </button>
          </div>
        </div>
      )}

      {/* 3. STRICT 4-TAB NAVIGATION BAR */}
      <div className="flex items-center gap-1 border-b border-gray-800 overflow-x-auto pb-1">
        {[
          {
            key: 'modules',
            label: isNumerical ? 'Progress Log' : `Milestones & Modules (${goalMilestones.length || milestones.length})`,
            icon: Layers
          },
          { key: 'overview', label: 'Overview', icon: Target },
          { key: 'planner', label: 'Planner & Schedule', icon: CalendarClock },
          { key: 'analytics', label: 'Analytics & ML', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Motivation & Intent Card */}
          {goal.targetOutcome && (
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-200 flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold mb-0.5">Primary Target Outcome:</strong>
                <span>{goal.targetOutcome}</span>
              </div>
            </div>
          )}

          {/* Next Action Hero Card */}
          {nextIncompleteMilestone && !isNumerical && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-gray-900 border border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Next Immediate Action</span>
                  </span>
                  <span className="font-mono text-xs font-bold text-purple-200">
                    Module #{String(nextIncompleteMilestone.sequenceNumber || nextIncompleteMilestone.order).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white">
                  {nextIncompleteMilestone.title}
                </h3>

                {nextIncompleteMilestone.estimatedEffort && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Estimated time: {nextIncompleteMilestone.estimatedEffort}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const fullM = milestones.find((m) => m._id === nextIncompleteMilestone._id);
                    setSelectedMilestoneForDrawer(fullM || (nextIncompleteMilestone as any));
                    setIsDrawerOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{nextIncompleteMilestone.status === 'in_progress' ? 'Resume Module' : 'Start Module'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartFocusTimer}
                  className="px-3.5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-semibold text-xs border border-gray-700 transition flex items-center gap-1.5"
                >
                  <Timer className="w-4 h-4 text-indigo-400" />
                  <span>Start Focus</span>
                </button>
              </div>
            </div>
          )}

          {/* Numerical Quick Log Action Card */}
          {isNumerical && (
            <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>Quick Progress Update</span>
              </h3>
              <form onSubmit={handleLogNumerical} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[1, 5, 10].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => setNumericalAddQty((prev) => prev + inc)}
                      className="px-3 py-1.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-purple-500/40 text-xs font-semibold text-gray-300 hover:text-white transition"
                    >
                      +{inc}
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    value={numericalAddQty}
                    onChange={(e) => setNumericalAddQty(Math.max(1, Number(e.target.value)))}
                    className="w-20 px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white text-center font-bold focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-400 font-medium">{goal.measurementUnit || 'units'}</span>
                </div>

                <input
                  type="text"
                  value={numericalNotes}
                  onChange={(e) => setNumericalNotes(e.target.value)}
                  placeholder="Optional notes: problems solved, chapter finished..."
                  className="flex-1 w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />

                <button
                  type="submit"
                  disabled={isLoggingNumerical}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {isLoggingNumerical ? 'Saving...' : 'Log Progress'}
                </button>
              </form>
            </div>
          )}

          {/* Progress Summary Breakdown */}
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Progress Breakdown</span>
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('modules')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                View Details →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Completed
                </span>
                <span className="text-lg font-extrabold text-emerald-400 mt-0.5 block">
                  {completedMilestonesCount}
                </span>
                <span className="text-[10px] text-gray-500">Modules finished</span>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  In Progress
                </span>
                <span className="text-lg font-extrabold text-purple-400 mt-0.5 block">
                  {milestones.filter((m) => m.status === 'in_progress').length}
                </span>
                <span className="text-[10px] text-gray-500">Currently studying</span>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Not Started
                </span>
                <span className="text-lg font-extrabold text-gray-300 mt-0.5 block">
                  {milestones.filter((m) => !m.isCompleted && (!m.status || m.status === 'not_started')).length}
                </span>
                <span className="text-[10px] text-gray-500">Upcoming syllabus</span>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Skipped
                </span>
                <span className="text-lg font-extrabold text-amber-400 mt-0.5 block">
                  {milestones.filter((m) => m.status === 'skipped').length}
                </span>
                <span className="text-[10px] text-gray-500">Excluded without penalty</span>
              </div>
            </div>
          </div>

          {/* Recent Progress Events & Timeline */}
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Recent Activity & Progress Events</span>
            </h3>

            {progressEvents.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No progress events recorded yet. Complete your first module or log progress above.</p>
            ) : (
              <div className="space-y-2">
                {progressEvents.slice(0, 5).map((evt: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-gray-950/60 border border-gray-800 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-gray-300">{evt.notes || `Progress recorded: +${evt.quantityAdded || 1}`}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(evt.timestamp || evt.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MODULES (OR PROGRESS LOG FOR NUMERICAL)
      ========================================================================= */}
      {activeTab === 'modules' && (
        <div className="space-y-4">
          {isNumerical ? (
            /* NUMERICAL PROGRESS LOG VIEW */
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Numerical Milestone Tracker</h3>
                    <p className="text-xs text-gray-400">
                      Target: {goal.targetQuantity} {goal.measurementUnit || 'units'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-purple-400">
                      {goal.achievedQuantity || 0} / {goal.targetQuantity}
                    </span>
                    <span className="text-xs text-gray-500 block font-semibold">{progressPercent}% complete</span>
                  </div>
                </div>

                {/* Big Progress Bar */}
                <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Progress Log History Table */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">History Log</h4>
                  {progressEvents.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 italic bg-gray-950/40 rounded-xl border border-dashed border-gray-800">
                      No progress entries logged yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-800/60 bg-gray-950/60 rounded-xl border border-gray-800 overflow-hidden">
                      {progressEvents.map((evt: any, i: number) => (
                        <div key={i} className="p-3 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-purple-300">+{evt.quantityAdded || 1} {goal.measurementUnit || 'units'}</span>
                            {evt.notes && <p className="text-gray-400 text-[11px] mt-0.5">{evt.notes}</p>}
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(evt.timestamp || evt.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 3-LEVEL MILESTONE-BASED MODULE CHECKLIST VIEW */
            <div className="space-y-4">
              {/* Actions Toolbar */}
              <div className="flex items-center justify-between gap-3 py-1">
                <span className="text-xs text-slate-400 font-medium">
                  {goalMilestones.length} milestone{goalMilestones.length !== 1 ? 's' : ''} ·{' '}
                  {goalMilestones.reduce((s, m) => s + (m.moduleCount || 0), 0)} total modules ·{' '}
                  {goalMilestones.reduce((s, m) => s + (m.completedModuleCount || 0), 0)} completed
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateMilestoneModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiBuilderMode('populate_slots');
                      setIsAIPlanBuilderOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>AI Syllabus</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {goalMilestonesLoading && (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              )}

              {/* Empty State */}
              {!goalMilestonesLoading && goalMilestones.length === 0 && (
                <div className="text-center py-16 border border-dashed border-[#243047] rounded-xl p-8 bg-[#151B2E]">
                  <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-200 mb-1">No Milestones Created Yet</h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Organize your goal into milestones, each containing independently trackable modules.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreateMilestoneModalOpen(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create First Milestone</span>
                  </button>
                </div>
              )}

              {/* Stack of Collapsible Milestone Checklist Containers */}
              {!goalMilestonesLoading && goalMilestones.length > 0 && (
                <div className="space-y-3.5">
                  {goalMilestones.map((ms, index) => (
                    <MilestoneChecklist
                      key={ms._id}
                      milestone={ms}
                      goalId={id!}
                      defaultExpanded={index === 0}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: PLANNER & SCHEDULE
      ========================================================================= */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          {/* Work Schedule Configuration Card */}
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-400" />
                <span>Working Days & Schedule Configuration</span>
              </h3>
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
              >
                {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>

            {/* Working Days Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Active Study / Work Days:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const isChecked = selectedWorkingDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedWorkingDays((prev) =>
                          isChecked ? prev.filter((d) => d !== day) : [...prev, day]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        isChecked
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                          : 'bg-gray-950 text-gray-500 border-gray-800 hover:text-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Unchecked days are treated as rest days and excluded from required study pacing calculations.
              </p>
            </div>

            {/* Target Deadline Input */}
            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Target Completion Date:
              </label>
              <input
                type="date"
                value={scheduleTargetDate}
                onChange={(e) => setScheduleTargetDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Schedule Feasibility & Workload Summary Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-gray-900 border border-purple-800/40 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Workload Feasibility & Buffer Analysis</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setAiBuilderMode('adjust_plan');
                  setIsAIPlanBuilderOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-300 font-semibold text-xs transition flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust with AI</span>
              </button>
            </div>

            {/* 4 Deterministic Workload Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Suggested Pace</span>
                <span className="text-xs font-extrabold text-purple-300 block truncate">
                  {intelligence?.suggestedDailyWorkload || '1 module every 2 study days'}
                </span>
                <span className="text-[10px] text-gray-500">Based on active working days</span>
              </div>

              <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Eligible Study Days</span>
                <span className="text-xs font-extrabold text-cyan-300 block">
                  {intelligence?.remainingEligibleDays || 0} days left
                </span>
                <span className="text-[10px] text-gray-500">of {intelligence?.totalEligibleDays || 0} total</span>
              </div>

              <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Buffer Margin</span>
                <span className="text-xs font-extrabold text-emerald-300 block">
                  {intelligence?.bufferDays ?? 0} flexible days
                </span>
                <span className="text-[10px] text-gray-500">Safety margin</span>
              </div>

              <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl space-y-0.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending Work</span>
                <span className="text-xs font-extrabold text-amber-300 block">
                  {intelligence?.incompleteModulesCount ?? 0} incomplete
                </span>
                <span className="text-[10px] text-gray-500">Excludes skipped topics</span>
              </div>
            </div>

            {/* Plain Language Explanations */}
            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs text-gray-400 space-y-1">
              <p>
                <strong className="text-gray-300">Buffer Calculation: </strong>
                {intelligence?.bufferExplanation || 'Buffer Days = Remaining Eligible Study Days - Pending Modules. Positive buffer means you can absorb rest or delay without missing your deadline.'}
              </p>
              <p>
                <strong className="text-gray-300">Rest Day Policy: </strong>
                {intelligence?.restDaysPolicy || 'Pacing is computed against your selected active working days to prevent burnout.'}
              </p>
            </div>
          </div>

          {/* Cadence Tasks & Commitments */}
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>Execution Commitments</span>
              </h3>
              <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveCadence('daily')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeCadence === 'daily' ? 'bg-indigo-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Daily ({dailyTasks.filter((t) => t.status === 'completed').length}/{dailyTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCadence('weekly')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeCadence === 'weekly' ? 'bg-cyan-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Weekly ({weeklyTasks.filter((t) => t.status === 'completed').length}/{weeklyTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCadence('monthly')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeCadence === 'monthly' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Monthly ({monthlyTasks.filter((t) => t.status === 'completed').length}/{monthlyTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCadence('yearly')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeCadence === 'yearly' ? 'bg-amber-600 text-white' : 'text-gray-400'
                  }`}
                >
                  Yearly ({yearlyTargets.filter((y) => y.isAchieved).length}/{yearlyTargets.length})
                </button>
              </div>
            </div>

            {/* Quick Add Commitment Form */}
            <form onSubmit={handleAddNewItem} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={`Add ${activeCadence} actionable commitment for this goal...`}
                className="flex-1 px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {/* Commitments List */}
            <div className="space-y-1.5">
              {(activeCadence === 'daily'
                ? dailyTasks
                : activeCadence === 'weekly'
                ? weeklyTasks
                : activeCadence === 'monthly'
                ? monthlyTasks
                : yearlyTasks
              ).length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500 italic bg-gray-950/40 rounded-xl border border-dashed border-gray-800">
                  No {activeCadence} commitments added yet. Add regular habits above to build momentum.
                </div>
              ) : (
                (activeCadence === 'daily'
                  ? dailyTasks
                  : activeCadence === 'weekly'
                  ? weeklyTasks
                  : activeCadence === 'monthly'
                  ? monthlyTasks
                  : yearlyTasks
                ).map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-2.5 bg-gray-950/60 border border-gray-800 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleTaskMutation.mutate(t._id)}
                        className={`p-1 rounded ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-800 text-gray-500'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <span className={t.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-200'}>
                        {t.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTaskMutation.mutate(t._id)}
                      className="text-gray-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ANALYTICS & ML
      ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Scientific Pacing Formula Breakdown */}
          <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Scientific Pacing Gap Analysis</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Formula: <code className="text-purple-300 font-mono">Pacing Gap = Actual Progress % - Expected Elapsed Time %</code>
                </p>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-xl border self-start sm:self-auto ${
                  (pacing?.progress_gap_pct || 0) >= 0
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {(pacing?.progress_gap_pct || 0) >= 0 ? '✓ On Pace or Ahead' : '⚠ Schedule Deficit Detected'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-0.5 font-medium">Actual Goal Progress</span>
                <span className="text-xl font-bold text-white">{goal.currentProgressPercentage}%</span>
                <p className="text-[10px] text-gray-500 mt-0.5">Calculated from completed work</p>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-0.5 font-medium">Elapsed Schedule Time</span>
                <span className="text-xl font-bold text-white">{pacing?.elapsed_time_pct || 0}%</span>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {pacing?.days_elapsed || 0} of {pacing?.total_duration_days || 90} total days
                </p>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-0.5 font-medium">Progress Pacing Gap</span>
                <span
                  className={`text-xl font-bold ${
                    (pacing?.progress_gap_pct || 0) >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {(pacing?.progress_gap_pct || 0) >= 0 ? '+' : ''}
                  {pacing?.progress_gap_pct || 0}%
                </span>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {(pacing?.progress_gap_pct || 0) >= 0 ? 'Ahead of required velocity' : 'Behind required velocity'}
                </p>
              </div>

              <div className="p-3 bg-gray-950/60 rounded-xl border border-gray-800">
                <span className="text-gray-400 block text-[11px] mb-0.5 font-medium">Velocity Needed</span>
                <span className="text-xl font-bold text-cyan-400">
                  +{pacing?.required_daily_progress_to_finish || 1.2}%/day
                </span>
                <p className="text-[10px] text-gray-500 mt-0.5">{pacing?.days_remaining || 0} days remaining</p>
              </div>
            </div>
          </div>

          {/* Machine Learning Diagnostics & Patterns */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-gray-900 border border-purple-800/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Machine Learning Progress Diagnostics & Pattern Discovery
                </h3>
              </div>

              {intelligence?.mlServiceOnline === false || pacing?.is_fallback ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deterministic Engine Active</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ML Microservice Connected</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>Velocity Trajectory</span>
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Average velocity: <strong className="text-white">{pacing?.average_daily_progress || 0.8}% / day</strong>.
                  Required to finish on time: <strong className="text-white">{pacing?.required_daily_progress_to_finish || 1.1}% / day</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl space-y-1">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Optimization Recommendation</span>
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {pacing?.pacing_interpretation || 'Maintain steady session cadence. Review past notes every 5 modules to solidify retention.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-[11px] text-gray-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Advisory Disclaimer:</strong> Recommendations are mathematical guidance based on your study history and velocity patterns.
              </span>
            </div>
          </div>

          {/* Progress Timeline View */}
          <GoalProgressTimeline
            goal={goal}
            milestones={milestones}
            achievements={achievements}
            progressEvents={progressEvents}
          />
        </div>
      )}

      {/* =========================================================================
          MODALS
      ========================================================================= */}
      {/* 1. Edit Goal Modal using Unified GoalForm */}
      <Modal
        isOpen={isEditGoalModalOpen}
        onClose={() => setIsEditGoalModalOpen(false)}
        title="Edit Goal"
        maxWidth="max-w-3xl"
      >
        <GoalForm
          initialGoal={goal}
          folders={folders}
          isEditing={true}
          onSubmit={async (formData) => {
            await api.patch(`/goals/${id}`, formData);
            queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            setIsEditGoalModalOpen(false);
          }}
          onCancel={() => setIsEditGoalModalOpen(false)}
        />
      </Modal>

      {/* 2. Move Goal to Folder Modal */}
      <MoveGoalModal
        isOpen={isMoveGoalModalOpen}
        onClose={() => setIsMoveGoalModalOpen(false)}
        goal={goal}
        folders={folders}
        onMove={async (goalId, folderId, folderName) => {
          await moveGoalMutation.mutateAsync({ folderId, folderName });
          setIsMoveGoalModalOpen(false);
        }}
      />

      {/* 3. Add Single Module Modal */}
      <Modal
        isOpen={isAddSingleMilestoneOpen}
        onClose={() => setIsAddSingleMilestoneOpen(false)}
        title="Add Single Module"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Module Title <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="e.g. Dynamic Programming (20 Problems)"
              className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Estimated Study Time
            </label>
            <input
              type="text"
              value={mEffort}
              onChange={(e) => setMEffort(e.target.value)}
              placeholder="e.g. 45 mins, 2 hours"
              className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Learning Objective / Description (Optional)
            </label>
            <textarea
              value={mDescription}
              onChange={(e) => setMDescription(e.target.value)}
              placeholder="What will you learn in this module?"
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={() => setIsAddSingleMilestoneOpen(false)}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => addSingleMilestoneMutation.mutate()}
              disabled={!mTitle.trim() || addSingleMilestoneMutation.isPending}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              {addSingleMilestoneMutation.isPending ? 'Adding...' : 'Add Module'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 4. Generate Empty Slots Modal */}
      <GenerateMilestonesModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        goalId={goal._id}
        goalTitle={goal.title}
        category={goal.category}
        onGenerated={() => {
          queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
      />

      {/* 5. Bulk Import Syllabus Modal */}
      <BulkImportModulesModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        goalId={goal._id}
        onImportComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
      />

      {/* 6. AI Plan Builder Modal (Populate Slots or Adjust Plan) */}
      <AIPlanBuilder
        isOpen={isAIPlanBuilderOpen}
        onClose={() => setIsAIPlanBuilderOpen(false)}
        mode={aiBuilderMode}
        goalId={goal._id}
        initialTitle={goal.title}
        category={goal.category}
        existingSlotCount={milestones.length || 10}
        onPlanApproved={() => {
          setIsAIPlanBuilderOpen(false);
          queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
      />

      {/* Create Milestone Modal */}
      <CreateMilestoneModal
        goalId={id!}
        goalTitle={goal?.title}
        isOpen={isCreateMilestoneModalOpen}
        onClose={() => setIsCreateMilestoneModalOpen(false)}
        onCreated={() => {
          setIsCreateMilestoneModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['goal-milestones', id] });
          queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
        }}
      />

      {/* 7. Goal Completion Experience Modal (100% Mastery) */}
      <GoalCompletionModal
        goal={goal}
        milestones={milestones}
        tasks={tasks}
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
      />

      {/* 8. Real-time Achievement Celebration Modal */}
      <AchievementCelebrationModal
        achievement={celebratedAchievement}
        onClose={() => setCelebratedAchievement(null)}
      />

      {/* 9. Level 3 Interactive Milestone Detail Drawer */}
      <MilestoneDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedMilestoneForDrawer(null);
        }}
        milestone={selectedMilestoneForDrawer}
        goalId={id || ''}
        onMilestoneUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['goal-detail', id] });
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
      />
    </div>
  );
};
