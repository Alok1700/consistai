import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ScreenTimeRecord } from '../types';
import { Modal } from '../components/UI/Modal';
import {
  Smartphone,
  Upload,
  Plus,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  Clock,
  Sparkles,
  PieChart as PieIcon,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';

export const ScreenTimePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');

  // Manual Form
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [productiveMins, setProductiveMins] = useState(120);
  const [distractingMins, setDistractingMins] = useState(60);

  const { data: screenData, isLoading } = useQuery<{
    totals: any;
    topApps: any[];
    records: ScreenTimeRecord[];
  }>({
    queryKey: ['screen-time'],
    queryFn: async () => {
      const res = await api.get('/screentime');
      return res.data;
    }
  });

  const manualLogMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/screentime', {
        date: entryDate,
        productiveMinutes: Number(productiveMins),
        distractingMinutes: Number(distractingMins),
        totalMinutes: Number(productiveMins) + Number(distractingMins)
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-time'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      setIsManualModalOpen(false);
    }
  });

  const csvImportMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/screentime/import-csv', { csvContent });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['screen-time'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
      setIsCSVModalOpen(false);
      setCsvContent('');
    }
  });

  const totals = screenData?.totals;
  const topApps = screenData?.topApps || [];
  const records = screenData?.records || [];

  // Chart data (chronological order)
  const chartData = [...records].reverse().slice(-14).map((r) => ({
    date: r.date.slice(5),
    Productive: r.productiveMinutes,
    Distracting: r.distractingMinutes
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#263247] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-[#8B5CF6]" />
            <span>Digital Screen Time</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
            Balance productive coding/learning sessions against recreational screen time.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCSVModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] text-[#94A3B8] hover:text-[#F8FAFC] font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-[#8B5CF6]" />
            <span>CSV Import</span>
          </button>
          <button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs shadow-md shadow-[#8B5CF6]/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Daily Usage</span>
          </button>
        </div>
      </div>

      {/* Browser Privacy Notice */}
      <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247] flex items-start gap-3 text-xs text-[#94A3B8]">
        <ShieldAlert className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#F8FAFC] font-semibold">Data Source & Privacy Architecture: </strong>
          Due to operating system privacy sandboxing, web applications cannot automatically spy on device apps.
          ConsistAI supports intentional daily entry and direct CSV imports exported from Android Digital Wellbeing or iOS Screen Time.
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Total Tracked Time
          </span>
          <span className="text-2xl font-black text-[#F8FAFC] mt-0.5 block">
            {totals?.totalHours || 0} hrs
          </span>
          <p className="text-[10px] text-[#64748B] mt-0.5">{records.length} logged days</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Productive Hours
          </span>
          <span className="text-2xl font-black text-[#10B981] mt-0.5 block">
            {totals?.productiveHours || 0} hrs
          </span>
          <p className="text-[10px] text-[#10B981] mt-0.5">VS Code, Docs, LeetCode</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Distracting Hours
          </span>
          <span className="text-2xl font-black text-[#EF4444] mt-0.5 block">
            {totals?.distractingHours || 0} hrs
          </span>
          <p className="text-[10px] text-[#EF4444] mt-0.5">Social feeds, passive video</p>
        </div>

        <div className="p-4 rounded-xl bg-[#161E2E] border border-[#263247]">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
            Avg Daily Distraction
          </span>
          <span className="text-2xl font-black text-[#F59E0B] mt-0.5 block">
            {totals?.avgDailyDistractionMinutes || 0}m
          </span>
          <p className="text-[10px] text-[#64748B] mt-0.5">Target: &lt; 60 mins/day</p>
        </div>
      </div>

      {/* Chart: Productive vs Distracting Bar Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-[#263247]/60">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">
              Daily Usage Distribution (Minutes)
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Comparison between productive focus and distracting screen time over the last 14 days
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263247" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#263247',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Productive" fill="#10B981" radius={[4, 4, 0, 0]} name="Productive (mins)" />
                <Bar dataKey="Distracting" fill="#EF4444" radius={[4, 4, 0, 0]} name="Distracting (mins)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#64748B]">
              No screen time data logged yet. Click "Log Daily Usage" to begin.
            </div>
          )}
        </div>
      </div>

      {/* App-wise Breakdown */}
      {topApps.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#F8FAFC]">Top Applications & Category Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topApps.map((app) => (
              <div
                key={app.appName}
                className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#F8FAFC]">{app.appName}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        app.isDistracting
                          ? 'bg-[#EF4444]/15 text-[#EF4444]'
                          : 'bg-[#10B981]/15 text-[#10B981]'
                      }`}
                    >
                      {app.isDistracting ? 'Distracting' : 'Productive'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-0.5">{app.category}</p>
                </div>
                <span className="font-mono font-bold text-[#F8FAFC]">
                  {Math.round(app.totalMinutes / 60)} hrs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Log Daily Screen Time"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Productive Minutes
              </label>
              <input
                type="number"
                value={productiveMins}
                onChange={(e) => setProductiveMins(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
              <span className="text-[10px] text-[#64748B]">IDE, LeetCode, Docs</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Distracting Minutes
              </label>
              <input
                type="number"
                value={distractingMins}
                onChange={(e) => setDistractingMins(Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white text-sm font-mono focus:outline-none focus:border-[#8B5CF6]"
              />
              <span className="text-[10px] text-[#64748B]">Social media, feeds</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => manualLogMutation.mutate()}
            disabled={manualLogMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition shadow-md shadow-[#8B5CF6]/20 disabled:opacity-50 cursor-pointer"
          >
            {manualLogMutation.isPending ? 'Saving...' : 'Save Daily Record'}
          </button>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        title="Import Screen Time CSV"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#94A3B8] leading-relaxed">
            Paste exported CSV content formatted as:<br />
            <code className="text-[#8B5CF6] font-mono text-[11px] block mt-1 p-2 rounded-lg bg-[#0B0F19] border border-[#263247]">
              date,totalMinutes,productiveMinutes,distractingMinutes<br />
              2026-11-14,240,160,80<br />
              2026-11-15,190,140,50
            </code>
          </p>

          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            rows={6}
            placeholder="date,totalMinutes,productiveMinutes,distractingMinutes..."
            className="w-full px-3 py-2 rounded-xl bg-[#0B0F19] border border-[#263247] text-white font-mono text-xs focus:outline-none focus:border-[#8B5CF6]"
          />

          <button
            type="button"
            onClick={() => csvImportMutation.mutate()}
            disabled={!csvContent || csvImportMutation.isPending}
            className="w-full py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs transition shadow-md shadow-[#8B5CF6]/20 disabled:opacity-50 cursor-pointer"
          >
            {csvImportMutation.isPending ? 'Importing...' : 'Import CSV Data'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
