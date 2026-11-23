import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import { FloatingTimerWidget } from './FloatingTimerWidget';
import { GlobalVoiceAssistant } from '../Assistant/GlobalVoiceAssistant';
import { GoalCreationWizard } from '../Goals/GoalCreationWizard';
import { CreateTaskModal } from '../Common/CreateTaskModal';
import { CreateHabitModal } from '../Common/CreateHabitModal';
import { CreateFolderModal } from '../Goals/CreateFolderModal';
import { GoalFolder } from '../../types';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Sidebar collapse state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('consistai_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('consistai_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Quick Add action modals
  const [isGoalWizardOpen, setIsGoalWizardOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  // Fetch folders for goal wizard and folder modals
  const { data: foldersData } = useQuery<{ folders: GoalFolder[] }>({
    queryKey: ['goal-folders'],
    queryFn: () => api.get('/goal-folders').then((r) => r.data)
  });

  const folders: GoalFolder[] = foldersData?.folders || [];

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickAddAction = (action: 'goal' | 'task' | 'habit' | 'folder' | 'focus') => {
    if (action === 'goal') setIsGoalWizardOpen(true);
    else if (action === 'task') setIsTaskModalOpen(true);
    else if (action === 'habit') setIsHabitModalOpen(true);
    else if (action === 'folder') setIsFolderModalOpen(true);
    else if (action === 'focus') navigate('/focus');
  };

  const handleCreateFolder = async (folderData: any) => {
    await api.post('/goal-folders', folderData);
    queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
    setIsFolderModalOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-[#F8FAFC] font-sans antialiased selection:bg-[#8B5CF6]/30">
      {/* Desktop Global Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Navbar
          onOpenSearch={() => setIsSearchOpen(true)}
          onQuickAddAction={handleQuickAddAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Persistent Floating Timer */}
      <FloatingTimerWidget />

      {/* Global Voice AI Assistant Floating Trigger & Drawer */}
      <GlobalVoiceAssistant />

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Quick Add Modals */}
      <GoalCreationWizard
        isOpen={isGoalWizardOpen}
        onClose={() => setIsGoalWizardOpen(false)}
        folders={folders}
        onGoalCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          setIsGoalWizardOpen(false);
        }}
      />

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      <CreateHabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
      />

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folders={folders}
        onSubmit={handleCreateFolder}
      />
    </div>
  );
};
