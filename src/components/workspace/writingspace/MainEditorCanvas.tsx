import type { RefObject } from 'react';
import type { Episode } from '../types';

interface MainEditorCanvasProps {
  isDark: boolean;
  activeEpisode: Episode;
  editorFontFamily: string;
  lineHeight: string;
  typewriterMode: boolean;
  paragraphSpacing: number;
  editorWidth: 'narrow' | 'normal' | 'wide';
  firstLineIndent: boolean;
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
    lineHeight,
    typewriterMode,
    paragraphSpacing,
    editorWidth,
    firstLineIndent,
    editorRef,
    handleContentInput,
    saveSelection,
    handleTitleChange,
    editorTheme,
  } = props;

  return (
    <div
      onClick={(e) => {
        if (e.target instanceof HTMLInputElement) return;
        editorRef.current?.focus();
      }}
      className="flex-1 overflow-y-auto px-6 py-10 flex justify-center cursor-text editor-scroll-container relative"
    >
      <div
        className={`w-full flex flex-col ${
          editorWidth === 'narrow' ? 'max-w-xl' : editorWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl'
        }`}
        style={{
          fontFamily: editorFontFamily,
          fontSize: '16px',
          lineHeight: lineHeight,
          paddingTop: '1rem',
          paddingBottom: typewriterMode ? '50vh' : '3rem'
        }}
      >
        <div className="px-4 pb-4">
          <input
            type="text"
            value={activeEpisode.title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="제목 없음"
            style={{ fontSize: '28px' }}
            className={`w-full font-heading font-bold bg-transparent outline-none border-b border-transparent focus:border-[#5E6AD2]/50 pb-2 transition-all ${
              editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
            }`}
          />
        </div>

        <div className="flex-1 px-4 pb-12 h-auto">
          <style>{`
            .novela-editor-content p, .novela-editor-content div {
              margin-bottom: ${paragraphSpacing}px;
              ${firstLineIndent ? 'text-indent: 1.5em;' : ''}
            }
            .novela-editor-content p:last-child, .novela-editor-content div:last-child {
              margin-bottom: 0;
            }
            .novela-editor-content blockquote[style*="margin"] {
              border-left: none !important;
              background-color: transparent !important;
              padding: 0 !important;
              font-style: normal !important;
              border-radius: 0 !important;
              opacity: 1 !important;
            }
            .novela-editor-content blockquote:not([style*="margin"]) {
              border-left: 4px solid #5E6AD2;
              background-color: rgba(94, 106, 210, 0.06);
              padding: 10px 16px;
              margin: 18px 0;
              font-style: italic;
              border-radius: 0 8px 8px 0;
              opacity: 0.85;
            }
            .novela-editor-content table {
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 0.9em;
            }
            .novela-editor-content th {
              background-color: rgba(94, 106, 210, 0.1);
              font-weight: bold;
              border: 1px solid rgba(128, 128, 128, 0.2);
              padding: 8px 12px;
            }
            .novela-editor-content td {
              border: 1px solid rgba(128, 128, 128, 0.2);
              padding: 8px 12px;
            }
            .novela-editor-content a {
              color: #5E6AD2;
              text-decoration: underline;
              font-weight: 600;
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
            className="w-full h-auto outline-none font-serif min-h-[400px] novela-editor-content"
          />
        </div>
      </div>

    </div>
  );
}
