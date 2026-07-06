import type { RefObject } from 'react';
import { X } from 'lucide-react';
import type { Episode } from '../types';

interface SplitEditorPaneProps {
  isDark: boolean;
  activeEpisode: Episode;
  splitEpisode: Episode;
  splitEpisodeId: string | null;
  setSplitEpisodeId: (id: string | null) => void;
  selectedEpisodeId: string | null;
  episodes: Episode[];
  isSplitEditable: boolean;
  setIsSplitEditable: (v: boolean) => void;
  setIsSplitView: (v: boolean) => void;
  editorFontFamily: string;
  editorFontSize: number;
  lineHeight: string;
  themeStyles: any;
  editorTheme: string;
  paragraphSpacing: number;
  editorRef: RefObject<HTMLDivElement | null>;
  splitEditorRef: RefObject<HTMLDivElement | null>;
  handleContentInput: () => void;
  handleSplitContentInput: () => void;
  saveSelection: () => void;
  handleTitleChange: (title: string) => void;
  handleSplitTitleChange: (title: string) => void;
}

export default function SplitEditorPane(props: SplitEditorPaneProps) {
  const {
    isDark,
    activeEpisode,
    splitEpisode,
    splitEpisodeId,
    setSplitEpisodeId,
    selectedEpisodeId,
    episodes,
    isSplitEditable,
    setIsSplitEditable,
    setIsSplitView,
    editorFontFamily,
    editorFontSize,
    lineHeight,
    themeStyles,
    editorTheme,
    paragraphSpacing,
    editorRef,
    splitEditorRef,
    handleContentInput,
    handleSplitContentInput,
    saveSelection,
    handleTitleChange,
    handleSplitTitleChange,
  } = props;

  return (
    <div className="flex-1 flex flex-row gap-5 px-6 py-6 overflow-hidden w-full h-full">
      {/* 좌측 에디터 패널 (메인 초고) */}
      <div
        onClick={() => editorRef.current?.focus()}
        className={`flex-1 flex flex-col h-full rounded-2xl border shadow-lg novela-editor-paper overflow-hidden transition-all ${themeStyles.paper}`}
        style={{
          fontFamily: editorFontFamily,
          fontSize: `${editorFontSize}px`,
          lineHeight: lineHeight
        }}
      >
        {/* 좌측 헤더 */}
        <div className="px-8 pt-6 pb-4 flex justify-between items-center border-b border-gray-500/5 select-none" onClick={e => e.stopPropagation()}>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#5E6AD2]">메인 원고 창</span>
          <span className="text-[10px] text-gray-500 font-semibold">{(activeEpisode.wordCount || 0).toLocaleString()}자</span>
        </div>

        <div className="px-8 pt-5 pb-3" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={activeEpisode.title}
            onChange={e => handleTitleChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="제목 없음"
            className={`w-full font-heading font-bold text-xl bg-transparent outline-none border-b border-transparent focus:border-[#5E6AD2]/50 pb-1.5 transition-all ${
              editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
            }`}
          />
        </div>

        <div className="flex-1 px-8 pb-8 overflow-y-auto">
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
            className="w-full h-full outline-none font-serif min-h-[300px] novela-editor-content"
          />
        </div>
      </div>

      {/* 우측 에디터 패널 (참조 및 듀얼 편집) */}
      <div
        onClick={() => {
          if (isSplitEditable) splitEditorRef.current?.focus();
        }}
        className={`flex-1 flex flex-col h-full rounded-2xl border shadow-lg novela-editor-paper overflow-hidden transition-all ${themeStyles.paper}`}
        style={{
          fontFamily: editorFontFamily,
          fontSize: `${editorFontSize}px`,
          lineHeight: lineHeight
        }}
      >
        {/* 우측 분할 뷰 제어 헤더 */}
        <div className="px-8 pt-4 pb-3 flex items-center justify-between border-b border-gray-500/10 bg-black/5 select-none" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">참조 창 :</span>
            {/* 에피소드 선택 드롭다운 */}
            <select
              value={splitEpisodeId || ''}
              onChange={e => {
                const val = e.target.value;
                if (val === selectedEpisodeId) {
                  alert('좌측에서 편집 중인 에피소드는 참조 창에서 열 수 없습니다.');
                  return;
                }
                setSplitEpisodeId(val || null);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border outline-none cursor-pointer ${themeStyles.input}`}
            >
              <option value="">-- 에피소드 선택 --</option>
              {episodes
                .filter(ep => !ep.isFolder)
                .map(ep => (
                  <option 
                    key={ep.id} 
                    value={ep.id}
                    disabled={ep.id === selectedEpisodeId}
                  >
                    {ep.title} {ep.id === selectedEpisodeId ? '(편집 중)' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* 편집 권한 전환 토글 버튼 */}
            <button
              onClick={() => setIsSplitEditable(!isSplitEditable)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                isSplitEditable
                  ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#7480E2] hover:bg-[#5E6AD2]/20'
                  : 'bg-gray-500/10 border-gray-500/20 text-gray-400 hover:bg-gray-500/20'
              }`}
              title="참조 에디터 읽기 전용 / 편집 가능 모드 전환"
            >
              {isSplitEditable ? '✍️ 편집 모드' : '📖 읽기 전용'}
            </button>
            <span className="text-[10px] text-gray-500 font-semibold">
              {(splitEpisode.wordCount || 0).toLocaleString()}자
            </span>
            {/* 분할 뷰 닫기 */}
            <button
              onClick={() => setIsSplitView(false)}
              className={`p-0.5 rounded transition-colors ${
                isDark ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' : 'hover:bg-black/[0.06] text-gray-600 hover:text-black'
              }`}
              title="분할 뷰 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="px-8 pt-5 pb-3" onClick={e => e.stopPropagation()}>
          <input
            type="text"
            value={splitEpisode.title}
            disabled={!isSplitEditable}
            onChange={e => handleSplitTitleChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="제목 없음"
            className={`w-full font-heading font-bold text-xl bg-transparent outline-none border-b border-transparent pb-1.5 transition-all ${
              isSplitEditable ? 'focus:border-[#5E6AD2]/50' : 'opacity-75 cursor-not-allowed'
            } ${
              editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
            }`}
          />
        </div>

        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          <div
            ref={splitEditorRef}
            contentEditable={isSplitEditable}
            data-placeholder="오른쪽 패널에 표시할 문서가 비어 있습니다."
            onInput={handleSplitContentInput}
            className="w-full h-full outline-none font-serif min-h-[300px] novela-editor-content"
          />
        </div>
      </div>
    </div>
  );
}
