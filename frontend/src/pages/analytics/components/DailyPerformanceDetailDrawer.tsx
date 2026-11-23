import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../api/client';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone,
  Target,
  Coffee,
  ListTodo,
  Layers
} from 'lucide-react';

interface DailyPerformanceDetailDrawerProps {
  date: string | null;
  onClose: () => void;
}

export const DailyPerformanceDetailDrawer: React.FC<DailyPerformanceDetailDrawerProps> = ({
  date,
  onClose
}) => {
  const { data: dayData, isLoading } = useQuery({
    queryKey: ['day-performance-detail', date],
    queryFn: async () => {
      if (!date) return null;
      const res = await api.get(`/analytics/day/${date}`);
      return res.data;
    },
    enabled: !!date
  });

  if (!date) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#111827] border-l border-[#263247] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#263247] flex items-center justify-between bg-[#161E2E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F8FAFC]">
                {new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {dayData?.isRestDay ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1">
                    <Coffee className="w-3 h-3" /> Scheduled Rest Day
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                    Active Working Day
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#94A3B8]">
              Loading day activity telemetry...
            </div>
          ) : (
            <>
              {/* Consistency Score & Breakdown */}
              <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#94A3B8]">Daily Consistency Score</span>
                  <span className="text-base font-black text-[#8B5CF6]">
                    {dayData?.consistencyScore || 80}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#263247] text-xs">
                  <div className="p-2 rounded-xl bg-[#0B0F19] border border-[#263247]">
                    <div className="text-[10px] text-[#64748B]">Habits (35%)</div>
                    <div className="font-bold text-[#10B981]">{dayData?.scoreBreakdown?.habitScore ?? 85}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0B0F19] border border-[#263247]">
                    <div className="text-[10px] text-[#64748B]">Tasks (30%)</div>
                    <div className="font-bold text-[#38BDF8]">{dayData?.scoreBreakdown?.taskScore ?? 80}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0B0F19] border border-[#263247]">
                    <div className="text-[10px] text-[#64748B]">Focus Target (20%)</div>
                    <div className="font-bold text-[#F59E0B]">{dayData?.scoreBreakdown?.focusScore ?? 90}%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-[#0B0F19] border border-[#263247]">
                    <div className="text-[10px] text-[#64748B]">Goal Work (15%)</div>
                    <div className="font-bold text-[#8B5CF6]">{dayData?.scoreBreakdown?.goalWorkScore ?? 75}%</div>
                  </div>
                </div>
              </div>

              {/* Tasks Planned vs Completed */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Planned Tasks
                  </span>
                  <span className="text-[#94A3B8]">
                    {dayData?.completedTasksCount || 0} / {dayData?.plannedTasksCount || 0} completed
                  </span>
                </div>

                {dayData?.tasks && dayData.tasks.length > 0 ? (
                  <div className="space-y-1.5">
                    {dayData.tasks.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-[#161E2E] border border-[#263247] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 ${
                              t.status === 'completed' ? 'text-[#10B981]' : 'text-[#64748B]'
                            }`}
                          />
                          <span className={`truncate ${t.status === 'completed' ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C2638] text-[#94A3B8] shrink-0 font-medium">
                          {t.priority || 'medium'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic p-3 rounded-xl bg-[#161E2E]/50 border border-[#263247]/50">
                    No individual tasks scheduled for this date.
                  </p>
                )}
              </div>

              {/* Completed Habits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                    Habits Completed
                  </span>
                  <span className="text-[#94A3B8]">{dayData?.habits?.length || 0} checked in</span>
                </div>

                {dayData?.habits && dayData.habits.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {dayData.habits.map((h: any) => (
                      <span
                        key={h.id}
                        className="px-2.5 py-1 rounded-lg bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-xs font-medium"
                      >
                        ✓ {h.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic p-3 rounded-xl bg-[#161E2E]/50 border border-[#263247]/50">
                    No habits logged for this date.
                  </p>
                )}
              </div>

              {/* Focus Sessions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F8FAFC] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Recorded Focus Sessions
                  </span>
                  <span className="text-[#94A3B8]">{dayData?.sessions?.length || 0} sessions</span>
                </div>

                {dayData?.sessions && dayData.sessions.length > 0 ? (
                  <div className="space-y-1.5">
                    {dayData.sessions.map((s: any) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-[#161E2E] border border-[#263247] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-medium text-[#F8FAFC]">
                            {s.goalTitle || 'General Focus Block'}
                          </div>
                          {s.milestoneTitle && (
                            <div className="text-[10px] text-[#94A3B8]">{s.milestoneTitle}</div>
                          )}
                        </div>
                        <span className="font-mono font-bold text-[#F59E0B]">
                          {s.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic p-3 rounded-xl bg-[#161E2E]/50 border border-[#263247]/50">
                    No timer focus sessions recorded on this date.
                  </p>
                )}
              </div>

              {/* Screen Time Telemetry */}
              <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
                  <Smartphone className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span>Digital Screen Time Breakdown</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">Productive Usage</div>
                    <div className="font-bold text-[#10B981]">
                      {dayData?.screenTime?.productiveMinutes || 0}m
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8]">Distracting Media</div>
                    <div className="font-bold text-[#EF4444]">
                      {dayData?.screenTime?.distractingMinutes || 0}m
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#263247] bg-[#161E2E]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-bold text-[#F8FAFC] transition cursor-pointer"
          >
            Close Day Details
          </button>
        </div>
      </div>
    </div>
  );
};
export default DailyPerformanceDetailDrawer;
