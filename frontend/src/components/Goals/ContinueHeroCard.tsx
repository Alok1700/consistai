import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  PlayCircle,
  Clock,
  Pin,
  Folder,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

interface ContinueHeroCardProps {
  goal: {
    _id?: string;
    goalId?: string;
    title: string;
    category: string;
    folder?: string;
    currentProgressPercentage: number;
    priority?: string;
    targetDate?: string;
    isPinned?: boolean;
    remainingDays?: number | null;
    isOverdue?: boolean;
    nextModule?: {
      _id: string;
      title: string;
      sequenceNumber: number;
      estimatedEffort?: string;
      status?: string;
    } | null;
    milestoneStats?: {
      total: number;
      completed: number;
    };
    totalModules?: number;
    completedModules?: number;
  } | null;
  onOpenModuleDrawer?: (goalId: string, milestoneId: string) => void;
  onTogglePin?: (goalId: string) => void;
}

export const ContinueHeroCard: React.FC<ContinueHeroCardProps> = ({
  goal,
  onOpenModuleDrawer,
  onTogglePin
}) => {
  if (!goal) return null;

  const resolvedGoalId = goal._id || goal.goalId || '';
  const totalModules = goal.totalModules ?? (goal.milestoneStats?.total || 0);
  const completedModules = goal.completedModules ?? (goal.milestoneStats?.completed || 0);
  const nextMod = goal.nextModule;

  return (
    <div className="relative rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-gray-900 border border-purple-800/40 p-5 shadow-lg shadow-purple-950/20 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left Information */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Continue Where You Left Off</span>
            </span>

            {goal.folder && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-900/80 text-gray-300 border border-gray-700 flex items-center gap-1">
                <Folder className="w-3 h-3 text-purple-400" />
                <span>{goal.folder}</span>
              </span>
            )}

            {goal.remainingDays !== null && goal.remainingDays !== undefined && (
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  goal.isOverdue
                    ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                    : 'bg-gray-900/80 text-gray-300 border-gray-700'
                }`}
              >
                <Calendar className="w-3 h-3 text-cyan-400" />
                <span>
                  {goal.isOverdue ? 'Overdue' : `${goal.remainingDays} days remaining`}
                </span>
              </span>
            )}

            {onTogglePin && resolvedGoalId && (
              <button
                type="button"
                onClick={() => onTogglePin(resolvedGoalId)}
                className={`p-1 rounded-lg transition ml-auto lg:ml-0 ${
                  goal.isPinned
                    ? 'text-purple-400 bg-purple-950/60'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                title={goal.isPinned ? 'Unpin from Top' : 'Pin to Top'}
              >
                <Pin className={`w-3.5 h-3.5 ${goal.isPinned ? 'fill-purple-400' : ''}`} />
              </button>
            )}
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Link to={`/goals/${resolvedGoalId}`} className="hover:text-purple-300 transition">
                {goal.title}
              </Link>
            </h2>

            {/* Next Module highlight */}
            {nextMod ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-400">Next Action:</span>
                <span className="px-2 py-0.5 rounded-md bg-purple-900/50 border border-purple-700/60 text-purple-200 font-bold font-mono">
                  Module #{String(nextMod.sequenceNumber).padStart(2, '0')}
                </span>
                <span className="font-semibold text-white">{nextMod.title}</span>
                {nextMod.estimatedEffort && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>{nextMod.estimatedEffort}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All predefined modules completed! Great work.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Progress & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800/80 pt-3 lg:pt-0 lg:pl-6">
          <div className="space-y-1.5 min-w-[140px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 text-[11px]">
                {completedModules}/{totalModules} Modules
              </span>
              <span className="font-bold text-white">{goal.currentProgressPercentage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-950 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, goal.currentProgressPercentage)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {nextMod && onOpenModuleDrawer && resolvedGoalId ? (
              <button
                type="button"
                onClick={() => onOpenModuleDrawer(resolvedGoalId, nextMod._id)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{nextMod.status === 'in_progress' ? 'Resume Module' : 'Start Next Module'}</span>
              </button>
            ) : null}

            {resolvedGoalId && (
              <Link
                to={`/goals/${resolvedGoalId}`}
                className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white font-semibold text-xs border border-gray-700 transition flex items-center gap-1"
              >
                <span>Command Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
