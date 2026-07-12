import { useState } from 'react';
import { X, Sparkles, Check, CheckSquare, Loader2, AlertCircle } from 'lucide-react';

interface SpellError {
  original: string;
  replacement: string;
  reason: string;
}

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

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

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

  const handleCheckSpell = async () => {
    if (!editorRef.current) return;
    if (!apiKey) {
      setApiError('VITE_GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해 주세요.');
      return;
    }

    setLoading(true);
    setApiError(null);
    setErrors([]);

    const textContent = editorRef.current.innerText || '';
    if (!textContent.trim()) {
      setLoading(false);
      setHasChecked(true);
      return;
    }

    try {
      const systemInstruction = `당신은 웹소설 등 한국어 창작 원고의 맞춤법, 띄어쓰기, 문맥적 혼동 표기를 정밀 교정해주는 15년 경력의 전문 한국어 교열 작가입니다. 
입력 텍스트에서 오탈자, 맞춤법 오류, 띄어쓰기 오기, 어색한 한국어 표현 등을 찾고, 그에 해당하는 정확한 교정 단어와 사유를 제시하세요.
반드시 아래의 JSON 스키마를 준수하여 결과를 배열 형태로 반환해야 합니다. 오류가 없는 경우 빈 배열 \`[]\`을 반환하세요.
교정 대상 단어(original)는 반드시 본문 텍스트에 문자 그대로 온전히 존재하는 단어여야 합니다.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `검사할 원고 본문:\n${textContent}` }
                ]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    original: { type: 'STRING', description: '원고 내의 오타 단어 또는 어구' },
                    replacement: { type: 'STRING', description: '올바른 교정안' },
                    reason: { type: 'STRING', description: '교정 사유 및 문법 설명' }
                  },
                  required: ['original', 'replacement', 'reason']
                }
              }
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API HTTP 에러: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsedErrors: SpellError[] = JSON.parse(text);
        // 혹시 에디터에 존재하지 않는 허구의 교정 대상을 Gemini가 지어냈을 경우 필터링
        const validErrors = parsedErrors.filter(err => {
          if (!err.original || !err.replacement) return false;
          return textContent.includes(err.original);
        });
        setErrors(validErrors);
      }
      setHasChecked(true);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || '맞춤법 검사 중 오류가 발생했습니다.');
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

      {/* API Key 부재시 경고 영역 */}
      {!apiKey && (
        <div className="p-4 flex-1 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="w-12 h-12 text-orange-500 opacity-80" />
          <h4 className="text-sm font-bold">API 키 설정 필요</h4>
          <p className="text-xs text-gray-500 leading-relaxed px-4">
            무료 맞춤법 검사를 위해 Gemini API Key 설정이 필요합니다. <br />
            프로젝트 루트의 <code className="bg-black/10 dark:bg-white/10 px-1 rounded">.env</code> 파일에 <br />
            <code className="text-[#5E6AD2] font-semibold">VITE_GEMINI_API_KEY</code>를 설정해 주세요.
          </p>
          <a
            href="https://aistudio.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#5E6AD2] hover:underline"
          >
            Google AI Studio에서 키 무료 발급 받기 ↗
          </a>
        </div>
      )}

      {/* 본문 영역 */}
      {apiKey && (
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
      )}
    </div>
  );
}
