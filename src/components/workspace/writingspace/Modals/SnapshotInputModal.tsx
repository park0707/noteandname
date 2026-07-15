interface SnapshotInputModalProps {
  isDark: boolean;
  showSnapshotInputModal: boolean;
  setShowSnapshotInputModal: (show: boolean) => void;
  snapshotInputName: string;
  setSnapshotInputName: (name: string) => void;
  snapshotInputMemo: string;
  setSnapshotInputMemo: (memo: string) => void;
  confirmCreateSnapshot: () => void;
}

export default function SnapshotInputModal({
  isDark,
  showSnapshotInputModal,
  setShowSnapshotInputModal,
  snapshotInputName,
  setSnapshotInputName,
  snapshotInputMemo,
  setSnapshotInputMemo,
  confirmCreateSnapshot
}: SnapshotInputModalProps) {
  if (!showSnapshotInputModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
          <h3 className="text-sm font-bold">📌 버전 스냅샷 저장</h3>
          <button 
            type="button"
            onClick={() => setShowSnapshotInputModal(false)} 
            className="text-gray-400 hover:text-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-400">스냅샷 이름</label>
            <input
              type="text"
              value={snapshotInputName}
              onChange={e => setSnapshotInputName(e.target.value)}
              onKeyDown={e => { 
                if (e.key === 'Enter') confirmCreateSnapshot(); 
                if (e.key === 'Escape') setShowSnapshotInputModal(false); 
              }}
              placeholder="예: 1화 완성본"
              className={`px-3 py-1.5 rounded-lg border outline-none ${
                isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
              }`}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-400">메모 (선택)</label>
            <input
              type="text"
              value={snapshotInputMemo}
              onChange={e => setSnapshotInputMemo(e.target.value)}
              onKeyDown={e => { 
                if (e.key === 'Enter') confirmCreateSnapshot(); 
                if (e.key === 'Escape') setShowSnapshotInputModal(false); 
              }}
              placeholder="예: 1차 퇴고 완료 후 저장"
              className={`px-3 py-1.5 rounded-lg border outline-none ${
                isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
              }`}
            />
          </div>
        </div>
        <div className="flex gap-2.5 mt-1">
          <button
            type="button"
            onClick={() => setShowSnapshotInputModal(false)}
            className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
              isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
            }`}
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirmCreateSnapshot}
            className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
