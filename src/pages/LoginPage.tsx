import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthPageProps {
  themeMode: 'dark' | 'light';
}

export default function LoginPage({ themeMode }: AuthPageProps) {
  const navigate = useNavigate();
  const isDark = themeMode === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className={`w-full min-h-screen flex flex-col ${isDark ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'}`}>

      {/* 좌측 상단 이전으로 버튼 */}
      <div className="px-8 pt-8">
        <Link
          to="/"
          className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${isDark ? 'text-[#A1A1AA] hover:text-[#EDEDEF]' : 'text-[#55555A] hover:text-[#121316]'
            }`}
        >
          <span className="text-base">←</span>
          이전으로
        </Link>
      </div>

      {/* 폼 중앙 정렬 */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <h1 className={`font-heading font-bold text-2xl mb-2 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
            다시 오신 것을 환영합니다
          </h1>
          <p className={`text-sm mb-8 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            계정에 로그인하고 집필을 이어가세요.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* 이메일 */}
            <div className="pt-2 flex flex-col gap-1.5">
              <label className={`text-xs font-medium ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="writer@example.com"
                required
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border
                  ${isDark
                    ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                    : 'bg-white border-black/[0.08] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                  }`}
              />
            </div>

            {/* 비밀번호 */}
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-medium ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border
                  ${isDark
                    ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                    : 'bg-white border-black/[0.08] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                  }`}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold
                hover:bg-[#7480E2] active:scale-[0.98] transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : '로그인'}
            </button>
          </form>

          {/* 구분선 */}
          <div className=" py-2 flex items-center gap-3 my-6">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
            <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>또는</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
          </div>

          {/* 소셜 로그인 플레이스홀더 */}
          <div className="flex flex-col gap-3">
            <button
              disabled
              className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3
                border transition-all duration-150 opacity-40 cursor-not-allowed
                ${isDark ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF]' : 'bg-white border-black/[0.08] text-[#121316]'}`}
            >
              <span className="text-base">🔵</span>
              구글로 계속하기 <span className="text-xs opacity-60">(준비 중)</span>
            </button>
            <button
              disabled
              className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3
                border transition-all duration-150 opacity-40 cursor-not-allowed
                ${isDark ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF]' : 'bg-white border-black/[0.08] text-[#121316]'}`}
            >
              <span className="text-base">🟡</span>
              카카오로 계속하기 <span className="text-xs opacity-60">(준비 중)</span>
            </button>
          </div>

          <p className={`pt-2 text-center text-xs mt-8 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="text-[#5E6AD2] font-semibold hover:text-[#7480E2] transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
