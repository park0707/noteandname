import { GitCommit } from 'lucide-react';

interface ForeshadowingTimelineProps {
  isDark: boolean;
}

export default function ForeshadowingTimeline({ isDark }: ForeshadowingTimelineProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>복선 타임라인</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          소설 속 심어둔 복선들을 챕터 단위로 정밀하게 추적 관리하여 미회수 복선을 사전 감지합니다.
        </p>
      </div>
      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
        <div className="flex items-center gap-2 mb-4">
          <GitCommit className="w-5 h-5 text-[#5E6AD2]" />
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>황금 열쇠의 비밀 복선</h3>
        </div>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          제 10화에 등장한 황금 열쇠 복선이 설정되었습니다. 목표 회수 시점: 제 50화 (남은 화수: 37화)
        </p>
      </div>
    </div>
  );
}
