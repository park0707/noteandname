import { useState } from 'react';
import { decomposeHangeul, calculateSimilarity } from './utils';
import type { Node } from './types';

interface JamoFilterProps {
  isDark: boolean;
  relationNodes: Node[];
}

export default function JamoFilter({ isDark, relationNodes }: JamoFilterProps) {
  const [jamoTestName, setJamoTestName] = useState('');

  // Fallback to mock characters if relationNodes is empty
  const characters = relationNodes.length > 0
    ? relationNodes.map(n => ({ name: n.name.split(' ')[0], role: '등록 인물' }))
    : [
        { name: '카일', role: '주연' },
        { name: '유진', role: '주인공' },
        { name: '라비', role: '조연' },
        { name: '제논', role: '주연' },
      ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>자모 유사도 필터</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          한글의 초성·중성·종성 유니코드 오프셋을 역산 분해하여, 칼릭스-카엘 등 발음 어감이 유사한 인물을 필터링합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border flex flex-col gap-4 h-fit ${
          isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>실시간 이름 자모 검사</h3>
          <input
            type="text"
            value={jamoTestName}
            onChange={e => setJamoTestName(e.target.value.trim())}
            placeholder="검사할 이름을 입력하세요 (예: 카엘)"
            className={`px-3 py-2.5 rounded-lg text-sm border outline-none ${
              isDark
                ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]'
                : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316] focus:border-[#5E6AD2]'
            }`}
          />
          {jamoTestName && (
            <div className="flex flex-col gap-2">
              <span className={`text-[10px] font-bold ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>자모 쪼개기 결과</span>
              <div className={`p-3 rounded-lg font-mono text-xs flex justify-between ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                <span className="text-[#5E6AD2] font-bold">{jamoTestName}</span>
                <span className={isDark ? 'text-white' : 'text-[#121316]'}>{decomposeHangeul(jamoTestName)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col gap-2.5">
          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>주요 인물 어감 유사도 비교 (임계치 75%)</h3>
          {characters.map((char, idx) => {
            const sim = jamoTestName ? calculateSimilarity(jamoTestName, char.name) : 0;
            const isWarning = sim >= 75;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 ${
                  jamoTestName && isWarning
                    ? 'border-red-500/30 bg-red-500/[0.02]'
                    : isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{char.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{char.role}</span>
                  </div>
                  {jamoTestName && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                      자모 분해 비교: <span className="font-mono text-[#5E6AD2]">{decomposeHangeul(jamoTestName)}</span> vs <span className="font-mono text-gray-500">{decomposeHangeul(char.name)}</span>
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {jamoTestName ? (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm font-bold ${isWarning ? 'text-red-400' : 'text-green-400'}`}>{sim}% 유사</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isWarning ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>{isWarning ? '발음 중복 경고' : '안전'}</span>
                    </div>
                  ) : (
                    <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>대기 중</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
