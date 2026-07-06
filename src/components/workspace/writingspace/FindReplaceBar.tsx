import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface FindReplaceBarProps {
  isDark: boolean;
  themeStyles: any;
  findQuery: string;
  setFindQuery: (v: string) => void;
  replaceQuery: string;
  setReplaceQuery: (v: string) => void;
  activeSearchIndex: number;
  totalSearchMatches: number;
  isReplaceMode: boolean;
  setIsReplaceMode: (v: boolean) => void;
  handleFindNext: (reverse?: boolean) => void;
  handleReplaceOne: () => void;
  handleReplaceAll: () => void;
  setShowFindReplace: (show: boolean) => void;
}

export default function FindReplaceBar(props: FindReplaceBarProps) {
  const {
    isDark,
    themeStyles,
    findQuery,
    setFindQuery,
    replaceQuery,
    setReplaceQuery,
    activeSearchIndex,
    totalSearchMatches,
    isReplaceMode,
    setIsReplaceMode,
    handleFindNext,
    handleReplaceOne,
    handleReplaceAll,
    setShowFindReplace,
  } = props;

  return (
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
  );
}
