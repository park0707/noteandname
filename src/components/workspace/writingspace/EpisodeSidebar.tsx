import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Search,
  Plus,
  Trash2,
  FolderOpen,
  Folder,
  FileText,
  MoreVertical,
  ChevronRight,
  GitCommit
} from 'lucide-react';
import type { Episode, Foreshadowing } from '../types';
import { getOrderedDocumentList } from '../utils';
import LocalImportModal from './Modals/LocalImportModal';
import type { FileEntry } from './Modals/LocalImportModal';
import { useAlertConfirm } from '../../../context/AlertConfirmContext';

interface EpisodeSidebarProps {
  isDark: boolean;
  isFocusMode: boolean;
  innerSidebarCollapsed: boolean;
  setInnerSidebarCollapsed: (v: boolean) => void;
  episodes: Episode[];
  setEpisodes: Dispatch<SetStateAction<Episode[]>>;
  selectedEpisodeId: string | null;
  setSelectedEpisodeId: (id: string | null) => void;
  handleAddNewItem: (parentId: string | null, isFolder: boolean) => void;
  expandedFolderIds: string[];
  setExpandedFolderIds: Dispatch<SetStateAction<string[]>>;
  contextMenuId: string | null;
  setContextMenuId: (id: string | null) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
  renamingValue: string;
  setRenamingValue: (v: string) => void;
  handleRenameSave: (id: string) => void;
  handleMoveToTrash: (id: string) => void;
  setShowTrashModal: (show: boolean) => void;
  trashCount: number;
  foreshadowings?: Foreshadowing[];
}

