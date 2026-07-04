export type FontCategory = 'serif' | 'sans' | 'title' | 'handwriting' | 'uploaded';

export interface FontOption {
  id: string;
  label: string;
  family: string;
  category: FontCategory;
  source: 'google' | 'local' | 'upload';
}

export const DEFAULT_FONTS: FontOption[] = [
  { id: 'ridibatang', label: '리디바탕', family: 'RIDIBatang', category: 'serif', source: 'local' },
  { id: 'kopub-batang', label: 'KoPub 바탕', family: 'KoPubBatang', category: 'serif', source: 'local' },
  { id: 'maru-buri', label: '마루 부리', family: 'MaruBuri', category: 'serif', source: 'local' },
  { id: 'nanum-myeongjo', label: '나눔명조', family: 'Nanum Myeongjo', category: 'serif', source: 'google' },
  { id: 'noto-serif-kr', label: '본명조', family: 'Noto Serif KR', category: 'serif', source: 'google' },
  { id: 'gowun-batang', label: '고운바탕', family: 'Gowun Batang', category: 'serif', source: 'google' },
  { id: 'song-myung', label: '송명', family: 'Song Myung', category: 'serif', source: 'google' },

  { id: 'nanum-gothic', label: '나눔고딕', family: 'Nanum Gothic', category: 'sans', source: 'google' },
  { id: 'kopub-dotum', label: 'KoPub 돋움', family: 'KoPubDotum', category: 'sans', source: 'local' },
  { id: 'noto-sans-kr', label: '본고딕', family: 'Noto Sans KR', category: 'sans', source: 'google' },
  { id: 'gowun-dodum', label: '고운돋움', family: 'Gowun Dodum', category: 'sans', source: 'google' },
  { id: 'gothic-a1', label: '고딕 A1', family: 'Gothic A1', category: 'sans', source: 'google' },
  { id: 'ibm-plex-sans-kr', label: 'IBM Plex Sans KR', family: 'IBM Plex Sans KR', category: 'sans', source: 'google' },
  { id: 'spoqa-han-sans', label: '스포카 한 산스', family: 'Spoqa Han Sans Neo', category: 'sans', source: 'local' },
  { id: 'nanum-square-round', label: '나눔스퀘어라운드', family: 'NanumSquareRound', category: 'sans', source: 'local' },

  { id: 'black-han-sans', label: '블랙한산스', family: 'Black Han Sans', category: 'title', source: 'google' },
  { id: 'jua', label: '배민 주아체', family: 'Jua', category: 'title', source: 'google' },
  { id: 'do-hyeon', label: '배민 도현체', family: 'Do Hyeon', category: 'title', source: 'google' },

  { id: 'nanum-pen-script', label: '나눔손글씨 펜', family: 'Nanum Pen Script', category: 'handwriting', source: 'google' },
  { id: 'yeon-sung', label: '연성', family: 'Yeon Sung', category: 'handwriting', source: 'google' },
];

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  serif: '본문 명조',
  sans: '본문 고딕',
  title: '제목용',
  handwriting: '손글씨',
  uploaded: '업로드',
};
