import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, AlertCircle, AlertTriangle, Layers } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { api } from '../../api/client';

interface GenerateModulesModalProps {
  milestoneId: string;
  milestoneTitle: string;
  existingCount: number;
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GenerateModulesModal: React.FC<GenerateModulesModalProps> = ({
  milestoneId,
  milestoneTitle,
  existingCount,
  goalId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [count, setCount] = useState<number>(10);
  const [prefix, setPrefix] = useState<string>('Module');
  const [wipeExisting, setWipeExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/goal-milestones/${milestoneId}/modules/generate`, {
        count: Number(count) || 10,
        prefix: prefix.trim() || 'Module',
        wipeExisting,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onClose();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrorMsg(axiosErr.response?.data?.message || 'Failed to generate modules.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    generateMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generate Modules for "${milestoneTitle}"`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Count */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Number of Modules to Generate
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={200}
              required
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-3 py-2 rounded-lg text-sm text-slate-200 text-center focus:outline-none focus:border-purple-500 transition"
              style={{ background: '#1E293B', border: '1px solid #243047' }}
            />
            <div className="flex items-center gap-1 flex-wrap">
              {[5, 10, 20, 30, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCount(num)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
                    count === num
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  style={
                    count !== num
                      ? { background: '#1E293B', borderColor: '#243047' }
                      : {}
                  }
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Prefix */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Naming Prefix</label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. Module, Chapter, Lesson"
            className="w-full px-3 py-2 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            style={{ background: '#1E293B', border: '1px solid #243047' }}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Modules will be named: <span className="font-mono text-slate-400">{prefix || 'Module'} 01</span>,{' '}
            <span className="font-mono text-slate-400">{prefix || 'Module'} 02</span>…
          </p>
        </div>

        {/* Wipe existing toggle */}
        <div className="border-t pt-3" style={{ borderColor: '#243047' }}>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={wipeExisting}
              onChange={(e) => setWipeExisting(e.target.checked)}
              className="mt-0.5 rounded focus:ring-0"
              style={{ accentColor: '#f43f5e' }}
            />
            <div>
              <span className="text-xs font-semibold text-rose-300">
                Wipe existing {existingCount > 0 ? `${existingCount} ` : ''}modules
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Delete all current modules in this milestone before generating new ones.
              </p>
            </div>
          </label>

          {wipeExisting && existingCount > 0 && (
            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                This will permanently delete {existingCount} existing module
                {existingCount !== 1 ? 's' : ''} and their completion state.
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Layers className="w-3.5 h-3.5" />
            )}
            {generateMutation.isPending ? 'Generating…' : `Generate ${count} Modules`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
