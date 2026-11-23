import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { GoalFolder } from '../../types';
import { api } from '../../api/client';
import {
  Target,
  Sparkles,
  Layers,
  Calendar,
  Hash,
  CheckSquare,
  Image as ImageIcon,
  Folder,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  Cpu
} from 'lucide-react';

interface GoalCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  folders: GoalFolder[];
  activeFolderId?: string;
  onGoalCreated: () => void;
}

const CATEGORIES = [
  'DSA & Coding',
  'Web Development',
  'System Design',
  'Academic Coursework',
  'Research / Minor Project',
  'Competitive Exam',
  'Other'
];

const PRESET_COVERS = [
  { label: 'DSA & Coding', url: 'https://images.unsplash.com/photo-1516116211227-bbc86bd7a4fa?w=800&auto=format&fit=crop&q=60' },
  { label: 'Web Development', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=60' },
  { label: 'System Design', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=60' },
  { label: 'AI & Data Science', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60' },
  { label: 'Academic Coursework', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60' },
  { label: 'Focus & Productivity', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=60' }
];

export const GoalCreationWizard: React.FC<GoalCreationWizardProps> = ({
  isOpen,
  onClose,
  folders,
  activeFolderId,
  onGoalCreated
}) => {
  // Wizard Steps: 1: Basics, 2: Progress Method & Milestones, 3: Cadence & Media
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DSA & Coding');
  const [folderId, setFolderId] = useState<string>(activeFolderId || '');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');

  // Tracking Method
  const [progressType, setProgressType] = useState<'milestone_based' | 'numerical' | 'checklist'>('milestone_based');
  const [moduleCount, setModuleCount] = useState<number>(30);
  const [measurementUnit, setMeasurementUnit] = useState('Modules');
  const [targetQuantity, setTargetQuantity] = useState(100);

  // AI Generation
  const [useAISyllabus, setUseAISyllabus] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedMilestones, setGeneratedMilestones] = useState<any[]>([]);

  // Media
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState<'presets' | 'url'>('presets');

  // Cadence Tasks & Yearly Targets
  const [dailyTasks, setDailyTasks] = useState<string[]>([]);
  const [newDailyTask, setNewDailyTask] = useState('');
  const [weeklyTasks, setWeeklyTasks] = useState<string[]>([]);
  const [newWeeklyTask, setNewWeeklyTask] = useState('');
  const [monthlyTasks, setMonthlyTasks] = useState<string[]>([]);
  const [newMonthlyTask, setNewMonthlyTask] = useState('');
  const [yearlyTargets, setYearlyTargets] = useState<Array<{ target: string; targetDate?: string }>>([]);
  const [newYearlyTarget, setNewYearlyTarget] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger AI generation if user toggles it
  const handleGenerateAISyllabus = async () => {
    if (!title.trim()) {
      setError('Please provide a goal title first to generate AI syllabus');
      return;
    }
    try {
      setIsGeneratingAI(true);
      setError(null);
      const res = await api.post('/ai/generate-milestones', {
        goalTitle: title.trim(),
        count: Number(moduleCount || 10),
        category
      });
      if (res.data?.milestones) {
        setGeneratedMilestones(res.data.milestones);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate AI syllabus');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Goal title is required');
      setStep(1);
      return;
    }
    if (!targetDate) {
      setError('Target date is required');
      setStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: any = {
        title: title.trim(),
        description: description.trim(),
        category,
        folderId: folderId || null,
        startDate: new Date(startDate),
        targetDate: new Date(targetDate),
        priority,
        progressType,
        imageUrl,
        dailyTasks,
        weeklyTasks,
        monthlyTasks,
        yearlyTargets
      };

      if (progressType === 'milestone_based') {
        payload.measurementUnit = measurementUnit || 'Modules';
        payload.moduleCount = Number(moduleCount || 30);
        payload.milestoneCount = Number(moduleCount || 30);
        payload.targetQuantity = Number(moduleCount || 30);
        if (useAISyllabus && generatedMilestones.length > 0) {
          payload.milestones = generatedMilestones;
        }
      } else if (progressType === 'numerical') {
        payload.measurementUnit = measurementUnit || 'Problems';
        payload.targetQuantity = Number(targetQuantity || 100);
      } else {
        payload.measurementUnit = 'Items';
      }

      await api.post('/goals', payload);
      onGoalCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Goal Workspace">
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                step === 1 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>1</span> Basics
            </button>
            <span className="text-gray-600">/</span>
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                step === 2 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>2</span> Tracking & Milestones
            </button>
            <span className="text-gray-600">/</span>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                step === 3 ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>3</span> Cover & Cadence
            </button>
          </div>
          <span className="text-xs text-gray-400">Step {step} of 3</span>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Java Data Structures & Algorithms, Complete MERN Portfolio"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Description / Desired Outcome
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will success look like when this goal is conquered?"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Folder
                </label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">General (Default)</option>
                  {folders.map((f) => (
                    <option key={f._id} value={f._id}>
                      📁 {f.name} {f.parentFolderId ? '(Subfolder)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: TRACKING METHOD & MILESTONES */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Progress Tracking Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setProgressType('milestone_based');
                    setMeasurementUnit('Modules');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    progressType === 'milestone_based'
                      ? 'bg-purple-900/40 border-purple-500 text-purple-200 ring-1 ring-purple-500'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-white">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Milestone / Modules</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Automatically generate $N$ sequential module slots (e.g. 30 submodules).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProgressType('numerical');
                    setMeasurementUnit('Problems');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    progressType === 'numerical'
                      ? 'bg-blue-900/40 border-blue-500 text-blue-200 ring-1 ring-blue-500'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-white">
                    <Hash className="w-4 h-4 text-blue-400" />
                    <span>Numerical Target</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Track incremental count (e.g. 84 / 200 DSA problems solved).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProgressType('checklist');
                    setMeasurementUnit('Items');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    progressType === 'checklist'
                      ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-white">
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                    <span>Checklist Roadmap</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Custom deliverables without a fixed slot count.
                  </p>
                </button>
              </div>
            </div>

            {/* MILESTONE-BASED CONFIGURATION */}
            {progressType === 'milestone_based' && (
              <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Number of Modules / Milestones
                    </div>
                    <div className="text-xs text-gray-400">
                      System will automatically create exactly this number of milestone slots.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={150}
                      value={moduleCount}
                      onChange={(e) => setModuleCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-1.5 bg-gray-950 border border-gray-700 rounded-lg text-sm text-white font-bold text-center focus:border-purple-500"
                    />
                    <span className="text-xs text-gray-400 font-medium">Slots</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Quick set:</span>
                  {[5, 10, 20, 30, 50, 60, 100].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setModuleCount(num)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                        moduleCount === num
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {num} Modules
                    </button>
                  ))}
                </div>

                {/* Slot Preview Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Auto-Generated Milestone Slots Preview ({moduleCount} total)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseAISyllabus(!useAISyllabus);
                        if (!useAISyllabus && generatedMilestones.length === 0) {
                          handleGenerateAISyllabus();
                        }
                      }}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                        useAISyllabus
                          ? 'bg-purple-900/40 border-purple-500 text-purple-300'
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>{useAISyllabus ? 'AI Syllabus Enabled' : 'Populate with AI Topics'}</span>
                    </button>
                  </div>

                  {isGeneratingAI ? (
                    <div className="p-4 text-center text-xs text-purple-300 bg-purple-950/20 border border-purple-800/40 rounded-lg flex items-center justify-center gap-2">
                      <Cpu className="w-4 h-4 animate-spin text-purple-400" />
                      <span>Architecting {moduleCount} structured learning modules with AI...</span>
                    </div>
                  ) : useAISyllabus && generatedMilestones.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {generatedMilestones.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-gray-950/70 border border-gray-800 rounded-lg flex items-start gap-2.5 text-xs"
                        >
                          <span className="font-mono px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-bold flex-shrink-0">
                            #{String(idx + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-200 truncate">{m.title}</div>
                            <div className="text-gray-400 line-clamp-1">{m.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-1.5 p-2 bg-gray-950/50 border border-gray-800 rounded-lg">
                      {Array.from({ length: Math.min(100, moduleCount) }).map((_, i) => (
                        <div
                          key={i}
                          className="px-2 py-1.5 bg-gray-900 border border-gray-800 rounded text-center text-xs text-gray-300 font-mono"
                        >
                          Mod {String(i + 1).padStart(2, '0')}
                        </div>
                      ))}
                      {moduleCount > 100 && (
                        <div className="px-2 py-1.5 bg-gray-900 text-center text-xs text-gray-500 font-mono">
                          +{moduleCount - 100} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NUMERICAL CONFIGURATION */}
            {progressType === 'numerical' && (
              <div className="p-4 bg-gray-900/80 border border-gray-800 rounded-xl space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      Measurement Unit
                    </label>
                    <input
                      type="text"
                      value={measurementUnit}
                      onChange={(e) => setMeasurementUnit(e.target.value)}
                      placeholder="e.g. Problems, Chapters, Hours, Pages"
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      Target Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={targetQuantity}
                      onChange={(e) => setTargetQuantity(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: COVER & CADENCE */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Cover Image */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Cover Image (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PRESET_COVERS.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative rounded-lg overflow-hidden border-2 h-16 transition-all ${
                      imageUrl === preset.url ? 'border-purple-500 scale-[1.02]' : 'border-transparent hover:border-gray-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-1">
                      <span className="text-[10px] font-semibold text-white text-center leading-tight">
                        {preset.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste custom image URL..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Daily & Weekly Cadence Tasks */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Cadence Tasks & Commitments
              </label>

              {/* Daily Task input */}
              <div>
                <div className="text-xs text-gray-400 mb-1 font-medium">Daily Recurring Tasks:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDailyTask}
                    onChange={(e) => setNewDailyTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newDailyTask.trim()) {
                          setDailyTasks([...dailyTasks, newDailyTask.trim()]);
                          setNewDailyTask('');
                        }
                      }
                    }}
                    placeholder="e.g. Solve 2 LeetCode problems every morning..."
                    className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-100 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newDailyTask.trim()) {
                        setDailyTasks([...dailyTasks, newDailyTask.trim()]);
                        setNewDailyTask('');
                      }
                    }}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium rounded-lg"
                  >
                    Add
                  </button>
                </div>
                {dailyTasks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {dailyTasks.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/40 text-[11px] text-blue-300"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => setDailyTasks(dailyTasks.filter((_, i) => i !== idx))}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    setError('Goal title is required');
                    return;
                  }
                  setError(null);
                  setStep((step + 1) as any);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/30"
              >
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Creating Goal...' : 'Launch Goal Workspace'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
