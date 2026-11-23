import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Flame,
  CalendarDays,
  Timer,
  LineChart,
  Smartphone,
  Settings,
  User,
  BrainCircuit,
  DatabaseZap,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Bot
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSeedSuccess?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse
}) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedData = async () => {
    if (
      !window.confirm(
        'Load realistic 60-day demo dataset with DSA curriculum, habit streaks, work sessions, and precomputed ML models?'
      )
    )
      return;
    setSeeding(true);
    setSeedMessage(null);
    try {
      await api.post('/seed/demo-data');
      setSeedMessage('Demo dataset loaded!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      setSeedMessage('Failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setSeeding(false);
    }
  };

  const workspaceNavItems = [
    { to: '/today', label: 'Today', icon: LayoutDashboard, exact: true },
    { to: '/goals', label: 'My Goals', icon: Target },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/habits', label: 'Habits', icon: Flame },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/focus', label: 'Focus', icon: Timer }
  ];

  const intelligenceNavItems = [
    { to: '/analytics', label: 'Analytics', icon: LineChart },
    { to: '/screen-time', label: 'Screen Time', icon: Smartphone },
    { to: '/assistant', label: 'AI Assistant', icon: Bot }
  ];

  const preferencesNavItems = [
    { to: '/settings', label: 'Settings', icon: Settings },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <aside
      className={`bg-[#111827] border-r border-[#263247] flex flex-col shrink-0 h-screen sticky top-0 z-30 select-none transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-56 sm:w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-[#263247] justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] flex items-center justify-center shadow-md shadow-[#8B5CF6]/30 shrink-0">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div className="leading-tight min-w-0">
              <span className="font-bold text-sm text-[#F8FAFC] tracking-tight">
                ConsistAI
              </span>
              <p className="text-[10px] text-[#64748B] font-medium truncate">Productivity OS</p>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition hidden sm:flex"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {/* WORKSPACE */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Workspace
            </div>
          )}
          {workspaceNavItems.map((item) => {
            const Icon = item.icon;
            const isMatch = item.exact
              ? location.pathname === '/' || location.pathname === '/today'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isMatch
                    ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638]'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isMatch ? 'text-[#8B5CF6]' : 'text-[#64748B]'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* INTELLIGENCE */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Intelligence
            </div>
          )}
          {intelligenceNavItems.map((item) => {
            const Icon = item.icon;
            const isMatch = location.pathname.startsWith(item.to) ||
              (item.to === '/screen-time' && location.pathname.startsWith('/screentime'));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isMatch
                    ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638]'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isMatch ? 'text-[#8B5CF6]' : 'text-[#64748B]'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* PREFERENCES */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Preferences
            </div>
          )}
          {preferencesNavItems.map((item) => {
            const Icon = item.icon;
            const isMatch = location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isMatch
                    ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638]'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isMatch ? 'text-[#8B5CF6]' : 'text-[#64748B]'}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Footer Controls: User profile, theme toggle, and collapse */}
      <div className="p-2 border-t border-[#263247] space-y-2">
        {seedMessage && (
          <div className="text-[10px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 p-1.5 rounded-lg text-center font-medium">
            {seedMessage}
          </div>
        )}

        {/* Action Row */}
        <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#8B5CF6]" />}
          </button>

          {!isCollapsed && (
            <button
              type="button"
              onClick={handleSeedData}
              disabled={seeding}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-[#94A3B8] hover:text-[#8B5CF6] bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] transition flex items-center gap-1.5 disabled:opacity-50"
              title="Load 60-day demo dataset"
            >
              <DatabaseZap className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>{seeding ? 'Seeding...' : 'Load Demo'}</span>
            </button>
          )}

          {isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Pill */}
        {user && (
          <div className={`flex items-center gap-2 p-1.5 rounded-xl bg-[#161E2E] border border-[#263247] ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] font-bold text-xs flex items-center justify-center uppercase shrink-0">
              {user.name ? user.name[0] : 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#F8FAFC] block truncate">{user.name}</span>
                <span className="text-[10px] text-[#64748B] block truncate font-mono">{user.email}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
