import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Goal, GoalFolder, GoalMilestone } from '../types';
import { useGoalWorkspaceStore, WorkspaceViewMode, WorkspaceMode } from '../store/goalWorkspaceStore';
import { FolderExplorer } from '../components/Goals/FolderExplorer';
import { GoalCard } from '../components/Goals/GoalCard';
import { GoalForm } from '../components/Goals/GoalForm';
import { AIPlanBuilder } from '../components/Goals/AIPlanBuilder';
import { ContinueHeroCard } from '../components/Goals/ContinueHeroCard';
import { CreateFolderModal } from '../components/Goals/CreateFolderModal';
import { MoveGoalModal } from '../components/Goals/MoveGoalModal';
import { CommandMenuModal } from '../components/Goals/CommandMenuModal';
import { GoalTemplateGalleryModal } from '../components/Goals/GoalTemplateGalleryModal';
import { MilestoneDetailDrawer } from '../components/Goals/MilestoneDetailDrawer';
import { MilestoneChecklist } from '../components/Goals/MilestoneChecklist';
import { CreateMilestoneModal } from '../components/Goals/CreateMilestoneModal';
import { GoalProgressHeader } from '../components/Goals/GoalProgressHeader';
import { GoalBoardView } from '../components/Goals/GoalBoardView';
import { GoalCalendarView } from '../components/Calendar/GoalCalendarView';
import { DayDetailModal } from '../components/Calendar/DayDetailModal';
import { DayMetric } from './CalendarPage';
import { Modal } from '../components/UI/Modal';
import {
  Target,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Kanban,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
  FolderPlus,
  Folder,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MoreVertical,
  ChevronDown,
  X,
  CheckSquare
} from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const { folderId: routeFolderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date();

  // Zustand Global Workspace State
  const {
    workspaceMode,
    setWorkspaceMode,
    activeGoalId,
    setActiveGoalId,
    viewMode,
    setViewMode,
    selectedView,
    selectedFolderName,
    setSelectedView,
    searchQuery,
    setSearchQuery,
    isCommandMenuOpen,
    setCommandMenuOpen,
    isTemplateGalleryOpen,
    setTemplateGalleryOpen,
    pinnedGoalId,
    setPinnedGoalId,
    activeModuleDrawer,
    openModuleDrawer,
    closeModuleDrawer
  } = useGoalWorkspaceStore();

  // Local Filter & Sort State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'targetDate' | 'progress' | 'title'>('createdAt');

  // Modals Local State
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isCreateMilestoneOpen, setIsCreateMilestoneOpen] = useState(false);

  const [isAIPlanBuilderOpen, setIsAIPlanBuilderOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [moveGoalTarget, setMoveGoalTarget] = useState<Goal | null>(null);

  // Quick Action Dropdown State
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);

  // Numerical Progress Modal State
  const [progressModalGoal, setProgressModalGoal] = useState<Goal | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [progressNotes, setProgressNotes] = useState('');
  const [isLoggingProgress, setIsLoggingProgress] = useState(false);

  // Calendar View State
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [selectedCalendarGoalId, setSelectedCalendarGoalId] = useState<string>('all');

  // Collapsible Metrics State (saved in localStorage)
  const [showMetrics, setShowMetrics] = useState<boolean>(() => {
    return localStorage.getItem('consistai_show_workspace_metrics') !== 'false';
  });

  const toggleShowMetrics = () => {
    setShowMetrics((prev) => {
      const next = !prev;
      localStorage.setItem('consistai_show_workspace_metrics', String(next));
      return next;
    });
  };

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandMenuOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandMenuOpen]);

  // 1. Fetch Goals
  const { data: goalsData, isLoading: isLoadingGoals, isError, refetch } = useQuery<{
    success: boolean;
    goals: Goal[];
    compactMetrics?: {
      activeGoalsCount: number;
      completedGoalsCount: number;
      completedModulesCount: number;
      onTrackGoalsCount: number;
    };
    continueGoal?: any;
  }>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await api.get('/goals?isArchived=');
      return res.data;
    }
  });

  const goals = useMemo(() => goalsData?.goals || [], [goalsData?.goals]);

  // 2. Fetch Folders
  const { data: folderData } = useQuery<{
    folders: GoalFolder[];
    folderTree: GoalFolder[];
  }>({
    queryKey: ['goal-folders'],
    queryFn: async () => {
      const res = await api.get('/goal-folders');
      return res.data;
    }
  });

  const folders = useMemo(() => folderData?.folders || [], [folderData?.folders]);

  // Handle URL Deep-Linking for /goals/folder/:folderId
  useEffect(() => {
    if (routeFolderId && folders.length > 0) {
      const targetFolder = folders.find((f) => f._id === routeFolderId);
      if (targetFolder) {
        setSelectedView(routeFolderId, targetFolder.name);
      }
    }
  }, [routeFolderId, folders, setSelectedView]);

  // Calendar query for goals
  const { data: calendarData } = useQuery<{
    success: boolean;
    daysData: Record<string, DayMetric>;
  }>({
    queryKey: ['calendar-month', calendarYear, calendarMonth, selectedCalendarGoalId],
    queryFn: async () => {
      const goalParam = selectedCalendarGoalId && selectedCalendarGoalId !== 'all' ? `&goalId=${selectedCalendarGoalId}` : '';
      const res = await api.get(`/calendar/month?year=${calendarYear}&month=${calendarMonth}${goalParam}`);
      return res.data;
    },
    enabled: viewMode === 'calendar'
  });

  // Calculate Folder Counts
  const counts = useMemo(() => {
    const total = goals.filter((g) => !g.isArchived).length;
    const favorites = goals.filter((g) => g.isFavorite && !g.isArchived).length;
    const active = goals.filter((g) => g.status === 'active' && !g.isArchived).length;
    const completed = goals.filter((g) => g.status === 'completed' && !g.isArchived).length;
    const archived = goals.filter((g) => g.isArchived).length;
    return { total, favorites, active, completed, archived };
  }, [goals]);

  // Compact Metrics
  const compactMetrics = useMemo(() => {
    return goalsData?.compactMetrics || {
      activeGoalsCount: counts.active,
      completedGoalsCount: counts.completed,
      completedModulesCount: goals.reduce((sum, g) => sum + (g.milestoneStats?.completed || 0), 0),
      onTrackGoalsCount: goals.filter((g) => g.pacing?.pacing_status === 'ahead' || g.pacing?.pacing_status === 'on_pace').length
    };
  }, [goalsData?.compactMetrics, counts, goals]);

  // Determine Continue Goal: Pinned Active > Most Recently Worked On > Highest Priority Active
  const continueGoal = useMemo(() => {
    if (pinnedGoalId) {
      const pinned = goals.find((g) => g._id === pinnedGoalId && !g.isArchived);
      if (pinned) {
        const nextMod = (pinned.milestones || []).find((m) => !m.isCompleted && m.status !== 'completed' && m.status !== 'skipped');
        const targetD = new Date(pinned.targetDate);
        const remainingDays = Math.max(0, Math.ceil((targetD.getTime() - today.getTime()) / 86400000));
        return {
          _id: pinned._id,
          goalId: pinned._id,
          title: pinned.title,
          category: pinned.category,
          folder: pinned.folder,
          currentProgressPercentage: pinned.currentProgressPercentage,
          completedModules: pinned.milestoneStats?.completed || 0,
          totalModules: pinned.milestoneStats?.total || 0,
          remainingDays,
          isPinned: true,
          nextModule: nextMod
            ? {
                _id: nextMod._id,
                title: nextMod.title,
                sequenceNumber: nextMod.sequenceNumber || nextMod.order,
                estimatedEffort: nextMod.estimatedEffort || '45 mins'
              }
            : null
        };
      }
    }
    return goalsData?.continueGoal || null;
  }, [goalsData?.continueGoal, goals, pinnedGoalId, today]);

  // Determine Active Goal for Checklist Execution View
  const activeGoal = useMemo(() => {
    if (activeGoalId) {
      const found = goals.find((g) => g._id === activeGoalId && !g.isArchived);
      if (found) return found;
    }
    if (pinnedGoalId) {
      const pinned = goals.find((g) => g._id === pinnedGoalId && !g.isArchived);
      if (pinned) return pinned;
    }
    const primary = goals.find((g) => g.isPrimaryGoal && !g.isArchived);
    if (primary) return primary;

    const firstActive = goals.find((g) => g.status === 'active' && !g.isArchived);
    if (firstActive) return firstActive;

    return goals.find((g) => !g.isArchived) || goals[0] || null;
  }, [goals, activeGoalId, pinnedGoalId]);

  // Keep activeGoalId in sync
  useEffect(() => {
    if (activeGoal && activeGoalId !== activeGoal._id) {
      setActiveGoalId(activeGoal._id);
    }
  }, [activeGoal, activeGoalId, setActiveGoalId]);

  // Fetch 3-Level GoalMilestones for Active Goal
  const {
    data: activeGoalMilestonesData,
    isLoading: isLoadingMilestones,
    refetch: refetchActiveMilestones
  } = useQuery<{ milestones: GoalMilestone[] }>({
    queryKey: ['goal-milestones', activeGoal?._id],
    queryFn: async () => {
      if (!activeGoal?._id) return { milestones: [] };
      const res = await api.get(`/goals/${activeGoal._id}/goal-milestones`);
      return res.data;
    },
    enabled: !!activeGoal?._id && workspaceMode === 'checklist',
    staleTime: 15000
  });

  const activeGoalMilestones = useMemo(
    () => activeGoalMilestonesData?.milestones || [],
    [activeGoalMilestonesData?.milestones]
  );

  // Mutations
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await api.patch(`/goals/${goalId}/favorite`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const setPrimaryGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await api.put(`/goals/${goalId}/primary`);
      return res.data;
    },
    onSuccess: (_, goalId) => {
      setPinnedGoalId(goalId);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const toggleArchiveMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await api.patch(`/goals/${goalId}/archive`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const duplicateGoalMutation = useMutation({
    mutationFn: async (goalId: string) => {
      const res = await api.post(`/goals/${goalId}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
    }
  });

  const moveGoalMutation = useMutation({
    mutationFn: async ({ goalId, folderId, folderName }: { goalId: string; folderId: string; folderName: string }) => {
      const res = await api.patch(`/goals/${goalId}/move`, { folderId, folder: folderName });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/goal-folders', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
      setIsCreateFolderOpen(false);
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      await api.delete(`/goal-folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setSelectedView('all', 'All Goals');
    }
  });

  const updateGoalStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.patch(`/goals/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  // Handle Form Submission (Create or Update)
  const handleSaveGoal = async (formData: any) => {
    if (editingGoal) {
      await api.patch(`/goals/${editingGoal._id}`, formData);
    } else {
      const res = await api.post('/goals', formData);
      if (res.data?.goal?._id) {
        setActiveGoalId(res.data.goal._id);
        setWorkspaceMode('checklist');
      }
    }
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
    setIsGoalFormOpen(false);
    setEditingGoal(null);
  };

  // Handle Numerical Progress Recording
  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressModalGoal) return;
    try {
      setIsLoggingProgress(true);
      await api.post(`/goals/${progressModalGoal._id}/progress`, {
        quantityAdded: Number(quantityToAdd),
        notes: progressNotes.trim()
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setProgressModalGoal(null);
      setQuantityToAdd(1);
      setProgressNotes('');
    } catch (err) {
      console.error('Failed to log progress', err);
    } finally {
      setIsLoggingProgress(false);
    }
  };

  // Filtered & Sorted Goals List
  const filteredGoals = useMemo(() => {
    return goals
      .filter((goal) => {
        // Quick Views / Folder Filter
        if (selectedView === 'all') {
          if (goal.isArchived) return false;
        } else if (selectedView === 'favorites') {
          if (!goal.isFavorite || goal.isArchived) return false;
        } else if (selectedView === 'active') {
          if (goal.status !== 'active' || goal.isArchived) return false;
        } else if (selectedView === 'completed') {
          if (goal.status !== 'completed' || goal.isArchived) return false;
        } else if (selectedView === 'archived') {
          if (!goal.isArchived) return false;
        } else if (selectedView === 'ontrack') {
          if (goal.isArchived) return false;
          if (goal.pacing?.pacing_status !== 'ahead' && goal.pacing?.pacing_status !== 'on_pace') return false;
        } else {
          // Specific Folder ID selected
          const gFolderId =
            typeof goal.folderId === 'object' && goal.folderId !== null
              ? (goal.folderId as any)._id
              : goal.folderId;
          const folderDoc = folders.find((f) => f._id === selectedView);
          const matchesId = gFolderId === selectedView;
          const matchesName = folderDoc && goal.folder === folderDoc.name;
          if (!matchesId && !matchesName) return false;
        }

        // Category Filter
        if (selectedCategory !== 'all' && goal.category !== selectedCategory) {
          return false;
        }

        // Status Filter
        if (selectedStatus !== 'all' && goal.status !== selectedStatus) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = goal.title.toLowerCase().includes(q);
          const matchDesc = goal.description?.toLowerCase().includes(q);
          const matchCategory = goal.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'progress') {
          return (b.currentProgressPercentage || 0) - (a.currentProgressPercentage || 0);
        } else if (sortBy === 'targetDate') {
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        } else if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [goals, selectedView, selectedCategory, selectedStatus, searchQuery, sortBy, folders]);

  // Drawer Milestone resolution
  const drawerGoal = useMemo(() => {
    if (!activeModuleDrawer.goalId) return null;
    return goals.find((g) => g._id === activeModuleDrawer.goalId) || null;
  }, [goals, activeModuleDrawer.goalId]);

  const drawerMilestone = useMemo(() => {
    if (!drawerGoal || !activeModuleDrawer.milestoneId) return null;
    return (drawerGoal.milestones || []).find((m) => m._id === activeModuleDrawer.milestoneId) || null;
  }, [drawerGoal, activeModuleDrawer.milestoneId]);

  return (
    <div className="space-y-6">
      {/* SECTION A: HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold tracking-wide uppercase mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>{selectedFolderName}</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-6 h-6 text-[#8B5CF6]" />
            <span>My Goals</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Build your future, one milestone at a time.
          </p>
        </div>

        {/* Action Buttons: Search, Add Milestone (in checklist view), New Goal, and More Menu */}
        <div className="flex items-center gap-2">
          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setCommandMenuOpen(true)}
            className="px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm cursor-pointer"
            title="Global Search & Quick Actions (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-800 text-gray-400 rounded border border-gray-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Add Milestone Button (Visible in Checklist View) */}
          {workspaceMode === 'checklist' && activeGoal && (
            <button
              type="button"
              onClick={() => setIsCreateMilestoneOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Add Milestone</span>
            </button>
          )}

          {/* Single Prominent New Goal Button */}
          <button
            type="button"
            onClick={() => {
              setEditingGoal(null);
              setIsGoalFormOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Goal</span>
          </button>

          {/* More Actions Dropdown (New Folder, Templates, AI Plan) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMoreDropdownOpen((prev) => !prev)}
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-xs font-semibold transition flex items-center gap-1"
              title="More actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-950 border border-gray-800 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsMoreDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setCreateFolderParentId(null);
                    setIsCreateFolderOpen(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>New Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateGalleryOpen(true)}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-900 hover:text-white flex items-center gap-2 transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Browse Templates</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAIPlanBuilderOpen(true)}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-950/40 hover:text-purple-200 flex items-center gap-2 transition border-t border-gray-900 mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>AI Plan Architect</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION B: GOAL SWITCHER TABS & WORKSPACE MODE SELECTOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0B1120] border border-slate-800/80 rounded-2xl p-2.5 shadow-sm">
        {/* Left: Active Goal Pills Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pl-1 shrink-0">
            Goals:
          </span>
          {goals
            .filter((g) => !g.isArchived)
            .map((g) => {
              const isSelected = activeGoal?._id === g._id && workspaceMode === 'checklist';
              const pct = Math.min(100, Math.max(0, g.currentProgressPercentage || 0));
              return (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => {
                    setActiveGoalId(g._id);
                    setWorkspaceMode('checklist');
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800/80'
                  }`}
                >
                  {g.isPrimaryGoal && <span className="text-amber-300">★</span>}
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{g.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                      isSelected
                        ? 'bg-purple-700/80 text-purple-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {pct}%
                  </span>
                </button>
              );
            })}

          <button
            type="button"
            onClick={() => {
              setEditingGoal(null);
              setIsGoalFormOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-purple-300 border border-dashed border-slate-700/80 text-xs font-medium shrink-0 transition cursor-pointer"
            title="Create new goal"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Right: Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800/90 p-1 rounded-xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setWorkspaceMode('checklist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              workspaceMode === 'checklist'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Milestone Checklist View (Execution)"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Checklist View</span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceMode('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              workspaceMode === 'overview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="All Goals & Folders (Macro View)"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Goals & Folders</span>
          </button>
        </div>
      </div>

      {workspaceMode === 'checklist' ? (
        /* =========================================================================
           CHECKLIST VIEW: DIRECT MILESTONE MODULE CHECKLIST (EXECUTION WORKSPACE)
        ========================================================================= */
        <div className="space-y-6">
          {/* Active Goal Header Banner */}
          {activeGoal ? (
            <GoalProgressHeader
              goal={activeGoal}
              milestones={activeGoalMilestones}
            />
          ) : (
            <div className="p-12 text-center bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl space-y-4 max-w-lg mx-auto">
              <Target className="w-12 h-12 text-purple-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Active Goals Found</h3>
              <p className="text-xs text-gray-400">
                Create your first goal to begin tracking milestones and checkable modules.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingGoal(null);
                  setIsGoalFormOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5 mx-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Goal</span>
              </button>
            </div>
          )}

          {/* Milestones Loading State */}
          {isLoadingMilestones && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          )}

          {/* Stack of Milestone Checklist Containers */}
          {!isLoadingMilestones && activeGoal && activeGoalMilestones.length > 0 && (
            <div className="space-y-6">
              {activeGoalMilestones.map((ms, index) => (
                <MilestoneChecklist
                  key={ms._id}
                  milestone={ms}
                  goalId={activeGoal._id}
                  defaultExpanded={index === 0}
                />
              ))}
            </div>
          )}

          {/* Empty State: Goal exists but has no milestones */}
          {!isLoadingMilestones && activeGoal && activeGoalMilestones.length === 0 && (
            <div className="text-center py-16 border border-dashed border-[#1E293B] rounded-2xl p-8 bg-[#0F172A] space-y-4 max-w-md mx-auto shadow-xl">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">No Milestones Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Break down "{activeGoal.title}" into milestones with compact checkable module slots.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateMilestoneOpen(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Milestone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAIPlanBuilderOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Generate Syllabus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           OVERVIEW: ALL GOALS & FOLDERS MACRO VIEW
        ========================================================================= */
        <div className="space-y-6">
          {/* SECTION B: COMPACT SUMMARY METRICS (Click-to-Filter) */}
          <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Workspace Summary
          </span>
          <button
            type="button"
            onClick={toggleShowMetrics}
            className="text-[11px] text-gray-400 hover:text-gray-200 transition flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-lg hover:bg-gray-900"
          >
            {showMetrics ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Hide Metrics</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Show Metrics</span>
              </>
            )}
          </button>
        </div>

        {showMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Active Goals */}
            <div
              onClick={() => setSelectedView('active', 'Active Goals')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedView === 'active'
                  ? 'bg-purple-950/30 border-purple-500/50 shadow-sm shadow-purple-900/20'
                  : 'bg-gray-900/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Active Goals
                </span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">
                  {compactMetrics.activeGoalsCount}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-600/15 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>

            {/* Completed Goals */}
            <div
              onClick={() => setSelectedView('completed', 'Completed Goals')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedView === 'completed'
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-900/20'
                  : 'bg-gray-900/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Completed Goals
                </span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">
                  {compactMetrics.completedGoalsCount}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Completed Modules */}
            <div
              onClick={() => setSelectedView('all', 'All Goals')}
              className="p-3.5 rounded-2xl bg-gray-900/70 border border-gray-800/80 hover:border-gray-700 hover:bg-gray-900 transition flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Completed Modules
                </span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">
                  {compactMetrics.completedModulesCount}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            {/* Goals On Track */}
            <div
              onClick={() => setSelectedView('ontrack', 'Goals On Track')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedView === 'ontrack'
                  ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-900/20'
                  : 'bg-gray-900/70 border-gray-800/80 hover:border-gray-700 hover:bg-gray-900'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Goals On Track
                </span>
                <span className="text-xl font-extrabold text-white mt-0.5 block">
                  {compactMetrics.onTrackGoalsCount}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error & Retry Banner */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Unable to load your goals workspace. Please check your backend connection.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* SECTION C: CONTINUE WORKING HERO CARD */}
      {!isLoadingGoals && continueGoal && (
        <ContinueHeroCard
          goal={continueGoal}
          onOpenModuleDrawer={(gId, mId) => openModuleDrawer(gId, mId)}
          onTogglePin={(gId) => {
            if (pinnedGoalId === gId) {
              setPinnedGoalId(null);
            } else {
              setPinnedGoalId(gId);
            }
          }}
        />
      )}

      {/* SECTION D: TWO-PANEL WORKSPACE */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Panel: Folder Explorer */}
        <FolderExplorer
          folders={folders}
          selectedView={selectedView}
          onSelectView={(viewKey, name) => {
            setSelectedView(viewKey, name || 'Filtered View');
            if (viewKey.length === 24) {
              navigate(`/goals/folder/${viewKey}`, { replace: true });
            } else {
              navigate('/goals', { replace: true });
            }
          }}
          onOpenCreateFolder={(parentId) => {
            setCreateFolderParentId(parentId || null);
            setIsCreateFolderOpen(true);
          }}
          onDeleteFolder={(folder) => deleteFolderMutation.mutate(folder._id)}
          totalGoalsCount={counts.total}
          favoritesCount={counts.favorites}
          activeCount={counts.active}
          completedCount={counts.completed}
          archivedCount={counts.archived}
        />

        {/* Right Panel: Goals Collection & Workspace View */}
        <div className="flex-1 w-full space-y-4 min-w-0">
          {/* Toolbar: Search, Filters & View Mode Switcher */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search goals by title, description or category..."
                className="w-full pl-9 pr-3 py-1.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Categories</option>
              <option value="Programming">Programming</option>
              <option value="Academics">Academics</option>
              <option value="Fitness">Fitness</option>
              <option value="Career">Career</option>
              <option value="Language">Language</option>
              <option value="Personal">Personal</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-gray-300 focus:outline-none focus:border-purple-500"
            >
              <option value="createdAt">Newest First</option>
              <option value="targetDate">Target Date</option>
              <option value="progress">Highest Progress</option>
              <option value="title">Alphabetical</option>
            </select>

            {/* View Switcher: Grid, List, Board, Calendar */}
            <div className="flex items-center gap-1 bg-gray-950 border border-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'board' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Board View"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  viewMode === 'calendar' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
                title="Calendar View"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoadingGoals && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-gray-900/40 border border-gray-800 animate-pulse p-5 space-y-3">
                  <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                  <div className="h-5 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoadingGoals && filteredGoals.length === 0 && (
            <div className="p-12 text-center bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/15 text-purple-400 border border-purple-500/20 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Goals in this View</h3>
                <p className="text-xs text-gray-400">
                  No goals match your current filter or folder. Create your first goal or select another view.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null);
                    setIsGoalFormOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Goal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateGalleryOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-300 font-semibold text-xs transition flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Use Template</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW SWITCHER CONTENT */}
          {!isLoadingGoals && filteredGoals.length > 0 && (
            <>
              {viewMode === 'calendar' ? (
                <div className="space-y-4">
                  <GoalCalendarView
                    year={calendarYear}
                    month={calendarMonth}
                    daysData={calendarData?.daysData || {}}
                    goals={goals || []}
                    selectedGoalId={selectedCalendarGoalId}
                    onSelectGoalId={setSelectedCalendarGoalId}
                    onPrevMonth={() => {
                      if (calendarMonth === 1) {
                        setCalendarMonth(12);
                        setCalendarYear((y) => y - 1);
                      } else {
                        setCalendarMonth((m) => m - 1);
                      }
                    }}
                    onNextMonth={() => {
                      if (calendarMonth === 12) {
                        setCalendarMonth(1);
                        setCalendarYear((y) => y + 1);
                      } else {
                        setCalendarMonth((m) => m + 1);
                      }
                    }}
                    onSelectDate={(d) => setSelectedCalendarDate(d)}
                  />

                  <DayDetailModal
                    isOpen={!!selectedCalendarDate}
                    onClose={() => setSelectedCalendarDate(null)}
                    selectedDate={selectedCalendarDate}
                    initialTab="goals"
                  />
                </div>
              ) : viewMode === 'board' ? (
                <GoalBoardView
                  goals={filteredGoals}
                  onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                  onUpdateStatus={(id, status) => updateGoalStatusMutation.mutate({ id, status })}
                />
              ) : viewMode === 'list' ? (
                <div className="space-y-3">
                  {filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal._id}
                      goal={goal}
                      isPinned={pinnedGoalId === goal._id}
                      onSelectGoal={(g) => {
                        setActiveGoalId(g._id);
                        setWorkspaceMode('checklist');
                      }}
                      onEdit={(g) => {
                        setEditingGoal(g);
                        setIsGoalFormOpen(true);
                      }}
                      onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                      onPinPrimary={(id) => setPrimaryGoalMutation.mutate(id)}
                      onMoveFolder={(g) => setMoveGoalTarget(g)}
                      onDuplicate={(id) => duplicateGoalMutation.mutate(id)}
                      onArchive={(id) => toggleArchiveMutation.mutate(id)}
                      onDelete={(id) => deleteGoalMutation.mutate(id)}
                      onLogProgress={(g) => {
                        setProgressModalGoal(g);
                        setQuantityToAdd(1);
                        setProgressNotes('');
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* Grid View (Default) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal._id}
                      goal={goal}
                      isPinned={pinnedGoalId === goal._id}
                      onSelectGoal={(g) => {
                        setActiveGoalId(g._id);
                        setWorkspaceMode('checklist');
                      }}
                      onEdit={(g) => {
                        setEditingGoal(g);
                        setIsGoalFormOpen(true);
                      }}
                      onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                      onPinPrimary={(id) => setPrimaryGoalMutation.mutate(id)}
                      onMoveFolder={(g) => setMoveGoalTarget(g)}
                      onDuplicate={(id) => duplicateGoalMutation.mutate(id)}
                      onArchive={(id) => toggleArchiveMutation.mutate(id)}
                      onDelete={(id) => deleteGoalMutation.mutate(id)}
                      onLogProgress={(g) => {
                        setProgressModalGoal(g);
                        setQuantityToAdd(1);
                        setProgressNotes('');
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )}

  {/* MODAL 0: Create Milestone for Active Goal */}
  {activeGoal && (
    <CreateMilestoneModal
      goalId={activeGoal._id}
      goalTitle={activeGoal.title}
      isOpen={isCreateMilestoneOpen}
      onClose={() => setIsCreateMilestoneOpen(false)}
      onCreated={() => {
        queryClient.invalidateQueries({ queryKey: ['goal-milestones', activeGoal._id] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        setIsCreateMilestoneOpen(false);
      }}
    />
  )}

      {/* MODAL 1: Create / Edit Goal Modal with Unified GoalForm */}
      <Modal
        isOpen={isGoalFormOpen}
        onClose={() => {
          setIsGoalFormOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
        maxWidth="max-w-3xl"
      >
        <GoalForm
          initialGoal={editingGoal || undefined}
          folders={folders}
          activeFolderId={selectedView.length === 24 ? selectedView : undefined}
          isEditing={!!editingGoal}
          onSubmit={handleSaveGoal}
          onCancel={() => {
            setIsGoalFormOpen(false);
            setEditingGoal(null);
          }}
          onOpenAIBuilder={() => {
            setIsGoalFormOpen(false);
            setIsAIPlanBuilderOpen(true);
          }}
        />
      </Modal>

      {/* MODAL 2: Unified AI Plan Architect */}
      <AIPlanBuilder
        isOpen={isAIPlanBuilderOpen}
        onClose={() => setIsAIPlanBuilderOpen(false)}
        mode="create_goal"
        onPlanApproved={(_result) => {
          setIsAIPlanBuilderOpen(false);
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
        }}
      />

      {/* MODAL 3: Create Folder Modal */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onSubmit={async (data) => {
          await createFolderMutation.mutateAsync({
            ...data,
            parentFolderId: createFolderParentId || undefined
          });
        }}
        folders={folders}
        defaultParentId={createFolderParentId}
      />

      {/* MODAL 4: Move Goal Modal */}
      <MoveGoalModal
        isOpen={!!moveGoalTarget}
        onClose={() => setMoveGoalTarget(null)}
        goal={moveGoalTarget}
        folders={folders}
        onMove={async (goalId, folderId, folderName) => {
          await moveGoalMutation.mutateAsync({ goalId, folderId, folderName });
        }}
      />

      {/* MODAL 5: Templates Gallery Modal */}
      <GoalTemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        folders={folders}
        activeFolderId={selectedView.length === 24 ? selectedView : undefined}
      />

      {/* MODAL 6: Global Command / Search Menu (Ctrl+K) */}
      <CommandMenuModal />

      {/* MODAL 7: Quick Numerical Progress Logging Modal */}
      {progressModalGoal && (
        <Modal
          isOpen={!!progressModalGoal}
          onClose={() => setProgressModalGoal(null)}
          title={`Log Progress: ${progressModalGoal.title}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordProgress} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Quantity to Add ({progressModalGoal.measurementUnit || 'units'}):
              </label>
              <div className="flex items-center gap-2">
                {[1, 5, 10].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setQuantityToAdd((prev) => prev + inc)}
                    className="px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-purple-500/40 text-xs font-semibold text-gray-300 hover:text-white transition"
                  >
                    +{inc}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, Number(e.target.value)))}
                  className="flex-1 px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Notes / What did you complete? (Optional):
              </label>
              <textarea
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                placeholder="e.g. Solved two-pointer problems on LeetCode..."
                rows={3}
                className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setProgressModalGoal(null)}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoggingProgress}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition disabled:opacity-50"
              >
                {isLoggingProgress ? 'Logging...' : 'Save Progress'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DRAWER: Authoritative Milestone / Module Detail Drawer */}
      <MilestoneDetailDrawer
        isOpen={activeModuleDrawer.isOpen}
        onClose={closeModuleDrawer}
        milestone={drawerMilestone}
        goalId={activeModuleDrawer.goalId || ''}
        onMilestoneUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
      />
    </div>
  );
};
