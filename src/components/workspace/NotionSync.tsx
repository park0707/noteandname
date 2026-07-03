import { Link2, RefreshCw } from 'lucide-react';

interface NotionSyncProps {
  isDark: boolean;
}

export default function NotionSync({ isDark }: NotionSyncProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>노션 양방향 동기화</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          노벨플로우의 인물 및 세계관 데이터가 노션 페이지 데이터베이스와 실시간 동기화 상태를 유지합니다.
        </p>
      </div>
      <div className={`p-6 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
        <div className="flex items-center gap-3">
          <Link2 className="w-5 h-5 text-green-500" />
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>연동 상태: 양호</p>
            <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>마지막 동기화 완료: 5분 전</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> 수동 동기화
        </button>
      </div>
    </div>
  );
}
