import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { EraType, SocialClassType, WorldbuildingRuleTag } from '../types';
import { ERA_LIST, DYNAMIC_ERA_REGIONS } from '../../../data/tag_taxonomy_seeds';
import { Sparkles, X, FolderPlus } from 'lucide-react';

interface WorldbuildingRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRuleTag: (ruleTag: Omit<WorldbuildingRuleTag, 'id' | 'createdAt'>) => void;
  initialEra?: EraType;
}

export const WorldbuildingRuleModal: React.FC<WorldbuildingRuleModalProps> = ({
  isOpen,
  onClose,
  onSaveRuleTag,
  initialEra = '중세'
}) => {
  const [tagName, setTagName] = useState('');
  const [description, setDescription] = useState('');
  const [baseEra, setBaseEra] = useState<EraType>(initialEra);
  const [baseRegion, setBaseRegion] = useState<string>('');
  const [socialClass, setSocialClass] = useState<SocialClassType>('귀족/양반');
  const [customRulesPrompt, setCustomRulesPrompt] = useState('');
  const [requiredSyllablesInput, setRequiredSyllablesInput] = useState('');
  const [forbiddenSyllablesInput, setForbiddenSyllablesInput] = useState('');

  if (!isOpen) return null;

  const currentRegionGroups = DYNAMIC_ERA_REGIONS[baseEra] || [];

  const handleSave = () => {
    const trimmedName = tagName.trim();
    if (!trimmedName) return;

    const reqSyllables = requiredSyllablesInput
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const forbSyllables = forbiddenSyllablesInput
      .split(/[,;\s]+/)
      .map(s => s.trim())
      .filter(Boolean);

    onSaveRuleTag({
      name: trimmedName.startsWith('🏷️') ? trimmedName : `🏷️ ${trimmedName}`,
      description: description.trim() || undefined,
      baseEra,
      baseRegion: baseRegion || undefined,
      socialClass,
      customRulesPrompt: customRulesPrompt.trim() || undefined,
      requiredSyllables: reqSyllables.length > 0 ? reqSyllables : undefined,
      forbiddenSyllables: forbSyllables.length > 0 ? forbSyllables : undefined
    });

    // Reset & Close
    setTagName('');
    setDescription('');
    setCustomRulesPrompt('');
    setRequiredSyllablesInput('');
    setForbiddenSyllablesInput('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#121318] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-slate-100">
              세계관 고유 명명 규칙 태그 등록
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          소설 세계관 속 가문의 명명법, 종교 단체 서식, 특정 족속의 고유 명명 규칙을 
          태그로 패키징하여 보관하세요. 선택 시 내부 규칙이 자동 풀려서 반영됩니다.
        </p>

        <div className="space-y-4">
          {/* 태그 이름 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              규칙 태그 이름 <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="예: 펠드 마법가문 명명법, 성좌 교단 서식, 북부 족속 명칭 등"
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500 font-medium placeholder:text-slate-600"
              autoFocus
            />
          </div>

          {/* 기본 시대 & 신분 구조 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                기본 시대 설정
              </label>
              <select
                value={baseEra}
                onChange={(e) => {
                  setBaseEra(e.target.value as EraType);
                  setBaseRegion('');
                }}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                {ERA_LIST.map(era => (
                  <option key={era} value={era}>{era}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                기본 신분/명명 형태
              </label>
              <select
                value={socialClass}
                onChange={(e) => setSocialClass(e.target.value as SocialClassType)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="평민">평민 (성 없음 / 외자 / 단식)</option>
                <option value="귀족/양반">귀족/양반 (성 + 이름 / 가문명)</option>
                <option value="선비/학자">선비/학자 (호 / 자 / 별호)</option>
              </select>
            </div>
          </div>

          {/* 시대별 가변 지역 선택 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              기본 귀속 지역/문화권 (선택사항)
            </label>
            <select
              value={baseRegion}
              onChange={(e) => setBaseRegion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
            >
              <option value="">-- 미지정 (작명 시 시대 무작위 지역 적용) --</option>
              {currentRegionGroups.map(group => (
                <optgroup key={group.major} label={`[${group.major}]`}>
                  {group.subRegions.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* 자연어 명명 지침 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              자연어 고유 규칙 &amp; 서식 설명
            </label>
            <textarea
              value={customRulesPrompt}
              onChange={(e) => setCustomRulesPrompt(e.target.value)}
              rows={3}
              placeholder="예: 접두사 '펠드-'가 반드시 붙으며 화염과 마도공학 어감을 지님. 가문원의 이름은 고풍스럽고 우아한 3자 한글로 합성함."
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 focus:outline-none focus:border-purple-500 leading-relaxed placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* 필수/금지 음절 제약 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                필수 포함 음절
              </label>
              <input
                type="text"
                value={requiredSyllablesInput}
                onChange={(e) => setRequiredSyllablesInput(e.target.value)}
                placeholder="예: 펠, 드, 아 (쉼표 구분)"
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                금지/제외 음절
              </label>
              <input
                type="text"
                value={forbiddenSyllablesInput}
                onChange={(e) => setForbiddenSyllablesInput(e.target.value)}
                placeholder="예: 칠, 마, 썩 (쉼표 구분)"
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl transition-colors font-medium border border-slate-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!tagName.trim()}
            className="flex items-center space-x-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>세계관 태그 저장</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
