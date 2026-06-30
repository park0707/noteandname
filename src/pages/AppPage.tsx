import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AppPageProps {
  themeMode: 'dark' | 'light';
}

export default function AppPage({ themeMode }: AppPageProps) {
  const { user, signOut } = useAuth();
  const isDark = themeMode === 'dark';

  return (
    <div className={`w-full min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'}`}>
      <div className={`p-10 rounded-2xl border max-w-md w-full text-center ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
        <p className={`text-sm mb-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          로그인 완료 ✅
        </p>
        <p className={`text-xs mb-8 ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>
          {user?.email}
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="w-full py-3 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold hover:bg-[#7480E2] transition-colors"
          >
            메인 화면으로
          </Link>
          <button
            onClick={signOut}
            className={`w-full py-3 rounded-xl text-sm font-semibold border transition-colors
              ${isDark ? 'border-white/[0.08] text-[#A1A1AA] hover:text-white' : 'border-black/[0.08] text-[#55555A] hover:text-[#121316]'}`}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
