import React from 'react';

interface DividerConfigModalProps {
  isDark: boolean;
  activeDividerConfig: any;
  setActiveDividerConfig: (config: any) => void;
  dividerAlign: 'left' | 'center' | 'right';
  setDividerAlign: (align: 'left' | 'center' | 'right') => void;
  dividerWidth: string;
  setDividerWidth: (width: string) => void;
  dividerSize: string;
  setDividerSize: (size: string) => void;
  handleInsertConfiguredDivider: (e: React.FormEvent) => void;
}

export default function DividerConfigModal({
  isDark,
  activeDividerConfig,
  setActiveDividerConfig,
  dividerAlign,
  setDividerAlign,
  dividerWidth,
  setDividerWidth,
  dividerSize,
  setDividerSize,
  handleInsertConfiguredDivider
}: DividerConfigModalProps) {
  if (!activeDividerConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
          <h3 className="text-sm font-bold">⚙️ 구분선 스타일 설정 및 생성</h3>
          <button 
            type="button"
            onClick={() => setActiveDividerConfig(null)}
            className="text-gray-400 hover:text-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleInsertConfiguredDivider} className="flex flex-col gap-3.5 text-xs">
          {/* 구분선 형태 명시 */}
          <div className="flex flex-col gap-1 px-3 py-2 rounded-lg bg-gray-500/5 border border-gray-500/10">
            <span className="font-semibold text-gray-400 text-[10px]">선택한 형태</span>
            <span className="font-bold text-sm">
              {activeDividerConfig.defaultName} 
              {activeDividerConfig.type === 'text' ? ` (${activeDividerConfig.symbol})` : ` (${activeDividerConfig.style})`}
            </span>
          </div>

          {/* 정렬 위치 */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-400">정렬 위치</span>
            <div className="flex gap-2">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => setDividerAlign(align)}
                  className={`flex-1 py-1.5 rounded-lg border font-bold transition-all ${
                    dividerAlign === align
                      ? 'border-[#5E6AD2] bg-[#5E6AD2]/10 text-[#7480E2]'
                      : isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
                  }`}
                >
                  {align === 'left' ? '왼쪽' : align === 'center' ? '가운데' : '오른쪽'}
                </button>
              ))}
            </div>
          </div>

          {/* 길이 설정 (Line 타입인 경우 활성화) */}
          {activeDividerConfig.type === 'line' && (
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-gray-400">길이 (비율)</span>
              <select
                value={dividerWidth}
                onChange={(e) => setDividerWidth(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                  isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                }`}
              >
                <option value="100">100% (전체)</option>
                <option value="80">80% (보통)</option>
                <option value="50">50% (절반)</option>
                <option value="30">30% (짧게)</option>
              </select>
            </div>
          )}

          {/* 두께/크기 설정 */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-gray-400">
              {activeDividerConfig.type === 'line' ? '선 두께 (px)' : '글자 크기 (px)'}
            </span>
            <select
              value={dividerSize}
              onChange={(e) => setDividerSize(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
              }`}
            >
              {activeDividerConfig.type === 'line' ? (
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
              onClick={() => setActiveDividerConfig(null)}
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
              생성 및 삽입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
