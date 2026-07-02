import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // 초기 세션 확인 중에는 판단 보류 (로딩 스피너)
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#08090A]">
        <div className="w-8 h-8 rounded-full border-2 border-[#5E6AD2] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 로딩 완료 후 세션 없으면 로그인 페이지로
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 세션 있으면 워크스페이스 렌더
  return <>{children}</>;
}
