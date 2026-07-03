import { useState } from 'react';
import { ChevronRight, Layers, User, Eye, EyeOff } from 'lucide-react';

interface WorldMapProps {
  isDark: boolean;
}

export default function WorldMap({ isDark }: WorldMapProps) {
  const [worldMapSnapshotIdx, setWorldMapSnapshotIdx] = useState(0);

  const snapshots = [
    { name: '1권 시작 기준', date: '작중 932년 4월', desc: '평화로운 아이론 왕국 영토와 가문 세력권.' },
    { name: '동부 요새 함락 사건', date: '작중 932년 10월', desc: '제국의 흑마법 기습 침공으로 동부 요새가 소실됨.' },
    { name: '제국 연합군 병합 완료', date: '작중 933년 6월', desc: '아이론 북부 영토가 제국으로 색상 이전되고 가시성 변경.' },
  ];

  const elements = [
    { id: 'r1', name: '아이론 왕국', type: 'polygon', color: worldMapSnapshotIdx === 2 ? '#E2487A' : '#5E6AD2', opacity: 0.25, coords: 'M 60 80 L 220 80 L 240 200 L 80 180 Z' },
    { id: 'r2', name: '제국 영토', type: 'polygon', color: '#E2487A', opacity: 0.35, coords: 'M 240 80 L 400 80 L 400 200 L 240 200 Z', visible: worldMapSnapshotIdx > 0 },
    { id: 'p1', name: '수도 아이론시', type: 'pin', x: 150, y: 130, active: true },
    { id: 'p2', name: '동부 국경 요새', type: 'pin', x: 230, y: 140, active: worldMapSnapshotIdx === 0 },
  ];

  const currentSnapshot = snapshots[worldMapSnapshotIdx];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-[#5E6AD2] font-semibold mb-1">
            <span>세계 지도</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            <span className={isDark ? 'text-white' : 'text-[#121316]'}>아이론 왕국</span>
          </div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>세계관 지도 편집기</h2>
        </div>
        <div className="p-1 rounded-xl bg-black/20 border border-white/[0.08] flex items-center gap-1">
          <button className="p-2 rounded-lg bg-[#5E6AD2] text-white text-xs font-bold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> 영역 그리기
          </button>
          <button className="p-2 rounded-lg text-[#A1A1AA] hover:bg-white/[0.04] text-xs font-bold flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> 핀 배치
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`p-5 rounded-2xl border flex flex-col gap-4 h-[350px] overflow-y-auto ${
          isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>지도 레이어 및 요소</h3>
          <div className="flex flex-col gap-2">
            {elements.map(el => (
              <div key={el.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className={`font-medium ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>{el.name}</span>
                <div className="flex items-center gap-1.5">
                  {el.type === 'pin' && !el.active ? <EyeOff className="w-3.5 h-3.5 text-gray-600" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className={`relative h-[280px] rounded-2xl border overflow-hidden flex items-center justify-center ${
            isDark ? 'bg-[#090A0C] border-white/[0.06]' : 'bg-[#FAF8FA] border-black/[0.06]'
          }`}>
            <svg className="absolute inset-0 w-full h-full">
              {elements.filter(el => el.type === 'polygon' && el.visible !== false).map(el => (
                <path key={el.id} d={el.coords} fill={el.color} fillOpacity={el.opacity} stroke={el.color} strokeWidth="2.5" className="transition-all duration-300" />
              ))}
            </svg>

            {elements.filter(el => el.type === 'pin' && el.active).map(el => (
              <div key={el.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ left: `${el.x}px`, top: `${el.y}px` }}>
                <div className="w-3 h-3 rounded-full bg-[#F39C12] border border-white shrink-0" />
                <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/80 text-white">{el.name}</span>
              </div>
            ))}

            <div className="absolute top-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] flex flex-col gap-1 w-48 shadow-2xl">
              <span className="text-[#5E6AD2] font-bold">🗺️ 시점 연동 사건 분석</span>
              <p className="text-white font-semibold">{currentSnapshot.name}</p>
              <p className="text-[#A1A1AA] leading-normal">{currentSnapshot.desc}</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={`font-semibold ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>타임라인 연동 슬라이더</span>
              <span className="text-[#5E6AD2] font-bold">{currentSnapshot.date}</span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={worldMapSnapshotIdx}
                onChange={e => setWorldMapSnapshotIdx(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#5E6AD2]/20 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
              />
              <div className="flex justify-between text-[9px] font-bold mt-2 text-gray-500">
                <span>1권 시작</span>
                <span>요새 함락</span>
                <span>연합군 병합</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
