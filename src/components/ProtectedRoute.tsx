import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-[#08090A]">
        <div className="w-8 h-8 rounded-full border-2 border-[#5E6AD2] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
