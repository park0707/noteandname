

interface HeroProps {
  themeMode: 'dark' | 'light';
}

export default function Hero({ themeMode }: HeroProps) {
  return (
    <section className="w-full max-w-5xl px-6 pt-30 pb-32 text-center relative overflow-hidden flex flex-col items-center">
      {/* 다크모드 전용 발광 백그라운드 효과 */}
      {themeMode === 'dark' && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#5E6AD2]/10 blur-[100px] rounded-full -z-10"></div>
      )}

      <h1 className={`font-heading font-bold text-4xl md:text-5xl tracking-tight leading-[1.2] transition-colors duration-300 ${themeMode === 'dark' ? 'text-white' : 'text-[#121316]'
        }`}>
        작가의 불편함을 하나라도 줄이기 위한<br />소설 창작 지원
      </h1>

      {/* 메인 타이틀과 아래 세부설명 간의 수직 거리 추가 */}
      <p className={`text-base md:text-lg max-w-2xl leading-relaxed mt-12 transition-colors duration-300 pt-5 ${themeMode === 'dark' ? 'text-[#A1A1AA]' : 'text-[#55555A]'
        }`}>
        하루 최소 5,000자 연재 마감의 숨 가쁜 일정 속에서도 화면을 벗어나지 않고<br />
        인물 관계도, 복선 타임라인, 노션 동기화, 그리고 데스크톱 위젯을 함께 누리세요.
      </p>
    </section>
  );
}
