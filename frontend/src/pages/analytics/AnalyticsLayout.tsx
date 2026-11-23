import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import {
  Activity,
  Target,
  FlaskConical,
  FileText,
  BarChart2,
  Compass,
  Sliders,
  X,
  ExternalLink
} from 'lucide-react';
import { AnalyticsFilterBar } from './components/AnalyticsFilterBar';
import { DailyPerformanceDetailDrawer } from './components/DailyPerformanceDetailDrawer';
import { NewExperimentModal } from './components/NewExperimentModal';
import { ChartSuggestionsSubpage } from './subpages/ChartSuggestionsSubpage';
import { AdvancedAnalysisSubpage } from './subpages/AdvancedAnalysisSubpage';

// 5 Core Sections for ConsistAI
const coreSubpages = [
  { path: '/analytics/overview', label: 'Overview', icon: BarChart2, aliases: ['/analytics'] },
  { path: '/analytics/work-consistency', label: 'Work & Consistency', icon: Activity, aliases: ['/analytics/consistency', '/analytics/time-focus'] },
  { path: '/analytics/goal-performance', label: 'Goal Performance', icon: Target, aliases: ['/analytics/goals'] },
  { path: '/analytics/improve', label: 'Improve My Workflow', icon: FlaskConical, aliases: ['/analytics/improvement-lab'] },
  { path: '/analytics/reports', label: 'Reports', icon: FileText, aliases: [] }
];

export const AnalyticsLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedDateForDrawer, setSelectedDateForDrawer] = useState<string | null>(null);
  const [labPrefillExperiment, setLabPrefillExperiment] = useState<any | null>(null);
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'chart-guide' | 'advanced' | null>(null);

  // Fetch goals list for the global filter bar
  const { data: goalsData } = useQuery({
    queryKey: ['filter-bar-goals'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  const goals = goalsData?.goals || [];

  const handleExportCsv = () => {
    window.open(`/api/analytics/export?format=csv&${searchParams.toString()}`, '_blank');
  };

  const handleExportJson = () => {
    window.open(`/api/analytics/export?format=json&${searchParams.toString()}`, '_blank');
  };

  const handleTestInLab = (rec: any) => {
    setLabPrefillExperiment(rec);
    setIsLabModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Analytics Page Title & Subtitle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Productivity Intelligence & Analytics
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Deterministic progress calculations, velocity telemetry, and ML-powered workflow optimization.
          </p>
        </div>
      </div>

      {/* Global Shared Filter Bar */}
      <AnalyticsFilterBar
        goals={goals}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
      />

      {/* 5 Core Tabs + Quick-Access Drawers Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263247] pb-1">
        {/* Core 5 Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {coreSubpages.map((tab) => {
            const Icon = tab.icon;
            const isMatch = location.pathname === tab.path ||
              tab.aliases.some((alias) => location.pathname === alias);

            return (
              <NavLink
                key={tab.path}
                to={`${tab.path}${location.search}`}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isMatch
                    ? 'bg-[#8B5CF6] text-white shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#161E2E]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Secondary Expandable Drawers: Chart Guide & Advanced Analysis */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerType('chart-guide')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] transition cursor-pointer"
            title="Open Chart Suggestions & Decision Matrix"
          >
            <Compass className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Chart Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerType('advanced')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] bg-[#161E2E] hover:bg-[#1C2638] border border-[#263247] transition cursor-pointer"
            title="Open Advanced Statistical & ML Telemetry"
          >
            <Sliders className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Advanced ML</span>
          </button>
        </div>
      </div>

      {/* Render Current Subpage via Outlet Context */}
      <Outlet
        context={{
          onSelectDate: (date: string) => setSelectedDateForDrawer(date),
          onTestInLab: handleTestInLab
        }}
      />

      {/* Daily Performance Detail Drawer */}
      <DailyPerformanceDetailDrawer
        date={selectedDateForDrawer}
        onClose={() => setSelectedDateForDrawer(null)}
      />

      {/* Global New Experiment Modal */}
      <NewExperimentModal
        isOpen={isLabModalOpen}
        onClose={() => {
          setIsLabModalOpen(false);
          setLabPrefillExperiment(null);
        }}
        prefillRecommendation={labPrefillExperiment}
      />

      {/* Expandable Slide-over Drawer for Chart Guide & Advanced Analysis */}
      {drawerType && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[#0B0F19] border-l border-[#263247] h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#263247] flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-2">
                {drawerType === 'chart-guide' ? (
                  <>
                    <Compass className="w-5 h-5 text-[#8B5CF6]" />
                    <div>
                      <h2 className="text-sm font-bold text-[#F8FAFC]">Chart Suggestions & Decision Matrix</h2>
                      <p className="text-[11px] text-[#94A3B8]">Comparison, Distribution, Composition, and Relationship taxonomy</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Sliders className="w-5 h-5 text-[#38BDF8]" />
                    <div>
                      <h2 className="text-sm font-bold text-[#F8FAFC]">Advanced Telemetry & ML Diagnostics</h2>
                      <p className="text-[11px] text-[#94A3B8]">Deep behavioral regressions, velocity correlations, and predictive pacing</p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const path = drawerType === 'chart-guide' ? '/analytics/chart-suggestions' : '/analytics/advanced';
                    setDrawerType(null);
                    navigate(path);
                  }}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition text-xs flex items-center gap-1"
                  title="Open as full page"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerType(null)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1C2638] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {drawerType === 'chart-guide' ? (
                <ChartSuggestionsSubpage />
              ) : (
                <AdvancedAnalysisSubpage />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AnalyticsLayout;
