import React from 'react';

interface LinkInsertModalProps {
  isDark: boolean;
  showLinkModal: boolean;
  setShowLinkModal: (show: boolean) => void;
  linkText: string;
  setLinkText: (text: string) => void;
  linkUrl: string;
  setLinkUrl: (url: string) => void;
  linkNewTab: boolean;
  setLinkNewTab: (newTab: boolean) => void;
  executeInsertLink: (e: React.FormEvent) => void;
}

export default function LinkInsertModal({
  isDark,
  showLinkModal,
  setShowLinkModal,
  linkText,
  setLinkText,
  linkUrl,
  setLinkUrl,
  linkNewTab,
  setLinkNewTab,
  executeInsertLink
}: LinkInsertModalProps) {
  if (!showLinkModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-80 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
          <h3 className="text-sm font-bold">🔗 링크(Link) 삽입</h3>
          <button 
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="text-gray-400 hover:text-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={executeInsertLink} className="flex flex-col gap-3.5 text-xs">
          {/* 표시할 글자 */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-400">표시할 텍스트</span>
            <input
              type="text"
              placeholder="미입력 시 URL이 그대로 노출됩니다"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border outline-none ${
                isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
              }`}
            />
          </div>

          {/* URL 주소 */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-400">링크 주소 (URL)</span>
            <input
              type="text"
              required
              placeholder="예: naver.com 또는 google.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className={`px-3 py-1.5 rounded-lg border outline-none ${
                isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
              }`}
            />
          </div>

          {/* 새 창에서 열기 */}
          <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
            <input
              type="checkbox"
              checked={linkNewTab}
              onChange={(e) => setLinkNewTab(e.target.checked)}
              className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4"
            />
            <span className="font-semibold text-gray-400">새 탭에서 링크 열기 (target="_blank")</span>
          </label>

          {/* 버튼 그룹 */}
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setShowLinkModal(false)}
              className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all"
            >
              링크 삽입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
