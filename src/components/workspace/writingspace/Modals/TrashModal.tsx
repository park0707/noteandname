import type { Episode } from '../../types';

interface TrashModalProps {
  isDark: boolean;
  showTrashModal: boolean;
  setShowTrashModal: (show: boolean) => void;
  trashEpisodes: Episode[];
  handleSidebarRestoreEpisode: (id: string) => void;
  handleSidebarPermanentlyDeleteEpisode: (id: string) => void;
}

export default function TrashModal(props: TrashModalProps) {
  const {
    isDark,
    showTrashModal,
    setShowTrashModal,
    trashEpisodes,
    handleSidebarRestoreEpisode,
    handleSidebarPermanentlyDeleteEpisode,
  } = props;

  if (!showTrashModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTrashModal(false)} />
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
        <h3 className={`font-heading font-bold text-base mb-4 ${isDark ? 'text-white' : 'text-black'}`}>휴지통</h3>

        <div className="max-h-60 overflow-y-auto pt-2 flex flex-col gap-2 mb-6">
          {trashEpisodes.map(ep => (
            <div
              key={ep.id}
              className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'}`}
            >
              <div className="flex flex-col min-w-0">
                <span className={`font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{ep.title}</span>
                <span className="text-[10px] text-gray-500">글자수: {ep.charCount.toLocaleString()}자</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleSidebarRestoreEpisode(ep.id)}
                  className="px-2 py-1 rounded bg-[#5E6AD2] text-white font-semibold hover:bg-[#7480E2] transition-colors"
                >
                  복구
                </button>
                <button
                  onClick={() => handleSidebarPermanentlyDeleteEpisode(ep.id)}
                  className="px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
                >
                  영구삭제
                </button>
              </div>
            </div>
          ))}
          {trashEpisodes.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-500">휴지통이 비어 있습니다.</div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowTrashModal(false)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${isDark
              ? 'border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20'
              : 'border-black/[0.08] text-gray-600 hover:text-black hover:border-black/20'
            }`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
