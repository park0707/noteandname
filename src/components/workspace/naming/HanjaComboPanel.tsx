import React, { useState } from 'react';
import type { ArchiveItem, NameCandidate } from '../types';
import { generateHanjaNames } from './namingUtils';
import { HANJA_SURNAMES } from '../../../data/hanja_dict';
import { Scroll, Sparkles, BookmarkCheck } from 'lucide-react';

interface HanjaComboPanelProps {
  archiveItems: ArchiveItem[];
  onSaveToBank: (candidate: NameCandidate) => void;
}

const MEANING_TAGS = ['검', '바람', '불', '물', '푸르름', '어둠', '빛', '지혜', '용기', '고요함', '용', '신선', '하늘'];

export const HanjaComboPanel: React.FC<HanjaComboPanelProps> = ({
  archiveItems,
  onSaveToBank
}) => {
  const [selectedSurname, setSelectedSurname] = useState('李');
  const [selectedMeaningTag, setSelectedMeaningTag] = useState('검');
  const [generatedResults, setGeneratedResults] = useState<NameCandidate[]>(() =>
    generateHanjaNames('李', '검', 8, archiveItems)
  );
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());

  const handleGenerate = () => {
    const list = generateHanjaNames(selectedSurname, selectedMeaningTag, 8, archiveItems);
    setGeneratedResults(list);
  };

  const handleSave = (candidate: NameCandidate) => {
    onSaveToBank(candidate);
    setSavedSet(prev => new Set(prev).add(candidate.name));
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md mb-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Scroll className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200">무협·동양풍 전용 한자 조합 서브 엔진</h3>
        </div>
        <span className="text-xs text-amber-400/80 bg-amber-950/30 px-2.5 py-1 rounded-full border border-amber-800/40">
          국립국어원 공공 한자 사전 연동
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 성씨 선택 */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            성씨 선택 (1자 / 복성)
          </label>
          <select
            value={selectedSurname}
            onChange={(e) => setSelectedSurname(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg p-2 focus:outline-none focus:border-amber-500"
          >
            {HANJA_SURNAMES.map((s: { char: string; eum: string; hun: string }) => (
              <option key={s.char} value={s.char}>
                {s.eum} ({s.char}) - {s.hun}
              </option>
            ))}
          </select>
        </div>

        {/* 원하는 뜻 태그 선택 */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            희망 어원 / 의미 태그
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MEANING_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedMeaningTag(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedMeaningTag === tag
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleGenerate}
          className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-amber-600/20 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>한자 2~3자 조합 생성</span>
        </button>
      </div>

      {/* 결과 카드 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        {generatedResults.map((candidate) => {
          const isSaved = savedSet.has(candidate.name);
          return (
            <div key={candidate.id} className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-amber-500/40 transition-all">
              <div>
                <span className="text-sm font-bold text-amber-300 block font-serif tracking-wide">{candidate.name}</span>
                <span className="text-[11px] text-slate-400 block mt-1 leading-snug">{candidate.meaning}</span>
              </div>
              <button
                onClick={() => handleSave(candidate)}
                disabled={isSaved}
                className="mt-3 text-xs w-full py-1.5 bg-slate-800 hover:bg-amber-900/50 text-slate-300 hover:text-amber-200 rounded-lg border border-slate-700 hover:border-amber-600 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50"
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">이름 뱅크 보관됨</span>
                  </>
                ) : (
                  <span>이름 뱅크 보관</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
