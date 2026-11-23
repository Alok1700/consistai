import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../api/client';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Printer,
  Save,
  Target,
  FlaskConical,
  Coffee,
  Info
} from 'lucide-react';

export const MonthlyReportsSubpage: React.FC = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Reflection form local state
  const [achievements, setAchievements] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextMonthPriorities, setNextMonthPriorities] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['monthly-report-v3', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await api.get(`/analytics/monthly-report?year=${selectedYear}&month=${selectedMonth}`);
      if (res.data.reflection) {
        setAchievements(res.data.reflection.achievements || '');
        setDifficulties(res.data.reflection.difficulties || '');
        setImprovements(res.data.reflection.improvements || '');
        setNextMonthPriorities(res.data.reflection.nextMonthPriorities || '');
      }
      return res.data;
    }
  });

  const saveReflectionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/analytics/monthly-reflection', payload);
      return res.data;
    },
    onSuccess: () => {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['monthly-report-v3', selectedYear, selectedMonth] });
    }
  });

  const summary = reportData?.summary;
  const goals = reportData?.goals || [];
  const experiments = reportData?.experiments || [];

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    saveReflectionMutation.mutate({
      year: selectedYear,
      month: selectedMonth,
      achievements,
      difficulties,
      improvements,
      nextMonthPriorities
    });
  };

  const handleDownloadCsv = () => {
    window.open(`/api/analytics/export?format=csv&range=this_month`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Generating monthly productivity report and historical synthesis...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month & Year Filter Bar with Export Actions */}
      <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6]">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs font-bold text-[#F8FAFC] outline-none cursor-pointer"
            >
              <option value={1}>January</option>
              <option value={2}>February</option>
              <option value={3}>March</option>
              <option value={4}>April</option>
              <option value={5}>May</option>
              <option value={6}>June</option>
              <option value={7}>July</option>
              <option value={8}>August</option>
              <option value={9}>September</option>
              <option value={10}>October</option>
              <option value={11}>November</option>
              <option value={12}>December</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs font-bold text-[#F8FAFC] outline-none cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* SECTION A: MONTHLY SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Days in Month</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.totalDaysInMonth || 30}</div>
          <div className="text-[10px] text-[#64748B]">{summary?.daysLogged || 28} days logged</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Working Days</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.scheduledWorkingDays || 26}</div>
          <div className="text-[10px] text-[#10B981] font-semibold">{summary?.restDaysCount || 4} rest days</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Avg Consistency</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.avgConsistencyScore || 84}%</div>
          <div className="text-[10px] text-[#8B5CF6] font-semibold">Monthly average</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Focus Hours</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.totalWorkHours || 52.4}h</div>
          <div className="text-[10px] text-[#38BDF8] font-semibold">{summary?.avgDailyWorkMinutes || 105}m / day</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Tasks Completed</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.totalTasksDone || 48}</div>
          <div className="text-[10px] text-[#64748B]">Planned items</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Modules Done</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.totalModulesDone || 14}</div>
          <div className="text-[10px] text-[#F59E0B] font-semibold">Checklist records</div>
        </div>
      </div>

      {/* SECTION B: GOAL ACHIEVEMENTS */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <h4 className="text-sm font-bold text-[#F8FAFC]">Goal Milestone Achievements</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {goals.map((g: any) => (
            <div key={g.id} className="p-4 rounded-xl bg-[#0B0F19] border border-[#263247] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#F8FAFC] truncate max-w-[180px]">{g.title}</span>
                <span className="text-xs font-mono font-bold text-[#8B5CF6]">{g.progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#161E2E] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#38BDF8] rounded-full"
                  style={{ width: `${Math.min(100, g.progress)}%` }}
                />
              </div>
              <div className="text-[11px] text-[#94A3B8]">{g.status === 'completed' ? '✓ Completed' : 'Active trajectory'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION F: IMPROVEMENTS TESTED */}
      {experiments.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-[#8B5CF6]" />
            <h4 className="text-sm font-bold text-[#F8FAFC]">Improvements Tested During Month</h4>
          </div>
          <div className="space-y-2">
            {experiments.map((exp: any) => (
              <div key={exp.id} className="p-3 rounded-xl bg-[#0B0F19] border border-[#263247] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#F8FAFC]">{exp.title}</div>
                  <div className="text-[11px] text-[#94A3B8]">{exp.outcome}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1C2638] text-[#94A3B8]">{exp.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION G: MONTHLY REFLECTION FORM */}
      <form onSubmit={handleSaveReflection} className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-[#F8FAFC]">Monthly Qualitative Reflection</h4>
            <p className="text-xs text-[#94A3B8]">Record personal observations to contextualize data trends for future review.</p>
          </div>
          {isSaved && (
            <span className="text-xs font-bold text-[#10B981] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Reflection Saved!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-[#F8FAFC]">Biggest Achievement</label>
            <textarea
              rows={2}
              value={achievements}
              onChange={(e) => setAchievements(e.target.value)}
              placeholder="e.g., Completed all Sliding Window & Two Pointer problems on schedule."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#F8FAFC]">Main Difficulty Encountered</label>
            <textarea
              rows={2}
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              placeholder="e.g., Afternoon energy drops after lunch reduced sprint duration."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#F8FAFC]">What Worked Well</label>
            <textarea
              rows={2}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="e.g., 45-minute phone-free focus blocks before checking email."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-[#F8FAFC]">Next Month's Top Priorities</label>
            <textarea
              rows={2}
              value={nextMonthPriorities}
              onChange={(e) => setNextMonthPriorities(e.target.value)}
              placeholder="e.g., Begin Trees & Graphs milestone; maintain 85% consistency."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saveReflectionMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveReflectionMutation.isPending ? 'Saving...' : 'Save Reflection'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
export default MonthlyReportsSubpage;
