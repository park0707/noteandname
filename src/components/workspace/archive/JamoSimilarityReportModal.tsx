import { useState, useMemo } from 'react';
import { X, Scale, AlertTriangle, CheckCircle, Search, Sliders, ArrowRight } from 'lucide-react';
import type { ArchiveItem } from '../types';
import { decomposeHangeul, calculateSimilarity } from '../utils';

interface JamoSimilarityReportModalProps {
  isDark: boolean;
  archiveItems: ArchiveItem[];
  onClose: () => void;
  onSelectItem: (item: ArchiveItem) => void;
}

export default function JamoSimilarityReportModal({
  isDark,
  archiveItems,
  onClose,
  onSelectItem,
}: JamoSimilarityReportModalProps) {
  const [activeTab, setActiveTab] = useState<'report' | 'test'>('report');
  
  // 유사도 기준 (기본 75%, 50% ~ 90% 조절 가능)
  const [threshold, setThreshold] = useState<number>(75);
  
  // 실시간 직접 검사 입력 이름
  const [testInputName, setTestInputName] = useState<string>('');

  // 아카이브 항목 간 전수 유사도 비교 연산 (상위 N개 유사 쌍 탐색)
  const similarPairs = useMemo(() => {
    const pairs: {
      itemA: ArchiveItem;
      itemB: ArchiveItem;
      similarity: number;
    }[] = [];

    for (let i = 0; i < archiveItems.length; i++) {
      for (let j = i + 1; j < archiveItems.length; j++) {
        const itemA = archiveItems[i];
        const itemB = archiveItems[j];
        
        // 공백 제거 순수 이름 비교
        const nameA = itemA.name.trim();
        const nameB = itemB.name.trim();
        if (!nameA || !nameB) continue;

        const sim = calculateSimilarity(nameA, nameB);
        if (sim >= threshold) {
          pairs.push({ itemA, itemB, similarity: sim });
        }
      }
    }

    // 유사도 높은 순서로 정렬
    return pairs.sort((a, b) => b.similarity - a.similarity);
  }, [archiveItems, threshold]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`w-full max-w-4xl max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#111216] border-white/[0.1] text-[#EDEDEF]' : 'bg-white border-black/[0.1] text-[#121316]'
      }`}>
        {/* 상단 헤더 */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5E6AD2]/15 text-[#7480E2] border border-[#5E6AD2]/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span>아카이브 자모 유사도 분석</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  similarPairs.length > 0
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {similarPairs.length > 0 ? `${similarPairs.length}건 발음 중복 우려` : '안전함'}
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                한글 자모 분해(Levenshtein Distance) 알고리즘으로 발음 어감이 유사하여 혼동하기 쉬운 이름을 자동 탐색합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'border-white/[0.08] hover:bg-white/[0.08] text-[#A1A1AA]' : 'border-black/[0.08] hover:bg-black/[0.05] text-[#55555A]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 탭 네비게이션 & 유사도 조절 슬라이더 컨트롤 바 */}
        <div className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
          isDark ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-black/[0.02] border-black/[0.06]'
        }`}>
          {/* 탭 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-[#5E6AD2] text-white shadow-sm'
                  : isDark ? 'text-[#A1A1AA] hover:bg-white/[0.06]' : 'text-[#55555A] hover:bg-black/[0.06]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>유사 이름 탐색 리포트 ({similarPairs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'test'
                  ? 'bg-[#5E6AD2] text-white shadow-sm'
                  : isDark ? 'text-[#A1A1AA] hover:bg-white/[0.06]' : 'text-[#55555A] hover:bg-black/[0.06]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>개별 이름 직접 검사</span>
            </button>
          </div>

          {/* 유사도 임계치(Threshold) 사용자 정의 조절기 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#5E6AD2]" />
              <span className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                유사도 기준:
              </span>
              <span className="text-xs font-bold text-[#5E6AD2] min-w-[36px] text-right">
                {threshold}% 이상
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="90"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-28 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
            />
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'report' ? (
            <div className="flex flex-col gap-4">
              {similarPairs.length === 0 ? (
                <div className={`p-12 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${
                  isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-black/[0.01] border-black/[0.06]'
                }`}>
                  <div className="p-3.5 rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">발음 중복 인물이 발견되지 않았습니다.</h3>
                    <p className={`text-xs mt-1 max-w-md ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                      현재 설정된 기준({threshold}%) 이상으로 발음이나 자모 분해가 겹치는 아카이브 항목이 없습니다. 작중 독자가 인물을 헷갈릴 위험이 매우 낮습니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {similarPairs.map((pair, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#5E6AD2]/50 ${
                        isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-gray-50 border-black/[0.08]'
                      }`}
                    >
                      {/* 항목 A ↔ 항목 B 비교 데이터 */}
                      <div className="flex-1 flex flex-wrap items-center gap-3 min-w-0">
                        {/* Target A */}
                        <button
                          onClick={() => {
                            onSelectItem(pair.itemA);
                            onClose();
                          }}
                          className={`group text-left p-2.5 rounded-xl border transition-all ${
                            isDark ? 'bg-black/30 border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border-black/[0.06] hover:bg-black/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#5E6AD2] group-hover:underline">
                              {pair.itemA.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isDark ? 'bg-white/[0.06] text-[#A1A1AA]' : 'bg-black/[0.06] text-[#71717A]'
                            }`}>
                              {pair.itemA.category}
                            </span>
                          </div>
                          <p className={`text-[11px] font-mono mt-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                            자모: {decomposeHangeul(pair.itemA.name)}
                          </p>
                        </button>

                        <span className={`text-xs font-bold ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                          VS
                        </span>

                        {/* Target B */}
                        <button
                          onClick={() => {
                            onSelectItem(pair.itemB);
                            onClose();
                          }}
                          className={`group text-left p-2.5 rounded-xl border transition-all ${
                            isDark ? 'bg-black/30 border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border-black/[0.06] hover:bg-black/[0.04]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#5E6AD2] group-hover:underline">
                              {pair.itemB.name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isDark ? 'bg-white/[0.06] text-[#A1A1AA]' : 'bg-black/[0.06] text-[#71717A]'
                            }`}>
                              {pair.itemB.category}
                            </span>
                          </div>
                          <p className={`text-[11px] font-mono mt-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                            자모: {decomposeHangeul(pair.itemB.name)}
                          </p>
                        </button>
                      </div>

                      {/* 유사도 백분율 및 경고 배지 */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-amber-400">
                            {pair.similarity}% 유사
                          </span>
                          <span className="block text-[10px] text-amber-500 font-semibold">
                            발음 유사성 경고
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 개별 이름 직접 검사 탭 */
            <div className="flex flex-col gap-6">
              <div className={`p-4 rounded-2xl border flex flex-col gap-3 ${
                isDark ? 'bg-white/[0.02] border-white/[0.08]' : 'bg-gray-50 border-black/[0.08]'
              }`}>
                <label className="text-xs font-bold">검사할 신규 이름 입력</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={testInputName}
                    onChange={(e) => setTestInputName(e.target.value.trim())}
                    placeholder="예: 카엘루스, 엑스칼리버 등"
                    className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm border outline-none font-medium ${
                      isDark ? 'bg-black/30 border-white/[0.1] text-white focus:border-[#5E6AD2]' : 'bg-white border-black/[0.1] text-gray-900 focus:border-[#5E6AD2]'
                    }`}
                  />
                  {testInputName && (
                    <button
                      onClick={() => setTestInputName('')}
                      className="px-3 py-2.5 text-xs text-gray-400 hover:text-white"
                    >
                      지우기
                    </button>
                  )}
                </div>

                {testInputName && (
                  <div className={`p-3 rounded-xl font-mono text-xs flex justify-between items-center ${
                    isDark ? 'bg-black/40 text-white' : 'bg-white text-gray-900 border border-black/5'
                  }`}>
                    <span>입력값 자모 쪼개기:</span>
                    <span className="font-bold text-[#5E6AD2]">{decomposeHangeul(testInputName)}</span>
                  </div>
                )}
              </div>

              {/* 입력된 값과 기존 전체 아카이브 항목 간 유사도 순위 리스트 */}
              <div>
                <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  아카이브 등록 항목들과의 어감 유사도 비교
                </h3>

                {!testInputName ? (
                  <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                    위 입력란에 이름을 입력하면 기존 아카이브 전체 항목과의 자모 유사도를 분석합니다.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {archiveItems.map((item) => {
                      const sim = calculateSimilarity(testInputName, item.name);
                      const isWarn = sim >= threshold;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                            isWarn
                              ? 'border-amber-500/40 bg-amber-500/[0.05]'
                              : isDark ? 'bg-white/[0.01] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{item.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">
                                ({decomposeHangeul(item.name)})
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">{item.summary || '요약 없음'}</span>
                          </div>

                          <div className="text-right">
                            <span className={`text-sm font-bold ${isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {sim}%
                            </span>
                            <span className={`block text-[9px] font-semibold ${isWarn ? 'text-amber-500' : 'text-gray-400'}`}>
                              {isWarn ? '발음 주의' : '안전'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
