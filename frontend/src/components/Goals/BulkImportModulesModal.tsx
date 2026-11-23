import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../UI/Modal';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface BulkImportModulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  onImportComplete?: () => void;
}

export const BulkImportModulesModal: React.FC<BulkImportModulesModalProps> = ({
  isOpen,
  onClose,
  goalId,
  onImportComplete
}) => {
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Live parser for preview
  const parsedModules = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    return lines.map((line, idx) => {
      // Check for pipe delimiter: Title | Effort | Description
      if (line.includes('|')) {
        const parts = line.split('|').map((p) => p.trim());
        let cleanTitle = parts[0].replace(/^(\d+[\.\)\-:]|\s*-\s*|\s*\*\s*)/, '').trim();
        return {
          sequenceNumber: idx + 1,
          title: cleanTitle || `Module ${idx + 1}`,
          estimatedEffort: parts[1] || '45 mins',
          description: parts[2] || ''
        };
      }

      // Check for comma delimiter
      if (line.includes(',') && !line.includes('"')) {
        const parts = line.split(',').map((p) => p.trim());
        let cleanTitle = parts[0].replace(/^(\d+[\.\)\-:]|\s*-\s*|\s*\*\s*)/, '').trim();
        return {
          sequenceNumber: idx + 1,
          title: cleanTitle || `Module ${idx + 1}`,
          estimatedEffort: parts[1] || '45 mins',
          description: parts.slice(2).join(', ') || ''
        };
      }

      // Standard single title line
      const cleanTitle = line.replace(/^(\d+[\.\)\-:]|\s*-\s*|\s*\*\s*)/, '').trim();
      return {
        sequenceNumber: idx + 1,
        title: cleanTitle || `Module ${idx + 1}`,
        estimatedEffort: '45 mins',
        description: ''
      };
    });
  }, [inputText]);

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/goals/${goalId}/milestones/import`, {
        modules: parsedModules
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (onImportComplete) onImportComplete();
      setInputText('');
      setErrorMsg('');
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to import modules. Please verify formatting.');
    }
  });

  const handleApplySample = () => {
    setInputText(`1. Arrays & Hashing | 60 mins | Two pointers, hash maps, sliding window fundamentals
2. Two Pointers & Sliding Window | 90 mins | Fast & slow pointers, variable window problems
3. Stack & Monotonic Queue | 60 mins | Min stack, valid parentheses, daily temperatures
4. Binary Search Mastery | 90 mins | Search in rotated array, lower & upper bound patterns
5. Linked Lists & Fast Pointers | 60 mins | Reverse linked list, cycle detection, LRU cache
6. Binary Trees & Traversal | 90 mins | BFS level order, DFS recursion, tree paths
7. Binary Search Trees & Validation | 60 mins | Validate BST, lowest common ancestor
8. Backtracking & Subsets | 90 mins | Subsets, permutations, combination sum, N-Queens
9. Dynamic Programming 1D | 120 mins | Climbing stairs, house robber, coin change
10. Dynamic Programming 2D & Grid | 120 mins | Unique paths, longest common subsequence, knapsack`);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Bulk Import Syllabus Modules</h2>
              <p className="text-xs text-gray-400">
                Paste syllabus lines or course topics to generate modules automatically
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplySample}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-800/40 transition"
          >
            Insert Sample Syllabus
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-300">
              Paste Syllabus Lines (one per line)
            </label>
            <span className="text-[11px] text-gray-500">
              Format: <code className="text-purple-300 font-mono">Title | Duration | Summary</code>
            </span>
          </div>

          <textarea
            rows={7}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="1. Introduction to Arrays | 45 mins | Basics of memory allocation and indexing
2. Two Pointers Technique | 60 mins | Left and right pointer pattern
3. Sliding Window | 90 mins | Fixed and dynamic length windows"
            className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
          />
        </div>

        {/* Live Parse Preview */}
        {parsedModules.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Parsed Modules Preview ({parsedModules.length})</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                Ready for instantaneous creation
              </span>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-gray-950/80 border border-gray-800 rounded-xl">
              {parsedModules.map((m) => (
                <div
                  key={m.sequenceNumber}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-900 text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-900/50 text-purple-300 font-bold shrink-0">
                      #{String(m.sequenceNumber).padStart(2, '0')}
                    </span>
                    <span className="font-semibold text-white truncate">{m.title}</span>
                    {m.description && (
                      <span className="text-gray-500 text-[11px] truncate hidden sm:inline">
                        — {m.description}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                    {m.estimatedEffort}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => importMutation.mutate()}
            disabled={importMutation.isPending || parsedModules.length === 0}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center gap-1.5 disabled:opacity-50"
          >
            {importMutation.isPending ? 'Importing Modules...' : `Import ${parsedModules.length} Modules`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
