import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Modal } from '../UI/Modal';
import { Goal } from '../../types';
import { Flame, Clock, Target, Calendar } from 'lucide-react';

interface CreateHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CreateHabitModal: React.FC<CreateHabitModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('DSA & Coding');
  const [frequency, setFrequency] = useState('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(ALL_DAYS);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>('anytime');
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: goalsData } = useQuery({
    queryKey: ['active-goals-dropdown'],
    queryFn: () => api.get('/goals').then((r) => r.data?.goals || []),
    enabled: isOpen
  });

  const goals: Goal[] = goalsData || [];

  const toggleDay = (day: string) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/habits', {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        frequency,
        daysOfWeek,
        timeOfDay,
        goal: selectedGoalId || null
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      setTitle('');
      setDescription('');
      setSelectedGoalId('');
      setErrorMsg(null);
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create habit');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Habit title is required');
      return;
    }
    setErrorMsg(null);
    createMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Habit">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs">
            {errorMsg}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Habit Name <span className="text-[#8B5CF6]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solve at least 1 LeetCode problem"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            autoFocus
          />
        </div>

        {/* Category & Time of Day */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="DSA & Coding">DSA & Coding</option>
              <option value="Web Development">Web Development</option>
              <option value="System Design">System Design</option>
              <option value="Academic Coursework">Academic Coursework</option>
              <option value="Research / Minor Project">Research / Minor Project</option>
              <option value="Health & Fitness">Health & Fitness</option>
              <option value="Reading & Learning">Reading & Learning</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Preferred Time</label>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="anytime">Anytime during day</option>
              <option value="morning">Morning routine</option>
              <option value="afternoon">Afternoon study</option>
              <option value="evening">Evening focus</option>
            </select>
          </div>
        </div>

        {/* Days of Week */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
            Active Schedule
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ALL_DAYS.map((day) => {
              const isSelected = daysOfWeek.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'bg-[#0B0F19] text-[#64748B] border border-[#263247] hover:text-[#94A3B8]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Link to Goal */}
        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
            Linked Goal (Optional)
          </label>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-[#F8FAFC] text-sm focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="">No linked goal</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id}>
                {g.title}
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
            {createMutation.isPending ? 'Creating...' : 'Create Habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
