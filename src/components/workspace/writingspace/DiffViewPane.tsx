import type { Episode, Snapshot } from '../types';
import { diffWords } from '../utils';

interface DiffViewPaneProps {
  isDark: boolean;
  diffTargetSnapshot: Snapshot;
  activeEpisode: Episode;
  setIsDiffMode: (v: boolean) => void;
  setDiffTargetSnapshot: (snap: Snapshot | null) => void;
  handleRestoreSnapshot: (content: string) => void;
  themeStyles: any;
}

export default function DiffViewPane(props: DiffViewPaneProps) {
  const {
    isDark,
    diffTargetSnapshot,
    activeEpisode,
    setIsDiffMode,
    setDiffTargetSnapshot,
    handleRestoreSnapshot,
    themeStyles,
  } = props;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 비교 상단 바 */}
      <div className={`px-6 py-3 border-b flex items-center justify-between shrink-0 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>버전 비교 모드</span>
          <span className="text-[10px] bg-[#5E6AD2]/20 text-[#7480E2] px-1.5 py-0.5 rounded font-semibold">
            {diffTargetSnapshot.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleRestoreSnapshot(diffTargetSnapshot.content);
              setIsDiffMode(false);
              setDiffTargetSnapshot(null);
            }}
            className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-xl transition-all"
          >
            이 스냅샷으로 복원 승인
          </button>
          <button
            onClick={() => {
              setIsDiffMode(false);
              setDiffTargetSnapshot(null);
            }}
            className={`px-4 py-1.5 border text-xs font-bold rounded-xl transition-all ${isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-700'}`}
          >
            비교 종료 (에디터 복귀)
          </button>
        </div>
      </div>

      {/* 비교 바디 (좌우 스플릿) */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 현재 상태 (Diff 하이라이팅) */}
        <div className={`flex-1 border-r overflow-y-auto px-8 py-10 flex justify-center ${isDark ? 'bg-[#0F1012] border-white/[0.04]' : 'bg-[#F9FAFB] border-black/[0.04]'}`}>
          <div className={`w-full max-w-2xl flex flex-col rounded-2xl border shadow-lg p-10 font-serif leading-relaxed text-sm overflow-y-auto ${themeStyles.paper}`}>
            <h4 className="text-xs font-bold text-gray-400 mb-6 border-b border-gray-500/10 pb-2">현재 원고 상태 (변경점 표시)</h4>
            <div className="whitespace-pre-wrap select-text">
              {diffWords(diffTargetSnapshot.content, activeEpisode.content || '').map((change, idx) => {
                if (change.type === 'added') {
                  return (
                    <span key={idx} className="bg-green-500/20 text-green-500 font-semibold px-0.5 rounded">
                      {change.value}
                    </span>
                  );
                } else if (change.type === 'removed') {
                  return (
                    <span key={idx} className="bg-red-500/20 text-red-500 line-through px-0.5 rounded">
                      {change.value}
                    </span>
                  );
                } else {
                  return <span key={idx}>{change.value}</span>;
                }
              })}
            </div>
          </div>
        </div>

        {/* 우측: 스냅샷 상태 (읽기 전용) */}
        <div className={`flex-1 overflow-y-auto px-8 py-10 flex justify-center ${isDark ? 'bg-[#0F1012]' : 'bg-[#F9FAFB]'}`}>
          <div className={`w-full max-w-2xl flex flex-col rounded-2xl border shadow-lg p-10 font-serif leading-relaxed text-sm overflow-y-auto ${themeStyles.paper}`}>
            <h4 className="text-xs font-bold text-gray-400 mb-6 border-b border-gray-500/10 pb-2">선택한 스냅샷 원고 상태</h4>
            <div
              className="whitespace-pre-wrap select-text opacity-85"
              dangerouslySetInnerHTML={{ __html: diffTargetSnapshot.content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
