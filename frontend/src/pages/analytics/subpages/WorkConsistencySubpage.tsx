import React, { useState } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { ConsistencySubpage } from './ConsistencySubpage';
import { TimeFocusSubpage } from './TimeFocusSubpage';
import { Activity, Clock, Flame, Zap } from 'lucide-react';

interface WorkConsistencySubpageProps {
  onSelectDate?: (date: string) => void;
}

export const WorkConsistencySubpage: React.FC<WorkConsistencySubpageProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'habits' | 'time'>('habits');

  return (
    <div className="space-y-6">
      {/* Subpage Subtab Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-2xl bg-[#161E2E] border border-[#263247]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('habits')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'habits'
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Habit & Execution Adherence</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('time')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'time'
                ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/30'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Time & Focus Allocation</span>
          </button>
        </div>

        <span className="text-[11px] text-[#64748B] hidden sm:inline">
          {activeTab === 'habits'
            ? 'Analyzing adherence consistency, streaks, and weekday rhythm'
            : 'Analyzing focus blocks, deep work hours, and duration distribution'}
        </span>
      </div>

      {/* Render Active View */}
      {activeTab === 'habits' ? (
        <ConsistencySubpage onSelectDate={props.onSelectDate} />
      ) : (
        <TimeFocusSubpage />
      )}
    </div>
  );
};
