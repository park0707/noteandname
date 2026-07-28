import { useState, useEffect } from 'react';
import type {
  ArchiveCategory,
  ArchiveItem,
  GenerateNameParams,
  NameBankItem,
  NameCandidate,
  NamingConstraint,
  TagWeight
} from '../types';
import { TargetCategorySelector } from './TargetCategorySelector';
import { TagComboPanel } from './TagComboPanel';
import { MythologyExplorer } from './MythologyExplorer';
import { HanjaComboPanel } from './HanjaComboPanel';
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
import JamoFilter from '../JamoFilter';
import { Sparkles, BookOpen, Scroll, ShieldCheck, Bookmark, Wand2, Key, Bot, Loader2, AlertCircle } from 'lucide-react';

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
  customTags = [],
  onAddArchiveItem
}: NamingEngineHubProps) {
  const [activeTab, setActiveTab] = useState<'combo' | 'mythology' | 'hanja' | 'jamo'>('combo');
  const [selectedCategory, setSelectedCategory] = useState<ArchiveCategory>('character');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('sub-char-1');
  const [batchCount, setBatchCount] = useState<number>(10);
  const [isBankOpen, setIsBankOpen] = useState<boolean>(false);

  // AI API 및 모델 상태
  const [aiProvider, setAiProvider] = useState<AIProvider>('gemini');
  const [apiKey, setApiKey] = useState<string>(() => (
    (import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY2 || import.meta.env.VITE_GEMINI_API_KEY) : '') ||
    localStorage.getItem('novelflow_ai_api_key') || ''
  ));
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<'idle' | 'step1' | 'step2' | 'step3'>('idle');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // 태그 및 제약조건 상태
  const [tagWeights, setTagWeights] = useState<TagWeight[]>([
    { tagId: 't-1', label: '판타지', groupKey: 'genre', weight: 1.0 },
    { tagId: 't-2', label: '서양', groupKey: 'culture', weight: 1.0 },
    { tagId: 't-3', label: '주인공', groupKey: 'trait', weight: 1.0 }
  ]);
  const [keywords, setKeywords] = useState<string>('');
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all');
  const [constraints, setConstraints] = useState<NamingConstraint>({
    forbiddenSyllables: [],
    requiredSyllables: [],
    minLength: 2,
    maxLength: 6
  });

  // 생성 결과 목록 및 보관함 목록
  const [generatedCandidates, setGeneratedCandidates] = useState<NameCandidate[]>([]);
  const [bankItems, setBankItems] = useState<NameBankItem[]>([]);

  // 초기 보관함 데이터 로드 및 초기 이름 자동 생성
  useEffect(() => {
    const loaded = getSavedNameBank(projectId);
    setBankItems(loaded);

    // 초기 태그 조합으로 첫 이름 자동 생성
    const initialParams: GenerateNameParams = {
      targetCategory: selectedCategory,
      subtype: selectedSubtype,
      tagWeights,
      keywords,
      constraints,
      count: batchCount,
      gender
    };
    const initialList = generateNamesByCombo(initialParams, archiveItems);
    setGeneratedCandidates(initialList);
  }, [projectId]);

  // 카테고리 변경 시 재생성
  const handleSelectCategory = (category: ArchiveCategory) => {
    setSelectedCategory(category);
    const params: GenerateNameParams = {
      targetCategory: category,
      subtype: selectedSubtype,
      tagWeights,
      keywords,
      constraints,
      count: batchCount,
      gender
    };
    const newList = generateNamesByCombo(params, archiveItems);
    setGeneratedCandidates(newList);
  };

  // 세부유형 변경 시 재생성
  const handleSelectSubtype = (subtypeId: string) => {
    setSelectedSubtype(subtypeId);
    const params: GenerateNameParams = {
      targetCategory: selectedCategory,
      subtype: subtypeId,
      tagWeights,
      keywords,
      constraints,
      count: batchCount,
      gender
    };
    const newList = generateNamesByCombo(params, archiveItems);
    setGeneratedCandidates(newList);
  };

  // 태그 조합 + 자연어 서사 3단계 마이크로 AI 파이프라인 작명 실행
  const handleGenerateCombo = async () => {
    setIsGenerating(true);
    setPipelineStep('step1');
    setFallbackNotice(null);

    const params: GenerateNameParams = {
      targetCategory: selectedCategory,
      subtype: selectedSubtype,
      tagWeights,
      keywords,
      constraints,
      count: batchCount,
      gender
    };

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

  // 이름 뱅크 보관함 저장
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

  // 아카이브(ArchiveManager) 신규 등록
  const handleAddToArchive = (candidate: NameCandidate, cat: ArchiveCategory) => {
    if (onAddArchiveItem) {
      onAddArchiveItem({
        projectId,
        name: candidate.name,
        category: cat,
        summary: candidate.meaning,
        description: `작명 엔진(${activeTab} 모드)에서 생성 및 확정된 ${cat} 항목입니다.`,
        tags: candidate.tags || [selectedCategory],
        attributes: candidate.matchItem ? [{ key: '유사도경고대조', value: candidate.matchItem }] : []
      });
    }

    // 이름 뱅크 상태도 'used'로 변경
    handleSaveToBank(candidate);
  };

  // 보관함 항목 상태 갱신/삭제
  const handleUpdateBankStatus = (itemId: string, status: 'saved' | 'used' | 'discarded') => {
    const updated = updateNameBankStatus(projectId, itemId, status);
    setBankItems(updated);
  };

  const handleDeleteBankItem = (itemId: string) => {
    const updated = deleteNameBankItem(projectId, itemId);
    setBankItems(updated);
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 ${isDark ? 'bg-[#090A0F] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* 작명 엔진 최상단 헤더 */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-4 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Wand2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              노벨플로우 AI 작명 엔진 (Naming Engine Hub)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              계층형 태그 조합 + 자연어 서사 요구사항 → LLM API (Structured Output) 실시간 생성
            </p>
          </div>
        </div>

        {/* AI 엔진 선택 & API Key 설정 & 이름 뱅크 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 3단계 파이프라인 진행 상태 배지 */}
          {isGenerating && (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-950/90 border border-indigo-500/60 rounded-xl text-indigo-300 text-xs font-semibold shadow-lg animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>
                {pipelineStep === 'step1' && '1단계: 자연어 백스토리 상징 분석 중...'}
                {pipelineStep === 'step2' && '2단계: 태그 & 어감 제약 정제 중...'}
                {pipelineStep === 'step3' && '3단계: AI 최종 고유명사 및 서사 창작 중...'}
              </span>
            </div>
          )}

          {/* AI 모델 셀렉터 */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
            <Bot className="w-4 h-4 text-indigo-400" />
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as AIProvider)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="gemini" className="bg-slate-900 text-slate-200">Google Gemini 2.0 Flash (기본/초고속)</option>
              <option value="groq" className="bg-slate-900 text-slate-200">Groq LPU Qwen 2.5 (초당 500토큰 무료)</option>
              <option value="openai" className="bg-slate-900 text-slate-200">OpenAI GPT-4o-mini (웹소설 감성)</option>
              <option value="local" className="bg-slate-900 text-slate-200">100% 무제한 로컬 조합 엔진 (오프라인/0원)</option>
            </select>
          </div>

          {/* API Key 설정 버튼 */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              apiKey ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-amber-950/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{apiKey ? 'API Key 설정됨' : 'API Key 입력'}</span>
          </button>

          {/* 이름 뱅크 버튼 */}
          <button
            onClick={() => setIsBankOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Bookmark className="w-4 h-4" />
            <span>이름 뱅크 ({bankItems.length})</span>
          </button>
        </div>
      </div>

      {/* 폴백 알림 바 (API Key 미설정 또는 오류 발생 시) */}
      {fallbackNotice && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-amber-200">
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

      {/* API Key 입력 팝업 모달 */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">LLM AI API Key 설정</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Google Gemini API Key 또는 OpenAI API Key를 입력하세요. API Key는 브라우저 보안 영구 저장소에 안전하게 보관되며, 서버로 유출되지 않습니다. 미입력 시 로컬 조합 엔진으로 작동합니다.
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
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-100 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleSaveApiKey(apiKey)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 대상 카테고리 & 세부유형 선택자 (2단 레이아웃) */}
      <TargetCategorySelector
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        selectedSubtype={selectedSubtype}
        onSelectSubtype={handleSelectSubtype}
      />

      {/* 2. 서브 엔진 탭 메인 툴바 */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('combo')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
            activeTab === 'combo'
              ? 'bg-slate-900 border-indigo-500/60 text-indigo-300 border-b-2 border-b-indigo-500 shadow-lg'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>1. 계층 태그 조합 작명</span>
        </button>

        <button
          onClick={() => setActiveTab('mythology')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
            activeTab === 'mythology'
              ? 'bg-slate-900 border-purple-500/60 text-purple-300 border-b-2 border-b-purple-500 shadow-lg'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>2. 설화·전승 RAG 탐색기</span>
        </button>

        <button
          onClick={() => setActiveTab('hanja')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
            activeTab === 'hanja'
              ? 'bg-slate-900 border-amber-500/60 text-amber-300 border-b-2 border-b-amber-500 shadow-lg'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scroll className="w-4 h-4 text-amber-400" />
          <span>3. 무협·동양 한자 조합</span>
        </button>

        <button
          onClick={() => setActiveTab('jamo')}
          className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition-all ${
            activeTab === 'jamo'
              ? 'bg-slate-900 border-emerald-500/60 text-emerald-300 border-b-2 border-b-emerald-500 shadow-lg'
              : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>4. 정밀 자모 검사 (Jamo)</span>
        </button>
      </div>

      {/* 3. 탭별 메인 컨텐츠 영역 */}
      <div>
        {activeTab === 'combo' && (
          <TagComboPanel
            selectedCategory={selectedCategory}
            selectedSubtype={selectedSubtype}
            tagWeights={tagWeights}
            onChangeTagWeights={setTagWeights}
            constraints={constraints}
            onChangeConstraints={setConstraints}
            customTags={customTags}
            onGenerate={handleGenerateCombo}
            keywords={keywords}
            onChangeKeywords={setKeywords}
            gender={gender}
            onChangeGender={setGender}
          />
        )}

        {activeTab === 'mythology' && (
          <MythologyExplorer
            archiveItems={archiveItems}
            onSaveToBank={handleSaveToBank}
          />
        )}

        {activeTab === 'hanja' && (
          <HanjaComboPanel
            archiveItems={archiveItems}
            onSaveToBank={handleSaveToBank}
          />
        )}

        {activeTab === 'jamo' && (
          <JamoFilter
            isDark={isDark}
            relationNodes={archiveItems.map(item => ({
              id: item.id,
              name: item.name,
              x: 0,
              y: 0,
              color: '#5E6AD2',
              role: item.category
            }))}
          />
        )}
      </div>

      {/* 4. 생성 결과 공통 리스트 (자모 유사도 경고 배지 + 아카이브 연동) */}
      {activeTab !== 'jamo' && (
        <NameResultList
          candidates={generatedCandidates}
          batchCount={batchCount}
          onChangeBatchCount={(cnt: number) => {
            setBatchCount(cnt);
            const params: GenerateNameParams = {
              targetCategory: selectedCategory,
              tagWeights,
              keywords,
              constraints,
              count: cnt,
              gender
            };
            const newList = generateNamesByCombo(params, archiveItems);
            setGeneratedCandidates(newList);
          }}
          onSaveToBank={handleSaveToBank}
          onAddToArchive={handleAddToArchive}
        />
      )}

      {/* 5. 이름 뱅크 보관함 Drawer 모달 */}
      <NameBankDrawer
        isOpen={isBankOpen}
        onClose={() => setIsBankOpen(false)}
        bankItems={bankItems}
        onUpdateStatus={handleUpdateBankStatus}
        onDeleteItem={handleDeleteBankItem}
        onRegisterArchive={(name: string, cat: ArchiveCategory, meaning: string) => {
          handleAddToArchive({ name, meaning, similarity: 0, category: cat }, cat);
        }}
      />
    </div>
  );
}

export default NamingEngineHub;
