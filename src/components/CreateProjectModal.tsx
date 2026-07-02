import { useState, type FormEvent, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
  themeMode: 'dark' | 'light';
  onClose: () => void;
  onSubmit: (name: string, description: string) => Promise<void>;
}

export default function CreateProjectModal({ themeMode, onClose, onSubmit }: CreateProjectModalProps) {
  const isDark = themeMode === 'dark';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('프로젝트 이름을 입력해 주세요.'); return; }
    setError('');
    setLoading(true);
    await onSubmit(name.trim(), description.trim());
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 모달 카드 */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl ${
        isDark ? 'bg-[#0D0E11] border-white/[0.08]' : 'bg-white border-black/[0.08]'
      }`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          <h2 className={`font-heading font-bold text-lg ${isDark ? 'text-white' : 'text-[#121316]'}`}>
            새 프로젝트
          </h2>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-[#3A3D50] hover:bg-white/[0.06] hover:text-[#A1A1AA]'
                : 'text-[#C5C5CC] hover:bg-black/[0.05] hover:text-[#55555A]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* 프로젝트 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              프로젝트 이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예) 이계 전생한 마법사"
              autoFocus
              maxLength={50}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border
                ${isDark
                  ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                  : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                }`}
            />
          </div>


          {/* 한 줄 소개 */}
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-medium ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              한 줄 소개 <span className={`font-normal ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>(선택)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="작품 내용을 간략히 설명해 주세요."
              rows={3}
              maxLength={200}
              className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border resize-none
                ${isDark
                  ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                  : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                }`}
            />
          </div>

          {/* 에러 */}
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                isDark
                  ? 'border-white/[0.08] text-[#A1A1AA] hover:text-[#EDEDEF] hover:border-white/20'
                  : 'border-black/[0.08] text-[#55555A] hover:text-[#121316] hover:border-black/20'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold
                hover:bg-[#7480E2] active:scale-[0.98] transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : '만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
