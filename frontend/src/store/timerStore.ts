import { create } from 'zustand';
import { api } from '../api/client';

export type TimerMode = 'countdown' | 'stopwatch';

interface TimerState {
  timerMode: TimerMode;
  isRunning: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  secondsElapsed: number;
  totalDurationMinutes: number;
  selectedGoalId: string | null;
  selectedTaskId: string | null;
  category: string;
  sessionNotes: string;
  startTime: Date | null;

  setTimerMode: (mode: TimerMode) => void;
  startTimer: (durationMinutes: number, goalId?: string | null, taskId?: string | null, category?: string, notes?: string) => void;
  startStopwatch: (goalId?: string | null, taskId?: string | null, category?: string, notes?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tick: () => void;
  stopTimer: (save?: boolean) => Promise<void>;
  resetTimer: () => void;
  setCustomDuration: (minutes: number) => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  timerMode: 'countdown',
  isRunning: false,
  isPaused: false,
  secondsRemaining: 25 * 60,
  secondsElapsed: 0,
  totalDurationMinutes: 25,
  selectedGoalId: null,
  selectedTaskId: null,
  category: 'Problem Solving',
  sessionNotes: '',
  startTime: null,

  setTimerMode: (mode) => {
    if (!get().isRunning) {
      set({ timerMode: mode });
    }
  },

  startTimer: (durationMinutes, goalId = null, taskId = null, category = 'Problem Solving', notes = '') => {
    const mins = Math.max(1, durationMinutes);
    set({
      timerMode: 'countdown',
      isRunning: true,
      isPaused: false,
      totalDurationMinutes: mins,
      secondsRemaining: mins * 60,
      secondsElapsed: 0,
      selectedGoalId: goalId,
      selectedTaskId: taskId,
      category,
      sessionNotes: notes,
      startTime: new Date()
    });
  },

  startStopwatch: (goalId = null, taskId = null, category = 'Problem Solving', notes = '') => {
    set({
      timerMode: 'stopwatch',
      isRunning: true,
      isPaused: false,
      secondsElapsed: 0,
      secondsRemaining: 0,
      totalDurationMinutes: 0,
      selectedGoalId: goalId,
      selectedTaskId: taskId,
      category,
      sessionNotes: notes,
      startTime: new Date()
    });
  },

  setCustomDuration: (minutes: number) => {
    const mins = Math.max(1, minutes);
    set({
      totalDurationMinutes: mins,
      secondsRemaining: mins * 60
    });
  },

  pauseTimer: () => set({ isPaused: true }),
  resumeTimer: () => set({ isPaused: false }),

  tick: () => {
    const { timerMode, secondsRemaining, secondsElapsed, isRunning, isPaused } = get();
    if (!isRunning || isPaused) return;

    if (timerMode === 'countdown') {
      if (secondsRemaining <= 1) {
        get().stopTimer(true);
      } else {
        set({
          secondsRemaining: secondsRemaining - 1,
          secondsElapsed: secondsElapsed + 1
        });
      }
    } else {
      // Stopwatch mode
      set({ secondsElapsed: secondsElapsed + 1 });
    }
  },

  stopTimer: async (save = true) => {
    const { timerMode, startTime, totalDurationMinutes, secondsRemaining, secondsElapsed, selectedGoalId, selectedTaskId, category, sessionNotes } = get();
    
    let elapsedMinutes = 0;
    if (timerMode === 'countdown') {
      elapsedMinutes = Math.max(1, Math.round((totalDurationMinutes * 60 - secondsRemaining) / 60));
    } else {
      elapsedMinutes = Math.max(1, Math.round(secondsElapsed / 60));
    }

    if (save && elapsedMinutes >= 1) {
      try {
        await api.post('/sessions', {
          goal: selectedGoalId,
          task: selectedTaskId,
          category,
          startTime: startTime || new Date(Date.now() - elapsedMinutes * 60000),
          endTime: new Date(),
          durationMinutes: elapsedMinutes,
          sessionType: timerMode === 'stopwatch' ? 'timer' : 'timer',
          notes: sessionNotes || `${timerMode === 'stopwatch' ? 'Stopwatch focus clock' : 'Focus countdown'} completed (${elapsedMinutes}m)`
        });
      } catch (e) {
        console.error('Failed to auto-save work session:', e);
      }
    }

    set({
      isRunning: false,
      isPaused: false,
      secondsRemaining: (get().totalDurationMinutes || 25) * 60,
      secondsElapsed: 0,
      startTime: null
    });
  },

  resetTimer: () => {
    set({
      isRunning: false,
      isPaused: false,
      secondsRemaining: (get().totalDurationMinutes || 25) * 60,
      secondsElapsed: 0,
      startTime: null
    });
  }
}));
