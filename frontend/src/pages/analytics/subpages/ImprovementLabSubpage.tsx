import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import {
  FlaskConical,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ThumbsUp,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { NewExperimentModal } from '../components/NewExperimentModal';

export const ImprovementLabSubpage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null);

  const { data: expData, isLoading } = useQuery({
    queryKey: ['experiments-list'],
    queryFn: async () => {
      const res = await api.get('/experiments');
      return res.data;
    }
  });

  const experiments = expData?.experiments || [];
  const activeExperiments = experiments.filter((e: any) => e.status === 'active' || e.status === 'planned');
  const completedExperiments = experiments.filter((e: any) => e.status === 'completed' || e.status === 'abandoned');

  // Daily adherence check-in mutation
  const logMutation = useMutation({
    mutationFn: async ({ id, adhered, notes }: { id: string; adhered: boolean; notes?: string }) => {
      const res = await api.post(`/experiments/${id}/log`, { adhered, notes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments-list'] });
    }
  });

  // Complete experiment mutation
  const completeMutation = useMutation({
    mutationFn: async ({ id, status, reflection }: { id: string; status: string; reflection?: string }) => {
      const res = await api.patch(`/experiments/${id}/complete`, { status, reflection });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments-list'] });
    }
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Loading active productivity experiments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">Productivity Improvement Lab</h3>
            <p className="text-xs text-[#94A3B8]">
              Test controlled workflow changes with automated before-and-after baseline tracking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedExperiment(null);
            setIsNewModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white transition cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Experiment</span>
        </button>
      </div>

      {/* Active Experiments Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
          Active Experiments ({activeExperiments.length})
        </h4>

        {activeExperiments.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#161E2E] border border-[#263247] text-center space-y-3">
            <FlaskConical className="w-8 h-8 text-[#8B5CF6] mx-auto opacity-70" />
            <div className="space-y-1">
              <h5 className="text-sm font-bold text-[#F8FAFC]">No active workflow experiments</h5>
              <p className="text-xs text-[#94A3B8] max-w-md mx-auto">
                Test recommendations like 45-minute phone-free focus blocks or capping daily tasks to measure actual impact on your consistency.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
            >
              Start an Experiment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeExperiments.map((exp: any) => {
              const baseline = exp.baselineMetrics || {};
              const current = exp.experimentMetrics || {};
              const comp = exp.comparisonResult || {};
              const logsCount = exp.dailyLogs?.length || 0;
              const totalDays = exp.durationDays || 14;

              return (
                <div key={exp._id} className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4 shadow-sm">
                  {/* Experiment Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          Active Test
                        </span>
                        <span className="text-xs text-[#64748B] font-mono">
                          Day {Math.min(totalDays, logsCount + 1)} of {totalDays}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[#F8FAFC]">{exp.title}</h4>
                      <p className="text-xs text-[#94A3B8]"><strong className="text-[#F8FAFC]">Rule: </strong>{exp.targetBehavior}</p>
                    </div>

                    {/* Quick Daily Check-In */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logMutation.mutate({ id: exp._id, adhered: true, notes: 'Followed target rule.' })}
                        disabled={logMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Adhered Today</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => completeMutation.mutate({ id: exp._id, status: 'completed' })}
                        disabled={completeMutation.isPending}
                        className="px-3 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#263247] text-xs font-semibold transition cursor-pointer"
                      >
                        Complete Test
                      </button>
                    </div>
                  </div>

                  {/* Before vs After Baseline Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                    {/* Metric 1: Focus Minutes */}
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
                      <span className="text-[10px] text-[#94A3B8]">Avg Focus / Day</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-[#F8FAFC]">{current.avgFocusMinutes || baseline.avgFocusMinutes}m</span>
                        <span className="text-[10px] text-[#64748B]">base: {baseline.avgFocusMinutes || 0}m</span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#10B981]">
                        {comp.focusMinutesChange >= 0 ? `+${comp.focusMinutesChange}m` : `${comp.focusMinutesChange}m`} delta
                      </div>
                    </div>

                    {/* Metric 2: Distracting Screen Time */}
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
                      <span className="text-[10px] text-[#94A3B8]">Avg Distraction</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-[#F8FAFC]">{current.avgDistractingMinutes || baseline.avgDistractingMinutes}m</span>
                        <span className="text-[10px] text-[#64748B]">base: {baseline.avgDistractingMinutes || 0}m</span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#38BDF8]">
                        {comp.distractingScreenTimeChange <= 0 ? `${comp.distractingScreenTimeChange}m` : `+${comp.distractingScreenTimeChange}m`} delta
                      </div>
                    </div>

                    {/* Metric 3: Daily Goal Progress */}
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
                      <span className="text-[10px] text-[#94A3B8]">Goal Progress Velocity</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-[#F8FAFC]">{current.avgGoalProgressDaily || baseline.avgGoalProgressDaily}%</span>
                        <span className="text-[10px] text-[#64748B]">base: {baseline.avgGoalProgressDaily || 0}%</span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#8B5CF6]">
                        {comp.goalProgressChange >= 0 ? `+${comp.goalProgressChange}%` : `${comp.goalProgressChange}%`} delta
                      </div>
                    </div>

                    {/* Metric 4: Adherence */}
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-1">
                      <span className="text-[10px] text-[#94A3B8]">Rule Adherence</span>
                      <div className="text-sm font-black text-[#10B981]">
                        {Math.round((current.avgHabitAdherence || 0.85) * 100)}%
                      </div>
                      <div className="text-[10px] text-[#64748B]">
                        {exp.dailyLogs?.filter((l: any) => l.adhered).length || 0} of {logsCount} logged days
                      </div>
                    </div>
                  </div>

                  {/* Scientific Evaluation Statement */}
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] text-[11px] text-[#94A3B8] space-y-1">
                    <div>
                      <strong className="text-[#F8FAFC]">Current Evaluation: </strong>
                      {comp.summaryEvaluation || 'Data collection in progress.'}
                    </div>
                    <div className="text-[10px] text-[#64748B] italic">
                      {comp.outcomeStatement || 'Observed comparison reflects historical trend and does not imply uncontrolled causal proof.'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Experiments Section */}
      {completedExperiments.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#263247]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
            Completed Experiments Archive ({completedExperiments.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedExperiments.map((exp: any) => (
              <div key={exp._id} className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-[#F8FAFC] truncate max-w-[220px]">{exp.title}</h5>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1C2638] text-[#94A3B8]">
                    {exp.status}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8]">{exp.comparisonResult?.summaryEvaluation || 'Completed testing window.'}</p>
                <div className="text-[10px] text-[#64748B]">
                  Ran for {exp.durationDays} days · {exp.dailyLogs?.length || 0} check-ins logged
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <NewExperimentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        prefillRecommendation={selectedExperiment}
      />
    </div>
  );
};
export default ImprovementLabSubpage;
