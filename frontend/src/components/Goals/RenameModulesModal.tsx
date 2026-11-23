import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { GoalMilestone, GoalModule } from '../../types';
import { X, Edit3, FileText, ListOrdered, CheckCircle2 } from 'lucide-react';

interface RenameModulesModalProps {
  milestone: GoalMilestone;
  goalId: string;
  isOpen: boolean;
  onClose: () => void;
  modules: GoalModule[];
}

export const RenameModulesModal: React.FC<RenameModulesModalProps> = ({
  milestone,
  goalId,
  isOpen,
  onClose,
  modules
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'individual' | 'bulk'>('individual');
  
  // State for individual row inputs
  const [moduleTitles, setModuleTitles] = useState<{ id: string; title: string; order: number }[]>([]);
  
  // State for bulk paste textarea
  const [bulkText, setBulkText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (modules && modules.length > 0) {
      const sorted = [...modules].sort((a, b) => (a.order || 0) - (b.order || 0));
      setModuleTitles(sorted.map((m) => ({ id: m._id, title: m.title, order: m.order })));
      setBulkText(sorted.map((m) => m.title).join('\n'));
    } else {
      setModuleTitles([]);
      setBulkText('');
    }
    setErrorMsg(null);
  }, [modules, isOpen]);

  const renameMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/goal-milestones/${milestone._id}/modules/rename`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestone._id] });
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to rename modules.');
    }
  });

  if (!isOpen) return null;

  const handleTitleChange = (id: string, newTitle: string) => {
    setModuleTitles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
  };

  const handleSaveIndividual = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    renameMutation.mutate({
      modules: moduleTitles.map((m) => ({ id: m.id, title: m.title.trim() }))
    });
  };

  const handleSaveBulk = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const lines = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setErrorMsg('Please enter at least one module name.');
      return;
    }
    renameMutation.mutate({
      modules: lines
    });
  };

  const parsedBulkCount = bulkText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Edit3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Rename Modules</h2>
              <p className="text-xs text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                {milestone.title} ({modules.length} modules)
              </p>
            </div>
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

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === 'individual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Edit Individual Rows</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === 'bulk'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste / Edit Full List</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === 'individual' ? (
            <form id="rename-individual-form" onSubmit={handleSaveIndividual} className="space-y-2.5">
              {moduleTitles.map((mod, idx) => (
                <div key={mod.id} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-8 shrink-0 text-right">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <input
                    type="text"
                    value={mod.title}
                    onChange={(e) => handleTitleChange(mod.id, e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    placeholder={`Module ${String(idx + 1).padStart(2, '0')}`}
                  />
                </div>
              ))}
            </form>
          ) : (
            <form id="rename-bulk-form" onSubmit={handleSaveBulk} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">One module per line:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  {parsedBulkCount} {parsedBulkCount === 1 ? 'module' : 'modules'} detected
                </span>
              </div>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={12}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
                placeholder="Paste your curriculum module titles here..."
              />
              <p className="text-[11px] text-slate-400">
                Note: Lines are matched to modules in order. Any existing completed status is preserved.
              </p>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={activeTab === 'individual' ? 'rename-individual-form' : 'rename-bulk-form'}
            disabled={renameMutation.isPending}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{renameMutation.isPending ? 'Saving...' : 'Save All Names'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
