import { useState, useEffect } from 'react';
import type {
  ArchiveCategory,
  ArchiveItem,
  EnabledEngineSections,
  GenerateNameParams,
  NameBankItem,
  NameCandidate
} from '../types';
import { NameResultList } from './NameResultList';
import { NameBankDrawer } from './NameBankDrawer';
import {
  deleteNameBankItem,
  generateNamesByCombo,
  getSavedNameBank,
  saveNameBankItem,
  updateNameBankStatus
} from './namingUtils';
import { generateNamesWithAI, type AIProvider } from '../../../services/aiNamingService';
import {
  Sparkles,
  Bookmark,
  Loader2,
  FileText,
  User,
  Shield,
  MapPin,
  Zap,
  Package
} from 'lucide-react';

interface NamingEngineHubProps {
  isDark?: boolean;
  projectId?: string;
  archiveItems?: ArchiveItem[];
  customTags?: string[];
  onAddArchiveItem?: (item: Omit<ArchiveItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CATEGORIES: Array<{ id: ArchiveCategory; label: string; icon: typeof User; color: string }> = [
  { id: 'character', label: '인물/캐릭터', icon: User, color: 'text-indigo-400' },
  { id: 'location', label: '장소/지명', icon: MapPin, color: 'text-emerald-400' },
  { id: 'equipment', label: '장비/아이템', icon: Shield, color: 'text-amber-400' },
  { id: 'skill', label: '기술/마법', icon: Zap, color: 'text-sky-400' },
  { id: 'etc', label: '기타/조직', icon: Package, color: 'text-purple-400' },
];

export function NamingEngineHub({
  projectId = 'default-project',
  archiveItems = [],
  onAddArchiveItem
}: NamingEngineHubProps) {
  // 자연어 서사 중심 섹션 활성화
  const [enabledSections] = useState<EnabledEngineSections>({
    tag: false,
    mythology: false,
    naturalLanguage: true
  });

  // 기본 분야 카테고리 & 성별
  const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory>('character');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');

  // 자연어 서사 묘사문 입력 상태
  const [keywords, setKeywords] = useState<string>('');

  // 생성 후보 군 개수 (8개 고정) 및 드로어 상태
  const [batchCount, setBatchCount] = useState<number>(8);
  const [isBankOpen, setIsBankOpen] = useState<boolean>(false);

  // AI API 통신 상태
  const [aiProvider] = useState<AIProvider>('gemini');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<'idle' | 'step1' | 'step2' | 'step3'>('idle');

  // 환경변수(.env)에서 API Key 자동 로드
  const apiKey = (import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY2) : '') || localStorage.getItem('novelflow_ai_api_key') || '';
  const groqApiKey = (import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : '') || localStorage.getItem('novelflow_groq_api_key') || '';

  // 생성된 결과 후보군 및 저장된 보관함
  const [generatedCandidates, setGeneratedCandidates] = useState<NameCandidate[]>([]);
  const [bankItems, setBankItems] = useState<NameBankItem[]>([]);

  // 파라미터 빌더
  const buildGenerateParams = (overrideCount?: number): GenerateNameParams => {
    return {
      targetCategory: selectedCategory,
      era: '중세',
      majorRegion: '',
      subRegion: '',
      socialClass: '귀족/양반',
      worldbuildingRuleTags: [],
      activeRuleTagIds: [],
      tagWeights: [],
      keywords,
      constraints: {
        forbiddenSyllables: [],
        requiredSyllables: [],
        minLength: 2,
        maxLength: 5
      },
      count: overrideCount || 8,
      gender,
      enabledSections,
      selectedMythologyEntry: undefined
    };
  };

  // 초기 로드 & 기본 후보 생성
  useEffect(() => {
    const loaded = getSavedNameBank(projectId);
    setBankItems(loaded);
    const params = buildGenerateParams();
    const newList = generateNamesByCombo(params, archiveItems);
    setGeneratedCandidates(newList);
  }, [projectId]);

  // AI 서사 연산 작명 실행
  const handleGenerateAIClick = async () => {
    setIsGenerating(true);
    setPipelineStep('step1');

    const params = buildGenerateParams();

    const res = await generateNamesWithAI(
      params,
      { provider: aiProvider, apiKey, groqApiKey },
      archiveItems,
      (step) => setPipelineStep(step)
    );

    setGeneratedCandidates(res.candidates);
    setIsGenerating(false);
    setPipelineStep('idle');
  };

  const handleSaveToBank = (candidate: NameCandidate) => {
    const updated = saveNameBankItem(projectId, {
      projectId,
      name: candidate.name,
      targetCategory: candidate.category || selectedCategory,
      meaning: candidate.meaning,
      originMythologyId: candidate.originMythologyId,
      status: 'saved'
    });
    setBankItems(updated);
  };

  const handleUpdateBankStatus = (id: string, status: 'saved' | 'used' | 'discarded') => {
    const updated = updateNameBankStatus(projectId, id, status);
    setBankItems(updated);
  };

  const handleDeleteBankItem = (id: string) => {
    const updated = deleteNameBankItem(projectId, id);
    setBankItems(updated);
  };

  const handleAddToArchive = (candidate: Partial<NameCandidate>, targetCat?: ArchiveCategory) => {
    if (!onAddArchiveItem || !candidate.name) return;
    onAddArchiveItem({
      projectId,
      name: candidate.name,
      category: targetCat || candidate.category || selectedCategory,
      summary: candidate.meaning || '자연어 서사 작명 엔진에서 아카이브로 등록된 항목',
      description: `[작명 출처]: ${candidate.meaning || ''}`,
      tags: [],
      attributes: []
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto bg-[#0E0F12] text-slate-100 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 메인 입력 캔버스 (자연어 서사 입력) */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 md:p-6 space-y-5 flex-1">
        {/* 카테고리 선택 & 세부 옵션 */}
        <div className="bg-[#121318]/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md">
          {/* 카테고리 필터 탭 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              작명 대상 분야 카테고리 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[#5E6AD2]/20 border-[#5E6AD2] text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${cat.color}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 세부 설정: 성별, 후보 개수, 보관함 열기 */}
          <div className={`grid grid-cols-1 ${selectedCategory === 'character' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 pt-2 border-t border-slate-800/80`}>
            {/* 성별 선택 */}
            {selectedCategory === 'character' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  성별 어감 지정
                </label>
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                  {(['all', 'male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors ${
                        gender === g ? 'bg-[#5E6AD2] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {g === 'all' ? '전체 성별' : g === 'male' ? '남성적 어감' : '여성적 어감'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 생성 후보 군 개수 설정 (최소 1 ~ 최대 10) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                생성 후보 군 개수 설정 (1~10개)
              </label>
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <button
                  type="button"
                  onClick={() => setBatchCount(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={batchCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setBatchCount(Math.min(10, Math.max(1, val)));
                    }
                  }}
                  className="w-12 bg-slate-800 border border-slate-700 text-center rounded py-0.5 text-xs text-white font-bold"
                />
                <span className="text-slate-400 font-semibold">개</span>
                <button
                  type="button"
                  onClick={() => setBatchCount(prev => Math.min(10, prev + 1))}
                  className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded text-slate-200 font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* 보관함 열기 버튼 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                이름 보관함
              </label>
              <button
                type="button"
                onClick={() => setIsBankOpen(true)}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-colors h-[34px]"
              >
                <Bookmark className="w-4 h-4 text-[#5E6AD2]" />
                <span>보관함 열기 ({bankItems.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 자연어 서사 입력 캔버스 */}
        <div className="bg-[#121318]/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4.5 h-4.5 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-100">자연어 서사 묘사문 입력</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {keywords.length}자 입력됨
            </span>
          </div>

          {/* 서사 입력 텍스트 영역 */}
          <div>
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={5}
              placeholder="예: 야만인들의 신. 원시적인 신성함과 분노를 간직한 족장이자 거대한 신격체."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-[#5E6AD2] leading-relaxed placeholder:text-slate-600 resize-none font-medium"
            />
          </div>

          {/* 작명 생성 실행 버튼 */}
          <div className="flex items-center justify-end pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleGenerateAIClick}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#5E6AD2] hover:bg-[#7480E2] disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>
                    {pipelineStep === 'step1' ? '서사 인스펙션 중...' : pipelineStep === 'step2' ? 'AI 합성 연산 중...' : '최종 정제 중...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>AI 서사 딥 작명 실행</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 생성 결과 목록 (항상 하단에 노출) */}
        <NameResultList
          candidates={generatedCandidates}
          batchCount={batchCount}
          isGenerating={isGenerating}
          onChangeBatchCount={(count) => setBatchCount(Math.min(10, Math.max(1, count)))}
          onSaveToBank={handleSaveToBank}
          onAddToArchive={handleAddToArchive}
        />
      </div>

      {/* 모달 및 드로어 레이어 */}
      <NameBankDrawer
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        bankItems={bankItems}
        onUpdateStatus={handleUpdateBankStatus}
        onDeleteItem={handleDeleteBankItem}
        onAddToArchive={handleAddToArchive}
      />
    </div>
  );
}

export default NamingEngineHub;
