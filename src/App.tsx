import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AppPage from './pages/AppPage';

// 랜딩 페이지 레이아웃 (Header + Hero + Features)
function LandingPage({ themeMode, setThemeMode }: {
  themeMode: 'dark' | 'light';
  setThemeMode: (m: 'dark' | 'light') => void;
}) {
  return (
    <div className="w-full flex flex-col items-center">
      <Header
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        setViewMode={() => {}}
      />
      <Hero themeMode={themeMode} />
      <Features themeMode={themeMode} />
    </div>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  return (
    <div className={`w-full min-h-screen font-sans selection:bg-[#5E6AD2]/30 selection:text-white transition-colors duration-300 ${
      themeMode === 'dark' ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'
    }`}>
      <AuthProvider>
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

            {/* 워크스페이스 (로그인 필요) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppPage themeMode={themeMode} />
                </ProtectedRoute>
              }
            />

            {/* 알 수 없는 경로 → 메인으로 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
