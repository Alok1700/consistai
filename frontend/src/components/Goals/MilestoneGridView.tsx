import React from 'react';
import { Milestone } from '../../types';
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  SkipForward,
  Check,
  FileText,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface MilestoneGridViewProps {
  milestones: Milestone[];
  onSelectMilestone: (milestone: Milestone) => void;
  onToggleMilestoneStatus: (milestoneId: string, currentStatus?: string) => void;
}

export const MilestoneGridView: React.FC<MilestoneGridViewProps> = ({
  milestones,
  onSelectMilestone,
  onToggleMilestoneStatus
}) => {
  if (milestones.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-900/30 border border-dashed border-gray-800 rounded-2xl text-xs text-gray-400 space-y-1">
        <p className="font-semibold text-gray-300">No modules in this view.</p>
        <p className="text-[11px] text-gray-500">Generate module slots or bulk-import a syllabus using the buttons above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {milestones.map((m, idx) => {
        const isCompleted = m.isCompleted || m.status === 'completed';
        const isInProgress = m.status === 'in_progress';
        const isSkipped = m.status === 'skipped';
        const moduleNum = String(m.sequenceNumber || m.order || idx + 1).padStart(2, '0');
        const tasks = m.tasks || [];
        const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;

        return (
          <div
            key={m._id}
            onClick={() => onSelectMilestone(m)}
            className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
              isCompleted
                ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-950/30'
                : isInProgress
                ? 'bg-purple-950/30 border-purple-500/50 ring-1 ring-purple-500/30 hover:border-purple-400'
                : isSkipped
                ? 'bg-amber-950/15 border-amber-600/30 hover:border-amber-500/40 opacity-75'
                : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900/90'
            }`}
          >
            {/* Top Row: Slot # & Checkbox */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-md font-black tracking-tight ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : isInProgress
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : isSkipped
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }`}
              >
                #{moduleNum}
              </span>

              {/* Instant Checkbox */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMilestoneStatus(m._id, m.status);
                }}
                className={`p-1 rounded-lg border transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-gray-950 border-gray-700 text-transparent hover:border-gray-500 hover:text-gray-500'
                }`}
                title={isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </button>
            </div>

            {/* Middle: Title */}
            <div className="mb-3">
              <h4
                className={`text-xs font-bold leading-snug line-clamp-2 ${
                  isCompleted
                    ? 'text-emerald-200'
                    : isInProgress
                    ? 'text-white'
                    : isSkipped
                    ? 'text-amber-200/80 line-through'
                    : 'text-gray-300 group-hover:text-white'
                }`}
              >
                {m.title}
              </h4>
            </div>

            {/* Bottom Row: Status Badge & Tasks / Notes Icons */}
            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1 text-gray-400">
                {tasks.length > 0 && (
                  <span
                    className={`font-mono px-1.5 py-0.2 rounded font-semibold ${
                      completedTasksCount === tasks.length
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {completedTasksCount}/{tasks.length}
                  </span>
                )}
                {m.notes && (
                  <span title="Has Study Notes">
                    <FileText className="w-3 h-3 text-indigo-400" />
                  </span>
                )}
                {m.resources && m.resources.length > 0 && (
                  <span title="Has Resources">
                    <BookOpen className="w-3 h-3 text-cyan-400" />
                  </span>
                )}
              </div>

              <span
                className={`font-semibold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isInProgress
                    ? 'bg-purple-500/20 text-purple-300 animate-pulse'
                    : isSkipped
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                {isCompleted ? 'DONE' : isInProgress ? 'ACTIVE' : isSkipped ? 'SKIP' : 'READY'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
