import React from 'react';
import type { ArchiveCategory, EraType, SocialClassType, WorldbuildingRuleTag } from '../types';
import { ERA_LIST, DYNAMIC_ERA_REGIONS } from '../../../data/tag_taxonomy_seeds';
import { User, Sword, MapPin, Zap, Layers, Globe, Clock, Shield, Plus, X, Tag, Info } from 'lucide-react';

interface TargetCategorySelectorProps {
  selectedCategory: ArchiveCategory;
  onSelectCategory: (category: ArchiveCategory) => void;

  selectedEra: EraType;
  onSelectEra: (era: EraType) => void;

  selectedMajorRegion: string;
  selectedSubRegion: string;
  onSelectRegion: (major: string, sub: string) => void;

  selectedSocialClass: SocialClassType;
  onSelectSocialClass: (socialClass: SocialClassType) => void;

  lengthConstraint: { min: number; max: number };
  onChangeLengthConstraint: (min: number, max: number) => void;

  worldbuildingRuleTags: WorldbuildingRuleTag[];
  activeRuleTagIds: string[];
  onToggleRuleTag: (tagId: string) => void;
  onDeleteRuleTag: (tagId: string) => void;
  onOpenRuleModal: () => void;
}

const CATEGORY_ITEMS: { id: ArchiveCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'character', label: '캐릭터/인물', icon: <User className="w-4 h-4" />, desc: '시대, 지역, 신분 기반 인명 생성' },
  { id: 'location', label: '장소/지명', icon: <MapPin className="w-4 h-4" />, desc: '요새, 신전, 미궁, 고원 등 지명 생성' },
  { id: 'equipment', label: '장비/아이템', icon: <Sword className="w-4 h-4" />, desc: '성검, 단검, 워해머, 갑주, 아티팩트' },
  { id: 'skill', label: '기술/마법', icon: <Zap className="w-4 h-4" />, desc: '무공, 마법 주문, 특수 능력, 비기' },
  { id: 'etc', label: '기타(조직/세력)', icon: <Layers className="w-4 h-4" />, desc: '기사단, 클랜, 문파, 비밀 결사, 국가' },
];

// 카테고리별 아카이브와 통일된 세만틱 컬러 테마 Map
const CATEGORY_COLOR_MAP: Record<ArchiveCategory, {
  activeCard: string;
  activeIcon: string;
  iconBg: string;
}> = {
  character: {
    activeCard: 'bg-indigo-950/40 border-indigo-500/80 text-indigo-100 shadow-md shadow-indigo-500/10',
    activeIcon: 'text-indigo-300',
    iconBg: 'bg-indigo-600/30 text-indigo-200'
  },
  location: {
    activeCard: 'bg-emerald-950/40 border-emerald-500/80 text-emerald-100 shadow-md shadow-emerald-500/10',
    activeIcon: 'text-emerald-300',
    iconBg: 'bg-emerald-600/30 text-emerald-200'
  },
  equipment: {
    activeCard: 'bg-amber-950/40 border-amber-500/80 text-amber-100 shadow-md shadow-amber-500/10',
    activeIcon: 'text-amber-300',
    iconBg: 'bg-amber-600/30 text-amber-200'
  },
  skill: {
    activeCard: 'bg-sky-950/40 border-sky-500/80 text-sky-100 shadow-md shadow-sky-500/10',
    activeIcon: 'text-sky-300',
    iconBg: 'bg-sky-600/30 text-sky-200'
  },
  etc: {
    activeCard: 'bg-purple-950/40 border-purple-500/80 text-purple-100 shadow-md shadow-purple-500/10',
    activeIcon: 'text-purple-300',
    iconBg: 'bg-purple-600/30 text-purple-200'
  }
};

const SOCIAL_CLASS_ITEMS: { id: SocialClassType; label: string; desc: string }[] = [
  { id: '평민', label: '평민 / 일반', desc: '성 없음 / 외자 / 단식 이름' },
  { id: '귀족/양반', label: '귀족 / 양반', desc: '가문 성 + 정식 이름' },
  { id: '선비/학자', label: '선비 / 학자', desc: '호 / 자 / 별호 명칭' },
];

