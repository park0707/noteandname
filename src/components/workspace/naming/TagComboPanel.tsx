import React, { useState } from 'react';
import type { ArchiveCategory, NamingConstraint, NamingPreset, SubtypeItem, TagGroupKey, TagWeight } from '../types';
import { CATEGORY_SUBTYPES, EXTENDED_TAG_TAXONOMY } from '../../../data/tag_taxonomy_seeds';
import { Tag, Sliders, ChevronDown, ChevronUp, Save, Bookmark, ShieldAlert, Sparkles, Wand2, AlertTriangle } from 'lucide-react';

interface TagComboPanelProps {
  selectedCategory: ArchiveCategory;
  selectedSubtype?: string;
  tagWeights: TagWeight[];
  onChangeTagWeights: (newWeights: TagWeight[]) => void;
  constraints: NamingConstraint;
  onChangeConstraints: (newConstraints: NamingConstraint) => void;
  customTags?: string[]; // ArchiveManager 프로젝트 태그
  onGenerate: () => void;
  keywords: string;
  onChangeKeywords: (kw: string) => void;
  gender: 'all' | 'male' | 'female';
  onChangeGender: (gender: 'all' | 'male' | 'female') => void;
}

export const TagComboPanel: React.FC<TagComboPanelProps> = ({
  selectedCategory,
  selectedSubtype,
  tagWeights,
  onChangeTagWeights,
  constraints,
  onChangeConstraints,
  customTags = [],
  onGenerate,
  keywords,
  onChangeKeywords,
  gender,
  onChangeGender
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [savedPresets, setSavedPresets] = useState<NamingPreset[]>(() => {
    try {
      const stored = localStorage.getItem('novelflow_naming_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // 현재 선택된 세부유형 객체 구하기
  const currentSubtypeObj: SubtypeItem | undefined = selectedSubtype
    ? (CATEGORY_SUBTYPES[selectedCategory] || []).find(s => s.id === selectedSubtype)
    : undefined;

  // 카테고리별 적용 매트릭스에 따른 태그 그룹 정의 & 라벨 변형
  const getGroupTitleAndVisibility = (groupKey: TagGroupKey): { visible: boolean; title: string } => {
    switch (groupKey) {
      case 'genre':
        return { visible: true, title: '장르 (Genre)' };
      case 'culture':
        return { visible: true, title: '문화권 / 스타일 (Culture)' };
      case 'trait':
        if (selectedCategory === 'character') return { visible: true, title: '성격 (인격체 전용)' };
        if (selectedCategory === 'etc') return { visible: true, title: '조직 성향 (성격 변형)' };
        return { visible: false, title: '성격 (미적용)' };
      case 'mood':
        if (selectedCategory === 'character') return { visible: true, title: '분위기 (무드 보조)' };
        if (selectedCategory === 'location') return { visible: true, title: '분위기 (지형 무드 전용)' };
        if (selectedCategory === 'equipment' || selectedCategory === 'skill') return { visible: true, title: '분위기 (세부유형 결합 무드)' };
        return { visible: true, title: '분위기 (범용 무드)' };
      case 'phonetic':
        return { visible: true, title: '음성상징학 발음 어감 (Phonetic Feel)' };
      case 'social_status':
        if (selectedCategory === 'character') return { visible: true, title: '신분 / 계급 / 서사 역할' };
        if (selectedCategory === 'equipment') return { visible: true, title: '예상 소유자 등급 (신분 변형)' };
        if (selectedCategory === 'etc') return { visible: true, title: '조직 유형 (신분 변형)' };
        return { visible: false, title: '신분/역할 (미적용)' };
      default:
        return { visible: false, title: '' };
    }
  };

  // 그룹별 시드 태그 목록 추출 (카테고리 필터링)
  const getTagsForGroup = (groupKey: TagGroupKey): string[] => {
    const seeds = EXTENDED_TAG_TAXONOMY.filter(
      t => t.groupKey === groupKey && t.applicableCategories.includes(selectedCategory)
    ).map(t => t.label);

    if ((groupKey === 'culture' || groupKey === 'trait' || groupKey === 'mood') && customTags.length > 0) {
      return Array.from(new Set([...seeds, ...customTags]));
    }
    return seeds;
  };

  // 태그 선택/해제 토글
  const toggleTag = (groupKey: TagGroupKey, label: string) => {
    const existingIndex = tagWeights.findIndex(t => t.groupKey === groupKey && t.label === label);
    if (existingIndex >= 0) {
      const updated = tagWeights.filter((_, idx) => idx !== existingIndex);
      onChangeTagWeights(updated);
    } else {
      const tagId = `tag-${groupKey}-${label}`;
      onChangeTagWeights([...tagWeights, { tagId, label, groupKey, weight: 1.0 }]);
    }
  };

  // 가중치 조절
  const updateWeight = (groupKey: TagGroupKey, label: string, newWeight: number) => {
    const updated = tagWeights.map(t => {
      if (t.groupKey === groupKey && t.label === label) {
        return { ...t, weight: newWeight };
      }
      return t;
    });
    onChangeTagWeights(updated);
  };

  // 세부유형 추천 태그 일괄 자동 적용
  const handleApplyRecommendedTags = () => {
    if (!currentSubtypeObj) return;

    const recMoods = currentSubtypeObj.recommendedMoods || [];
    const recPhonetics = currentSubtypeObj.recommendedPhonetics || [];

    const newWeights = [...tagWeights];

    recMoods.forEach(m => {
      if (!newWeights.some(t => t.label === m)) {
        newWeights.push({ tagId: `rec-m-${m}`, label: m, groupKey: 'mood', weight: 1.0 });
      }
    });

    recPhonetics.forEach(p => {
      if (!newWeights.some(t => t.label === p)) {
        newWeights.push({ tagId: `rec-p-${p}`, label: p, groupKey: 'phonetic', weight: 1.0 });
      }
    });

    onChangeTagWeights(newWeights);
  };

  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    const newPreset: NamingPreset = {
      id: `preset-${Date.now()}`,
      name: presetNameInput.trim(),
      targetCategory: selectedCategory,
      tagWeights: [...tagWeights],
      constraints: { ...constraints }
    };
    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('novelflow_naming_presets', JSON.stringify(updatedPresets));
    setPresetNameInput('');
  };

  const handleLoadPreset = (presetId: string) => {
    const found = savedPresets.find(p => p.id === presetId);
    if (found) {
      onChangeTagWeights(found.tagWeights);
      if (found.constraints) onChangeConstraints(found.constraints);
    }
  };

  const GROUP_KEYS: TagGroupKey[] = ['genre', 'culture', 'trait', 'mood', 'phonetic', 'social_status'];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-md mb-4 space-y-4">
      {/* 1. 상단 툴바: 세부유형 추천 안내 & 프리셋 & 키워드 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">저장된 조합 프리셋:</span>
          <select
            onChange={(e) => handleLoadPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">프리셋 선택...</option>
            {savedPresets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.targetCategory})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="프리셋 이름 입력"
            value={presetNameInput}
            onChange={(e) => setPresetNameInput(e.target.value)}
            className="bg-slate-800/80 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 w-32"
          />
          <button
            onClick={handleSavePreset}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>조합 저장</span>
          </button>
        </div>
      </div>

      {/* 세부유형(Subtype) 맞춤 추천 배너 */}
      {currentSubtypeObj && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-200">선택된 세부유형: {currentSubtypeObj.name}</span>
              {currentSubtypeObj.examples && (
                <span className="text-[10px] text-indigo-300/80 bg-indigo-900/60 px-2 py-0.5 rounded border border-indigo-700/40">
                  예: {currentSubtypeObj.examples}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">{currentSubtypeObj.description}</p>
          </div>

          <button
            onClick={handleApplyRecommendedTags}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>추천 분위기/어감 자동 적용</span>
          </button>
        </div>
      )}

      {/* 자유 자연어 서사 요구사항 & 성별 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={selectedCategory === 'character' ? 'md:col-span-2' : 'md:col-span-3'}>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-indigo-300">
              자연어 서사 요구사항 (Narrative Prompt - AI 전달 축)
            </label>
            <span className="text-[10px] text-slate-500">배경설명, 상징적 모티브, 인상 묘사</span>
          </div>
          <textarea
            rows={2}
            placeholder="예: 어릴 적 용의 피를 마시고 불사의 육체를 얻었으나 밤마다 화염에 휩싸여 괴로워하는 비운의 용병"
            value={keywords}
            onChange={(e) => onChangeKeywords(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-none"
          />
        </div>

        {selectedCategory === 'character' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              성별 토글 (인물 전용)
            </label>
            <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
              {(['all', 'male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => onChangeGender(g)}
                  className={`flex-1 py-1 rounded text-center font-medium transition-colors ${
                    gender === g ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g === 'all' ? '전체' : g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. 카테고리 적용 매트릭스 기반 계층형 태그 그룹 목록 */}
      <div className="space-y-3">
        {GROUP_KEYS.map((groupKey) => {
          const { visible, title } = getGroupTitleAndVisibility(groupKey);
          if (!visible) return null; // 매트릭스 미적용 태그 그룹 숨김 처리

          const groupTags = getTagsForGroup(groupKey);
          if (groupTags.length === 0) return null;

          return (
            <div key={groupKey} className="bg-slate-950/40 rounded-lg p-2.5 border border-slate-800/50">
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>{title}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {groupTags.map((tagLabel) => {
                  const activeTag = tagWeights.find(t => t.groupKey === groupKey && t.label === tagLabel);
                  const isSelected = !!activeTag;

                  // 세부유형 추천 태그 여부 체크
                  const isRecommended = currentSubtypeObj && (
                    (currentSubtypeObj.recommendedMoods || []).includes(tagLabel) ||
                    (currentSubtypeObj.recommendedPhonetics || []).includes(tagLabel)
                  );

                  // 상충 태그 여부 체크
                  const isConflictTag = currentSubtypeObj && (currentSubtypeObj.conflictTags || []).includes(tagLabel);

                  return (
                    <div
                      key={tagLabel}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                        isSelected
                          ? isConflictTag
                            ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow-sm'
                            : 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm'
                          : isRecommended
                            ? 'bg-indigo-950/80 border-indigo-500/80 text-indigo-300 font-semibold ring-1 ring-indigo-500/30'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {isRecommended && !isSelected && (
                        <span title="세부유형 추천 태그">
                          <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                        </span>
                      )}
                      {isConflictTag && isSelected && (
                        <span title="이 세부유형과 어색할 수 있는 태그 조합">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        </span>
                      )}

                      <button
                        onClick={() => toggleTag(groupKey, tagLabel)}
                        className="font-medium"
                      >
                        {tagLabel}
                      </button>

                      {isSelected && (
                        <div className="flex items-center space-x-1 pl-1 border-l border-indigo-500/40">
                          <Sliders className="w-3 h-3 text-indigo-400" />
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.1"
                            value={activeTag.weight}
                            onChange={(e) => updateWeight(groupKey, tagLabel, parseFloat(e.target.value))}
                            className="w-12 accent-indigo-500 h-1 rounded bg-slate-700"
                            title={`가중치: ${activeTag.weight}`}
                          />
                          <span className="text-[10px] text-indigo-300 w-4 text-right font-mono">{activeTag.weight}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 접이식 고급 제약조건 필터 UI */}
      <div className="border-t border-slate-800/80 pt-2">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>고급 제약조건 필터 (금지/필수 음절, 길이 범위)</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3 bg-slate-950/60 border border-slate-800 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                금지 음절/단어 (쉼표 구분)
              </label>
              <input
                type="text"
                placeholder="예: 마, 흑, 파"
                value={constraints.forbiddenSyllables.join(', ')}
                onChange={(e) => onChangeConstraints({
                  ...constraints,
                  forbiddenSyllables: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                필수 포함 음절 (쉼표 구분)
              </label>
              <input
                type="text"
                placeholder="예: 용, 엘"
                value={constraints.requiredSyllables.join(', ')}
                onChange={(e) => onChangeConstraints({
                  ...constraints,
                  requiredSyllables: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                음절 길이 범위: {constraints.minLength} ~ {constraints.maxLength} 자
              </label>
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs text-slate-500">Min</span>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={constraints.minLength}
                  onChange={(e) => onChangeConstraints({ ...constraints, minLength: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
                <span className="text-xs text-slate-500">Max</span>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={constraints.maxLength}
                  onChange={(e) => onChangeConstraints({ ...constraints, maxLength: parseInt(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 생성 실행 버튼 */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={onGenerate}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>태그 조합 작명 실행</span>
        </button>
      </div>
    </div>
  );
};
