import { BookOpen } from 'lucide-react';

interface CharacterHistoryProps {
  isDark: boolean;
}

export default function CharacterHistory({ isDark }: CharacterHistoryProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>캐릭터 히스토리</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          주요 인물들의 변화 로그, 캐릭터 아크 성장 및 성격 전이를 챕터 로그별로 추적합니다.
        </p>
      </div>
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
        <div className="flex items-center gap-2.5 mb-3">
          <BookOpen className="w-5 h-5 text-[#5E6AD2]" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>유진 (주인공) - 성장 변천사</h3>
        </div>
        <div className="flex flex-col gap-3 pl-3 border-l border-[#5E6AD2]">
          <div className="text-xs">
            <span className="font-bold text-[#5E6AD2]">제 1화</span>: 고대 대현자의 전승 영혼 각성
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#5E6AD2]">제 12화</span>: 동부 전선 흑마법 방어막 극복 성공
          </div>
        </div>
      </div>
    </div>
  );
}
