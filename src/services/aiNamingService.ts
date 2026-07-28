import { calculateSimilarity } from '../components/workspace/utils';
import type {
  ArchiveItem,
  GenerateNameParams,
  NameCandidate,
  TagWeight
} from '../components/workspace/types';
import { generateNamesByCombo } from '../components/workspace/naming/namingUtils';
import { CATEGORY_SUBTYPES } from '../data/tag_taxonomy_seeds';

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
  cleanTagWeights: TagWeight[];
  symbolicTokens: string[];
  phoneticRules: string[];
  narrativeSummary: string;
}

// ============================================================================
// 1. [Step 1] 자연어 서사 해석기 (Narrative Parser)
// ============================================================================

export function parseNarrativePrompt(keywords: string): ParsedNarrativeContext {
  if (!keywords || !keywords.trim()) {
    return { symbolicTokens: [], emotionalMood: [], characterArchetype: '기본' };
  }

  const text = keywords.trim();
  const tokens: string[] = [];
  const moods: string[] = [];

  // 핵심 상징어 키워드 매칭 정규식 패턴
  const symbolPatterns = [
    /용|드래곤|화염|불꽃|불사|검|마법|칠흑|어둠|빛|성스러운|저주|빙결|바람|뇌전|벼락|거인|괴수|용병|기사|마왕/g
  ];

  symbolPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(m => {
        if (!tokens.includes(m)) tokens.push(m);
      });
    }
  });

  // 정서/무드 추출 패턴
  if (/비운|괴로움|슬픔|비극|잔혹|냉혹/i.test(text)) moods.push('비운/냉혹');
  if (/신성|성스러운|고귀|우아/i.test(text)) moods.push('신성/고귀');
  if (/파괴|광기|분노|강렬/i.test(text)) moods.push('파괴/광기');
  if (/음산|음침|저주|다크/i.test(text)) moods.push('다크/음산');

  return {
    symbolicTokens: tokens.length > 0 ? tokens : [text.slice(0, 10)],
    emotionalMood: moods.length > 0 ? moods : ['기본 정서'],
    characterArchetype: tokens.length > 0 ? tokens[0] : '기본 서사'
  };
}

// ============================================================================
// 2. [Step 2] 태그 & 세부유형 구조화 정제기 (Taxonomy Resolver)
// ============================================================================

