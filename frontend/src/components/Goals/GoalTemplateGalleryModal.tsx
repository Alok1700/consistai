import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { GoalFolder } from '../../types';
import { Modal } from '../UI/Modal';
import {
  Sparkles,
  BookOpen,
  Code2,
  Cpu,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Folder,
  ArrowRight,
  Layers,
  Flame,
  Search
} from 'lucide-react';

interface GoalTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  difficulty?: string;
  durationDays?: number;
  estimatedDays?: number;
  trackingType?: string;
  progressType?: string;
  targetQuantity?: number;
  measurementUnit?: string;
  modules?: Array<{
    order?: number;
    sequenceNumber?: number;
    title: string;
    description: string;
    estimatedEffort: string;
    subtasks?: string[];
  }>;
  milestones?: Array<{
    order?: number;
    sequenceNumber?: number;
    title: string;
    description: string;
    estimatedEffort: string;
    subtasks?: string[];
  }>;
}

interface GoalTemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: GoalFolder[];
  activeFolderId?: string;
  onGoalCreated?: (newGoal: any) => void;
}

export const GoalTemplateGalleryModal: React.FC<GoalTemplateGalleryModalProps> = ({
  isOpen,
  onClose,
  folders,
  activeFolderId,
  onGoalCreated
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(activeFolderId || '');

  // Fetch templates from backend
  const { data: templateData, isLoading } = useQuery<{ success: boolean; templates: GoalTemplate[] }>({
    queryKey: ['goal-templates'],
    queryFn: async () => {
      const res = await api.get('/goals/templates');
      return res.data;
    },
    enabled: isOpen
  });

  const templates = templateData?.templates || [];

  const useTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const selectedFolder = folders.find((f) => f._id === selectedFolderId);
      const res = await api.post('/goals/from-template', {
        templateId,
        folderId: selectedFolderId || undefined,
        folder: selectedFolder ? selectedFolder.name : 'General'
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-folders'] });
      if (onGoalCreated) onGoalCreated(data.goal);
      onClose();
      if (data?.goal?._id) {
        navigate(`/goals/${data.goal._id}`);
      }
    }
  });

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedCategory !== 'all' && tpl.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tpl.title.toLowerCase().includes(q);
      const matchDesc = tpl.description.toLowerCase().includes(q);
      const matchCat = tpl.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const categories = ['all', 'DSA & Coding', 'Web Development', 'System Design', 'Academic Coursework', 'Personal Productivity'];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="max-w-3xl">
      <div className="space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Curated Goal Roadmaps</h2>
              <p className="text-xs text-gray-400">
                Pre-configured roadmaps with high-yield modules, timeframes, and actionable subtasks
              </p>
            </div>
          </div>

          {/* Folder Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-purple-400" />
              <span>Target Folder:</span>
            </span>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">📁 General (No Folder)</option>
              {folders.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.icon || '📁'} {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                }`}
              >
                {cat === 'all' ? 'All Templates' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template Cards Grid */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3.5">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-gray-400">Loading verified templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 italic bg-gray-900/40 rounded-xl border border-dashed border-gray-800">
              No templates match your search criteria.
            </div>
          ) : (
            filteredTemplates.map((tpl) => {
              const isExpanded = expandedTemplateId === tpl.id;
              const tplModules = tpl.modules || tpl.milestones || [];
              const moduleCount = tplModules.length;
              const days = tpl.estimatedDays || tpl.durationDays || 90;
              const difficulty = tpl.difficulty || (tplModules.length > 25 ? 'Advanced' : tplModules.length > 15 ? 'Intermediate' : 'Beginner');
              const isCreatingThis = useTemplateMutation.isPending && useTemplateMutation.variables === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition overflow-hidden"
                >
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40">
                          {tpl.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            difficulty === 'Beginner'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : difficulty === 'Intermediate'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {difficulty}
                        </span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{days} Days</span>
                        </span>
                        {moduleCount > 0 && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-purple-400" />
                            <span>{moduleCount} Modules</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white">{tpl.title}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {moduleCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                          className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-semibold text-gray-300 transition flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Modules' : 'Preview Syllabus'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => useTemplateMutation.mutate(tpl.id)}
                        disabled={useTemplateMutation.isPending}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isCreatingThis ? 'Generating Roadmap...' : 'Use Template'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Module Syllabus Preview */}
                  {isExpanded && moduleCount > 0 && (
                    <div className="border-t border-gray-800/80 bg-gray-950/70 p-4 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                        Predefined Modules & Learning Objectives ({moduleCount}):
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {tplModules.map((m, idx) => {
                          const seq = m.sequenceNumber || m.order || idx + 1;
                          return (
                            <div
                              key={seq}
                              className="p-2.5 rounded-xl bg-gray-900 border border-gray-800/80 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">
                                  #{String(seq).padStart(2, '0')}: {m.title}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                  {m.estimatedEffort || '45 mins'}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 line-clamp-1">{m.description}</p>
                              {m.subtasks && m.subtasks.length > 0 && (
                                <div className="text-[10px] text-gray-500">
                                  {m.subtasks.length} Actionable Subtasks
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
