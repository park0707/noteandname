// 한글 자모 분해 알고리즘
export function decomposeHangeul(str: string): string {
  const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNGSUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONGSUNG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

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
  return result.join(' ');
}

// Levenshtein Distance 계산
export function getLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 삭제
          dp[i][j - 1] + 1,    // 삽입
          dp[i - 1][j - 1] + 1 // 대체
        );
      }
    }
  }
  return dp[m][n];
}

// 자모 기반 어감 유사도 계산
export function calculateSimilarity(name1: string, name2: string): number {
  const decomposed1 = decomposeHangeul(name1).replace(/\s/g, '');
  const decomposed2 = decomposeHangeul(name2).replace(/\s/g, '');
  const dist = getLevenshteinDistance(decomposed1, decomposed2);
  const maxLen = Math.max(decomposed1.length, decomposed2.length);
  if (maxLen === 0) return 0;
  return Math.round((1 - dist / maxLen) * 100);
}
