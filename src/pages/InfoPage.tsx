import { useSearchParams } from 'react-router-dom';
import { FileText, ShieldCheck, Cpu, Copyright, X } from 'lucide-react';

interface InfoPageProps {
  themeMode: 'dark' | 'light';
  onClose: () => void;
}

type TabId = 'terms' | 'privacy' | 'ai' | 'copyright';

const EFFECTIVE_DATE = '2025년 7월 1일';
const SERVICE_NAME = 'Novelflow';
const COMPANY = 'Novelflow 운영팀';
const EMAIL = 'support@novelflow.io';

export default function InfoPage({ themeMode, onClose }: InfoPageProps) {
  const isDark = themeMode === 'dark';
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId;
  const activeTab: TabId = (tabParam && ['terms', 'privacy', 'ai', 'copyright'].includes(tabParam))
    ? tabParam
    : 'terms';

  const setActiveTab = (tab: TabId) => {
    setSearchParams({ tab });
  };

  const MENU_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'terms', label: '이용약관', icon: FileText },
    { id: 'privacy', label: '개인정보처리방침', icon: ShieldCheck },
    { id: 'ai', label: 'AI 서비스 안내', icon: Cpu },
    { id: 'copyright', label: '저작권 정책', icon: Copyright },
  ];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* 상단 탭 헤더 영역 */}
      <div className={`px-8 py-4 border-b flex items-center justify-between shrink-0 ${
        isDark ? 'border-white/[0.06] bg-[#0D0E11]' : 'bg-white border-black/[0.06]'
      }`}>
        {/* 항목 가로 배치 (상단 헤더) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap
                  ${isActive
                    ? isDark
                      ? 'bg-[#5E6AD2]/15 text-[#7480E2]'
                      : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                    : isDark
                      ? 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#EDEDEF]'
                      : 'text-[#55555A] hover:bg-black/[0.04] hover:text-[#121316]'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          title="닫기"
          className={`p-2 rounded-xl transition-all shrink-0 ml-4 ${
            isDark
              ? 'text-[#3A3D50] hover:bg-white/[0.06] hover:text-[#A1A1AA]'
              : 'text-[#C5C5CC] hover:bg-black/[0.05] hover:text-[#55555A]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 하단 상세 내용 영역 (스크롤) */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className={`max-w-4xl mx-auto p-6 md:p-8 rounded-2xl border ${
          isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'
        }`}>
          {activeTab === 'terms' && <TermsContent isDark={isDark} />}
          {activeTab === 'privacy' && <PrivacyContent isDark={isDark} />}
          {activeTab === 'ai' && <AiContent isDark={isDark} />}
          {activeTab === 'copyright' && <CopyrightContent isDark={isDark} />}

          {/* 메타 하단 푸터 고지 */}
          <div className={`mt-10 pt-6 border-t text-xs leading-5 flex flex-col sm:flex-row sm:justify-between sm:items-center ${
            isDark ? 'border-white/[0.06] text-[#3A3D50]' : 'border-black/[0.06] text-[#C5C5CC]'
          }`}>
            <p>시행일자: {EFFECTIVE_DATE} | {COMPANY}</p>
            <p className="mt-1 sm:mt-0">문의 및 접수처: <a href={`mailto:${EMAIL}`} className="text-[#5E6AD2] hover:underline">{EMAIL}</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 공통 섹션 컴포넌트 ─── */
function Section({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <section className="mb-8">
      <h3 className={`font-heading font-bold text-base mb-4 pb-2 border-b ${
        isDark ? 'text-white border-white/[0.06]' : 'text-[#121316] border-black/[0.06]'
      }`}>{title}</h3>
      <div className={`text-sm leading-7 space-y-3 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
        {children}
      </div>
    </section>
  );
}

function P({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="ml-4 list-disc">{children}</li>;
}

/* ─── 이용약관 ─── */
function TermsContent({ isDark }: { isDark: boolean }) {
  return (
    <div>
      <Section title="제1조 (목적)" isDark={isDark}>
        <P>본 약관은 {SERVICE_NAME}(이하 "서비스")이 제공하는 소설 창작 보조 서비스의 이용 조건 및 절차, 회원과 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</P>
      </Section>

      <Section title="제2조 (약관의 효력 및 변경)" isDark={isDark}>
        <P>① 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</P>
        <P>② 서비스는 「약관의 규제에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</P>
        <P>③ 약관이 변경되는 경우 서비스는 변경 내용을 최소 7일 이전에 공지하며, 회원에게 불리한 변경의 경우 30일 이전에 공지합니다.</P>
      </Section>

      <Section title="제3조 (서비스의 제공)" isDark={isDark}>
        <P>서비스는 다음의 기능을 제공합니다:</P>
        <ul>
          <Li>AI 기반 소설 작명 엔진</Li>
          <Li>한글 자모 유사도 필터</Li>
          <Li>인물 관계도 시각화 캔버스</Li>
          <Li>복선 타임라인 관리</Li>
          <Li>캐릭터 히스토리 추적</Li>
          <Li>노션(Notion) 양방향 동기화</Li>
          <Li>기타 창작 보조 도구</Li>
        </ul>
        <P>서비스는 운영상·기술상 필요에 따라 제공하는 서비스를 변경할 수 있으며, 변경 시 사전 공지합니다.</P>
      </Section>

      <Section title="제4조 (회원 가입 및 계정)" isDark={isDark}>
        <P>① 이용자는 서비스가 정한 가입 양식에 따라 회원 정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.</P>
        <P>② 회원은 가입 시 입력한 정보가 변경되었을 경우 즉시 수정해야 하며, 이를 이행하지 않아 발생한 불이익에 대해 서비스는 책임지지 않습니다.</P>
        <P>③ 회원 계정과 비밀번호에 관한 관리 책임은 회원 본인에게 있습니다.</P>
      </Section>

      <Section title="제5조 (회원의 의무)" isDark={isDark}>
        <P>회원은 다음 행위를 하여서는 안 됩니다:</P>
        <ul>
          <Li>타인의 정보 도용 및 허위 정보 기재</Li>
          <Li>서비스를 통한 타인의 저작권, 명예권 등 권리 침해</Li>
          <Li>서비스의 정상적인 운영을 방해하는 행위</Li>
          <Li>불법 콘텐츠(아동·청소년 성착취물 등) 생성 또는 유포</Li>
          <Li>AI 기능을 이용한 타인 사칭, 허위 정보 생성 및 유포</Li>
          <Li>관련 법령 또는 공서양속에 반하는 행위</Li>
        </ul>
      </Section>

      <Section title="제6조 (서비스 이용 제한)" isDark={isDark}>
        <P>서비스는 회원이 제5조의 의무를 위반하는 경우 사전 통지 없이 서비스 이용을 제한하거나 계정을 해지할 수 있습니다. 이 경우 서비스는 회원에게 이메일로 통지합니다.</P>
      </Section>

      <Section title="제7조 (서비스의 중단)" isDark={isDark}>
        <P>서비스는 천재지변, 시스템 점검, 설비 교체 등 부득이한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있습니다. 정기 점검의 경우 사전에 공지합니다.</P>
      </Section>

      <Section title="제8조 (책임의 한계)" isDark={isDark}>
        <P>① 서비스는 AI가 생성한 결과물(작명, 문장 제안 등)의 정확성·완전성·적법성을 보증하지 않습니다.</P>
        <P>② 회원이 서비스를 이용하여 제작한 창작물로 인한 법적 분쟁에 대해 서비스는 책임지지 않습니다.</P>
        <P>③ 서비스는 회원 간 또는 회원과 제3자 간의 분쟁에 대해 개입하지 않으며, 이로 인한 손해를 배상하지 않습니다.</P>
      </Section>

      <Section title="제9조 (준거법 및 분쟁 해결)" isDark={isDark}>
        <P>본 약관은 대한민국 법률에 따라 규율되며, 서비스 이용으로 발생한 분쟁에 대해서는 대한민국 법원을 관할 법원으로 합니다.</P>
      </Section>
    </div>
  );
}

/* ─── 개인정보처리방침 ─── */
function PrivacyContent({ isDark }: { isDark: boolean }) {
  return (
    <div>
      <Section title="1. 수집하는 개인정보 항목" isDark={isDark}>
        <P>서비스는 회원가입 및 서비스 제공을 위해 다음의 개인정보를 수집합니다:</P>
        <ul>
          <Li><b>이메일 회원가입:</b> 이메일 주소, 비밀번호(암호화 저장)</Li>
          <Li><b>구글 로그인:</b> 이메일 주소, 이름, 프로필 사진 (구글 OAuth 제공 항목)</Li>
          <Li><b>카카오 로그인:</b> 이메일 주소 (카카오 OAuth 제공 항목)</Li>
          <Li><b>서비스 이용 중 자동 수집:</b> 접속 IP, 접속 일시, 브라우저 정보, 서비스 이용 기록</Li>
          <Li><b>창작 데이터:</b> 회원이 입력한 프로젝트명, 캐릭터 정보, 줄거리 등 창작물 데이터</Li>
        </ul>
      </Section>

      <Section title="2. 개인정보의 처리 목적" isDark={isDark}>
        <ul>
          <Li>회원 가입 및 본인 확인</Li>
          <Li>서비스 제공 (AI 작명, 관계도, 타임라인 등)</Li>
          <Li>창작 데이터 저장 및 동기화</Li>
          <Li>서비스 개선 및 신규 기능 개발</Li>
          <Li>고객 문의 및 불만 처리</Li>
          <Li>법령에 따른 의무 이행</Li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간" isDark={isDark}>
        <P>회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 다음 기간 동안 보존합니다:</P>
        <ul>
          <Li>계약 또는 청약 철회 기록: 5년 (전자상거래법)</Li>
          <Li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</Li>
          <Li>로그인 기록: 3개월 (통신비밀보호법)</Li>
        </ul>
      </Section>

      <Section title="4. 개인정보의 제3자 제공" isDark={isDark}>
        <P>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 다음의 경우는 예외입니다:</P>
        <ul>
          <Li>이용자가 사전에 동의한 경우</Li>
          <Li>수사기관이 법령에 따라 요청하는 경우</Li>
        </ul>
      </Section>

      <Section title="5. 개인정보의 국외 이전" isDark={isDark}>
        <P>서비스는 Supabase Inc.(미국)가 제공하는 클라우드 서버를 이용합니다. 이에 따라 회원의 개인정보는 미국 서버에 저장·처리될 수 있습니다.</P>
        <ul>
          <Li><b>이전되는 국가:</b> 미국</Li>
          <Li><b>이전 업체:</b> Supabase Inc.</Li>
          <Li><b>이전 목적:</b> 서비스 데이터 저장 및 인증 처리</Li>
          <Li><b>보호 조치:</b> GDPR 표준 계약 조항(SCC) 적용</Li>
        </ul>
      </Section>

      <Section title="6. 개인정보의 파기" isDark={isDark}>
        <P>서비스는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 해당 정보를 파기합니다. 전자적 파일 형태는 복구 불가능한 방법으로 영구 삭제하며, 종이 문서는 분쇄기로 파기합니다.</P>
      </Section>

      <Section title="7. 이용자의 권리" isDark={isDark}>
        <P>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</P>
        <ul>
          <Li>개인정보 열람 요청</Li>
          <Li>개인정보 정정·삭제 요청</Li>
          <Li>개인정보 처리 정지 요청</Li>
          <Li>계정 탈퇴 (워크스페이스 → 설정에서 처리)</Li>
        </ul>
        <P>권리 행사는 <b>{EMAIL}</b>로 이메일 요청 또는 서비스 내 설정을 통해 가능합니다.</P>
      </Section>

      <Section title="8. 개인정보 보호책임자" isDark={isDark}>
        <ul>
          <Li><b>담당:</b> {COMPANY}</Li>
          <Li><b>연락처:</b> {EMAIL}</Li>
        </ul>
        <P>개인정보 침해 신고는 개인정보보호위원회(privacy.go.kr, 국번 없이 182)에 하실 수 있습니다.</P>
      </Section>
    </div>
  );
}

/* ─── AI 서비스 안내 ─── */
function AiContent({ isDark }: { isDark: boolean }) {
  return (
    <div>
      <Section title="AI 서비스 개요" isDark={isDark}>
        <P>{SERVICE_NAME}은 소설 창작을 보조하기 위해 대형 언어 모델(LLM) 기반의 AI 기능을 제공합니다. AI는 창작의 영감을 돕는 도구이며, 최종 창작 결정은 항상 작가 본인에게 있습니다.</P>
      </Section>

      <Section title="AI 생성 결과물의 저작권" isDark={isDark}>
        <P>① AI가 단독으로 생성한 결과물(자동 작명, 문장 제안 등)은 현행 저작권법상 저작물로 인정되지 않을 수 있습니다.</P>
        <P>② 회원이 AI 제안을 바탕으로 실질적인 창작적 기여를 통해 완성한 창작물의 저작권은 해당 회원에게 귀속됩니다.</P>
        <P>③ AI 생성 내용을 그대로 사용할 경우 저작권 관련 분쟁이 발생할 수 있으며, 이에 대한 책임은 회원 본인에게 있습니다.</P>
      </Section>

      <Section title="창작 데이터의 AI 학습 이용" isDark={isDark}>
        <P>⚠️ <b>중요:</b> 서비스는 회원이 입력한 창작 데이터(프로젝트 내용, 캐릭터 설정, 줄거리 등)를 AI 모델 학습에 사용하지 않습니다.</P>
        <P>AI 기능 제공 시 입력 데이터는 API 호출 처리 목적으로만 사용되며, 외부 AI 제공업체에 전송될 수 있습니다. 해당 제공업체의 데이터 처리 정책을 확인하시기 바랍니다.</P>
      </Section>

      <Section title="AI 생성 결과물의 정확성" isDark={isDark}>
        <P>① AI가 제안하는 이름, 내용 등은 사실과 다르거나 불완전할 수 있습니다.</P>
        <P>② 실존 인물·지명과 유사한 결과가 생성될 수 있으므로 반드시 검토 후 사용하시기 바랍니다.</P>
        <P>③ AI 생성 결과를 무단으로 타인에게 귀속시키거나, 허위 정보 유포에 이용하는 것을 금지합니다.</P>
      </Section>

      <Section title="AI 서비스 이용 제한" isDark={isDark}>
        <P>다음 목적의 AI 기능 이용을 금지합니다:</P>
        <ul>
          <Li>타인을 사칭하거나 허위 정보를 생성하는 행위</Li>
          <Li>아동·청소년을 대상으로 한 유해 콘텐츠 생성</Li>
          <Li>특정인에 대한 명예훼손·혐오 표현 생성</Li>
          <Li>타인의 저작물을 무단 복제하여 학습시키거나 변형하는 행위</Li>
        </ul>
      </Section>
    </div>
  );
}

/* ─── 저작권 정책 ─── */
function CopyrightContent({ isDark }: { isDark: boolean }) {
  return (
    <div>
      <Section title="회원 창작물의 저작권" isDark={isDark}>
        <P>회원이 {SERVICE_NAME}을 통해 직접 창작한 소설, 캐릭터 설정, 세계관 등 모든 창작물의 저작권은 해당 회원에게 귀속됩니다.</P>
        <P>서비스는 회원 창작물에 대해 어떠한 저작권도 주장하지 않습니다.</P>
      </Section>

      <Section title="서비스 이용 허락 범위" isDark={isDark}>
        <P>회원은 서비스 제공에 필요한 범위 내에서 다음 권한을 서비스에 허락합니다:</P>
        <ul>
          <Li>창작 데이터를 서버에 저장·백업하는 행위</Li>
          <Li>노션 동기화 등 연동 기능 수행을 위한 처리</Li>
          <Li>서비스 내 미리보기 표시</Li>
        </ul>
        <P>이 허락은 비독점적이며, 회원이 서비스를 탈퇴하거나 데이터를 삭제하면 즉시 종료됩니다.</P>
      </Section>

      <Section title="서비스 콘텐츠의 저작권" isDark={isDark}>
        <P>서비스 자체의 디자인, UI/UX, 로고, 소프트웨어 코드, 문서 등 모든 콘텐츠의 저작권은 {COMPANY}에 귀속됩니다.</P>
        <P>회원은 서비스 콘텐츠를 무단으로 복제·배포·수정·상업적으로 이용할 수 없습니다.</P>
      </Section>

      <Section title="제3자 저작권 침해 신고" isDark={isDark}>
        <P>타인의 저작물이 서비스 내에서 무단으로 이용되고 있다고 판단되는 경우, 아래 이메일로 신고해 주시기 바랍니다. 신고 접수 후 검토하여 적절한 조치를 취합니다.</P>
        <P>📧 저작권 침해 신고: <b>{EMAIL}</b></P>
        <P>신고 시 포함 사항: 침해 저작물 정보, 원본 저작물 정보, 권리자 정보, 침해 URL</P>
      </Section>

      <Section title="오픈소스 소프트웨어" isDark={isDark}>
        <P>본 서비스는 다음 오픈소스 소프트웨어를 사용합니다:</P>
        <ul>
          <Li>React (MIT License)</Li>
          <Li>Supabase (Apache 2.0 License)</Li>
          <Li>Tailwind CSS (MIT License)</Li>
          <Li>Vite (MIT License)</Li>
        </ul>
        <P>각 오픈소스의 라이선스는 해당 프로젝트의 공식 페이지에서 확인할 수 있습니다.</P>
      </Section>

      <Section title="제공 폰트 라이선스 안내" isDark={isDark}>
        <P>노벨플로우의 집필실에서 제공하는 기본 폰트들은 상업적 목적으로도 무료 이용이 가능한 라이선스를 따르고 있습니다. 사용 범위와 출처는 다음과 같습니다:</P>
        <div className="overflow-x-auto mt-4">
          <table className={`w-full text-xs border-collapse ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr className={`border-b text-left ${isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.02]'}`}>
                <th className="px-3 py-2 font-bold">폰트명</th>
                <th className="px-3 py-2 font-bold">제작 및 배포처</th>
                <th className="px-3 py-2 font-bold">라이선스 형태</th>
                <th className="px-3 py-2 font-bold">비고</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                <td className="px-3 py-2 font-semibold">리디바탕</td>
                <td className="px-3 py-2">리디주식회사</td>
                <td className="px-3 py-2">자체 라이선스</td>
                <td className="px-3 py-2">상업적 무료 이용, 폰트 파일 자체 판매 금지, 출처 표기 권장</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                <td className="px-3 py-2 font-semibold">마루 부리</td>
                <td className="px-3 py-2">네이버/네이버문화재단</td>
                <td className="px-3 py-2">자체 라이선스</td>
                <td className="px-3 py-2">상업적 무료 이용, 출처 표기 권장</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                <td className="px-3 py-2 font-semibold">배민 주아체/도현체 등</td>
                <td className="px-3 py-2">우아한형제들</td>
                <td className="px-3 py-2">자체 라이선스</td>
                <td className="px-3 py-2">상업적 무료 이용, 수정 및 재배포 허용, 폰트 파일 자체 판매 금지</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                <td className="px-3 py-2 font-semibold">KoPub 바탕/돋움</td>
                <td className="px-3 py-2">한국전자출판협회</td>
                <td className="px-3 py-2">무료 배포 라이선스</td>
                <td className="px-3 py-2">상업적 무료 이용, 배포처 라이선스 준수 권장</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                <td className="px-3 py-2 font-semibold">스포카 한 산스</td>
                <td className="px-3 py-2">스포카</td>
                <td className="px-3 py-2">자체 라이선스</td>
                <td className="px-3 py-2">상업적 무료 이용 가능</td>
              </tr>
              <tr className={`border-b ${isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'}`}>
                <td className="px-3 py-2 font-semibold">나눔고딕/나눔명조/본고딕 등 14종</td>
                <td className="px-3 py-2">Google Fonts 한글 컬렉션</td>
                <td className="px-3 py-2">SIL Open Font License (OFL)</td>
                <td className="px-3 py-2">상업적 및 비상업적 목적 모두 자유 이용 가능</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
