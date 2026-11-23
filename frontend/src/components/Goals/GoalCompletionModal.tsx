import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Goal, Milestone, Task } from '../../types';
import {
  Trophy,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  Printer,
  X,
  FileText
} from 'lucide-react';
import { api } from '../../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface GoalCompletionModalProps {
  goal: Goal;
  milestones: Milestone[];
  tasks?: Task[];
  isOpen: boolean;
  onClose: () => void;
  onCreateNextGoal?: () => void;
}

export const GoalCompletionModal: React.FC<GoalCompletionModalProps> = ({
  goal,
  milestones,
  tasks = [],
  isOpen,
  onClose,
  onCreateNextGoal
}) => {
  const queryClient = useQueryClient();
  const [reflection, setReflection] = useState(goal.reflectionNote || '');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: async (reflectionNote: string) => {
      const res = await api.post(`/goals/${goal._id}/complete`, { reflectionNote });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goal._id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setSavedMessage('Reflection recorded and goal archived successfully!');
      setTimeout(() => setSavedMessage(null), 3000);
    }
  });

  if (!isOpen) return null;

  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalFocusMinutes = tasks.reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

  const handleSaveReflection = () => {
    completeMutation.mutate(reflection);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trophy Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 p-0.5 shadow-2xl shadow-amber-500/20 mb-3 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
              </div>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Goal Mastered • 100% Roadmap Achieved
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 tracking-tight">
              {goal.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              You conquered every milestone along this learning journey. Here is your verified achievement record.
            </p>
          </div>

          {/* Verified Achievement Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 mb-6 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Milestones</span>
              <span className="text-xl font-bold text-emerald-400">
                {completedMilestones.length} / {milestones.length}
              </span>
              <p className="text-[10px] text-slate-500">100% Delivered</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tasks Done</span>
              <span className="text-xl font-bold text-cyan-400">
                {completedTasks.length}
              </span>
              <p className="text-[10px] text-slate-500">Execution Actions</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Focus Time</span>
              <span className="text-xl font-bold text-indigo-400">
                {Math.round(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m
              </span>
              <p className="text-[10px] text-slate-500">Dedicated Hours</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Completed</span>
              <span className="text-xs font-bold text-amber-300 mt-1 block">
                {new Date(goal.completedAt || Date.now()).toLocaleDateString()}
              </span>
              <p className="text-[10px] text-slate-500">Mastery Date</p>
            </div>
          </div>

          {/* Completed Roadmap Milestones Summary */}
          <div className="space-y-2 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conquered Roadmap Milestones</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {milestones.map((m, idx) => (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="font-semibold text-white">{m.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Weight: {m.weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Reflection Field */}
          <div className="space-y-2 mb-6">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Personal Reflection & Lessons Learned</span>
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              placeholder="What techniques helped you maintain consistency? What will you apply to your next goal?..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
            {savedMessage && (
              <p className="text-xs text-emerald-400 font-medium">{savedMessage}</p>
            )}
          </div>

          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Achievement Summary</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSaveReflection}
                disabled={completeMutation.isPending}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
              >
                {completeMutation.isPending ? 'Saving...' : 'Save Reflection'}
              </button>

              {onCreateNextGoal && (
                <button
                  onClick={() => {
                    onClose();
                    onCreateNextGoal();
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span>Start Next Goal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
