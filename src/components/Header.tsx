import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  themeMode: 'dark' | 'light';
  setThemeMode: (theme: 'dark' | 'light') => void;
  setViewMode: (view: 'landing' | 'app') => void;
}

export default function Header({ themeMode, setThemeMode }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className={`w-full h-20 border-b sticky top-0 backdrop-blur-md z-50 transition-colors duration-300 ${themeMode === 'dark' ? 'border-white/[0.06] bg-[#08090A]/85' : 'border-black/[0.06] bg-[#F4F4F6]/85'
      }`}>
      <div className="w-full h-full px-3 md:px-8 flex justify-between items-center">
        {/* 로고 */}
        <Link to="/" className="flex items-center gap-4 cursor-pointer">
          <img src="/logo.png" alt="Novelflow Logo" className="w-15 h-15 rounded-lg" />
          <span className={`font-heading font-bold text-[30px] transition-colors duration-300 ${themeMode === 'dark'
            ? 'bg-gradient-to-r from-white to-[#A1A1AA] bg-clip-text text-transparent'
            : 'text-[#121316]'
            }`}>
            Novelflow
          </span>
        </Link>

        {/* 우측 컨트롤 */}
        <div className="flex items-center gap-4 md:gap-4">
          {/* 테마 토글 */}
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className={`rounded-lg cursor-pointer text-2xl transition-all ${themeMode === 'dark' ? 'hover:bg-white/5 text-yellow-400' : 'hover:bg-black/5 text-slate-700'
              }`}
            title="다크/라이트 모드 전환"
          >
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </button>

          {user ? (
            /* 로그인 상태: 워크스페이스 이동 + 로그아웃 */
            <>
              <Link
                to="/app"
                className={`text-[18px] font-semibold transition-colors ${themeMode === 'dark' ? 'text-[#A1A1AA] hover:text-[#EDEDEF]' : 'text-[#555] hover:text-black'}`}
              >
                워크스페이스
              </Link>
              <button
                onClick={signOut}
                className={`text-[18px] font-semibold transition-colors ${themeMode === 'dark' ? 'text-[#A1A1AA] hover:text-red-400' : 'text-[#555] hover:text-red-500'}`}
              >
                로그아웃
              </button>
            </>
          ) : (
            /* 비로그인 상태: 로그인 + 회원가입 */
            <>
              <Link
                to="/login"
                className={`text-[20px] font-semibold transition-colors ${themeMode === 'dark' ? 'text-[#A1A1AA] hover:text-[#EDEDEF]' : 'text-[#555] hover:text-black'
                  }`}
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary px-5 py-2 text-[20px] rounded-lg hover:shadow-lg transition-all cursor-pointer"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}