export function resolveTaxonomyAndPhonetics(
  params: GenerateNameParams,
  parsedContext: ParsedNarrativeContext
): ResolvedNamingContext {
  const { targetCategory, subtype, tagWeights, constraints } = params;

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

  return {
    targetCategory,
    subtypeName: subtypeObj?.name,
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
  count: number = 10
): string {
  const { targetCategory, subtypeName, cleanTagWeights, symbolicTokens, phoneticRules, narrativeSummary } = resolvedContext;

  const tagSummary = cleanTagWeights.map(t => `${t.label}(가중치:${t.weight})`).join(', ');

  return `
당신은 대한민국 최고의 웹소설/판타지/무협 전문 AI 작명가입니다.
앞 단계에서 정제된 [카테고리], [세부유형], [상징 토큰], 그리고 [발음 제약]을 충실히 반영하여 **총 ${count}개**의 독창적이고 매력적인 이름을 생성하세요.

[정제된 구조화 데이터]
- 대상 카테고리: ${targetCategory}
- 세부유형: ${subtypeName || '없음'}
- 추출된 핵심 상징어: ${symbolicTokens.join(', ') || '없음'}
- 정서/무드: ${narrativeSummary || '기본'}
- 선택된 태그 조합: ${tagSummary || '기본'}
- 음성 및 음절 제약: ${phoneticRules.join(' | ') || '없음'}

[출력 지침]
1. 베스트 고유명사 10개를 창작하세요 (단순 유명 베끼기 베제).
2. 각 후보마다 이름(name), 어원/한자풀이/서사적 의미(meaning), 1문장 서사 힌트(storySnippet), 연관 태그(tags)를 응답하세요.
3. 반드시 JSON Array 형식으로만 반환해야 합니다.
`;
}

// ============================================================================
// 4. API 통신 클라이언트 (Gemini / Groq / OpenAI)
// ============================================================================

async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  modelName: string = 'gemini-2.0-flash'
): Promise<{ name: string; meaning: string; tags?: string[]; storySnippet?: string }[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              meaning: { type: 'STRING' },
              tags: { type: 'ARRAY', items: { type: 'STRING' } },
              storySnippet: { type: 'STRING' }
            },
            required: ['name', 'meaning']
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}) [${modelName}]: ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini API [${modelName}] returned empty response.`);

  return JSON.parse(text);
}

async function callGroqAPI(
  prompt: string,
  apiKey: string
): Promise<{ name: string; meaning: string; tags?: string[]; storySnippet?: string }[]> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'qwen-2.5-32b',
      messages: [
        { role: 'system', content: 'You are a professional AI Naming expert. Always respond with a JSON array containing objects with keys: name, meaning, tags, storySnippet.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq API returned empty response.');

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : (parsed.names || parsed.items || []);
}

async function callOpenAIAPI(
  prompt: string,
  apiKey: string
): Promise<{ name: string; meaning: string; tags?: string[]; storySnippet?: string }[]> {
  const url = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional AI Naming expert. Always respond with a JSON array containing objects with keys: name, meaning, tags, storySnippet.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI API returned empty response.');

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : (parsed.names || parsed.items || []);
}

// ============================================================================
// 5. 3단계 마이크로 파이프라인 통합 작명 서비스 함수
// ============================================================================

export async function generateNamesWithAI(
  params: GenerateNameParams,
  options: AIOptions,
  archiveItems: ArchiveItem[] = [],
  onStepProgress?: (step: 'step1' | 'step2' | 'step3') => void
): Promise<{ candidates: NameCandidate[]; isFallbackUsed: boolean; fallbackReason?: string }> {
  const { provider } = options;
  const effectiveApiKey = options.apiKey || (import.meta.env ? (import.meta.env.VITE_GEMINI_API_KEY2 || import.meta.env.VITE_GEMINI_API_KEY) : undefined);
  const effectiveGroqKey = options.groqApiKey || (import.meta.env ? import.meta.env.VITE_GROQ_API_KEY : undefined);

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

  // 1) 로컬 엔진 모드이거나 클라우드 API Key가 없는 경우 -> 100% 무제한 로컬 조합 엔진
  if (provider === 'local' || (!effectiveApiKey && !effectiveGroqKey)) {
    const localResults = generateNamesByCombo(params, archiveItems);
    return {
      candidates: localResults,
      isFallbackUsed: true,
      fallbackReason: provider === 'local'
        ? '100% 오프라인 완전 무제한 로컬 엔진으로 생성되었습니다.'
        : 'API Key가 설정되지 않아 로컬 무제한 조합 엔진으로 생성되었습니다.'
    };
  }

  try {
    const prompt = buildPipelinePrompt(resolvedContext, params.count || 10);
    let rawResults: { name: string; meaning: string; tags?: string[]; storySnippet?: string }[] = [];

    if (provider === 'groq' && effectiveGroqKey) {
      rawResults = await callGroqAPI(prompt, effectiveGroqKey);
    } else if (provider === 'gemini' && effectiveApiKey) {
      try {
        rawResults = await callGeminiAPI(prompt, effectiveApiKey, 'gemini-2.0-flash');
      } catch (geminiError: any) {
        if (geminiError?.message?.includes('429') || geminiError?.message?.includes('RESOURCE_EXHAUSTED')) {
          console.warn('Gemini 2.0 Flash 429. Retrying with Gemini 1.5 Flash...');
          try {
            rawResults = await callGeminiAPI(prompt, effectiveApiKey, 'gemini-1.5-flash');
          } catch (retryErr: any) {
            console.warn('Gemini 1.5 Flash failed. Retrying with Gemini 1.5 Pro...');
            rawResults = await callGeminiAPI(prompt, effectiveApiKey, 'gemini-1.5-pro');
          }
        } else {
          throw geminiError;
        }
      }
    } else if (provider === 'openai' && effectiveApiKey) {
      rawResults = await callOpenAIAPI(prompt, effectiveApiKey);
    } else {
      const localResults = generateNamesByCombo(params, archiveItems);
      return { candidates: localResults, isFallbackUsed: true, fallbackReason: '기본 로컬 모드 발동' };
    }

    // 반환된 LLM 응답을 NameCandidate 및 자모 유사도 매칭으로 변환
    const candidates: NameCandidate[] = rawResults.map((item, idx) => {
      let maxSimilarity = 0;
      let matchItemName = '';

      for (const ai of archiveItems) {
        const sim = calculateSimilarity(item.name, ai.name);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          matchItemName = ai.name;
        }
      }

      return {
        id: `ai-${provider}-${Date.now()}-${idx}`,
        name: item.name,
        meaning: item.meaning + (item.storySnippet ? ` (서사: ${item.storySnippet})` : ''),
        similarity: maxSimilarity,
        matchItem: maxSimilarity >= 75 ? matchItemName : undefined,
        category: params.targetCategory,
        subtype: params.subtype,
        tags: item.tags || [params.targetCategory]
      };
    });

    return { candidates, isFallbackUsed: false };
  } catch (error: any) {
    console.warn('AI API Call Failed. Falling back to local engine:', error);
    const is429 = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
    const reasonMsg = is429
      ? '구글 AI 무료 할당량(Quota Limit)을 초과하여 100% 오프라인 로컬 엔진으로 안전하게 전환되었습니다.'
      : `AI 모델 통신 오류 (${error?.message || error}). 로컬 엔진으로 폴백 처리되었습니다.`;

    const fallbackResults = generateNamesByCombo(params, archiveItems);
    return {
      candidates: fallbackResults,
      isFallbackUsed: true,
      fallbackReason: reasonMsg
    };
  }
}
