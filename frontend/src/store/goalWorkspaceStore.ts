import { create } from 'zustand';

export type WorkspaceViewMode = 'grid' | 'list' | 'calendar' | 'board';
export type WorkspaceMode = 'checklist' | 'overview';

interface GoalWorkspaceState {
  workspaceMode: WorkspaceMode;
  setWorkspaceMode: (mode: WorkspaceMode) => void;

  activeGoalId: string | null;
  setActiveGoalId: (id: string | null) => void;

  viewMode: WorkspaceViewMode;
  setViewMode: (mode: WorkspaceViewMode) => void;

  selectedView: string; // 'all' | 'today' | 'favorites' | 'active' | 'completed' | 'archived' | folderId
  selectedFolderName: string;
  setSelectedView: (view: string, folderName?: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;

  isCommandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  toggleCommandMenu: () => void;

  isQuickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;

  isAdvancedWizardOpen: boolean;
  setAdvancedWizardOpen: (open: boolean) => void;

  isTemplateGalleryOpen: boolean;
  setTemplateGalleryOpen: (open: boolean) => void;

  pinnedGoalId: string | null;
  setPinnedGoalId: (id: string | null) => void;

  activeModuleDrawer: {
    isOpen: boolean;
    goalId: string | null;
    milestoneId: string | null;
  };
  openModuleDrawer: (goalId: string, milestoneId: string) => void;
  closeModuleDrawer: () => void;
}

export const useGoalWorkspaceStore = create<GoalWorkspaceState>((set) => ({
  workspaceMode: (localStorage.getItem('consistai_workspace_mode') as WorkspaceMode) || 'checklist',
  setWorkspaceMode: (mode) => {
    localStorage.setItem('consistai_workspace_mode', mode);
    set({ workspaceMode: mode });
  },

  activeGoalId: localStorage.getItem('consistai_active_goal_id') || null,
  setActiveGoalId: (id) => {
    if (id) {
      localStorage.setItem('consistai_active_goal_id', id);
    } else {
      localStorage.removeItem('consistai_active_goal_id');
    }
    set({ activeGoalId: id });
  },

  viewMode: (localStorage.getItem('consistai_goal_view_mode') as WorkspaceViewMode) || 'grid',
  setViewMode: (mode) => {
    localStorage.setItem('consistai_goal_view_mode', mode);
    set({ viewMode: mode });
  },

  selectedView: 'all',
  selectedFolderName: 'All Goals',
  setSelectedView: (view, folderName = 'All Goals') =>
    set({ selectedView: view, selectedFolderName: folderName }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  isCommandMenuOpen: false,
  setCommandMenuOpen: (open) => set({ isCommandMenuOpen: open }),
  toggleCommandMenu: () => set((state) => ({ isCommandMenuOpen: !state.isCommandMenuOpen })),

  isQuickCreateOpen: false,
  setQuickCreateOpen: (open) => set({ isQuickCreateOpen: open }),

  isAdvancedWizardOpen: false,
  setAdvancedWizardOpen: (open) => set({ isAdvancedWizardOpen: open }),

  isTemplateGalleryOpen: false,
  setTemplateGalleryOpen: (open) => set({ isTemplateGalleryOpen: open }),

  pinnedGoalId: localStorage.getItem('consistai_pinned_goal_id') || null,
  setPinnedGoalId: (id) => {
    if (id) {
      localStorage.setItem('consistai_pinned_goal_id', id);
    } else {
      localStorage.removeItem('consistai_pinned_goal_id');
    }
    set({ pinnedGoalId: id });
  },

  activeModuleDrawer: {
    isOpen: false,
    goalId: null,
    milestoneId: null
  },
  openModuleDrawer: (goalId, milestoneId) =>
    set({
      activeModuleDrawer: {
        isOpen: true,
        goalId,
        milestoneId
      }
    }),
  closeModuleDrawer: () =>
    set({
      activeModuleDrawer: {
        isOpen: false,
        goalId: null,
        milestoneId: null
      }
    })
}));
