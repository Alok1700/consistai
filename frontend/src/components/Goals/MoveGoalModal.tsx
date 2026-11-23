import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { Goal, GoalFolder } from '../../types';
import { Folder, ArrowRight } from 'lucide-react';

interface MoveGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  folders: GoalFolder[];
  onMove: (goalId: string, folderId: string, folderName: string) => Promise<void>;
}

export const MoveGoalModal: React.FC<MoveGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  folders,
  onMove
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (goal) {
      const fId = typeof goal.folderId === 'object' && goal.folderId !== null
        ? (goal.folderId as any)._id
        : goal.folderId;
      setSelectedFolderId(fId || '');
    }
  }, [goal]);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderDoc = folders.find((f) => f._id === selectedFolderId);
    const folderName = folderDoc ? folderDoc.name : 'General';

    try {
      setIsSubmitting(true);
      setError(null);
      await onMove(goal._id, selectedFolderId, folderName);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to move goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Move Goal: "${goal.title}"`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-400">
          Select destination folder for this goal. All connected milestones, tasks, and historical progress will remain intact.
        </p>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Target Destination Folder
          </label>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {folders.map((f) => {
              const isSelected = selectedFolderId === f._id;
              return (
                <button
                  type="button"
                  key={f._id}
                  onClick={() => setSelectedFolderId(f._id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'bg-purple-900/30 border-purple-500 text-purple-200'
                      : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: f.color || '#6366f1' }}
                    />
                    <Folder className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{f.name}</div>
                      {f.description && (
                        <div className="text-xs text-gray-500">{f.description}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {f.goalCount || 0} goals
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            {isSubmitting ? 'Moving...' : 'Confirm Move'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
