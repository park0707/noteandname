import { Link } from 'react-router-dom';

interface FooterProps {
  themeMode: 'dark' | 'light';
}

export default function Footer({ themeMode }: FooterProps) {
  const isDark = themeMode === 'dark';

  return (
    <footer className={`w-full py-10 px-6 md:px-12 border-t mt-auto shrink-0 ${isDark
      ? 'bg-[#090A0C] border-white/[0.06] text-[#A1A1AA]'
      : 'bg-[#F4F4F6] border-black/[0.06] text-[#55555A]'
      }`}>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        {/* 서비스 및 프로젝트 소개 */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Novelflow" className="w-5 h-5 rounded" />
            <span className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>
              Novelflow
            </span>
          </div>
          <div className="text-[11px] leading-5 space-y-1 opacity-75">
            <p className="mt-1 text-[10px] opacity-60 leading-normal max-w-xl">
              노벨플로우는 웹소설 작가를 위한 창작 어시스턴트 플랫폼이며, AI 서비스가 생성하는 작명 및 설정 데이터는 창작 보조용 정보입니다. AI 생성 결과물의 지식재산권 검토 및 사용으로 인해 발생하는 모든 법적 책임은 개별 사용자에게 있습니다.
            </p>
            <p className="mt-3 text-[10px] opacity-50">
              © {new Date().getFullYear()} Novelflow. All rights reserved.
            </p>
          </div>
        </div>

        {/* 정책 및 고객지원 링크 */}
        <div className="flex flex-wrap gap-x-8 gap-y-4 shrink-0 text-xs font-semibold">
          <div className="flex flex-col gap-2">
            <Link to="/info?tab=terms" className="hover:text-[#5E6AD2] transition-colors">이용약관</Link>
            <Link to="/info?tab=privacy" className="hover:text-[#5E6AD2] transition-colors font-bold text-red-400">개인정보처리방침</Link>
            <Link to="/info?tab=ai" className="hover:text-[#5E6AD2] transition-colors">AI 서비스 안내</Link>
            <Link to="/info?tab=copyright" className="hover:text-[#5E6AD2] transition-colors">저작권 정책</Link>
          </div>

          <div className="flex flex-col gap-2">
            <a href="mailto:support@novelflow.io" className="hover:text-[#5E6AD2] transition-colors">고객 문의</a>
            <Link to="/info?tab=faq" className="hover:text-[#5E6AD2] transition-colors">자주 묻는 질문</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
