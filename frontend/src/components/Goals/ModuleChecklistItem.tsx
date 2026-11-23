import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2, Edit2, X } from 'lucide-react';
import { api } from '../../api/client';
import { GoalModule } from '../../types';

interface ModuleChecklistItemProps {
  module: GoalModule;
  milestoneId: string;
  goalId: string;
  moduleIndex: number;
  milestoneOrder?: number;
  onDeleted?: () => void;
}

export const ModuleChecklistItem: React.FC<ModuleChecklistItemProps> = ({
  module,
  milestoneId,
  goalId,
  onDeleted,
}) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(module.title);
  const [optimisticCompleted, setOptimisticCompleted] = useState(module.isCompleted);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOptimisticCompleted(module.isCompleted);
  }, [module.isCompleted]);

  useEffect(() => {
    setEditTitle(module.title);
  }, [module.title]);

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/goal-modules/${module._id}/toggle`);
      return res.data;
    },
    onMutate: async () => {
      setOptimisticCompleted((prev) => !prev);
      setErrorMsg(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
    onError: (err: unknown) => {
      // Rollback optimistic update
      setOptimisticCompleted(module.isCompleted);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMsg(axiosErr.response?.data?.message || 'Failed to toggle module');
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.patch(`/goal-modules/${module._id}`, { title });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsEditing(false);
    },
    onError: () => {
      setEditTitle(module.title);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/goal-modules/${module._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (onDeleted) onDeleted();
    },
  });

  const startEditing = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const handleRenameSubmit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== module.title) {
      renameMutation.mutate(trimmed);
    } else {
      setEditTitle(module.title);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(module.title);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 px-1 rounded-lg hover:bg-slate-800/30 transition group select-none">
      {/* Left: Square Checkbox + Title / Input */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rounded Square Checkbox (matches reference image) */}
        <button
          type="button"
          onClick={() => !toggleMutation.isPending && toggleMutation.mutate()}
          disabled={toggleMutation.isPending}
          className={`
            w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer
            ${optimisticCompleted
              ? 'bg-[#10B981] border border-[#10B981] text-white shadow-sm shadow-emerald-950/40'
              : 'bg-[#0B1120] border-2 border-slate-700 hover:border-emerald-500'}
            ${toggleMutation.isPending ? 'opacity-60 cursor-wait' : ''}
          `}
          aria-label={optimisticCompleted ? 'Mark incomplete' : 'Mark complete'}
        >
          {optimisticCompleted && (
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          )}
        </button>

        {/* Title or Inline Rename Input */}
        {isEditing ? (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleRenameSubmit}
              className="flex-1 min-w-0 text-sm text-slate-100 bg-[#0B1120] border border-emerald-500 rounded-lg px-2 py-0.5 focus:outline-none"
              placeholder="Module title..."
            />
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleRenameSubmit(); }}
              className="p-1 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition shrink-0"
              title="Save (Enter)"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleCancelEdit(); }}
              className="p-1 rounded text-slate-400 hover:text-slate-300 hover:bg-slate-800 transition shrink-0"
              title="Cancel (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span
            onDoubleClick={startEditing}
            onClick={() => !toggleMutation.isPending && toggleMutation.mutate()}
            className={`flex-1 min-w-0 text-sm truncate cursor-pointer transition ${
              optimisticCompleted
                ? 'line-through text-slate-400/90'
                : 'text-slate-200 hover:text-white'
            }`}
            title={`${module.title} (Double-click or click pencil to rename)`}
          >
            {module.title}
          </span>
        )}
      </div>

      {/* Right: Action Buttons (Rename Pencil + Trash) */}
      {!isEditing && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={startEditing}
            className="p-1 rounded text-slate-500 hover:text-emerald-400 opacity-60 group-hover:opacity-100 transition cursor-pointer"
            title="Rename module"
            aria-label="Rename module"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="p-1 rounded text-slate-500 hover:text-rose-400 group-hover:text-slate-400 transition cursor-pointer"
            title="Delete module"
            aria-label="Delete module"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
