import React, { useEffect } from 'react';
import { useTimerStore } from '../../store/timerStore';
import { Play, Pause, Square, Timer as TimerIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FloatingTimerWidget: React.FC = () => {
  const {
    timerMode,
    isRunning,
    isPaused,
    secondsRemaining,
    secondsElapsed,
    tick,
    pauseTimer,
    resumeTimer,
    stopTimer,
    category
  } = useTimerStore();

  useEffect(() => {
    let interval: any = null;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, tick]);

  if (!isRunning) return null;

  const activeSeconds = timerMode === 'countdown' ? secondsRemaining : secondsElapsed;
  const mins = Math.floor(activeSeconds / 60);
  const secs = activeSeconds % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
        <TimerIcon className="w-5 h-5 text-indigo-400" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Link to="/timer" className="text-lg font-mono font-bold text-white hover:text-indigo-300 transition">
            {timeStr}
          </Link>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase font-semibold">
            {timerMode === 'stopwatch' ? 'Count-Up' : 'Countdown'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">{category}</p>
      </div>

      <div className="flex items-center gap-1.5 ml-2 border-l border-slate-800 pl-3">
        <button
          onClick={isPaused ? resumeTimer : pauseTimer}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />}
        </button>

        <button
          onClick={() => stopTimer(true)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-400 transition"
          title="Save & Stop Session"
        >
          <Square className="w-4 h-4 fill-rose-400" />
        </button>
      </div>
    </div>
  );
};
