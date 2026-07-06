import type { Dispatch, SetStateAction } from 'react';
import type { Snapshot } from '../../types';

interface SnapshotHistoryModalProps {
  isDark: boolean;
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
  historySnapshots: Snapshot[];
  snapshotNameEditId: string | null;
  setSnapshotNameEditId: (id: string | null) => void;
  snapshotNameEditValue: string;
  setSnapshotNameEditValue: (v: string) => void;
  handleUpdateSnapshotInfo: (snapId: string, updates: Partial<Snapshot>) => void;
  snapshotMemoEditId: string | null;
  setSnapshotMemoEditId: (id: string | null) => void;
  snapshotMemoEditValue: string;
  setSnapshotMemoEditValue: (v: string) => void;
  setDiffTargetSnapshot: (snap: Snapshot) => void;
  setIsDiffMode: (v: boolean) => void;
  setHistorySnapshots: Dispatch<SetStateAction<Snapshot[]>>;
}

export default function SnapshotHistoryModal(props: SnapshotHistoryModalProps) {
  const {
    isDark,
    showHistoryModal,
    setShowHistoryModal,
    historySnapshots,
    snapshotNameEditId,
    setSnapshotNameEditId,
    snapshotNameEditValue,
    setSnapshotNameEditValue,
    handleUpdateSnapshotInfo,
    snapshotMemoEditId,
    setSnapshotMemoEditId,
    snapshotMemoEditValue,
    setSnapshotMemoEditValue,
    setDiffTargetSnapshot,
    setIsDiffMode,
    setHistorySnapshots,
  } = props;

  if (!showHistoryModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
      <div className={`relative w-full max-w-lg mx-4 rounded-2xl border shadow-2xl p-6 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
        <h3 className={`font-heading font-bold text-base mb-1.5 ${isDark ? 'text-white' : 'text-black'}`}>버전 이력 (스냅샷 목록)</h3>
        <p className="text-[10px] text-gray-500 mb-4">스냅샷의 이름과 메모 영역을 클릭하여 자유롭게 내용을 수정할 수 있습니다.</p>

        <div className="max-h-80 overflow-y-auto flex flex-col gap-2 mb-6">
          {historySnapshots.map(snap => (
            <div
              key={snap.id}
              className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'}`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1 min-w-0">
                  {/* 이름 인라인 수정 */}
                  {snapshotNameEditId === snap.id ? (
                    <input
                      type="text"
                      value={snapshotNameEditValue}
                      onChange={e => setSnapshotNameEditValue(e.target.value)}
                      onBlur={() => {
                        handleUpdateSnapshotInfo(snap.id, { name: snapshotNameEditValue.trim() || snap.name });
                        setSnapshotNameEditId(null);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleUpdateSnapshotInfo(snap.id, { name: snapshotNameEditValue.trim() || snap.name });
                          setSnapshotNameEditId(null);
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded border outline-none font-bold text-xs w-40 ${isDark ? 'bg-[#1F2023] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'}`}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setSnapshotNameEditId(snap.id);
                        setSnapshotNameEditValue(snap.name);
                      }}
                      className={`font-semibold cursor-pointer border-b border-dashed border-gray-500 hover:text-[#7480E2] truncate max-w-[170px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                      title="클릭하여 이름 수정"
                    >
                      {snap.name}
                    </span>
                  )}

                  {/* 자동/수동 뱃지 */}
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold shrink-0 ${
                    snap.type === 'manual'
                      ? 'bg-blue-500/10 text-blue-400'
                      : snap.type === 'auto_words'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {snap.type === 'manual' ? '수동' : snap.type === 'auto_words' ? '자동(자수)' : '자동(시간)'}
                  </span>
                </div>

                {/* 메모 인라인 수정 */}
                {snapshotMemoEditId === snap.id ? (
                  <input
                    type="text"
                    value={snapshotMemoEditValue}
                    onChange={e => setSnapshotMemoEditValue(e.target.value)}
                    onBlur={() => {
                      handleUpdateSnapshotInfo(snap.id, { memo: snapshotMemoEditValue.trim() || '메모 없음' });
                      setSnapshotMemoEditId(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleUpdateSnapshotInfo(snap.id, { memo: snapshotMemoEditValue.trim() || '메모 없음' });
                        setSnapshotMemoEditId(null);
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded border outline-none text-[10px] w-full ${isDark ? 'bg-[#1F2023] border-white/[0.08] text-gray-300' : 'bg-white border-black/[0.08] text-gray-700'}`}
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setSnapshotMemoEditId(snap.id);
                      setSnapshotMemoEditValue(snap.memo || '');
                    }}
                    className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400 truncate max-w-[240px]"
                    title="클릭하여 메모 수정"
                  >
                    {snap.memo || '메모 없음 (클릭하여 추가)'}
                  </span>
                )}

                <span className="text-[9px] text-gray-400 mt-1">저장일자: {snap.timestamp} (글자수: {snap.wordCount.toLocaleString()}자)</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setDiffTargetSnapshot(snap);
                    setIsDiffMode(true);
                    setShowHistoryModal(false);
                  }}
                  className="px-2.5 py-1 rounded bg-[#5E6AD2] text-white font-semibold hover:bg-[#7480E2] transition-colors"
                  title="스냅샷 비교 후 복원 진행"
                >
                  복원
                </button>
                <button
                  onClick={() => {
                    setHistorySnapshots(prev => prev.filter(s => s.id !== snap.id));
                  }}
                  className="px-2 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          {historySnapshots.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-500">생성된 스냅샷 버전이 없습니다.</div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowHistoryModal(false)}
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
