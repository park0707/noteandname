import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AlertConfirmProvider } from './context/AlertConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';

import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import WorkspacePage from './pages/WorkspacePage';
import Footer from './components/Footer';
import InfoPage from './pages/InfoPage';

// 랜딩 페이지 레이아웃 (Header + Hero + Features + Footer)
function LandingPage({ themeMode, setThemeMode }: {
  themeMode: 'dark' | 'light';
  setThemeMode: (m: 'dark' | 'light') => void;
}) {
  return (
    <div className="w-full flex flex-col items-center min-h-screen">
      <Header
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        setViewMode={() => { }}
      />
      <Hero themeMode={themeMode} />
      <Features themeMode={themeMode} />
      <Footer themeMode={themeMode} />
    </div>
  );
}

// 비회원 및 비로그인 상태에서도 접근 가능한 공개 약관 페이지 레이아웃
function PublicInfoPage({ themeMode, setThemeMode }: {
  themeMode: 'dark' | 'light';
  setThemeMode: (m: 'dark' | 'light') => void;
}) {
  return (
    <div className="w-full flex flex-col min-h-screen">
      <Header
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        setViewMode={() => { }}
      />
      <main className="flex-1 px-6 py-8">
        <InfoPage
          themeMode={themeMode}
          onClose={() => window.location.href = '/'}
        />
      </main>
    </div>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  return (
    <div className={`w-full min-h-screen font-sans selection:bg-[#5E6AD2]/30 selection:text-white transition-colors duration-300 ${themeMode === 'dark' ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'
      }`}>
      <AuthProvider>
        <AlertConfirmProvider>
          <BrowserRouter>
            <Routes>
              {/* 랜딩 메인 */}
              <Route
                path="/"
                element={<LandingPage themeMode={themeMode} setThemeMode={setThemeMode} />}
              />

              {/* 로그인 */}
              <Route
                path="/login"
                element={<LoginPage themeMode={themeMode} />}
              />

              {/* 회원가입 */}
              <Route
                path="/signup"
                element={<SignupPage themeMode={themeMode} />}
              />

              {/* 공개용 서비스 정보 */}
              <Route
                path="/info"
                element={<PublicInfoPage themeMode={themeMode} setThemeMode={setThemeMode} />}
              />

              {/* 워크스페이스 (로그인 필요) */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <WorkspacePage themeMode={themeMode} />
                  </ProtectedRoute>
                }
              />

              {/* 알 수 없는 경로 → 메인으로 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AlertConfirmProvider>
      </AuthProvider>
    </div>
  );
}
