import { calculateSimilarity } from '../components/workspace/utils';
import type {
  ArchiveItem,
  GenerateNameParams,
  NameCandidate,
  TagWeight
} from '../components/workspace/types';
import { CATEGORY_SUBTYPES } from '../data/tag_taxonomy_seeds';
import { executeMultiAiChain } from './multiAiService';

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'local';

export interface AIOptions {
  provider: AIProvider;
  apiKey?: string;
  groqApiKey?: string;
}

export interface ParsedNarrativeContext {
  symbolicTokens: string[];
  emotionalMood: string[];
  characterArchetype: string;
}

export interface ResolvedNamingContext {
  targetCategory: string;
  subtypeName?: string;
  era?: string;
  majorRegion?: string;
  subRegion?: string;
  socialClass?: string;
  worldbuildingRules?: string[];
  mythologyStoryTitle?: string;
  mythologyCharacterName?: string;
  enabledSections?: { tag: boolean; mythology: boolean; naturalLanguage: boolean };
  cleanTagWeights: TagWeight[];
  symbolicTokens: string[];
  phoneticRules: string[];
  narrativeSummary: string;
}

// ============================================================================
// 1. [Step 1] 자연어 서사 해석기 (Narrative Parser)
// ============================================================================

const SYMBOL_PATTERN = /용|드래곤|화염|불꽃|불사|검|마법|칠흑|어둠|빛|성스러운|저주|빙결|바람|뇌전|벼락|거인|괴수|용병|기사|마왕|엘프|하이엘프|다크엘프|드워프|하프링|수인|마족|천사|신족|흡혈귀|뱀파이어|언데드|리치|네크로맨서|성좌|헌터|아카데미|스트리머|인방|셰프|수전노|얀데레|츤데레|후회|집착|피폐|TS|선협|무협|악녀|빙의/g;

