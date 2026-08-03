import { X, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import type { Foreshadowing } from '../../types';

interface ResolveForeshadowingModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  foreshadowings: Foreshadowing[];
  onResolve: (id: string) => void;
}

export default function ResolveForeshadowingModal({
  isDark,
  isOpen,
  onClose,
  foreshadowings,
  onResolve
}: ResolveForeshadowingModalProps) {
  if (!isOpen) return null;

  const unresolvedList = foreshadowings.filter(f => !f.isResolved);

  return (
    <div className="fixed inset-[#00000080] z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all flex flex-col max-h-[80vh] ${
          isDark
            ? 'bg-[#18191C] border-white/[0.08] text-gray-200'
            : 'bg-white border-black/[0.08] text-gray-800'
        }`}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-500/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">복선 회수 처리</h3>
              <p className="text-[11px] text-gray-500">아직 회수되지 않은 복선을 선택하여 회수 완료 상태로 변경합니다.</p>
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
          {unresolvedList.length === 0 ? (
            <div className={`p-8 rounded-xl border border-dashed text-center flex flex-col items-center justify-center gap-2 ${
              isDark ? 'border-white/[0.08] text-gray-500' : 'border-black/[0.08] text-gray-400'
            }`}>
              <AlertCircle className="w-8 h-8 opacity-40 animate-pulse text-emerald-400" />
              <p className="text-xs font-semibold">회수할 미완료 복선이 없습니다.</p>
              <p className="text-[10px] opacity-60">모든 복선이 성공적으로 회수되었거나 아직 등록된 복선이 없습니다.</p>
            </div>
          ) : (
            unresolvedList.map(fs => (
              <div
                key={fs.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                  isDark
                    ? 'bg-[#121316] border-white/[0.06] hover:border-emerald-500/30'
                    : 'bg-gray-50 border-black/[0.06] hover:border-emerald-500/30'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Circle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold truncate">{fs.title}</h4>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#5E6AD2]/15 text-[#7480E2]">
                        {fs.createdChapter}화 ({fs.createdEpisodeTitle || '설치 문서'}) ➔ {fs.targetChapter}화 목표
                      </span>
                    </div>
                    {fs.description && (
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed whitespace-pre-wrap">
                        {fs.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onResolve(fs.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  복선 회수
                </button>
              </div>
            ))
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
