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
  ChevronRight
} from 'lucide-react';
import type { Episode } from '../types';
import ExternalImportModal from './Modals/ExternalImportModal';
import LocalImportModal from './Modals/LocalImportModal';
import type { FileEntry } from './Modals/LocalImportModal';

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
  } = props;

  const [writingSearchQuery, setWritingSearchQuery] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // External Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<'notion' | 'google' | null>(null);
  const [showLocalImportModal, setShowLocalImportModal] = useState(false);

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

    alert(`로컬 가져오기 완료: 총 ${files.length}개의 파일이 성공적으로 임포트되었습니다!`);
  };

  const handleImport = (selectedItems: { title: string; content: string }[]) => {
    if (selectedItems.length === 0 || !importType) return;

    const folderTitleMatched = importType === 'notion' ? '노션' : '구글 드라이브';

    // 1. Check if folder already exists at root
    let folder = episodes.find(ep => ep.isFolder && ep.title === folderTitleMatched && !ep.parentId);
    let folderId = folder?.id;

    const newEpisodesList = [...episodes];

    if (!folder) {
      folderId = crypto.randomUUID();
      const newFolder: Episode = {
        id: folderId,
        projectId: selectedEpisodeId ? episodes.find(e => e.id === selectedEpisodeId)?.projectId || '' : '',
        title: folderTitleMatched,
        content: '',
        charCount: 0,
        updatedAt: new Date().toISOString(),
        isFolder: true,
        parentId: null
      };

      if (!newFolder.projectId && episodes.length > 0) {
        newFolder.projectId = episodes[0].projectId;
      }

      newEpisodesList.push(newFolder);
    }

    // 2. Add imported docs inside this folder
    const createdEpisodeIds: string[] = [];
    selectedItems.forEach(item => {
      const docId = crypto.randomUUID();
      const cleanText = item.content.replace(/<[^>]*>/g, '');
      const newDoc: Episode = {
        id: docId,
        projectId: episodes.length > 0 ? episodes[0].projectId : '',
        title: item.title,
        content: item.content,
        charCount: cleanText.length,
        updatedAt: new Date().toISOString(),
        isFolder: false,
        parentId: folderId
      };
      newEpisodesList.push(newDoc);
      createdEpisodeIds.push(docId);
    });

    // 3. Update episodes
    props.setEpisodes(newEpisodesList);

    // 4. Expand folder
    if (folderId) {
      setExpandedFolderIds(prev => prev.includes(folderId!) ? prev : [...prev, folderId!]);
    }

    // 5. Select first document
    if (createdEpisodeIds.length > 0) {
      setSelectedEpisodeId(createdEpisodeIds[0]);
    }

    alert(`${folderTitleMatched} 폴더가 생성되었으며, ${selectedItems.length}개의 작업물이 성공적으로 연동 완료되어 가져와졌습니다!`);
  };

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
      // 자연 정렬: 제목 내의 숫자를 수치로 비교 (1화 < 2화 < 10화 보장)
      return a.title.localeCompare(b.title, 'ko', { numeric: true, sensitivity: 'base' });
    });

    return sortedItems.map(ep => {
      const isExpanded = expandedFolderIds.includes(ep.id);
      const isRenaming = renamingId === ep.id;

      return (
        <div key={ep.id} className="flex flex-col">
          <div
            className={`group relative flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${selectedEpisodeId === ep.id && !ep.isFolder
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
                              setImportType('notion');
                              setShowImportModal(true);
                              setContextMenuId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-200' : 'hover:bg-black/[0.04] text-gray-800'}`}
                          >
                            🔗 노션 가져오기
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setImportType('google');
                              setShowImportModal(true);
                              setContextMenuId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-200' : 'hover:bg-black/[0.04] text-gray-800'}`}
                          >
                            📁 구글 드라이브 가져오기
                          </button>
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
                            setImportType('notion');
                            setShowImportModal(true);
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-200' : 'hover:bg-black/[0.04] text-gray-800'}`}
                        >
                          🔗 노션 가져오기
                        </button>
                        <button
                          onClick={() => {
                            setImportType('google');
                            setShowImportModal(true);
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-200' : 'hover:bg-black/[0.04] text-gray-800'}`}
                        >
                          📁 구글 드라이브 가져오기
                        </button>
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
      <ExternalImportModal
        isDark={isDark}
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportType(null);
        }}
        type={importType}
        onImport={handleImport}
      />
      <LocalImportModal
        isDark={isDark}
        isOpen={showLocalImportModal}
        onClose={() => setShowLocalImportModal(false)}
        onImport={handleLocalImport}
      />
    </>
  );
}
