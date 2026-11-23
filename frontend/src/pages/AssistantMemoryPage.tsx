import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Calendar,
  Tag
} from 'lucide-react';

interface Memory {
  _id: string;
  category: 'preference' | 'learning_goal' | 'important_date' | 'commitment' | 'fact' | 'work_rhythm';
  content: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
  confirmationStatus: string;
  createdAt: string;
}

export const AssistantMemoryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('preference');
  const [newImportance, setNewImportance] = useState<Memory['importance']>('medium');

  // Fetch Memories
  const { data: memoriesData, isLoading } = useQuery<{ memories: Memory[] }>({
    queryKey: ['assistant-memories'],
    queryFn: async () => {
      const res = await api.get('/assistant/memories');
      return res.data;
    }
  });

  const memories = memoriesData?.memories || [];

  // Create Memory Mutation
  const createMemoryMutation = useMutation({
    mutationFn: async (data: { category: string; content: string; importance: string }) => {
      return await api.post('/assistant/memories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-memories'] });
      setIsAddModalOpen(false);
      setNewContent('');
    }
  });

  // Delete Memory Mutation
  const deleteMemoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/assistant/memories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant-memories'] });
    }
  });

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch = m.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Memories' },
    { id: 'preference', label: 'Preferences' },
    { id: 'learning_goal', label: 'Learning Goals' },
    { id: 'commitment', label: 'Commitments' },
    { id: 'work_rhythm', label: 'Work Rhythm' },
    { id: 'important_date', label: 'Dates & Deadlines' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263247] pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => navigate('/assistant')}
            className="flex items-center gap-1.5 text-xs text-[#8B5CF6] hover:text-[#A78BFA] font-semibold transition cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assistant</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Persistent Memory Manager
              </h1>
              <p className="text-xs text-[#94A3B8]">
                Review, edit, or delete facts, habits, and preferences that ConsistAI remembers about you.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] font-semibold text-xs transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Memory</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'bg-[#161E2E] border border-[#263247] text-[#94A3B8] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search remembered facts..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#161E2E] border border-[#263247] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>
      </div>

      {/* Memories Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[#94A3B8]">Loading memories...</div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#161E2E] border border-[#263247] text-xs text-[#94A3B8] space-y-2">
          <Brain className="w-8 h-8 text-[#64748B] mx-auto opacity-50" />
          <p>No memories found matching the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((m) => (
            <div
              key={m._id}
              className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] hover:border-[#8B5CF6]/40 transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                    {m.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {m.importance}
                  </span>
                </div>
                <p className="text-xs text-white leading-relaxed">{m.content}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#263247] text-[11px] text-[#64748B]">
                <span>Logged {new Date(m.createdAt).toLocaleDateString()}</span>
                <button
                  type="button"
                  onClick={() => deleteMemoryMutation.mutate(m._id)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] transition cursor-pointer"
                  title="Forget Memory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161E2E] border border-[#263247] rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#8B5CF6]" />
              <span>Record Personal Memory</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="preference">Preference</option>
                  <option value="learning_goal">Learning Goal</option>
                  <option value="commitment">Commitment</option>
                  <option value="work_rhythm">Work Rhythm</option>
                  <option value="important_date">Important Date</option>
                </select>
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Memory Content</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g., I study best between 7am and 10am without interruptions"
                  className="w-full p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-white placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] mb-1 font-semibold">Importance</label>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#111827] border border-[#263247] text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#263247]">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#94A3B8] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newContent.trim()) {
                    createMemoryMutation.mutate({
                      category: newCategory,
                      content: newContent.trim(),
                      importance: newImportance
                    });
                  }
                }}
                disabled={!newContent.trim()}
                className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white hover:bg-[#7C3AED] disabled:opacity-40 text-xs font-semibold transition cursor-pointer"
              >
                Save Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
