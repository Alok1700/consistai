import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTimerStore } from '../../store/timerStore';
import {
  Search,
  Plus,
  Timer as TimerIcon,
  Play,
  Pause,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Layers,
  Sparkles,
  Menu
} from 'lucide-react';
import { QuickAddMenuModal } from './QuickAddMenuModal';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  onQuickAddAction: (action: 'goal' | 'task' | 'habit' | 'folder' | 'focus') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenMobileMenu,
  onQuickAddAction
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isRunning, isPaused, secondsRemaining, secondsElapsed, timerMode, pauseTimer, resumeTimer } = useTimerStore();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const activeSeconds = timerMode === 'countdown' ? secondsRemaining : secondsElapsed;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate dynamic breadcrumb from pathname
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/' || path === '/today') return ['Workspace', 'Today'];
    if (path.startsWith('/goals/folder')) return ['Workspace', 'Goals', 'Folder'];
    if (path.startsWith('/goals/')) return ['Workspace', 'Goals', 'Goal Detail'];
    if (path === '/goals') return ['Workspace', 'My Goals'];
    if (path === '/tasks') return ['Workspace', 'Tasks'];
    if (path === '/habits') return ['Workspace', 'Habits'];
    if (path === '/calendar') return ['Workspace', 'Calendar'];
    if (path === '/focus') return ['Workspace', 'Focus Timer'];
    if (path === '/analytics') return ['Insights', 'Analytics'];
    if (path === '/screen-time') return ['Insights', 'Screen Time'];
    if (path === '/settings') return ['Preferences', 'Settings'];
    if (path === '/profile') return ['Account', 'Profile'];
    return ['Workspace', 'Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 border-b border-[#263247] bg-[#111827]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] md:hidden transition"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium truncate">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              {idx > 0 && <span className="text-[#64748B]/60">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'text-[#F8FAFC] font-semibold' : 'hover:text-[#94A3B8]'}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Actions: Search, Quick Add, Running Timer, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search Button (Ctrl+K) */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition shadow-sm cursor-pointer"
          title="Search anything (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#1C2638] border border-[#263247] text-[10px] font-mono text-[#64748B]">
            ⌘K
          </kbd>
        </button>

        {/* Quick Add Button */}
        <div className="relative">
          <button
            onClick={() => setIsQuickAddOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition shadow-md shadow-[#8B5CF6]/20 cursor-pointer"
            title="Create new record"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          <QuickAddMenuModal
            isOpen={isQuickAddOpen}
            onClose={() => setIsQuickAddOpen(false)}
            onSelectAction={onQuickAddAction}
          />
        </div>

        {/* Persistent Running Timer Pill */}
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 shadow-sm animate-pulse">
            <TimerIcon className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <Link
              to="/focus"
              className="text-xs font-mono font-bold text-[#F8FAFC] hover:text-[#8B5CF6] transition"
            >
              {formatTimer(activeSeconds)}
            </Link>
            <button
              onClick={isPaused ? resumeTimer : pauseTimer}
              className="text-[#94A3B8] hover:text-[#F8FAFC] transition p-0.5 cursor-pointer"
              title={isPaused ? 'Resume Timer' : 'Pause Timer'}
            >
              {isPaused ? (
                <Play className="w-3 h-3 text-[#10B981] fill-[#10B981]" />
              ) : (
                <Pause className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
              )}
            </button>
          </div>
        )}

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#1C2638] transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] font-bold text-xs flex items-center justify-center uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
          </button>

          {isProfileMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 bg-[#161E2E] border border-[#263247] rounded-2xl shadow-2xl py-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150"
              onClick={() => setIsProfileMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-[#263247]/60">
                <p className="text-xs font-bold text-[#F8FAFC] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#64748B] font-mono truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Profile Account</span>
                </Link>
                <Link
                  to="/settings"
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Preferences</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-[#263247]/60">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
