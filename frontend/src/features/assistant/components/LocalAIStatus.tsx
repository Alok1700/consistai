import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface LocalAIStatusProps {
  online?: boolean;
  modelName?: string;
  latencyMs?: number | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const LocalAIStatus: React.FC<LocalAIStatusProps> = ({
  online = true,
  modelName = 'qwen3.5:4b',
  latencyMs = null,
  isLoading = false,
  onRefresh,
  className = ''
}) => {
  return (
    <div
      onClick={onRefresh}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition cursor-pointer select-none ${
        online
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
      } ${className}`}
      title={online ? `Connected to local Ollama (${modelName})${latencyMs ? ` • ${latencyMs}ms` : ''}` : 'Local Ollama is offline. Click to retry.'}
    >
      <div className="relative flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <span
              className={`w-2 h-2 rounded-full ${
                online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </>
        )}
      </div>

      <span className="flex items-center gap-1 font-mono">
        <Cpu className="w-3 h-3 opacity-70" />
        <span className="truncate max-w-[110px]">{online ? modelName : 'Local AI Offline'}</span>
      </span>

      {online && latencyMs !== null && (
        <span className="text-[10px] opacity-75 hidden sm:inline">
          {latencyMs}ms
        </span>
      )}
    </div>
  );
};
