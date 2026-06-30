

interface HeaderProps {
  themeMode: 'dark' | 'light';
  setThemeMode: (theme: 'dark' | 'light') => void;
  setViewMode: (view: 'landing' | 'app') => void;
}

export default function Header({ themeMode, setThemeMode, setViewMode }: HeaderProps) {
  return (
    <header className={`w-full h-20 border-b sticky top-0 backdrop-blur-md z-50 transition-colors duration-300 ${themeMode === 'dark' ? 'border-white/[0.06] bg-[#08090A]/85' : 'border-black/[0.06] bg-[#F4F4F6]/85'
      }`}>
      <div className="w-full h-full px-3 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewMode('landing')}>
          <img src="/logo.png" alt="Novelflow Logo" className="w-15 h-15 rounded-lg" />
          <span className={`font-heading font-bold text-[30px] transition-colors duration-300 ${themeMode === 'dark' ? 'bg-gradient-to-r from-white to-[#A1A1AA] bg-clip-text text-transparent' : 'text-[#121316]'
            }`}>
            Novelflow
          </span>
        </div>

        <div className="flex items-center gap-4 md:gap-4">
          <button
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className={`rounded-lg cursor-pointer text-2xl transition-all ${themeMode === 'dark' ? 'hover:bg-white/5 text-yellow-400' : 'hover:bg-black/5 text-slate-700'
              }`}
            title="다크/라이트 모드 전환"
          >
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            className={`text-[20px] font-medium transition-colors cursor-pointer font-semibold ${themeMode === 'dark' ? 'text-[#A1A1AA] hover:text-[#EDEDEF]' : 'text-[#555] hover:text-black'
              }`}
            onClick={() => setViewMode('app')}
          >
            로그인
          </button>

          <button
            className="btn btn-primary px-5 py-2 text-[20px] rounded-lg hover:shadow-lg transition-all cursor-pointer"
            onClick={() => setViewMode('app')}
          >
            회원가입
          </button>


        </div>
      </div>
    </header>
  );
}