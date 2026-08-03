import { useState, useEffect } from 'react';
import type {
  ArchiveCategory,
  ArchiveItem,
  EnabledEngineSections,
  EraType,
  GenerateNameParams,
  MythologyEntry,
  NameBankItem,
  NameCandidate,
  NamingConstraint,
  SocialClassType,
  WorldbuildingRuleTag
} from '../types';
import { TargetCategorySelector } from './TargetCategorySelector';
import { WorldbuildingRuleModal } from './WorldbuildingRuleModal';
import { MythologyExplorer } from './MythologyExplorer';
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
  BookOpen,
  Bookmark,
  Key,
  Bot,
  Loader2,
  AlertCircle,
  FolderTree,
  FileText,
  RotateCcw
} from 'lucide-react';

interface NamingEngineHubProps {
  isDark?: boolean;
  projectId?: string;
  archiveItems?: ArchiveItem[];
  customTags?: string[];
  onAddArchiveItem?: (item: Omit<ArchiveItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function NamingEngineHub({
  isDark = true,
  projectId = 'default-project',
  archiveItems = [],
  onAddArchiveItem
}: NamingEngineHubProps) {
  // 3대 핵심 엔진 활성화/반영 체크 상태
  const [enabledSections, setEnabledSections] = useState<EnabledEngineSections>({
    tag: true,
    mythology: false,
    naturalLanguage: true
  });

  // 상단 탭 관리 ('tag' | 'mythology' | 'naturalLanguage')
  const [activeHeaderTab, setActiveHeaderTab] = useState<'tag' | 'mythology' | 'naturalLanguage'>('tag');

  // 기본 분야 카테고리
  const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory>('character');

  // 신규 핵심 축: 시대, 계층형 지역, 신분, 글자 수
  const [selectedEra, setSelectedEra] = useState<EraType>('중세');
  const [selectedMajorRegion, setSelectedMajorRegion] = useState<string>('');
  const [selectedSubRegion, setSelectedSubRegion] = useState<string>('');
  const [selectedSocialClass, setSelectedSocialClass] = useState<SocialClassType>('귀족/양반');
  const [lengthConstraint, setLengthConstraint] = useState<{ min: number; max: number }>({ min: 2, max: 6 });

  // 세계관 고유 규칙 태그 상태
  const [worldbuildingRuleTags, setWorldbuildingRuleTags] = useState<WorldbuildingRuleTag[]>(() => {
    try {
      const saved = localStorage.getItem(`noteandname_worldbuilding_tags_${projectId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [activeRuleTagIds, setActiveRuleTagIds] = useState<string[]>([]);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);

  // 설화/민담 선택 항목 상태
  const [selectedMythologyEntry] = useState<MythologyEntry | undefined>(undefined);

  // 자연어 키워드 & 제약 조건 상태
  const [keywords, setKeywords] = useState<string>('');
  const [constraints] = useState<NamingConstraint>({
    forbiddenSyllables: [],
    requiredSyllables: [],
    minLength: 2,
    maxLength: 6
  });

  // 실행 및 결과 수
  const [batchCount, setBatchCount] = useState<number>(10);
  const [isBankOpen, setIsBankOpen] = useState<boolean>(false);

  // AI API 상태
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState<string>(() => (
    (import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY2 || import.meta.env.VITE_GEMINI_API_KEY) : '') ||
    localStorage.getItem('novelflow_ai_api_key') || ''
  ));
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<'idle' | 'step1' | 'step2' | 'step3'>('idle');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // 결과 후보군 및 이름 뱅크
  const [generatedCandidates, setGeneratedCandidates] = useState<NameCandidate[]>([]);
  const [bankItems, setBankItems] = useState<NameBankItem[]>([]);

  // 파라미터 빌더
  const buildGenerateParams = (overrideCount?: number): GenerateNameParams => {
    return {
      targetCategory: selectedCategory,
      era: selectedEra,
      majorRegion: selectedMajorRegion,
      subRegion: selectedSubRegion,
      socialClass: selectedSocialClass,
      worldbuildingRuleTags,
      activeRuleTagIds,
      tagWeights: [],
      keywords,
      constraints: {
        ...constraints,
        minLength: lengthConstraint.min,
        maxLength: lengthConstraint.max
      },
      count: overrideCount || batchCount,
      gender: 'all',
      enabledSections,
      selectedMythologyEntry
    };
  };

  // 초기 로드 & 파라미터 변경 시 콤보 이름 자동 재생성
  useEffect(() => {
    const loaded = getSavedNameBank(projectId);
    setBankItems(loaded);
    const params = buildGenerateParams();
    const newList = generateNamesByCombo(params, archiveItems);
    setGeneratedCandidates(newList);
  }, [
    projectId,
    selectedCategory,
    selectedEra,
    selectedMajorRegion,
    selectedSubRegion,
    selectedSocialClass,
    activeRuleTagIds,
    lengthConstraint.min,
    lengthConstraint.max,
    enabledSections.tag,
    enabledSections.mythology,
    enabledSections.naturalLanguage
  ]);

  // 세계관 규칙 태그 핸들러
  const handleSaveRuleTag = (ruleTag: Omit<WorldbuildingRuleTag, 'id' | 'createdAt'>) => {
    const newTag: WorldbuildingRuleTag = {
      ...ruleTag,
      id: `wb-tag-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...worldbuildingRuleTags, newTag];
    setWorldbuildingRuleTags(updated);
    setActiveRuleTagIds(prev => [...prev, newTag.id]);
    try {
      localStorage.setItem(`noteandname_worldbuilding_tags_${projectId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRuleTag = (tagId: string) => {
    const updated = worldbuildingRuleTags.filter(t => t.id !== tagId);
    setWorldbuildingRuleTags(updated);
    setActiveRuleTagIds(prev => prev.filter(id => id !== tagId));
    try {
      localStorage.setItem(`noteandname_worldbuilding_tags_${projectId}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRuleTag = (tagId: string) => {
    setActiveRuleTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  // 수동 콤보 생성
  const handleGenerateComboClick = () => {
    const params = buildGenerateParams();
    const newList = generateNamesByCombo(params, archiveItems);
    setGeneratedCandidates(newList);
  };

  // AI 마이크로 파이프라인 생성
  const handleGenerateComboAI = async () => {
    setIsGenerating(true);
    setPipelineStep('step1');
    setFallbackNotice(null);

    const params = buildGenerateParams();

    const res = await generateNamesWithAI(
      params,
      { provider: aiProvider, apiKey },
      archiveItems,
      (step) => setPipelineStep(step)
    );

    setGeneratedCandidates(res.candidates);

    if (res.isFallbackUsed && res.fallbackReason) {
      setFallbackNotice(res.fallbackReason);
    }
    setIsGenerating(false);
    setPipelineStep('idle');
  };

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('novelflow_ai_api_key', newKey);
    setIsKeyModalOpen(false);
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
      summary: candidate.meaning || '작명 엔진에서 아카이브로 등록된 항목',
      description: `[작명 출처]: ${candidate.meaning || ''} ${candidate.originStoryTitle ? `(원전: ${candidate.originStoryTitle})` : ''}`,
      tags: candidate.tags || [selectedEra, selectedSubRegion || '무작위'].filter(Boolean) as string[],
      attributes: []
    });
  };

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto bg-[#0E0F12] text-slate-100 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* 최상단 3대 엔진 메인 헤더 (개별 ON/OFF 체크박스 포함) */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-[#121318]/95 border-b border-white/[0.08] p-4 sticky top-0 z-30 backdrop-blur-md space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 타이틀 및 활성 엔진 요약 */}
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#5E6AD2]" />
              <span>웹소설 맞춤 작명 허브 (Simplified Naming Engine)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              시대·지역 계층, 세계관 고유 규칙, 신화/민담, 자연어 서사를 자유롭게 조합하여 이름을 창작하세요.
            </p>
          </div>

          {/* 생성 버튼 그룹 */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* AI Provider 선택 */}
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setAiProvider('gemini')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  aiProvider === 'gemini' ? 'bg-[#5E6AD2] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini
              </button>
              <button
                type="button"
                onClick={() => setAiProvider('openai')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  aiProvider === 'openai' ? 'bg-[#5E6AD2] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => setAiProvider('local')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                  aiProvider === 'local' ? 'bg-[#5E6AD2] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Local
              </button>
            </div>

            <button
              onClick={handleGenerateComboClick}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#5E6AD2] hover:bg-[#505cb8] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>🎲 콤보 작명</span>
            </button>

            <button
              onClick={handleGenerateComboAI}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-[#5E6AD2] hover:from-violet-500 hover:to-[#505cb8] text-white text-xs font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bot className="w-3.5 h-3.5" />
              )}
              <span>✨ AI 작명</span>
            </button>

            {isGenerating && (
              <span className="text-[11px] text-violet-300 font-semibold animate-pulse">
                {pipelineStep === 'step1' && '1단계: 서사 분석 중...'}
                {pipelineStep === 'step2' && '2단계: 정제 중...'}
                {pipelineStep === 'step3' && '3단계: AI 창작 중...'}
              </span>
            )}

            <button
              onClick={() => setIsBankOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#5E6AD2]" />
              <span>보관함 ({bankItems.length})</span>
            </button>
          </div>
        </div>

        {/* 3대 헤더 항목 탭 & 독립 체크박스 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* 1. 태그 조합 모드 (시대/지역/신분/세계관 규칙) */}
          <div
            onClick={() => setActiveHeaderTab('tag')}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              activeHeaderTab === 'tag'
                ? 'bg-[#5E6AD2]/15 border-[#5E6AD2]/60 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FolderTree className={`w-4 h-4 ${activeHeaderTab === 'tag' ? 'text-[#5E6AD2]' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold">1. 태그 조합 (시대·지역·규칙)</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">시대, 가변지역, 신분, 내 세계관 태그</div>
              </div>
            </div>
            <label
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 text-xs cursor-pointer select-none bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 hover:border-[#5E6AD2]/50"
            >
              <input
                type="checkbox"
                checked={enabledSections.tag}
                onChange={(e) => setEnabledSections(prev => ({ ...prev, tag: e.target.checked }))}
                className="rounded border-slate-700 text-[#5E6AD2] focus:ring-0 w-3.5 h-3.5"
              />
              <span className={`text-[11px] font-semibold ${enabledSections.tag ? 'text-indigo-300' : 'text-slate-500'}`}>
                {enabledSections.tag ? '반영ON' : '미반영'}
              </span>
            </label>
          </div>

          {/* 2. 설화/민담 모드 (신화 RAG) */}
          <div
            onClick={() => setActiveHeaderTab('mythology')}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              activeHeaderTab === 'mythology'
                ? 'bg-purple-950/40 border-purple-500/60 text-purple-100 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <BookOpen className={`w-4 h-4 ${activeHeaderTab === 'mythology' ? 'text-purple-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold">2. 설화 / 민담 RAG</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">신화 전승 RAG 탐색 &amp; 파생 작명</div>
              </div>
            </div>
            <label
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 text-xs cursor-pointer select-none bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 hover:border-purple-500/50"
            >
              <input
                type="checkbox"
                checked={enabledSections.mythology}
                onChange={(e) => setEnabledSections(prev => ({ ...prev, mythology: e.target.checked }))}
                className="rounded border-slate-700 text-purple-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span className={`text-[11px] font-semibold ${enabledSections.mythology ? 'text-purple-300' : 'text-slate-500'}`}>
                {enabledSections.mythology ? '반영ON' : '미반영'}
              </span>
            </label>
          </div>

          {/* 3. 자연어 & 서사 입력 모드 */}
          <div
            onClick={() => setActiveHeaderTab('naturalLanguage')}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
              activeHeaderTab === 'naturalLanguage'
                ? 'bg-sky-950/40 border-sky-500/60 text-sky-100 shadow-md'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className={`w-4 h-4 ${activeHeaderTab === 'naturalLanguage' ? 'text-sky-400' : 'text-slate-500'}`} />
              <div>
                <div className="text-xs font-bold">3. 자연어 서사 입력</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">자유 서사 묘사 &amp; 인물 설정 키워드</div>
              </div>
            </div>
            <label
              onClick={(e) => e.stopPropagation()}
              className="flex items-center space-x-1 text-xs cursor-pointer select-none bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800 hover:border-sky-500/50"
            >
              <input
                type="checkbox"
                checked={enabledSections.naturalLanguage}
                onChange={(e) => setEnabledSections(prev => ({ ...prev, naturalLanguage: e.target.checked }))}
                className="rounded border-slate-700 text-sky-600 focus:ring-0 w-3.5 h-3.5"
              />
              <span className={`text-[11px] font-semibold ${enabledSections.naturalLanguage ? 'text-sky-300' : 'text-slate-500'}`}>
                {enabledSections.naturalLanguage ? '반영ON' : '미반영'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 메인 콘텐츠 영역: 선택된 헤더 탭 뷰 노출 */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 md:p-6 space-y-6 flex-1">
        {/* 폴백 알림 바 */}
        {fallbackNotice && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{fallbackNotice}</span>
            </div>
            {!apiKey && (
              <button
                onClick={() => setIsKeyModalOpen(true)}
                className="text-[11px] underline text-amber-300 font-semibold ml-2"
              >
                API Key 입력하기
              </button>
            )}
          </div>
        )}

        {/* 탭 1: 태그 조합 (시대/지역/신분/글자수/세계관 태그) */}
        {activeHeaderTab === 'tag' && (
          <div className="space-y-4">
            <TargetCategorySelector
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedEra={selectedEra}
              onSelectEra={setSelectedEra}
              selectedMajorRegion={selectedMajorRegion}
              selectedSubRegion={selectedSubRegion}
              onSelectRegion={(maj, sub) => {
                setSelectedMajorRegion(maj);
                setSelectedSubRegion(sub);
              }}
              selectedSocialClass={selectedSocialClass}
              onSelectSocialClass={setSelectedSocialClass}
              lengthConstraint={lengthConstraint}
              onChangeLengthConstraint={(min, max) => setLengthConstraint({ min, max })}
              worldbuildingRuleTags={worldbuildingRuleTags}
              activeRuleTagIds={activeRuleTagIds}
              onToggleRuleTag={handleToggleRuleTag}
              onDeleteRuleTag={handleDeleteRuleTag}
              onOpenRuleModal={() => setIsRuleModalOpen(true)}
            />
          </div>
        )}

        {/* 탭 2: 설화/민담 탐색 (신화 RAG) */}
        {activeHeaderTab === 'mythology' && (
          <div className="bg-[#121318]/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-purple-200">신화 · 설화 · 민담 RAG 탐색기</h3>
            </div>
            <MythologyExplorer
              archiveItems={archiveItems}
              onSaveToBank={handleSaveToBank}
            />
          </div>
        )}

        {/* 탭 3: 자연어 서사 입력 */}
        {activeHeaderTab === 'naturalLanguage' && (
          <div className="bg-[#121318]/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-sky-200">자연어 서사 &amp; 인물 키워드 입력</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                자유 서사 묘사문 입력
              </label>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                rows={4}
                placeholder="예: 북부 설원에서 늑대의 구원을 받아 태어난 냉혹하고 고독한 암살자. 차가운 눈보라 어감과 칼바람의 룬 문양 조합."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 focus:outline-none focus:border-[#5E6AD2] leading-relaxed placeholder:text-slate-600 resize-none font-medium"
              />
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                입력하신 자연어 서사에서 상징 키워드, 어감, 정서 및 룬 문양 토큰이 추출되어 작명 연산에 반영됩니다.
              </p>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* 생성 결과 목록 (항상 하단에 노출) */}
        {/* ------------------------------------------------------------------ */}
        <NameResultList
          candidates={generatedCandidates}
          batchCount={batchCount}
          onChangeBatchCount={(cnt: number) => {
            setBatchCount(cnt);
            const params = buildGenerateParams(cnt);
            const newList = generateNamesByCombo(params, archiveItems);
            setGeneratedCandidates(newList);
          }}
          onSaveToBank={handleSaveToBank}
          onAddToArchive={handleAddToArchive}
        />
      </div>

      {/* 세계관 규칙 등록 모달 */}
      <WorldbuildingRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSaveRuleTag={handleSaveRuleTag}
        initialEra={selectedEra}
      />

      {/* LLM API Key 설정 모달 */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121318] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-[#5E6AD2]" />
              <h3 className="text-sm font-bold text-slate-100">LLM AI API Key 설정</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini API Key 또는 OpenAI API Key를 입력하세요. API Key는 브라우저 보안 저장소에 보관됩니다.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                API Key 입력 (Gemini / OpenAI)
              </label>
              <input
                type="password"
                placeholder="AIzaSy... 또는 sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#5E6AD2] font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={() => handleSaveApiKey(apiKey)}
                className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#505cb8] text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이름 뱅크 & 자모 검사 Drawer 모달 */}
      <NameBankDrawer
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        bankItems={bankItems}
        onUpdateStatus={handleUpdateBankStatus}
        onDeleteItem={handleDeleteBankItem}
        onRegisterArchive={(name: string, cat: ArchiveCategory, meaning: string) => {
          handleAddToArchive({ name, meaning, similarity: 0, category: cat }, cat);
        }}
        isDark={isDark}
        archiveItems={archiveItems}
      />
    </div>
  );
}

export default NamingEngineHub;
