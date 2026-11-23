import React, { useState } from 'react';
import { GoalFolder } from '../../types';
import {
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Star,
  Archive,
  Target,
  CheckCircle2,
  Layers,
  Plus,
  Trash2,
  FolderOpen,
  Edit2,
  FolderInput,
  MoreHorizontal
} from 'lucide-react';

interface FolderExplorerProps {
  folders: GoalFolder[];
  selectedView: string; // 'all' | 'favorites' | 'active' | 'completed' | 'archived' | folderId
  onSelectView: (view: string, folderName?: string) => void;
  onOpenCreateFolder: (parentId?: string | null) => void;
  onEditFolder?: (folder: GoalFolder) => void;
  onDeleteFolder?: (folder: GoalFolder) => void;
  totalGoalsCount: number;
  favoritesCount: number;
  activeCount: number;
  completedCount: number;
  archivedCount: number;
}

export const FolderExplorer: React.FC<FolderExplorerProps> = ({
  folders,
  selectedView,
  onSelectView,
  onOpenCreateFolder,
  onEditFolder,
  onDeleteFolder,
  totalGoalsCount,
  favoritesCount,
  activeCount,
  completedCount,
  archivedCount
}) => {
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const rootFolders = folders.filter((f) => !f.parentFolderId);
  const getSubfolders = (parentId: string) => folders.filter((f) => f.parentFolderId === parentId);

  const renderFolderItem = (folder: GoalFolder, level = 0) => {
    const subfolders = getSubfolders(folder._id);
    const hasChildren = subfolders.length > 0;
    const isExpanded = !!expandedFolderIds[folder._id];
    const isSelected = selectedView === folder._id;
    const isGeneral = folder.name === 'General' && !folder.parentFolderId;

    return (
      <div key={folder._id} className="space-y-0.5">
        <div
          onClick={() => onSelectView(folder._id, folder.name)}
          className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
            isSelected
              ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
              : 'text-gray-300 hover:bg-gray-800/60 hover:text-white'
          }`}
          style={{ paddingLeft: `${Math.max(10, level * 16 + 10)}px` }}
        >
          <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder._id, e)}
                className="p-0.5 text-gray-500 hover:text-white rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            )}

            <span className="truncate">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Goal Count Badge */}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
              }`}
            >
              {folder.goalCount || 0}
            </span>

            {/* Folder Actions Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFolderMenuId(folderMenuId === folder._id ? null : folder._id);
                }}
                className="p-1 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-gray-700 transition"
                title="Folder options"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>

              {folderMenuId === folder._id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderMenuId(null);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-6 z-50 w-36 rounded-xl bg-gray-950 border border-gray-800 shadow-xl py-1 text-xs text-gray-300"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setFolderMenuId(null);
                        onOpenCreateFolder(folder._id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-400" />
                      <span>New Subfolder</span>
                    </button>

                    {onEditFolder && (
                      <button
                        type="button"
                        onClick={() => {
                          setFolderMenuId(null);
                          onEditFolder(folder);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                        <span>Rename / Style</span>
                      </button>
                    )}

                    {!isGeneral && onDeleteFolder && (
                      <button
                        type="button"
                        onClick={() => {
                          setFolderMenuId(null);
                          onDeleteFolder(folder);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Folder</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Subfolders */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {subfolders.map((child) => renderFolderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full md:w-60 bg-gray-900/70 border border-gray-800 rounded-2xl p-3.5 flex flex-col gap-4 shrink-0 select-none">
      {/* Quick Views */}
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 pb-1">
          Quick Views
        </div>

        <button
          type="button"
          onClick={() => onSelectView('all', 'All Goals')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedView === 'all'
              ? 'bg-purple-600 text-white shadow-sm font-bold'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>All Goals</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedView === 'all' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {totalGoalsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('favorites', 'Favorites')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedView === 'favorites'
              ? 'bg-amber-600 text-white shadow-sm font-bold'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Favorites</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedView === 'favorites' ? 'bg-amber-700 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {favoritesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('active', 'Active Goals')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedView === 'active'
              ? 'bg-purple-600 text-white shadow-sm font-bold'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>Active</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedView === 'active' ? 'bg-purple-700 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('completed', 'Completed Goals')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedView === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm font-bold'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              selectedView === 'completed' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'
            }`}
          >
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('archived', 'Archived Goals')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedView === 'archived'
              ? 'bg-gray-800 text-white shadow-sm font-bold'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-gray-500" />
            <span>Archived</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-800 text-gray-400 font-bold">
            {archivedCount}
          </span>
        </button>
      </div>

      {/* Folders Explorer */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Folders
          </span>
          <button
            type="button"
            onClick={() => onOpenCreateFolder(null)}
            className="p-1 rounded text-purple-400 hover:text-white hover:bg-gray-800 transition"
            title="Create root folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {rootFolders.map((f) => renderFolderItem(f, 0))}
        </div>
      </div>
    </div>
  );
};
