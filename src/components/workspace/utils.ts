import type { Episode } from './types';

// 한글 자모 상수 모듈 스코프 추출
const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNGSUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONGSUNG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 자모 분해 알고리즘 (구분자 파라미터화 및 상수 추출 최적화)
export function decomposeHangeul(str: string, separator: string = ' '): string {
  const result: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const jong = offset % 28;
      const jung = ((offset - jong) / 28) % 21;
      const cho = Math.floor((offset - jong) / 28 / 21);
      result.push(CHOSUNG[cho]);
      result.push(JUNGSUNG[jung]);
      if (jong > 0) result.push(JONGSUNG[jong]);
    } else {
      result.push(str[i]);
    }
  }
  return result.join(separator);
}

// ----------------------------------------------------------------------------
// 최신 최적화 한글 자모-음운 하이브리드 유사도 분석 엔진 (Ensemble Engine)
// 1) Weighted Jamo Levenshtein (조음 위치/음운 대립쌍 가중 편집 거리)
// 2) Jaro-Winkler Distance (어두/접두사 자모 가중 거리)
// 3) Chosung Sequence Matching (초성 뼈대 유사도)
// ----------------------------------------------------------------------------

// 음운론적 조음 위치 및 음성 유사 자모 그룹 (Phonetic Affinity Groups & Substitution Costs)
const PHONETIC_SIMILARITY_MAP: Record<string, Record<string, number>> = {
  // 평음/격음/경음 (유사도 매우 높음 -> 치환 페널티 0.3)
  'ㄱ': { 'ㅋ': 0.3, 'ㄲ': 0.3 }, 'ㅋ': { 'ㄱ': 0.3, 'ㄲ': 0.3 }, 'ㄲ': { 'ㄱ': 0.3, 'ㅋ': 0.3 },
  'ㄷ': { 'ㅌ': 0.3, 'ㄸ': 0.3 }, 'ㅌ': { 'ㄷ': 0.3, 'ㄸ': 0.3 }, 'ㄸ': { 'ㄷ': 0.3, 'ㅌ': 0.3 },
  'ㅂ': { 'ㅍ': 0.3, 'ㅃ': 0.3 }, 'ㅍ': { 'ㅂ': 0.3, 'ㅃ': 0.3 }, 'ㅃ': { 'ㅂ': 0.3, 'ㅍ': 0.3 },
  'ㅈ': { 'ㅊ': 0.3, 'ㅉ': 0.3 }, 'ㅊ': { 'ㅈ': 0.3, 'ㅉ': 0.3 }, 'ㅉ': { 'ㅈ': 0.3, 'ㅊ': 0.3 },
  'ㅅ': { 'ㅆ': 0.3, 'ㅎ': 0.4 }, 'ㅆ': { 'ㅅ': 0.3 },
  // 비음/유음 자음군
  'ㄴ': { 'ㄹ': 0.35, 'ㅁ': 0.4, 'ㅇ': 0.4 }, 'ㄹ': { 'ㄴ': 0.35, 'ㅁ': 0.4 }, 'ㅁ': { 'ㄴ': 0.4, 'ㅇ': 0.4 }, 'ㅇ': { 'ㄴ': 0.4, 'ㅁ': 0.4 },
  
  // 단모음/이중모음 대립쌍 (치환 페널티 0.2 ~ 0.3)
  'ㅏ': { 'ㅐ': 0.25, 'ㅑ': 0.25, 'ㅒ': 0.3 }, 'ㅐ': { 'ㅏ': 0.25, 'ㅒ': 0.25, 'ㅔ': 0.2 },
  'ㅓ': { 'ㅔ': 0.25, 'ㅕ': 0.25, 'ㅖ': 0.3 }, 'ㅔ': { 'ㅓ': 0.25, 'ㅖ': 0.25, 'ㅐ': 0.2 },
  'ㅗ': { 'ㅜ': 0.3, 'ㅛ': 0.25, 'ㅘ': 0.3, 'ㅚ': 0.3 }, 'ㅜ': { 'ㅗ': 0.3, 'ㅠ': 0.25, 'ㅝ': 0.3, 'ㅟ': 0.3 },
  'ㅡ': { 'ㅣ': 0.35, 'ㅢ': 0.25 }, 'ㅣ': { 'ㅡ': 0.35, 'ㅢ': 0.25 }
};

function getJamoSubstitutionCost(c1: string, c2: string): number {
  if (c1 === c2) return 0;
  if (PHONETIC_SIMILARITY_MAP[c1]?.[c2] !== undefined) {
    return PHONETIC_SIMILARITY_MAP[c1][c2];
  }
  return 1.0;
}

// 1) 가중 편집 거리 (Weighted Jamo Levenshtein Distance)
export function getWeightedJamoLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const subCost = getJamoSubstitutionCost(s1[i - 1], s2[j - 1]);
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,           // 삭제
        dp[i][j - 1] + 1,           // 삽입
        dp[i - 1][j - 1] + subCost   // 음운 가중 치환
      );
    }
  }
  return dp[m][n];
}