export default function EpisodeSidebar(props: EpisodeSidebarProps) {
  const {
    isDark,
    isFocusMode,
    innerSidebarCollapsed,
    setInnerSidebarCollapsed,
    episodes,
    selectedEpisodeId,
    setSelectedEpisodeId,
    handleAddNewItem,
    expandedFolderIds,
    setExpandedFolderIds,
    contextMenuId,
    setContextMenuId,
    renamingId,
    setRenamingId,
    renamingValue,
    setRenamingValue,
    handleRenameSave,
    handleMoveToTrash,
    setShowTrashModal,
    trashCount,
    foreshadowings = [],
  } = props;

  const { showAlert } = useAlertConfirm();
  const [writingSearchQuery, setWritingSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // External Import States
  const [showLocalImportModal, setShowLocalImportModal] = useState(false);

  // Drag and Drop States
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'inside' | 'before' | 'after' | null>(null);

  const handleDragStart = (e: React.DragEvent, item: Episode) => {
    e.stopPropagation();
    setDraggedId(item.id);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, item: Episode) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedId || draggedId === item.id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    let pos: 'before' | 'after' | 'inside' = 'after';
    if (item.isFolder && offsetY > height * 0.25 && offsetY < height * 0.75) {
      pos = 'inside';
    } else if (offsetY < height / 2) {
      pos = 'before';
    } else {
      pos = 'after';
    }

    setDragOverId(item.id);
    setDropPosition(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragOverId(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, targetItem: Episode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedId || draggedId === targetItem.id) {
      setDraggedId(null);
      setDragOverId(null);
      setDropPosition(null);
      return;
    }

    const draggedItem = episodes.find(ep => ep.id === draggedId);
    if (!draggedItem) return;

    let updated = [...episodes];

    if (dropPosition === 'inside' && targetItem.isFolder) {
      updated = updated.map(ep => {
        if (ep.id === draggedId) {
          return { ...ep, parentId: targetItem.id, updatedAt: new Date().toISOString() };
        }
        return ep;
      });
      setExpandedFolderIds(prev => prev.includes(targetItem.id) ? prev : [...prev, targetItem.id]);
    } else {
      const targetParentId = targetItem.parentId || null;
      const sameLevelItems = updated
        .filter(ep => (targetParentId === null ? !ep.parentId : ep.parentId === targetParentId))
        .sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          if (a.orderIndex !== undefined && b.orderIndex !== undefined && a.orderIndex !== b.orderIndex) {
            return a.orderIndex - b.orderIndex;
          }
          return a.title.localeCompare(b.title, 'ko', { numeric: true, sensitivity: 'base' });
        });

      const filteredLevelItems = sameLevelItems.filter(ep => ep.id !== draggedId);
      const targetIdx = filteredLevelItems.findIndex(ep => ep.id === targetItem.id);
      const insertIdx = dropPosition === 'before' ? targetIdx : targetIdx + 1;

      const newLevelItems = [
        ...filteredLevelItems.slice(0, Math.max(0, insertIdx)),
        { ...draggedItem, parentId: targetParentId, updatedAt: new Date().toISOString() },
        ...filteredLevelItems.slice(Math.max(0, insertIdx))
      ];

      const orderMap = new Map<string, number>();
      newLevelItems.forEach((item, index) => {
        orderMap.set(item.id, index);
      });

      updated = updated.map(ep => {
        if (orderMap.has(ep.id)) {
          return {
            ...ep,
            parentId: targetParentId,
            orderIndex: orderMap.get(ep.id),
            updatedAt: new Date().toISOString()
          };
        }
        return ep;
      });
    }

    props.setEpisodes(updated);
    setDraggedId(null);
    setDragOverId(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
    setDropPosition(null);
  };

  // Plain Text를 에디터용 HTML 단락 구조로 이스케이프 및 안전 변환하는 헬퍼
  const convertPlainTextToHtml = (text: string): string => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    return escaped
      .split(/\r?\n/)
      .map(line => line.trim() ? `<p>${line}</p>` : '<p><br></p>')
      .join('');
  };

  const handleLocalImport = (files: FileEntry[]) => {
    if (files.length === 0) return;

    const rootFolderName = `로컬 가져오기 (${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

    // 1. Create top-level import folder
    const rootFolderId = crypto.randomUUID();
    const rootFolder: Episode = {
      id: rootFolderId,
      projectId: episodes.length > 0 ? episodes[0].projectId : '',
      title: rootFolderName,
      content: '',
      charCount: 0,
      updatedAt: new Date().toISOString(),
      isFolder: true,
      parentId: null
    };

    if (!rootFolder.projectId && selectedEpisodeId) {
      rootFolder.projectId = episodes.find(e => e.id === selectedEpisodeId)?.projectId || '';
    }

    const newEpisodesList = [...episodes, rootFolder];
    const folderCache: Record<string, string> = {};
    const createdEpisodeIds: string[] = [];

    files.forEach(entry => {
      const parts = entry.path.split('/');
      const fileName = parts.pop() || entry.name;

      let currentParentId: string = rootFolderId;
      let currentPathAccumulator = '';

      // Create intermediate subfolders
      for (const folderName of parts) {
        currentPathAccumulator = currentPathAccumulator
          ? `${currentPathAccumulator}/${folderName}`
          : folderName;

        if (!folderCache[currentPathAccumulator]) {
          const newFolderId = crypto.randomUUID();
          const newFolder: Episode = {
            id: newFolderId,
            projectId: rootFolder.projectId,
            title: folderName,
            content: '',
            charCount: 0,
            updatedAt: new Date().toISOString(),
            isFolder: true,
            parentId: currentParentId
          };
          newEpisodesList.push(newFolder);
          folderCache[currentPathAccumulator] = newFolderId;
        }
        currentParentId = folderCache[currentPathAccumulator];
      }

      // Create the document file
      const docId = crypto.randomUUID();
      const cleanTitle = fileName.replace(/\.[^/.]+$/, "");
      const rawLength = entry.content.length;
      const htmlContent = convertPlainTextToHtml(entry.content);

      const newDoc: Episode = {
        id: docId,
        projectId: rootFolder.projectId,
        title: cleanTitle,
        content: htmlContent,
        charCount: rawLength,
        updatedAt: new Date().toISOString(),
        isFolder: false,
        parentId: currentParentId
      };
      newEpisodesList.push(newDoc);
      createdEpisodeIds.push(docId);
    });

    // Update state
    props.setEpisodes(newEpisodesList);

    // Expand root folder
    setExpandedFolderIds(prev => prev.includes(rootFolderId) ? prev : [...prev, rootFolderId]);

    // Select first imported file
    if (createdEpisodeIds.length > 0) {
      setSelectedEpisodeId(createdEpisodeIds[0]);
    }

    showAlert(`로컬 가져오기 완료: 총 ${files.length}개의 파일이 성공적으로 임포트되었습니다!`);
  };

  const orderedDocs = getOrderedDocumentList(episodes);

  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const currentItems = episodes.filter(ep => {
      if (parentId === null) {
        return !ep.parentId;
      }
      return ep.parentId === parentId;
    });

    const sortedItems = [...currentItems].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      if (a.orderIndex !== undefined && b.orderIndex !== undefined && a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
      return a.title.localeCompare(b.title, 'ko', { numeric: true, sensitivity: 'base' });
    });

    return sortedItems.map(ep => {
      const isExpanded = expandedFolderIds.includes(ep.id);
      const isRenaming = renamingId === ep.id;

      const docIndex = !ep.isFolder ? orderedDocs.findIndex((d: Episode) => d.id === ep.id) + 1 : -1;
      const dueCount = (!ep.isFolder && foreshadowings && docIndex > 0)
        ? foreshadowings.filter(f => !f.isResolved && f.targetChapter === docIndex).length
        : 0;

      const isDragged = draggedId === ep.id;
      const isDragOver = dragOverId === ep.id;

      let dragBorderClass = '';
      if (isDragOver) {
        if (dropPosition === 'before') dragBorderClass = 'border-t-2 border-[#5E6AD2]';
        else if (dropPosition === 'after') dragBorderClass = 'border-b-2 border-[#5E6AD2]';
        else if (dropPosition === 'inside') dragBorderClass = 'bg-[#5E6AD2]/20 border border-[#5E6AD2]/60';
      }

      return (
        <div key={ep.id} className="flex flex-col">
          <div
            draggable={!isRenaming}
            onDragStart={e => handleDragStart(e, ep)}
            onDragOver={e => handleDragOver(e, ep)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, ep)}
            onDragEnd={handleDragEnd}
            className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
              isDragged ? 'opacity-40 scale-[0.98]' : ''
            } ${dragBorderClass} ${selectedEpisodeId === ep.id && !ep.isFolder
              ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2] font-semibold' : 'bg-[#5E6AD2]/10 text-[#5E6AD2] font-semibold'
              : isDark ? 'text-gray-400 hover:bg-white/[0.02] hover:text-white' : 'text-gray-600 hover:bg-black/[0.02] hover:text-black'
              }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (ep.isFolder) {
                setExpandedFolderIds(prev =>
                  prev.includes(ep.id) ? prev.filter(id => id !== ep.id) : [...prev, ep.id]
                );
              } else {
                setSelectedEpisodeId(ep.id);
              }
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {ep.isFolder ? (
                isExpanded ? (
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#5E6AD2]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 shrink-0 text-[#5E6AD2]/80" />
                )
              ) : (
                <FileText className="w-3.5 h-3.5 shrink-0 text-gray-500" />
              )}

              {isRenaming ? (
                <input
                  type="text"
                  value={renamingValue}
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  onChange={e => setRenamingValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameSave(ep.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onBlur={() => handleRenameSave(ep.id)}
                  className={`w-full px-1 py-0.5 rounded text-xs outline-none border ${isDark ? 'bg-[#1E2023] border-white/[0.1] text-white' : 'bg-white border-black/[0.1] text-[#121316]'
                    }`}
                />
              ) : (
                <span className="text-xs truncate">{ep.title}</span>
              )}

              {dueCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-0.5 shrink-0 animate-pulse"
                  title={`이 문서에서 회수해야 할 복선 ${dueCount}건`}
                >
                  <GitCommit className="w-2.5 h-2.5 text-red-400" />
                  <span>복선회수</span>
                </span>
              )}
            </div>

            {!isRenaming && (
              <div className="relative flex items-center shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenuId(contextMenuId === ep.id ? null : ep.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {contextMenuId === ep.id && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setContextMenuId(null); }} />
                    <div className={`absolute right-0 top-6 z-30 w-48 py-1 rounded-lg border shadow-xl text-xs flex flex-col ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                      }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(ep.id);
                          setRenamingValue(ep.title);
                          setContextMenuId(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                      >
                        이름 수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveToTrash(ep.id);
                        }}
                        className={`w-full text-left px-3 py-1.5 transition-colors text-red-400 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                      >
                        휴지통으로 이동
                      </button>
                      {ep.isFolder && (
                        <>
                          <div className={`border-t my-1 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`} />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNewItem(ep.id, false);
                              setContextMenuId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                          >
                            새 문서
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddNewItem(ep.id, true);
                              setContextMenuId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                          >
                            새 폴더
                          </button>
                          <div className={`border-t my-1 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`} />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowLocalImportModal(true);
                              setContextMenuId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-200' : 'hover:bg-black/[0.04] text-gray-800'}`}
                          >
                            💻 로컬 가져오기
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {ep.isFolder && isExpanded && (
            <div className="flex flex-col">
              {renderTree(ep.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const renderSearchResults = () => {
    const query = writingSearchQuery.trim().toLowerCase();
    const matched = episodes.filter(ep => {
      const matchesTitle = ep.title.toLowerCase().includes(query);
      if (matchesTitle) return true;
      if (ep.content) {
        const cleanContent = ep.content.replace(/<[^>]*>/g, '').toLowerCase();
        return cleanContent.includes(query);
      }
      return false;
    });

    if (matched.length === 0) {
      return <span className="text-[10px] text-gray-500 py-4 text-center">검색된 문서나 폴더가 없습니다.</span>;
    }

    return matched.map(ep => {
      const isRenaming = renamingId === ep.id;
      return (
        <div
          key={ep.id}
          className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${selectedEpisodeId === ep.id && !ep.isFolder
            ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2] font-semibold' : 'bg-[#5E6AD2]/10 text-[#5E6AD2] font-semibold'
            : isDark ? 'text-gray-400 hover:bg-white/[0.02] hover:text-white' : 'text-gray-600 hover:bg-black/[0.02] hover:text-black'
            }`}
          onClick={() => {
            if (!ep.isFolder) {
              setSelectedEpisodeId(ep.id);
            }
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {ep.isFolder ? (
              <Folder className="w-3.5 h-3.5 text-[#5E6AD2]/80" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-gray-500" />
            )}
            {isRenaming ? (
              <input
                type="text"
                value={renamingValue}
                autoFocus
                onClick={e => e.stopPropagation()}
                onChange={e => setRenamingValue(e.target.value)}
                onBlur={() => handleRenameSave(ep.id)}
                className={`w-full px-1 py-0.5 rounded text-xs outline-none border ${isDark ? 'bg-[#1E2023] border-white/[0.1] text-white' : 'bg-white border-black/[0.1] text-[#121316]'
                  }`}
              />
            ) : (
              <span className="text-xs truncate">{ep.title}</span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {!isFocusMode && (
        <div
          className={`flex flex-col shrink-0 transition-all duration-300 border-r relative z-10 ${innerSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-60'
            } ${isDark ? 'bg-[#111215] border-white/[0.06]' : 'bg-[#FAFAFB] border-black/[0.06]'}`}
        >
          {/* 검색 기능 */}
          <div className="p-4 flex flex-col gap-3 shrink-0">
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="문서나 폴더 검색..."
                value={writingSearchQuery}
                onChange={e => setWritingSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all ${isDark
                  ? 'bg-white/[0.02] border border-white/[0.04] text-white placeholder-gray-600 focus:border-[#5E6AD2]'
                  : 'bg-black/[0.02] border border-black/[0.04] text-[#121316] placeholder-gray-400 focus:border-[#5E6AD2]'
                  }`}
              />
            </div>
          </div>

          {/* 트리 및 문서 목록 영역 */}
          <div className={`flex-1 overflow-y-auto px-4 py-2 border-t ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-1 relative">
                <span className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>문서 목록</span>
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-600 hover:text-black'
                      }`}
                    title="추가..."
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {showAddMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)} />
                      <div className={`absolute right-0 top-6 z-30 w-48 py-1 rounded-lg border shadow-xl text-xs flex flex-col ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                        }`}>
                        <button
                          onClick={() => {
                            handleAddNewItem(null, false);
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                        >
                          새 문서
                        </button>
                        <button
                          onClick={() => {
                            handleAddNewItem(null, true);
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                        >
                          새 폴더
                        </button>
                         <div className={`border-t my-1 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`} />
                        <button
                          onClick={() => {
                            setShowLocalImportModal(true);
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-200' : 'hover:bg-black/[0.04] text-gray-800'}`}
                        >
                          💻 로컬 가져오기
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {writingSearchQuery.trim() ? renderSearchResults() : renderTree(null)}
              </div>
            </div>
          </div>

          <div className={`p-3 border-t flex flex-col gap-1 shrink-0 ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
            <button
              onClick={() => setShowTrashModal(true)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${isDark ? 'text-gray-400 hover:bg-white/[0.03] hover:text-white' : 'text-gray-600 hover:bg-black/[0.03] hover:text-[#121316]'
                }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              휴지통 ({trashCount})
            </button>
          </div>
        </div>
      )}

      {!isFocusMode && (
        <button
          onClick={() => setInnerSidebarCollapsed(!innerSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 w-5 h-10 border rounded-r-md flex items-center justify-center transition-all ${innerSidebarCollapsed ? 'left-0' : 'left-60'
            } ${isDark ? 'bg-[#111215] border-white/[0.08] hover:bg-[#1A1B1F] text-gray-500' : 'bg-white border-black/[0.08] hover:bg-[#F3F4F6] text-gray-400'}`}
          title={innerSidebarCollapsed ? "문서 목록 열기" : "문서 목록 닫기"}
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${innerSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>
      )}
      <LocalImportModal
        isDark={isDark}
        isOpen={showLocalImportModal}
        onClose={() => setShowLocalImportModal(false)}
        onImport={handleLocalImport}
      />
    </>
  );
}
