import { useState, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { FileText } from 'lucide-react';
import type { Project, Episode, Node, Snapshot } from './types';
import { DEFAULT_FONTS } from '../../lib/fonts';
import type { FontOption } from '../../lib/fonts';

// Import modular subcomponents
import EpisodeSidebar from './writingspace/EpisodeSidebar';
import EditorToolbar from './writingspace/EditorToolbar';
import FindReplaceBar from './writingspace/FindReplaceBar';
import DiffViewPane from './writingspace/DiffViewPane';
import MainEditorCanvas from './writingspace/MainEditorCanvas';
import TrashModal from './writingspace/Modals/TrashModal';
import SnapshotHistoryModal from './writingspace/Modals/SnapshotHistoryModal';
import { getRecursiveDescendants } from './utils';

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

export default function WritingSpace(props: WritingSpaceProps) {
  const {
    selectedProject,
    episodes,
    setEpisodes,
    selectedEpisodeId,
    setSelectedEpisodeId,
    editorSaveStatus,
    isDark
  } = props;

  const activeEpisode = episodes.find(ep => ep.id === selectedEpisodeId) || null;

  const handleAddNewItem = (parentId: string | null = null, isFolder: boolean = false) => {
    const newItem: Episode = {
      id: `${isFolder ? 'folder' : 'ep'}-${Date.now()}`,
      projectId: selectedProject.id,
      title: isFolder ? '새 폴더' : '새 문서',
      content: '',
      wordCount: 0,
      updatedAt: new Date().toISOString(),
      isFolder,
      parentId,
    };
    setEpisodes(prev => [...prev, newItem]);
    if (!isFolder) {
      setSelectedEpisodeId(newItem.id);
    }
    if (parentId) {
      setExpandedFolderIds(prev => prev.includes(parentId) ? prev : [...prev, parentId]);
    }
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
  const [targetWordCount] = useState(3000);
  const [editorFontSize, setEditorFontSize] = useState(16);
  const [editorFontFamily, setEditorFontFamily] = useState('Nanum Gothic');
  const [recentFontIds, setRecentFontIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('novelflow_recent_fonts') || '[]');
    } catch {
      return [];
    }
  });
  const [uploadedFonts, setUploadedFonts] = useState<FontOption[]>([]);
  const [innerSidebarCollapsed, setInnerSidebarCollapsed] = useState(false);
  const [trashEpisodes, setTrashEpisodes] = useState<Episode[]>([]);
  const [showTrashModal, setShowTrashModal] = useState(false);

  // Custom Font Dropdown and File Input reference
  const [showFontDropdown, setShowFontDropdown] = useState(false);

  // Folder tree and custom context menu states
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');

  const [showStatsDropdown, setShowStatsDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bgColorPickerPos, setBgColorPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [typewriterMode, setTypewriterMode] = useState(false);
  const [editorTheme] = useState<'dark' | 'light' | 'sepia' | 'gray'>('dark');
  const [lineHeight, setLineHeight] = useState('1.8');
  const [paragraphSpacing, setParagraphSpacing] = useState(8);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [totalSearchMatches, setTotalSearchMatches] = useState(0);



  const [historySnapshots, setHistorySnapshots] = useState<Snapshot[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [lastSnapshotWordCount, setLastSnapshotWordCount] = useState(0);

  // Snapshot visual comparison states
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffTargetSnapshot, setDiffTargetSnapshot] = useState<Snapshot | null>(null);
  const [snapshotNameEditId, setSnapshotNameEditId] = useState<string | null>(null);
  const [snapshotNameEditValue, setSnapshotNameEditValue] = useState('');
  const [snapshotMemoEditId, setSnapshotMemoEditId] = useState<string | null>(null);
  const [snapshotMemoEditValue, setSnapshotMemoEditValue] = useState('');

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      editorRef.current?.focus();
    }
  };

  useEffect(() => {
    localStorage.setItem('novelflow_recent_fonts', JSON.stringify(recentFontIds));
  }, [recentFontIds]);

  useEffect(() => {
    const loadUploadedFonts = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem('novelflow_uploaded_fonts') || '[]');
        const restored: FontOption[] = [];
        for (const item of saved) {
          try {
            const response = await fetch(item.dataUrl);
            const buffer = await response.arrayBuffer();
            const fontFace = new FontFace(item.family, buffer);
            await fontFace.load();
            (document.fonts as any).add(fontFace);

            restored.push({
              id: item.id,
              label: item.label,
              family: item.family,
              category: 'uploaded',
              source: 'upload',
            });
          } catch (error) {
            console.error('업로드 폰트 복원 실패', error);
          }
        }
        setUploadedFonts(restored);
      } catch (error) {
        console.error('업로드 폰트 로드 실패', error);
      }
    };
    loadUploadedFonts();
  }, []);

  const allFonts = [...DEFAULT_FONTS, ...uploadedFonts];

  const groupedFonts = allFonts.reduce<Record<string, FontOption[]>>((acc, font) => {
    const key = font.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(font);
    return acc;
  }, {});

  const recordRecentFont = (fontId: string) => {
    setRecentFontIds(prev => [fontId, ...prev.filter(id => id !== fontId)].slice(0, 3));
  };

  const handleFontUpload = async (file: File) => {
    const confirmMsg = "업로드하시는 폰트 파일의 라이선스 및 상업적 이용 가능 여부는 사용자 본인의 책임 하에 있습니다. 계속 진행하시겠습니까?";
    if (!confirm(confirmMsg)) return;

    try {
      const family = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '').trim() || `uploaded-font-${Date.now()}`;
      const fontId = `upload-${Date.now()}`;
      const buffer = await file.arrayBuffer();
      const fontFace = new FontFace(family, buffer);
      await fontFace.load();
      (document.fonts as any).add(fontFace);

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const saved = JSON.parse(localStorage.getItem('novelflow_uploaded_fonts') || '[]');
      const nextSaved = [...saved, { id: fontId, label: family, family, dataUrl }];
      localStorage.setItem('novelflow_uploaded_fonts', JSON.stringify(nextSaved));

      const newFont: FontOption = {
        id: fontId,
        label: family,
        family,
        category: 'uploaded',
        source: 'upload',
      };

      setUploadedFonts(prev => [...prev, newFont]);
      setEditorFontFamily(family);
      recordRecentFont(fontId);
    } catch (error) {
      console.error(error);
      alert('폰트 업로드에 실패했습니다. ttf, otf, woff, woff2 파일인지 확인해 주세요.');
    }
  };

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
    if (selectedEpisodeId && activeEpisode) {
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
      const cleanText = activeEpisode.content.replace(/<[^>]*>/g, '');
      setLastSnapshotWordCount(cleanText.length);
    } else {
      setHistorySnapshots([]);
      setLastSnapshotWordCount(0);
    }
  }, [selectedEpisodeId, selectedProject.id, activeEpisode]);

  useEffect(() => {
    if (selectedEpisodeId) {
      const snapKey = `novelflow_snapshots_${selectedProject.id}_${selectedEpisodeId}`;
      localStorage.setItem(snapKey, JSON.stringify(historySnapshots));
    }
  }, [historySnapshots, selectedEpisodeId, selectedProject.id]);

  useEffect(() => {
    if (!showColorPicker && !showBgColorPicker) return;
    const handleClosePickers = () => {
      setShowColorPicker(false);
      setShowBgColorPicker(false);
    };
    window.addEventListener('click', handleClosePickers);
    return () => window.removeEventListener('click', handleClosePickers);
  }, [showColorPicker, showBgColorPicker]);

  // Calculations
  const charCountWithSpaces = activeEpisode ? activeEpisode.content.replace(/<[^>]*>/g, '').length : 0;
  const charCountWithoutSpaces = activeEpisode ? activeEpisode.content.replace(/<[^>]*>/g, '').replace(/\s/g, '').length : 0;
  const progressPercent = Math.min(100, Math.round((charCountWithSpaces / targetWordCount) * 100)) || 0;
  const manuscriptPages = Math.ceil(charCountWithSpaces / 200) || 0;

  // Ctrl+F / Ctrl+H 글로벌 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindReplace(true);
        setIsReplaceMode(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowFindReplace(true);
        setIsReplaceMode(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 10분 주기 자동 스냅샷
  useEffect(() => {
    if (!selectedEpisodeId || !activeEpisode) return;

    const interval = setInterval(() => {
      if (!activeEpisode.content.trim()) return;

      const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newSnap: Snapshot = {
        id: `snap-auto-time-${Date.now()}`,
        timestamp,
        name: `자동 저장 (${timestamp})`,
        memo: '10분 주기 정기 자동 저장 스냅샷',
        content: activeEpisode.content,
        wordCount: activeEpisode.content.replace(/<[^>]*>/g, '').length,
        type: 'auto_time'
      };

      setHistorySnapshots(prev => {
        const next = [newSnap, ...prev];
        return next.slice(0, 50); // 50개 상한
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedEpisodeId, activeEpisode]);

  // 검색 일치 개수 갱신
  useEffect(() => {
    if (!findQuery) {
      setTotalSearchMatches(0);
      setActiveSearchIndex(0);
      return;
    }
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const escaped = findQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    try {
      const matches = text.match(new RegExp(escaped, 'gi'));
      setTotalSearchMatches(matches ? matches.length : 0);
      setActiveSearchIndex(1);
    } catch {
      setTotalSearchMatches(0);
      setActiveSearchIndex(0);
    }
  }, [findQuery, episodes]);

  const handleFindNext = (backwards = false) => {
    if (!findQuery) return;
    const found = (window as any).find(findQuery, false, backwards, true, false, false, false);
    if (found) {
      setActiveSearchIndex(prev => {
        if (backwards) {
          return prev <= 1 ? totalSearchMatches : prev - 1;
        } else {
          return prev >= totalSearchMatches ? 1 : prev + 1;
        }
      });
    }
  };

  const handleReplaceOne = () => {
    if (!findQuery) return;
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findQuery.toLowerCase()) {
      document.execCommand('insertText', false, replaceQuery);
      handleContentInput();
      handleFindNext(false);
    } else {
      handleFindNext(false);
    }
  };

  const handleReplaceAll = () => {
    if (!editorRef.current || !findQuery) return;
    const currentHtml = editorRef.current.innerHTML;
    const escapedFind = findQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedFind, 'gi');
    const newHtml = currentHtml.replace(regex, replaceQuery);
    editorRef.current.innerHTML = newHtml;
    handleContentInput();
    alert('일괄 교체가 완료되었습니다.');
  };

  const execFormat = (command: string, value: string = '') => {
    restoreSelection();
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
      const matchedFont = allFonts.find(font => font.family === value);
      if (matchedFont) recordRecentFont(matchedFont.id);
    } else {
      document.execCommand(command, false, value);
    }
    handleContentInput();
    saveSelection();
  };

  const handleInsertLink = () => {
    const url = prompt('연결할 URL을 입력하세요:');
    if (url) execFormat('createLink', url);
  };

  const handleInsertTable = () => {
    restoreSelection();
    const rows = prompt('행(Row) 개수를 입력하세요 (기본 3):', '3');
    const cols = prompt('열(Column) 개수를 입력하세요 (기본 3):', '3');
    if (rows && cols) {
      let tableHtml = `<table style="border-collapse: collapse; width: 100%; border: 1px solid ${editorTheme === 'light' ? '#E4E4E7' : editorTheme === 'sepia' ? '#D3C2A0' : '#3F3F46'
        }; margin: 12px 0;">`;
      for (let r = 0; r < parseInt(rows); r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < parseInt(cols); c++) {
          tableHtml += `<td style="border: 1px solid ${editorTheme === 'light' ? '#E4E4E7' : editorTheme === 'sepia' ? '#D3C2A0' : '#3F3F46'
            }; padding: 8px; min-width: 50px;">&nbsp;</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</table>';
      document.execCommand('insertHTML', false, tableHtml);
      handleContentInput();
      saveSelection();
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

    // 1000자 변동 시 자동 스냅샷 저장
    if (lastSnapshotWordCount !== 0 && Math.abs(charCount - lastSnapshotWordCount) >= 1000) {
      const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newSnap: Snapshot = {
        id: `snap-auto-words-${Date.now()}`,
        timestamp,
        name: `자동 저장 (${charCount}자 달성)`,
        memo: '1,000자 글자 수 변동 도달 자동 저장 스냅샷',
        content: html,
        wordCount: charCount,
        type: 'auto_words'
      };
      setHistorySnapshots(prev => [newSnap, ...prev].slice(0, 50));
      setLastSnapshotWordCount(charCount);
    }

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

  const handleCreateSnapshot = () => {
    if (!activeEpisode) return;
    const name = prompt('스냅샷 이름을 입력하세요 (비워두면 타임스탬프로 지정):');
    const memo = prompt('스냅샷 설명을 위한 간단한 메모를 입력하세요 (선택):');

    const timestamp = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newSnap: Snapshot = {
      id: `snap-${Date.now()}`,
      timestamp,
      name: name?.trim() || `스냅샷 (${timestamp})`,
      memo: memo?.trim() || '수동 저장 스냅샷',
      content: activeEpisode.content,
      wordCount: charCountWithSpaces,
      type: 'manual'
    };
    setHistorySnapshots(prev => [newSnap, ...prev]);
    setLastSnapshotWordCount(charCountWithSpaces);
    alert('버전 스냅샷이 저장되었습니다.');
  };

  const handleRestoreSnapshot = (content: string) => {
    if (!editorRef.current || !activeEpisode) return;
    editorRef.current.innerHTML = content;
    handleContentInput();
    const cleanText = content.replace(/<[^>]*>/g, '');
    setLastSnapshotWordCount(cleanText.length);
    alert('선택한 버전으로 복원되었습니다.');
  };

  const handleUpdateSnapshotInfo = (snapId: string, updates: Partial<Snapshot>) => {
    setHistorySnapshots(prev =>
      prev.map(snap =>
        snap.id === snapId ? { ...snap, ...updates } : snap
      )
    );
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

    const itemsToRestore = toRestore.isFolder
      ? [toRestore, ...getRecursiveDescendants(toRestore.id, trashEpisodes)]
      : [toRestore];

    const restoreIds = itemsToRestore.map(i => i.id);

    const restoredItems = itemsToRestore.map(item => {
      const copy = { ...item };
      delete copy.deletedAt;
      return copy;
    });

    setEpisodes(prev => [...prev, ...restoredItems]);
    setTrashEpisodes(prev => prev.filter(ep => !restoreIds.includes(ep.id)));
    if (!toRestore.isFolder) {
      setSelectedEpisodeId(toRestore.id);
    }
  };

  const handleSidebarPermanentlyDeleteEpisode = (epId: string) => {
    const toDelete = trashEpisodes.find(ep => ep.id === epId);
    if (!toDelete) return;
    if (!confirm(`${toDelete.isFolder ? '폴더와 폴더 내 모든 항목' : '이 문서'}를 영구적으로 삭제하시겠습니까? 복구할 수 없습니다.`)) return;

    const itemsToDelete = toDelete.isFolder
      ? [toDelete, ...getRecursiveDescendants(toDelete.id, trashEpisodes)]
      : [toDelete];

    const deleteIds = itemsToDelete.map(i => i.id);
    setTrashEpisodes(prev => prev.filter(ep => !deleteIds.includes(ep.id)));
  };

  const handleMoveToTrash = (epId: string) => {
    const toDelete = episodes.find(ep => ep.id === epId);
    if (!toDelete) return;

    const itemsToDelete = toDelete.isFolder
      ? [toDelete, ...getRecursiveDescendants(toDelete.id, episodes)]
      : [toDelete];

    if (!confirm(`${toDelete.isFolder ? '폴더와 폴더 안의 모든 항목' : '이 문서'}를 휴지통으로 이동하시겠습니까?`)) return;

    const nowStr = new Date().toISOString();
    const deletedItems = itemsToDelete.map(item => ({
      ...item,
      deletedAt: nowStr
    }));

    setTrashEpisodes(prev => [...prev, ...deletedItems]);
    const deleteIds = itemsToDelete.map(i => i.id);
    setEpisodes(prev => prev.filter(ep => !deleteIds.includes(ep.id)));

    if (selectedEpisodeId && deleteIds.includes(selectedEpisodeId)) {
      const remaining = episodes.filter(ep => !deleteIds.includes(ep.id) && !ep.isFolder);
      if (remaining.length > 0) {
        setSelectedEpisodeId(remaining[0].id);
      } else {
        setSelectedEpisodeId(null);
      }
    }
    setContextMenuId(null);
  };

  const handleRenameSave = (id: string) => {
    if (!renamingValue.trim()) {
      setRenamingId(null);
      return;
    }
    setEpisodes(prev =>
      prev.map(ep =>
        ep.id === id ? { ...ep, title: renamingValue.trim(), updatedAt: new Date().toISOString() } : ep
      )
    );
    setRenamingId(null);
  };

  const preventScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop !== 0) {
      e.currentTarget.scrollTop = 0;
    }
    if (e.currentTarget.scrollLeft !== 0) {
      e.currentTarget.scrollLeft = 0;
    }
  };

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden relative" onScroll={preventScroll}>
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
      <div className="h-full shrink-0 relative flex">
        <EpisodeSidebar
          isDark={isDark}
          isFocusMode={isFocusMode}
          innerSidebarCollapsed={innerSidebarCollapsed}
          setInnerSidebarCollapsed={setInnerSidebarCollapsed}
          episodes={episodes}
          setEpisodes={setEpisodes}
          selectedEpisodeId={selectedEpisodeId}
          setSelectedEpisodeId={setSelectedEpisodeId}
          handleAddNewItem={handleAddNewItem}
          expandedFolderIds={expandedFolderIds}
          setExpandedFolderIds={setExpandedFolderIds}
          contextMenuId={contextMenuId}
          setContextMenuId={setContextMenuId}
          renamingId={renamingId}
          setRenamingId={setRenamingId}
          renamingValue={renamingValue}
          setRenamingValue={setRenamingValue}
          handleRenameSave={handleRenameSave}
          handleMoveToTrash={handleMoveToTrash}
          setShowTrashModal={setShowTrashModal}
          trashCount={trashEpisodes.length}
        />
      </div>

      {/* 2. 메인 에디터 컨테이너 */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${themeStyles.bg}`}>
        {activeEpisode ? (
          <>
            {/* 에디터 툴바 */}
            <EditorToolbar
              isDark={isDark}
              isFocusMode={isFocusMode}
              setIsFocusMode={setIsFocusMode}
              execFormat={execFormat}
              editorFontSize={editorFontSize}
              setEditorFontSize={setEditorFontSize}
              editorFontFamily={editorFontFamily}
              recentFontIds={recentFontIds}
              allFonts={allFonts}
              groupedFonts={groupedFonts}
              handleFontUpload={handleFontUpload}
              showFontDropdown={showFontDropdown}
              setShowFontDropdown={setShowFontDropdown}
              showStatsDropdown={showStatsDropdown}
              setShowStatsDropdown={setShowStatsDropdown}
              typewriterMode={typewriterMode}
              setTypewriterMode={setTypewriterMode}
              lineHeight={lineHeight}
              setLineHeight={setLineHeight}
              paragraphSpacing={paragraphSpacing}
              setParagraphSpacing={setParagraphSpacing}
              showFindReplace={showFindReplace}
              setShowFindReplace={setShowFindReplace}
              handleCreateSnapshot={handleCreateSnapshot}
              setShowHistoryModal={setShowHistoryModal}
              historySnapshotsCount={historySnapshots.length}
              editorSaveStatus={editorSaveStatus}
              charCountWithSpaces={charCountWithSpaces}
              charCountWithoutSpaces={charCountWithoutSpaces}
              manuscriptPages={manuscriptPages}
              targetWordCount={targetWordCount}
              progressPercent={progressPercent}
              themeStyles={themeStyles}
              showColorPicker={showColorPicker}
              setShowColorPicker={setShowColorPicker}
              colorPickerPos={colorPickerPos}
              setColorPickerPos={setColorPickerPos}
              showBgColorPicker={showBgColorPicker}
              setShowBgColorPicker={setShowBgColorPicker}
              bgColorPickerPos={bgColorPickerPos}
              setBgColorPickerPos={setBgColorPickerPos}
              handleInsertTable={handleInsertTable}
              handleInsertLink={handleInsertLink}
            />

            {/* 찾기 및 바꾸기 바 */}
            {showFindReplace && (
              <FindReplaceBar
                isDark={isDark}
                themeStyles={themeStyles}
                findQuery={findQuery}
                setFindQuery={setFindQuery}
                replaceQuery={replaceQuery}
                setReplaceQuery={setReplaceQuery}
                activeSearchIndex={activeSearchIndex}
                totalSearchMatches={totalSearchMatches}
                isReplaceMode={isReplaceMode}
                setIsReplaceMode={setIsReplaceMode}
                handleFindNext={handleFindNext}
                handleReplaceOne={handleReplaceOne}
                handleReplaceAll={handleReplaceAll}
                setShowFindReplace={setShowFindReplace}
              />
            )}

            {isDiffMode && diffTargetSnapshot ? (
              /* 좌우 분할 Diff 비교 뷰 */
              <DiffViewPane
                isDark={isDark}
                diffTargetSnapshot={diffTargetSnapshot}
                activeEpisode={activeEpisode}
                setIsDiffMode={setIsDiffMode}
                setDiffTargetSnapshot={setDiffTargetSnapshot}
                handleRestoreSnapshot={handleRestoreSnapshot}
                themeStyles={themeStyles}
              />
            ) : (
              /* 단일 화면 모드 (Centered Paper WYSIWYG) */
              <MainEditorCanvas
                isDark={isDark}
                activeEpisode={activeEpisode}
                editorFontFamily={editorFontFamily}
                editorFontSize={editorFontSize}
                lineHeight={lineHeight}
                typewriterMode={typewriterMode}
                paragraphSpacing={paragraphSpacing}
                editorRef={editorRef}
                handleContentInput={handleContentInput}
                saveSelection={saveSelection}
                handleTitleChange={handleTitleChange}
                editorTheme={editorTheme}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <FileText className="w-12 h-12 text-gray-500 opacity-40 animate-pulse" />
            <p className="text-sm text-gray-500 font-medium">집필할 회차를 선택하거나 새 회차를 만들어 주세요.</p>
            <button
              onClick={() => handleAddNewItem(null, false)}
              className="mt-1 px-4 py-2 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-semibold rounded-xl transition-all duration-150"
            >
              새 회차 만들기
            </button>
          </div>
        )}
      </div>

      {/* 3. 휴지통 모달 */}
      <TrashModal
        isDark={isDark}
        showTrashModal={showTrashModal}
        setShowTrashModal={setShowTrashModal}
        trashEpisodes={trashEpisodes}
        handleSidebarRestoreEpisode={handleSidebarRestoreEpisode}
        handleSidebarPermanentlyDeleteEpisode={handleSidebarPermanentlyDeleteEpisode}
      />

      {/* 4. 버전 기록(스냅샷) 모달 */}
      <SnapshotHistoryModal
        isDark={isDark}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        historySnapshots={historySnapshots}
        snapshotNameEditId={snapshotNameEditId}
        setSnapshotNameEditId={setSnapshotNameEditId}
        snapshotNameEditValue={snapshotNameEditValue}
        setSnapshotNameEditValue={setSnapshotNameEditValue}
        handleUpdateSnapshotInfo={handleUpdateSnapshotInfo}
        snapshotMemoEditId={snapshotMemoEditId}
        setSnapshotMemoEditId={setSnapshotMemoEditId}
        snapshotMemoEditValue={snapshotMemoEditValue}
        setSnapshotMemoEditValue={setSnapshotMemoEditValue}
        setDiffTargetSnapshot={setDiffTargetSnapshot}
        setIsDiffMode={setIsDiffMode}
        setHistorySnapshots={setHistorySnapshots}
      />
    </div>
  );
}
