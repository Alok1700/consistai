import React, { useState } from 'react';
import { Goal, GoalFolder } from '../../types';
import {
  Target,
  Layers,
  Hash,
  CheckSquare,
  Calendar,
  Folder,
  Sliders,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Clock,
  Palette,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface GoalFormProps {
  initialGoal?: Partial<Goal>;
  folders: GoalFolder[];
  activeFolderId?: string;
  isEditing?: boolean;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  onOpenAIBuilder?: () => void;
}

export const GoalForm: React.FC<GoalFormProps> = ({
  initialGoal,
  folders,
  activeFolderId,
  isEditing = false,
  onSubmit,
  onCancel,
  onOpenAIBuilder
}) => {
  // Step 1: Goal Information
  const [title, setTitle] = useState(initialGoal?.title || '');
  const [description, setDescription] = useState(initialGoal?.description || '');
  const [folderId, setFolderId] = useState(initialGoal?.folderId ? (typeof initialGoal.folderId === 'object' ? (initialGoal.folderId as any)._id : initialGoal.folderId) : activeFolderId || '');
  const [category, setCategory] = useState(initialGoal?.category || 'Programming');
  const [startDate, setStartDate] = useState(
    initialGoal?.startDate ? new Date(initialGoal.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [targetDate, setTargetDate] = useState(
    initialGoal?.targetDate
      ? new Date(initialGoal.targetDate).toISOString().slice(0, 10)
      : new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [priority, setPriority] = useState(initialGoal?.priority || 'medium');

  // Step 2: Tracking Method: 'milestone_based' (Modules) | 'numerical' | 'checklist'
  const [progressType, setProgressType] = useState<'milestone_based' | 'numerical' | 'checklist'>(
    initialGoal?.progressType || 'milestone_based'
  );

  // Option A: Modules & Milestone Drafts Fields
  const [milestoneDrafts, setMilestoneDrafts] = useState<Array<{
    id: string;
    name: string;
    description: string;
    moduleCount: number;
    weight: number;
    startDate: string;
    deadline: string;
    generationMethod: 'empty' | 'paste' | 'ai';
    moduleNames: string;
  }>>([
    {
      id: '1',
      name: 'Milestone 1: Foundations & Concepts',
      description: '',
      moduleCount: 30,
      weight: 1,
      startDate: '',
      deadline: '',
      generationMethod: 'empty',
      moduleNames: ''
    }
  ]);

  const addMilestoneDraft = () => {
    const nextIdx = milestoneDrafts.length + 1;
    setMilestoneDrafts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: `Milestone ${nextIdx}: Advanced Topics`,
        description: '',
        moduleCount: 20,
        weight: 1,
        startDate: '',
        deadline: '',
        generationMethod: 'empty',
        moduleNames: ''
      }
    ]);
  };

  const removeMilestoneDraft = (id: string) => {
    if (milestoneDrafts.length <= 1) return;
    setMilestoneDrafts((prev) => prev.filter((m) => m.id !== id));
  };

  const updateMilestoneDraft = (id: string, field: string, val: any) => {
    setMilestoneDrafts((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  const [moduleCount, setModuleCount] = useState(initialGoal?.moduleCount || initialGoal?.milestoneCount || 10);
  const [moduleCreationMethod, setModuleCreationMethod] = useState<'empty' | 'syllabus' | 'ai'>('empty');
  const [pastedSyllabus, setPastedSyllabus] = useState('');
  const [defaultEffort, setDefaultEffort] = useState('45 mins');

  // Option B: Numerical Fields
  const [targetQuantity, setTargetQuantity] = useState(initialGoal?.targetQuantity || 100);
  const [measurementUnit, setMeasurementUnit] = useState(initialGoal?.measurementUnit || 'Problems');
  const [startingQuantity, setStartingQuantity] = useState(initialGoal?.achievedQuantity || 0);

  // Option C: Checklist Fields
  const [checklistItems, setChecklistItems] = useState<Array<{ title: string; description?: string }>>(
    (initialGoal?.milestones || []).map((m) => ({ title: m.title, description: m.description })) || [
      { title: 'Project Initialization & Scope' },
      { title: 'Core Implementation & Testing' }
    ]
  );
  const [newChecklistTitle, setNewChecklistTitle] = useState('');

  // Step 3: Collapsible Advanced Planning
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [preferredDays, setPreferredDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [availableDailyMinutes, setAvailableDailyMinutes] = useState(60);
  const [color, setColor] = useState(initialGoal?.color || '#7C3AED');
  const [imageUrl, setImageUrl] = useState(initialGoal?.imageUrl || '');
  const [dailyCommitment, setDailyCommitment] = useState('');
  const [weeklyCommitment, setWeeklyCommitment] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddChecklistItem = () => {
    if (!newChecklistTitle.trim()) return;
    setChecklistItems([...checklistItems, { title: newChecklistTitle.trim() }]);
    setNewChecklistTitle('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Goal title is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Find folder name if folderId selected
      const selectedFolderDoc = folders.find((f) => f._id === folderId);
      const folderName = selectedFolderDoc ? selectedFolderDoc.name : 'General';

      let milestonesPayload: any[] | undefined = undefined;

      if (progressType === 'milestone_based') {
        milestonesPayload = milestoneDrafts
          .filter((m) => m.name.trim().length > 0)
          .map((m, idx) => ({
            name: m.name.trim(),
            title: m.name.trim(),
            description: m.description.trim(),
            moduleCount: Math.max(0, Number(m.moduleCount) || 10),
            weight: Math.max(0.1, Number(m.weight) || 1.0),
            startDate: m.startDate || undefined,
            targetDate: m.deadline || undefined,
            deadline: m.deadline || undefined,
            moduleNames: m.generationMethod === 'paste' ? m.moduleNames : undefined,
            order: idx + 1,
            sequenceNumber: idx + 1
          }));
      } else if (progressType === 'checklist') {
        milestonesPayload = checklistItems.map((item, idx) => ({
          title: item.title,
          description: item.description || '',
          order: idx + 1,
          sequenceNumber: idx + 1,
          weight: 1.0,
          targetQuantity: 1,
          status: 'not_started'
        }));
      }

      const totalModulesCalculated = progressType === 'milestone_based'
        ? milestoneDrafts.reduce((acc, m) => acc + (Number(m.moduleCount) || 0), 0)
        : (progressType === 'checklist' ? checklistItems.length : 0);

      const dailyTasksPayload = dailyCommitment.trim() ? [{ title: dailyCommitment.trim() }] : undefined;
      const weeklyTasksPayload = weeklyCommitment.trim() ? [{ title: weeklyCommitment.trim() }] : undefined;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        folder: folderName,
        folderId: folderId || null,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
        priority,
        progressType,
        moduleCount: totalModulesCalculated,
        milestoneCount: progressType === 'milestone_based' ? milestoneDrafts.length : checklistItems.length,
        targetQuantity: progressType === 'numerical' ? Number(targetQuantity) : totalModulesCalculated,
        achievedQuantity: progressType === 'numerical' ? Number(startingQuantity) : 0,
        measurementUnit: progressType === 'numerical' ? measurementUnit : 'Modules',
        color,
        imageUrl: imageUrl.trim() || undefined,
        scheduleSettings: {
          preferredWorkingDays: preferredDays,
          dailyAvailableMinutes: Number(availableDailyMinutes)
        },
        dailyTasks: dailyTasksPayload,
        weeklyTasks: weeklyTasksPayload,
        milestones: milestonesPayload
      };

      await onSubmit(payload);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save goal.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs text-gray-300">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* STEP 1: GOAL INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
          <Target className="w-4 h-4 text-purple-400" />
          <span>Step 1: Goal Information</span>
        </h3>

        <div>
          <label className="block font-semibold text-gray-300 mb-1">
            Goal Title <span className="text-purple-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master 100 Days of Data Structures & Algorithms"
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500 font-semibold"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-gray-300 mb-1">Parent Folder</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="">General (Default)</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="Programming">Programming & DSA</option>
              <option value="Academics">Academics & Coursework</option>
              <option value="Career">Career & Placement Prep</option>
              <option value="Research">Research / Minor Project</option>
              <option value="Competitive Exam">Competitive Exam</option>
              <option value="Personal Growth">Personal Growth</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1">Target Deadline</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-300 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-300 mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Briefly describe what achievement success looks like..."
            className="w-full px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* STEP 2: TRACK YOUR PROGRESS */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Step 2: Choose Progress Tracking Method</span>
        </h3>

        {/* 3 Tracking Method Choice Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setProgressType('milestone_based')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              progressType === 'milestone_based'
                ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-950/30'
                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>A. Modules</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Complete a course, syllabus, roadmap or project in sequential chapters.
            </p>
          </div>

          <div
            onClick={() => setProgressType('numerical')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              progressType === 'numerical'
                ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-950/30'
                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span>B. Numerical</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Achieve a measurable quantity (e.g. 200 coding problems, 100 study hours).
            </p>
          </div>

          <div
            onClick={() => setProgressType('checklist')}
            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
              progressType === 'checklist'
                ? 'bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-950/30'
                : 'bg-gray-950/60 border-gray-800 text-gray-400 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>C. Checklist</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Complete a flexible checklist of milestones without fixed module slots.
            </p>
          </div>
        </div>

        {/* Dynamic Fields for Option A: Milestone-Based Module Checklist Hierarchy */}
        {progressType === 'milestone_based' && (
          <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-gray-200">
                  Goal Milestones & Modules
                </label>
                <p className="text-[11px] text-gray-400">
                  Define milestones. Each milestone will contain its own independently trackable modules.
                </p>
              </div>
              <button
                type="button"
                onClick={addMilestoneDraft}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            {/* List of Milestones */}
            <div className="space-y-3.5">
              {milestoneDrafts.map((ms, index) => (
                <div
                  key={ms.id}
                  className="p-3.5 rounded-xl bg-gray-900 border border-gray-800 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-5 h-5 rounded-full bg-purple-900/60 text-purple-300 font-mono text-xs flex items-center justify-center font-bold shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={ms.name}
                        onChange={(e) => updateMilestoneDraft(ms.id, 'name', e.target.value)}
                        placeholder={`e.g. Milestone ${index + 1}: Arrays & Sliding Window`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    {milestoneDrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestoneDraft(ms.id)}
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition shrink-0"
                        title="Remove this milestone"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Grid of parameters: Number of Modules, Weight, Start Date, Target Date */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Number of Modules <span className="text-purple-400">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={ms.moduleCount}
                        onChange={(e) => updateMilestoneDraft(ms.id, 'moduleCount', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Weight (Multiplier)
                      </label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={ms.weight}
                        onChange={(e) => updateMilestoneDraft(ms.id, 'weight', Number(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Start Date (Opt)
                      </label>
                      <input
                        type="date"
                        value={ms.startDate}
                        onChange={(e) => updateMilestoneDraft(ms.id, 'startDate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                        Deadline (Opt)
                      </label>
                      <input
                        type="date"
                        value={ms.deadline}
                        onChange={(e) => updateMilestoneDraft(ms.id, 'deadline', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Generation Method */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateMilestoneDraft(ms.id, 'generationMethod', 'empty')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          ms.generationMethod === 'empty'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        Empty Slots ({ms.moduleCount} slots)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateMilestoneDraft(ms.id, 'generationMethod', 'paste')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          ms.generationMethod === 'paste'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        Paste Module Names
                      </button>
                    </div>

                    {ms.generationMethod === 'paste' && (
                      <div className="mt-2">
                        <textarea
                          rows={3}
                          value={ms.moduleNames}
                          onChange={(e) => updateMilestoneDraft(ms.id, 'moduleNames', e.target.value)}
                          placeholder={`Two Sum\nPrefix Sums\nKadane's Algorithm\nSliding Window`}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-700 text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total count summary */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-800">
              <span>{milestoneDrafts.length} milestone{milestoneDrafts.length !== 1 ? 's' : ''} defined</span>
              <span className="font-semibold text-purple-300">
                Total Modules: {milestoneDrafts.reduce((acc, m) => acc + (Number(m.moduleCount) || 0), 0)}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Fields for Option B: Numerical */}
        {progressType === 'numerical' && (
          <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-300 mb-1">Target Quantity</label>
              <input
                type="number"
                min={1}
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs font-mono font-bold focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">Measurement Unit</label>
              <input
                type="text"
                value={measurementUnit}
                onChange={(e) => setMeasurementUnit(e.target.value)}
                placeholder="Problems, Hours, Books, Pages"
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-300 mb-1">Starting Quantity</label>
              <input
                type="number"
                min={0}
                value={startingQuantity}
                onChange={(e) => setStartingQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        )}

        {/* Dynamic Fields for Option C: Checklist */}
        {progressType === 'checklist' && (
          <div className="p-4 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Add checklist milestone..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Add Item
              </button>
            </div>

            <div className="space-y-1.5">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-gray-900 border border-gray-800 text-xs"
                >
                  <span className="text-gray-200">
                    <strong className="text-purple-400 mr-2">#{idx + 1}</strong>
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-gray-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: OPTIONAL ADVANCED PLANNING */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showAdvanced ? 'Hide Advanced Planning' : 'Show Advanced Planning (Commitments & Color)'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 p-4 rounded-2xl bg-gray-950/60 border border-gray-800 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Daily Commitment Task</label>
                <input
                  type="text"
                  value={dailyCommitment}
                  onChange={(e) => setDailyCommitment(e.target.value)}
                  placeholder="e.g. Solve 2 LeetCode Mediums"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Weekly Commitment Target</label>
                <input
                  type="text"
                  value={weeklyCommitment}
                  onChange={(e) => setWeeklyCommitment(e.target.value)}
                  placeholder="e.g. Complete 1 Weekly Mock Contest"
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Goal Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <span className="font-mono text-xs text-gray-400">{color}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-300 text-xs font-semibold transition border border-gray-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
};
