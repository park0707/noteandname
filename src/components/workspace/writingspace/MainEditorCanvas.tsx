import { useState } from 'react';
import type { RefObject } from 'react';
import type { Episode } from '../types';

interface MainEditorCanvasProps {
  isDark: boolean;
  activeEpisode: Episode;
  editorFontFamily: string;
  editorFontSize: number;
  lineHeight: string;
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
    typewriterMode,
    paragraphSpacing,
    editorRef,
    handleContentInput,
    saveSelection,
    handleTitleChange,
    editorTheme,
  } = props;

  const [hoveredDivider, setHoveredDivider] = useState<HTMLElement | null>(null);
  const [deleteBtnPos, setDeleteBtnPos] = useState<{ top: number; left: number } | null>(null);

  const handleEditorMouseMove = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const divider = target.closest('hr, .novela-divider-stars, .novela-divider-wave, .novela-divider-custom');
    if (divider && editorRef.current?.contains(divider)) {
      const rect = divider.getBoundingClientRect();
      const containerRect = e.currentTarget.getBoundingClientRect();
      setHoveredDivider(divider as HTMLElement);
      setDeleteBtnPos({
        top: rect.top - containerRect.top + rect.height / 2 - 10,
        left: rect.right - containerRect.left - 25
      });
    } else {
      const isOverDeleteBtn = (e.target as HTMLElement).closest('.divider-delete-btn');
      if (!isOverDeleteBtn) {
        setHoveredDivider(null);
        setDeleteBtnPos(null);
      }
    }
  };

  const handleEditorMouseLeave = () => {
    setHoveredDivider(null);
    setDeleteBtnPos(null);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target instanceof HTMLInputElement) return;
        editorRef.current?.focus();
      }}
      onMouseMove={handleEditorMouseMove}
      onMouseLeave={handleEditorMouseLeave}
      className="flex-1 overflow-y-auto px-6 py-10 flex justify-center cursor-text editor-scroll-container relative"
    >
      <div
        className="w-full flex flex-col max-w-3xl"
        style={{
          fontFamily: editorFontFamily,
          fontSize: `${editorFontSize}px`,
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
            className={`w-full font-heading font-bold text-3xl bg-transparent outline-none border-b border-transparent focus:border-[#5E6AD2]/50 pb-2 transition-all ${
              editorTheme === 'light' ? 'text-black placeholder-gray-300' : editorTheme === 'sepia' ? 'text-[#5B4636] placeholder-[#B5A58A]' : 'text-white placeholder-gray-700'
            }`}
          />
        </div>

        <div className="flex-1 px-4 pb-12 h-auto">
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
            className="w-full h-auto outline-none font-serif min-h-[400px] novela-editor-content"
          />
        </div>
      </div>

      {deleteBtnPos && hoveredDivider && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            hoveredDivider.remove();
            setHoveredDivider(null);
            setDeleteBtnPos(null);
            handleContentInput();
          }}
          className="absolute divider-delete-btn z-30 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-lg transition-colors cursor-pointer select-none"
          style={{ top: `${deleteBtnPos.top}px`, left: `${deleteBtnPos.left}px` }}
          title="구분선 삭제"
        >
          ✕
        </button>
      )}
    </div>
  );
}
