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
  handleDeleteSnapshot: (snapId: string) => void;
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
    handleDeleteSnapshot,
  } = props;

  if (!showHistoryModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
      <div className={`relative w-full max-w-2xl mx-4 rounded-2xl border shadow-2xl p-6 md:p-8 ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
        <h3 className={`font-heading font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-black'}`}>📌 버전 이력 (스냅샷 목록)</h3>
        <p className="text-xs text-gray-500 mb-6">스냅샷의 이름과 메모 영역을 클릭하여 내용을 수정할 수 있습니다. 30일이 지난 스냅샷은 자동으로 정리됩니다.</p>

        <div className="max-h-[30rem] overflow-y-auto flex flex-col gap-3 mb-6 pr-1">
          {historySnapshots.map(snap => (
            <div
              key={snap.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${isDark ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]' : 'bg-black/[0.01] border-black/[0.04] hover:bg-black/[0.02]'}`}
            >
              <div className="flex flex-col min-w-0 flex-1 gap-1">
                <div className="flex items-center gap-3 min-w-0 flex-wrap">
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
                      className={`px-2 py-1 rounded-lg border outline-none font-bold text-sm w-56 ${isDark ? 'bg-[#1F2023] border-white/[0.12] text-white' : 'bg-white border-black/[0.12] text-black'}`}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setSnapshotNameEditId(snap.id);
                        setSnapshotNameEditValue(snap.name);
                      }}
                      className={`font-bold text-sm cursor-pointer border-b border-dashed border-gray-500/60 hover:text-[#7480E2] truncate max-w-[280px] ${isDark ? 'text-white' : 'text-black'}`}
                      title="클릭하여 이름 수정"
                    >
                      {snap.name}
                    </span>
                  )}

                  {/* 자동/수동 뱃지 */}
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 ${
                    snap.type === 'manual'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : snap.type === 'auto_words'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    {snap.type === 'manual' ? '수동 저장' : snap.type === 'auto_words' ? '자동(자수)' : '자동(시간)'}
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
                    className={`px-2 py-1 rounded-lg border outline-none text-xs w-full ${isDark ? 'bg-[#1F2023] border-white/[0.12] text-gray-200' : 'bg-white border-black/[0.12] text-gray-800'}`}
                    autoFocus
                  />
                ) : (
                  <span
                    onClick={() => {
                      setSnapshotMemoEditId(snap.id);
                      setSnapshotMemoEditValue(snap.memo || '');
                    }}
                    className="text-xs text-gray-400 cursor-pointer hover:text-gray-300 truncate max-w-[400px]"
                    title="클릭하여 메모 수정"
                  >
                    📝 {snap.memo || '메모 없음 (클릭하여 입력)'}
                  </span>
                )}

                <div className="flex items-center gap-3 text-[10.5px] text-gray-500 mt-0.5">
                  <span>저장일자: <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>{snap.timestamp}</strong></span>
                  <span className="w-1 h-1 rounded-full bg-gray-500/40" />
                  <span>글자수: <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>{snap.charCount.toLocaleString()}자</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setDiffTargetSnapshot(snap);
                    setIsDiffMode(true);
                    setShowHistoryModal(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#5E6AD2] text-white text-xs font-bold hover:bg-[#7480E2] transition-colors"
                  title="스냅샷 비교 후 복원 진행"
                >
                  복원
                </button>
                <button
                  onClick={() => {
                    if (confirm('이 버전을 정말 삭제하시겠습니까? (삭제된 버전은 되돌릴 수 없습니다)')) {
                      handleDeleteSnapshot(snap.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-bold hover:bg-red-500 transition-colors"
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
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${isDark
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
