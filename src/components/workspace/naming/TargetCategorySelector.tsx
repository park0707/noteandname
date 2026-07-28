import React from 'react';
import type { ArchiveCategory, SubtypeItem } from '../types';
import { CATEGORY_SUBTYPES } from '../../../data/tag_taxonomy_seeds';
import { User, Sword, MapPin, Zap, Layers, Filter } from 'lucide-react';

interface TargetCategorySelectorProps {
  selectedCategory: ArchiveCategory;
  onSelectCategory: (category: ArchiveCategory) => void;
  selectedSubtype?: string;
  onSelectSubtype: (subtypeId: string) => void;
}

const CATEGORY_ITEMS: { id: ArchiveCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'character', label: '캐릭터/인물', icon: <User className="w-4 h-4" />, desc: '성격, 문화권, 성별 기반 인명 생성' },
  { id: 'location', label: '장소/지명', icon: <MapPin className="w-4 h-4" />, desc: '요새, 신전, 미궁, 고원 등 지명 생성' },
  { id: 'equipment', label: '장비/아이템', icon: <Sword className="w-4 h-4" />, desc: '성검, 단검, 워해머, 갑주, 아티팩트' },
  { id: 'skill', label: '기술/마법', icon: <Zap className="w-4 h-4" />, desc: '무공, 마법 주문, 특수 능력, 비기' },
  { id: 'etc', label: '기타(조직/세력)', icon: <Layers className="w-4 h-4" />, desc: '기사단, 클랜, 문파, 비밀 결사, 국가' },
];

export const TargetCategorySelector: React.FC<TargetCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSubtype,
  onSelectSubtype,
}) => {
  const currentSubtypes: SubtypeItem[] = CATEGORY_SUBTYPES[selectedCategory] || [];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-md mb-4 space-y-3">
      {/* 1단: 카테고리 셀렉터 */}
      <div>
        <div className="text-xs font-semibold text-slate-400 px-1 py-0.5 mb-1.5 uppercase tracking-wider">
          1. 대상 카테고리 선택 (Target Category)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CATEGORY_ITEMS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  // 카테고리 변경 시 해당 카테고리의 첫 번째 세부유형으로 초기화
                  const subs = CATEGORY_SUBTYPES[cat.id];
                  if (subs && subs.length > 0) {
                    onSelectSubtype(subs[0].id);
                  } else {
                    onSelectSubtype('');
                  }
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all text-center group ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg mb-1 transition-colors ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-semibold">{cat.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2단: 세부유형 (Subtype) 선택 바 */}
      {currentSubtypes.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-300 px-1 mb-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. 세부유형 선택 (Subtype - 맞춤 어감 & 태그 추천 축)</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {currentSubtypes.map((sub) => {
              const isSubSelected = selectedSubtype === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => onSelectSubtype(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                    isSubSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/20 font-bold'
                      : 'bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={sub.description}
                >
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
