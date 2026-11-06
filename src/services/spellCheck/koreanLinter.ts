import type { ArchiveItem } from '../../components/workspace/types';

export type SpellErrorCategory = 
  | 'spelling'       // 철자 오류 (Red)
  | 'spacing'        // 띄어쓰기 (Yellow)
  | 'wiki_protected' // 아카이브 등록 고유명사 (Green)
  | 'wiki_suggest'   // 아카이브 등록 추천 단어 (Blue)
  | 'style_ai';      // AI 문맥 윤문 추천 (Purple)

export type CheckEngineType = 'L1_LOCAL' | 'L2_STANDARD_PROXY' | 'L3_AI';

export interface HybridSpellError {
  id: string;
  original: string;
  replacement: string;
  reason: string;
  category: SpellErrorCategory;
  engine: CheckEngineType;
}

// 자주 틀리는 한국어 오탈자 및 띄어쓰기 패턴 DB (클라이언트 0ms 오프라인 린터용)
const COMMON_KOREAN_PATTERNS: { pattern: RegExp; replacement: string; reason: string; category: SpellErrorCategory }[] = [
  { pattern: /어의없/g, replacement: '어처구니없', reason: '맞춤법: "어의없다"는 "어처구니없다"의 오기입니다.', category: 'spelling' },
  { pattern: /됬/g, replacement: '됐', reason: '맞춤법: "되"에 "-었-"이 결합한 형태는 "됐"으로 표기합니다.', category: 'spelling' },
  { pattern: /않되/g, replacement: '안 돼', reason: '맞춤법: 부정을 나타내는 부사는 "안", "되-"의 활용형은 "돼"입니다.', category: 'spelling' },
  { pattern: /안돼/g, replacement: '안 돼', reason: '띄어쓰기: 부사 "안"과 동사 "돼"는 띄어 씁니다.', category: 'spacing' },
  { pattern: /뵈요/g, replacement: '봬요', reason: '맞춤법: "뵈어"의 줄임말은 "봬"입니다. (봬요)', category: 'spelling' },
  { pattern: /금새/g, replacement: '금세', reason: '맞춤법: "금시에"의 줄임말은 "금세"가 올바른 표기입니다.', category: 'spelling' },
  { pattern: /몇일/g, replacement: '며칠', reason: '맞춤법: 날수를 나타내는 말은 언제나 "며칠"로 적습니다.', category: 'spelling' },
  { pattern: /역활/g, replacement: '역할', reason: '맞춤법: 자기가 맡은 바 직책이나 임무는 "역할"이 맞습니다.', category: 'spelling' },
  { pattern: /오랫만에/g, replacement: '오랜만에', reason: '맞춤법: "오래 동안"의 뜻은 "오랜만에"로 표기합니다.', category: 'spelling' },
  { pattern: /어떻해/g, replacement: '어떡해', reason: '맞춤법: "어떻게 해"의 줄임말은 "어떡해"입니다.', category: 'spelling' },
  { pattern: /희안/g, replacement: '희한', reason: '맞춤법: 드물거나 기묘하다는 뜻의 한자어는 "희한(稀罕)"입니다.', category: 'spelling' },
  { pattern: /무난하다/g, replacement: '문안하다', reason: '맥락 확인: "별 탈 없다"는 "무난", "인사를 드리다"는 "문안"입니다.', category: 'spelling' },
  { pattern: /설래/g, replacement: '설레', reason: '맞춤법: "설레다"가 기본형이므로 "설레어/설레"가 올바릅니다.', category: 'spelling' },
  { pattern: /부딪히/g, replacement: '부딪치', reason: '강조어: 능동적 부딪힘은 "부딪치다", 피동은 "부딪히다"입니다.', category: 'spelling' },
];

/**
 * 아카이브 고유명사 목록 수집 및 클라이언트 단 0ms 오프라인 린팅 수행 함수
 */
export function runLocalOfflineLinter(
  textContent: string,
  archiveItems: ArchiveItem[] = []
): { errors: HybridSpellError[]; protectedCount: number; protectedTerms: string[] } {
  if (!textContent || !textContent.trim()) {
    return { errors: [], protectedCount: 0, protectedTerms: [] };
  }

  const errors: HybridSpellError[] = [];
  const protectedTerms = Array.from(
    new Set(
      archiveItems
        .map(item => (item.name ? item.name.trim() : ''))
        .filter(name => name.length >= 2) // 2글자 이상 의미 있는 고유명사
    )
  );

  let protectedCount = 0;

  // 1. 아카이브 고유명사 감지 (보호)
  protectedTerms.forEach(term => {
    if (textContent.includes(term)) {
      protectedCount++;
    }
  });

  // 2. 오프라인 자주 틀리는 오탈자 린터 검사
  COMMON_KOREAN_PATTERNS.forEach(({ pattern, replacement, reason, category }, idx) => {
    pattern.lastIndex = 0;
    const matches = textContent.match(pattern);
    if (matches && matches.length > 0) {
      const matchedStr = matches[0];
      
      // 보호 대상 아카이브 단어가 오탈자 패턴에 포함되어 있지 않은 경우만 등록
      const isProtected = protectedTerms.some(term => term.includes(matchedStr) || matchedStr.includes(term));
      if (!isProtected) {
        errors.push({
          id: `local-err-${idx}-${Date.now()}`,
          original: matchedStr,
          replacement: replacement,
          reason: reason,
          category: category,
          engine: 'L1_LOCAL'
        });
      }
    }
  });

  return { errors, protectedCount, protectedTerms };
}