// 2) Jaro-Winkler Distance (한국어 이름 어두 자모 가중치)
export function getJaroWinklerDistance(s1: string, s2: string, p = 0.1): number {
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return len1 === len2 ? 1 : 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }

  return jaro + prefix * p * (1 - jaro);
}

// 3) 초성 시퀀스 추출
export function getChosungSequence(str: string): string {
  const result: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const jong = offset % 28;
      const cho = Math.floor((offset - jong) / 28 / 21);
      result.push(CHOSUNG[cho]);
    }
  }
  return result.join('');
}

// 기본 단순 Levenshtein (하위 호환성 보존)
export function getLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m < n) return getLevenshteinDistance(s2, s1);

  const prevRow = Array.from({ length: n + 1 }, (_, i) => i);
  const currRow = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] = Math.min(
          prevRow[j] + 1,
          currRow[j - 1] + 1,
          prevRow[j - 1] + 1
        );
      }
    }
    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j];
    }
  }
  return prevRow[n];
}

// 최신 앙상블 기법 적용 한글 어감 유사도 측정 함수 (Final Similarity Engine)
export function calculateSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;
  const clean1 = name1.trim();
  const clean2 = name2.trim();
  if (clean1 === clean2) return 100;

  const decomp1 = decomposeHangeul(clean1, '');
  const decomp2 = decomposeHangeul(clean2, '');
  const maxLen = Math.max(decomp1.length, decomp2.length);
  if (maxLen === 0) return 0;

  // 1) 가중 Levenshtein 점수 (50% 비중)
  const weightedDist = getWeightedJamoLevenshteinDistance(decomp1, decomp2);
  const weightedScore = Math.max(0, (1 - weightedDist / maxLen) * 100);

  // 2) Jaro-Winkler 어두 가중 점수 (35% 비중)
  const jaroWinklerScore = getJaroWinklerDistance(decomp1, decomp2) * 100;

  // 3) 초성 뼈대 시퀀스 일치 점수 (15% 비중)
  const cho1 = getChosungSequence(clean1);
  const cho2 = getChosungSequence(clean2);
  const choMax = Math.max(cho1.length, cho2.length);
  const choScore = choMax > 0
    ? Math.max(0, (1 - getLevenshteinDistance(cho1, cho2) / choMax) * 100)
    : weightedScore;

  // 최종 앙상블 복합점수 연산
  const finalScore = Math.round(
    weightedScore * 0.50 +
    jaroWinklerScore * 0.35 +
    choScore * 0.15
  );

  return Math.min(100, Math.max(0, finalScore));
}

// DOMParser 인스턴스 싱글톤 유지
const domParser = typeof window !== 'undefined' ? new DOMParser() : null;

// 단어 단위 LCS Diff 알고리즘 (unshift 호출 O(N^2) 제거 및 DOMParser 싱글톤화 최적화)
export function diffWords(oldStr: string, newStr: string): { type: 'added' | 'removed' | 'common'; value: string }[] {
  const cleanHtml = (html: string) => {
    if (!domParser) return html.replace(/<[^>]*>/g, '');
    const doc = domParser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  const oldClean = cleanHtml(oldStr);
  const newClean = cleanHtml(newStr);

  const oldWords = oldClean.split(/(\s+)/);
  const newWords = newClean.split(/(\s+)/);

  const dp: number[][] = Array(oldWords.length + 1).fill(0).map(() => Array(newWords.length + 1).fill(0));

  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: { type: 'added' | 'removed' | 'common'; value: string }[] = [];
  let i = oldWords.length;
  let j = newWords.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.push({ type: 'common', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'added', value: newWords[j - 1] });
      j--;
    } else {
      result.push({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }

  return result.reverse();
}

// 트리 구조에서 특정 폴더 하위의 모든 에피소드를 재귀적으로 찾는 유틸 함수 (코드 중복 제거)
export function getRecursiveDescendants(parentId: string, items: Episode[]): Episode[] {
  const children = items.filter(item => item.parentId === parentId);
  let all = [...children];
  children.forEach(c => {
    if (c.isFolder) {
      all = [...all, ...getRecursiveDescendants(c.id, items)];
    }
  });
  return all;
}

// 트리 구조에서 폴더를 제외하고 순서대로 정렬된 순수 에피소드 문서 리스트를 반환하는 유틸 함수
export function getOrderedDocumentList(episodes: Episode[]): Episode[] {
  const getSubTreeDocs = (parentId: string | null = null): Episode[] => {
    const currentItems = episodes.filter(ep => (parentId === null ? !ep.parentId : ep.parentId === parentId));
    const sorted = [...currentItems].sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.title.localeCompare(b.title, 'ko', { numeric: true, sensitivity: 'base' });
    });

    let result: Episode[] = [];
    sorted.forEach(item => {
      if (item.isFolder) {
        result = result.concat(getSubTreeDocs(item.id));
      } else {
        result.push(item);
      }
    });
    return result;
  };

  return getSubTreeDocs(null);
}

