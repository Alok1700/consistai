import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../UI/Modal';
import { Goal } from '../../types';
import { CheckSquare, Calendar, Clock, Target, Flag } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

const getLocalTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultDate
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate || getLocalTodayString());
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [taskType, setTaskType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [goalId, setGoalId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Goals for linking
  const { data: goalsData } = useQuery({
    queryKey: ['active-goals-dropdown'],
    queryFn: () => api.get('/goals').then((r) => r.data?.goals || []),
    enabled: isOpen
  });

  const goals: Goal[] = goalsData || [];

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/tasks', {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        priority,
        estimatedMinutes: Number(estimatedMinutes) || 45,
        taskType,
        goal: goalId || null,
        isGoalRelevant: Boolean(goalId)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-today'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setGoalId('');
      setErrorMsg(null);
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create task');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Task title is required');
      return;
    }
    setErrorMsg(null);
    createMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Task Title <span className="text-[#8B5CF6]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solve 3 Binary Tree medium questions"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Add relevant notes or problem URLs..."
            className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Date & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Duration & Cadence */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Estimated Duration (mins)
            </label>
            <input
              type="number"
              min={5}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm font-mono focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Cadence</label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="daily">Daily Task</option>
              <option value="weekly">Weekly Target</option>
              <option value="monthly">Monthly Milestone</option>
            </select>
          </div>
        </div>

        {/* Link to Goal */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Linked Goal (Optional)
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="">No goal linked (standalone task)</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title} ({g.currentProgressPercentage || 0}%)
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263247]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] text-[#94A3B8] text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !title.trim()}
            className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
