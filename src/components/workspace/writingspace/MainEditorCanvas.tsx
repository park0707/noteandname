import type { RefObject } from 'react';
import type { Episode } from '../types';

interface MainEditorCanvasProps {
  isDark: boolean;
  activeEpisode: Episode;
  editorFontFamily: string;
  editorFontSize: number;
  lineHeight: string;
  themeStyles: any;
  typewriterMode: boolean;
  paragraphSpacing: number;
  editorRef: RefObject<HTMLDivElement | null>;
  handleContentInput: () => void;
  saveSelection: () => void;
  handleTitleChange: (title: string) => void;
  editorTheme: string;
}

export default function MainEditorCanvas(props: MainEditorCanvasProps) {
  const {
    activeEpisode,
    editorFontFamily,
    editorFontSize,
    lineHeight,
    themeStyles,
    typewriterMode,
    paragraphSpacing,
    editorRef,
    handleContentInput,
    saveSelection,
    handleTitleChange,
    editorTheme,
  } = props;

  return (
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
            className={`w-full font-heading font-bold text-3xl bg-transparent outline-none border-b border-transparent focus:border-[#5E6AD2]/50 pb-2 transition-all ${
              editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
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
  );
}
