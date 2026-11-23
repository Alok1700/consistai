import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useTimerStore } from '../store/timerStore';
import { WorkSession, Goal } from '../types';
import { Modal } from '../components/UI/Modal';
import {
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Clock,
  Target,
  Trash2,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Flame,
  Check
} from 'lucide-react';

export const TimerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    timerMode,
    setTimerMode,
    isRunning,
    isPaused,
    secondsRemaining,
    secondsElapsed,
    totalDurationMinutes,
    startTimer,
    startStopwatch,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
    setCustomDuration,
    category: timerCategory,
    selectedGoalId
  } = useTimerStore();

  const [focusPreset, setFocusPreset] = useState<'pomodoro' | 'short_break' | 'deep_45' | 'deep_60' | 'deep_90' | 'custom' | 'stopwatch'>('deep_45');
  const [customMinutes, setCustomMinutes] = useState(45);
  const [selectedGoal, setSelectedGoal] = useState(selectedGoalId || '');
  const [selectedCategory, setSelectedCategory] = useState('Deep Coding');
  const [sessionNotes, setSessionNotes] = useState('');
  const [isDistractionFree, setIsDistractionFree] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual session logging state
  const [mDuration, setMDuration] = useState(45);
  const [mCategory, setMCategory] = useState('Deep Coding');
  const [mGoalId, setMGoalId] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [mDate, setMDate] = useState(new Date().toISOString().slice(0, 10));

  // Fetch Work Sessions
  const { data: sessionsData } = useQuery<{ summary: any; sessions: WorkSession[] }>({
    queryKey: ['work-sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data;
    }
  });

  // Fetch Active Goals
  const { data: goalsData } = useQuery<{ goals: Goal[] }>({
    queryKey: ['goals-list'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  const goals = goalsData?.goals || [];
  const sessions = sessionsData?.sessions || [];
  const summary = sessionsData?.summary;

  const logManualMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/sessions', {
        goal: mGoalId || null,
        category: mCategory,
        durationMinutes: Number(mDuration),
        sessionType: 'manual',
        date: mDate,
        notes: mNotes
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      setIsManualModalOpen(false);
      setMNotes('');
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    }
  });

  // Format digital countdown / stopwatch
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDisplaySeconds = timerMode === 'countdown' ? secondsRemaining : secondsElapsed;

  // Progress for bar
  const totalSeconds = (totalDurationMinutes || 45) * 60;
  const progressPercent =
    timerMode === 'countdown' && totalSeconds > 0
      ? Math.min(100, Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100))
      : 100;

  const handleSelectPreset = (preset: typeof focusPreset, minutes?: number) => {
    setFocusPreset(preset);
    if (preset === 'stopwatch') {
      setTimerMode('stopwatch');
    } else {
      setTimerMode('countdown');
      if (minutes) {
        setCustomMinutes(minutes);
        setCustomDuration(minutes);
      }
    }
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      if (isPaused) resumeTimer();
      else pauseTimer();
    } else {
      if (focusPreset === 'stopwatch') {
        startStopwatch(selectedGoal || null, null, selectedCategory, sessionNotes);
      } else {
        const mins =
          focusPreset === 'pomodoro'
            ? 25
            : focusPreset === 'short_break'
            ? 5
            : focusPreset === 'deep_45'
            ? 45
            : focusPreset === 'deep_60'
            ? 60
            : focusPreset === 'deep_90'
            ? 90
            : customMinutes;
        startTimer(mins, selectedGoal || null, null, selectedCategory, sessionNotes);
      }
    }
  };

  const handleFinishSession = async () => {
    await stopTimer(true);
    queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
  };

  return (
    <div className={`space-y-6 max-w-4xl mx-auto pb-12 transition-all ${isDistractionFree ? 'pt-8' : ''}`}>
      {/* Top Header */}
      {!isDistractionFree && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263247] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
              <TimerIcon className="w-6 h-6 text-[#8B5CF6]" />
              <span>Focus Workspace</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
              Distraction-free focus sessions, custom deep work presets, and verified work logging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDistractionFree(true)}
              className="px-3.5 py-2 rounded-xl bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Full Zen Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span className="hidden sm:inline">Zen Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-[#F8FAFC] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Past Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Zen Mode Exit Bar */}
      {isDistractionFree && (
        <div className="flex items-center justify-between pb-2 border-b border-[#263247]">
          <span className="text-xs font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>Zen Focus Mode Active</span>
          </span>
          <button
            type="button"
            onClick={() => setIsDistractionFree(false)}
            className="px-3 py-1.5 rounded-xl bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] text-xs font-semibold text-[#94A3B8] hover:text-white transition flex items-center gap-1"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Zen Mode</span>
          </button>
        </div>
      )}

      {/* Main Focus Clock Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[#161E2E] border border-[#263247] shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Presets Selector (when not running) */}
        {!isRunning && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap pb-2 border-b border-[#263247]/60">
            {[
              { id: 'deep_45', label: '45m Deep Work', mins: 45 },
              { id: 'deep_60', label: '60m Immersion', mins: 60 },
              { id: 'deep_90', label: '90m Flow State', mins: 90 },
              { id: 'pomodoro', label: '25m Pomodoro', mins: 25 },
              { id: 'short_break', label: '5m Rest', mins: 5 },
              { id: 'stopwatch', label: 'Stopwatch', mins: 0 }
            ].map((p) => {
              const isSelected = focusPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id as any, p.mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                      : 'bg-[#0B0F19] text-[#94A3B8] border border-[#263247] hover:text-[#F8FAFC]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Roadmap or Task context banner */}
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#94A3B8]">
          <Target className="w-4 h-4 text-[#8B5CF6]" />
          <span>Working on:</span>
          <select
            value={selectedGoal}
            onChange={(e) => setSelectedGoal(e.target.value)}
            disabled={isRunning}
            className="bg-[#0B0F19] border border-[#263247] rounded-lg px-2.5 py-1 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] max-w-xs truncate"
          >
            <option value="">General Productivity</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title} ({g.currentProgressPercentage || 0}%)
              </option>
            ))}
          </select>
        </div>

        {/* GIANT DIGITAL TIMER DISPLAY */}
        <div className="py-4 sm:py-6">
          <div className="text-6xl sm:text-8xl font-black font-mono tracking-tight text-[#F8FAFC] select-none drop-shadow-sm">
            {formatTime(currentDisplaySeconds)}
          </div>
          <span className="text-xs uppercase tracking-widest text-[#64748B] font-mono mt-2 block">
            {timerMode === 'countdown' ? 'Countdown Remaining' : 'Time Elapsed in Session'}
          </span>
        </div>

        {/* Thin Sleek Progress Bar */}
        {timerMode === 'countdown' && (
          <div className="w-full max-w-md mx-auto bg-[#0B0F19] rounded-full h-2 overflow-hidden border border-[#263247]/60">
            <div
              className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#10B981] transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Controls: Play/Pause, Finish, Reset */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {isRunning && (
            <button
              type="button"
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-[#0B0F19] hover:bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleTimer}
            className="px-8 py-3.5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-extrabold text-sm shadow-xl shadow-[#8B5CF6]/30 transition flex items-center gap-2 cursor-pointer"
          >
            {isRunning && !isPaused ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pause Session</span>
              </>
            ) : isRunning && isPaused ? (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Resume Session</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          {isRunning && (
            <button
              type="button"
              onClick={handleFinishSession}
              className="px-5 py-3.5 rounded-2xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition flex items-center gap-1.5 cursor-pointer"
              title="Save completed focus time"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Finish & Save</span>
            </button>
          )}
        </div>
      </div>

      {/* Session History Table */}
      {!isDistractionFree && (
        <div className="bg-[#161E2E] border border-[#263247] rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#263247]">
            <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8B5CF6]" />
              <span>Recent Focus Sessions ({sessions.length})</span>
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">
              Total Logged: <strong>{summary?.totalHours || 0}h</strong>
            </span>
          </div>

          <div className="divide-y divide-[#263247]/60">
            {sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B] italic">
                No sessions completed yet. Start your first session above!
              </div>
            ) : (
              sessions.slice(0, 8).map((s) => {
                const goalObj = typeof s.goal === 'object' ? s.goal : null;
                return (
                  <div
                    key={s._id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-[#F8FAFC] block truncate">
                          {s.category || 'Focus Session'}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                          <span>{new Date(s.date).toLocaleDateString()}</span>
                          {goalObj && (
                            <span className="text-[#8B5CF6] truncate max-w-[150px]">
                              · {goalObj.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-md border border-[#10B981]/20">
                        +{s.durationMinutes}m
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteSessionMutation.mutate(s._id)}
                        className="p-1 rounded text-[#64748B] hover:text-[#EF4444] transition"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Manual Session Log Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Log Past Study Session"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            logManualMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Duration (minutes) <span className="text-[#8B5CF6]">*</span>
            </label>
            <input
              type="number"
              min={5}
              step={5}
              value={mDuration}
              onChange={(e) => setMDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm font-mono focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Date</label>
              <input
                type="date"
                value={mDate}
                onChange={(e) => setMDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Category</label>
              <input
                type="text"
                value={mCategory}
                onChange={(e) => setMCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Linked Goal</label>
            <select
              value={mGoalId}
              onChange={(e) => setMGoalId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">No goal linked</option>
              {goals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Notes</label>
            <textarea
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              rows={2}
              placeholder="What topics or problems did you solve?"
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#263247]">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#1C2638] text-[#94A3B8] text-xs font-semibold hover:bg-[#202B3D] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logManualMutation.isPending}
              className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition disabled:opacity-50"
            >
              {logManualMutation.isPending ? 'Logging...' : 'Save Session'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
