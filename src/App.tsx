import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';

export default function App() {
  // 테마 상태 관리 (다크 / 라이트 모드)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // 메인 화면 완성에 집중하기 위해 viewMode는 landing 뷰 위주로 심플하게 제어
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('landing');

  const handleNavigation = (mode: 'landing' | 'app') => {
    if (mode === 'app') {
      alert('워크스페이스 진입 및 집필대 기능은 메인 화면 설계 완료 후 구현됩니다.');
    } else {
      setViewMode(mode);
    }
  };

  return (
    <div className={`w-full min-h-screen font-sans selection:bg-[#5E6AD2]/30 selection:text-white transition-colors duration-300 ${themeMode === 'dark' ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'
      }`}>

      {viewMode === 'landing' ? (
        <div className="w-full flex flex-col items-center">
          <Header
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            setViewMode={handleNavigation}
          />

          <Hero themeMode={themeMode} />
        </div>
      ) : (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-8">
          <div className={`p-8 rounded-xl border max-w-md text-center ${themeMode === 'dark' ? 'bg-[#121316] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <h2 className="text-xl font-bold mb-4">워크스페이스 준비 중</h2>
            <p className="text-sm opacity-70 mb-6">현재 메인 랜딩 화면을 고도화하고 있습니다.</p>
            <button
              className="btn btn-secondary px-5 py-2 rounded-lg cursor-pointer"
              onClick={() => setViewMode('landing')}
            >
              메인 화면으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
