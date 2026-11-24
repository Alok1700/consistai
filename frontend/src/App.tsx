import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';

import { AppLayout } from './components/Layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { GoalDetailPage } from './pages/GoalDetailPage';
import { TasksPage } from './pages/TasksPage';
import { HabitsPage } from './pages/HabitsPage';
import { TimerPage } from './pages/TimerPage';
import { ScreenTimePage } from './pages/ScreenTimePage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AssistantPage } from './pages/AssistantPage';
import { AssistantMemoryPage } from './pages/AssistantMemoryPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

import { AnalyticsLayout } from './pages/analytics/AnalyticsLayout';
import { OverviewSubpage } from './pages/analytics/subpages/OverviewSubpage';
import { WorkConsistencySubpage } from './pages/analytics/subpages/WorkConsistencySubpage';
import { ConsistencySubpage } from './pages/analytics/subpages/ConsistencySubpage';
import { TimeFocusSubpage } from './pages/analytics/subpages/TimeFocusSubpage';
import { GoalProgressSubpage } from './pages/analytics/subpages/GoalProgressSubpage';
import { ScreenTimeSubpage } from './pages/analytics/subpages/ScreenTimeSubpage';
import { ImprovementLabSubpage } from './pages/analytics/subpages/ImprovementLabSubpage';
import { MonthlyReportsSubpage } from './pages/analytics/subpages/MonthlyReportsSubpage';
import { AdvancedAnalysisSubpage } from './pages/analytics/subpages/AdvancedAnalysisSubpage';
import { ChartSuggestionsSubpage } from './pages/analytics/subpages/ChartSuggestionsSubpage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1
    }
  }
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Loading ConsistAI...
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes (Linear & Notion inspired single layout) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* 1. Today Execution Center */}
            <Route index element={<DashboardPage />} />
            <Route path="today" element={<DashboardPage />} />

            {/* 2. My Goals Workspace & Deep Links */}
            <Route path="goals" element={<GoalsPage />} />
            <Route path="goals/folder/:folderId" element={<GoalsPage />} />
            <Route path="goals/:id" element={<GoalDetailPage />} />
            <Route path="goals/:id/modules/:moduleId" element={<GoalDetailPage />} />

            {/* 3. Tasks */}
            <Route path="tasks" element={<TasksPage />} />

            {/* 4. Habits */}
            <Route path="habits" element={<HabitsPage />} />

            {/* 5. Calendar (Unified schedule) */}
            <Route path="calendar" element={<CalendarPage />} />

            {/* 6. Focus (Global persistent timer) */}
            <Route path="focus" element={<TimerPage />} />
            <Route path="timer" element={<Navigate to="/focus" replace />} />

            {/* 7. Analytics Platform */}
            <Route path="analytics" element={<AnalyticsLayout />}>
              <Route index element={<OverviewSubpage />} />
              <Route path="overview" element={<OverviewSubpage />} />
              <Route path="work-consistency" element={<WorkConsistencySubpage />} />
              <Route path="consistency" element={<WorkConsistencySubpage />} />
              <Route path="time-focus" element={<WorkConsistencySubpage />} />
              <Route path="goal-performance" element={<GoalProgressSubpage />} />
              <Route path="goals" element={<GoalProgressSubpage />} />
              <Route path="improve" element={<ImprovementLabSubpage />} />
              <Route path="improvement-lab" element={<ImprovementLabSubpage />} />
              <Route path="reports" element={<MonthlyReportsSubpage />} />
              <Route path="chart-suggestions" element={<ChartSuggestionsSubpage />} />
              <Route path="framework" element={<Navigate to="/analytics/chart-suggestions" replace />} />
              <Route path="taxonomy" element={<Navigate to="/analytics/chart-suggestions" replace />} />
              <Route path="advanced" element={<AdvancedAnalysisSubpage />} />
            </Route>

            {/* 8. Screen Time */}
            <Route path="screen-time" element={<ScreenTimePage />} />
            <Route path="screentime" element={<Navigate to="/screen-time" replace />} />

            {/* 9. AI Assistant */}
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="assistant/memory" element={<AssistantMemoryPage />} />

            {/* 10. Settings */}
            <Route path="settings" element={<SettingsPage />} />

            {/* 11. Profile */}
            <Route path="profile" element={<ProfilePage />} />

            {/* Legacy Deep-Link Compatibility Redirects */}
            <Route path="todos" element={<Navigate to="/tasks" replace />} />
            <Route path="activities" element={<Navigate to="/tasks" replace />} />
            <Route path="insights" element={<Navigate to="/analytics/overview" replace />} />
            <Route path="coach" element={<Navigate to="/analytics/overview" replace />} />
            <Route path="progress" element={<Navigate to="/analytics/goals" replace />} />
            <Route path="reports" element={<Navigate to="/analytics/reports" replace />} />
            <Route path="experiments" element={<Navigate to="/analytics/improvement-lab" replace />} />
            <Route path="ml-patterns" element={<Navigate to="/analytics/advanced" replace />} />
            <Route path="recommendations" element={<Navigate to="/analytics/overview" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