export function parseNarrativePrompt(keywords: string): ParsedNarrativeContext {
  if (!keywords || !keywords.trim()) {
    return { symbolicTokens: [], emotionalMood: [], characterArchetype: '기본' };
  }

  const text = keywords.trim();
  const tokens: string[] = [];
  const moods: string[] = [];

  // 핵심 상징어 키워드 매칭
  const matches = text.match(SYMBOL_PATTERN);
  if (matches) {
    matches.forEach(m => {
      if (!tokens.includes(m)) tokens.push(m);
    });
  }

  // 매칭 패턴 외의 사용자 자유 입력 어휘 토큰 추출 (조사 제거)
  const rawWords = text.split(/[\s,.;:'"()!?~]+/).filter(w => w.length >= 1);
  const stopSuffixes = /(들의|에서|과의|적인|으로|부터|하고|있는|처럼|같이|에게|[은는이가을를의과와])$/;
  rawWords.forEach(w => {
    const stripped = w.replace(stopSuffixes, '');
    if (stripped.length >= 1 && !tokens.includes(stripped)) {
      tokens.push(stripped);
    }
  });

  // 정서/무드 추출 패턴 (웹소설 정서 확장)
  if (/비운|괴로움|슬픔|비극|잔혹|냉혹/i.test(text)) moods.push('비운/냉혹');
  if (/신성|성스러운|고귀|우아|신력|신격|신/i.test(text)) moods.push('신성/고귀/신격');
  if (/파괴|광기|분노|강렬|야만|원시|족장/i.test(text)) moods.push('파괴/야만/강렬');
  if (/음산|음침|저주|다크/i.test(text)) moods.push('다크/음산');
  if (/얀데레|집착|후회|피폐/i.test(text)) moods.push('집착/피폐/후회');
  if (/유쾌|사이다|코미디|착각/i.test(text)) moods.push('유쾌/사이다');

  return {
    symbolicTokens: tokens.length > 0 ? tokens : [text.slice(0, 15)],
    emotionalMood: moods.length > 0 ? moods : [text],
    characterArchetype: tokens.length > 0 ? tokens[0] : '자연어 서사'
  };
}

// ============================================================================
// 2. [Step 2] 태그 & 세부유형 구조화 정제기 (Taxonomy Resolver)
// ============================================================================

export function resolveTaxonomyAndPhonetics(
  params: GenerateNameParams,
  parsedContext: ParsedNarrativeContext
): ResolvedNamingContext {
  const {
    targetCategory,
    subtype,
    customCategory,
    era = '중세',
    majorRegion,
    subRegion,
    socialClass = '귀족/양반',
    worldbuildingRuleTags = [],
    activeRuleTagIds = [],
    selectedMythologyEntry,
    enabledSections,
    tagWeights,
    constraints
  } = params;

  const subtypeObj = subtype
    ? (CATEGORY_SUBTYPES[targetCategory] || []).find(s => s.id === subtype)
    : undefined;

  // 상충되는 태그 자동 정제 및 어감 제약 조율
  const cleanTagWeights = tagWeights.filter(t => t.weight > 0.2);

  const phoneticRules: string[] = [];
  if (constraints?.forbiddenSyllables.length) {
    phoneticRules.push(`금지음절: ${constraints.forbiddenSyllables.join(', ')}`);
  }
  if (constraints?.requiredSyllables.length) {
    phoneticRules.push(`필수음절: ${constraints.requiredSyllables.join(', ')}`);
  }
  if (constraints?.minLength || constraints?.maxLength) {
    phoneticRules.push(`길이범위: ${constraints?.minLength || 2}~${constraints?.maxLength || 6}자`);
  }

  // customCategory가 있으면 세부유형(subtypeName)으로 취급, targetCategory는 원래 값 유지
  const resolvedSubtypeName = customCategory
    ? customCategory
    : subtypeObj?.name;

  const wbRules: string[] = [];
  const activeRuleTags = worldbuildingRuleTags.filter(t => activeRuleTagIds.includes(t.id));
  activeRuleTags.forEach(tag => {
    let ruleDesc = `규칙태그 [${tag.name}]`;
    if (tag.customRulesPrompt) ruleDesc += `: ${tag.customRulesPrompt}`;
    wbRules.push(ruleDesc);
  });

  return {
    targetCategory,
    subtypeName: resolvedSubtypeName,
    era,
    majorRegion,
    subRegion,
    socialClass,
    worldbuildingRules: wbRules,
    mythologyStoryTitle: selectedMythologyEntry?.storyTitle,
    mythologyCharacterName: selectedMythologyEntry?.characterName,
    enabledSections,
    cleanTagWeights,
    symbolicTokens: parsedContext.symbolicTokens,
    phoneticRules,
    narrativeSummary: parsedContext.emotionalMood.join(', ')
  };
}

// ============================================================================
// 3. [Step 3] LLM 프롬프트 생성 헬퍼
// ============================================================================

function buildPipelinePrompt(
  resolvedContext: ResolvedNamingContext,
  count: number = 8
): string {
  const {
    targetCategory,
    subtypeName,
    era,
    majorRegion,
    subRegion,
    socialClass,
    worldbuildingRules,
    mythologyStoryTitle,
    mythologyCharacterName,
    enabledSections,
    symbolicTokens,
    phoneticRules,
    narrativeSummary
  } = resolvedContext;

  const isEnglishExplicitlyRequested = /영어|알파벳|english|latin|로마자|영문/i.test(
    (narrativeSummary || '') + ' ' + (symbolicTokens.join(' ')) + ' ' + (subtypeName || '')
  );

  const languageGuideline = isEnglishExplicitlyRequested
    ? `- [표기 언어 규칙]: 사용자가 영어/알파벳/로마자 표기를 요구하였으므로 영문/알파벳 표기를 반영하세요.`
    : `- [표기 언어 엄격 규칙 (필수 준수)]: 사용자가 영어 표기를 명시적으로 요구하지 않았으므로 **이름(name)과 의미(meaning)는 100% 한글(Pure Korean)로만 작명**해야 합니다. '마르케llu스' 처럼 영문 알파벳이 섞이는 현상을 엄격히 금지합니다.`;

  const sectionsList: string[] = [];
  if (!enabledSections || enabledSections.tag) {
    sectionsList.push(`- 시대/지역/신분: 시대=[${era || '중세'}], 문화권/지역=[${subRegion || majorRegion || '무작위'}], 신분=[${socialClass || '귀족'}]`);
    if (subtypeName) sectionsList.push(`- 세부유형: ${subtypeName}`);
    if (worldbuildingRules && worldbuildingRules.length > 0) {
      sectionsList.push(`- 사용자 세계관 규칙 태그: ${worldbuildingRules.join(' | ')}`);
    }
  }

  if (enabledSections?.mythology && (mythologyStoryTitle || mythologyCharacterName)) {
    sectionsList.push(`- 설화/민담 원전: 출처=[${mythologyStoryTitle || '신화'}], 인물/존재=[${mythologyCharacterName || '원전'}] 기반 파생 이름`);
  }

  if (!enabledSections || enabledSections.naturalLanguage) {
    if (symbolicTokens.length > 0) sectionsList.push(`- 추출된 핵심 상징어: ${symbolicTokens.join(', ')}`);
    if (narrativeSummary) sectionsList.push(`- 서사 정서/무드: ${narrativeSummary}`);
  }

  if (phoneticRules.length > 0) {
    sectionsList.push(`- 음성 및 음절 제약: ${phoneticRules.join(' | ')}`);
  }

  return `
당신은 대한민국 최고의 웹소설/판타지/무협 전문 AI 작명가입니다.
요구사항을 완벽히 만족하는 고품질 베스트 고유명사 **정확히 ${count}개**를 생성하세요.

[활성화된 작명 입력 데이터]
- 대상 분야 카테고리: ${targetCategory}
${sectionsList.join('\n')}

${languageGuideline}

[출력 지침 - 초고속 간결 응답]
1. ${count}개의 고유명사를 창작하세요 (단순 유명 인물 베끼기 배제).
2. 각 후보마다 name(이름), meaning(어원 및 서사적 의미, 1~2문장으로 명확히), storySnippet(서사 힌트, 1문장), tags(연관 태그 배열)를 응답하세요.
3. 부연 설명이나 사고 과정 서술 없이, 오직 요청된 JSON Array 규격만 즉시 반환하세요.
`;
}

// ============================================================================
// 4. 3단계 마이크로 파이프라인 통합 작명 서비스 함수 (5단계 무제한 멀티 AI 연동)
// ============================================================================

export async function generateNamesWithAI(
  params: GenerateNameParams,
  options: AIOptions,
  archiveItems: ArchiveItem[] = [],
  onStepProgress?: (step: 'step1' | 'step2' | 'step3') => void
): Promise<{ candidates: NameCandidate[]; isFallbackUsed: boolean; fallbackReason?: string }> {
  const { provider: _provider } = options;
  const effectiveApiKey = options.apiKey || (import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY2 || import.meta.env.VITE_GEMINI_API_KEY) : undefined) || localStorage.getItem('novelflow_ai_api_key') || undefined;
  const effectiveGroqKey = options.groqApiKey || (import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : undefined) || localStorage.getItem('novelflow_groq_api_key') || undefined;

  // --------------------------------------------------------------------------
  // [Step 1] 자연어 서사 해석 (Narrative Parsing)
  // --------------------------------------------------------------------------
  if (onStepProgress) onStepProgress('step1');
  const parsedNarrative = parseNarrativePrompt(params.keywords || '');

  // --------------------------------------------------------------------------
  // [Step 2] 태그 & 세부유형 구조화 정제 (Taxonomy & Phonetics Resolving)
  // --------------------------------------------------------------------------
  if (onStepProgress) onStepProgress('step2');
  const resolvedContext = resolveTaxonomyAndPhonetics(params, parsedNarrative);

  // --------------------------------------------------------------------------
  // [Step 3] 최종 작명 & 서사 합성 (Master Synthesizing)
  // --------------------------------------------------------------------------
  if (onStepProgress) onStepProgress('step3');

  // 1) 클라우드 API Key가 하나도 없는 경우 -> 에러 전달 (3순위 로컬 폴백 제거)
  if (!effectiveApiKey && !effectiveGroqKey) {
    throw new Error('Google AI Studio 또는 Groq API 키가 설정되지 않았습니다. API 키를 등록해 주세요.');
  }

  try {
    const prompt = buildPipelinePrompt(resolvedContext, params.count || 8);
    const systemInstruction = '당신은 대한민국 최고의 웹소설/판타지/무협 전문 AI 작명가입니다. 제시된 요구사항을 완벽히 이행하여 JSON 배열로 응답하세요.';

    const res = await executeMultiAiChain<{ name: string; meaning: string; tags?: string[]; storySnippet?: string }[]>(
      prompt,
      systemInstruction,
      (rawText: string) => {
        const parsed = JSON.parse(rawText);
        return Array.isArray(parsed) ? parsed : (parsed.names || parsed.items || parsed.candidates || []);
      }
    );

    const isEnglishExplicitlyRequested = /영어|알파벳|english|latin|로마자|영문/i.test(params.keywords || '');

    const candidates: NameCandidate[] = res.data.map((item, idx) => {
      let candidateName = (item.name || '').trim();
      const candidateMeaning = (item.meaning || '').trim() + (item.storySnippet ? ` (서사: ${item.storySnippet})` : '');

      if (!isEnglishExplicitlyRequested) {
        // 만약 한글과 영문 알파벳이 어색하게 섞인 경우 (예: "마르케llu스") -> 알파벳 제거 후 정리
        if (/[가-힣]/.test(candidateName) && /[a-zA-Z]/.test(candidateName)) {
          candidateName = candidateName.replace(/[a-zA-Z]/g, '').trim();
        }
      }

      let maxSimilarity = 0;
      let matchItemName = '';

      for (const ai of archiveItems) {
        const sim = calculateSimilarity(candidateName, ai.name);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          matchItemName = ai.name;
        }
      }

      return {
        id: `ai-${res.providerName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}-${idx}`,
        name: candidateName,
        meaning: candidateMeaning,
        similarity: maxSimilarity,
        matchItem: maxSimilarity >= 75 ? matchItemName : undefined,
        category: params.targetCategory,
        subtype: params.subtype,
        tags: item.tags || [params.targetCategory]
      };
    });

    return {
      candidates,
      isFallbackUsed: res.isFallbackUsed,
      fallbackReason: res.isFallbackUsed ? `연동 모델: ${res.providerName}` : undefined
    };
  } catch (error: any) {
    console.error('All AI Providers (Gemini / Groq) failed:', error);
    // 3순위 로컬 콤보 폴백 제거: 실패 시 로컬 엔진으로 대체하지 않고 상위로 에러 전달
    throw error;
  }
}
