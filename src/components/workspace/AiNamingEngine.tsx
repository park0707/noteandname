import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { calculateSimilarity } from './utils';
import type { Node } from './types';

interface AiNamingEngineProps {
  isDark: boolean;
  relationNodes: Node[];
}

export default function AiNamingEngine({ isDark, relationNodes }: AiNamingEngineProps) {
  const [namingConcept, setNamingConcept] = useState('fantasy');
  const [namingGender, setNamingGender] = useState('all');
  const [namingKeywords, setNamingKeywords] = useState('');
  const [namingLoading, setNamingLoading] = useState(false);
  const [namingResults, setNamingResults] = useState<{ name: string; meaning: string; similarity: number; matchChar?: string }[]>([]);

  const handleGenerate = () => {
    setNamingLoading(true);
    setTimeout(() => {
      const pool: Record<string, { name: string; meaning: string }[]> = {
        fantasy: [
          { name: '알리스타', meaning: '별빛을 수호하는 숭고한 방패' },
          { name: '카엘', meaning: '태양의 열기를 인도하는 광휘' },
          { name: '실비아', meaning: '푸른 은빛 숲속의 요정' },
          { name: '레온', meaning: '타오르는 불꽃의 의지를 계승한 용사' },
        ],
        wuxia: [
          { name: '백운', meaning: '기구한 운명 속에서 맑게 흐르는 흰 구름' },
          { name: '청풍', meaning: '세속의 번뇌를 씻어내는 정갈하고 푸른 바람' },
          { name: '검아', meaning: '가장 날카롭게 다듬어진 전설의 검신' },
        ],
        modern: [
          { name: '민준', meaning: '지혜롭고 빼어난 용모를 지닌 소년' },
          { name: '서연', meaning: '가장 아름답고 부드럽게 빛나는 서사' },
        ],
        sf: [
          { name: '제논', meaning: '미지의 차원을 탐구하는 양자 엔지니어' },
          { name: '아이라', meaning: '인공지능 비서에서 자아를 획득한 특이점' },
        ],
      };

      const list = pool[namingConcept] || [];
      // Extract clean names from existing relationNodes
      const charNames = relationNodes.map(n => n.name.split(' ')[0]);
      if (charNames.length === 0) {
        charNames.push('유진', '라비', '벨리알'); // Default fallback
      }

      const result = list.map(item => {
        let maxSim = 0;
        let matched = '';
        charNames.forEach(cName => {
          const sim = calculateSimilarity(item.name, cName);
          if (sim > maxSim) {
            maxSim = sim;
            matched = cName;
          }
        });
        return {
          ...item,
          similarity: maxSim,
          matchChar: maxSim >= 75 ? matched : undefined
        };
      });

      setNamingResults(result);
      setNamingLoading(false);
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>AI 작명 엔진</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          장르와 분위기에 맞는 주인공, 주연, 조연, 지명 이름을 빠르게 제안합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border flex flex-col gap-4 h-fit ${
          isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>세계관 분위기</label>
            <select
              value={namingConcept}
              onChange={e => setNamingConcept(e.target.value)}
              className={`px-3 py-2.5 rounded-lg text-sm border outline-none ${
                isDark ? 'bg-[#121316] border-white/[0.08] text-white' : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316]'
              }`}
            >
              <option value="fantasy">판타지 서양풍</option>
              <option value="wuxia">무협 동양풍</option>
              <option value="modern">현대 로맨스/드라마</option>
              <option value="sf">SF/사이버펑크 미래풍</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>성별 어감</label>
            <div className="flex gap-2">
              {['all', 'male', 'female'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setNamingGender(g)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    namingGender === g
                      ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white'
                      : isDark
                        ? 'border-white/[0.08] text-[#A1A1AA] hover:border-white/20'
                        : 'border-black/[0.08] text-[#55555A] hover:border-black/20'
                  }`}
                >
                  {g === 'all' ? '중성' : g === 'male' ? '남성풍' : '여성풍'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>의미 키워드</label>
            <input
              type="text"
              value={namingKeywords}
              onChange={e => setNamingKeywords(e.target.value)}
              placeholder="예) 빛, 칼, 어둠"
              className={`px-3 py-2.5 rounded-lg text-sm border outline-none ${
                isDark ? 'bg-[#121316] border-white/[0.08] text-white' : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316]'
              }`}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={namingLoading}
            className="mt-2 w-full py-3 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-sm font-semibold transition-all duration-150"
          >
            {namingLoading ? 'AI 추천 분석 중...' : '이름 추천 생성'}
          </button>
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#121316]'}`}>작명 결과</h3>
          {namingResults.length === 0 ? (
            <div className={`flex-1 rounded-2xl border border-dashed flex flex-col items-center justify-center p-10 text-center ${
              isDark ? 'border-white/[0.06] bg-white/[0.01] text-[#3A3D50]' : 'border-black/[0.06] bg-black/[0.01] text-[#C5C5CC]'
            }`}>
              <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
              <p className="text-sm font-medium">조건을 설정한 뒤 생성 버튼을 클릭하세요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {namingResults.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{item.name}</span>
                      {item.matchChar && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                          유사도 {item.similarity}% 경고 (기존 인물 '{item.matchChar}' 존재)
                        </span>
                      )}
                      {!item.matchChar && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold">
                          어감 안전 (유사도 {item.similarity}%)
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{item.meaning}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.name);
                      alert(`"${item.name}" 이름이 복사되었습니다.`);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold hover:bg-white/[0.05] transition-colors ${
                      isDark ? 'border-white/[0.08] text-[#EDEDEF]' : 'border-black/[0.08] text-[#121316]'
                    }`}
                  >
                    복사
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
