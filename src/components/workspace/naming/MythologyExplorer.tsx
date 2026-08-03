import React, { useState, useMemo } from 'react';
import type { ArchiveItem, NameCandidate } from '../types';
import { searchMythologyEntries } from './namingUtils';
import { BookOpen, Search, Sparkles, ExternalLink, ShieldCheck, RefreshCw, BookmarkCheck } from 'lucide-react';

interface MythologyExplorerProps {
  archiveItems: ArchiveItem[];
  onSaveToBank: (candidate: NameCandidate) => void;
}

const CULTURES = ['전체', '한국전통', '중국/동양', '일본', '그리스로마', '북유럽', '켈트', '이집트', '아랍/중동', '메소포타미아', '슬라브', '인도', '아메리카'];

export const MythologyExplorer: React.FC<MythologyExplorerProps> = ({
  archiveItems,
  onSaveToBank
}) => {
  const [query, setQuery] = useState('');
  const [selectedCulture, setSelectedCulture] = useState('전체');
  const [fameFilter, setFameFilter] = useState<'all' | 'major' | 'minor'>('all');
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  const searchResults = useMemo(() => {
    const cultures = selectedCulture === '전체' ? [] : [selectedCulture];
    return searchMythologyEntries(query, cultures, fameFilter, archiveItems);
  }, [query, selectedCulture, fameFilter, archiveItems]);

  const handleSave = (candidate: NameCandidate) => {
    onSaveToBank(candidate);
    setSavedSet(prev => new Set(prev).add(candidate.name));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md mb-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-200">설화·전승 기반 캐릭터 & 파생 이름 탐색기</h3>
        </div>
        <span className="text-xs text-purple-300/80 bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-800/40">
          RAG 코퍼스 RAG Matching Engine
        </span>
      </div>

      {/* 필터 툴바 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 서사 키워드 검색 */}
        <div className="md:col-span-2 relative">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            서사 키워드 / 모티브 검색
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="예: '복수를 위해 힘을 얻는 자', '트릭스터', '구원', '외눈'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-800/70 border border-slate-700 text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* 유명도 필터 */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            유명도 (Fame Level)
          </label>
          <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
            {(['all', 'major', 'minor'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFameFilter(f)}
                className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                  fameFilter === f ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? '전체' : f === 'major' ? '메이저' : '마이너'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 문화권 칩 목록 */}
      <div className="flex flex-wrap gap-2 pt-1">
        {CULTURES.map((cul) => (
          <button
            key={cul}
            onClick={() => setSelectedCulture(cul)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              selectedCulture === cul
                ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-sm'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cul}
          </button>
        ))}
      </div>

      {/* 결과 섹션 1: 신화 원본 서사 카드 목록 */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>매칭된 설화/신화 코퍼스 원전 ({searchResults.entries.length}건)</span>
        </h4>

        {searchResults.entries.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 bg-slate-950/30 rounded-lg border border-dashed border-slate-800">
            검색어 또는 필터에 부합하는 설화 코퍼스가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {searchResults.entries.map((entry) => (
              <div key={entry.id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 hover:border-purple-500/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-purple-300">{entry.characterName}</span>
                      {entry.koreanReading && entry.koreanReading !== entry.characterName && (
                        <span className="text-[10px] text-slate-400">({entry.koreanReading})</span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800/50">
                        {entry.culture}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{entry.storyTitle}</p>
                  </div>
                  {entry.sourceUrl && (
                    <a
                      href={entry.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-purple-400 transition-colors p-1"
                      title="원전 출처 링크 (저작권 검증용)"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <p className="text-[11px] text-slate-300 mt-2 line-clamp-2 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  {entry.storySummary}
                </p>

                {entry.meaning && (
                  <p className="text-[10px] text-purple-300/90 mt-1.5 italic">
                    어원/뜻: {entry.meaning}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((t: string) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSave({
                      name: entry.koreanReading || entry.characterName,
                      meaning: `${entry.storyTitle} - ${entry.meaning || entry.storySummary}`,
                      similarity: 0,
                      category: 'character',
                      tags: entry.tags
                    })}
                    disabled={savedSet.has(entry.koreanReading || entry.characterName)}
                    className="flex items-center space-x-1 px-2 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 border border-purple-700/50 text-[10px] rounded transition-colors disabled:opacity-50"
                  >
                    {savedSet.has(entry.koreanReading || entry.characterName) ? (
                      <>
                        <BookmarkCheck className="w-3 h-3 text-emerald-400" />
                        <span>보관됨</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-purple-300" />
                        <span>원본 그대로 보관</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 결과 섹션 2: 자모 분해 & 40~70% 어감 유사도 독창적 파생 이름 카드 */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>음절 분해 재조합 파생 이름 ({searchResults.derivedCandidates.length}건)</span>
          </h4>
          <span className="text-[10px] text-slate-400">
            원본 대비 40% ~ 75% 어감 유사도 (적당히 연상되되 베끼지 않는 구간)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {searchResults.derivedCandidates.map((cand) => {
            const isSaved = savedSet.has(cand.name);
            return (
              <div key={cand.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between hover:border-purple-500/40 transition-all">
                <div>
                  <span className="text-xs font-bold text-purple-200 block">{cand.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">{cand.meaning}</span>
                </div>
                <button
                  onClick={() => handleSave(cand)}
                  disabled={isSaved}
                  className="mt-2 text-[10px] w-full py-1 bg-slate-800 hover:bg-purple-900/50 text-slate-300 hover:text-purple-200 rounded border border-slate-700 hover:border-purple-600 transition-colors flex items-center justify-center space-x-1"
                >
                  {isSaved ? (
                    <span className="text-emerald-400 font-semibold">보관 완료</span>
                  ) : (
                    <span>이름 뱅크 보관</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
