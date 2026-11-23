import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Edit2,
  Edit3,
  Layers,
  Upload,
  Trash2,
  AlertTriangle,
  Sparkles,
  Calendar
} from 'lucide-react';
import { GoalMilestone } from '../../types';

interface MilestoneActionsMenuProps {
  milestone: GoalMilestone;
  onEdit: () => void;
  onRenameModules?: () => void;
  onGenerate: () => void;
  onImport: () => void;
  onDelete: () => void;
}

export const MilestoneActionsMenu: React.FC<MilestoneActionsMenuProps> = ({
  milestone,
  onEdit,
  onRenameModules,
  onGenerate,
  onImport,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition"
        title="Milestone options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1 z-30 divide-y divide-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              type="button"
              onClick={() => { setIsOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Milestone</span>
            </button>
            {onRenameModules && (
              <button
                type="button"
                onClick={() => { setIsOpen(false); onRenameModules(); }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rename Modules</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => { setIsOpen(false); onGenerate(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              <span>Generate Slots</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); onImport(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition text-left"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Syllabus</span>
            </button>
          </div>

          <div className="py-1">
            <button
              type="button"
              onClick={() => { setIsOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Milestone</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
