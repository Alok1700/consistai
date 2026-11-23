import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Goal } from '../../types';
import {
  Folder,
  Calendar,
  MoreVertical,
  Star,
  Pin,
  Edit2,
  FolderInput,
  Copy,
  Archive,
  Trash2,
  PlayCircle,
  Trophy,
  Plus
} from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onToggleFavorite: (goalId: string) => void;
  onPinPrimary: (goalId: string) => void;
  onMoveFolder: (goal: Goal) => void;
  onDuplicate: (goalId: string) => void;
  onArchive: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onLogProgress?: (goal: Goal) => void;
  onSelectGoal?: (goal: Goal) => void;
  isPinned?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onEdit,
  onToggleFavorite,
  onPinPrimary,
  onMoveFolder,
  onDuplicate,
  onArchive,
  onDelete,
  onLogProgress,
  onSelectGoal,
  isPinned = false
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const progress = Math.min(100, Math.max(0, goal.currentProgressPercentage || 0));
  const isCompleted = goal.status === 'completed' || progress >= 100;
  const isNumerical = goal.progressType === 'numerical';

  const pacing = goal.pacing;
  const pacingStatus = pacing?.pacing_status || goal.pacingStatus || 'on_pace';
  const pacingLabel = pacing?.pacing_label || (pacingStatus === 'ahead' ? 'Ahead of Schedule' : pacingStatus === 'on_pace' ? 'On Track' : 'Needs Attention');

  const now = new Date();
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const isOverdue = targetDate ? targetDate < now && !isCompleted : false;
  const remainingDays = targetDate ? Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / 86400000)) : null;

  return (
    <div className="group relative rounded-2xl bg-[#161E2E] border border-[#263247] hover:border-[#8B5CF6]/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
      {/* Optional Top Accent or Cover Image */}
      {goal.imageUrl ? (
        <div className="h-24 w-full overflow-hidden relative">
          <img
            src={goal.imageUrl}
            alt={goal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161E2E] to-transparent" />
        </div>
      ) : (
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: goal.color || '#8B5CF6' }}
        />
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-5 space-y-3.5 flex-1">
        {/* Top Badges & 3-Dot Action Menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            {goal.folder && (
              <span className="text-[10px] font-semibold text-[#94A3B8] bg-[#0B0F19] px-2 py-0.5 rounded-md border border-[#263247] flex items-center gap-1 shrink-0">
                <Folder className="w-2.5 h-2.5 text-[#8B5CF6]" />
                <span className="truncate max-w-[100px]">{goal.folder}</span>
              </span>
            )}
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#0B0F19]/60 px-2 py-0.5 rounded-md border border-[#263247]/60 truncate">
              {goal.category}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 relative">
            {goal.isFavorite && (
              <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            )}
            {isPinned && (
              <Pin className="w-3.5 h-3.5 text-[#8B5CF6] fill-[#8B5CF6]" />
            )}

            {/* 3-Dot Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition cursor-pointer"
                aria-label="Goal actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 z-50 w-44 rounded-xl bg-[#111827] border border-[#263247] shadow-xl py-1 text-xs text-[#94A3B8]">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(goal);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1C2638] hover:text-[#F8FAFC] flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>Edit Goal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onToggleFavorite(goal._id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1C2638] hover:text-[#F8FAFC] flex items-center gap-2"
                    >
                      <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>{goal.isFavorite ? 'Unfavorite' : 'Add to Favorites'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onPinPrimary(goal._id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1C2638] hover:text-[#F8FAFC] flex items-center gap-2"
                    >
                      <Pin className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>{isPinned ? 'Unpin Primary' : 'Pin as Primary'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onMoveFolder(goal);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1C2638] hover:text-[#F8FAFC] flex items-center gap-2"
                    >
                      <FolderInput className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Move to Folder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDuplicate(goal._id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1C2638] hover:text-[#F8FAFC] flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Duplicate Goal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onArchive(goal._id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1C2638] hover:text-[#F8FAFC] flex items-center gap-2"
                    >
                      <Archive className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{goal.isArchived ? 'Restore' : 'Archive'}</span>
                    </button>

                    <div className="border-t border-[#263247] my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(goal._id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#EF4444]/20 text-[#EF4444] flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Goal</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        {onSelectGoal ? (
          <button
            type="button"
            onClick={() => onSelectGoal(goal)}
            className="text-base font-bold text-[#F8FAFC] hover:text-[#8B5CF6] transition block truncate text-left w-full cursor-pointer"
          >
            {goal.title}
          </button>
        ) : (
          <Link
            to={`/goals/${goal._id}`}
            className="text-base font-bold text-[#F8FAFC] hover:text-[#8B5CF6] transition block truncate"
          >
            {goal.title}
          </Link>
        )}

        {/* Progress Bar & Ratio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#94A3B8]">
              {isNumerical ? (
                <>
                  <strong className="text-[#F8FAFC]">{goal.achievedQuantity || 0}</strong> of{' '}
                  {goal.targetQuantity} {goal.measurementUnit || 'Items'}
                </>
              ) : (
                <>
                  <strong className="text-[#F8FAFC]">
                    {goal.milestoneStats?.completed ?? 0}
                  </strong>{' '}
                  of {goal.milestoneStats?.total ?? goal.moduleCount ?? 0} Modules
                </>
              )}
            </span>
            <span className="text-[#8B5CF6] font-mono font-bold">{progress}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#0B0F19] overflow-hidden border border-[#263247]/60">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isCompleted ? 'bg-[#10B981]' : 'bg-[#8B5CF6]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Deadline & Pacing Indicator */}
        <div className="flex items-center justify-between text-[11px] pt-1 text-[#64748B]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#38BDF8]" />
            <span>
              {remainingDays !== null ? (
                isOverdue ? (
                  <strong className="text-[#EF4444]">Overdue</strong>
                ) : (
                  `${remainingDays}d left`
                )
              ) : (
                'Open Schedule'
              )}
            </span>
          </span>

          <span
            className={`font-semibold ${
              pacingStatus === 'ahead' || pacingStatus === 'on_pace'
                ? 'text-[#10B981]'
                : 'text-[#F59E0B]'
            }`}
          >
            {isCompleted ? 'Completed' : pacingLabel}
          </span>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="p-3 border-t border-[#263247] bg-[#111827]/40">
        {isCompleted ? (
          <Link
            to={`/goals/${goal._id}`}
            className="w-full py-2 px-3 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-[#10B981]" />
            <span>View Achievement</span>
          </Link>
        ) : isNumerical ? (
          <button
            type="button"
            onClick={() => onLogProgress && onLogProgress(goal)}
            className="w-full py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Progress</span>
          </button>
        ) : onSelectGoal ? (
          <button
            type="button"
            onClick={() => onSelectGoal(goal)}
            className="w-full py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Open Checklist</span>
          </button>
        ) : (
          <Link
            to={`/goals/${goal._id}`}
            className="w-full py-2 px-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Continue Module</span>
          </Link>
        )}
      </div>
    </div>
  );
};
