import { useEffect, useState, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { FileText } from 'lucide-react';
import type { Project, Episode, Node, Snapshot } from './types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useAlertConfirm } from '../../context/AlertConfirmContext';

// Import custom hooks
import { useEpisodes } from '../../hooks/useEpisodes';
import { useEditorFormat } from '../../hooks/useEditorFormat';

// Import modular subcomponents
import EpisodeSidebar from './writingspace/EpisodeSidebar';
import EditorToolbar from './writingspace/EditorToolbar';
import FindReplaceBar from './writingspace/FindReplaceBar';
import DiffViewPane from './writingspace/DiffViewPane';
import MainEditorCanvas from './writingspace/MainEditorCanvas';
import TrashModal from './writingspace/Modals/TrashModal';
import SnapshotHistoryModal from './writingspace/Modals/SnapshotHistoryModal';
import EditorInspector from './writingspace/EditorInspector';

const formatSnapshotTimestamp = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}-${min}`;
};

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
  targetWordCount?: number;
}

export default function WritingSpace(props: WritingSpaceProps) {
  const {
    selectedProject,
    episodes,
    setEpisodes,
    selectedEpisodeId,
    setSelectedEpisodeId,
    editorSaveStatus,
    isDark,
    targetWordCount: targetWordCountProp = 3000,
  } = props;

  const { user } = useAuth();
  const { showAlert } = useAlertConfirm();

  const activeEpisode = episodes.find(ep => ep.id === selectedEpisodeId) || null;

  // 1. 에피소드 및 휴지통 커스텀 훅
  const {
    expandedFolderIds,
    setExpandedFolderIds,
    contextMenuId,
    setContextMenuId,
    renamingId,
    setRenamingId,
    renamingValue,
    setRenamingValue,
    trashEpisodes,
    showTrashModal,
    setShowTrashModal,
    handleAddNewItem,
    handleTitleChange,
    handleMoveToTrash,
    handleSidebarRestoreEpisode,
    handleSidebarPermanentlyDeleteEpisode
  } = useEpisodes(selectedProject, episodes, setEpisodes, selectedEpisodeId, setSelectedEpisodeId);

  // 2. 에디터 서식 및 스타일 커스텀 훅
  const {
    editorFontSize,
    setEditorFontSize,
    editorFontFamily,
    recentFontIds,
    showFontDropdown,
    setShowFontDropdown,
    showStatsDropdown,
    setShowStatsDropdown,
    showColorPicker,
    setShowColorPicker,
    colorPickerPos,
    setColorPickerPos,
    showBgColorPicker,
    setShowBgColorPicker,
    bgColorPickerPos,
    setBgColorPickerPos,
    typewriterMode,
    setTypewriterMode,
    lineHeight,
    setLineHeight,
    paragraphSpacing,
    setParagraphSpacing,
    editorWidth,
    firstLineIndent,
    setFirstLineIndent,
    editorThemeOverride,
    editorRef,
    saveSelection,
    restoreSelection,
    execFormat,
    allFonts,
    groupedFonts,
    handleFontUpload,
    undo,
    redo,
    getSelectionFontState,
    getSelectionSizeState
  } = useEditorFormat();

  // 에디터 테마는 에디터 전용 오버라이드가 있으면 적용, 없으면(system) 메인 화면의 다크/라이트 모드에서 파생
  const editorTheme: 'dark' | 'light' | 'sepia' | 'gray' = 
    editorThemeOverride === 'system' ? (isDark ? 'dark' : 'light') : editorThemeOverride;

  // Local editor configurations & layout states
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [innerSidebarCollapsed, setInnerSidebarCollapsed] = useState(false);
  const [showInspector, setShowInspector] = useState(false);

  const [showFindReplace, setShowFindReplace] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [totalSearchMatches, setTotalSearchMatches] = useState(0);

  const [historySnapshots, setHistorySnapshots] = useState<Snapshot[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [lastSnapshotWordCount, setLastSnapshotWordCount] = useState(0);
  const loadedEpisodeIdRef = useRef<string | null>(null);

  // 간편 스냅샷 이름/메모 입력 모달 상태
  const [showSnapshotInputModal, setShowSnapshotInputModal] = useState(false);
  const [snapshotInputName, setSnapshotInputName] = useState('');
  const [snapshotInputMemo, setSnapshotInputMemo] = useState('');

  // 자동 스냅샷 설정 상태 및 참조 변수
  const [autoSaveWordsEnabled, setAutoSaveWordsEnabled] = useState(true);
  const [autoSaveWordsThreshold, setAutoSaveWordsThreshold] = useState(1000);
  const [autoSaveTimeEnabled, setAutoSaveTimeEnabled] = useState(false);
  const [autoSaveTimeInterval, setAutoSaveTimeInterval] = useState(15); // in minutes
  const [showAutoSaveModal, setShowAutoSaveModal] = useState(false);

  const [tempWordsEnabled, setTempWordsEnabled] = useState(true);
  const [tempWordsThreshold, setTempWordsThreshold] = useState(1000);
  const [tempTimeEnabled, setTempTimeEnabled] = useState(false);
  const [tempTimeInterval, setTempTimeInterval] = useState(15);

  const lastTimeSavedTimeRef = useRef<number>(Date.now());
  const lastContentChangedTimeRef = useRef<number>(Date.now());
  const lastTimeSavedContentRef = useRef<string>('');
  const lastTimeSavedEpisodeIdRef = useRef<string | null>(null);

  // Snapshot visual comparison states
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [diffTargetSnapshot, setDiffTargetSnapshot] = useState<Snapshot | null>(null);

  const [currentFontFamily, setCurrentFontFamily] = useState<string | 'mixed'>(editorFontFamily);
  const [currentFontSize, setCurrentFontSize] = useState<number | 'mixed'>(editorFontSize);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editorRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!editorRef.current.contains(range.commonAncestorContainer)) return;

      const activeFont = getSelectionFontState();
      const activeSize = getSelectionSizeState();

      if (activeFont) {
        setCurrentFontFamily(activeFont);
      }
      if (activeSize) {
        setCurrentFontSize(activeSize);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [getSelectionFontState, getSelectionSizeState, editorRef]);

  const [snapshotNameEditId, setSnapshotNameEditId] = useState<string | null>(null);
  const [snapshotNameEditValue, setSnapshotNameEditValue] = useState('');
  const [snapshotMemoEditId, setSnapshotMemoEditId] = useState<string | null>(null);
  const [snapshotMemoEditValue, setSnapshotMemoEditValue] = useState('');

  // Sync editorRef.innerHTML when selectedEpisodeId or activeEpisode.content changes
  useEffect(() => {
    if (editorRef.current && activeEpisode) {
      if (editorRef.current.innerHTML !== activeEpisode.content) {
        editorRef.current.innerHTML = activeEpisode.content || '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEpisodeId, activeEpisode?.content]);

  // Load and sync snapshots
  useEffect(() => {
    const loadSnapshots = async () => {
      if (!selectedEpisodeId || !activeEpisode) {
        setHistorySnapshots([]);
        setLastSnapshotWordCount(0);
        loadedEpisodeIdRef.current = selectedEpisodeId;
        return;
      }
      
      const snapKey = `novelflow_snapshots_${selectedProject.id}_${selectedEpisodeId}`;
      const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      if (isGuest) {
        const savedSnaps = localStorage.getItem(snapKey);
        if (savedSnaps) {
          try {
            const parsed: Snapshot[] = JSON.parse(savedSnaps);
            const filtered = parsed.filter(s => {
              if (!s.createdAt) return true; // Keep legacy snapshots
              return new Date(s.createdAt) >= thirtyDaysAgo;
            });
            setHistorySnapshots(filtered);
            if (filtered.length !== parsed.length) {
              localStorage.setItem(snapKey, JSON.stringify(filtered));
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          setHistorySnapshots([]);
        }
        const cleanText = activeEpisode.content.replace(/<[^>]*>/g, '');
        setLastSnapshotWordCount(cleanText.length);
        loadedEpisodeIdRef.current = selectedEpisodeId;
        return;
      }

      // Supabase에서 가져오기
      try {
        const { data, error } = await supabase
          .from('episode_versions')
          .select('*')
          .eq('episode_id', selectedEpisodeId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const dbSnaps: Snapshot[] = data.map(d => ({
            id: d.id,
            timestamp: formatSnapshotTimestamp(new Date(d.created_at)),
            name: d.name || '스냅샷',
            memo: d.memo || '',
            content: d.content || '',
            charCount: d.char_count || 0,
            type: 'manual',
            createdAt: d.created_at,
            isBookmarked: !!d.is_bookmarked
          }));

          const filtered = dbSnaps.filter(s => {
            if (!s.createdAt) return true;
            return new Date(s.createdAt) >= thirtyDaysAgo;
          });

          setHistorySnapshots(filtered);
          localStorage.setItem(snapKey, JSON.stringify(filtered));

          // Background cleanup: Delete versions older than 30 days from database for this episode
          const cleanupDateString = thirtyDaysAgo.toISOString();
          (async () => {
            try {
              await supabase
                .from('episode_versions')
                .delete()
                .eq('episode_id', selectedEpisodeId)
                .lt('created_at', cleanupDateString);
            } catch (err) {
              console.error('Failed to clean up old snapshots in Supabase:', err);
            }
          })();
        }
      } catch (err) {
        console.error('Failed to load snapshots from Supabase:', err);
        // Fallback to local
        const savedSnaps = localStorage.getItem(snapKey);
        if (savedSnaps) {
          try {
            const parsed: Snapshot[] = JSON.parse(savedSnaps);
            const filtered = parsed.filter(s => {
              if (!s.createdAt) return true;
              return new Date(s.createdAt) >= thirtyDaysAgo;
            });
            setHistorySnapshots(filtered);
          } catch (e) {
            console.error(e);
          }
        }
      } finally {
        const cleanText = activeEpisode.content.replace(/<[^>]*>/g, '');
        setLastSnapshotWordCount(cleanText.length);
        loadedEpisodeIdRef.current = selectedEpisodeId;
      }
    };

    loadSnapshots();
  }, [selectedEpisodeId, selectedProject.id, activeEpisode, user]);

  useEffect(() => {
    if (selectedEpisodeId && loadedEpisodeIdRef.current === selectedEpisodeId) {
      const snapKey = `novelflow_snapshots_${selectedProject.id}_${selectedEpisodeId}`;
      localStorage.setItem(snapKey, JSON.stringify(historySnapshots));
    }
  }, [historySnapshots, selectedEpisodeId, selectedProject.id]);

  // Load configuration from localStorage
  useEffect(() => {
    if (!selectedProject.id) return;
    const configKey = `novelflow_autosave_config_${selectedProject.id}`;
    const saved = localStorage.getItem(configKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAutoSaveWordsEnabled(parsed.wordsEnabled ?? true);
        setAutoSaveWordsThreshold(parsed.wordsThreshold ?? 1000);
        setAutoSaveTimeEnabled(parsed.timeEnabled ?? false);
        setAutoSaveTimeInterval(parsed.timeInterval ?? 15);
      } catch (e) {
        console.error('Failed to parse autosave config:', e);
      }
    } else {
      setAutoSaveWordsEnabled(true);
      setAutoSaveWordsThreshold(1000);
      setAutoSaveTimeEnabled(false);
      setAutoSaveTimeInterval(15);
    }
  }, [selectedProject.id]);

  // Sync temporary states when opening the auto-save config modal
  useEffect(() => {
    if (showAutoSaveModal) {
      setTempWordsEnabled(autoSaveWordsEnabled);
      setTempWordsThreshold(autoSaveWordsThreshold);
      setTempTimeEnabled(autoSaveTimeEnabled);
      setTempTimeInterval(autoSaveTimeInterval);
    }
  }, [showAutoSaveModal, autoSaveWordsEnabled, autoSaveWordsThreshold, autoSaveTimeEnabled, autoSaveTimeInterval]);

  // Initialize refs for time-based auto-save
  useEffect(() => {
    if (activeEpisode && lastTimeSavedEpisodeIdRef.current !== selectedEpisodeId) {
      lastTimeSavedContentRef.current = activeEpisode.content;
      lastTimeSavedTimeRef.current = Date.now();
      lastContentChangedTimeRef.current = Date.now();
      lastTimeSavedEpisodeIdRef.current = selectedEpisodeId;
    }
  }, [selectedEpisodeId, activeEpisode]);

  // Background timer for time-based auto-save
  useEffect(() => {
    if (!autoSaveTimeEnabled || !selectedEpisodeId || !activeEpisode) return;

    const intervalMs = autoSaveTimeInterval * 60 * 1000;
    
    const checkTimer = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastSave = now - lastTimeSavedTimeRef.current;
      const timeSinceLastChange = now - lastContentChangedTimeRef.current;

      if (timeSinceLastSave >= intervalMs) {
        const currentContent = editorRef.current?.innerHTML || '';
        if (currentContent !== lastTimeSavedContentRef.current) {
          const oneHourMs = 60 * 60 * 1000;
          if (timeSinceLastChange < oneHourMs) {
            const text = editorRef.current?.innerText || '';
            const charCount = text.length;
            const timestamp = formatSnapshotTimestamp();
            const snapId = crypto.randomUUID();
            const snapName = `자동 저장 (${autoSaveTimeInterval}분 경과)`;
            const snapMemo = `${autoSaveTimeInterval}분 간격 시간 조건 도달 자동 저장 스냅샷`;

            const newSnap: Snapshot = {
              id: snapId,
              timestamp,
              name: snapName,
              memo: snapMemo,
              content: currentContent,
              charCount: charCount,
              type: 'auto_time',
              createdAt: new Date().toISOString()
            };

            setHistorySnapshots(prev => [newSnap, ...prev].slice(0, 50));
            setLastSnapshotWordCount(charCount);
            
            lastTimeSavedTimeRef.current = now;
            lastTimeSavedContentRef.current = currentContent;

            const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');
            if (!isGuest) {
              try {
                const { error } = await supabase
                  .from('episode_versions')
                  .insert({
                    id: snapId,
                    episode_id: selectedEpisodeId,
                    name: snapName,
                    memo: snapMemo,
                    content: currentContent,
                    char_count: charCount
                  });
                if (error) throw error;
              } catch (err) {
                console.error('Failed to auto-save time snapshot to Supabase:', err);
              }
            }
          }
        }
      }
    }, 15000);

    return () => clearInterval(checkTimer);
  }, [autoSaveTimeEnabled, autoSaveTimeInterval, selectedEpisodeId, activeEpisode, user, selectedProject.id, editorRef]);

  useEffect(() => {
    if (!showColorPicker && !showBgColorPicker) return;
    const handleClosePickers = () => {
      setShowColorPicker(false);
      setShowBgColorPicker(false);
    };
    window.addEventListener('click', handleClosePickers);
    return () => window.removeEventListener('click', handleClosePickers);
  }, [showColorPicker, showBgColorPicker, setShowColorPicker, setShowBgColorPicker]);

  // Calculations — targetWordCount는 props에서 전달받은 값 사용
  const targetWordCount = targetWordCountProp;
  const charCountWithSpaces = activeEpisode ? activeEpisode.content.replace(/<[^>]*>/g, '').length : 0;
  const charCountWithoutSpaces = activeEpisode ? activeEpisode.content.replace(/<[^>]*>/g, '').replace(/\s/g, '').length : 0;
  const progressPercent = Math.min(100, Math.round((charCountWithSpaces / targetWordCount) * 100)) || 0;
  const manuscriptPages = Math.ceil(charCountWithSpaces / 200) || 0;

  // Ctrl+F / Ctrl+H / Ctrl+Z / Ctrl+Y 글로벌 단축키 핸들러
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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo(handleContentInput);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo(handleContentInput);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 10분 주기 자동 스냅샷
  useEffect(() => {
    if (!selectedEpisodeId || !activeEpisode) return;

    const interval = setInterval(() => {
      if (!activeEpisode.content.trim()) return;

      const timestamp = formatSnapshotTimestamp();
      const newSnap: Snapshot = {
        id: `snap-auto-time-${Date.now()}`,
        timestamp,
        name: `자동 저장 (${timestamp})`,
        memo: '10분 주기 정기 자동 저장 스냅샷',
        content: activeEpisode.content,
        charCount: activeEpisode.content.replace(/<[^>]*>/g, '').length,
        type: 'auto_time',
        createdAt: new Date().toISOString()
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
  }, [findQuery, episodes, editorRef]);

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
    showAlert('일괄 교체가 완료되었습니다.');
  };









  const centerTypewriterCaret = () => {
    if (!typewriterMode) return;
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let rect = range.getBoundingClientRect();
        
        // If range is collapsed and returned zero/empty rect, insert a temporary span to get coordinates
        if (range.collapsed && (!rect || rect.top === 0 || rect.height === 0)) {
          const tempSpan = document.createElement('span');
          tempSpan.appendChild(document.createTextNode('\u200B'));
          try {
            const clone = range.cloneRange();
            clone.insertNode(tempSpan);
            rect = tempSpan.getBoundingClientRect();
            
            const parent = tempSpan.parentNode;
            if (parent) {
              parent.removeChild(tempSpan);
            }
            
            // Restore selection range
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (e) {
            console.error('Failed to get typewriter position:', e);
          }
        }

        if (rect && rect.top !== 0) {
          const scrollContainer = editorRef.current?.closest('.editor-scroll-container');
          if (scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const caretRelativeY = rect.top - containerRect.top;
            const centerY = containerRect.height / 2;
            
            const targetScrollTop = scrollContainer.scrollTop + (caretRelativeY - centerY);
            scrollContainer.scrollTo({
              top: targetScrollTop,
              behavior: 'auto'
            });
          }
        }
      }
    }, 10);
  };

  const saveAutoSaveConfig = (wordsOn: boolean, threshold: number, timeOn: boolean, interval: number) => {
    setAutoSaveWordsEnabled(wordsOn);
    setAutoSaveWordsThreshold(threshold);
    setAutoSaveTimeEnabled(timeOn);
    setAutoSaveTimeInterval(interval);
    
    if (selectedProject.id) {
      const configKey = `novelflow_autosave_config_${selectedProject.id}`;
      localStorage.setItem(configKey, JSON.stringify({
        wordsEnabled: wordsOn,
        wordsThreshold: threshold,
        timeEnabled: timeOn,
        timeInterval: interval
      }));
    }
    setShowAutoSaveModal(false);
  };

  const handleSelectionChange = () => {
    saveSelection();
    if (typewriterMode) {
      centerTypewriterCaret();
    }
  };

  const handleContentInput = () => {
    if (!editorRef.current || !selectedEpisodeId) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    const charCount = text.length;

    // Update content change time ref for time-based auto-save checks
    lastContentChangedTimeRef.current = Date.now();

    setEpisodes(prev =>
      prev.map(ep =>
        ep.id === selectedEpisodeId
          ? { ...ep, content: html, charCount: charCount, updatedAt: new Date().toISOString() }
          : ep
      )
    );

    // 글자 수 조건부에 따른 자동 스냅샷 저장
    if (autoSaveWordsEnabled && lastSnapshotWordCount !== 0 && Math.abs(charCount - lastSnapshotWordCount) >= autoSaveWordsThreshold) {
      const timestamp = formatSnapshotTimestamp();
      const snapId = crypto.randomUUID();
      const snapName = `자동 저장 (${charCount}자 달성)`;
      const snapMemo = `${autoSaveWordsThreshold.toLocaleString()}자 글자 수 변동 도달 자동 저장 스냅샷`;
      
      const newSnap: Snapshot = {
        id: snapId,
        timestamp,
        name: snapName,
        memo: snapMemo,
        content: html,
        charCount: charCount,
        type: 'auto_words',
        createdAt: new Date().toISOString()
      };
      setHistorySnapshots(prev => [newSnap, ...prev].slice(0, 50));
      setLastSnapshotWordCount(charCount);

      const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');
      if (!isGuest && selectedEpisodeId) {
        (async () => {
          try {
            const { error } = await supabase
              .from('episode_versions')
              .insert({
                id: snapId,
                episode_id: selectedEpisodeId,
                name: snapName,
                memo: snapMemo,
                content: html,
                char_count: charCount
              });
            if (error) throw error;
          } catch (err) {
            console.error('Failed to auto-save snapshot to Supabase:', err);
          }
        })();
      }
    }

    if (typewriterMode) {
      centerTypewriterCaret();
    }
  };

  const handleCreateSnapshot = () => {
    if (!activeEpisode) return;
    // 모달을 열어 이름/메모 입력 받기
    const timestamp = formatSnapshotTimestamp();
    setSnapshotInputName(`스냅샷 (${timestamp})`);
    setSnapshotInputMemo('');
    setShowSnapshotInputModal(true);
  };

  // 모달 확인 시 스냅샷 실제 저장
  const confirmCreateSnapshot = async () => {
    if (!activeEpisode) return;
    const timestamp = formatSnapshotTimestamp();
    const snapId = crypto.randomUUID();
    const snapName = snapshotInputName.trim() || `스냅샷 (${timestamp})`;
    const snapMemo = snapshotInputMemo.trim() || '수동 저장 스냅샷';

    const newSnap: Snapshot = {
      id: snapId,
      timestamp,
      name: snapName,
      memo: snapMemo,
      content: activeEpisode.content,
      charCount: charCountWithSpaces,
      type: 'manual',
      createdAt: new Date().toISOString()
    };
    setHistorySnapshots(prev => [newSnap, ...prev]);
    setLastSnapshotWordCount(charCountWithSpaces);
    setShowSnapshotInputModal(false);

    const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');
    if (!isGuest && selectedEpisodeId) {
      try {
        const { error } = await supabase
          .from('episode_versions')
          .insert({
            id: snapId,
            episode_id: selectedEpisodeId,
            name: snapName,
            memo: snapMemo,
            content: activeEpisode.content,
            char_count: charCountWithSpaces
          });
        if (error) throw error;
      } catch (err) {
        console.error('Failed to insert snapshot to Supabase:', err);
      }
    }
  };

  const handleRestoreSnapshot = (content: string) => {
    if (!activeEpisode) return;

    const cleanText = content.replace(/<[^>]*>/g, '');
    const charCount = cleanText.length;

    setEpisodes(prev =>
      prev.map(ep =>
        ep.id === selectedEpisodeId
          ? { ...ep, content: content, charCount: charCount, updatedAt: new Date().toISOString() }
          : ep
      )
    );

    setLastSnapshotWordCount(charCount);

    if (editorRef.current) {
      editorRef.current.innerHTML = content;
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.focus();
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
    }
  };

  const handleUpdateSnapshotInfo = async (snapId: string, updates: Partial<Snapshot>) => {
    setHistorySnapshots(prev =>
      prev.map(snap =>
        snap.id === snapId ? { ...snap, ...updates } : snap
      )
    );

    const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');
    if (!isGuest) {
      try {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.memo !== undefined) dbUpdates.memo = updates.memo;
        if (updates.isBookmarked !== undefined) dbUpdates.is_bookmarked = updates.isBookmarked;

        const { error } = await supabase
          .from('episode_versions')
          .update(dbUpdates)
          .eq('id', snapId);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update snapshot in Supabase:', err);
      }
    }
  };

  const handleDeleteSnapshot = async (snapId: string) => {
    setHistorySnapshots(prev => prev.filter(snap => snap.id !== snapId));

    const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');
    if (!isGuest) {
      try {
        const { error } = await supabase
          .from('episode_versions')
          .delete()
          .eq('id', snapId);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete snapshot from Supabase:', err);
      }
    }
  };

  const themeStyles = {
    dark: { bg: 'bg-[#0F1012]', paper: 'bg-[#161719] text-gray-200 border-white/[0.04]', toolbar: 'bg-[#161719] border-white/[0.04]', input: 'bg-[#1F2023] border-white/[0.08] text-gray-300' },
    light: { bg: 'bg-[#F0F0F3]', paper: 'bg-white text-gray-800 border-black/[0.04]', toolbar: 'bg-white border-black/[0.04]', input: 'bg-[#F3F4F6] border-black/[0.08] text-gray-800' },
    sepia: { bg: 'bg-[#FAF0DD]', paper: 'bg-[#F4ECD8] text-[#5B4636] border-[#D3C2A0]', toolbar: 'bg-[#F4ECD8] border-[#D3C2A0]', input: 'bg-[#EBDCB9] border-[#D3C2A0] text-[#5B4636]' },
    gray: { bg: 'bg-[#202124]', paper: 'bg-[#2E3033] text-gray-200 border-[#4B5563]', toolbar: 'bg-[#2E3033] border-[#4B5563]', input: 'bg-[#3D4044] border-[#4B5563] text-gray-200' }
  }[editorTheme];



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
              currentFontFamily={currentFontFamily}
              currentFontSize={currentFontSize}
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
              firstLineIndent={firstLineIndent}
              setFirstLineIndent={setFirstLineIndent}
              showFindReplace={showFindReplace}
              setShowFindReplace={setShowFindReplace}
              showInspector={showInspector}
              setShowInspector={setShowInspector}
              handleCreateSnapshot={handleCreateSnapshot}
              handleOpenAutoSaveModal={() => setShowAutoSaveModal(true)}
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
              saveSelection={saveSelection}
              restoreSelection={restoreSelection}
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

            <div className="flex-1 flex overflow-hidden">
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
                  lineHeight={lineHeight}
                  typewriterMode={typewriterMode}
                  paragraphSpacing={paragraphSpacing}
                  editorWidth={editorWidth}
                  firstLineIndent={firstLineIndent}
                  editorRef={editorRef}
                  handleContentInput={handleContentInput}
                  saveSelection={handleSelectionChange}
                  handleTitleChange={handleTitleChange}
                  editorTheme={editorTheme}
                />
              )}

              {/* 맞춤법 검사기 우측 패널 */}
              {showInspector && (
                <EditorInspector
                  isDark={isDark}
                  themeStyles={themeStyles}
                  editorRef={editorRef}
                  onClose={() => setShowInspector(false)}
                  handleContentInput={handleContentInput}
                />
              )}
            </div>
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
        handleDeleteSnapshot={handleDeleteSnapshot}
      />

      {/* 5. 버전 스냅샷 이름/메모 인라인 입력 모달 */}
      {showSnapshotInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">📌 버전 스냅샷 저장</h3>
              <button onClick={() => setShowSnapshotInputModal(false)} className="text-gray-400 hover:text-gray-200 text-xs font-bold">✕</button>
            </div>
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">스냅샷 이름</label>
                <input
                  type="text"
                  value={snapshotInputName}
                  onChange={e => setSnapshotInputName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmCreateSnapshot(); if (e.key === 'Escape') setShowSnapshotInputModal(false); }}
                  placeholder="예: 1화 완성본"
                  className={`px-3 py-1.5 rounded-lg border outline-none ${isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'}`}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">메모 (선택)</label>
                <input
                  type="text"
                  value={snapshotInputMemo}
                  onChange={e => setSnapshotInputMemo(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmCreateSnapshot(); if (e.key === 'Escape') setShowSnapshotInputModal(false); }}
                  placeholder="예: 1차 퇴고 완료 후 저장"
                  className={`px-3 py-1.5 rounded-lg border outline-none ${isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'}`}
                />
              </div>
            </div>
            <div className="flex gap-2.5 mt-1">
              <button
                onClick={() => setShowSnapshotInputModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'}`}
              >
                취소
              </button>
              <button
                onClick={confirmCreateSnapshot}
                className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 자동 스냅샷 저장 설정 모달 */}
      {showAutoSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'}`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">⚙️ 자동 저장 설정</h3>
              <button onClick={() => setShowAutoSaveModal(false)} className="text-gray-400 hover:text-gray-200 text-xs font-bold">✕</button>
            </div>
            
            <div className="flex flex-col gap-4 text-xs">
              {/* 글자 수 기준 */}
              <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.06]'}`}>
                <label className="flex items-center justify-between font-semibold cursor-pointer">
                  <span>글자 수 기준 자동 저장</span>
                  <input
                    type="checkbox"
                    checked={tempWordsEnabled}
                    onChange={e => setTempWordsEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4 cursor-pointer"
                  />
                </label>
                {tempWordsEnabled && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400">조건: </span>
                    <input
                      type="number"
                      value={tempWordsThreshold}
                      onChange={e => setTempWordsThreshold(Math.max(10, parseInt(e.target.value) || 0))}
                      className={`w-28 px-2.5 py-1 rounded border outline-none text-right ${isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'}`}
                    />
                    <span className="text-gray-400">자 변동 시 저장</span>
                  </div>
                )}
              </div>

              {/* 시간 기준 */}
              <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.06]'}`}>
                <label className="flex items-center justify-between font-semibold cursor-pointer">
                  <span>시간 간격 기준 자동 저장</span>
                  <input
                    type="checkbox"
                    checked={tempTimeEnabled}
                    onChange={e => setTempTimeEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4 cursor-pointer"
                  />
                </label>
                {tempTimeEnabled && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400">간격: </span>
                    <select
                      value={tempTimeInterval}
                      onChange={e => setTempTimeInterval(parseInt(e.target.value))}
                      className={`px-2.5 py-1 rounded border outline-none ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-white border-black/[0.08] text-black focus:border-[#5E6AD2]'}`}
                    >
                      <option value={1}>1분 (테스트용)</option>
                      <option value={5}>5분</option>
                      <option value={10}>10분</option>
                      <option value={15}>15분</option>
                      <option value={30}>30분</option>
                      <option value={60}>60분</option>
                    </select>
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-1 select-none">
                  ※ 1시간 이상 글의 변화가 없으면 자동으로 저장하지 않습니다.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setShowAutoSaveModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'}`}
              >
                취소
              </button>
              <button
                onClick={() => saveAutoSaveConfig(tempWordsEnabled, tempWordsThreshold, tempTimeEnabled, tempTimeInterval)}
                className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
