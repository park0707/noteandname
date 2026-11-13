import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Minimize2,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Download,
  Indent,
  Outdent,
  GitCommit,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import type { Foreshadowing, Episode } from '../types';
import { getOrderedDocumentList } from '../utils';
import { FONT_CATEGORY_LABELS } from '../../../lib/fonts';
import type { FontOption } from '../../../lib/fonts';
import { useAlertConfirm } from '../../../context/AlertConfirmContext';

// Import modularized components and utils
import { 
  convertHtmlToMarkdown 
} from './editorUtils';
import PlantForeshadowingModal from './Modals/PlantForeshadowingModal';
import ResolveForeshadowingModal from './Modals/ResolveForeshadowingModal';
import ForeshadowingListModal from './Modals/ForeshadowingListModal';

interface EditorToolbarProps {
  isDark: boolean;
  isFocusMode: boolean;
  setIsFocusMode: (v: boolean) => void;
  execFormat: (command: string, value?: string) => void;
  editorFontSize: number;
  setEditorFontSize: Dispatch<SetStateAction<number>>;
  editorFontFamily: string;
  currentFontFamily: string | 'mixed';
  currentFontSize: number | 'mixed';
  recentFontIds: string[];
  allFonts: FontOption[];
  groupedFonts: Record<string, FontOption[]>;
  handleFontUpload: (file: File) => Promise<void>;
  showFontDropdown: boolean;
  setShowFontDropdown: (show: boolean) => void;
  showStatsDropdown: boolean;
  setShowStatsDropdown: (show: boolean) => void;
  typewriterMode: boolean;
  setTypewriterMode: (v: boolean) => void;
  lineHeight: string;
  setLineHeight: (lh: string) => void;
  showFindReplace: boolean;
  setShowFindReplace: (show: boolean) => void;
  handleCreateSnapshot: () => void;
  handleOpenAutoSaveModal: () => void;
  setShowHistoryModal: (show: boolean) => void;
  historySnapshotsCount: number;
  editorSaveStatus: 'saved' | 'saving';
  charCountWithSpaces: number;
  charCountWithoutSpaces: number;
  manuscriptPages?: number;
  targetWordCount: number;
  progressPercent: number;
  themeStyles: any;
  showColorPicker: boolean;
  setShowColorPicker: (show: boolean) => void;
  colorPickerPos: { top: number; left: number } | null;
  setColorPickerPos: (pos: { top: number; left: number } | null) => void;
  showBgColorPicker: boolean;
  setShowBgColorPicker: (show: boolean) => void;
  bgColorPickerPos: { top: number; left: number } | null;
  setBgColorPickerPos: (pos: { top: number; left: number } | null) => void;
  saveSelection: () => void;
  restoreSelection: () => void;
  foreshadowings?: Foreshadowing[];
  setForeshadowings?: Dispatch<SetStateAction<Foreshadowing[]>>;
  selectedProjectId?: string;
  activeEpisodeIndex?: number;
  episodes?: Episode[];
  selectedEpisodeId?: string | null;
}

