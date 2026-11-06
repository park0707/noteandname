import { useState } from 'react';
import { X, Sparkles, Check, CheckSquare, Loader2, AlertCircle } from 'lucide-react';
import { executeSpellCheckAI, type SpellError } from '../../../services/multiAiService';

interface EditorInspectorProps {
  isDark: boolean;
  themeStyles: any;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  handleContentInput: () => void;
}

export default function EditorInspector(props: EditorInspectorProps) {
  const { isDark, themeStyles: _, editorRef, onClose, handleContentInput } = props;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // DOM 내에서 텍스트 노드를 찾아 타겟 문자열을 선택(드래그)하고 화면 중앙으로 스크롤하는 함수
  const selectTextInDOM = (node: Node, targetText: string): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.nodeValue || '';
      const index = content.indexOf(targetText);
      if (index !== -1) {
        try {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + targetText.length);

          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);

            const parentElement = node.parentElement;
            if (parentElement) {
              parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
          return true;
        } catch (e) {
          console.error('Failed to create selection range:', e);
        }
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (selectTextInDOM(node.childNodes[i], targetText)) {
          return true;
        }
      }
    }
    return false;
  };

  // DOM 내에서 텍스트 노드를 찾아 타겟 문자열을 교정 단어로 치환하는 함수
  const replaceTextInDOM = (node: Node, targetText: string, replacementText: string): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.nodeValue || '';
      const index = content.indexOf(targetText);
      if (index !== -1) {
        const before = content.slice(0, index);
        const after = content.slice(index + targetText.length);
        node.nodeValue = before + replacementText + after;
        return true;
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (replaceTextInDOM(node.childNodes[i], targetText, replacementText)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleCardClick = (original: string) => {
    if (editorRef.current) {
      selectTextInDOM(editorRef.current, original);
    }
  };

  const handleApply = (index: number, original: string, replacement: string) => {
    if (editorRef.current) {
      const success = replaceTextInDOM(editorRef.current, original, replacement);
      if (success) {
        // 성공 시 에디터 높이 및 내용 입력 싱크
        handleContentInput();
      }
      // 해당 에러 카드 리스트에서 제거
      setErrors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleApplyAll = () => {
    if (editorRef.current && errors.length > 0) {
      let appliedCount = 0;
      errors.forEach(err => {
        const success = replaceTextInDOM(editorRef.current!, err.original, err.replacement);
        if (success) {
          appliedCount++;
        }
      });
      if (appliedCount > 0) {
        handleContentInput();
      }
      setErrors([]);
    }
  };

  const handleIgnore = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const [activeProviderName, setActiveProviderName] = useState<string | null>(null);

  const handleCheckSpell = async () => {
    if (!editorRef.current) return;

    setLoading(true);
    setApiError(null);
    setErrors([]);
    setActiveProviderName(null);

    const textContent = editorRef.current.innerText || '';
    if (!textContent.trim()) {
      setLoading(false);
      setHasChecked(true);
      return;
    }

    try {
      const res = await executeSpellCheckAI(textContent);
      setErrors(res.errors);
      setActiveProviderName(res.providerName);
      setHasChecked(true);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || '맞춤법 검사 중 오류가 발생했습니다. .env에 API 키가 설정되었는지 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-[320px] shrink-0 border-l flex flex-col h-full ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
      {/* 헤더 */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#5E6AD2]" />
          <span className="text-sm font-bold">맞춤법 검사기</span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded hover:bg-white/[0.04] transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 본문 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 검사 실행 버튼 */}
        <div className="p-4 border-b border-gray-500/10">
          <button
            onClick={handleCheckSpell}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              loading
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-[#5E6AD2] text-white hover:bg-[#4D5BC2]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                교열 분석 중...
              </>
            ) : (
              <>
                <CheckSquare className="w-3.5 h-3.5" />
                맞춤법 검사 시작
              </>
            )}
          </button>
        </div>

        {/* 에러 목록 스크롤 뷰 */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {apiError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>{apiError}</div>
            </div>
          )}

          {!loading && !apiError && errors.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
              <Check className="w-8 h-8 text-green-500 mb-2 opacity-60" />
              <p className="text-xs font-medium">
                {hasChecked ? '맞춤법 오류가 없습니다!' : '검사 시작 버튼을 눌러 원고를 교열하세요.'}
              </p>
            </div>
          )}

          {activeProviderName && !loading && (
            <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg flex items-center justify-between">
              <span>⚡ {activeProviderName} 연동됨</span>
            </div>
          )}

          {!loading && !apiError && errors.length > 0 && (
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10 mb-1">
              <span className="text-[11px] text-gray-500 font-semibold">오류 {errors.length}건 발견됨</span>
              <button
                onClick={handleApplyAll}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-[#5E6AD2] hover:bg-[#4D5BC2] text-white transition-all flex items-center gap-1 cursor-pointer shadow-md shadow-[#5E6AD2]/10"
              >
                <CheckSquare className="w-3 h-3" />
                모두 적용
              </button>
            </div>
          )}

          {!loading && errors.map((err, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(err.original)}
              className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-2 group ${
                isDark
                  ? 'bg-[#2B2D31]/30 hover:bg-[#2B2D31]/70 border-white/[0.06] hover:border-[#5E6AD2]/50'
                  : 'bg-gray-50/50 hover:bg-gray-50 border-black/[0.06] hover:border-[#5E6AD2]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded line-through">
                    {err.original}
                  </span>
                  <span className="text-gray-400 font-medium">→</span>
                  <span className="text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">
                    {err.replacement}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed font-sans">
                {err.reason}
              </p>

              <div className="flex justify-end gap-1.5 pt-1.5 border-t border-gray-500/10 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIgnore(index);
                  }}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                    isDark
                      ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400 hover:text-white'
                      : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600 hover:text-black'
                  }`}
                >
                  건너뛰기
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApply(index, err.original, err.replacement);
                  }}
                  className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#5E6AD2] hover:bg-[#4D5BC2] text-white transition-all"
                >
                  적용
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
