import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milestone, Task } from '../../types';
import { api } from '../../api/client';
import { useTimerStore } from '../../store/timerStore';
import {
  X,
  CheckCircle2,
  Circle,
  PlayCircle,
  SkipForward,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  FileText,
  Sparkles,
  Bot,
  Check,
  Save,
  Clock,
  AlertCircle,
  Timer,
  Eye,
  Edit3,
  Video,
  FileCode,
  Link as LinkIcon
} from 'lucide-react';

interface MilestoneDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  goalId: string;
  onMilestoneUpdated: () => void;
}

export const MilestoneDetailDrawer: React.FC<MilestoneDetailDrawerProps> = ({
  isOpen,
  onClose,
  milestone,
  goalId,
  onMilestoneUpdated
}) => {
  const navigate = useNavigate();
  const { startTimer, isRunning } = useTimerStore();

  if (!isOpen || !milestone) return null;

  // Local state
  const [status, setStatus] = useState<string>(
    milestone.status || (milestone.isCompleted ? 'completed' : 'not_started')
  );
  const [skipReason, setSkipReason] = useState<string>(milestone.skipReason || '');
  const [notes, setNotes] = useState<string>(milestone.notes || '');
  const [notesPreviewMode, setNotesPreviewMode] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  // Subtask creation
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newSubtaskMinutes, setNewSubtaskMinutes] = useState(45);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Resource creation
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'doc' | 'video' | 'article' | 'pdf' | 'practice'>('doc');
  const [isAddingResource, setIsAddingResource] = useState(false);

  // AI Assistance
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Focus Session Trigger
  const [timerStarted, setTimerStarted] = useState(false);

  // Local tasks list
  const [tasks, setTasks] = useState<Task[]>(milestone.tasks || []);

  useEffect(() => {
    setStatus(milestone.status || (milestone.isCompleted ? 'completed' : 'not_started'));
    setSkipReason(milestone.skipReason || '');
    setNotes(milestone.notes || '');
    setTasks(milestone.tasks || []);
    setAiAnswer(null);
    setTimerStarted(false);
  }, [milestone]);

  // Handle Escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Status Change Handler
  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    try {
      await api.patch(`/milestones/${milestone._id}/status`, {
        status: newStatus,
        skipReason: newStatus === 'skipped' ? skipReason || 'Skipped' : ''
      });
      onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Toggle Completion Checkbox
  const handleToggleComplete = async () => {
    const nextStatus = status === 'completed' ? 'not_started' : 'completed';
    await handleStatusChange(nextStatus);
  };

  // Save Notes
  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await api.put(`/milestones/${milestone._id}/notes`, { notes });
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 2000);
      onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Add Subtask
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      setIsAddingSubtask(true);
      const res = await api.post(`/milestones/${milestone._id}/tasks`, {
        title: newSubtaskTitle.trim(),
        priority: newSubtaskPriority,
        estimatedMinutes: newSubtaskMinutes
      });
      if (res.data?.task) {
        setTasks((prev) => [...prev, res.data.task]);
      }
      setNewSubtaskTitle('');
      onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to add subtask', err);
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/toggle`);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: res.data.task.status } : t))
      );
      onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  // Add Study Resource
  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceTitle.trim() || !newResourceUrl.trim()) return;
    try {
      setIsAddingResource(true);
      await api.post(`/milestones/${milestone._id}/resources`, {
        title: newResourceTitle.trim(),
        url: newResourceUrl.trim(),
        resourceType: newResourceType
      });
      setNewResourceTitle('');
      setNewResourceUrl('');
      onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to add resource', err);
    } finally {
      setIsAddingResource(false);
    }
  };

  // Delete Study Resource
  const handleDeleteResource = async (resourceId: string) => {
    try {
      await api.delete(`/milestones/${milestone._id}/resources/${resourceId}`);
      onMilestoneUpdated();
    } catch (err) {
      console.error('Failed to delete resource', err);
    }
  };

  // Start Focus Session
  const handleStartFocusSession = () => {
    startTimer(45, goalId, null, 'Module Study', `Module: ${milestone.title}`);
    setTimerStarted(true);
  };

  // Ask AI Progress Coach
  const handleAskAI = async (customPrompt?: string) => {
    const q = (customPrompt || aiQuestion).trim();
    if (!q) return;
    try {
      setIsAskingAI(true);
      const res = await api.post('/ai/goal-assistance', {
        goalId,
        question: `Regarding milestone "${milestone.title}": ${q}`
      });
      if (res.data?.assistance?.answer) {
        setAiAnswer(res.data.assistance.answer);
      }
    } catch (err) {
      console.error('Failed to ask AI', err);
    } finally {
      setIsAskingAI(false);
    }
  };

  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  const isSkipped = status === 'skipped';
  const completedTasksCount = tasks.filter((t) => t.status === 'completed').length;
  const taskProgressPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-gray-950 border-l border-gray-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex items-start justify-between gap-3 bg-gray-900/60 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`p-1.5 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'
              }`}
              title={isCompleted ? 'Mark Incomplete' : 'Mark Completed'}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-900/50 border border-purple-700/50 text-purple-300 font-bold">
                  Module #{String(milestone.sequenceNumber || milestone.order).padStart(2, '0')}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : isInProgress
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : isSkipped
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {status.replace('_', ' ')}
                </span>
                {milestone.estimatedEffort && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span>{milestone.estimatedEffort}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {milestone.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Sections A - F) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Status Dropdown Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-900/60 border border-gray-800 rounded-xl gap-2">
            <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Execution Status:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'not_started', label: 'Not Started', icon: Circle },
                { key: 'in_progress', label: 'In Progress', icon: PlayCircle },
                { key: 'completed', label: 'Completed', icon: CheckCircle2 },
                { key: 'skipped', label: 'Skipped', icon: SkipForward }
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = status === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleStatusChange(opt.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      isSelected
                        ? opt.key === 'completed'
                          ? 'bg-emerald-600 text-white'
                          : opt.key === 'in_progress'
                          ? 'bg-purple-600 text-white'
                          : opt.key === 'skipped'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-700 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skipped Consequence Notice */}
          {isSkipped && (
            <div className="p-3 bg-amber-950/20 border border-amber-600/30 rounded-xl text-xs text-amber-200/90 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-300 block">Skipped Module Policy:</span>
                <p className="text-[11px] leading-relaxed">
                  Skipping excludes this module from your required syllabus. It does <strong>not</strong> count toward completed modules, but it also does <strong>not</strong> penalize your completion percentage (remaining active modules scale to 100%).
                </p>
              </div>
            </div>
          )}

          {/* Section A: Learning Objectives & Summary */}
          {milestone.description && (
            <div className="space-y-1.5">
              <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Section A: Learning Objectives & Summary
              </span>
              <p className="text-xs text-gray-300 bg-gray-900/50 p-3.5 rounded-xl border border-gray-800/80 leading-relaxed">
                {milestone.description}
              </p>
            </div>
          )}

          {/* Section B: Subtasks Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  Section B: Actionable Subtasks ({completedTasksCount}/{tasks.length})
                </span>
              </span>
              {tasks.length > 0 && (
                <span className="text-xs font-bold text-white font-mono">
                  {taskProgressPct}% Done
                </span>
              )}
            </div>

            {/* Subtasks Progress Bar */}
            {tasks.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-gray-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${taskProgressPct}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5">
              {tasks.length === 0 ? (
                <div className="text-xs text-gray-500 italic p-3 bg-gray-900/30 border border-dashed border-gray-800 rounded-xl text-center">
                  No subtasks added yet. Add bite-sized tasks to master this module step by step.
                </div>
              ) : (
                tasks.map((task) => {
                  const isTaskDone = task.status === 'completed';
                  return (
                    <div
                      key={task._id}
                      onClick={() => handleToggleTask(task._id)}
                      className="flex items-center justify-between p-2.5 bg-gray-900/70 border border-gray-800 rounded-xl cursor-pointer hover:border-gray-700 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          className={`p-1 rounded ${
                            isTaskDone
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-gray-800 text-gray-500'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <span
                          className={`text-xs ${
                            isTaskDone ? 'line-through text-gray-500 font-normal' : 'text-gray-200 font-medium'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                        {task.estimatedMinutes || 45}m
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add actionable subtask (e.g. Implement BFS and verify edge cases)..."
                className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Section C: Markdown Study Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Section C: Markdown Study Notes & Formulas</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNotesPreviewMode(!notesPreviewMode)}
                  className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-gray-800 flex items-center gap-1"
                >
                  {notesPreviewMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{notesPreviewMode ? 'Edit' : 'Preview'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 hover:text-purple-300"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{notesSavedSuccess ? 'Saved!' : isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            </div>

            {notesPreviewMode ? (
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-200 leading-relaxed min-h-[100px] whitespace-pre-wrap font-sans">
                {notes.trim() || <span className="text-gray-500 italic">No notes entered.</span>}
              </div>
            ) : (
              <textarea
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write study notes in Markdown:
# Key Concept
- Edge cases to remember
- Formula: Time Complexity O(N log N)
- Code snippets / Pseudocode"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
              />
            )}
          </div>

          {/* Section D: Study Resources */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Section D: Study Resources & Documentation</span>
            </span>

            {/* List */}
            <div className="space-y-1.5">
              {!milestone.resources || milestone.resources.length === 0 ? (
                <div className="text-xs text-gray-500 italic p-2.5 bg-gray-900/30 border border-dashed border-gray-800 rounded-xl text-center">
                  No reference links added yet. Attach documentation or tutorial URLs below.
                </div>
              ) : (
                milestone.resources.map((res: any, idx) => (
                  <div
                    key={res._id || idx}
                    className="flex items-center justify-between p-2 bg-gray-900/60 border border-gray-800 rounded-xl text-xs"
                  >
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-purple-400 hover:text-purple-300 font-medium truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{res.title}</span>
                    </a>
                    {res._id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteResource(res._id)}
                        className="text-gray-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add Resource */}
            <form onSubmit={handleAddResource} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newResourceTitle}
                onChange={(e) => setNewResourceTitle(e.target.value)}
                placeholder="Title (e.g. Official Docs / Video)"
                className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={newResourceUrl}
                  onChange={(e) => setNewResourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={isAddingResource || !newResourceTitle.trim() || !newResourceUrl.trim()}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Section E: Focus Session Integration */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/30 to-purple-950/30 border border-indigo-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
                <span>Section E: Focus Session</span>
              </span>
              <p className="text-xs text-gray-400">
                Start a timed 45-minute focus session directly linked to this module.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartFocusSession}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{timerStarted ? 'Session Active' : 'Start Focus Session'}</span>
              </button>
              {timerStarted && (
                <button
                  type="button"
                  onClick={() => navigate('/timer')}
                  className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs text-white font-semibold transition"
                >
                  Go to Timer
                </button>
              )}
            </div>
          </div>

          {/* Section F: AI Coach & Interactive Prompt Pills */}
          <div className="p-4 bg-gradient-to-br from-purple-950/30 to-indigo-950/30 border border-purple-800/40 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Section F: AI Module Coach
              </span>
            </div>

            {/* Quick Prompt Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'Explain this topic simply',
                'Generate 3 practice questions',
                'Summarize key concepts & formulas',
                'Top interview pitfalls to avoid'
              ].map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleAskAI(pill)}
                  disabled={isAskingAI}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-800/50 text-[11px] text-purple-200 transition disabled:opacity-50"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Custom Question Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
                placeholder="Ask anything about this module..."
                className="flex-1 px-3 py-1.5 bg-gray-950/80 border border-purple-800/50 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => handleAskAI()}
                disabled={isAskingAI || !aiQuestion.trim()}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1 shadow-md shadow-purple-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAskingAI ? 'Consulting...' : 'Ask Coach'}</span>
              </button>
            </div>

            {aiAnswer && (
              <div className="mt-3 p-3 bg-gray-950/90 border border-purple-800/40 rounded-xl text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                {aiAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
