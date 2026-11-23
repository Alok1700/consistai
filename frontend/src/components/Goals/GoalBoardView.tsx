import React from 'react';
import { Link } from 'react-router-dom';
import { Goal } from '../../types';
import {
  Folder,
  Star,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  MoreVertical,
  ArrowRight
} from 'lucide-react';

interface GoalBoardViewProps {
  goals: Goal[];
  onToggleFavorite: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export const GoalBoardView: React.FC<GoalBoardViewProps> = ({
  goals,
  onToggleFavorite,
  onUpdateStatus
}) => {
  const columns = [
    {
      id: 'active',
      title: 'In Progress',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
      filter: (g: Goal) => g.status === 'active' && g.currentProgressPercentage > 0 && g.currentProgressPercentage < 100
    },
    {
      id: 'planned',
      title: 'Planned / Not Started',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      filter: (g: Goal) => (g.status === 'active' && g.currentProgressPercentage === 0)
    },
    {
      id: 'paused',
      title: 'On Hold / Paused',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      filter: (g: Goal) => g.status === 'paused'
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      filter: (g: Goal) => g.status === 'completed' || g.currentProgressPercentage >= 100
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const colGoals = goals.filter(col.filter);

        return (
          <div
            key={col.id}
            className="rounded-2xl bg-gray-900/40 border border-gray-800/80 p-3.5 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${col.color}`}>
                  {col.title}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {colGoals.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {colGoals.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-600 italic border border-dashed border-gray-800/60 rounded-xl">
                  No goals in this stage
                </div>
              ) : (
                colGoals.map((goal) => {
                  const pacing = goal.pacing;
                  const totalSlots = goal.moduleCount || goal.milestoneStats?.total || 0;
                  const completedSlots = goal.milestoneStats?.completed || 0;

                  return (
                    <div
                      key={goal._id}
                      className="rounded-xl bg-gray-900/90 border border-gray-800 hover:border-gray-700 p-3.5 space-y-3 transition shadow-sm group"
                    >
                      {/* Tags & Favorite */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-800 text-purple-300 border border-gray-700">
                            {goal.category}
                          </span>
                          {goal.folder && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Folder className="w-2.5 h-2.5 text-purple-400" />
                              <span>{goal.folder}</span>
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleFavorite(goal._id)}
                          className="text-gray-500 hover:text-amber-400"
                          title="Favorite"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              goal.isFavorite ? 'text-amber-400 fill-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Title */}
                      <Link
                        to={`/goals/${goal._id}`}
                        className="block text-xs font-bold text-white hover:text-purple-300 transition leading-snug"
                      >
                        {goal.title}
                      </Link>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-gray-400">
                            {completedSlots}/{totalSlots} Modules
                          </span>
                          <span className="font-bold text-white">
                            {goal.currentProgressPercentage}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                            style={{ width: `${Math.min(100, goal.currentProgressPercentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Footer: Target Date & Status Selector */}
                      <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span>{new Date(goal.targetDate).toLocaleDateString()}</span>
                        </span>

                        <select
                          value={goal.status}
                          onChange={(e) => onUpdateStatus(goal._id, e.target.value)}
                          className="px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-[10px] text-gray-300 focus:outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="completed">Done</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
