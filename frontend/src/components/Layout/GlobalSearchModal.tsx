import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Search,
  X,
  Target,
  CheckSquare,
  Flame,
  Folder,
  ArrowRight,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fetch Goals
  const { data: goalsData } = useQuery({
    queryKey: ['search-goals'],
    queryFn: () => api.get('/goals').then((r) => r.data?.goals || []),
    enabled: isOpen
  });

  // Fetch Tasks
  const { data: tasksData } = useQuery({
    queryKey: ['search-tasks'],
    queryFn: () => api.get('/tasks').then((r) => r.data?.tasks || []),
    enabled: isOpen
  });

  // Fetch Habits
  const { data: habitsData } = useQuery({
    queryKey: ['search-habits'],
    queryFn: () => api.get('/habits').then((r) => r.data?.habits || []),
    enabled: isOpen
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const goals = goalsData || [];
  const tasks = tasksData || [];
  const habits = habitsData || [];

  const trimmed = query.trim().toLowerCase();

  const filteredGoals = trimmed
    ? goals.filter((g: any) => g.title?.toLowerCase().includes(trimmed) || g.category?.toLowerCase().includes(trimmed))
    : goals.slice(0, 4);

  const filteredTasks = trimmed
    ? tasks.filter((t: any) => t.title?.toLowerCase().includes(trimmed))
    : tasks.slice(0, 4);

  const filteredHabits = trimmed
    ? habits.filter((h: any) => h.title?.toLowerCase().includes(trimmed))
    : habits.slice(0, 3);

  // Flat list for keyboard navigation
  const results: Array<{ id: string; type: 'goal' | 'task' | 'habit'; title: string; subtitle?: string; path: string }> = [
    ...filteredGoals.map((g: any) => ({
      id: g._id,
      type: 'goal' as const,
      title: g.title,
      subtitle: `${g.currentProgressPercentage || 0}% completed · ${g.category || 'Goal'}`,
      path: `/goals/${g._id}`
    })),
    ...filteredTasks.map((t: any) => ({
      id: t._id,
      type: 'task' as const,
      title: t.title,
      subtitle: `Due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'anytime'} · Priority ${t.priority || 'medium'}`,
      path: '/tasks'
    })),
    ...filteredHabits.map((h: any) => ({
      id: h._id,
      type: 'habit' as const,
      title: h.title,
      subtitle: `${h.streak || 0} day streak · ${h.frequency || 'daily'}`,
      path: '/habits'
    }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigate(results[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-xl bg-[#161E2E] border border-[#263247] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#263247] bg-[#111827]">
          <Search className="w-5 h-5 text-[#8B5CF6] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search goals, milestones, tasks, habits... (↑↓ to navigate)"
            className="flex-1 bg-transparent text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[#94A3B8] hover:text-[#F8FAFC]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#1C2638] text-[#94A3B8] border border-[#263247] rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-[#263247]/50">
          {results.length === 0 ? (
            <div className="text-center py-12 px-4 text-[#94A3B8]">
              <Search className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#F8FAFC]">No matching items found</p>
              <p className="text-xs text-[#64748B] mt-1">Try searching for a goal title, task, or habit keyword</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.type === 'goal' ? Target : item.type === 'task' ? CheckSquare : Flame;
                const iconColor = item.type === 'goal' ? 'text-[#8B5CF6]' : item.type === 'task' ? 'text-[#38BDF8]' : 'text-[#F59E0B]';

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      navigate(item.path);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/30'
                        : 'hover:bg-[#1C2638] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg bg-[#111827] border border-[#263247] ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC] block truncate">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="text-[11px] text-[#94A3B8] block truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#111827] text-[#94A3B8] border border-[#263247]">
                        {item.type}
                      </span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#8B5CF6]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#111827] border-t border-[#263247] flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-[#1C2638] border border-[#263247] rounded text-[10px] text-[#94A3B8]">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-[#1C2638] border border-[#263247] rounded text-[10px] text-[#94A3B8]">↵</kbd> Select</span>
          </div>
          <span>ConsistAI Global Index</span>
        </div>
      </div>
    </div>
  );
};
