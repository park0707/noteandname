

interface FeaturesProps {
  themeMode: 'dark' | 'light';
}

export default function Features({ themeMode }: FeaturesProps) {
  // 현재 사용자의 지시에 의해 기능 설명 파트는 화면상에서 가려져(제거) 있는 상태지만,
  // 차후 컴포넌트 재활성화 및 마운트 요구에 신속하게 대응할 수 있도록 구조적으로 분리 보관합니다.
  return (
    <section className="w-full max-w-5xl px-10 md:px-20 py-20 flex flex-col gap-16">
      <div className={`text-center font-heading text-2xl font-bold ${
        themeMode === 'dark' ? 'text-white' : 'text-[#121316]'
      }`}>
        주요 핵심 어시스턴트 기능
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`p-6 rounded-xl border ${
          themeMode === 'dark' ? 'bg-[#121316] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <div className="text-xl mb-2">🖥️ Always-on-Top 위젯</div>
          <p className="text-sm opacity-70">집필 창 위에 상시 플로팅되어 작명 복사 및 마우스 클릭 관통 제공.</p>
        </div>

        <div className={`p-6 rounded-xl border ${
          themeMode === 'dark' ? 'bg-[#121316] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <div className="text-xl mb-2">⚖️ 자모 Levenshtein 작명</div>
          <p className="text-sm opacity-70">어감 중복 및 발음 붕괴를 한글 자모 유니코드 매칭으로 제어.</p>
        </div>

        <div className={`p-6 rounded-xl border ${
          themeMode === 'dark' ? 'bg-[#121316] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <div className="text-xl mb-2">⏳ 떡밥 타임라인 & Notion</div>
          <p className="text-sm opacity-70">미회수 복선을 100화 획득 경고로 막고, 노션 위키와 양방향 자동화.</p>
        </div>
      </div>
    </section>
  );
}
