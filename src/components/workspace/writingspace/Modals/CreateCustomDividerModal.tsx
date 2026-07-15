import React from 'react';

interface CreateCustomDividerModalProps {
  isDark: boolean;
  showCreateDividerModal: boolean;
  setShowCreateDividerModal: (show: boolean) => void;
  newDividerName: string;
  setNewDividerName: (name: string) => void;
  newDividerType: 'line' | 'text';
  setNewDividerType: (type: 'line' | 'text') => void;
  newDividerStyle: string;
  setNewDividerStyle: (style: string) => void;
  newDividerSymbol: string;
  setNewDividerSymbol: (symbol: string) => void;
  newDividerSize: string;
  setNewDividerSize: (size: string) => void;
  handleCreateCustomDivider: (e: React.FormEvent) => void;
}

export default function CreateCustomDividerModal({
  isDark,
  showCreateDividerModal,
  setShowCreateDividerModal,
  newDividerName,
  setNewDividerName,
  newDividerType,
  setNewDividerType,
  newDividerStyle,
  setNewDividerStyle,
  newDividerSymbol,
  setNewDividerSymbol,
  newDividerSize,
  setNewDividerSize,
  handleCreateCustomDivider
}: CreateCustomDividerModalProps) {
  if (!showCreateDividerModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
          <h3 className="text-sm font-bold">➕ 나만의 커스텀 구분선 만들기</h3>
          <button 
            type="button"
            onClick={() => setShowCreateDividerModal(false)}
            className="text-gray-400 hover:text-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreateCustomDivider} className="flex flex-col gap-3.5 text-xs">
          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-400">구분선 이름</span>
            <input
              type="text"
              required
              placeholder="예: 내 장미 기호 구분선"
              value={newDividerName}
              onChange={(e) => setNewDividerName(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border outline-none ${
                isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
              }`}
            />
          </div>

          {/* 유형 */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-400">구분선 종류</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setNewDividerType('line'); setNewDividerSize('2'); }}
                className={`flex-1 py-1.5 rounded-lg border font-bold transition-all ${
                  newDividerType === 'line'
                    ? 'border-[#5E6AD2] bg-[#5E6AD2]/10 text-[#7480E2]'
                    : isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                }`}
              >
                선형 (Line)
              </button>
              <button
                type="button"
                onClick={() => { setNewDividerType('text'); setNewDividerSize('16'); }}
                className={`flex-1 py-1.5 rounded-lg border font-bold transition-all ${
                  newDividerType === 'text'
                    ? 'border-[#5E6AD2] bg-[#5E6AD2]/10 text-[#7480E2]'
                    : isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                }`}
              >
                문자기호형 (Text)
              </button>
            </div>
          </div>

          {/* 형태 스타일/기호 입력 */}
          {newDividerType === 'line' ? (
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-400">선 스타일</span>
              <select
                value={newDividerStyle}
                onChange={(e) => setNewDividerStyle(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                  isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                }`}
              >
                <option value="solid">실선 (Solid)</option>
                <option value="dashed">점선 (Dashed)</option>
                <option value="double">이중선 (Double)</option>
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-400">구분 기호 문자</span>
              <input
                type="text"
                required
                placeholder="예: ◆ ◆ ◆ 또는 ◇ ◇ ◇ 또는 ★ ★ ★"
                value={newDividerSymbol}
                onChange={(e) => setNewDividerSymbol(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border outline-none ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                }`}
              />
            </div>
          )}

          {/* 두께/크기 설정 */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-400">
              {newDividerType === 'line' ? '선 두께 (px)' : '글자 크기 (px)'}
            </span>
            <select
              value={newDividerSize}
              onChange={(e) => setNewDividerSize(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
              }`}
            >
              {newDividerType === 'line' ? (
                <>
                  <option value="1">1px (가장 얇게)</option>
                  <option value="2">2px (보통)</option>
                  <option value="3">3px (두껍게)</option>
                  <option value="4">4px (가장 두껍게)</option>
                </>
              ) : (
                <>
                  <option value="12">12px (작게)</option>
                  <option value="16">16px (보통)</option>
                  <option value="20">20px (크게)</option>
                  <option value="24">24px (가장 크게)</option>
                </>
              )}
            </select>
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setShowCreateDividerModal(false)}
              className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
            >
              저장 및 삽입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
