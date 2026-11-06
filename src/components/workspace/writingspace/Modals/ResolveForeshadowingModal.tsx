import { X, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Foreshadowing } from '../../types';

interface ResolveForeshadowingModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  foreshadowings: Foreshadowing[];
  onResolve: (id: string) => void;
  currentChapterNumber?: number;
}

export default function ResolveForeshadowingModal({
  isDark,
  isOpen,
  onClose,
  foreshadowings,
  onResolve,
  currentChapterNumber = 1
}: ResolveForeshadowingModalProps) {
  if (!isOpen) return null;

  const unresolvedList = foreshadowings.filter(f => !f.isResolved);

  // 현재 회차 이하로 회수 시점이 도달한 대상과 추후 예정 대상을 분류 및 정렬
  const sortedList = [...unresolvedList].sort((a, b) => {
    const aDue = a.targetChapter <= currentChapterNumber;
    const bDue = b.targetChapter <= currentChapterNumber;
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return a.targetChapter - b.targetChapter;
  });

  const dueCount = unresolvedList.filter(f => f.targetChapter <= currentChapterNumber).length;

  return (
    <div className="fixed inset-[#00000080] z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl transition-all flex flex-col max-h-[80vh] ${
          isDark
            ? 'bg-[#18191C] border-white/[0.08] text-gray-200'
            : 'bg-white border-black/[0.08] text-gray-800'
        }`}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-500/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${dueCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">복선 회수 관리</h3>
                {dueCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold rounded-full animate-pulse">
                    🔥 현재 문서 회수 대상 {dueCount}건
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                현재 문서([{currentChapterNumber}화]) 시점에서 회수해야 할 복선과 추후 회수 예정 복선을 한눈에 파악합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors ${
              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 미회수 복선 리스트 */}
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 scrollbar-thin">
          {sortedList.length === 0 ? (
            <div className={`p-8 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-2 ${
              isDark ? 'border-white/[0.08] text-gray-500' : 'border-black/[0.08] text-gray-400'
            }`}>
              <AlertCircle className="w-8 h-8 opacity-40 animate-pulse text-emerald-400" />
              <p className="text-xs font-semibold">회수할 미완료 복선이 없습니다.</p>
              <p className="text-[10px] opacity-60">모든 복선이 성공적으로 회수되었거나 아직 등록된 복선이 없습니다.</p>
            </div>
          ) : (
            sortedList.map(fs => {
              const isDueNow = fs.targetChapter <= currentChapterNumber;
              const remainingChapters = fs.targetChapter - currentChapterNumber;

              return (
                <div
                  key={fs.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                    isDueNow
                      ? isDark
                        ? 'bg-red-500/[0.08] border-red-500/40 shadow-lg shadow-red-500/5 hover:border-red-500/60'
                        : 'bg-red-50/90 border-red-300/80 shadow-sm hover:border-red-400'
                      : isDark
                        ? 'bg-[#121316] border-white/[0.06] hover:border-emerald-500/30 opacity-80'
                        : 'bg-gray-50 border-black/[0.06] hover:border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Circle className={`w-4 h-4 shrink-0 mt-0.5 ${isDueNow ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-xs font-bold truncate ${isDueNow ? 'text-red-400 dark:text-red-300' : ''}`}>
                          {fs.title}
                        </h4>
                        {isDueNow ? (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 shadow-xs animate-pulse">
                            🔥 현재 회차 회수 대상 ({fs.targetChapter}화 목표)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-gray-500/15 text-gray-400 border border-gray-500/20">
                            📌 추후 회수 예정 ({remainingChapters}화 남음 / {fs.targetChapter}화 목표)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 font-semibold">
                        설치: [{fs.createdChapter}화] {fs.createdEpisodeTitle || ''}
                      </p>
                      {fs.description && (
                        <p className={`text-[11px] line-clamp-2 leading-relaxed whitespace-pre-wrap mt-0.5 ${
                          isDueNow ? (isDark ? 'text-red-200/80' : 'text-red-900/80') : 'text-gray-400'
                        }`}>
                          {fs.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onResolve(fs.id)}
                    className={`px-3.5 py-2 text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1.5 ${
                      isDueNow
                        ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30 animate-bounce-subtle'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isDueNow ? '🔥 즉시 회수' : '복선 회수'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-500/10 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-black/[0.06] text-gray-600'
            }`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
