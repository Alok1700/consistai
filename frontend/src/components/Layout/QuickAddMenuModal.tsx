import React, { useRef, useEffect } from 'react';
import { Target, CheckSquare, Flame, FolderPlus, Timer, X } from 'lucide-react';

interface QuickAddMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'goal' | 'task' | 'habit' | 'folder' | 'focus') => void;
}

export const QuickAddMenuModal: React.FC<QuickAddMenuProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'goal' as const,
      label: 'New Goal',
      description: 'Create milestone-driven or numerical roadmap',
      icon: Target,
      color: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30'
    },
    {
      id: 'task' as const,
      label: 'New Task',
      description: 'Schedule a daily, weekly or priority action',
      icon: CheckSquare,
      color: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30'
    },
    {
      id: 'habit' as const,
      label: 'New Habit',
      description: 'Build consistency with daily streaks',
      icon: Flame,
      color: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
    },
    {
      id: 'folder' as const,
      label: 'New Folder',
      description: 'Organize goals into nested categories',
      icon: FolderPlus,
      color: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
    },
    {
      id: 'focus' as const,
      label: 'Start Focus Session',
      description: 'Distraction-free Pomodoro or Deep Focus',
      icon: Timer,
      color: 'text-violet-400 bg-violet-500/10 border-violet-500/30'
    }
  ];

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-12 w-72 bg-[#161E2E] border border-[#263247] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#263247]/60 mb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
          Quick Create
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#94A3B8] hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={() => {
                onSelectAction(act.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-[#1C2638] transition group cursor-pointer"
            >
              <div className={`p-2 rounded-lg border ${act.color} shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition block">
                  {act.label}
                </span>
                <span className="text-[10px] text-[#64748B] block truncate">
                  {act.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
