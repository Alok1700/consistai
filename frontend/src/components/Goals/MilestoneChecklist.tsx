import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { GoalMilestone, GoalModule } from '../../types';
import { ModuleChecklistItem } from './ModuleChecklistItem';
import { MilestoneActionsMenu } from './MilestoneActionsMenu';
import { EditMilestoneModal } from './EditMilestoneModal';
import { GenerateModulesModal } from './GenerateModulesModal';
import { ImportModulesModal } from './ImportModulesModal';
import { RenameModulesModal } from './RenameModulesModal';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Layers
} from 'lucide-react';

interface MilestoneChecklistProps {
  milestone: GoalMilestone;
  goalId: string;
  defaultExpanded?: boolean;
}

export const MilestoneChecklist: React.FC<MilestoneChecklistProps> = ({
  milestone,
  goalId
}) => {
  const queryClient = useQueryClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Quick inline add in header: "Add single module..." + "Add"
  const [headerInputTitle, setHeaderInputTitle] = useState('');

  // Fetch modules for this milestone
  const { data: modulesData, isLoading } = useQuery({
    queryKey: ['modules', milestone._id],
    queryFn: () => api.get(`/goal-milestones/${milestone._id}/modules`).then((r) => r.data),
    staleTime: 15000
  });

  const modules: GoalModule[] = modulesData?.modules || [];

  // Quick add mutation
  const quickAddMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post(`/goal-milestones/${milestone._id}/modules`, { title });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules', milestone._id] });
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setHeaderInputTitle('');
    }
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/goal-milestones/${milestone._id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-milestones', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsDeleteConfirmOpen(false);
    }
  });

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerInputTitle.trim() && !quickAddMutation.isPending) {
      quickAddMutation.mutate(headerInputTitle.trim());
    }
  };

  const completedCount = milestone.completedModuleCount ?? modules.filter(m => m.isCompleted).length;
  const totalCount = milestone.moduleCount ?? modules.length;
  const progressPct = totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : (milestone.progressPercentage ?? 0);

  const isAllCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 sm:p-7 shadow-xl">
      {/* Header matching reference image: Title + Subtitle on Left, Inline Add on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Title & Subtitle */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {milestone.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            {milestone.weight ? `Weight ${milestone.weight} · ` : ''}
            {completedCount}/{totalCount} modules completed · {progressPct}%
          </p>
        </div>

        {/* Right: Inline Add Input & Button + 3-Dot Options */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleQuickAddSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={headerInputTitle}
              onChange={(e) => setHeaderInputTitle(e.target.value)}
              placeholder="Add single module..."
              className="bg-[#0B1120] border border-slate-700/80 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56 transition"
            />
            <button
              type="submit"
              disabled={!headerInputTitle.trim() || quickAddMutation.isPending}
              className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700/80 text-xs sm:text-sm font-medium text-white transition disabled:opacity-40 cursor-pointer"
            >
              {quickAddMutation.isPending ? 'Adding...' : 'Add'}
            </button>
          </form>

          <MilestoneActionsMenu
            milestone={milestone}
            onEdit={() => setIsEditModalOpen(true)}
            onRenameModules={() => setIsRenameModalOpen(true)}
            onGenerate={() => setIsGenerateModalOpen(true)}
            onImport={() => setIsImportModalOpen(true)}
            onDelete={() => setIsDeleteConfirmOpen(true)}
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-10 mt-4">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && modules.length === 0 && (
        <div className="text-center py-10 mt-6 border border-dashed border-slate-800 rounded-xl p-4">
          <Layers className="w-7 h-7 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-300 font-semibold mb-1">No modules in this milestone yet</p>
          <p className="text-[11px] text-slate-500 mb-3">
            Use the input above to add topics or generate slots.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              Generate 10 Modules
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Import Syllabus
            </button>
          </div>
        </div>
      )}

      {/* TWO-COLUMN MODULE CHECKLIST (matches reference image) */}
      {!isLoading && modules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16 gap-y-3.5 mt-6">
          {modules.map((mod, index) => (
            <ModuleChecklistItem
              key={mod._id}
              module={mod}
              milestoneId={milestone._id}
              goalId={goalId}
              moduleIndex={index}
              milestoneOrder={milestone.order}
            />
          ))}
        </div>
      )}

      {/* Edit Milestone Modal */}
      <EditMilestoneModal
        milestone={milestone}
        goalId={goalId}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Generate Modules Modal */}
      <GenerateModulesModal
        milestoneId={milestone._id}
        milestoneTitle={milestone.title}
        existingCount={milestone.moduleCount}
        goalId={goalId}
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
      />

      {/* Import Modules Modal */}
      <ImportModulesModal
        milestoneId={milestone._id}
        milestoneTitle={milestone.title}
        existingCount={milestone.moduleCount}
        goalId={goalId}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Rename Modules Modal */}
      <RenameModulesModal
        milestone={milestone}
        goalId={goalId}
        modules={modules}
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-sm text-white">Delete Milestone?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-white">"{milestone.title}"</span>?
            </p>
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs text-rose-300 space-y-1">
              <div>• <strong>{milestone.moduleCount}</strong> modules will be permanently deleted</div>
              <div>• <strong>{milestone.completedModuleCount}</strong> completed items will be lost</div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMilestoneMutation.mutate()}
                disabled={deleteMilestoneMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {deleteMilestoneMutation.isPending ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
