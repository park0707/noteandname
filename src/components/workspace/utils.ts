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

// Levenshtein Distance 계산 (롤링 어레이 방식 O(N) 공간 복잡도로 획기적 최적화)
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
          prevRow[j] + 1,    // 삭제
          currRow[j - 1] + 1,  // 삽입
          prevRow[j - 1] + 1   // 대체
        );
      }
    }
    for (let j = 0; j <= n; j++) {
      prevRow[j] = currRow[j];
    }
  }
  return prevRow[n];
}

// 자모 기반 어감 유사도 계산 (공백 구분자 가공 과정 제거 최적화)
export function calculateSimilarity(name1: string, name2: string): number {
  const decomposed1 = decomposeHangeul(name1, '');
  const decomposed2 = decomposeHangeul(name2, '');
  const dist = getLevenshteinDistance(decomposed1, decomposed2);
  const maxLen = Math.max(decomposed1.length, decomposed2.length);
  if (maxLen === 0) return 0;
  return Math.round((1 - dist / maxLen) * 100);
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
