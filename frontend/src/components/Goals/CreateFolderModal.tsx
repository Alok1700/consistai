import React, { useState } from 'react';
import { Modal } from '../UI/Modal';
import { GoalFolder } from '../../types';
import { Folder, FolderPlus, Palette, Tag } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (folderData: {
    name: string;
    parentFolderId?: string | null;
    description?: string;
    color: string;
    icon: string;
  }) => Promise<void>;
  folders: GoalFolder[];
  defaultParentId?: string | null;
}

const FOLDER_COLORS = [
  '#6366f1', // Indigo
  '#7c3aed', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#64748b'  // Slate
];

const FOLDER_ICONS = [
  'Folder',
  'Code',
  'GraduationCap',
  'Briefcase',
  'Sparkles',
  'BookOpen',
  'Terminal',
  'Cpu',
  'Rocket'
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  folders,
  defaultParentId = null
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string>(defaultParentId || '');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('Folder');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a folder name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        parentFolderId: parentFolderId ? parentFolderId : null,
        description: description.trim(),
        color,
        icon
      });
      setName('');
      setDescription('');
      setParentFolderId('');
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Smart Goal Folder">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Folder Name *
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms, Semester 6..."
              className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Parent Folder (Optional — Create Subfolder)
          </label>
          <select
            value={parentFolderId}
            onChange={(e) => setParentFolderId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:border-purple-500"
          >
            <option value="">None (Top-Level Folder)</option>
            {folders.map((f) => (
              <option key={f._id} value={f._id}>
                📁 {f.name} {f.parentFolderId ? '(Subfolder)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief purpose of this folder..."
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
            Folder Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {FOLDER_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-110 border-white ring-2 ring-purple-500/50' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
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
            <FolderPlus className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
