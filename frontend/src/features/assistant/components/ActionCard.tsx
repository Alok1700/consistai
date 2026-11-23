import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Target,
  Flame,
  Calendar,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';

interface ActionCardProps {
  toolResult: {
    toolName: string;
    name?: string;
    success?: boolean;
    result?: any;
    error?: string;
    requiresConfirmation?: boolean;
    confirmationToken?: string;
    preview?: string;
    executionId?: string;
  };
  onUndo?: (executionId?: string) => void;
  onConfirm?: (token: string) => void;
  onCancelConfirm?: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  toolResult,
  onUndo,
  onConfirm,
  onCancelConfirm
}) => {
  const navigate = useNavigate();
  const safeToolResult = toolResult || ({} as any);
  const toolName = safeToolResult.toolName || safeToolResult.name || 'action';
  const { success, result, error, requiresConfirmation, confirmationToken, preview, executionId } = safeToolResult;

  // 1. High-Risk Confirmation Required Dialog Card
  if (requiresConfirmation || result?.requiresConfirmation) {
    const token = confirmationToken || result?.confirmationToken;
    const previewText = preview || result?.preview || 'Please confirm this action.';

    return (
      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2.5 text-xs text-amber-200">
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Security Confirmation Required</span>
        </div>
        <p className="text-[11px] text-amber-100/90 leading-relaxed font-medium">
          {previewText}
        </p>
        <div className="flex items-center gap-2 pt-1">
          {token && onConfirm && (
            <button
              type="button"
              onClick={() => onConfirm(token)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Execute</span>
            </button>
          )}
          {onCancelConfirm && (
            <button
              type="button"
              onClick={onCancelConfirm}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Error Card
  if (success === false || error) {
    return (
      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 space-y-1">
        <div className="font-semibold flex items-center gap-1.5 text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Action Failed ({toolName.replace(/_/g, ' ')})</span>
        </div>
        <p className="text-[11px] text-rose-200/90">{error || 'Operation failed.'}</p>
      </div>
    );
  }

  // 3. Task Action Card
  if (toolName.includes('task')) {
    const title = result?.title || result?.task?.title || 'Task Record';
    const dueDate = result?.dueDate || result?.task?.dueDate;
    const priority = result?.priority || result?.task?.priority;

    return (
      <div className="p-3 rounded-xl bg-[#161E2E] border border-violet-500/30 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{toolName === 'create_task' ? 'Task Created' : toolName === 'complete_task' ? 'Task Completed' : 'Task Updated'}</span>
          </span>
          {priority && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
              priority === 'urgent' ? 'bg-red-950 text-red-400 border border-red-500/30' :
              priority === 'high' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
              'bg-slate-800 text-slate-300'
            }`}>
              {priority}
            </span>
          )}
        </div>

        <div className="font-semibold text-white text-xs truncate">{title}</div>

        {dueDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>{new Date(dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View Tasks</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          {onUndo && (
            <button
              type="button"
              onClick={() => onUndo(executionId)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 ml-auto transition cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 4. Goal Action Card
  if (toolName.includes('goal') && !toolName.includes('milestone') && !toolName.includes('module')) {
    const title = result?.title || result?.goal?.title || 'Goal Plan';
    const category = result?.category || result?.goal?.category;
    const progress = result?.progress ?? result?.goal?.currentProgressPercentage ?? 0;
    const folder = result?.folder || result?.goal?.folder;

    return (
      <div className="p-3 rounded-xl bg-[#161E2E] border border-indigo-500/30 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1">
            <Target className="w-3 h-3 text-indigo-400" />
            <span>Goal Updated</span>
          </span>
          {folder && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {folder}
            </span>
          )}
        </div>

        <div className="font-semibold text-white text-xs truncate">{title}</div>

        {category && (
          <div className="text-[11px] text-slate-400">
            Category: <strong className="text-slate-200">{category}</strong>
          </div>
        )}

        {typeof progress === 'number' && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Progress</span>
              <span className="text-indigo-300 font-bold">{progress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/goals')}
            className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View Goals</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    );
  }

  // 5. Milestone & Module Action Card
  if (toolName.includes('milestone') || toolName.includes('module')) {
    const title = result?.title || result?.moduleTitle || result?.milestoneTitle || 'Milestone Record';
    const goalProgress = result?.goalProgress;

    return (
      <div className="p-3 rounded-xl bg-[#161E2E] border border-fuchsia-500/30 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-fuchsia-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-fuchsia-400" />
            <span>{toolName.replace(/_/g, ' ')}</span>
          </span>
          {typeof goalProgress === 'number' && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-fuchsia-950/60 text-fuchsia-300 font-bold">
              {goalProgress}% Goal Progress
            </span>
          )}
        </div>

        <div className="font-semibold text-white text-xs truncate">{title}</div>
        {result?.message && (
          <p className="text-[11px] text-slate-300">{result.message}</p>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/goals')}
            className="text-[11px] font-semibold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>Open Roadmap</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          {onUndo && (
            <button
              type="button"
              onClick={() => onUndo(executionId)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 ml-auto transition cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 6. Habit Action Card
  if (toolName.includes('habit')) {
    const title = result?.title || 'Habit Routine';
    const streak = result?.currentStreak;

    return (
      <div className="p-3 rounded-xl bg-[#161E2E] border border-emerald-500/30 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{toolName === 'create_habit' ? 'Habit Created' : 'Habit Logged'}</span>
          </span>
          {typeof streak === 'number' && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 text-amber-400" />
              <span>{streak} Days</span>
            </span>
          )}
        </div>

        <div className="font-semibold text-white text-xs truncate">{title}</div>
        {result?.message && (
          <p className="text-[11px] text-slate-300">{result.message}</p>
        )}

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/habits')}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>View Habits</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          {onUndo && (
            <button
              type="button"
              onClick={() => onUndo(executionId)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 ml-auto transition cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Undo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 7. Generic Friendly Action Pill
  return (
    <div className="p-2.5 rounded-xl bg-[#161E2E] border border-slate-700/60 text-xs flex items-center justify-between text-slate-200">
      <div className="flex items-center gap-2 truncate">
        <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span className="font-medium truncate">{result?.message || `${toolName.replace(/_/g, ' ')} completed`}</span>
      </div>
      {onUndo && (
        <button
          type="button"
          onClick={() => onUndo(executionId)}
          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 shrink-0 ml-2 transition cursor-pointer"
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Undo</span>
        </button>
      )}
    </div>
  );
};

export default ActionCard;
