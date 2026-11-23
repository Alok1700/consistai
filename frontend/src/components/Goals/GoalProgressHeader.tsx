import React from 'react';
import { Target, Calendar, CheckCircle2, Layers, Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { Goal, GoalMilestone } from '../../types';

interface GoalProgressHeaderProps {
  goal: Goal;
  milestones: GoalMilestone[];
}

export const GoalProgressHeader: React.FC<GoalProgressHeaderProps> = ({ goal, milestones }) => {
  const totalModules = milestones.reduce((sum, m) => sum + (m.moduleCount || 0), 0);
  const completedModules = milestones.reduce((sum, m) => sum + (m.completedModuleCount || 0), 0);
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'completed' || m.progressPercentage >= 100).length;

  const calculatedPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const progressPct = totalModules > 0 ? calculatedPct : (goal.currentProgressPercentage ?? 0);

  const formattedDeadline = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'No deadline';

  const isCompleted = goal.status === 'completed' || progressPct >= 100;

  return (
    <div className="bg-[#151B2E] border border-[#243047] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-80 h-36 bg-gradient-to-bl from-purple-600/10 via-violet-600/5 to-transparent pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        {/* Left: Title & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-purple-900/40 text-purple-300 border border-purple-700/50">
              {goal.category || 'Goal'}
            </span>
            {goal.folder && (
              <span className="text-xs text-slate-400 font-medium">
                📁 {typeof goal.folder === 'string' ? goal.folder : (goal.folder as any).name}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                goal.priority === 'urgent'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : goal.priority === 'high'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {goal.priority?.toUpperCase()} PRIORITY
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
            {goal.title}
            {isCompleted && (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 inline shrink-0" />
            )}
          </h1>

          {goal.description && (
            <p className="text-xs text-[#94A3B8] max-w-2xl line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>

        {/* Right: Key Progress Metrics */}
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
          {/* Milestone ratio */}
          <div className="bg-[#0B1120] border border-[#243047] rounded-xl px-3.5 py-2.5 text-center min-w-[100px]">
            <span className="text-[11px] text-[#94A3B8] font-medium block">Milestones</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center justify-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{completedMilestones} / {totalMilestones}</span>
            </div>
          </div>

          {/* Module ratio */}
          <div className="bg-[#0B1120] border border-[#243047] rounded-xl px-3.5 py-2.5 text-center min-w-[100px]">
            <span className="text-[11px] text-[#94A3B8] font-medium block">Modules</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{completedModules} / {totalModules}</span>
            </div>
          </div>

          {/* Target Date */}
          <div className="bg-[#0B1120] border border-[#243047] rounded-xl px-3.5 py-2.5 text-center min-w-[110px]">
            <span className="text-[11px] text-[#94A3B8] font-medium block">Deadline</span>
            <div className="text-xs font-semibold text-slate-200 mt-1 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDeadline}</span>
            </div>
          </div>

          {/* Overall Completion Percentage Badge */}
          <div className="bg-gradient-to-br from-purple-950/70 to-indigo-950/70 border border-purple-500/40 rounded-xl px-4 py-2.5 text-center min-w-[90px] shadow-lg shadow-purple-950/40">
            <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Progress</span>
            <span className="text-xl font-extrabold text-white tracking-tight">
              {progressPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Thin overall progress bar */}
      <div className="mt-4 pt-3 border-t border-[#243047]/60">
        <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1.5 font-medium">
          <span>Overall Curriculum Completion</span>
          <span className="text-purple-300 font-semibold">{progressPct}% ({completedModules} of {totalModules} modules)</span>
        </div>
        <div className="h-1.5 bg-[#0B1120] rounded-full overflow-hidden border border-[#243047]/40">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
