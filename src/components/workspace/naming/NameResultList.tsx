import React, { useState } from 'react';
import type { ArchiveCategory, NameCandidate } from '../types';
import { Sparkles, AlertTriangle, Bookmark, PlusCircle, Check, Copy } from 'lucide-react';

interface NameResultListProps {
  candidates: NameCandidate[];
  batchCount: number;
  onChangeBatchCount: (count: number) => void;
  onSaveToBank: (candidate: NameCandidate) => void;
  onAddToArchive: (candidate: NameCandidate, category: ArchiveCategory) => void;
}

export const NameResultList: React.FC<NameResultListProps> = ({
  candidates,
  batchCount,
  onChangeBatchCount,
  onSaveToBank,
  onAddToArchive
}) => {
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [addedArchiveSet, setAddedArchiveSet] = useState<Set<string>>(new Set());
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleSave = (candidate: NameCandidate) => {
    onSaveToBank(candidate);
    setSavedSet(prev => new Set(prev).add(candidate.name));
  };

  const handleArchive = (candidate: NameCandidate) => {
    onAddToArchive(candidate, candidate.category || 'character');
    setAddedArchiveSet(prev => new Set(prev).add(candidate.name));
  };

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    setTimeout(() => setCopiedName(null), 1500);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md space-y-4">
      {/* 리스트 헤더 & 일괄 배치 생성 수량 조절 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            생성 결과 목록 (Name Results) - {candidates.length}건
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">일괄 생성 수량:</span>
          <select
            value={batchCount}
            onChange={(e) => onChangeBatchCount(parseInt(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium"
          >
            <option value={5}>5개 (기본)</option>
            <option value={10}>10개</option>
            <option value={20}>20개 (대량)</option>
            <option value={50}>50개 (배치 엑스트라)</option>
          </select>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-10 text-xs text-slate-500 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
          태그를 조합하거나 버튼을 눌러 새로운 이름을 생성해보세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {candidates.map((cand) => {
            const isHighSimilarity = cand.similarity >= 75;
            const isSaved = savedSet.has(cand.name);
            const isArchived = addedArchiveSet.has(cand.name);

            return (
              <div
                key={cand.id || cand.name}
                className={`relative bg-slate-950/70 border rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-lg ${
                  isHighSimilarity
                    ? 'border-amber-500/60 bg-amber-950/10'
                    : 'border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                {/* 실시간 자모 유사도 경고 배지 */}
                {isHighSimilarity && (
                  <div className="mb-1.5 flex items-center space-x-1 text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">
                      기존 '{cand.matchItem}'와 {cand.similarity}% 유사함
                    </span>
                  </div>
                )}

                {/* 태그 상충(Conflict) 부드러운 경고 인디케이터 */}
                {cand.isConflict && (
                  <div className="mb-2 flex items-center space-x-1 text-[10px] text-amber-200 bg-amber-900/40 border border-amber-700/60 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">
                      {cand.conflictReason || '선택한 세부유형과 다소 어색할 수 있는 조합'}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-sm font-bold text-slate-100 block tracking-tight">
                      {cand.name}
                    </span>
                    <button
                      onClick={() => handleCopy(cand.name)}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                      title="이름 복사"
                    >
                      {copiedName === cand.name ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-snug">
                    {cand.meaning}
                  </p>
                </div>

                {/* 태그 목록 */}
                {cand.tags && cand.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cand.tags.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* 하단 액션 버튼 */}
                <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => handleSave(cand)}
                    disabled={isSaved}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                  >
                    <Bookmark className="w-3 h-3 text-indigo-400" />
                    <span>{isSaved ? '보관됨' : '보관'}</span>
                  </button>

                  <button
                    onClick={() => handleArchive(cand)}
                    disabled={isArchived}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 text-[11px] rounded-lg border border-indigo-800/60 transition-colors disabled:opacity-50"
                  >
                    <PlusCircle className="w-3 h-3 text-indigo-400" />
                    <span>{isArchived ? '등록됨' : '아카이브'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