export default function EditorToolbar(props: EditorToolbarProps) {
  const { showAlert } = useAlertConfirm();
  const {
    isDark,
    isFocusMode,
    setIsFocusMode,
    execFormat,
    editorFontSize,
    foreshadowings,
    setForeshadowings,
    selectedProjectId,
    activeEpisodeIndex = 1,
    episodes = [],
    selectedEpisodeId = null,
    currentFontFamily,
    currentFontSize,
    recentFontIds,
    allFonts,
    groupedFonts,
    handleFontUpload,
    showFontDropdown,
    setShowFontDropdown,
    showStatsDropdown,
    setShowStatsDropdown,
    typewriterMode,
    setTypewriterMode,
    lineHeight,
    setLineHeight,
    showFindReplace,
    setShowFindReplace,
    handleCreateSnapshot,
    handleOpenAutoSaveModal,
    setShowHistoryModal,
    historySnapshotsCount,
    editorSaveStatus,
    charCountWithSpaces,
    charCountWithoutSpaces,
    targetWordCount,
    progressPercent,
    themeStyles,
    showColorPicker,
    setShowColorPicker,
    colorPickerPos,
    setColorPickerPos,
    showBgColorPicker,
    setShowBgColorPicker,
    bgColorPickerPos,
    setBgColorPickerPos,
    saveSelection,
    restoreSelection: _restoreSelection,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const statsDropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const snapshotDropdownRef = useRef<HTMLDivElement>(null);
  const foreshadowingDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSnapshotDropdown, setShowSnapshotDropdown] = useState(false);
  const [showForeshadowingDropdown, setShowForeshadowingDropdown] = useState(false);
  const [fontDropdownCoords, setFontDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [snapshotDropdownCoords, setSnapshotDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [exportDropdownCoords, setExportDropdownCoords] = useState<{ top: number; left: number } | null>(null);
  const [foreshadowingDropdownCoords, setForeshadowingDropdownCoords] = useState<{ top: number; left: number } | null>(null);

  const [showPlantModal, setShowPlantModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showForeshadowingListModal, setShowForeshadowingListModal] = useState(false);
  const secondaryToolbarRef = useRef<HTMLDivElement | null>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const handleScrollSecondaryToolbar = (direction: 'left' | 'right') => {
    if (!secondaryToolbarRef.current) return;
    const scrollAmount = 200;
    secondaryToolbarRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const checkSecondaryToolbarScroll = () => {
    if (!secondaryToolbarRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = secondaryToolbarRef.current;
    setShowLeftScroll(scrollLeft > 2);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 2);
  };

  useEffect(() => {
    const el = secondaryToolbarRef.current;
    if (!el) return;
    checkSecondaryToolbarScroll();
    el.addEventListener('scroll', checkSecondaryToolbarScroll);
    window.addEventListener('resize', checkSecondaryToolbarScroll);
    return () => {
      el.removeEventListener('scroll', checkSecondaryToolbarScroll);
      window.removeEventListener('resize', checkSecondaryToolbarScroll);
    };
  }, [isFocusMode]);

  const orderedDocs = useMemo(() => getOrderedDocumentList(episodes), [episodes]);

  const currentDocIndex = useMemo(() => {
    if (selectedEpisodeId && orderedDocs.length > 0) {
      const idx = orderedDocs.findIndex((d: Episode) => d.id === selectedEpisodeId);
      if (idx >= 0) return idx + 1;
    }
    return activeEpisodeIndex > 0 ? activeEpisodeIndex : 1;
  }, [orderedDocs, selectedEpisodeId, activeEpisodeIndex]);

  const hasDueForeshadowing = useMemo(() => {
    if (!foreshadowings || foreshadowings.length === 0) return false;
    return foreshadowings.some(f => !f.isResolved && f.targetChapter <= currentDocIndex);
  }, [foreshadowings, currentDocIndex]);

  const [fontSizeInput, setFontSizeInput] = useState(
    currentFontSize === 'mixed' ? '' : currentFontSize.toString()
  );

  useEffect(() => {
    setFontSizeInput(currentFontSize === 'mixed' ? '' : currentFontSize.toString());
  }, [currentFontSize]);

  // 모든 드롭다운 외부 클릭 한꺼번에 감지하여 처리
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showExportDropdown && exportDropdownRef.current && !exportDropdownRef.current.contains(target)) {
        setShowExportDropdown(false);
      }
      if (showStatsDropdown && statsDropdownRef.current && !statsDropdownRef.current.contains(target)) {
        setShowStatsDropdown(false);
      }
      if (showFontDropdown && fontDropdownRef.current && !fontDropdownRef.current.contains(target)) {
        setShowFontDropdown(false);
      }
      if (showSnapshotDropdown && snapshotDropdownRef.current && !snapshotDropdownRef.current.contains(target)) {
        setShowSnapshotDropdown(false);
      }
      if (showForeshadowingDropdown && foreshadowingDropdownRef.current && !foreshadowingDropdownRef.current.contains(target)) {
        setShowForeshadowingDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportDropdown, showStatsDropdown, showFontDropdown, showSnapshotDropdown, showForeshadowingDropdown, setShowFontDropdown, setShowStatsDropdown]);

  const handleExportDocument = (format: 'txt' | 'md' | 'docx') => {
    const editorCanvas = document.querySelector('.novela-editor-content');
    if (!editorCanvas) {
      showAlert('에디터 내용을 찾을 수 없습니다.');
      return;
    }
    const htmlContent = editorCanvas.innerHTML;
    const titleInput = document.querySelector('input[placeholder="제목 없음"]') as HTMLInputElement;
    const docTitle = (titleInput?.value || 'Untitled').trim();
    let blob: Blob;
    let extension = '';
    if (format === 'txt') {
      let txt = htmlContent;
      txt = txt.replace(/<br\s*\/?>/gi, '\n');
      txt = txt.replace(/<\/p>/gi, '\n\n');
      txt = txt.replace(/<\/div>/gi, '\n\n');
      txt = txt.replace(/<[^>]*>/g, '');
      txt = txt.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"');
      blob = new Blob([txt.trim()], { type: 'text/plain;charset=utf-8' });
      extension = 'txt';
    } else if (format === 'md') {
      const markdown = convertHtmlToMarkdown(htmlContent);
      const fullMd = `# ${docTitle}\n\n${markdown}`;
      blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
      extension = 'md';
    } else {
      const docHtml = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${docTitle}</title>
          <style>
            body { font-family: 'Nanum Gothic', 'Malgun Gothic', sans-serif; line-height: 1.8; }
            p { margin-bottom: 12px; }
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #cccccc; padding: 8px; }
            blockquote { border-left: 4px solid #5E6AD2; background-color: #f3f4f6; padding: 10px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <h1>${docTitle}</h1>
          <div class="content">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;
      blob = new Blob([docHtml], { type: 'application/msword;charset=utf-8' });
      extension = 'doc';
    }
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `${docTitle}.${extension}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    setShowExportDropdown(false);
  };

  return (
    <div className="flex flex-col shrink-0 select-none">
      {/* 1. 에디터 툴바 */}
      <div className={`px-4 py-2 border-b flex items-center justify-between gap-3 shrink-0 ${themeStyles.toolbar}`}>
        <div className="flex items-center gap-2 overflow-x-auto flex-nowrap min-w-0 flex-1 pr-2">
          {/* 커스텀 폰트 선택 드롭다운 */}
          <div className="relative shrink-0 font-sans" ref={fontDropdownRef}>
            <button
              onClick={() => {
                if (!showFontDropdown && fontDropdownRef.current) {
                  const rect = fontDropdownRef.current.getBoundingClientRect();
                  setFontDropdownCoords({
                    top: rect.bottom + 4,
                    left: rect.left
                  });
                }
                setShowFontDropdown(!showFontDropdown);
              }}
              onMouseDown={e => e.preventDefault()}
              className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${themeStyles.input}`}
            >
              <span className="truncate max-w-[120px]">
                {currentFontFamily === 'mixed' ? '여러 폰트' : (allFonts.find(f => f.family === currentFontFamily)?.label || currentFontFamily)}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {showFontDropdown && (
              <div
                style={fontDropdownCoords ? { top: `${fontDropdownCoords.top}px`, left: `${fontDropdownCoords.left}px` } : undefined}
                className={`fixed z-50 py-2 w-64 rounded-xl border shadow-2xl flex flex-col ${
                  isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200 shadow-black/80' : 'bg-white border-black/[0.08] text-gray-800 shadow-black/10'
                }`}>
                {/* 폰트 업로드 */}
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

                {/* 최근 사용 폰트 */}
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
                            onMouseDown={e => e.preventDefault()}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${
                              currentFontFamily === font.family ? 'text-[#7480E2] font-bold' : ''
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
                            onMouseDown={e => e.preventDefault()}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${
                              currentFontFamily === font.family ? 'text-[#7480E2] font-bold' : ''
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

          {/* 폰트 크기 */}
          <div className="flex items-center gap-1 shrink-0 font-sans">
            <div className={`flex items-center border rounded-lg overflow-hidden ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
              <input
                type="text"
                value={fontSizeInput}
                onMouseDown={() => saveSelection()}
                onChange={e => {
                  const valStr = e.target.value;
                  if (valStr === '' || /^[0-9]+$/.test(valStr)) {
                    const val = parseInt(valStr);
                    if (!isNaN(val)) {
                      if (val > 100) {
                        setFontSizeInput('100');
                      } else {
                        setFontSizeInput(valStr);
                      }
                    } else {
                      setFontSizeInput('');
                    }
                  } else {
                    const defaultSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                    setFontSizeInput(defaultSize.toString());
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.blur();
                  }
                }}
                onBlur={() => {
                  const val = parseInt(fontSizeInput);
                  const defaultSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                  if (!isNaN(val) && val > 0 && val <= 100) {
                    execFormat('fontSize', val.toString());
                  } else {
                    setFontSizeInput(defaultSize.toString());
                  }
                }}
                className={`w-10 py-1 px-1.5 text-center text-xs font-bold bg-transparent outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isDark ? 'text-white' : 'text-black'}`}
              />
              <div className={`flex flex-col border-l shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}>
                <button
                  onClick={() => {
                    const baseSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                    const nextSize = Math.min(100, baseSize + 1);
                    execFormat('fontSize', nextSize.toString());
                  }}
                  onMouseDown={e => e.preventDefault()}
                  className={`p-0.5 hover:bg-white/[0.04] border-b text-gray-500 hover:text-white shrink-0 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'}`}
                >
                  <ChevronUp className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={() => {
                    const baseSize = currentFontSize === 'mixed' ? editorFontSize : currentFontSize;
                    const nextSize = Math.max(1, baseSize - 1);
                    execFormat('fontSize', nextSize.toString());
                  }}
                  onMouseDown={e => e.preventDefault()}
                  className="p-0.5 hover:bg-white/[0.04] text-gray-500 hover:text-white shrink-0"
                >
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 서식 스타일 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('bold')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] font-bold shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="굵게 (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('italic')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] italic shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="기울임 (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('underline')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] underline shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="밑줄 (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('strikeThrough')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] line-through shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="취소선"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 정렬 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('justifyLeft')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="왼쪽 정렬"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('justifyCenter')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="가운데 정렬 (웹소설 시/편지용)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('justifyRight')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="오른쪽 정렬"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('justifyFull')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="양쪽 정렬"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 들여쓰기/내어쓰기 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => execFormat('indent')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="들여쓰기 적용"
            >
              <Indent className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execFormat('outdent')}
              onMouseDown={e => e.preventDefault()}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="내어쓰기 적용"
            >
              <Outdent className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

          {/* 색상 및 서식 제거 그룹 */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 글자 색상 */}
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
                className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center font-bold text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
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

            {/* 형광펜 효과 */}
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
                className={`p-1.5 rounded hover:bg-white/[0.04] flex items-center text-xs ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
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
              className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}
              title="모든 스타일 서식 제거"
            >
              서식지우기
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pl-2">
          <div
            className={`w-2 h-2 rounded-full shrink-0 transition-colors ${editorSaveStatus === 'saved' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}
            title={editorSaveStatus === 'saved' ? '저장 완료' : '저장 중...'}
          />
          <button
            onClick={() => {
              setShowFindReplace(!showFindReplace);
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

          <div className="relative" ref={statsDropdownRef}>
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
                className={`absolute right-0 mt-2 z-40 p-4 rounded-xl border shadow-2xl w-60 flex flex-col gap-3 ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'}`}
              >
                <h4 className="text-xs font-bold border-b pb-1.5">
                  상세 자수 통계
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

      {/* 2. 보조 설정 바 */}
      {!isFocusMode && (
        <div className={`relative flex items-center border-b shrink-0 ${themeStyles.toolbar}`}>
          {/* 좌측 슬라이드 이동 버튼 */}
          {showLeftScroll && (
            <button
              onClick={() => handleScrollSecondaryToolbar('left')}
              className={`absolute left-0 z-20 h-full px-1 flex items-center justify-center backdrop-blur-md transition-opacity ${
                isDark ? 'bg-[#161719]/90 text-gray-300 hover:text-white' : 'bg-white/90 text-gray-600 hover:text-black'
              }`}
              title="왼쪽으로 슬라이드"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* 슬라이드 가능한 보조 설정 영역 */}
          <div
            ref={secondaryToolbarRef}
            onWheel={(e) => {
              if (secondaryToolbarRef.current && e.deltaY !== 0 && !e.shiftKey) {
                secondaryToolbarRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="px-6 py-2 flex items-center justify-between gap-6 text-xs overflow-x-auto flex-nowrap min-w-0 w-full scrollbar-none select-none"
          >
            {/* 특수 편집 도구 */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => execFormat('undo')}
                  onMouseDown={e => e.preventDefault()}
                  className={`p-1.5 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="실행 취소 (Ctrl+Z)"
                >
                  <Undo className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => execFormat('redo')}
                  onMouseDown={e => e.preventDefault()}
                  className={`p-1.5 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
                  title="다시 실행 (Ctrl+Y)"
                >
                  <Redo className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

              <div className="relative flex items-center shrink-0" ref={exportDropdownRef}>
                <button
                  onClick={() => {
                    if (!showExportDropdown && exportDropdownRef.current) {
                      const rect = exportDropdownRef.current.getBoundingClientRect();
                      setExportDropdownCoords({
                        top: rect.bottom + 4,
                        left: rect.left
                      });
                    }
                    setShowExportDropdown(!showExportDropdown);
                  }}
                  className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} flex items-center gap-1`}
                  title="원고 내보내기"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-semibold">내보내기</span>
                </button>

                {showExportDropdown && (
                  <div
                    style={exportDropdownCoords ? { top: `${exportDropdownCoords.top}px`, left: `${exportDropdownCoords.left}px` } : undefined}
                    className={`fixed z-50 w-32 py-1 rounded-lg border shadow-xl text-xs flex flex-col backdrop-blur-md ${
                      isDark ? 'bg-[#1E1F22]/95 border-white/[0.08] text-gray-200 shadow-black/80' : 'bg-white/95 border-black/[0.08] text-gray-800 shadow-black/10'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setShowExportDropdown(false);
                        handleExportDocument('txt');
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                      }`}
                    >
                      TXT 파일
                    </button>
                    <button
                      onClick={() => {
                        setShowExportDropdown(false);
                        handleExportDocument('md');
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => {
                        setShowExportDropdown(false);
                        handleExportDocument('docx');
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors ${
                        isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-black/[0.04]'
                      }`}
                    >
                      MS Word
                    </button>
                  </div>
                )}
              </div>

              {/* 복선 관리 드롭다운 */}
              <div className="relative flex items-center shrink-0" ref={foreshadowingDropdownRef}>
                <button
                  onClick={() => {
                    if (!showForeshadowingDropdown && foreshadowingDropdownRef.current) {
                      const rect = foreshadowingDropdownRef.current.getBoundingClientRect();
                      setForeshadowingDropdownCoords({
                        top: rect.bottom + 4,
                        left: rect.left
                      });
                    }
                    setShowForeshadowingDropdown(!showForeshadowingDropdown);
                  }}
                  className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
                  } flex items-center gap-1.5 transition-colors relative`}
                  title={hasDueForeshadowing ? "회수 시점이 도달한 복선이 있습니다! 클릭하여 복선 회수" : "복선 관리 (설치 및 회수)"}
                >
                  <div className="relative flex items-center">
                    <GitCommit className="w-3.5 h-3.5 text-[#7480E2]" />
                    {hasDueForeshadowing && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">복선 관리</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60" />
                </button>

                {showForeshadowingDropdown && (
                  <div
                    style={foreshadowingDropdownCoords ? { top: `${foreshadowingDropdownCoords.top}px`, left: `${foreshadowingDropdownCoords.left}px` } : undefined}
                    className={`fixed z-50 w-36 py-1 rounded-xl border shadow-xl text-xs flex flex-col gap-0.5 backdrop-blur-md ${
                      isDark ? 'bg-[#1E1F22]/95 border-white/[0.08] text-gray-200 shadow-black/80' : 'bg-white/95 border-black/[0.08] text-gray-800 shadow-black/10'
                    }`}
                    onMouseLeave={() => setShowForeshadowingDropdown(false)}
                  >
                    <button
                      onClick={() => {
                        setShowForeshadowingDropdown(false);
                        setShowPlantModal(true);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center gap-2 leading-normal ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      <GitCommit className="w-3.5 h-3.5 text-[#7480E2]" />
                      <span>복선 설치</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowForeshadowingDropdown(false);
                        setShowResolveModal(true);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center gap-2 leading-normal ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>복선 회수</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowForeshadowingDropdown(false);
                        setShowForeshadowingListModal(true);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center gap-2 leading-normal ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-[#7480E2]" />
                      <span>복선 목록</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 줄간격, 타이프라이터, 스냅샷, 이력 */}
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

              <div className="relative" ref={snapshotDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!showSnapshotDropdown && snapshotDropdownRef.current) {
                      const rect = snapshotDropdownRef.current.getBoundingClientRect();
                      setSnapshotDropdownCoords({
                        top: rect.bottom + 4,
                        left: rect.left
                      });
                    }
                    setShowSnapshotDropdown(!showSnapshotDropdown);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'}`}
                  title="스냅샷 관리"
                >
                  버전 스냅샷
                </button>

                {showSnapshotDropdown && (
                  <div
                    style={snapshotDropdownCoords ? { top: `${snapshotDropdownCoords.top}px`, left: `${snapshotDropdownCoords.left}px` } : undefined}
                    className={`fixed z-50 py-1 w-32 rounded-xl border shadow-2xl flex flex-col gap-0.5 backdrop-blur-md ${
                      isDark ? 'bg-[#1E1F22]/95 border-white/[0.08] text-gray-200 shadow-black/80' : 'bg-white/95 border-black/[0.08] text-gray-800 shadow-black/10'
                    }`}
                    onMouseLeave={() => setShowSnapshotDropdown(false)}
                  >
                    <button
                      onClick={() => {
                        setShowSnapshotDropdown(false);
                        handleCreateSnapshot();
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                    >
                      💾 수동 저장
                    </button>
                    <button
                      onClick={() => {
                        setShowSnapshotDropdown(false);
                        handleOpenAutoSaveModal();
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/[0.04] transition-colors h-8 flex items-center leading-normal ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                    >
                      ⚙️ 자동 저장 설정
                    </button>
                  </div>
                )}
              </div>

              {historySnapshotsCount > 0 && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/10 text-[#7480E2] hover:bg-[#5E6AD2]/20 shrink-0"
                  title="버전 기록 목록 열기"
                >
                  이력 ({historySnapshotsCount})
                </button>
              )}
            </div>
          </div>

          {/* 우측 슬라이드 이동 버튼 */}
          {showRightScroll && (
            <button
              onClick={() => handleScrollSecondaryToolbar('right')}
              className={`absolute right-0 z-20 h-full px-1 flex items-center justify-center backdrop-blur-md transition-opacity ${
                isDark ? 'bg-[#161719]/90 text-gray-300 hover:text-white' : 'bg-white/90 text-gray-600 hover:text-black'
              }`}
              title="오른쪽으로 슬라이드"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}




      {/* 복선 설치 모달 */}
      <PlantForeshadowingModal
        isDark={isDark}
        isOpen={showPlantModal}
        onClose={() => setShowPlantModal(false)}
        episodes={episodes}
        selectedEpisodeId={selectedEpisodeId}
        onPlant={(title, description, createdChapter, targetChapter, plantedEpisodeId, plantedEpisodeTitle) => {
          if (!setForeshadowings) return;
          const newFs: Foreshadowing = {
            id: crypto.randomUUID(),
            projectId: selectedProjectId || foreshadowings?.[0]?.projectId || '',
            title,
            description,
            createdChapter,
            targetChapter,
            createdEpisodeId: plantedEpisodeId,
            createdEpisodeTitle: plantedEpisodeTitle,
            isResolved: false,
            createdAt: new Date().toISOString()
          };
          setForeshadowings(prev => [...prev, newFs]);
          showAlert(`복선 "${title}"이(가) [${createdChapter}화] 문서에 설치되었습니다.`);
        }}
      />

      {/* 복선 회수 모달 */}
      <ResolveForeshadowingModal
        isDark={isDark}
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        foreshadowings={foreshadowings || []}
        currentChapterNumber={currentDocIndex}
        onResolve={(id) => {
          if (!setForeshadowings) return;
          setForeshadowings(prev =>
            prev.map(f => (f.id === id ? { ...f, isResolved: true } : f))
          );
          showAlert('복선이 회수 처리되었습니다.');
        }}
      />

      {/* 복선 목록 관리 모달 */}
      <ForeshadowingListModal
        isDark={isDark}
        isOpen={showForeshadowingListModal}
        onClose={() => setShowForeshadowingListModal(false)}
        foreshadowings={foreshadowings || []}
        currentChapterNumber={currentDocIndex}
        onUpdateForeshadowing={(updated) => {
          if (!setForeshadowings) return;
          setForeshadowings(prev => prev.map(f => (f.id === updated.id ? updated : f)));
        }}
        onDeleteForeshadowing={(id) => {
          if (!setForeshadowings) return;
          setForeshadowings(prev => prev.filter(f => f.id !== id));
        }}
        onToggleResolve={(id) => {
          if (!setForeshadowings) return;
          setForeshadowings(prev =>
            prev.map(f => (f.id === id ? { ...f, isResolved: !f.isResolved } : f))
          );
        }}
      />
    </div>
  );
}
