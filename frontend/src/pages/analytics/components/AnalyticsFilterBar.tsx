import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Filter, GitCompare, Download, Target, ChevronDown } from 'lucide-react';

interface GoalOption {
  _id: string;
  title: string;
}

interface AnalyticsFilterBarProps {
  goals?: GoalOption[];
  onExportCsv?: () => void;
  onExportJson?: () => void;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  goals = [],
  onExportCsv,
  onExportJson
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const range = searchParams.get('range') || '30d';
  const goalId = searchParams.get('goalId') || 'all';
  const category = searchParams.get('category') || 'all';
  const compare = searchParams.get('compare') || 'previous';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all' && (key === 'goalId' || key === 'category')) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#161E2E] border border-[#263247] shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs">
          <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span className="text-[#94A3B8]">Range:</span>
          <select
            value={range}
            onChange={(e) => updateParam('range', e.target.value)}
            className="bg-transparent text-[#F8FAFC] font-medium outline-none cursor-pointer text-xs"
          >
            <option value="today" className="bg-[#161E2E]">Today</option>
            <option value="7d" className="bg-[#161E2E]">Last 7 Days</option>
            <option value="30d" className="bg-[#161E2E]">Last 30 Days</option>
            <option value="90d" className="bg-[#161E2E]">Last 90 Days</option>
            <option value="this_month" className="bg-[#161E2E]">This Month</option>
            <option value="last_month" className="bg-[#161E2E]">Last Month</option>
            <option value="all" className="bg-[#161E2E]">All Time</option>
          </select>
        </div>

        {/* Goal Selector */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs">
          <Target className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-[#94A3B8]">Goal:</span>
          <select
            value={goalId}
            onChange={(e) => updateParam('goalId', e.target.value)}
            className="bg-transparent text-[#F8FAFC] font-medium outline-none cursor-pointer max-w-[140px] truncate text-xs"
          >
            <option value="all" className="bg-[#161E2E]">All Goals</option>
            {goals.map((g) => (
              <option key={g._id} value={g._id} className="bg-[#161E2E]">
                {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs">
          <Filter className="w-3.5 h-3.5 text-[#10B981]" />
          <span className="text-[#94A3B8]">Category:</span>
          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            className="bg-transparent text-[#F8FAFC] font-medium outline-none cursor-pointer text-xs"
          >
            <option value="all" className="bg-[#161E2E]">All Categories</option>
            <option value="Engineering" className="bg-[#161E2E]">Engineering</option>
            <option value="Algorithms" className="bg-[#161E2E]">Algorithms</option>
            <option value="Learning" className="bg-[#161E2E]">Learning</option>
            <option value="Career" className="bg-[#161E2E]">Career</option>
            <option value="Health" className="bg-[#161E2E]">Health</option>
          </select>
        </div>

        {/* Comparison Mode */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0F19] border border-[#263247] text-xs">
          <GitCompare className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="text-[#94A3B8]">Compare:</span>
          <select
            value={compare}
            onChange={(e) => updateParam('compare', e.target.value)}
            className="bg-transparent text-[#F8FAFC] font-medium outline-none cursor-pointer text-xs"
          >
            <option value="previous" className="bg-[#161E2E]">Previous Period</option>
            <option value="target" className="bg-[#161E2E]">Personal Target (85%)</option>
            <option value="none" className="bg-[#161E2E]">No Comparison</option>
          </select>
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
            title="Download CSV dataset"
          >
            <Download className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>CSV</span>
          </button>
        )}
        {onExportJson && (
          <button
            type="button"
            onClick={onExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#202B3D] border border-[#263247] text-xs font-semibold text-[#F8FAFC] transition cursor-pointer"
            title="Download JSON dataset"
          >
            <Download className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>JSON</span>
          </button>
        )}
      </div>
    </div>
  );
};
export default AnalyticsFilterBar;
