import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';
import { X, Layers, ListOrdered, FileText, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface CreateMilestoneModalProps {
  goalId: string;
  goalTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  goalId,
  goalTitle,
  isOpen,
  onClose,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [namingMode, setNamingMode] = useState<'numbered' | 'custom'>('custom');
  const [moduleCount, setModuleCount] = useState(10);
  const [customModuleNames, setCustomModuleNames] = useState('');
  const [weight, setWeight] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiModuleCount, setAiModuleCount] = useState<number>(8);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);

  const parsedCustomNames = customModuleNames
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const effectiveModuleCount = namingMode === 'custom'
    ? parsedCustomNames.length
    : Number(moduleCount) || 0;

  const generateAIModulesMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/generate-milestone-modules', {
        goalId,
        goalTitle,
        milestoneTitle: title.trim(),
        description: description.trim(),
        count: aiModuleCount
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.modules && Array.isArray(data.modules)) {
        setNamingMode('custom');
        setCustomModuleNames(data.modules.join('\n'));
        setAiSuccessMsg(`Generated ${data.modules.length} modules tailored to "${title.trim()}". You can review, edit, or reorder below.`);
        setErrorMsg(null);
      }
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to generate modules with AI.');
    }
  });

  const handleGenerateWithAI = () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a Milestone Title first (e.g. "Sliding Window & Substring Problems") so AI knows what modules to generate.');
      return;
    }
    setErrorMsg(null);
    setAiSuccessMsg(null);
    generateAIModulesMutation.mutate();
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        weight: Number(weight) || 1,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined
      };

      if (namingMode === 'custom' && parsedCustomNames.length > 0) {
        payload.moduleNames = parsedCustomNames;
        payload.moduleCount = parsedCustomNames.length;
      } else {
        payload.moduleCount = Number(moduleCount) || 10;
      }

      const res = await api.post(`/goals/${goalId}/goal-milestones`, payload);
      return res.data;
    },
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setNamingMode('custom');
      setModuleCount(10);
      setCustomModuleNames('');
      setWeight(1);
      setStartDate('');
      setTargetDate('');
      setErrorMsg(null);
      setAiSuccessMsg(null);
      onCreated();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create milestone.');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Milestone title is required.');
      return;
    }
    if (namingMode === 'custom' && parsedCustomNames.length === 0 && Number(moduleCount) <= 0) {
      setErrorMsg('Please enter at least one module name or switch to numbered slots.');
      return;
    }
    setErrorMsg(null);
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-bold text-slate-100">New Milestone</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Milestone Title <span className="text-violet-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Arrays & Sliding Window"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Briefly describe what this milestone covers..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* AI Module Generator Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-950/70 via-purple-950/40 to-slate-900 border border-violet-700/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-600/30 text-violet-300">
                  <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Generate Modules with AI</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Local Ollama
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Auto-break this milestone into sequential, actionable learning units
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Module Count Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Count:</span>
                {[4, 6, 8, 10, 12].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setAiModuleCount(cnt)}
                    className={`px-2 py-0.5 text-xs rounded-md font-mono transition ${
                      aiModuleCount === cnt
                        ? 'bg-violet-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={generateAIModulesMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-violet-500/20 transition disabled:opacity-50"
              >
                {generateAIModulesMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Now</span>
                  </>
                )}
              </button>
            </div>

            {aiSuccessMsg && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span className="flex-1">{aiSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Module Naming Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Module Setup & Naming
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setNamingMode('custom')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  namingMode === 'custom'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Name Modules Now</span>
              </button>
              <button
                type="button"
                onClick={() => setNamingMode('numbered')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  namingMode === 'numbered'
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Numbered Slots</span>
              </button>
            </div>
          </div>

          {/* Conditional: Custom Names or Numbered Slots */}
          {namingMode === 'custom' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  Enter or paste module names (one per line)
                </span>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={generateAIModulesMutation.isPending}
                    className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-medium transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{generateAIModulesMutation.isPending ? 'Generating...' : 'Regenerate'}</span>
                  </button>
                  <span className="text-violet-400 font-mono font-semibold">
                    {parsedCustomNames.length} {parsedCustomNames.length === 1 ? 'module' : 'modules'} detected
                  </span>
                </div>
              </div>
              <textarea
                value={customModuleNames}
                onChange={(e) => setCustomModuleNames(e.target.value)}
                rows={6}
                placeholder={`Module 01: Two Sum & Hash Lookup\nModule 02: Prefix Sum Basics\nModule 03: Subarray Sum Equals K\nModule 04: Two Pointers: Sorted Pair\nModule 05: Container With Most Water`}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-violet-500 leading-relaxed"
              />
              <p className="text-[11px] text-slate-400">
                Tip: You can paste your curriculum or syllabus. Each non-empty line becomes a trackable module. You can also rename or reorder them at any time later.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Number of Empty Module Slots
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={moduleCount}
                  onChange={(e) => setModuleCount(Math.max(1, Number(e.target.value)))}
                  className="w-32 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-violet-500"
                />
                <span className="text-xs text-slate-400">
                  Will create Module 01, Module 02 ... Module {String(moduleCount).padStart(2, '0')} (renameable anytime)
                </span>
              </div>
            </div>
          )}

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Milestone Weight
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-32 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-violet-500"
              />
              <span className="text-xs text-slate-400">
                Relative weight toward overall goal completion (default 1.0)
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Date (Optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-medium">
              {effectiveModuleCount > 0 ? `${effectiveModuleCount} modules will be created` : 'No modules specified'}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !title.trim()}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Milestone'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
