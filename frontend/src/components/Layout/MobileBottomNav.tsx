import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Flame,
  MoreHorizontal,
  CalendarDays,
  Timer,
  LineChart,
  Smartphone,
  Settings,
  X
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainItems = [
    { to: '/today', label: 'Today', icon: LayoutDashboard, exact: true },
    { to: '/goals', label: 'Goals', icon: Target },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/habits', label: 'Habits', icon: Flame }
  ];

  const moreItems = [
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/focus', label: 'Focus Timer', icon: Timer },
    { to: '/analytics', label: 'Analytics', icon: LineChart },
    { to: '/screen-time', label: 'Screen Time', icon: Smartphone },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Slide-up sheet for 'More' */}
      {isMoreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden flex flex-col justify-end"
          onClick={() => setIsMoreOpen(false)}
        >
          <div
            className="bg-[#161E2E] border-t border-[#263247] rounded-t-3xl p-5 pb-8 space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#263247]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                More Tools & Insights
              </span>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isMatch = location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition ${
                      isMatch
                        ? 'bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30'
                        : 'bg-[#111827] text-[#94A3B8] border border-[#263247] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#8B5CF6]" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#111827]/95 backdrop-blur-lg border-t border-[#263247] h-16 flex items-center justify-around px-2 md:hidden">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isMatch = item.exact
            ? location.pathname === '/' || location.pathname === '/today'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isMatch ? 'text-[#8B5CF6]' : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </NavLink>
          );
        })}

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
            isMoreOpen || moreItems.some((m) => location.pathname.startsWith(m.to))
              ? 'text-[#8B5CF6]'
              : 'text-[#64748B] hover:text-[#94A3B8]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>
    </>
  );
};
