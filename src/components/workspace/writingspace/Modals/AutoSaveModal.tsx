interface AutoSaveModalProps {
  isDark: boolean;
  showAutoSaveModal: boolean;
  setShowAutoSaveModal: (show: boolean) => void;
  tempWordsEnabled: boolean;
  setTempWordsEnabled: (val: boolean) => void;
  tempWordsThreshold: number;
  setTempWordsThreshold: (val: number) => void;
  tempTimeEnabled: boolean;
  setTempTimeEnabled: (val: boolean) => void;
  tempTimeInterval: number;
  setTempTimeInterval: (val: number) => void;
  saveAutoSaveConfig: (wordsEnabled: boolean, wordsThreshold: number, timeEnabled: boolean, timeInterval: number) => void;
}

export default function AutoSaveModal({
  isDark,
  showAutoSaveModal,
  setShowAutoSaveModal,
  tempWordsEnabled,
  setTempWordsEnabled,
  tempWordsThreshold,
  setTempWordsThreshold,
  tempTimeEnabled,
  setTempTimeEnabled,
  tempTimeInterval,
  setTempTimeInterval,
  saveAutoSaveConfig
}: AutoSaveModalProps) {
  if (!showAutoSaveModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
          <h3 className="text-sm font-bold">⚙️ 자동 저장 설정</h3>
          <button 
            type="button"
            onClick={() => setShowAutoSaveModal(false)} 
            className="text-gray-400 hover:text-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
        
        <div className="flex flex-col gap-4 text-xs">
          {/* 글자 수 기준 */}
          <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.06]'}`}>
            <label className="flex items-center justify-between font-semibold cursor-pointer">
              <span>글자 수 기준 자동 저장</span>
              <input
                type="checkbox"
                checked={tempWordsEnabled}
                onChange={e => setTempWordsEnabled(e.target.checked)}
                className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4 cursor-pointer"
              />
            </label>
            {tempWordsEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400">조건: </span>
                <input
                  type="number"
                  value={tempWordsThreshold}
                  onChange={e => setTempWordsThreshold(Math.max(10, parseInt(e.target.value) || 0))}
                  className={`w-28 px-2.5 py-1 rounded border outline-none text-right ${isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'}`}
                />
                <span className="text-gray-400">자 변동 시 저장</span>
              </div>
            )}
          </div>

          {/* 시간 기준 */}
          <div className={`p-3 rounded-lg border flex flex-col gap-2.5 ${isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.06]'}`}>
            <label className="flex items-center justify-between font-semibold cursor-pointer">
              <span>시간 간격 기준 자동 저장</span>
              <input
                type="checkbox"
                checked={tempTimeEnabled}
                onChange={e => setTempTimeEnabled(e.target.checked)}
                className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4 cursor-pointer"
              />
            </label>
            {tempTimeEnabled && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400">간격: </span>
                <select
                  value={tempTimeInterval}
                  onChange={e => setTempTimeInterval(parseInt(e.target.value))}
                  className={`px-2.5 py-1 rounded border outline-none ${isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-white border-black/[0.08] text-black focus:border-[#5E6AD2]'}`}
                >
                  <option value={1}>1분 (테스트용)</option>
                  <option value={5}>5분</option>
                  <option value={10}>10분</option>
                  <option value={15}>15분</option>
                  <option value={30}>30분</option>
                  <option value={60}>60분</option>
                </select>
              </div>
            )}
            <p className="text-[10px] text-gray-500 mt-1 select-none">
              ※ 1시간 이상 글의 변화가 없으면 자동으로 저장하지 않습니다.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 mt-2">
          <button
            type="button"
            onClick={() => setShowAutoSaveModal(false)}
            className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'}`}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => saveAutoSaveConfig(tempWordsEnabled, tempWordsThreshold, tempTimeEnabled, tempTimeInterval)}
            className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