export const TargetCategorySelector: React.FC<TargetCategorySelectorProps> = React.memo(({
  selectedCategory,
  onSelectCategory,
  selectedEra,
  onSelectEra,
  selectedMajorRegion,
  selectedSubRegion,
  onSelectRegion,
  selectedSocialClass,
  onSelectSocialClass,
  lengthConstraint,
  onChangeLengthConstraint,
  worldbuildingRuleTags = [],
  activeRuleTagIds = [],
  onToggleRuleTag,
  onDeleteRuleTag,
  onOpenRuleModal
}) => {
  const currentRegionGroups = DYNAMIC_ERA_REGIONS[selectedEra] || [];

  return (
    <div className="bg-[#121318]/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md mb-4 space-y-4 shadow-sm">
      {/* 1. 대상 카테고리 선택 */}
      <div>
        <div className="text-xs font-semibold text-slate-400 px-1 py-0.5 mb-1.5 uppercase tracking-wider">
          1. 대상 분야 선택 (Target Category)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CATEGORY_ITEMS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const theme = CATEGORY_COLOR_MAP[cat.id];

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center group ${
                  isSelected
                    ? theme.activeCard
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg mb-1 transition-colors ${
                  isSelected ? theme.iconBg : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                }`}>
                  {cat.icon}
                </div>
                <span className={`text-xs font-semibold ${isSelected ? theme.activeIcon : ''}`}>{cat.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 시대 & 시대별 가변 지역/문화권 */}
      <div className="pt-3 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>2. 시대 &amp; 계층형 지역/문화권</span>
          </div>
        </div>

        {/* 시대 (Era) 선택 버튼 칩 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1">시대:</span>
          {ERA_LIST.map((era) => {
            const isSelected = selectedEra === era;
            return (
              <button
                key={era}
                onClick={() => {
                  onSelectEra(era);
                  onSelectRegion('', ''); // Reset region when era changes to force era-appropriate selection
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white font-bold shadow-md shadow-[#5E6AD2]/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {era}
              </button>
            );
          })}
        </div>

        {/* 선택한 시대에 종속된 가변 지역 선택 드롭다운 */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-slate-300 font-medium">
              [{selectedEra}] 시대 존속 지역/문화권 선택:
            </span>
          </div>

          <select
            value={selectedSubRegion ? `${selectedMajorRegion}::${selectedSubRegion}` : ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                onSelectRegion('', '');
              } else {
                const [maj, sub] = val.split('::');
                onSelectRegion(maj, sub);
              }
            }}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#5E6AD2] font-medium"
          >
            <option value="">-- 지역 미선택 (시대 부합 무작위 지역 자동 선택) --</option>
            {currentRegionGroups.map((group) => (
              <optgroup key={group.major} label={`🌐 ${group.major}`}>
                {group.subRegions.map((sub) => (
                  <option key={sub} value={`${group.major}::${sub}`}>
                    └ {sub}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* 미선택 시 무작위 안내 배너 */}
          {!selectedSubRegion && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300">
              <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>
                지역 미선택 상태입니다. 작명 진행 시 <strong className="underline">{selectedEra}</strong> 시대에 실존/부합하는 지역이 무작위 선택됩니다.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 신분/명명 형태 & 글자 수 제약 */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 신분 구조 */}
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>신분 / 명명 형태</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SOCIAL_CLASS_ITEMS.map((item) => {
              const isSelected = selectedSocialClass === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectSocialClass(item.id)}
                  title={item.desc}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white font-bold shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 글자 수 (음절) 제약 */}
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 mb-1.5">
            <Tag className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>이름 글자 수</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '2글자', min: 2, max: 2 },
              { label: '3글자', min: 3, max: 3 },
              { label: '4글자 이상', min: 4, max: 8 },
              { label: '자유 (2~6자)', min: 2, max: 6 }
            ].map((opt) => {
              const isSelected = lengthConstraint.min === opt.min && lengthConstraint.max === opt.max;
              return (
                <button
                  key={opt.label}
                  onClick={() => onChangeLengthConstraint(opt.min, opt.max)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white font-bold shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. 사용자 세계관 규칙 태그 영역 */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-purple-300">
            <Tag className="w-3.5 h-3.5 text-purple-400" />
            <span>내 세계관 고유 명명 규칙 태그</span>
          </div>
          <button
            type="button"
            onClick={onOpenRuleModal}
            className="flex items-center space-x-1 text-[11px] text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/70 border border-purple-800/50 px-2.5 py-1 rounded-lg transition-all font-semibold shadow-sm"
          >
            <Plus className="w-3 h-3 text-purple-400" />
            <span>규칙 태그 추가</span>
          </button>
        </div>

        {worldbuildingRuleTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {worldbuildingRuleTags.map((ruleTag) => {
              const isActive = activeRuleTagIds.includes(ruleTag.id);
              return (
                <div
                  key={ruleTag.id}
                  onClick={() => onToggleRuleTag(ruleTag.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/20'
                      : 'bg-purple-950/20 border-purple-800/40 text-purple-300 hover:bg-purple-900/40 hover:text-white'
                  }`}
                  title={ruleTag.description || ruleTag.customRulesPrompt}
                >
                  <span>{ruleTag.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRuleTag(ruleTag.id);
                    }}
                    className={`ml-1 p-0.5 rounded transition-colors ${
                      isActive
                        ? 'text-purple-200 hover:text-white hover:bg-purple-500'
                        : 'text-purple-400 hover:text-red-400 hover:bg-red-950/60'
                    }`}
                    title="태그 삭제"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 px-1 py-0.5 italic">
            등록된 세계관 고유 명명 규칙 태그가 없습니다. 상단 버튼으로 가문/종교/단체 명명법을 등록해보세요.
          </p>
        )}
      </div>
    </div>
  );
});
