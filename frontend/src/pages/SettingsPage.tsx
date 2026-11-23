import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../api/client';
import {
  Settings as SettingsIcon,
  Calendar,
  Clock,
  Globe,
  Palette,
  Bell,
  Sparkles,
  Shield,
  Download,
  Trash2,
  Check,
  Save,
  AlertCircle,
  Cpu,
  RefreshCw,
  Zap,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();

  const [workingDays, setWorkingDays] = useState<string[]>(
    user?.preferences?.workingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [dailyWorkHourTarget, setDailyWorkHourTarget] = useState<number>(
    user?.preferences?.dailyWorkHourTarget || 4
  );
  const [timezone, setTimezone] = useState<string>(
    user?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const { theme: currentAppTheme, setTheme: setAppTheme } = useThemeStore();
  const [theme, setTheme] = useState<string>(currentAppTheme || 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    user?.preferences?.notificationsEnabled ?? true
  );

  // Local Ollama State
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string>('qwen3.5:4b');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  // 1. Fetch Ollama Health
  const { data: healthData, refetch: refetchHealth, isFetching: isFetchingHealth } = useQuery({
    queryKey: ['assistant-health'],
    queryFn: async () => {
      const res = await api.get('/assistant/health');
      return res.data;
    },
    refetchInterval: 15000
  });

  // 2. Fetch Installed Models
  const { data: modelsData, refetch: refetchModels } = useQuery({
    queryKey: ['assistant-models'],
    queryFn: async () => {
      const res = await api.get('/assistant/models');
      return res.data;
    }
  });

  // 3. Fetch User Assistant Settings
  const { data: assistantSettingsData } = useQuery({
    queryKey: ['assistant-settings'],
    queryFn: async () => {
      const res = await api.get('/assistant/settings');
      return res.data;
    }
  });

  useEffect(() => {
    if (assistantSettingsData?.settings?.preferredModel) {
      setSelectedModel(assistantSettingsData.settings.preferredModel);
    } else if (modelsData?.activeModel) {
      setSelectedModel(modelsData.activeModel);
    }
  }, [assistantSettingsData, modelsData]);

  const selectedModelDetails = (modelsData?.models || []).find((m: any) => m.name === selectedModel);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await api.post('/assistant/test-connection', { model: selectedModel });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to connect to local Ollama server.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    try {
      await api.post('/assistant/settings', { preferredModel: newModel });
      queryClient.invalidateQueries({ queryKey: ['assistant-settings'] });
      queryClient.invalidateQueries({ queryKey: ['assistant-health'] });
    } catch (e) {}
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length <= 1) return; // Keep at least 1 day
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const updatedPrefs = {
        ...user?.preferences,
        workingDays,
        dailyWorkHourTarget: Number(dailyWorkHourTarget),
        timezone,
        theme,
        notificationsEnabled
      };

      const res = await api.put('/auth/profile', {
        preferences: updatedPrefs
      });

      if (res.data?.user) {
        updateUser(res.data.user);
      }
      if (theme === 'dark' || theme === 'light') {
        setAppTheme(theme);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [goalsRes, habitsRes, tasksRes] = await Promise.all([
        api.get('/goals'),
        api.get('/habits'),
        api.get('/tasks')
      ]);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        user: { name: user?.name, email: user?.email },
        goals: goalsRes.data?.goals || [],
        habits: habitsRes.data?.habits || [],
        tasks: tasksRes.data?.tasks || []
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consistai-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Data export error: ' + (err.response?.data?.message || err.message));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-6 h-6 text-purple-400" />
          <span>System Settings & Preferences</span>
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Customize working cadences, daily study targets, pacing parameters, and export your personal data.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Preferences updated and synchronized across all goals and analytics.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* Section 1: Study Cadence & Work Days */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Weekly Study Schedule & Active Working Days</span>
          </h2>
          <p className="text-xs text-gray-400">
            Selected active days determine your pacing calculations, eligible study dates, and workload forecasts. Unselected days serve as recovery and rest days.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {WEEKDAYS.map((day) => {
              const active = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 border border-purple-500'
                      : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                  }`}
                >
                  {day} {active && '✓'}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-gray-500 block">
            Current cadence: <strong>{workingDays.length} active study days</strong> and{' '}
            <strong>{7 - workingDays.length} planned rest days</strong> per week.
          </span>
        </div>

        {/* Section: AI Assistant — Local Ollama Model Engine */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>AI Assistant & Local Ollama Model</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    100% Local AI
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Powered by your locally running Ollama server. Zero cloud API keys or external data transmission required.
                </p>
              </div>
            </div>

            {/* Live Connection Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                healthData?.online
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${healthData?.online ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>{healthData?.online ? `Online (${healthData?.latencyMs || 0}ms)` : 'Offline / Unreachable'}</span>
              </div>

              <button
                type="button"
                onClick={() => { refetchHealth(); refetchModels(); }}
                disabled={isFetchingHealth}
                className="p-2 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
                title="Refresh Ollama server status"
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingHealth ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* If Disconnected Alert */}
          {!healthData?.online && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Your local AI server is unavailable. Start Ollama and try again.</span>
              </div>
              <p className="text-[11px] text-rose-300/80 leading-relaxed">
                Ensure Ollama is running in your terminal (<code className="font-mono bg-black/40 px-1 py-0.5 rounded">ollama serve</code>) or background service at <code className="font-mono bg-black/40 px-1 py-0.5 rounded">http://127.0.0.1:11434</code>. Manual tasks, habits, and dashboard features continue functioning normally.
              </p>
              <button
                type="button"
                onClick={() => { refetchHealth(); refetchModels(); }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Server Diagnostic Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-gray-950/70 border border-gray-800 text-xs">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Ollama Server</span>
              <span className="font-mono text-white text-[11px] truncate block">{healthData?.baseUrl || 'http://127.0.0.1:11434'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Active Model</span>
              <span className="font-mono text-purple-400 text-[11px] font-bold truncate block">{selectedModel}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Ping Latency</span>
              <span className="font-mono text-emerald-400 text-[11px] block">{healthData?.latencyMs ? `${healthData.latencyMs} ms` : '--'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Connection State</span>
              <span className={`text-[11px] font-semibold ${healthData?.online ? 'text-emerald-400' : 'text-rose-400'}`}>
                {healthData?.online ? 'Verified Local' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Model Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>Selected Local Model</span>
                {selectedModelDetails && (
                  <span className="text-[10px] text-gray-400 font-normal">
                    {selectedModelDetails.parameterSize} • {selectedModelDetails.sizeGb} GB
                  </span>
                )}
              </label>

              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              >
                {(modelsData?.models || []).map((m: any) => (
                  <option key={m.name} value={m.name}>
                    {m.name} {m.supportsTools ? '★ (Tools Supported)' : ''}
                  </option>
                ))}
              </select>

              <p className="text-[10px] text-gray-500">
                Recommended: <strong>Qwen3.5 4B</strong> for fast local tool calling, <strong>Qwen3 8B</strong> for complex reasoning.
              </p>
            </div>

            {/* Test Connection Action */}
            <div className="space-y-2 flex flex-col justify-between">
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  Connection Diagnostic
                </label>
                <p className="text-[11px] text-gray-400">
                  Verify response latency and tool calling execution with your selected model.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !healthData?.online}
                  className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold transition flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  <Zap className={`w-3.5 h-3.5 ${testingConnection ? 'animate-bounce' : 'text-purple-400'}`} />
                  <span>{testingConnection ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                {testResult && (
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                    testResult.success ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    <span>{testResult.success ? `Connected in ${testResult.latencyMs || 0}ms` : 'Failed'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Model Capabilities Pills & Recommendations */}
          {selectedModelDetails && (
            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-gray-400">Active Capabilities:</span>
                {selectedModelDetails.supportsTools && (
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                    Native Function Calling
                  </span>
                )}
                {selectedModelDetails.supportsThinking && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                    Chain-of-Thought Reasoning
                  </span>
                )}
                {selectedModelDetails.supportsVision && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                    Multimodal Vision
                  </span>
                )}
              </div>

              <div className="text-[10px] text-gray-500 font-mono">
                Context: {selectedModelDetails.contextLength || 32768} tokens • Quantization: {selectedModelDetails.quantization}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Daily Target & Timezone */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Daily Working-Hour Target</span>
            </label>
            <input
              type="number"
              min={1}
              max={16}
              step={0.5}
              value={dailyWorkHourTarget}
              onChange={(e) => setDailyWorkHourTarget(Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <span className="text-[10px] text-gray-500 block">
              Default daily hours used to forecast study buffers and module completion dates.
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Primary Timezone</span>
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <span className="text-[10px] text-gray-500 block">
              Used for daily resets, task due date alerts, and focus logs.
            </span>
          </div>
        </div>

        {/* Section 3: Interface Theme & Notifications */}
        <div className="p-5 rounded-2xl bg-gray-900/70 border border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Color Theme</span>
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="dark">Dark Theme (Zinc / Slate #09090B)</option>
              <option value="light">Light Theme (Calm #F8FAFC)</option>
              <option value="system">Follow System Appearance</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Session Notifications</span>
            </label>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="notifToggle"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-gray-950 border-gray-700"
              />
              <label htmlFor="notifToggle" className="text-xs text-gray-300 cursor-pointer">
                Enable audio alerts and focus timer completion chimes
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Preferences'}</span>
        </button>
      </form>

      {/* Section 4: Privacy & Data Export */}
      <div className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800/80 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Data Sovereignty</span>
        </h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Your goals, syllabus notes, study logs, and focus sessions belong entirely to you. You can export your full data archive at any time.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-300 hover:text-white text-xs font-semibold transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>{exporting ? 'Exporting...' : 'Export All Data (JSON)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
