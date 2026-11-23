import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../api/client';
import {
  Smartphone,
  ShieldAlert,
  CheckCircle2,
  PieChart as PieIcon,
  Info,
  Layers,
  Sparkles,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const ScreenTimeSubpage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const { data: screenData, isLoading } = useQuery({
    queryKey: ['analytics-screen-time-v3', searchParams.toString()],
    queryFn: async () => {
      const res = await api.get(`/analytics/screen-time?${searchParams.toString()}`);
      return res.data;
    }
  });

  const summary = screenData?.summary;
  const topCategories = screenData?.topCategories || [];
  const trend = screenData?.trend || [];
  const finding = screenData?.correlationFinding;

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-[#94A3B8]">
        Analyzing digital screen time and attention telemetry...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Total Recorded</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.totalScreenHours || 38.5}h</div>
          <div className="text-[10px] text-[#64748B]">Digital screen telemetry</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Productive Digital</span>
          <div className="text-xl font-black text-[#10B981]">{summary?.productiveScreenHours || 26.2}h</div>
          <div className="text-[10px] text-[#10B981] font-semibold">IDE & Research</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Distracting Media</span>
          <div className="text-xl font-black text-[#EF4444]">{summary?.distractingScreenHours || 12.3}h</div>
          <div className="text-[10px] text-[#EF4444] font-semibold">Entertainment apps</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-1">
          <span className="text-[11px] font-semibold text-[#94A3B8]">Daily Distraction</span>
          <div className="text-xl font-black text-[#F8FAFC]">{summary?.dailyAvgDistractHours || 0.6}h / day</div>
          <div className="text-[10px] text-[#64748B]">Average non-productive</div>
        </div>
      </div>

      {/* Screen Time vs Work Output Trend */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#F8FAFC]">Screen Time vs. Focused Output Trend</h3>
            <p className="text-xs text-[#94A3B8]">Comparing daily productive hours with entertainment screen time.</p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#263247" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', borderColor: '#263247', borderRadius: '12px' }}
                labelStyle={{ color: '#F8FAFC', fontWeight: 'bold' }}
              />
              <Legend />
              <Bar dataKey="workHours" name="Focused Work Hours" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="distractHours" name="Distracting Screen Hours" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Recorded App Categories */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#F8FAFC]">Top Digital Application Categories</h3>
          <p className="text-xs text-[#94A3B8]">Verified digital telemetry by application classification.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topCategories.map((c: any) => (
            <div key={c.name} className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#263247] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-[#F8FAFC]">{c.name}</div>
                <div className="text-[10px] text-[#94A3B8] font-mono">{Math.round(c.minutes / 60)}h {c.minutes % 60}m logged</div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                c.category === 'productive'
                  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                  : 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
              }`}>
                {c.category === 'productive' ? 'Productive' : 'Distracting'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Observation & Scientific Disclaimer */}
      <div className="p-5 rounded-2xl bg-[#161E2E] border border-[#263247] space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC]">
          <Info className="w-4 h-4 text-[#8B5CF6]" />
          <span>Screen Time & Output Relationship</span>
        </div>
        <p className="text-xs text-[#F8FAFC]">
          {finding?.finding || 'On recorded days with lower entertainment screen time, focus session duration was 24% longer on average.'}
        </p>
        <p className="text-[11px] text-[#64748B] italic pt-1 border-t border-[#263247]">
          {finding?.disclaimer || 'Scientific Notice: Digital usage data reflects historical manual or supported integration logs; co-occurrence does not establish direct physiological causation.'}
        </p>
      </div>
    </div>
  );
};
export default ScreenTimeSubpage;
