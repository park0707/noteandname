import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

interface AuthPageProps {
  themeMode: 'dark' | 'light';
}

export default function SignupPage({ themeMode }: AuthPageProps) {
  const navigate = useNavigate();
  const isDark = themeMode === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'kakao' | null>(null);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message === 'User already registered'
        ? '이미 사용 중인 이메일입니다.'
        : '회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } else if (data.session) {
      navigate('/');
    } else {
      setSuccessMsg('가입이 완료되었습니다! 이메일을 확인하여 인증을 완료해 주세요.');
    }
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setSocialLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });
    setSocialLoading(null);
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
          <ArrowLeft className="w-4 h-4 shrink-0" />
          이전으로
        </Link>
      </div>

      {/* 폼 중앙 정렬 */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          <h1 className={`font-heading font-bold text-2xl mb-2 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
            새로운 창작 계정 만들기
          </h1>
          <p className={`text-sm mb-8 pb-2 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            가입 즉시 나만의 소설 데이터베이스를 가질 수 있습니다.
          </p>

          {successMsg ? (
            <div className="text-sm p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 leading-relaxed">
              {successMsg}
            </div>
          ) : (
            <>
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                {/* 이메일 */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-medium ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                    이메일 주소
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
                    placeholder="최소 6자 이상"
                    required
                    className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border
                      ${isDark
                        ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                        : 'bg-white border-black/[0.08] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                      }`}
                  />
                </div>

                {/* 비밀번호 확인 */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-medium ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="동일하게 한 번 더 입력"
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

                {/* 회원가입 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold
                    hover:bg-[#7480E2] active:scale-[0.98] transition-all duration-150
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : '회원가입'}
                </button>
              </form>
              {/* 구분선 */}
              <div className="flex items-center gap-3 my-6 py-2">
                <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
                <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>또는</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
              </div>

              {/* 소셜 가입 */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleSocialLogin('google')}
                  disabled={socialLoading !== null}
                  className={`w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3
                    border transition-all duration-150 hover:opacity-80 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isDark ? 'bg-[#121316] border-white/[0.08] text-[#EDEDEF]' : 'bg-white border-black/[0.08] text-[#121316]'}`}
                >
                  {socialLoading === 'google' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                  )}
                  구글로 시작하기
                </button>

                <button
                  onClick={() => handleSocialLogin('kakao')}
                  disabled={socialLoading !== null}
                  className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3
                    bg-[#FEE500] border border-[#FEE500]
                    transition-all duration-150 hover:bg-[#F6DC00] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#191919' }}
                >
                  {socialLoading === 'kakao' ? (
                    <div className="w-4 h-4 rounded-full border-2 border-[#191919]/40 border-t-[#191919] animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 512 512">
                      <path fill="#191919" d="M256 32C132.3 32 32 112.3 32 212c0 63.1 39.5 118.6 99.4 152.2-3.8 14.2-24.5 91.2-24.5 91.2s-.2 1.7.9 2.3c1.1.7 2.4.2 2.4.2 31.5-4.4 91.9-60.3 91.9-60.3C219.4 401.8 237.4 404 256 404c123.7 0 224-80.3 224-180S379.7 32 256 32z" />
                    </svg>
                  )}
                  카카오로 시작하기
                </button>
              </div>
            </>
          )}

          <p className={`text-center text-xs mt-8 pt-2 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-[#5E6AD2] font-semibold hover:text-[#7480E2] transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </div>

      <Footer themeMode={themeMode} />
    </div>
  );
}
