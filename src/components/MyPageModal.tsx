import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { X, Folder, LogOut, Mail } from 'lucide-react';

interface MyPageModalProps {
  themeMode: 'dark' | 'light';
  onClose: () => void;
}

export default function MyPageModal({ themeMode, onClose }: MyPageModalProps) {
  const { user, signOut } = useAuth();
  const isDark = themeMode === 'dark';
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ESC 키 누르면 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 사용자의 총 프로젝트 수 가져오기
  useEffect(() => {
    const fetchProjectCount = async () => {
      if (!user) return;
      setLoading(true);
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setProjectCount(count);
      }
      setLoading(false);
    };

    fetchProjectCount();
  }, [user]);



  const renderProviderBadge = () => {
    const provider = user?.app_metadata.provider;
    if (provider === 'google') {
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#EA4335] shrink-0" />
          <span>구글 계정으로 로그인됨</span>
        </span>
      );
    }
    if (provider === 'kakao') {
      return (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FEE500] shrink-0" />
          <span className={isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}>카카오 계정으로 로그인됨</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-[#5E6AD2] shrink-0" />
        <span>이메일로 로그인됨</span>
      </span>
    );
  };

  const handleSignOutClick = async () => {
    onClose();
    await signOut();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 모달 박스 */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#0D0E11] border-white/[0.08]' : 'bg-white border-black/[0.08]'
      }`}>
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          <h2 className={`font-heading font-bold text-lg ${isDark ? 'text-white' : 'text-[#121316]'}`}>
            마이페이지
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

        {/* 콘텐츠 */}
        <div className="px-6 py-6 flex flex-col gap-6">
          {/* 프로필 요약 */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#5E6AD2] flex items-center justify-center text-white text-xl font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                {user?.email}
              </p>
              <div className={`text-xs mt-1.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                {renderProviderBadge()}
              </div>
            </div>
          </div>

          {/* 서비스 이용 현황 */}
          <div className={`p-4 rounded-xl border flex justify-between items-center ${
            isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]'
          }`}>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>내 프로젝트 수</p>
              <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                {loading ? '...' : `${projectCount}개`}
              </p>
            </div>
            <Folder className="w-6 h-6 text-[#5E6AD2] shrink-0" />
          </div>

          {/* 계정 관리 액션 */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={handleSignOutClick}
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold
                hover:bg-red-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {/* 푸터 */}
        <div className={`px-6 py-4 border-t flex justify-end shrink-0 ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
              isDark
                ? 'border-white/[0.08] text-[#A1A1AA] hover:text-[#EDEDEF] hover:border-white/20'
                : 'border-black/[0.08] text-[#55555A] hover:text-[#121316] hover:border-black/20'
            }`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
