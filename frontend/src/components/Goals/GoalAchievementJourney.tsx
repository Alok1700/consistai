import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Goal, Milestone, Task } from '../../types';
import {
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Layers,
  ChevronRight,
  Flame,
  Bot,
  Sliders,
  Check,
  X,
  Lock,
  Flag,
  Trophy
} from 'lucide-react';
import { api } from '../../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface GoalAchievementJourneyProps {
  goal: Goal;
  milestones: Milestone[];
  tasks?: Task[];
  onAdjustPlan?: () => void;
  onMilestoneCompleted?: (milestone: Milestone) => void;
}

export const GoalAchievementJourney: React.FC<GoalAchievementJourneyProps> = ({
  goal,
  milestones,
  tasks = [],
  onAdjustPlan,
  onMilestoneCompleted
}) => {
  const queryClient = useQueryClient();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Identify current active milestone (first non-completed milestone)
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
  const currentMilestoneIndex = sortedMilestones.findIndex((m) => !m.isCompleted);
  const currentMilestone = currentMilestoneIndex !== -1 ? sortedMilestones[currentMilestoneIndex] : null;

  // Milestone completion mutation
  const toggleMilestoneMutation = useMutation({
    mutationFn: async ({ mId, isCompleted }: { mId: string; isCompleted: boolean }) => {
      const res = await api.put(`/milestones/${mId}`, { isCompleted });
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goal._id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['achievements-latest'] });

      if (variables.isCompleted) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#6366F1', '#22C55E', '#F59E0B']
        });
      }

      if (selectedMilestone && selectedMilestone._id === variables.mId) {
        setSelectedMilestone({
          ...selectedMilestone,
          isCompleted: variables.isCompleted,
          progressPercentage: variables.isCompleted ? 100 : 0
        });
      }
    }
  });

  // Task toggle mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.patch(`/tasks/${taskId}/toggle`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goal._id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const getMilestoneState = (m: Milestone, idx: number) => {
    if (m.isCompleted) return 'completed';
    if (currentMilestone && m._id === currentMilestone._id) {
      // Check if overdue: targetDate passed and pacing is in critical deficit
      if (goal.pacing?.pacing_status === 'critical_deficit') return 'overdue';
      return 'current';
    }
    return 'upcoming';
  };

  const getTasksForMilestone = (mId: string) => {
    return tasks.filter((t) => {
      const lm = (t.linkedMilestone as any)?._id || t.linkedMilestone;
      return lm === mId;
    });
  };

  return (
    <div className="space-y-6">
      {/* Journey Roadmap Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              Interactive Goal Journey
            </span>
            <span className="text-xs text-slate-400">
              {milestones.filter((m) => m.isCompleted).length} of {milestones.length} Milestones Conquered
            </span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Roadmap to: {goal.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any milestone node to inspect required tasks, verify progress, and view contextual AI coaching.
          </p>
        </div>

        {currentMilestone && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Flame className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-300 uppercase block">Current Active Focus</span>
              <span className="text-xs font-bold text-white">{currentMilestone.title}</span>
            </div>
          </div>
        )}
      </div>

      {/* Connected Roadmap Pathway */}
      <div className="relative py-4 px-2 sm:px-6">
        {/* Pathway Connecting Line */}
        <div className="hidden sm:block absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-slate-700" />

        {/* Milestone Nodes List */}
        <div className="space-y-4 relative">
          {/* Starting Point Node */}
          <div className="flex items-center gap-4 sm:ml-4">
            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 shadow-md shrink-0 z-10">
              <Flag className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Starting Point</span>
              <p className="text-slate-400">Journey initiated on {new Date(goal.startDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Dynamic Milestones */}
          {sortedMilestones.map((m, idx) => {
            const state = getMilestoneState(m, idx);
            const isSelected = selectedMilestone?._id === m._id;
            const milestoneTasks = getTasksForMilestone(m._id);
            const completedTasksCount = milestoneTasks.filter((t) => t.status === 'completed').length;

            return (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="flex items-start gap-4 sm:ml-4 group cursor-pointer"
                onClick={() => setSelectedMilestone(m)}
              >
                {/* Node Status Indicator */}
                <div className="relative shrink-0 z-10 pt-1">
                  {state === 'completed' && (
                    <div className="w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  )}

                  {state === 'current' && (
                    <div className="w-9 h-9 rounded-full bg-purple-600/30 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-lg shadow-purple-600/30 relative">
                      <div className="absolute inset-0 rounded-full border border-purple-400 animate-ping opacity-30" />
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>
                  )}

                  {state === 'overdue' && (
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}

                  {state === 'upcoming' && (
                    <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-400 group-hover:border-slate-500 transition">
                      <span className="text-xs font-semibold">{idx + 1}</span>
                    </div>
                  )}
                </div>

                {/* Milestone Card */}
                <div
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : state === 'current'
                      ? 'bg-purple-950/20 border-purple-800/50 hover:border-purple-700 shadow-sm'
                      : state === 'completed'
                      ? 'bg-emerald-950/15 border-emerald-800/40 hover:border-emerald-700/60'
                      : state === 'overdue'
                      ? 'bg-amber-950/15 border-amber-800/40 hover:border-amber-700/60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          Milestone {idx + 1}
                        </span>
                        {state === 'completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Completed
                          </span>
                        )}
                        {state === 'current' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Current Milestone
                          </span>
                        )}
                        {state === 'overdue' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            Pacing Deficit
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          Weight: {m.weight}%
                        </span>
                      </div>

                      <h4 className={`text-base font-bold ${state === 'completed' ? 'text-emerald-300' : 'text-white'}`}>
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{m.description}</p>
                      )}
                    </div>

                    {/* Progress Stats & Quick Toggle */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">
                          {m.achievedQuantity} / {m.targetQuantity} {goal.measurementUnit}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {m.progressPercentage}% Progress
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMilestoneMutation.mutate({
                            mId: m._id,
                            isCompleted: !m.isCompleted
                          });
                        }}
                        className={`p-2 rounded-xl border transition ${
                          m.isCompleted
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                        }`}
                        title={m.isCompleted ? 'Mark Incomplete' : 'Complete Milestone'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, m.progressPercentage)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${
                        m.isCompleted
                          ? 'bg-emerald-400'
                          : state === 'current'
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Goal Achieved Node */}
          <div className="flex items-center gap-4 sm:ml-4 pt-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg shrink-0 z-10 ${
                goal.currentProgressPercentage >= 100
                  ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-amber-500/20'
                  : 'bg-slate-800 border-2 border-slate-700 text-slate-500'
              }`}
            >
              <Trophy className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                goal.currentProgressPercentage >= 100 ? 'text-amber-400' : 'text-slate-500'
              }`}>
                Goal Mastered
              </span>
              <p className="text-slate-400">
                {goal.currentProgressPercentage >= 100
                  ? 'Congratulations! 100% Roadmap Achieved!'
                  : 'Complete all milestones to conquer this goal'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Milestone Detail Modal / Drawer */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      Milestone Details
                    </span>
                    <span className="text-xs text-slate-400">Weight: {selectedMilestone.weight}%</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedMilestone.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {selectedMilestone.description && (
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                    {selectedMilestone.description}
                  </p>
                )}

                {/* Quantitative Progress */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Milestone Progress:</span>
                    <span className="font-bold text-white">
                      {selectedMilestone.achievedQuantity} / {selectedMilestone.targetQuantity} {goal.measurementUnit} ({selectedMilestone.progressPercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400"
                      style={{ width: `${Math.min(100, selectedMilestone.progressPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone Required Tasks */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Linked Tasks for this Milestone</span>
                  </h4>
                  {getTasksForMilestone(selectedMilestone._id).length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-800/30 border border-slate-800">
                      No specific tasks linked to this milestone yet. Add daily or weekly tasks from the execution tabs.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {getTasksForMilestone(selectedMilestone._id).map((t) => (
                        <div
                          key={t._id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => toggleTaskMutation.mutate(t._id)}
                              className="text-slate-400 hover:text-emerald-400 transition"
                            >
                              {t.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            <span className={t.status === 'completed' ? 'text-emerald-300 line-through' : 'text-slate-200'}>
                              {t.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.estimatedMinutes}m
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Coaching Suggestion */}
                <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-800/40 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Roadmap Advice</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {selectedMilestone.isCompleted
                      ? `Great job! This milestone is completed and contributed +${selectedMilestone.weight}% to your goal.`
                      : `To advance "${selectedMilestone.title}", dedicate 2 focused blocks of 45 minutes this week and review key concepts.`}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2">
                {onAdjustPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMilestone(null);
                      onAdjustPlan();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Adjust Plan</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    toggleMilestoneMutation.mutate({
                      mId: selectedMilestone._id,
                      isCompleted: !selectedMilestone.isCompleted
                    });
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    selectedMilestone.isCompleted
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{selectedMilestone.isCompleted ? 'Mark as Incomplete' : 'Complete Milestone!'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
