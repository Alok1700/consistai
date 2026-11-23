import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, AlertCircle, CheckCircle2, ListPlus, Sparkles, Layers } from 'lucide-react';
import { Modal } from '../UI/Modal';
import { api } from '../../api/client';

interface ImportModulesModalProps {
  milestoneId: string;
  milestoneTitle: string;
  existingCount: number;
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModulesModal: React.FC<ImportModulesModalProps> = ({
  milestoneId,
  milestoneTitle,
  existingCount,
  goalId,
  isOpen,
  onClose
}) => {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'populate'>('populate');
  const [wipeExisting, setWipeExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live parsed preview of modules
  const parsedModules = useMemo(() => {
    if (!inputText.trim()) return [];
    return inputText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^\d+[\.\)\-:]\s*/, ''));
  }, [inputText]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/goal-milestones/${milestoneId}/modules/import`, {
        titles: parsedModules,
        mode: importMode,
        wipeExisting
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestoneId] });
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setInputText('');
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to import modules.');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedModules.length) {
      setErrorMsg('Please enter or paste at least one module title.');
      return;
    }
    setErrorMsg(null);
    importMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Import Modules: "${milestoneTitle}"`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Paste Syllabus / Module Titles (one per line)
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={6}
            placeholder={`Two Sum\nPrefix Sum & Frequency Arrays\nKadane's Algorithm\nSliding Window & Substring\nBinary Search Variations`}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-y"
            autoFocus
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Numbered prefixes (e.g. 1., 2-) are automatically trimmed.</span>
            <span className="font-semibold text-violet-400">{parsedModules.length} parsed items</span>
          </div>
        </div>

        {/* Import Mode Options */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => { setImportMode('populate'); setWipeExisting(false); }}
            className={`p-3 rounded-xl border text-left transition ${
              importMode === 'populate' && !wipeExisting
                ? 'bg-violet-900/30 border-violet-500 text-slate-100'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Populate Empty Slots</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Fills existing generic slots ("Module 01", etc.) without creating duplicates.
            </p>
          </button>

          <button
            type="button"
            onClick={() => { setImportMode('append'); setWipeExisting(false); }}
            className={`p-3 rounded-xl border text-left transition ${
              importMode === 'append' && !wipeExisting
                ? 'bg-violet-900/30 border-violet-500 text-slate-100'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-xs mb-1">
              <ListPlus className="w-4 h-4 text-emerald-400" />
              <span>Append New Modules</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Adds imported modules to the end of the existing checklist.
            </p>
          </button>
        </div>

        {/* Live Preview List */}
        {parsedModules.length > 0 && (
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">
              Preview ({parsedModules.length} modules)
            </span>
            <div className="max-h-40 overflow-y-auto bg-slate-900/80 border border-slate-800 rounded-xl p-2 divide-y divide-slate-800/50">
              {parsedModules.slice(0, 15).map((title, i) => (
                <div key={i} className="flex items-center gap-2 py-1 px-1 text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 font-mono w-6">#{String(i + 1).padStart(2, '0')}</span>
                  <span className="truncate">{title}</span>
                </div>
              ))}
              {parsedModules.length > 15 && (
                <div className="text-[11px] text-slate-500 text-center py-1">
                  +{parsedModules.length - 15} more modules...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={importMutation.isPending || parsedModules.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-md shadow-violet-600/20 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {importMutation.isPending ? 'Importing...' : `Import ${parsedModules.length} Modules`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
