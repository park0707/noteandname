import { useState, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  Plus,
  Trash2,
  BookOpen,
  ChevronRight,
  FileText,
  Minimize2,
  Maximize2,
  Search,
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
  Folder,
  FolderOpen,
  MoreVertical,
  ChevronUp,
  X
} from 'lucide-react';
import type { Project, Episode, Node, Snapshot } from './types';
import { DEFAULT_FONTS, FONT_CATEGORY_LABELS } from '../../lib/fonts';
import type { FontOption } from '../../lib/fonts';

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
    setShowAddMenu(false);
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
  const [writingSearchQuery, setWritingSearchQuery] = useState('');
  const [trashEpisodes, setTrashEpisodes] = useState<Episode[]>([]);
  const [showTrashModal, setShowTrashModal] = useState(false);

  // Custom Font Dropdown and File Input reference
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Folder tree and custom context menu states
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);

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
            document.fonts.add(fontFace);

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

  const orderedFonts = allFonts;

  const groupedFonts = orderedFonts.reduce<Record<string, FontOption[]>>((acc, font) => {
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
      document.fonts.add(fontFace);

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
      setActiveSearchIndex(matches ? 1 : 0);
    } catch {
      setTotalSearchMatches(0);
      setActiveSearchIndex(0);
    }
  }, [findQuery, episodes]);

  // 단어 단위 LCS Diff 알고리즘
  const diffWords = (oldStr: string, newStr: string): { type: 'added' | 'removed' | 'common'; value: string }[] => {
    const cleanHtml = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    };

    const oldClean = cleanHtml(oldStr);
    const newClean = cleanHtml(newStr);

    const oldWords = oldClean.split(/(\s+)/);
    const newWords = newClean.split(/(\s+)/);

    const dp: number[][] = Array(oldWords.length + 1).fill(0).map(() => Array(newWords.length + 1).fill(0));

    for (let i = 1; i <= oldWords.length; i++) {
      for (let j = 1; j <= newWords.length; j++) {
        if (oldWords[i - 1] === newWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: { type: 'added' | 'removed' | 'common'; value: string }[] = [];
    let i = oldWords.length;
    let j = newWords.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        result.unshift({ type: 'common', value: oldWords[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'added', value: newWords[j - 1] });
        j--;
      } else {
        result.unshift({ type: 'removed', value: oldWords[i - 1] });
        i--;
      }
    }

    return result;
  };

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

    const getTrashChildren = (parentId: string): Episode[] => {
      let children = trashEpisodes.filter(ep => ep.parentId === parentId);
      let all = [...children];
      children.forEach(c => {
        if (c.isFolder) {
          all = [...all, ...getTrashChildren(c.id)];
        }
      });
      return all;
    };

    const itemsToRestore = toRestore.isFolder
      ? [toRestore, ...getTrashChildren(toRestore.id)]
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

    const getTrashChildren = (parentId: string): Episode[] => {
      let children = trashEpisodes.filter(ep => ep.parentId === parentId);
      let all = [...children];
      children.forEach(c => {
        if (c.isFolder) {
          all = [...all, ...getTrashChildren(c.id)];
        }
      });
      return all;
    };

    const itemsToDelete = toDelete.isFolder
      ? [toDelete, ...getTrashChildren(toDelete.id)]
      : [toDelete];

    const deleteIds = itemsToDelete.map(i => i.id);
    setTrashEpisodes(prev => prev.filter(ep => !deleteIds.includes(ep.id)));
  };

  const handleMoveToTrash = (epId: string) => {
    const toDelete = episodes.find(ep => ep.id === epId);
    if (!toDelete) return;

    const getChildren = (parentId: string): Episode[] => {
      let children = episodes.filter(ep => ep.parentId === parentId);
      let all = [...children];
      children.forEach(c => {
        if (c.isFolder) {
          all = [...all, ...getChildren(c.id)];
        }
      });
      return all;
    };

    const itemsToDelete = toDelete.isFolder
      ? [toDelete, ...getChildren(toDelete.id)]
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

  const renderTree = (parentId: string | null = null, depth: number = 0) => {
    const currentItems = episodes.filter(ep => ep.parentId === parentId);

    const sortedItems = [...currentItems].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.title.localeCompare(b.title);
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
                    <div className={`absolute right-0 top-6 z-30 w-36 py-1 rounded-lg border shadow-xl text-xs flex flex-col ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              alert('구글 드라이브 및 노션 연동 가져오기 기능이 기획 중입니다 (구현 예정).');
                              setContextMenuId(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 transition-colors text-gray-500 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                          >
                            가져오기 (예정)
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
    const matched = episodes.filter(ep => ep.title.toLowerCase().includes(query));

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

                  {/* 추가 드롭다운 메뉴 */}
                  {showAddMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowAddMenu(false)} />
                      <div className={`absolute right-0 top-6 z-30 w-36 py-1 rounded-lg border shadow-xl text-xs flex flex-col ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                        }`}>
                        <button
                          onClick={() => handleAddNewItem(null, false)}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                        >
                          새 문서
                        </button>
                        <button
                          onClick={() => handleAddNewItem(null, true)}
                          className={`w-full text-left px-3 py-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                        >
                          새 폴더
                        </button>
                        <button
                          onClick={() => {
                            alert('구글 드라이브 및 노션 연동 가져오기 기능이 기획 중입니다 (구현 예정).');
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 transition-colors text-gray-500 ${isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'}`}
                        >
                          가져오기 (예정)
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 실제 트리 렌더링 또는 검색 결과 */}
              <div className="flex flex-col gap-1">
                {writingSearchQuery.trim() ? renderSearchResults() : renderTree(null)}
              </div>
            </div>
          </div>

          {/* 사이드바 하단 - 휴지통만 남겨둠 */}
          <div className={`p-3 border-t flex flex-col gap-1 shrink-0 ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
            <button
              onClick={() => setShowTrashModal(true)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${isDark ? 'text-gray-400 hover:bg-white/[0.03] hover:text-white' : 'text-gray-600 hover:bg-black/[0.03] hover:text-[#121316]'
                }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              휴지통 ({trashEpisodes.length})
            </button>
          </div>
        </div>
      )}

      {/* 보조 사이드바 접기/토글 버튼 */}
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

      {/* 2. 메인 에디터 컨테이너 */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${themeStyles.bg}`}>
        {activeEpisode ? (
          <>
            {/* 에디터 툴바 */}
            <div className={`px-6 py-2 border-b flex items-center justify-between gap-4 shrink-0 select-none ${themeStyles.toolbar}`}>
              <div className="flex items-center gap-3 overflow-x-auto w-full">
                <div className="flex items-center gap-1 shrink-0">
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

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                {/* 커스텀 폰트 선택 드롭다운 */}
                <div className="relative shrink-0 font-sans">
                  <button
                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                    className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${themeStyles.input}`}
                  >
                    <span className="truncate max-w-[120px]">
                      {allFonts.find(f => f.family === editorFontFamily)?.label || editorFontFamily}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {showFontDropdown && (
                    <div className={`absolute left-0 mt-1 z-50 py-2 w-64 rounded-xl border shadow-2xl flex flex-col ${
                      isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                    }`}>
                      {/* 최상단: 폰트 업로드 하기 */}
                      <div className="px-2 pb-1.5 border-b border-gray-500/10">
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowFontDropdown(false);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-center bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-colors"
                        >
                          + 폰트 업로드 하기
                        </button>
                      </div>

                      {/* 최근 사용 폰트 (3개 제한) */}
                      {recentFontIds.length > 0 && (
                        <div className="px-2 py-1.5 border-b border-gray-500/10">
                          <div className="text-[10px] text-gray-500 font-semibold px-2 mb-1">최근에 쓴 폰트</div>
                          <div className="flex flex-col gap-0.5">
                            {recentFontIds.slice(0, 3).map(fontId => {
                              const font = allFonts.find(f => f.id === fontId);
                              if (!font) return null;
                              return (
                                <button
                                  key={fontId}
                                  type="button"
                                  onClick={() => {
                                    execFormat('fontName', font.family);
                                    setShowFontDropdown(false);
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${
                                    editorFontFamily === font.family ? 'text-[#7480E2] font-bold' : ''
                                  }`}
                                >
                                  {font.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 전체 폰트 목록 */}
                      <div className="max-h-60 overflow-y-auto px-2 py-1">
                        {Object.entries(groupedFonts).map(([category, fonts]) => (
                          <div key={category} className="mb-2 last:mb-0">
                            <div className="text-[9px] text-gray-500 font-bold px-2 py-0.5 uppercase tracking-wider">
                              {FONT_CATEGORY_LABELS[category as keyof typeof FONT_CATEGORY_LABELS]}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {fonts.map(font => (
                                <button
                                  key={font.id}
                                  type="button"
                                  onClick={() => {
                                    execFormat('fontName', font.family);
                                    setShowFontDropdown(false);
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${
                                    editorFontFamily === font.family ? 'text-[#7480E2] font-bold' : ''
                                  }`}
                                >
                                  {font.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".ttf,.otf,.woff,.woff2"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFontUpload(file);
                    e.currentTarget.value = '';
                  }}
                />

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                {/* 폰트 크기 조절 스피너 */}
                <div className="flex items-center gap-1 shrink-0 font-sans">
                  <div className={`flex items-center border rounded-lg overflow-hidden ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                    <input
                      type="number"
                      value={editorFontSize}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if (val > 0) execFormat('fontSize', val.toString());
                      }}
                      className={`w-10 py-1 px-1.5 text-center text-xs font-bold bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'text-white' : 'text-black'}`}
                    />
                    <div className={`flex flex-col border-l shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                      <button
                        onClick={() => execFormat('fontSize', (editorFontSize + 1).toString())}
                        className={`p-0.5 hover:bg-white/[0.04] border-b text-gray-500 hover:text-white shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
                      >
                        <ChevronUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => execFormat('fontSize', Math.max(1, editorFontSize - 1).toString())}
                        className="p-0.5 hover:bg-white/[0.04] text-gray-500 hover:text-white shrink-0"
                      >
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <button
                  onClick={() => execFormat('bold')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] font-bold shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="굵게 (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('italic')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] italic shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="기울임 (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('underline')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] underline shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="밑줄 (Ctrl+U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('strikeThrough')}
                  className={`p-1.5 rounded hover:bg-white/[0.04] line-through shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="취소선"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>

                <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (showColorPicker) {
                        setShowColorPicker(false);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setColorPickerPos({
                          top: rect.bottom + window.scrollY + 6,
                          left: rect.left + window.scrollX
                        });
                        setShowColorPicker(true);
                        setShowBgColorPicker(false);
                      }
                    }}
                    className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center font-bold text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                      }`}
                    title="글자 색상"
                  >
                    A
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                  {showColorPicker && colorPickerPos && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'fixed',
                        top: `${colorPickerPos.top}px`,
                        left: `${colorPickerPos.left}px`,
                      }}
                      className={`z-[9999] p-2 rounded-lg border shadow-xl flex gap-1 ${isDark ? 'bg-[#1E1F22] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
                    >
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

                <div className="relative shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (showBgColorPicker) {
                        setShowBgColorPicker(false);
                      } else {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setBgColorPickerPos({
                          top: rect.bottom + window.scrollY + 6,
                          left: rect.left + window.scrollX
                        });
                        setShowBgColorPicker(true);
                        setShowColorPicker(false);
                      }
                    }}
                    className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                      }`}
                    title="형광펜 효과"
                  >
                    <span className="bg-yellow-500 text-black px-0.5 rounded text-[10px]">ab</span>
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                  {showBgColorPicker && bgColorPickerPos && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'fixed',
                        top: `${bgColorPickerPos.top}px`,
                        left: `${bgColorPickerPos.left}px`,
                      }}
                      className={`z-[9999] p-2 rounded-lg border shadow-xl flex gap-1 ${isDark ? 'bg-[#1E1F22] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
                    >
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
                  className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                    }`}
                  title="모든 스타일 서식 제거"
                >
                  서식지우기
                </button>


              </div>

              <div className="flex items-center gap-3 shrink-0 pl-2">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 transition-colors ${editorSaveStatus === 'saved' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'
                    }`}
                  title={editorSaveStatus === 'saved' ? '저장 완료' : '저장 중...'}
                />
                <button
                  onClick={() => {
                    setShowFindReplace(!showFindReplace);
                    setIsReplaceMode(false);
                  }}
                  title="찾기 및 바꾸기 (Ctrl+F)"
                  className={`p-1.5 rounded-lg border transition-all duration-150 ${
                    showFindReplace
                      ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                      : isDark
                        ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                        : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  title={isFocusMode ? "집중 모드 종료" : "집중 모드 시작"}
                  className={`p-1.5 rounded-lg border transition-all duration-150 ${isFocusMode
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
                    className={`px-3 py-1 rounded text-xs font-semibold border flex items-center gap-1 transition-all ${isDark
                      ? 'bg-[#1F2023] border-white/[0.08] text-gray-300 hover:text-white'
                      : 'bg-[#F3F4F6] border-black/[0.08] text-gray-700 hover:text-black'
                      }`}
                  >
                    {charCountWithSpaces.toLocaleString()}자
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showStatsDropdown && (
                    <div
                      className={`absolute right-0 mt-2 z-40 p-4 rounded-xl border shadow-2xl w-60 flex flex-col gap-3 ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
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
                {/* 좌측: 특수 편집 도구 (정렬, 들여쓰기, 장면전환 구분선, 인용구, 표, 링크 등) */}
                <div className="flex items-center gap-3 overflow-x-auto">
                  <button
                    onClick={() => execFormat('justifyLeft')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="왼쪽 정렬"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => execFormat('justifyCenter')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="가운데 정렬 (웹소설 시/편지용)"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => execFormat('justifyRight')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="오른쪽 정렬"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => execFormat('justifyFull')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="양쪽 정렬"
                  >
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>

                  <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                  <button
                    onClick={() => execFormat('indent')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                      }`}
                    title="들여쓰기 적용 (단락 시작)"
                  >
                    들여쓰기
                  </button>
                  <button
                    onClick={() => execFormat('outdent')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                      }`}
                    title="내어쓰기 적용"
                  >
                    내어쓰기
                  </button>

                  <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                  <button
                    onClick={() => execFormat('insertHTML', '<hr style="border: 0; border-top: 1px dashed #666; margin: 24px 0;" />')}
                    className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                      }`}
                    title="장면 전환용 구분선 삽입"
                  >
                    구분선
                  </button>
                  <button
                    onClick={() => execFormat('formatBlock', '<blockquote>')}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="인용구 블록 설정"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleInsertTable}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="표 삽입"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleInsertLink}
                    className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                    title="링크 삽입"
                  >
                    <Link className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 우측: 줄간격, 문단간격, 타이프라이터, 스냅샷, 이력 */}
                <div className="flex items-center gap-3 shrink-0">
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
                    <span className="text-gray-500 font-medium">문단간격</span>
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

                  <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typewriterMode}
                      onChange={e => setTypewriterMode(e.target.checked)}
                      className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-3.5 h-3.5"
                    />
                    <span className="text-[10px] text-gray-500 font-semibold">타이프라이터 모드</span>
                  </label>

                  <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

                  <button
                    onClick={handleCreateSnapshot}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'
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
              <div className={`px-6 py-2 border-b flex items-center justify-between gap-3 shrink-0 select-none ${themeStyles.toolbar}`}>
                <div className="flex items-center gap-4 flex-wrap">
                  {/* 찾기 영역 */}
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="단어 찾기..."
                      value={findQuery}
                      onChange={e => setFindQuery(e.target.value)}
                      className={`px-2.5 py-1 rounded text-xs border outline-none w-44 ${themeStyles.input}`}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleFindNext(e.shiftKey);
                        }
                      }}
                      autoFocus
                    />
                    <span className="text-[10px] text-gray-500 font-bold px-1 min-w-[50px] text-center">
                      {totalSearchMatches > 0 ? `${activeSearchIndex} / ${totalSearchMatches}` : '0 / 0'}
                    </span>
                    <button
                      onClick={() => handleFindNext(true)}
                      disabled={!findQuery}
                      title="이전 찾기 (Shift+Enter)"
                      className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-400 disabled:opacity-30' : 'hover:bg-black/[0.04] text-gray-600 disabled:opacity-30'}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFindNext(false)}
                      disabled={!findQuery}
                      title="다음 찾기 (Enter)"
                      className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-400 disabled:opacity-30' : 'hover:bg-black/[0.04] text-gray-600 disabled:opacity-30'}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 바꾸기 전환 토글 단추 */}
                  <button
                    onClick={() => setIsReplaceMode(!isReplaceMode)}
                    className={`px-2 py-0.5 rounded text-[10px] border font-bold transition-all ${
                      isReplaceMode
                        ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                        : isDark ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                    }`}
                  >
                    {isReplaceMode ? '바꾸기 숨기기' : '바꾸기 확장'}
                  </button>

                  {/* 바꾸기 영역 */}
                  {isReplaceMode && (
                    <div className="flex items-center gap-2">
                      <div className={`w-[1px] h-3 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />
                      <span className="text-xs text-gray-500">바꿀 내용:</span>
                      <input
                        type="text"
                        placeholder="바꿀 단어..."
                        value={replaceQuery}
                        onChange={e => setReplaceQuery(e.target.value)}
                        className={`px-2.5 py-1 rounded text-xs border outline-none w-40 ${themeStyles.input}`}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleReplaceOne();
                          }
                        }}
                      />
                      <button
                        onClick={handleReplaceOne}
                        disabled={!findQuery}
                        className="px-2.5 py-1 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-[10px] font-bold rounded-lg disabled:opacity-50"
                      >
                        바꾸기
                      </button>
                      <button
                        onClick={handleReplaceAll}
                        disabled={!findQuery}
                        className="px-2.5 py-1 border border-[#5E6AD2]/30 text-[#7480E2] hover:bg-[#5E6AD2]/10 text-[10px] font-bold rounded-lg disabled:opacity-50"
                      >
                        모두 바꾸기
                      </button>
                    </div>
                  )}
                </div>

                {/* 닫기 버튼 */}
                <button
                  onClick={() => {
                    setShowFindReplace(false);
                    setFindQuery('');
                    setReplaceQuery('');
                  }}
                  className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/[0.04] text-gray-400' : 'hover:bg-black/[0.04] text-gray-600'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isDiffMode && diffTargetSnapshot ? (
              /* 좌우 분할 Diff 비교 뷰 */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* 비교 상단 바 */}
                <div className={`px-6 py-3 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>버전 비교 모드</span>
                    <span className="text-[10px] bg-[#5E6AD2]/20 text-[#7480E2] px-1.5 py-0.5 rounded font-semibold">
                      {diffTargetSnapshot.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        handleRestoreSnapshot(diffTargetSnapshot.content);
                        setIsDiffMode(false);
                        setDiffTargetSnapshot(null);
                      }}
                      className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-xl transition-all"
                    >
                      이 스냅샷으로 복원 승인
                    </button>
                    <button
                      onClick={() => {
                        setIsDiffMode(false);
                        setDiffTargetSnapshot(null);
                      }}
                      className={`px-4 py-1.5 border text-xs font-bold rounded-xl transition-all ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'}`}
                    >
                      비교 종료 (에디터 복귀)
                    </button>
                  </div>
                </div>

                {/* 비교 바디 (좌우 스플릿) */}
                <div className="flex-1 flex overflow-hidden">
                  {/* 좌측: 현재 상태 (Diff 하이라이팅) */}
                  <div className={`flex-1 border-r overflow-y-auto px-8 py-10 flex justify-center ${isDark ? 'bg-[#0F1012] border-white/[0.04]' : 'bg-[#F9FAFB] border-black/[0.04]'}`}>
                    <div className={`w-full max-w-2xl flex flex-col rounded-2xl border shadow-lg p-10 font-serif leading-relaxed text-sm overflow-y-auto ${themeStyles.paper}`}>
                      <h4 className="text-xs font-bold text-gray-400 mb-6 border-b border-gray-500/10 pb-2">현재 원고 상태 (변경점 표시)</h4>
                      <div className="whitespace-pre-wrap select-text">
                        {diffWords(diffTargetSnapshot.content, activeEpisode?.content || '').map((change, idx) => {
                          if (change.type === 'added') {
                            return (
                              <span key={idx} className="bg-green-500/20 text-green-500 font-semibold px-0.5 rounded">
                                {change.value}
                              </span>
                            );
                          } else if (change.type === 'removed') {
                            return (
                              <span key={idx} className="bg-red-500/20 text-red-500 line-through px-0.5 rounded">
                                {change.value}
                              </span>
                            );
                          } else {
                            return <span key={idx}>{change.value}</span>;
                          }
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 스냅샷 상태 (읽기 전용) */}
                  <div className={`flex-1 overflow-y-auto px-8 py-10 flex justify-center ${isDark ? 'bg-[#0F1012]' : 'bg-[#F9FAFB]'}`}>
                    <div className={`w-full max-w-2xl flex flex-col rounded-2xl border shadow-lg p-10 font-serif leading-relaxed text-sm overflow-y-auto ${themeStyles.paper}`}>
                      <h4 className="text-xs font-bold text-gray-400 mb-6 border-b border-gray-500/10 pb-2">선택한 스냅샷 원고 상태</h4>
                      <div
                        className="whitespace-pre-wrap select-text opacity-85"
                        dangerouslySetInnerHTML={{ __html: diffTargetSnapshot.content }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Centered Paper WYSIWYG 원고지 편집지 */
              <div
                onClick={() => editorRef.current?.focus()}
                className="flex-1 overflow-y-auto px-6 py-10 flex justify-center cursor-text editor-scroll-container"
              >
                <div
                  className={`w-full flex flex-col h-full rounded-2xl border shadow-lg novela-editor-paper transition-all max-w-3xl ${themeStyles.paper}`}
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
                      className={`w-full font-heading font-bold text-3xl bg-transparent outline-none border-b border-transparent focus:border-[#5E6AD2]/50 pb-2 transition-all ${editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
                        }`}
                    />
                  </div>

                  <div className="flex-1 px-12 pb-12 overflow-y-auto">
                    <style>{`
                      .novela-editor-content p, .novela-editor-content div {
                        margin-bottom: ${paragraphSpacing}px;
                      }
                      .novela-editor-content p:last-child, .novela-editor-content div:last-child {
                        margin-bottom: 0;
                      }
                    `}</style>
                    <div
                      ref={editorRef}
                      contentEditable
                      data-placeholder="내용을 입력하세요..."
                      onInput={handleContentInput}
                      onBlur={saveSelection}
                      onMouseUp={saveSelection}
                      onKeyUp={saveSelection}
                      className="w-full h-full outline-none font-serif min-h-[400px] novela-editor-content"
                    />
                  </div>
                </div>
              </div>
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
      {showTrashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTrashModal(false)} />
          <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'
            }`}>
            <h3 className={`font-heading font-bold text-base mb-4 ${isDark ? 'text-white' : 'text-black'}`}>휴지통</h3>

            <div className="max-h-60 overflow-y-auto pt-2 flex flex-col gap-2 mb-6">
              {trashEpisodes.map(ep => (
                <div
                  key={ep.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
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
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${isDark
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
          <div className={`relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'
            }`}>
            <h3 className={`font-heading font-bold text-base mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>버전 이력 (스냅샷 목록)</h3>
            <p className="text-[10px] text-gray-500 mb-4">스냅샷의 이름과 메모 영역을 클릭하여 자유롭게 내용을 수정할 수 있습니다.</p>

            <div className="max-h-80 overflow-y-auto flex flex-col gap-2 mb-6">
              {historySnapshots.map(snap => (
                <div
                  key={snap.id}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
                    }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 min-w-0">
                      {/* 이름 인라인 수정 */}
                      {snapshotNameEditId === snap.id ? (
                        <input
                          type="text"
                          value={snapshotNameEditValue}
                          onChange={e => setSnapshotNameEditValue(e.target.value)}
                          onBlur={() => {
                            handleUpdateSnapshotInfo(snap.id, { name: snapshotNameEditValue.trim() || snap.name });
                            setSnapshotNameEditId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              handleUpdateSnapshotInfo(snap.id, { name: snapshotNameEditValue.trim() || snap.name });
                              setSnapshotNameEditId(null);
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded border outline-none font-bold text-xs w-40 ${isDark ? 'bg-[#1F2023] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'}`}
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setSnapshotNameEditId(snap.id);
                            setSnapshotNameEditValue(snap.name);
                          }}
                          className={`font-semibold cursor-pointer border-b border-dashed border-gray-500 hover:text-[#7480E2] truncate max-w-[170px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                          title="클릭하여 이름 수정"
                        >
                          {snap.name}
                        </span>
                      )}

                      {/* 자동/수동 뱃지 */}
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                        snap.type === 'manual'
                          ? 'bg-blue-500/10 text-blue-400'
                          : snap.type === 'auto_words'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {snap.type === 'manual' ? '수동' : snap.type === 'auto_words' ? '자동(자수)' : '자동(시간)'}
                      </span>
                    </div>

                    {/* 메모 인라인 수정 */}
                    {snapshotMemoEditId === snap.id ? (
                      <input
                        type="text"
                        value={snapshotMemoEditValue}
                        onChange={e => setSnapshotMemoEditValue(e.target.value)}
                        onBlur={() => {
                          handleUpdateSnapshotInfo(snap.id, { memo: snapshotMemoEditValue.trim() || '메모 없음' });
                          setSnapshotMemoEditId(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleUpdateSnapshotInfo(snap.id, { memo: snapshotMemoEditValue.trim() || '메모 없음' });
                            setSnapshotMemoEditId(null);
                          }
                        }}
                        className={`px-1.5 py-0.5 rounded border outline-none text-[10px] w-full ${isDark ? 'bg-[#1F2023] border-white/[0.08] text-gray-300' : 'bg-white border-black/[0.08] text-gray-700'}`}
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setSnapshotMemoEditId(snap.id);
                          setSnapshotMemoEditValue(snap.memo || '');
                        }}
                        className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400 truncate max-w-[240px]"
                        title="클릭하여 메모 수정"
                      >
                        {snap.memo || '메모 없음 (클릭하여 추가)'}
                      </span>
                    )}

                    <span className="text-[9px] text-gray-400 mt-1">저장일자: {snap.timestamp} (글자수: {snap.wordCount.toLocaleString()}자)</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setDiffTargetSnapshot(snap);
                        setIsDiffMode(true);
                        setShowHistoryModal(false);
                      }}
                      className="px-2.5 py-1 rounded bg-[#5E6AD2] text-white font-semibold hover:bg-[#7480E2] transition-colors"
                      title="스냅샷 비교 후 복원 진행"
                    >
                      복원
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
              {historySnapshots.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-500">생성된 스냅샷 버전이 없습니다.</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${isDark
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
