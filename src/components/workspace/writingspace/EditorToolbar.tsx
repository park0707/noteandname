import type { Dispatch, SetStateAction } from 'react';
import { useRef } from 'react';
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ChevronDown,
  ChevronUp,
  Columns,
  Search,
  Minimize2,
  Maximize2,
  BookOpen,
  Grid,
  Link
} from 'lucide-react';
import { FONT_CATEGORY_LABELS } from '../../../lib/fonts';
import type { FontOption } from '../../../lib/fonts';

interface EditorToolbarProps {
  isDark: boolean;
  isFocusMode: boolean;
  setIsFocusMode: (v: boolean) => void;
  execFormat: (command: string, value?: string) => void;
  editorFontSize: number;
  setEditorFontSize: Dispatch<SetStateAction<number>>;
  editorFontFamily: string;
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
  paragraphSpacing: number;
  setParagraphSpacing: (ps: number) => void;
  showFindReplace: boolean;
  setShowFindReplace: (show: boolean) => void;
  handleCreateSnapshot: () => void;
  setShowHistoryModal: (show: boolean) => void;
  handleToggleSplitView: () => void;
  isSplitView: boolean;
  historySnapshotsCount: number;
  editorSaveStatus: 'saved' | 'saving';
  charCountWithSpaces: number;
  charCountWithoutSpaces: number;
  manuscriptPages: number;
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
  handleInsertTable: () => void;
  handleInsertLink: () => void;
}

export default function EditorToolbar(props: EditorToolbarProps) {
  const {
    isDark,
    isFocusMode,
    setIsFocusMode,
    execFormat,
    editorFontSize,
    editorFontFamily,
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
    paragraphSpacing,
    setParagraphSpacing,
    showFindReplace,
    setShowFindReplace,
    handleCreateSnapshot,
    setShowHistoryModal,
    handleToggleSplitView,
    isSplitView,
    historySnapshotsCount,
    editorSaveStatus,
    charCountWithSpaces,
    charCountWithoutSpaces,
    manuscriptPages,
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
    handleInsertTable,
    handleInsertLink,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col shrink-0 select-none">
      {/* 1. 에디터 툴바 */}
      <div className={`px-6 py-2 border-b flex items-center justify-between gap-4 shrink-0 ${themeStyles.toolbar}`}>
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

          {/* 폰트 크기 */}
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
                className={`absolute right-0 mt-2 z-40 p-4 rounded-xl border shadow-2xl w-60 flex flex-col gap-3 ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'}`}
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
        <div className={`px-6 py-2 border-b flex items-center justify-between gap-4 text-xs ${themeStyles.toolbar}`}>
          {/* 특수 편집 도구 */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <button
              onClick={() => execFormat('justifyLeft')}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="왼쪽 정렬"
            >
              <Undo className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button
              onClick={() => execFormat('justifyCenter')}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="가운데 정렬 (웹소설 시/편지용)"
            >
              <Undo className="w-3.5 h-3.5 rotate-185" />
            </button>
            <button
              onClick={() => execFormat('justifyRight')}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="오른쪽 정렬"
            >
              <Redo className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button
              onClick={() => execFormat('justifyFull')}
              className={`p-1.5 rounded hover:bg-white/[0.04] shrink-0 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
              title="양쪽 정렬"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>

            <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

            <button
              onClick={() => execFormat('indent')}
              className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}
              title="들여쓰기 적용 (단락 시작)"
            >
              들여쓰기
            </button>
            <button
              onClick={() => execFormat('outdent')}
              className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}
              title="내어쓰기 적용"
            >
              내어쓰기
            </button>

            <div className={`w-[1px] h-3 shrink-0 ${isDark ? 'bg-white/[0.08]' : 'bg-black/[0.08]'}`} />

            <button
              onClick={() => execFormat('insertHTML', '<hr style="border: 0; border-top: 1px dashed #666; margin: 24px 0;" />')}
              className={`px-1.5 py-1 rounded text-[10px] font-bold border transition-colors shrink-0 ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}
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

          {/* 줄간격, 문단간격, 타이프라이터, 스냅샷, 이력 */}
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
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'}`}
              title="스냅샷 저장"
            >
              버전 스냅샷
            </button>

            {historySnapshotsCount > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/10 text-[#7480E2] hover:bg-[#5E6AD2]/20"
                title="버전 기록 목록 열기"
              >
                이력 ({historySnapshotsCount})
              </button>
            )}

            <button
              onClick={handleToggleSplitView}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1.5 ${
                isSplitView
                  ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                  : isDark
                    ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300'
                    : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'
              }`}
              title="에디터 화면 좌우 분할"
            >
              <Columns className="w-3 h-3" /> 화면 분할
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
