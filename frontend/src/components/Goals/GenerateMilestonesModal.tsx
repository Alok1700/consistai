import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { api } from '../../api/client';
import { Layers, Plus, Sparkles, AlertCircle, Check } from 'lucide-react';

interface GenerateMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
  category: string;
  onGenerated: () => void;
}

export const GenerateMilestonesModal: React.FC<GenerateMilestonesModalProps> = ({
  isOpen,
  onClose,
  goalId,
  goalTitle,
  category,
  onGenerated
}) => {
  const [count, setCount] = useState<number>(30);
  const [prefix, setPrefix] = useState<string>('Module');
  const [wipeExisting, setWipeExisting] = useState<boolean>(false);
  const [useAISyllabus, setUseAISyllabus] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      if (useAISyllabus) {
        // Call AI milestone generator then add
        const aiRes = await api.post('/ai/generate-milestones', {
          goalTitle,
          count: Number(count || 10),
          category
        });
        const milestones = aiRes.data?.milestones || [];
        // Insert milestones
        for (const m of milestones) {
          await api.post(`/goals/${goalId}/milestones`, {
            title: m.title,
            description: m.description,
            weight: 1.0,
            targetQuantity: 1
          });
        }
      } else {
        await api.post(`/goals/${goalId}/milestones/generate`, {
          count: Number(count || 10),
          prefix,
          wipeExisting
        });
      }

      onGenerated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to generate milestones');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generate Milestone Slots: "${goalTitle}"`}>
      <form onSubmit={handleGenerate} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Specify how many milestone slots you want to generate for this goal.
        </p>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
            Number of Slots to Create *
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={150}
              required
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-28 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white font-bold text-center focus:border-purple-500"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {[5, 10, 20, 30, 50, 100].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setCount(num)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    count === num
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
            Naming Prefix
          </label>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="e.g. Module, Chapter, Sprint, Phase"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Options */}
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={useAISyllabus}
              onChange={(e) => setUseAISyllabus(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Use AI to populate meaningful topics & subtasks for each slot</span>
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-rose-300 cursor-pointer">
            <input
              type="checkbox"
              checked={wipeExisting}
              onChange={(e) => setWipeExisting(e.target.checked)}
              className="rounded bg-gray-900 border-gray-700 text-rose-600 focus:ring-0"
            />
            <span>Replace / Reset all existing milestone slots for this goal</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            <Layers className="w-4 h-4" />
            {isSubmitting ? 'Generating Slots...' : `Generate ${count} Slots`}
          </button>
        </div>
      </form>
    </Modal>
  );
};
