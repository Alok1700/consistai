import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useGoalWorkspaceStore } from '../../store/goalWorkspaceStore';
import {
  Search,
  Target,
  Folder,
  Layers,
  FileText,
  CheckSquare,
  Sparkles,
  Plus,
  Play,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';

interface SearchResults {
  goals: any[];
  folders: any[];
  modules: any[];
  notes: any[];
  tasks: any[];
}

export const CommandMenuModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    isCommandMenuOpen,
    setCommandMenuOpen,
    setQuickCreateOpen,
    setAdvancedWizardOpen,
    setTemplateGalleryOpen,
    setSelectedView
  } = useGoalWorkspaceStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    goals: [],
    folders: [],
    modules: [],
    notes: [],
    tasks: []
  });
  const [isSearching, setIsSearching] = useState(false);

  // Global keyboard shortcut listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandMenuOpen(!isCommandMenuOpen);
      } else if (e.key === 'Escape' && isCommandMenuOpen) {
        setCommandMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandMenuOpen, setCommandMenuOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ goals: [], folders: [], modules: [], notes: [], tasks: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await api.get(`/goals/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data?.results) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandMenuOpen) return null;

  const hasResults =
    results.goals.length > 0 ||
    results.folders.length > 0 ||
    results.modules.length > 0 ||
    results.notes.length > 0 ||
    results.tasks.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="relative border-b border-gray-800 flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search goals, folders, modules, study notes, or type a command... (Esc to exit)"
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Commands when no query */}
          {!query.trim() && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-1.5">
                Quick Actions
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setCommandMenuOpen(false);
                    setQuickCreateOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-purple-600/20 hover:text-purple-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">Quick Create Goal (&lt; 30 seconds)</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Quick</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCommandMenuOpen(false);
                    setAdvancedWizardOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-purple-600/20 hover:text-purple-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">Launch Advanced Goal Wizard</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Wizard</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCommandMenuOpen(false);
                    setTemplateGalleryOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-blue-600/20 hover:text-blue-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="font-medium">Explore Goal Templates Library (DSA, MERN, Books...)</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Templates</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCommandMenuOpen(false);
                    navigate('/timer');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-emerald-600/20 hover:text-emerald-300 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="font-medium">Start Focused Work Session</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Timer</span>
                </button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {isSearching && (
            <div className="p-4 text-center text-xs text-gray-400">Searching workspace...</div>
          )}

          {query.trim() && !isSearching && !hasResults && (
            <div className="p-6 text-center text-xs text-gray-500">
              No matching goals, folders, or modules found for "{query}".
            </div>
          )}

          {/* Goals Results */}
          {results.goals.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                <span>Goals ({results.goals.length})</span>
              </div>
              <div className="space-y-1">
                {results.goals.map((g) => (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => {
                      setCommandMenuOpen(false);
                      navigate(`/goals/${g._id}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: g.color || '#7C3AED' }}
                      />
                      <div className="truncate">
                        <div className="font-bold text-white truncate">{g.title}</div>
                        <div className="text-[10px] text-gray-500">
                          {g.category} • {g.folder || 'General'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold text-purple-400">
                        {g.currentProgressPercentage}%
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Folders Results */}
          {results.folders.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-1.5 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>Folders ({results.folders.length})</span>
              </div>
              <div className="space-y-1">
                {results.folders.map((f) => (
                  <button
                    key={f._id}
                    type="button"
                    onClick={() => {
                      setCommandMenuOpen(false);
                      setSelectedView(f._id, f.name);
                      navigate('/goals');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-white">{f.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">Folder</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modules Results */}
          {results.modules.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Modules / Milestones ({results.modules.length})</span>
              </div>
              <div className="space-y-1">
                {results.modules.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => {
                      setCommandMenuOpen(false);
                      const gId = typeof m.goal === 'object' ? m.goal?._id : m.goal;
                      navigate(`/goals/${gId}`);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{m.title}</div>
                      <div className="text-[10px] text-gray-500">
                        {typeof m.goal === 'object' ? m.goal?.title : 'Goal module'}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        m.isCompleted ? 'bg-emerald-950 text-emerald-400' : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {m.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Study Notes Results */}
          {results.notes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 px-3 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Matching Study Notes ({results.notes.length})</span>
              </div>
              <div className="space-y-1">
                {results.notes.map((m) => (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => {
                      setCommandMenuOpen(false);
                      const gId = typeof m.goal === 'object' ? m.goal?._id : m.goal;
                      navigate(`/goals/${gId}`);
                    }}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{m.title}</div>
                      <div className="text-[11px] text-gray-400 line-clamp-1 italic font-mono">
                        "{m.notes}"
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-gray-800 bg-gray-950/60 flex items-center justify-between text-[11px] text-gray-500 px-4">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono text-[9px]">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono text-[9px]">
              ↓
            </kbd>
            <span className="ml-1">Select:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono text-[9px]">
              Enter
            </kbd>
          </div>
          <span>ConsistAI Global Search</span>
        </div>
      </div>
    </div>
  );
};
