import React, { useState } from 'react';
import { api } from '../../api/client';
import { Modal } from '../UI/Modal';
import {
  Sparkles,
  Bot,
  Layers,
  Clock,
  Calendar,
  Check,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Sliders,
  ArrowRight
} from 'lucide-react';

export type AIPlanBuilderMode = 'create_goal' | 'populate_slots' | 'adjust_plan';

interface AIPlanBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: AIPlanBuilderMode;
  goalId?: string;
  initialTitle?: string;
  category?: string;
  existingSlotCount?: number;
  onPlanApproved: (result: any) => void;
}

export const AIPlanBuilder: React.FC<AIPlanBuilderProps> = ({
  isOpen,
  onClose,
  mode = 'create_goal',
  goalId,
  initialTitle = '',
  category = 'Programming',
  existingSlotCount = 10,
  onPlanApproved
}) => {
  const [promptTitle, setPromptTitle] = useState(initialTitle);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [targetOutcome, setTargetOutcome] = useState('');
  const [dailyHours, setDailyHours] = useState(2);
  const [targetDurationWeeks, setTargetDurationWeeks] = useState(12);
  const [slotCount, setSlotCount] = useState(existingSlotCount);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTitle.trim()) {
      setErrorMsg('Goal ambition or topic title is required.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      if (mode === 'create_goal') {
        const res = await api.post('/ai/plan-goal', {
          title: promptTitle.trim(),
          category,
          level,
          targetOutcome: targetOutcome.trim(),
          hoursPerDay: Number(dailyHours),
          targetWeeks: Number(targetDurationWeeks),
          milestoneCount: Number(slotCount)
        });
        setGeneratedPlan(res.data.plan);
      } else if (mode === 'populate_slots') {
        const res = await api.post('/ai/generate-milestones', {
          goalTitle: promptTitle.trim(),
          category,
          count: Number(slotCount),
          experienceLevel: level
        });
        setGeneratedPlan({
          title: promptTitle.trim(),
          description: `AI-structured roadmap for ${promptTitle.trim()}`,
          modules: res.data.milestones || []
        });
      } else if (mode === 'adjust_plan') {
        const res = await api.post('/ai/adjust-plan', {
          goalId,
          userPacingIssue: targetOutcome || 'Rebalance pacing and generate optimized daily modules'
        });
        setGeneratedPlan(res.data.adjustmentPlan);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'AI planning generation failed. Using template roadmap fallback.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!generatedPlan) return;
    setIsApplying(true);
    setErrorMsg(null);

    try {
      if (mode === 'create_goal') {
        const res = await api.post('/ai/save-approved-goal', {
          plan: generatedPlan,
          folder: 'General'
        });
        onPlanApproved(res.data);
      } else if (mode === 'populate_slots' && goalId) {
        // Bulk import generated modules to existing goal slots
        const res = await api.post(`/goals/${goalId}/milestones/import`, {
          modules: (generatedPlan.modules || []).map((m: any, idx: number) => ({
            title: m.title || `Module ${String(idx + 1).padStart(2, '0')}`,
            description: m.description || '',
            estimatedEffort: m.estimatedEffort || '45 mins'
          }))
        });
        onPlanApproved(res.data);
      } else if (mode === 'adjust_plan' && goalId) {
        const res = await api.post('/ai/apply-plan-adjustment', {
          goalId,
          adjustmentPlan: generatedPlan
        });
        onPlanApproved(res.data);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save approved plan.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'create_goal'
          ? 'AI Goal Roadmap Architect'
          : mode === 'populate_slots'
          ? `Generate Topics for ${slotCount} Module Slots`
          : 'AI Cadence & Plan Rebalancing'
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-xs text-gray-300">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs (when plan is not yet generated or user wants to re-prompt) */}
        {!generatedPlan ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-300 mb-1">
                {mode === 'adjust_plan' ? 'What challenges are you experiencing with your schedule?' : 'What would you like to achieve?'} <span className="text-purple-400">*</span>
              </label>
              <input
                type="text"
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder={
                  mode === 'adjust_plan'
                    ? 'e.g. Falling behind on DP modules, need lighter daily study sessions'
                    : 'e.g. Master Full-Stack MERN Development & Technical Interview Prep'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Experience Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="beginner">Beginner / New to Topic</option>
                  <option value="intermediate">Intermediate / Some Practice</option>
                  <option value="advanced">Advanced / Polish & Mock Tests</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Available Daily Study</label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value={1}>1 hour per day</option>
                  <option value={2}>2 hours per day</option>
                  <option value={3}>3 hours per day</option>
                  <option value={4}>4+ hours per day</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Target Number of Modules</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={slotCount}
                  onChange={(e) => setSlotCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">Specific Target Outcome (Optional)</label>
              <textarea
                value={targetOutcome}
                onChange={(e) => setTargetOutcome(e.target.value)}
                rows={2}
                placeholder="e.g. Build 2 production-ready portfolio apps and solve top 100 interview problems"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition border border-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !promptTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Structuring Roadmap...' : 'Generate Roadmap'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Editable Plan Preview & Explicit Approval */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Generated Plan Preview
              </span>
              <h3 className="text-base font-extrabold text-white">
                {generatedPlan.title || promptTitle}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                {generatedPlan.description || 'Structured sequentially into digestible modules with estimated durations.'}
              </p>
            </div>

            {/* Generated Modules List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(generatedPlan.modules || generatedPlan.milestones || []).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-white truncate">{m.title}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-mono shrink-0">
                    {m.estimatedEffort || '45 mins'}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions: Re-prompt vs Explicitly Approve */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setGeneratedPlan(null)}
                className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition flex items-center gap-1.5 border border-gray-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate with New Prompt</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition border border-gray-800"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApproveAndSave}
                  disabled={isApplying}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isApplying ? 'Applying Roadmap...' : 'Approve & Save to Workspace'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
