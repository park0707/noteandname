import { useState, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Plus,
  Trash2,
  BookOpen,
  User,
  GitCommit,
  ChevronRight,
  FileText,
  Minimize2,
  Maximize2,
  Search,
  Settings,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Grid,
  Link,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import type { Project, Episode, Node } from './types';

interface WritingSpaceProps {
  selectedProject: Project;
  setSelectedProject: (p: Project | null) => void;
  setActiveFeature: (feat: string) => void;
  episodes: Episode[];
  setEpisodes: Dispatch<SetStateAction<Episode[]>>;
  selectedEpisodeId: string | null;
  setSelectedEpisodeId: (id: string | null) => void;
  editorSaveStatus: 'saved' | 'saving';
  relationNodes: Node[];
  isDark: boolean;
}

export default function WritingSpace({
  selectedProject,
  setSelectedProject,
  setActiveFeature,
  episodes,
  setEpisodes,
  selectedEpisodeId,
  setSelectedEpisodeId,
  editorSaveStatus,
  relationNodes,
  isDark,
}: WritingSpaceProps) {
  const activeEpisode = episodes.find(ep => ep.id === selectedEpisodeId) || null;

  const handleAddEpisode = () => {
    const newEp: Episode = {
      id: `ep-${Date.now()}`,
      projectId: selectedProject.id,
      title: `제 ${episodes.length + 1}화: 새로운 회차`,
      content: '',
      wordCount: 0,
      updatedAt: new Date().toISOString(),
    };
    setEpisodes(prev => [...prev, newEp]);
    setSelectedEpisodeId(newEp.id);
  };

  const handleTitleChange = (newTitle: string) => {
    if (!selectedEpisodeId) return;
    setEpisodes(prev =>
      prev.map(ep =>
        ep.id === selectedEpisodeId
          ? { ...ep, title: newTitle, updatedAt: new Date().toISOString() }
          : ep
      )
    );
  };

  // Local editor configurations & layout states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [targetWordCount, setTargetWordCount] = useState(3000);
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [editorFontFamily, setEditorFontFamily] = useState('나눔고딕');
  const [innerSidebarCollapsed, setInnerSidebarCollapsed] = useState(false);
  const [writingSearchQuery, setWritingSearchQuery] = useState('');
  const [trashEpisodes, setTrashEpisodes] = useState<Episode[]>([]);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'document' | 'characters' | 'plot'>('document');
  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [editorWidth, setEditorWidth] = useState<'narrow' | 'medium' | 'wide'>('medium');
  const [editorTheme, setEditorTheme] = useState<'dark' | 'light' | 'sepia' | 'gray'>('dark');
  const [lineHeight, setLineHeight] = useState('1.8');
  const [paragraphSpacing, setParagraphSpacing] = useState(8);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [historySnapshots, setHistorySnapshots] = useState<{ id: string; timestamp: string; content: string; wordCount: number }[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const editorRef = useRef<HTMLDivElement | null>(null);

  // Sync editorRef.innerHTML when selectedEpisodeId changes
  useEffect(() => {
    if (editorRef.current && activeEpisode) {
      if (editorRef.current.innerHTML !== activeEpisode.content) {
        editorRef.current.innerHTML = activeEpisode.content || '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEpisodeId]);

  // Load and sync trash episodes
  useEffect(() => {
    const trashKey = `novelflow_trash_${selectedProject.id}`;
    const savedTrash = localStorage.getItem(trashKey);
    if (savedTrash) {
      try {
        setTrashEpisodes(JSON.parse(savedTrash));
      } catch (e) {
        console.error(e);
      }
    } else {
      setTrashEpisodes([]);
    }
  }, [selectedProject.id]);

  useEffect(() => {
    const trashKey = `novelflow_trash_${selectedProject.id}`;
    localStorage.setItem(trashKey, JSON.stringify(trashEpisodes));
  }, [trashEpisodes, selectedProject.id]);

  // Load and sync snapshots
  useEffect(() => {
    if (selectedEpisodeId) {
      const snapKey = `novelflow_snapshots_${selectedProject.id}_${selectedEpisodeId}`;
      const savedSnaps = localStorage.getItem(snapKey);
      if (savedSnaps) {
        try {
          setHistorySnapshots(JSON.parse(savedSnaps));
        } catch (e) {
          console.error(e);
        }
      } else {
        setHistorySnapshots([]);
      }
    } else {
      setHistorySnapshots([]);
    }
  }, [selectedEpisodeId, selectedProject.id]);

  useEffect(() => {
    if (selectedEpisodeId) {
      const snapKey = `novelflow_snapshots_${selectedProject.id}_${selectedEpisodeId}`;
      localStorage.setItem(snapKey, JSON.stringify(historySnapshots));
    }
  }, [historySnapshots, selectedEpisodeId, selectedProject.id]);

  // Calculations
  const charCountWithSpaces = activeEpisode ? activeEpisode.content.replace(/<[^>]*>/g, '').length : 0;
  const charCountWithoutSpaces = activeEpisode ? activeEpisode.content.replace(/<[^>]*>/g, '').replace(/\s/g, '').length : 0;
  const progressPercent = Math.min(100, Math.round((charCountWithSpaces / targetWordCount) * 100)) || 0;
  const manuscriptPages = Math.ceil(charCountWithSpaces / 200) || 0;

  const filteredEpisodes = episodes.filter(ep =>
    ep.title.toLowerCase().includes(writingSearchQuery.toLowerCase())
  );

  const execFormat = (command: string, value: string = '') => {
    if (command === 'fontSize') {
      const sizeNum = parseInt(value);
      document.execCommand('fontSize', false, '7');
      const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
      fontElements?.forEach(font => {
        const span = document.createElement('span');
        span.style.fontSize = `${sizeNum}px`;
        span.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(span, font);
      });
      setEditorFontSize(sizeNum);
    } else if (command === 'fontName') {
      document.execCommand('fontName', false, value);
      const fontElements = editorRef.current?.querySelectorAll(`font[face="${value}"]`);
      fontElements?.forEach(font => {
        const span = document.createElement('span');
        span.style.fontFamily = value;
        span.innerHTML = font.innerHTML;
        font.parentNode?.replaceChild(span, font);
      });
      setEditorFontFamily(value);
    } else {
      document.execCommand(command, false, value);
    }
    handleContentInput();
  };

  const handleInsertLink = () => {
    const url = prompt('연결할 URL을 입력하세요:');
    if (url) execFormat('createLink', url);
  };

  const handleInsertTable = () => {
    const rows = prompt('행(Row) 개수를 입력하세요 (기본 3):', '3');
    const cols = prompt('열(Column) 개수를 입력하세요 (기본 3):', '3');
    if (rows && cols) {
      let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid ${
        editorTheme === 'light' ? '#E4E4E7' : editorTheme === 'sepia' ? '#D3C2A0' : '#3F3F46'
      }; margin: 12px 0;">`;
      for (let r = 0; r < parseInt(rows); r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < parseInt(cols); c++) {
          tableHtml += `<td style="border: 1px solid ${
            editorTheme === 'light' ? '#E4E4E7' : editorTheme === 'sepia' ? '#D3C2A0' : '#3F3F46'
          }; padding: 8px; min-width: 50px;">&nbsp;</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</table>';
      document.execCommand('insertHTML', false, tableHtml);
      handleContentInput();
    }
  };

  const handleContentInput = () => {
    if (!editorRef.current || !selectedEpisodeId) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    const charCount = text.length;

    setEpisodes(prev =>
      prev.map(ep =>
        ep.id === selectedEpisodeId
          ? { ...ep, content: html, wordCount: charCount, updatedAt: new Date().toISOString() }
          : ep
      )
    );

    if (typewriterMode) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const scrollContainer = editorRef.current?.closest('.editor-scroll-container');
          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const caretRelativeY = rect.top - containerRect.top;
            const centerY = containerRect.height / 2;
            scrollContainer.scrollTop += (caretRelativeY - centerY);
          }
        }
      }, 10);
    }
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findQuery) return;
    const currentHtml = editorRef.current.innerHTML;
    const escapedFind = findQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedFind, 'g');
    const newHtml = currentHtml.replace(regex, replaceQuery);
    editorRef.current.innerHTML = newHtml;
    handleContentInput();
    alert('일괄 교체가 완료되었습니다.');
  };

  const handleExportFile = (format: 'txt' | 'html') => {
    if (!activeEpisode) return;
    let content = '';
    let filename = `${activeEpisode.title}`;

    if (format === 'txt') {
      content = editorRef.current?.innerText || activeEpisode.content.replace(/<[^>]*>/g, '');
      filename += '.txt';
    } else {
      content = activeEpisode.content;
      filename += '.html';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateSnapshot = () => {
    if (!activeEpisode) return;
    const newSnap = {
      id: `snap-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      content: activeEpisode.content,
      wordCount: charCountWithSpaces
    };
    setHistorySnapshots(prev => [newSnap, ...prev]);
    alert('현재 원고의 버전 스냅샷이 저장되었습니다.');
  };

  const handleRestoreSnapshot = (content: string) => {
    if (!editorRef.current || !activeEpisode) return;
    editorRef.current.innerHTML = content;
    handleContentInput();
    alert('선택한 버전으로 복원되었습니다.');
  };

  const themeStyles = {
    dark: { bg: 'bg-[#0F1012]', paper: 'bg-[#161719] text-gray-200 border-white/[0.04]', toolbar: 'bg-[#161719] border-white/[0.04]', input: 'bg-[#1F2023] border-white/[0.08] text-gray-300' },
    light: { bg: 'bg-[#F0F0F3]', paper: 'bg-white text-gray-800 border-black/[0.04]', toolbar: 'bg-white border-black/[0.04]', input: 'bg-[#F3F4F6] border-black/[0.08] text-gray-800' },
    sepia: { bg: 'bg-[#FAF0DD]', paper: 'bg-[#F4ECD8] text-[#5B4636] border-[#D3C2A0]', toolbar: 'bg-[#F4ECD8] border-[#D3C2A0]', input: 'bg-[#EBDCB9] border-[#D3C2A0] text-[#5B4636]' },
    gray: { bg: 'bg-[#202124]', paper: 'bg-[#2E3033] text-gray-200 border-[#4B5563]', toolbar: 'bg-[#2E3033] border-[#4B5563]', input: 'bg-[#3D4044] border-[#4B5563] text-gray-200' }
  }[editorTheme];

  const handleSidebarRestoreEpisode = (epId: string) => {
    const toRestore = trashEpisodes.find(ep => ep.id === epId);
    if (!toRestore) return;
    
    // Move back to episodes
    setEpisodes(prev => [...prev, toRestore]);
    setTrashEpisodes(prev => prev.filter(ep => ep.id !== epId));
    setSelectedEpisodeId(toRestore.id);
  };

  const handleSidebarPermanentlyDeleteEpisode = (epId: string) => {
    if (!confirm('이 문서를 영구적으로 삭제하시겠습니까? 복구할 수 없습니다.')) return;
    setTrashEpisodes(prev => prev.filter(ep => ep.id !== epId));
  };

  const handleSidebarDeleteEpisode = (epId: string) => {
    const toDelete = episodes.find(ep => ep.id === epId);
    if (!toDelete) return;
    if (!confirm('이 문서를 휴지통으로 이동하시겠습니까?')) return;
    
    // Add to trash
    setTrashEpisodes(prev => [...prev, toDelete]);
    
    // Remove from active list
    setEpisodes(prev => prev.filter(ep => ep.id !== epId));
    if (selectedEpisodeId === epId) {
      const remaining = episodes.filter(ep => ep.id !== epId);
      if (remaining.length > 0) {
        setSelectedEpisodeId(remaining[0].id);
      } else {
        setSelectedEpisodeId(null);
      }
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <style>{`
        .novela-editor-paper [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${editorTheme === 'light' ? '#9CA3AF' : editorTheme === 'sepia' ? '#9C886B' : '#4B5563'};
          pointer-events: none;
          display: block;
        }
        .novela-editor-paper table td {
          border: 1px solid ${editorTheme === 'light' ? '#E4E4E7' : editorTheme === 'sepia' ? '#D3C2A0' : '#3F3F46'} !important;
        }
      `}</style>

      {/* 1. 보조 사이드바 */}
      {!isFocusMode && (
        <div
          className={`flex flex-col shrink-0 transition-all duration-300 border-r relative z-10 ${
            innerSidebarCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-60'
          } ${isDark ? 'bg-[#111215] border-white/[0.06]' : 'bg-[#FAFAFB] border-black/[0.06]'}`}
        >
          <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
            <button
              onClick={() => { setSelectedProject(null); setActiveFeature('dashboard'); }}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                isDark ? 'bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]' : 'bg-black/[0.03] text-gray-700 hover:bg-black/[0.06]'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              홈으로
            </button>
          </div>

          <div className="p-4 flex flex-col gap-3 shrink-0">
            <span className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>새 작품</span>
            
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="검색..."
                value={writingSearchQuery}
                onChange={e => setWritingSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all ${
                  isDark
                    ? 'bg-white/[0.02] border border-white/[0.04] text-white placeholder-gray-600 focus:border-[#5E6AD2]'
                    : 'bg-black/[0.02] border border-black/[0.04] text-[#121316] placeholder-gray-400 focus:border-[#5E6AD2]'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('document')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'document'
                    ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2]' : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                    : isDark ? 'text-gray-400 hover:bg-white/[0.02]' : 'text-gray-600 hover:bg-black/[0.02]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                문서 목록
              </button>
              <button
                onClick={() => setActiveTab('characters')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'characters'
                    ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2]' : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                    : isDark ? 'text-gray-400 hover:bg-white/[0.02]' : 'text-gray-600 hover:bg-black/[0.02]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                등장인물
              </button>
              <button
                onClick={() => setActiveTab('plot')}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'plot'
                    ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2]' : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                    : isDark ? 'text-gray-400 hover:bg-white/[0.02]' : 'text-gray-600 hover:bg-black/[0.02]'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                플롯 개요
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto px-4 py-2 border-t ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
            {activeTab === 'document' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between py-1">
                  <span className={`text-[10px] font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>문서</span>
                  <button
                    onClick={handleAddEpisode}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-white/[0.04] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-600 hover:text-black'
                    }`}
                    title="새 문서 추가"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {filteredEpisodes.map(ep => (
                    <div
                      key={ep.id}
                      onClick={() => setSelectedEpisodeId(ep.id)}
                      className={`group relative px-3 py-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                        selectedEpisodeId === ep.id
                          ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2] font-semibold' : 'bg-[#5E6AD2]/10 text-[#5E6AD2] font-semibold'
                          : isDark ? 'text-gray-400 hover:bg-white/[0.02] hover:text-white' : 'text-gray-600 hover:bg-black/[0.02] hover:text-black'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-6">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                        <span className="text-xs truncate">{ep.title}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSidebarDeleteEpisode(ep.id); }}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-red-500 transition-all hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {filteredEpisodes.length === 0 && (
                    <span className="text-[10px] text-gray-500 py-4 text-center">검색된 문서가 없습니다.</span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold tracking-wider py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>인물 퀵 목록</span>
                <div className="flex flex-col gap-1">
                  {relationNodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => {
                        setActiveFeature('history');
                      }}
                      className={`px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center justify-between ${
                        isDark ? 'bg-white/[0.01] border border-white/[0.04] text-gray-300 hover:bg-[#5E6AD2]/10' : 'bg-black/[0.01] border border-black/[0.04] text-gray-700 hover:bg-[#5E6AD2]/10'
                      }`}
                    >
                      <span className="font-medium truncate">{node.name}</span>
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: node.color }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'plot' && (
              <div className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold tracking-wider py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>플롯 요약</span>
                <div className={`p-3 rounded-lg text-xs leading-relaxed ${isDark ? 'bg-white/[0.02] text-gray-400' : 'bg-black/[0.02] text-gray-600'}`}>
                  <p className="font-semibold mb-1 text-xs text-gray-300">발단 - 깨어난 성광</p>
                  <p className="text-[10px]">주인공 유진이 긴 잠에서 깨어나 검푸른 마력의 비밀을 마주하며 서사가 시작됩니다.</p>
                </div>
              </div>
            )}
          </div>

          <div className={`p-3 border-t flex flex-col gap-1 shrink-0 ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
            <button
              onClick={() => setShowTrashModal(true)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                isDark ? 'text-gray-400 hover:bg-white/[0.03] hover:text-white' : 'text-gray-600 hover:bg-black/[0.03] hover:text-[#121316]'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              휴지통 ({trashEpisodes.length})
            </button>
            <button
              onClick={() => {
                const target = prompt('목표 글자수를 수정해 주세요:', targetWordCount.toString());
                if (target) setTargetWordCount(parseInt(target));
              }}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                isDark ? 'text-gray-400 hover:bg-white/[0.03] hover:text-white' : 'text-gray-600 hover:bg-black/[0.03] hover:text-[#121316]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              설정
            </button>
          </div>
        </div>
      )}

      {/* 보조 사이드바 접기/토글 버튼 */}
      {!isFocusMode && (
        <button
          onClick={() => setInnerSidebarCollapsed(!innerSidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 w-5 h-10 border rounded-r-md flex items-center justify-center transition-all ${
            innerSidebarCollapsed ? 'left-0' : 'left-60'
          } ${isDark ? 'bg-[#111215] border-white/[0.08] hover:bg-[#1A1B1F] text-gray-500' : 'bg-white border-black/[0.08] hover:bg-[#F3F4F6] text-gray-400'}`}
          title={innerSidebarCollapsed ? "문서 목록 열기" : "문서 목록 닫기"}
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${innerSidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>
      )}

      {/* 2. 메인 에디터 컨테이너 */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${themeStyles.bg}`}>
        {activeEpisode ? (
          <>
            {/* 에디터 툴바 */}
            <div className={`px-6 py-2 border-b flex items-center justify-between gap-4 shrink-0 select-none ${themeStyles.toolbar}`}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => execFormat('undo')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="실행 취소 (Ctrl+Z)"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => execFormat('redo')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="다시 실행 (Ctrl+Y)"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-[#121316]'}`}>{activeEpisode.title}</span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      editorSaveStatus === 'saved' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
                    }`}
                    title={editorSaveStatus === 'saved' ? '저장 완료' : '저장 중...'}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto max-w-2xl">
                <select
                  value={editorFontFamily}
                  onChange={e => execFormat('fontName', e.target.value)}
                  className={`px-2 py-1 rounded text-xs border outline-none font-sans cursor-pointer ${themeStyles.input}`}
                >
                  <option value="나눔고딕">나눔고딕</option>
                  <option value="나눔명조">나눔명조</option>
                  <option value="Noto Sans KR">본고딕</option>
                  <option value="Noto Serif KR">본명조</option>
                  <option value="system-ui">시스템 기본</option>
                </select>

                <select
                  value={editorFontSize}
                  onChange={e => execFormat('fontSize', e.target.value)}
                  className={`px-2 py-1 rounded text-xs border outline-none font-sans cursor-pointer ${themeStyles.input}`}
                >
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                  <option value="18">18</option>
                  <option value="20">20</option>
                  <option value="24">24</option>
                  <option value="28">28</option>
                </select>

                <select
                  onChange={e => execFormat('formatBlock', e.target.value)}
                  defaultValue="<P>"
                  className={`px-2 py-1 rounded text-xs border outline-none font-sans cursor-pointer ${themeStyles.input}`}
                >
                  <option value="<P>">본문 문단</option>
                  <option value="<H1>">큰 제목(H1)</option>
                  <option value="<H2>">중간 제목(H2)</option>
                  <option value="<H3>">소제목(H3)</option>
                </select>

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <button
                  onClick={() => execFormat('bold')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] font-bold ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="굵게 (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('italic')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] italic ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="기울임 (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('underline')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] underline ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="밑줄 (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('strikeThrough')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] line-through ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="취소선"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <div className="relative">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center font-bold text-xs ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                    title="글자 색상"
                  >
                    A
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                  {showColorPicker && (
                    <div className={`absolute left-0 mt-1 z-30 p-2 rounded-lg border shadow-xl flex gap-1 ${isDark ? 'bg-[#1E1F22] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
                      {['#EDEDEF', '#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#A855F7', '#121316'].map(color => (
                        <div
                          key={color}
                          onClick={() => { execFormat('foreColor', color); setShowColorPicker(false); }}
                          className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/20"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                    className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center text-xs ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                    }`}
                    title="형광펜 효과"
                  >
                    <span className="bg-yellow-500 text-black px-0.5 rounded text-[10px]">ab</span>
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                  {showBgColorPicker && (
                    <div className={`absolute left-0 mt-1 z-30 p-2 rounded-lg border shadow-xl flex gap-1 ${isDark ? 'bg-[#1E1F22] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
                      {['transparent', '#3F3F46', '#FCA5A5', '#FED7AA', '#FEF08A', '#86EFAC', '#93C5FD', '#C084FC'].map(color => (
                        <div
                          key={color}
                          onClick={() => { execFormat('hiliteColor', color); setShowBgColorPicker(false); }}
                          className="w-4 h-4 rounded-full cursor-pointer hover:scale-110 transition-transform border border-black/20"
                          style={{ backgroundColor: color }}
                          title={color === 'transparent' ? '지우기' : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => execFormat('removeFormat')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                  }`}
                  title="모든 스타일 서식 제거"
                >
                  서식지우기
                </button>

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <button
                  onClick={() => execFormat('justifyLeft')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="왼쪽 정렬"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('justifyCenter')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="가운데 정렬 (웹소설 시/편지용)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('justifyRight')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="오른쪽 정렬"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('justifyFull')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="양쪽 정렬"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => execFormat('indent')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                  }`}
                  title="들여쓰기 적용 (단락 시작)"
                >
                  들여쓰기
                </button>
                <button
                  onClick={() => execFormat('outdent')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                  }`}
                  title="내어쓰기 적용"
                >
                  내어쓰기
                </button>

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <button
                  onClick={() => execFormat('insertHTML', '<hr style="border: 0; border-top: 1px dashed #666; margin: 24px 0;" />')}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                  }`}
                  title="장면 전환용 구분선 삽입"
                >
                  구분선
                </button>
                <button
                  onClick={() => execFormat('formatBlock', '<blockquote>')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="인용구 블록 설정"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleInsertTable}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="표 삽입"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleInsertLink}
                  className={`p-1.5 rounded hover:bg-white/[0.04] ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="링크 삽입"
                >
                  <Link className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  title={isFocusMode ? "집중 모드 종료" : "집중 모드 시작"}
                  className={`p-1.5 rounded-lg border transition-all duration-150 ${
                    isFocusMode
                      ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                      : isDark
                        ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                        : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                  }`}
                >
                  {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowStatsDropdown(!showStatsDropdown)}
                    className={`px-3 py-1 rounded text-xs font-semibold border flex items-center gap-1 transition-all ${
                      isDark
                        ? 'bg-[#1F2023] border-white/[0.08] text-gray-300 hover:text-white'
                        : 'bg-[#F3F4F6] border-black/[0.08] text-gray-700 hover:text-black'
                    }`}
                  >
                    {charCountWithSpaces.toLocaleString()}자
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showStatsDropdown && (
                    <div
                      className={`absolute right-0 mt-2 z-40 p-4 rounded-xl border shadow-2xl w-60 flex flex-col gap-3 ${
                        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                      }`}
                    >
                      <h4 className="text-xs font-bold border-b pb-1.5 flex justify-between items-center">
                        상세 자수 통계
                        <span className="text-[10px] text-gray-500 font-normal">200자 원고지 기준</span>
                      </h4>
                      
                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">공백 포함 글자수</span>
                          <span className="font-bold">{charCountWithSpaces.toLocaleString()}자</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">공백 제외 글자수</span>
                          <span className="font-bold">{charCountWithoutSpaces.toLocaleString()}자</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5 mt-1 border-gray-500/10">
                          <span className="text-gray-500 font-medium">원고지 환산 매수</span>
                          <span className="text-[#5E6AD2] font-bold">{manuscriptPages} 장</span>
                        </div>

                        <div className="border-t pt-2 mt-2 flex flex-col gap-1.5">
                          <span className="text-[10px] text-gray-500 font-semibold">플랫폼 권장 분량</span>
                          <div className="flex justify-between text-[10px]">
                            <span>네이버 웹소설 (2만자 제한)</span>
                            <span className={`font-bold ${charCountWithSpaces > 20000 ? 'text-red-500' : 'text-green-500'}`}>
                              {charCountWithSpaces > 20000 ? '분량 초과' : '적정 범위'}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span>카카오페이지 (3만자 제한)</span>
                            <span className={`font-bold ${charCountWithSpaces > 30000 ? 'text-red-500' : 'text-green-500'}`}>
                              {charCountWithSpaces > 30000 ? '분량 초과' : '적정 범위'}
                            </span>
                          </div>
                        </div>

                        <div className="border-t pt-2 mt-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-500 font-medium">목표 달성도 ({targetWordCount.toLocaleString()}자)</span>
                            <span className="text-[#5E6AD2] font-bold">{progressPercent}%</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`}>
                            <div className="h-full bg-[#5E6AD2] rounded-full" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 보조 설정 바 */}
            {!isFocusMode && (
              <div className={`px-6 py-2 border-b flex items-center justify-between gap-4 text-xs select-none ${themeStyles.toolbar}`}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">배경 테마</span>
                    {['dark', 'light', 'sepia', 'gray'].map(theme => (
                      <button
                        key={theme}
                        onClick={() => setEditorTheme(theme as any)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                          editorTheme === theme
                            ? 'bg-[#5E6AD2] text-white'
                            : isDark ? 'bg-white/[0.04] text-gray-400 hover:text-white' : 'bg-black/[0.04] text-gray-600 hover:text-black'
                        }`}
                      >
                        {theme === 'dark' ? '어둡게' : theme === 'light' ? '밝게' : theme === 'sepia' ? '세피아' : '회색'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">용지 너비</span>
                    {(['narrow', 'medium', 'wide'] as const).map(widthOpt => (
                      <button
                        key={widthOpt}
                        onClick={() => setEditorWidth(widthOpt)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                          editorWidth === widthOpt
                            ? 'bg-[#5E6AD2] text-white'
                            : isDark ? 'bg-white/[0.04] text-gray-400 hover:text-white' : 'bg-black/[0.04] text-gray-600 hover:text-black'
                        }`}
                      >
                        {widthOpt === 'narrow' ? '좁게' : widthOpt === 'medium' ? '보통' : '넓게'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">줄간격</span>
                    <select
                      value={lineHeight}
                      onChange={e => setLineHeight(e.target.value)}
                      className={`px-2 py-0.5 rounded text-[10px] border outline-none cursor-pointer ${themeStyles.input}`}
                    >
                      <option value="1.2">1.2</option>
                      <option value="1.5">1.5</option>
                      <option value="1.8">1.8 (표준)</option>
                      <option value="2.0">2.0</option>
                      <option value="2.5">2.5</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500 font-medium">문단 간격</span>
                    <select
                      value={paragraphSpacing}
                      onChange={e => setParagraphSpacing(parseInt(e.target.value))}
                      className={`px-2 py-0.5 rounded text-[10px] border outline-none cursor-pointer ${themeStyles.input}`}
                    >
                      <option value="0">0px</option>
                      <option value="4">4px</option>
                      <option value="8">8px (기본)</option>
                      <option value="12">12px</option>
                      <option value="16">16px</option>
                      <option value="20">20px</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typewriterMode}
                      onChange={e => setTypewriterMode(e.target.checked)}
                      className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-3.5 h-3.5"
                    />
                    <span className="text-[10px] text-gray-500 font-semibold">타이프라이터 모드 (커서 중앙 고정)</span>
                  </label>

                  <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                  <button
                    onClick={() => setShowFindReplace(!showFindReplace)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      showFindReplace
                        ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                        : isDark ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                    }`}
                  >
                    찾기 및 바꾸기 (Ctrl+F)
                  </button>

                  <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                  <button
                    onClick={() => {
                      const fmt = confirm('HTML 서식을 포함해 내보낼까요? (확인: HTML / 취소: 순수 TXT)') ? 'html' : 'txt';
                      handleExportFile(fmt);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'
                    }`}
                  >
                    원고 내보내기
                  </button>

                  <button
                    onClick={handleCreateSnapshot}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'
                    }`}
                    title="스냅샷 저장"
                  >
                    버전 스냅샷
                  </button>
                  
                  {historySnapshots.length > 0 && (
                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/10 text-[#7480E2] hover:bg-[#5E6AD2]/20"
                      title="버전 기록 목록 열기"
                    >
                      이력 ({historySnapshots.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 찾기/바꾸기 바 */}
            {showFindReplace && (
              <div className={`px-6 py-2 border-b flex items-center gap-3 shrink-0 ${themeStyles.toolbar}`}>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">찾을 단어:</span>
                  <input
                    type="text"
                    placeholder="예) 마법사"
                    value={findQuery}
                    onChange={e => setFindQuery(e.target.value)}
                    className={`px-2.5 py-1 rounded text-xs border outline-none ${themeStyles.input}`}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-gray-500">바꿀 단어:</span>
                  <input
                    type="text"
                    placeholder="예) 기사"
                    value={replaceQuery}
                    onChange={e => setReplaceQuery(e.target.value)}
                    className={`px-2.5 py-1 rounded text-xs border outline-none ${themeStyles.input}`}
                  />
                </div>
                <button
                  onClick={handleReplaceAll}
                  disabled={!findQuery}
                  className="px-3 py-1 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  일괄 찾아 바꾸기
                </button>
              </div>
            )}

            {/* Centered Paper WYSIWYG 원고지 편집지 */}
            <div
              onClick={() => editorRef.current?.focus()}
              className="flex-1 overflow-y-auto px-6 py-10 flex justify-center cursor-text editor-scroll-container"
            >
              <div
                className={`w-full flex flex-col h-full rounded-2xl border shadow-lg novela-editor-paper transition-all ${
                  editorWidth === 'narrow' ? 'max-w-xl' : editorWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl'
                } ${themeStyles.paper}`}
                style={{
                  fontFamily: editorFontFamily,
                  fontSize: `${editorFontSize}px`,
                  lineHeight: lineHeight,
                  paddingTop: '3rem',
                  paddingBottom: typewriterMode ? '50vh' : '3rem'
                }}
              >
                <div className="px-12 pb-4">
                  <input
                    type="text"
                    value={activeEpisode.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="제목 없음"
                    className={`w-full font-heading font-bold text-3xl bg-transparent outline-none border-b border-transparent focus:border-[#5E6AD2]/50 pb-2 transition-all ${
                      editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
                    }`}
                  />
                </div>

                <div className="flex-1 px-12 pb-12 overflow-y-auto">
                  <div
                    ref={editorRef}
                    contentEditable
                    data-placeholder="내용을 입력하세요..."
                    onInput={handleContentInput}
                    className="w-full h-full outline-none font-serif min-h-[400px]"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <FileText className="w-12 h-12 text-gray-500 opacity-40 animate-pulse" />
            <p className="text-sm text-gray-500 font-medium">집필할 회차를 선택하거나 새 회차를 만들어 주세요.</p>
            <button
              onClick={handleAddEpisode}
              className="mt-1 px-4 py-2 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-semibold rounded-xl transition-all duration-150"
            >
              새 회차 만들기
            </button>
          </div>
        )}
      </div>

      {/* 3. 휴지통 모달 */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTrashModal(false)} />
          <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6 ${
            isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'
          }`}>
            <h3 className={`font-heading font-bold text-base mb-4 ${isDark ? 'text-white' : 'text-black'}`}>집필실 휴지통</h3>
            
            <div className="max-h-60 overflow-y-auto flex flex-col gap-2 mb-6">
              {trashEpisodes.map(ep => (
                <div
                  key={ep.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{ep.title}</span>
                    <span className="text-[10px] text-gray-500">글자수: {ep.wordCount.toLocaleString()}자</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSidebarRestoreEpisode(ep.id)}
                      className="px-2 py-1 rounded bg-[#5E6AD2] text-white font-semibold hover:bg-[#7480E2] transition-colors"
                    >
                      복구
                    </button>
                    <button
                      onClick={() => handleSidebarPermanentlyDeleteEpisode(ep.id)}
                      className="px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
                    >
                      영구삭제
                    </button>
                  </div>
                </div>
              ))}
              {trashEpisodes.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-500">휴지통이 비어 있습니다.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTrashModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
                    : 'border-black/[0.08] text-gray-600 hover:text-black hover:border-black/20'
                }`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 버전 기록(스냅샷) 모달 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
          <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6 ${
            isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'
          }`}>
            <h3 className={`font-heading font-bold text-base mb-4 ${isDark ? 'text-white' : 'text-black'}`}>버전 이력 (스냅샷 목록)</h3>
            
            <div className="max-h-60 overflow-y-auto flex flex-col gap-2 mb-6">
              {historySnapshots.map(snap => (
                <div
                  key={snap.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                    isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{snap.timestamp} 저장 버전</span>
                    <span className="text-[10px] text-gray-500">글자수: {snap.wordCount.toLocaleString()}자</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { handleRestoreSnapshot(snap.content); setShowHistoryModal(false); }}
                      className="px-2 py-1 rounded bg-[#5E6AD2] text-white font-semibold hover:bg-[#7480E2] transition-colors"
                    >
                      이 버전 복원
                    </button>
                    <button
                      onClick={() => {
                        setHistorySnapshots(prev => prev.filter(s => s.id !== snap.id));
                      }}
                      className="px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
                    : 'border-black/[0.08] text-gray-600 hover:text-black hover:border-black/20'
                }`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
