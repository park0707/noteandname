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
import { NamingErrorModal } from './NamingErrorModal';
import { classifyNamingError, TEST_ERROR_PRESETS, type NamingErrorInfo } from './namingErrors';
import {
  deleteNameBankItem,
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
  Package,
  Bug,
  ChevronDown
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

  // 생성 후보 군 개수 및 드로어 상태
  const [batchCount, setBatchCount] = useState<number>(8);
  const [isBankOpen, setIsBankOpen] = useState<boolean>(false);

  // AI API 통신 상태
  const [aiProvider] = useState<AIProvider>('gemini');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<'idle' | 'step1' | 'step2' | 'step3'>('idle');

  // 에러 모달 및 테스트 메뉴 상태
  const [currentError, setCurrentError] = useState<NamingErrorInfo | null>(null);
  const [isErrorMenuOpen, setIsErrorMenuOpen] = useState<boolean>(false);

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
      count: overrideCount ?? batchCount ?? 8,
      gender,
      enabledSections,
      selectedMythologyEntry: undefined
    };
  };

  // 초기 로드: 저장된 보관함 동기화 (3순위 로컬 폴백 제거로 초기 목록은 사용자 실행 대기)
  useEffect(() => {
    const loaded = getSavedNameBank(projectId);
    setBankItems(loaded);
    setGeneratedCandidates([]);
  }, [projectId]);

  // AI 서사 연산 작명 실행 (1/2순위 실패 시 3순위 로컬 폴백 없이 중앙 에러 공지 모달 호출)
  const handleGenerateAIClick = async () => {
    setIsGenerating(true);
    setPipelineStep('step1');

    try {
      const params = buildGenerateParams(batchCount);

      const res = await generateNamesWithAI(
        params,
        { provider: aiProvider, apiKey, groqApiKey },
        archiveItems,
        (step) => setPipelineStep(step)
      );

      setGeneratedCandidates(res.candidates);
    } catch (err: any) {
      console.error('AI Naming Engine Error:', err);
      const errorInfo = classifyNamingError(err);
      setCurrentError(errorInfo);
    } finally {
      setIsGenerating(false);
      setPipelineStep('idle');
    }
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

    // 아카이브 등록 시 보관함에 동일한 이름이 있다면 자동으로 보관함에서 제거
    const targetInBank = bankItems.find(item => item.name === candidate.name);
    if (targetInBank) {
      const updated = deleteNameBankItem(projectId, targetInBank.id);
      setBankItems(updated);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto bg-[#0E0F12] text-slate-100 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 메인 입력 캔버스 (자연어 서사 입력) */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 md:p-6 space-y-5 flex-1 flex-col gap-1 flex">
        {/* 카테고리 선택 & 세부 옵션 */}
        <div className="bg-[#121318]/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md">
          {/* 카테고리 필터 탭 */}
          <div className="pb-4 border-b border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-400 mb-3 pb-1">
              작명 대상 분야 카테고리 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
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
                    <span className="pl-2">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 세부 설정: 성별, 후보 개수, 보관함 열기 */}
          <div className={`grid grid-cols-1 ${selectedCategory === 'character' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 pt-3.5`}>
            {/* 성별 선택 */}
            {selectedCategory === 'character' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2.5 pb-1">
                  성별 어감 지정
                </label>
                <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
                  {(['all', 'male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-1 rounded-lg font-semibold transition-colors ${
                        gender === g ? 'bg-[#5E6AD2] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {g === 'all' ? '전체 성별' : g === 'male' ? '남성적 어감' : '여성적 어감'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 생성 후보군 개수 설정 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2.5 pb-1">
                생성 후보군 개수
              </label>
              <select
                value={batchCount}
                onChange={(e) => setBatchCount(Math.min(10, Math.max(1, parseInt(e.target.value, 10))))}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 h-[34px] focus:outline-none focus:border-[#5E6AD2] font-semibold transition-colors cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n}개</option>
                ))}
              </select>
            </div>

            {/* 보관함 열기 버튼 */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2.5 pb-1">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-4.5 h-4.5 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-100 pl-2">자연어 서사 묘사문 입력</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {keywords.length}자 입력됨
            </span>
          </div>

          {/* 서사 입력 텍스트 영역 */}
          <div className="pt-1">
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={5}
              placeholder="예: 야만인들의 신. 원시적인 신성함과 분노를 간직한 족장이자 거대한 신격체."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-[#5E6AD2] leading-relaxed placeholder:text-slate-600 resize-none font-medium"
            />
          </div>

          {/* 작명 생성 실행 및 에러 테스트 버튼 영역 */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* 에러 테스트 드롭다운 버튼 (종류별 에러 모달 화면 출력) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsErrorMenuOpen(prev => !prev)}
                className="flex items-center space-x-1.5 px-3 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-rose-300 hover:text-rose-200 text-xs font-semibold rounded-xl border border-rose-900/40 hover:border-rose-700/60 transition-all shadow-sm"
                title="에러 모달 화면 출력 테스트"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                <span>에러 메시지 테스트</span>
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
              </button>

              {/* 종류별 드롭다운 팝오버 */}
              {isErrorMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsErrorMenuOpen(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#161720] border border-slate-700/90 rounded-xl shadow-2xl py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3.5 py-2 text-[11px] font-bold text-slate-400 border-b border-slate-800">
                      화면 중앙에 띄울 에러 종류 선택
                    </div>
                    {TEST_ERROR_PRESETS.map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => {
                          setCurrentError(preset.error);
                          setIsErrorMenuOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800/80 flex items-center justify-between transition-colors"
                      >
                        <span className="font-medium">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* AI 서사 딥 작명 실행 버튼 */}
            <button
              type="button"
              onClick={handleGenerateAIClick}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#5E6AD2] hover:bg-[#7480E2] disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white mr-1.5 shrink-0" />
                  <span className="text-[12px] font-semibold pl-2">
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

      {/* 화면 중앙 에러 알림 모달 */}
      <NamingErrorModal
        error={currentError}
        onClose={() => setCurrentError(null)}
        onRetry={handleGenerateAIClick}
      />

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
