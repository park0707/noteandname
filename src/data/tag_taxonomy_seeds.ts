import type { ArchiveCategory, SubtypeItem, TagGroupKey } from '../components/workspace/types';

// ============================================================================
// 1. 전체 확장 태그 택사노미 (150+ 시드 태그)
// ============================================================================

export interface TagSeed {
  id: string;
  groupKey: TagGroupKey;
  label: string;
  description?: string;
  applicableCategories: ArchiveCategory[];
}

export const EXTENDED_TAG_TAXONOMY: TagSeed[] = [
  // --------------------------------------------------------------------------
  // A. 장르 (Genre) — 전 카테고리 공통 적용
  // --------------------------------------------------------------------------
  { id: 'g-1', groupKey: 'genre', label: '정통 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-2', groupKey: 'genre', label: '서양 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-3', groupKey: 'genre', label: '동양 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-4', groupKey: 'genre', label: '다크 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-5', groupKey: 'genre', label: '현대 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-6', groupKey: 'genre', label: '헌터/레이드물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-7', groupKey: 'genre', label: '게이트/스테이지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-8', groupKey: 'genre', label: '게임 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-9', groupKey: 'genre', label: '로맨스 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-10', groupKey: 'genre', label: '악녀물/빙의', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-11', groupKey: 'genre', label: '정통 무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-12', groupKey: 'genre', label: '신무협/선협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-13', groupKey: 'genre', label: '사파/마도', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-14', groupKey: 'genre', label: '하이 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-15', groupKey: 'genre', label: '그림다크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-16', groupKey: 'genre', label: '스팀펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-17', groupKey: 'genre', label: '코즈믹 호러', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-18', groupKey: 'genre', label: '사이버펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-19', groupKey: 'genre', label: '대체역사/사극', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // B. 문화권 / 스타일 (Culture) — 전 카테고리 공통 적용
  // --------------------------------------------------------------------------
  { id: 'c-1', groupKey: 'culture', label: '서양 중세', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-2', groupKey: 'culture', label: '북유럽/바이킹', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-3', groupKey: 'culture', label: '켈트', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-4', groupKey: 'culture', label: '그리스로마', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-5', groupKey: 'culture', label: '슬라브', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-6', groupKey: 'culture', label: '아랍/중동', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-7', groupKey: 'culture', label: '이집트/신화', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-8', groupKey: 'culture', label: '페르시아', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-9', groupKey: 'culture', label: '인도/힌두', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-10', groupKey: 'culture', label: '아즈텍/마야', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-11', groupKey: 'culture', label: '빅토리안', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-12', groupKey: 'culture', label: '한국 전통', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-13', groupKey: 'culture', label: '중국 무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-14', groupKey: 'culture', label: '일본 헤이안/요괴', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // C. 성격 (Personality / Archetype) — character 전용 (etc는 '조직 성향' 변형)
  // --------------------------------------------------------------------------
  { id: 'p-1', groupKey: 'trait', label: '냉혹함', applicableCategories: ['character', 'etc'] },
  { id: 'p-2', groupKey: 'trait', label: '고귀함', applicableCategories: ['character', 'etc'] },
  { id: 'p-3', groupKey: 'trait', label: '신비로움', applicableCategories: ['character', 'etc'] },
  { id: 'p-4', groupKey: 'trait', label: '순수함', applicableCategories: ['character'] },
  { id: 'p-5', groupKey: 'trait', label: '광기', applicableCategories: ['character', 'etc'] },
  { id: 'p-6', groupKey: 'trait', label: '우아함', applicableCategories: ['character', 'etc'] },
  { id: 'p-7', groupKey: 'trait', label: '거침/야만적', applicableCategories: ['character', 'etc'] },
  { id: 'p-8', groupKey: 'trait', label: '유쾌함', applicableCategories: ['character'] },
  { id: 'p-9', groupKey: 'trait', label: '우울함/고독', applicableCategories: ['character'] },
  { id: 'p-10', groupKey: 'trait', label: '카리스마', applicableCategories: ['character', 'etc'] },
  { id: 'p-11', groupKey: 'trait', label: '잔혹함', applicableCategories: ['character', 'etc'] },
  { id: 'p-12', groupKey: 'trait', label: '침착함/냉정', applicableCategories: ['character', 'etc'] },
  { id: 'p-13', groupKey: 'trait', label: '교활함/지혜', applicableCategories: ['character', 'etc'] },
  { id: 'p-14', groupKey: 'trait', label: '오만함', applicableCategories: ['character', 'etc'] },
  { id: 'p-15', groupKey: 'trait', label: '헌신적/충직', applicableCategories: ['character', 'etc'] },

  // --------------------------------------------------------------------------
  // D. 분위기 (Mood) — 범용 무드 (location, equipment, skill, etc, character 보조)
  // --------------------------------------------------------------------------
  { id: 'm-1', groupKey: 'mood', label: '신비로운', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'm-2', groupKey: 'mood', label: '황폐한', applicableCategories: ['location', 'equipment', 'etc'] },
  { id: 'm-3', groupKey: 'mood', label: '평화로운', applicableCategories: ['location', 'etc'] },
  { id: 'm-4', groupKey: 'mood', label: '음산한', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-5', groupKey: 'mood', label: '장엄한', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-6', groupKey: 'mood', label: '고요한', applicableCategories: ['location', 'skill', 'etc'] },
  { id: 'm-7', groupKey: 'mood', label: '혼돈스러운', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-8', groupKey: 'mood', label: '성스러운', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-9', groupKey: 'mood', label: '저주받은', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-10', groupKey: 'mood', label: '화려한', applicableCategories: ['location', 'equipment', 'etc'] },
  { id: 'm-11', groupKey: 'mood', label: '몽환적인', applicableCategories: ['location', 'equipment', 'skill'] },
  { id: 'm-12', groupKey: 'mood', label: '위압적인', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-13', groupKey: 'mood', label: '견고한', applicableCategories: ['location', 'equipment', 'etc'] },
  { id: 'm-14', groupKey: 'mood', label: '은은한', applicableCategories: ['location', 'equipment', 'skill'] },
  { id: 'm-15', groupKey: 'mood', label: '파괴적인', applicableCategories: ['equipment', 'skill'] },
  { id: 'm-16', groupKey: 'mood', label: '야만적인', applicableCategories: ['equipment', 'location', 'etc'] },

  // --------------------------------------------------------------------------
  // E. 음성 / 발음 어감 (Phonetic Feel) — 음성상징학 기반
  // --------------------------------------------------------------------------
  { id: 'ph-1', groupKey: 'phonetic', label: '둥근 소리 (Bouba형)', description: 'ㅁ·ㄴ·ㄹ·ㅇ + 원순모음(ㅗㅜ) -> 부드러움·온화함', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-2', groupKey: 'phonetic', label: '날카로운 소리 (Kiki형)', description: 'ㄱ·ㅋ·ㄲ, ㅌ·ㅊ + 전설모음(ㅣㅔ) -> 예리함·공격성', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-3', groupKey: 'phonetic', label: '경음 (된소리 ㄲㄸㅃㅆㅉ)', description: '강렬함, 거침', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-4', groupKey: 'phonetic', label: '격음 (거센소리 ㅋㅌㅍㅊ)', description: '파열적, 역동적', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-5', groupKey: 'phonetic', label: '비음 (ㅁㄴㅇ 위주)', description: '부드러움, 신비로움', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-6', groupKey: 'phonetic', label: '유음 (ㄹ 위주)', description: '유려함, 우아함', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-7', groupKey: 'phonetic', label: '파열음 겹받침 (묵직함)', description: '단단함, 중후함', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-8', groupKey: 'phonetic', label: '단음절 (1~2자)', description: '강렬한 임팩트', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-9', groupKey: 'phonetic', label: '다음절 (3자 이상)', description: '유려한 서사적 어감', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-10', groupKey: 'phonetic', label: '개방모음 (ㅏㅑ 위주)', description: '웅장하고 확 트인 어감', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'ph-11', groupKey: 'phonetic', label: '폐쇄모음 (ㅣㅡ 위주)', description: '섬세하고 은밀한 어감', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // F. 신분 / 역할 / 소유자 등급 / 조직 유형 (Social Status & Role)
  // --------------------------------------------------------------------------
  { id: 's-1', groupKey: 'social_status', label: '황제/황후/국왕', applicableCategories: ['character', 'equipment', 'etc'] },
  { id: 's-2', groupKey: 'social_status', label: '공작/백작 귀족', applicableCategories: ['character', 'equipment', 'etc'] },
  { id: 's-3', groupKey: 'social_status', label: '기사/성기사', applicableCategories: ['character', 'equipment', 'etc'] },
  { id: 's-4', groupKey: 'social_status', label: '용병/암살자/도적', applicableCategories: ['character', 'equipment', 'etc'] },
  { id: 's-5', groupKey: 'social_status', label: '마법사/연금술사', applicableCategories: ['character', 'equipment', 'etc'] },
  { id: 's-6', groupKey: 'social_status', label: '음유시인/필경사', applicableCategories: ['character', 'equipment'] },
  { id: 's-7', groupKey: 'social_status', label: '성직자/대사제', applicableCategories: ['character', 'equipment', 'etc'] },
  { id: 's-8', groupKey: 'social_status', label: '주인공 (영웅)', applicableCategories: ['character'] },
  { id: 's-9', groupKey: 'social_status', label: '라이벌/최종보스', applicableCategories: ['character'] },
  { id: 's-10', groupKey: 'social_status', label: '왕실 전용', applicableCategories: ['equipment'] },
  { id: 's-11', groupKey: 'social_status', label: '전설적 영웅 소유', applicableCategories: ['equipment'] },
  { id: 's-12', groupKey: 'social_status', label: '금기/흑마법사 소유', applicableCategories: ['equipment'] }
];

// ============================================================================
// 2. 카테고리별 세부유형 (Subtype) 시드 & 추천/상충 태그 매핑
// ============================================================================

export const CATEGORY_SUBTYPES: Record<ArchiveCategory, SubtypeItem[]> = {
  character: [
    { id: 'sub-char-1', name: '종족 - 인간', category: 'character', description: '다재다능하고 다양한 문화권의 인물' },
    { id: 'sub-char-2', name: '종족 - 엘프/하이엘프', category: 'character', description: '우아하고 신비로우며 고대 지혜를 지닌 인물', recommendedMoods: ['고귀함', '신비로운', '우아함'], recommendedPhonetics: ['유음 (ㄹ 위주)', '비음 (ㅁㄴㅇ 위주)'] },
    { id: 'sub-char-3', name: '종족 - 드워프/수인', category: 'character', description: '단단하고 강인하며 거친 성향의 인물', recommendedMoods: ['견고한', '거침/야만적'], recommendedPhonetics: ['파열음 겹받침 (묵직함)', '경음 (된소리 ㄲㄸㅃㅆㅉ)'] },
    { id: 'sub-char-4', name: '직군 - 기사/검사', category: 'character', description: '충직하고 용맹한 무사' },
    { id: 'sub-char-5', name: '직군 - 마법사/현자', category: 'character', description: '지혜롭고 지적인 마도 연구자' },
    { id: 'sub-char-6', name: '직군 - 암살자/도적', category: 'character', description: '은밀하고 은밀하게 움직이는 자' }
  ],
  equipment: [
    {
      id: 'sub-eq-sword',
      name: '냉병기 - 대검/장검',
      category: 'equipment',
      description: '롱소드, 클레이모어, 그레이트소드 등 대표 도검류',
      examples: '롱소드, 클레이모어',
      recommendedMoods: ['고귀함', '장엄한', '성스러운'],
      recommendedPhonetics: ['다음절 (3자 이상)', '유음 (ㄹ 위주)', '개방모음 (ㅏㅑ 위주)'],
      conflictTags: ['음산한', '야만적인']
    },
    {
      id: 'sub-eq-dagger',
      name: '냉병기 - 단검류',
      category: 'equipment',
      description: '스틸레토, 파링대거, 쿠크리 등 암살 및 은밀무기',
      examples: '스틸레토, 파링대거, 쿠크리',
      recommendedMoods: ['은은한', '신비로운'],
      recommendedPhonetics: ['단음절 (1~2자)', '날카로운 소리 (Kiki형)', '폐쇄모음 (ㅣㅡ 위주)'],
      conflictTags: ['장엄한', '파괴적인']
    },
    {
      id: 'sub-eq-blunt',
      name: '타격무기 (워해머/메이스)',
      category: 'equipment',
      description: '워해머, 모닝스타, 메이스, 플레일 등 파괴적 둔기',
      examples: '워해머, 모닝스타, 플레일',
      recommendedMoods: ['파괴적인', '야만적인', '위압적인'],
      recommendedPhonetics: ['파열음 겹받침 (묵직함)', '경음 (된소리 ㄲㄸㅃㅆㅉ)', '격음 (거센소리 ㅋㅌㅍㅊ)'],
      conflictTags: ['은은한', '우아함', '순수함']
    },
    {
      id: 'sub-eq-polearm',
      name: '장병기 (할버드/랜스)',
      category: 'equipment',
      description: '할버드, 글레이브, 랜스 등 진형 관통 무기',
      examples: '할버드, 글레이브, 랜스',
      recommendedMoods: ['위압적인', '장엄한', '견고한'],
      recommendedPhonetics: ['다음절 (3자 이상)', '개방모음 (ㅏㅑ 위주)']
    },
    {
      id: 'sub-eq-ranged',
      name: '투사무기 (장궁/석궁)',
      category: 'equipment',
      description: '장궁, 석궁, 표창, 차크람 등 원거리 무기',
      examples: '장궁, 석궁, 표창',
      recommendedMoods: ['은은한', '고요한'],
      recommendedPhonetics: ['날카로운 소리 (Kiki형)', '폐쇄모음 (ㅣㅡ 위주)']
    },
    {
      id: 'sub-eq-magic',
      name: '마법무구 (스태프/그리모어)',
      category: 'equipment',
      description: '스태프, 완드, 그리모어, 마도서',
      examples: '스태프, 완드, 그리모어',
      recommendedMoods: ['신비로운', '성스러운', '저주받은', '몽환적인'],
      recommendedPhonetics: ['비음 (ㅁㄴㅇ 위주)', '유음 (ㄹ 위주)']
    },
    {
      id: 'sub-eq-armor',
      name: '방어구 (갑주/방패)',
      category: 'equipment',
      description: '플레이트 아머, 수호 방패, 투구',
      examples: '플레이트, 수호방패',
      recommendedMoods: ['견고한', '위압적인', '장엄한'],
      recommendedPhonetics: ['파열음 겹받침 (묵직함)']
    },
    {
      id: 'sub-eq-accessory',
      name: '장신구 (반지/아뮬렛)',
      category: 'equipment',
      description: '인장 반지, 부적, 목걸이, 유물',
      examples: '반지, 아뮬렛, 인장',
      recommendedMoods: ['은은한', '신비로운', '저주받은'],
      recommendedPhonetics: ['단음절 (1~2자)', '비음 (ㅁㄴㅇ 위주)']
    }
  ],
  location: [
    {
      id: 'sub-loc-mountain',
      name: '지형 - 산악/봉우리',
      category: 'location',
      description: '험준한 산맥, 봉우리, 절벽',
      recommendedMoods: ['장엄한', '위압적인', '고요한'],
      recommendedPhonetics: ['개방모음 (ㅏㅑ 위주)', '파열음 겹받침 (묵직함)']
    },
    {
      id: 'sub-loc-forest',
      name: '지형 - 삼림/수풀',
      category: 'location',
      description: '신비한 숲, 대림, 수풀, 오아시스',
      recommendedMoods: ['신비로운', '고요한', '평화로운'],
      recommendedPhonetics: ['유음 (ㄹ 위주)', '비음 (ㅁㄴㅇ 위주)']
    },
    {
      id: 'sub-loc-sea',
      name: '지형 - 해양/항구/섬',
      category: 'location',
      description: '바다, 해안, 항구도시, 군도',
      recommendedMoods: ['장엄한', '혼돈스러운', '화려한']
    },
    {
      id: 'sub-loc-desert',
      name: '지형 - 사막/황야',
      category: 'location',
      description: '뜨거운 사막, 황무지, 유목지대',
      recommendedMoods: ['황폐한', '위압적인', '야만적인']
    },
    {
      id: 'sub-loc-city',
      name: '지형 - 도시/성채/수도',
      category: 'location',
      description: '왕도, 요새, 상업도시, 돔',
      recommendedMoods: ['화려한', '견고한', '장엄한']
    },
    {
      id: 'sub-loc-dungeon',
      name: '지형 - 던전/미궁/유적',
      category: 'location',
      description: '지하 미궁, 봉인된 유적, 스산한 폐허',
      recommendedMoods: ['음산한', '저주받은', '황폐한'],
      recommendedPhonetics: ['폐쇄모음 (ㅣㅡ 위주)', '격음 (거센소리 ㅋㅌㅍㅊ)']
    }
  ],
  skill: [
    {
      id: 'sub-sk-elemental',
      name: '계열 - 원소마법 (불/물/바람/뇌전)',
      category: 'skill',
      description: '화염, 뇌전, 빙설, 폭풍 마법',
      recommendedMoods: ['파괴적인', '장엄한', '신비로운'],
      recommendedPhonetics: ['격음 (거센소리 ㅋㅌㅍㅊ)', '개방모음 (ㅏㅑ 위주)']
    },
    {
      id: 'sub-sk-wuxia',
      name: '계열 - 무공/내공/검기',
      category: 'skill',
      description: '초식, 권법, 검강, 경공, 보법',
      recommendedMoods: ['위압적인', '견고한', '장엄한'],
      recommendedPhonetics: ['단음절 (1~2자)', '경음 (된소리 ㄲㄸㅃㅆㅉ)']
    },
    {
      id: 'sub-sk-holy',
      name: '계열 - 신성/치유/결계',
      category: 'skill',
      description: '성기사 기적, 치유술, 보호막',
      recommendedMoods: ['성스러운', '신비로운', '은은한'],
      recommendedPhonetics: ['둥근 소리 (Bouba형)', '유음 (ㄹ 위주)']
    },
    {
      id: 'sub-sk-curse',
      name: '계열 - 저주/흑마법/사령',
      category: 'skill',
      description: '흑마술, 강령술, 부식, 저주',
      recommendedMoods: ['저주받은', '음산한', '파괴적인'],
      recommendedPhonetics: ['날카로운 소리 (Kiki형)', '폐쇄모음 (ㅣㅡ 위주)']
    }
  ],
  etc: [
    {
      id: 'sub-etc-knights',
      name: '조직 - 기사단/수호대',
      category: 'etc',
      description: '규율적이고 명예로운 성기사단 및 수호 기사단',
      recommendedMoods: ['성스러운', '장엄한', '견고한'],
      recommendedPhonetics: ['다음절 (3자 이상)', '개방모음 (ㅏㅑ 위주)']
    },
    {
      id: 'sub-etc-merchant',
      name: '조직 - 상단/동맹',
      category: 'etc',
      description: '실리적이고 화려한 무역상단 및 길드',
      recommendedMoods: ['화려한', '평화로운']
    },
    {
      id: 'sub-etc-cult',
      name: '조직 - 교단/종교단체',
      category: 'etc',
      description: '신성하거나 음험한 비밀 성회 및 이교도',
      recommendedMoods: ['성스러운', '신비로운', '음산한']
    },
    {
      id: 'sub-etc-crime',
      name: '조직 - 범죄조직/도적단',
      category: 'etc',
      description: '음험하고 폭력적인 비밀결사 및 암살 길드',
      recommendedMoods: ['음산한', '야만적인', '황폐한'],
      recommendedPhonetics: ['경음 (된소리 ㄲㄸㅃㅆㅉ)', '날카로운 소리 (Kiki형)']
    },
    {
      id: 'sub-etc-mercenary',
      name: '조직 - 용병단/결사대',
      category: 'etc',
      description: '거칠고 자유분방한 거대 용병단',
      recommendedMoods: ['야만적인', '위압적인', '파괴적인']
    }
  ]
};
