import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import { X, FlaskConical, Target, Calendar, Clock, ArrowUpRight, Check } from 'lucide-react';

interface NewExperimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillRecommendation?: any;
}

export const NewExperimentModal: React.FC<NewExperimentModalProps> = ({
  isOpen,
  onClose,
  prefillRecommendation
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [targetBehavior, setTargetBehavior] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [metric, setMetric] = useState('task_completion_rate');
  const [desiredDirection, setDesiredDirection] = useState<'increase' | 'decrease'>('increase');
  const [personalTarget, setPersonalTarget] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (prefillRecommendation) {
      setTitle(prefillRecommendation.title || 'Targeted Workflow Trial');
      setObjective(prefillRecommendation.expected_benefit_hypothesis || prefillRecommendation.observed_issue || '');
      setTargetBehavior(prefillRecommendation.suggested_change || prefillRecommendation.suggested_target_behavior || '');
      setDurationDays(prefillRecommendation.suggested_experiment_days || 14);
    } else {
      setTitle('');
      setObjective('');
      setTargetBehavior('');
      setDurationDays(14);
      setPersonalTarget('');
      setNotes('');
    }
  }, [prefillRecommendation, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/experiments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments-list'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
      onClose();
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetBehavior.trim()) return;

    createMutation.mutate({
      title,
      hypothesis: objective || 'Testing practical impact of this workflow change.',
      targetBehavior,
      durationDays: Number(durationDays),
      metric,
      desiredDirection,
      personalTarget: personalTarget ? Number(personalTarget) : null,
      notes,
      linkedRecommendationId: prefillRecommendation?._id || prefillRecommendation?.id || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#111827] border border-[#263247] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#263247] flex items-center justify-between bg-[#161E2E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">Create Improvement Experiment</h3>
              <p className="text-xs text-[#94A3B8]">Test a controlled productivity change with before-and-after baseline tracking.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Experiment Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#F8FAFC]">Experiment Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Phone-Free 45-Minute Morning Focus Blocks"
              className="w-full px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Target Workflow Change */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#F8FAFC]">Specific Workflow Change (Target Behavior) *</label>
            <textarea
              required
              rows={2}
              value={targetBehavior}
              onChange={(e) => setTargetBehavior(e.target.value)}
              placeholder="What exact habit or rule will you follow daily?"
              className="w-full px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Objective / Hypothesis */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#F8FAFC]">Objective & Expected Benefit Hypothesis</label>
            <textarea
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Why are you trying this and what improvement do you expect?"
              className="w-full px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {/* Grid: Duration & Target Metric */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F8FAFC]">Duration</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
              >
                <option value={7}>7 Days Sprint</option>
                <option value={14}>14 Days (Recommended)</option>
                <option value={21}>21 Days Habit Cycle</option>
                <option value={30}>30 Days Full Month</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F8FAFC]">Target Metric</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
              >
                <option value="task_completion_rate">Task Completion Rate</option>
                <option value="focus_minutes">Focused Work Minutes</option>
                <option value="distracting_minutes">Distracting Screen Time</option>
                <option value="goal_progress_delta">Daily Milestone Velocity</option>
                <option value="habit_adherence">Habit Adherence Rate</option>
              </select>
            </div>
          </div>

          {/* Grid: Direction & Target Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F8FAFC]">Desired Direction</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDesiredDirection('increase')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    desiredDirection === 'increase'
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                      : 'bg-[#161E2E] border-[#263247] text-[#94A3B8]'
                  }`}
                >
                  Increase (↑)
                </button>
                <button
                  type="button"
                  onClick={() => setDesiredDirection('decrease')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    desiredDirection === 'decrease'
                      ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]'
                      : 'bg-[#161E2E] border-[#263247] text-[#94A3B8]'
                  }`}
                >
                  Decrease (↓)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#F8FAFC]">Personal Target (Optional)</label>
              <input
                type="number"
                value={personalTarget}
                onChange={(e) => setPersonalTarget(e.target.value)}
                placeholder="e.g., 85"
                className="w-full px-3.5 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] text-[11px] text-[#94A3B8]">
            <span className="font-semibold text-[#8B5CF6]">Baseline Calculation: </span>
            The system will automatically snapshot your performance from the preceding {durationDays} days to compare against your experiment results.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#263247]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#161E2E] hover:bg-[#1C2638] text-xs font-semibold text-[#94A3B8] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Creating...' : 'Launch Experiment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default NewExperimentModal;
