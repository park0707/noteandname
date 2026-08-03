import type { ArchiveCategory, SubtypeItem, TagGroupKey } from '../components/workspace/types';

// ============================================================================
// 1. 전체 확장 태그 택사노미 (웹소설 플랫폼 & 판타지/무협/현판 완전 대응 300+ 시드 태그)
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
  // A. 장르 / 서브장르 (Genre) — 노벨피아/문피아/카카오페이지/네이버시리즈 수집 기반
  // --------------------------------------------------------------------------
  { id: 'g-1', groupKey: 'genre', label: '정통 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-2', groupKey: 'genre', label: '서양 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-3', groupKey: 'genre', label: '동양 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-4', groupKey: 'genre', label: '다크 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-5', groupKey: 'genre', label: '현대 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-6', groupKey: 'genre', label: '헌터물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-6b', groupKey: 'genre', label: '레이드물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-7', groupKey: 'genre', label: '게이트물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-7b', groupKey: 'genre', label: '스테이지물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-8', groupKey: 'genre', label: '게임 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-9', groupKey: 'genre', label: '로맨스 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-10', groupKey: 'genre', label: '악녀물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-10b', groupKey: 'genre', label: '빙의물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-10c', groupKey: 'genre', label: '회귀물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-10d', groupKey: 'genre', label: '환생물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-11', groupKey: 'genre', label: '정통 무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-12', groupKey: 'genre', label: '신무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-12b', groupKey: 'genre', label: '선협물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-13', groupKey: 'genre', label: '사파 무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-13b', groupKey: 'genre', label: '마도 무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-14', groupKey: 'genre', label: '하이 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-15', groupKey: 'genre', label: '그림다크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-16', groupKey: 'genre', label: '스팀펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-17', groupKey: 'genre', label: '코즈믹 호러', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-18', groupKey: 'genre', label: '사이버펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-19', groupKey: 'genre', label: '대체역사', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-19b', groupKey: 'genre', label: '사극 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-20', groupKey: 'genre', label: '아포칼립스', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-20b', groupKey: 'genre', label: '재난 서바이벌', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-21', groupKey: 'genre', label: '성좌물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-22', groupKey: 'genre', label: '영지물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-23', groupKey: 'genre', label: '아카데미물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-24', groupKey: 'genre', label: '스릴러', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-24b', groupKey: 'genre', label: '오컬트', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-24c', groupKey: 'genre', label: '퇴마물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-25', groupKey: 'genre', label: '크리처물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-26', groupKey: 'genre', label: '차원이동물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-27', groupKey: 'genre', label: '디스토피아', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-28', groupKey: 'genre', label: '동양풍 로판', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-29', groupKey: 'genre', label: '영애물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-30', groupKey: 'genre', label: '착각계', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-30b', groupKey: 'genre', label: '코미디 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-31', groupKey: 'genre', label: '경영물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-31b', groupKey: 'genre', label: '제작 조합물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-32', groupKey: 'genre', label: '어반 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-33', groupKey: 'genre', label: '스페이스 오페라', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-33b', groupKey: 'genre', label: 'SF 판타지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-34', groupKey: 'genre', label: '마교 혈교물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-35', groupKey: 'genre', label: '세가 정파물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-36', groupKey: 'genre', label: '선인 단전물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  // [노벨피아 / 문피아 / 카카오페이지 수집 신규 추가]
  { id: 'g-37', groupKey: 'genre', label: 'TS (성전환)', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-38', groupKey: 'genre', label: '후피집 (후회 피폐 집착)', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-39', groupKey: 'genre', label: '인방물 (스트리머)', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-40', groupKey: 'genre', label: '전문가물 (의사 변호사)', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-41', groupKey: 'genre', label: '요리 셰프물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-42', groupKey: 'genre', label: '귀농 농경물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-43', groupKey: 'genre', label: '재벌물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-44', groupKey: 'genre', label: '아이돌 연예계물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-45', groupKey: 'genre', label: '육아물 가족물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'g-46', groupKey: 'genre', label: '계약결혼물', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // B. 문화권 / 양식적 스타일 (Culture & Style)
  // --------------------------------------------------------------------------
  { id: 'c-1', groupKey: 'culture', label: '서양 중세', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-2', groupKey: 'culture', label: '북유럽 바이킹', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-3', groupKey: 'culture', label: '켈트', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-4', groupKey: 'culture', label: '그리스 로마', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-5', groupKey: 'culture', label: '슬라브', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-6', groupKey: 'culture', label: '아랍 중동', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-7', groupKey: 'culture', label: '이집트 신화', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-8', groupKey: 'culture', label: '페르시아', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-9', groupKey: 'culture', label: '인도 힌두', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-10', groupKey: 'culture', label: '아즈텍 마야', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-11', groupKey: 'culture', label: '빅토리안', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-12', groupKey: 'culture', label: '한국 전통', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-13', groupKey: 'culture', label: '중국 무협', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-14', groupKey: 'culture', label: '일본 헤이안 요괴', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-15', groupKey: 'culture', label: '메소포타미아 바빌로니아', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-16', groupKey: 'culture', label: '비잔틴 동로마', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-17', groupKey: 'culture', label: '르네상스 이탈리아', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-18', groupKey: 'culture', label: '로코코 프랑스 궁정', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-19', groupKey: 'culture', label: '서부 개척 카우보이', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-20', groupKey: 'culture', label: '스코틀랜드 하이랜드', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-21', groupKey: 'culture', label: '아일랜드 가일', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-22', groupKey: 'culture', label: '폴리네시아 해양', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-23', groupKey: 'culture', label: '실크로드 중앙아시아', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-24', groupKey: 'culture', label: '디젤펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-25', groupKey: 'culture', label: '솔라펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-26', groupKey: 'culture', label: '네오도쿄 아시안 펑크', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-27', groupKey: 'culture', label: '고딕 호러', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'c-28', groupKey: 'culture', label: '현대 밀리터리', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // C. 성격 / 인격 아키타입 (Personality & Character Archetype)
  // --------------------------------------------------------------------------
  { id: 'p-1', groupKey: 'trait', label: '냉혹함', applicableCategories: ['character', 'etc'] },
  { id: 'p-2', groupKey: 'trait', label: '고귀함', applicableCategories: ['character', 'etc'] },
  { id: 'p-3', groupKey: 'trait', label: '신비로움', applicableCategories: ['character', 'etc'] },
  { id: 'p-4', groupKey: 'trait', label: '순수함', applicableCategories: ['character'] },
  { id: 'p-5', groupKey: 'trait', label: '광기', applicableCategories: ['character', 'etc'] },
  { id: 'p-6', groupKey: 'trait', label: '우아함', applicableCategories: ['character', 'etc'] },
  { id: 'p-7', groupKey: 'trait', label: '거침 야만적', applicableCategories: ['character', 'etc'] },
  { id: 'p-8', groupKey: 'trait', label: '유쾌함', applicableCategories: ['character'] },
  { id: 'p-9', groupKey: 'trait', label: '우울함 고독', applicableCategories: ['character'] },
  { id: 'p-10', groupKey: 'trait', label: '카리스마', applicableCategories: ['character', 'etc'] },
  { id: 'p-11', groupKey: 'trait', label: '잔혹함', applicableCategories: ['character', 'etc'] },
  { id: 'p-12', groupKey: 'trait', label: '침착함 냉정', applicableCategories: ['character', 'etc'] },
  { id: 'p-13', groupKey: 'trait', label: '교활함 지혜', applicableCategories: ['character', 'etc'] },
  { id: 'p-14', groupKey: 'trait', label: '오만함', applicableCategories: ['character', 'etc'] },
  { id: 'p-15', groupKey: 'trait', label: '헌신적 충직', applicableCategories: ['character', 'etc'] },
  { id: 'p-16', groupKey: 'trait', label: '츤데레', applicableCategories: ['character'] },
  { id: 'p-17', groupKey: 'trait', label: '얀데레', applicableCategories: ['character'] },
  { id: 'p-17b', groupKey: 'trait', label: '집착남 집착녀', applicableCategories: ['character'] },
  { id: 'p-17c', groupKey: 'trait', label: '후회남 후회녀', applicableCategories: ['character'] },
  { id: 'p-17d', groupKey: 'trait', label: '피폐남 피폐녀', applicableCategories: ['character'] },
  { id: 'p-18', groupKey: 'trait', label: '마이페이스', applicableCategories: ['character'] },
  { id: 'p-19', groupKey: 'trait', label: '지략가 책사', applicableCategories: ['character', 'etc'] },
  { id: 'p-20', groupKey: 'trait', label: '호구 성인군자', applicableCategories: ['character'] },
  { id: 'p-21', groupKey: 'trait', label: '퇴폐미 나른함', applicableCategories: ['character'] },
  { id: 'p-22', groupKey: 'trait', label: '순정파', applicableCategories: ['character'] },
  { id: 'p-23', groupKey: 'trait', label: '광기 어린 백치', applicableCategories: ['character'] },
  { id: 'p-24', groupKey: 'trait', label: '방탕아 헐렁함', applicableCategories: ['character'] },
  { id: 'p-25', groupKey: 'trait', label: '소시오패스 사이코', applicableCategories: ['character', 'etc'] },
  { id: 'p-26', groupKey: 'trait', label: '도도함 자존심', applicableCategories: ['character'] },
  { id: 'p-27', groupKey: 'trait', label: '장난기 장난꾸러기', applicableCategories: ['character'] },
  { id: 'p-28', groupKey: 'trait', label: '충의지사 절개', applicableCategories: ['character', 'etc'] },
  { id: 'p-29', groupKey: 'trait', label: '혈기왕성 열혈', applicableCategories: ['character'] },
  { id: 'p-30', groupKey: 'trait', label: '몽환적 독선적', applicableCategories: ['character'] },
  { id: 'p-31', groupKey: 'trait', label: '냉철한 완벽주의자', applicableCategories: ['character', 'etc'] },
  { id: 'p-32', groupKey: 'trait', label: '수전노 (돈 구두쇠)', applicableCategories: ['character', 'etc'] },
  { id: 'p-33', groupKey: 'trait', label: '망나니 소공자', applicableCategories: ['character'] },
  { id: 'p-34', groupKey: 'trait', label: '천재 먼치킨', applicableCategories: ['character'] },
  { id: 'p-35', groupKey: 'trait', label: '흑막 조종자', applicableCategories: ['character'] },

  // --------------------------------------------------------------------------
  // D. 분위기 / 미학적 느낌 (Mood & Aesthetic)
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
  { id: 'm-17', groupKey: 'mood', label: '서늘한 차가운', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'm-18', groupKey: 'mood', label: '피비린내 나는 잔혹한', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-19', groupKey: 'mood', label: '신성하고 찬란한', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'm-20', groupKey: 'mood', label: '시원하고 경쾌한', applicableCategories: ['character', 'location', 'skill'] },
  { id: 'm-21', groupKey: 'mood', label: '아늑하고 따뜻한', applicableCategories: ['location', 'etc'] },
  { id: 'm-22', groupKey: 'mood', label: '퇴폐적인', applicableCategories: ['character', 'location', 'equipment', 'etc'] },
  { id: 'm-23', groupKey: 'mood', label: '기괴하고 기이한', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-24', groupKey: 'mood', label: '메마른 차가운', applicableCategories: ['location', 'equipment', 'etc'] },
  { id: 'm-25', groupKey: 'mood', label: '서정적이고 아련한', applicableCategories: ['character', 'location', 'skill'] },
  { id: 'm-26', groupKey: 'mood', label: '압도적인 압도감', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'm-27', groupKey: 'mood', label: '은밀하고 서늘한', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'm-28', groupKey: 'mood', label: '타오르는 뜨거운', applicableCategories: ['character', 'location', 'equipment', 'skill'] },
  { id: 'm-29', groupKey: 'mood', label: '칠흑 같은', applicableCategories: ['location', 'equipment', 'skill', 'etc'] },
  { id: 'm-30', groupKey: 'mood', label: '공허한 허무한', applicableCategories: ['character', 'location', 'skill'] },
  { id: 'm-31', groupKey: 'mood', label: '기계적 냉정한', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // E. 자연 원소 & 상징 모티브 (Element & Symbol Motif)
  // --------------------------------------------------------------------------
  { id: 'e-1', groupKey: 'element', label: '화염', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-1b', groupKey: 'element', label: '불꽃', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-2', groupKey: 'element', label: '얼음', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-2b', groupKey: 'element', label: '빙설', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-3', groupKey: 'element', label: '뇌전', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-3b', groupKey: 'element', label: '번개', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-4', groupKey: 'element', label: '대지', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-4b', groupKey: 'element', label: '바위', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-5', groupKey: 'element', label: '암흑', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-5b', groupKey: 'element', label: '그림자', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-6', groupKey: 'element', label: '신성', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-6b', groupKey: 'element', label: '빛', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-7', groupKey: 'element', label: '바람', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-7b', groupKey: 'element', label: '폭풍', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-8', groupKey: 'element', label: '환영', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-8b', groupKey: 'element', label: '환술', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-9', groupKey: 'element', label: '독', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-9b', groupKey: 'element', label: '맹독', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-10', groupKey: 'element', label: '시간', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-10b', groupKey: 'element', label: '공간', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-11', groupKey: 'element', label: '용', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-11b', groupKey: 'element', label: '드래곤', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-12', groupKey: 'element', label: '혈통', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-12b', groupKey: 'element', label: '피', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-13', groupKey: 'element', label: '별', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-13b', groupKey: 'element', label: '은하', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-14', groupKey: 'element', label: '깃털', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-14b', groupKey: 'element', label: '날개', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-15', groupKey: 'element', label: '유리가루', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-15b', groupKey: 'element', label: '수정', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-16', groupKey: 'element', label: '보석', applicableCategories: ['character', 'location', 'equipment', 'etc'] },
  { id: 'e-16b', groupKey: 'element', label: '금속', applicableCategories: ['character', 'location', 'equipment', 'etc'] },
  { id: 'e-17', groupKey: 'element', label: '영혼', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-17b', groupKey: 'element', label: '사령', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-18', groupKey: 'element', label: '혼돈', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-18b', groupKey: 'element', label: '심연', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-19', groupKey: 'element', label: '자연', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-19b', groupKey: 'element', label: '수목 (나무)', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-20', groupKey: 'element', label: '바다', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-20b', groupKey: 'element', label: '해일', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-21', groupKey: 'element', label: '혈마', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-21b', groupKey: 'element', label: '마기', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-22', groupKey: 'element', label: '주술', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-22b', groupKey: 'element', label: '부적', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-23', groupKey: 'element', label: '나노기계', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-23b', groupKey: 'element', label: '사이보그', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },
  { id: 'e-24', groupKey: 'element', label: '중력 (그래비티)', applicableCategories: ['character', 'location', 'equipment', 'skill', 'etc'] },

  // --------------------------------------------------------------------------
  // F. 서사적 아키타입 / 역할 (Narrative Archetype & Role)
  // --------------------------------------------------------------------------
  { id: 'ar-1', groupKey: 'archetype', label: '아카데미 수석', applicableCategories: ['character'] },
  { id: 'ar-1b', groupKey: 'archetype', label: '아카데미 학생', applicableCategories: ['character'] },
  { id: 'ar-2', groupKey: 'archetype', label: '황태자', applicableCategories: ['character'] },
  { id: 'ar-2b', groupKey: 'archetype', label: '소공자', applicableCategories: ['character'] },
  { id: 'ar-3', groupKey: 'archetype', label: '가문의 서자', applicableCategories: ['character'] },
  { id: 'ar-3b', groupKey: 'archetype', label: '가문의 망나니', applicableCategories: ['character'] },
  { id: 'ar-4', groupKey: 'archetype', label: '신탁의 아이', applicableCategories: ['character'] },
  { id: 'ar-4b', groupKey: 'archetype', label: '성녀', applicableCategories: ['character'] },
  { id: 'ar-5', groupKey: 'archetype', label: '흑막 조종자', applicableCategories: ['character'] },
  { id: 'ar-6', groupKey: 'archetype', label: '성좌 신격체', applicableCategories: ['character'] },
  { id: 'ar-7', groupKey: 'archetype', label: '길드 마스터', applicableCategories: ['character'] },
  { id: 'ar-8', groupKey: 'archetype', label: '구원자', applicableCategories: ['character'] },
  { id: 'ar-8b', groupKey: 'archetype', label: '희생자', applicableCategories: ['character'] },
  { id: 'ar-9', groupKey: 'archetype', label: '소드마스터', applicableCategories: ['character'] },
  { id: 'ar-9b', groupKey: 'archetype', label: '검성', applicableCategories: ['character'] },
  { id: 'ar-10', groupKey: 'archetype', label: '탑주 (마탑의 주인)', applicableCategories: ['character'] },
  { id: 'ar-11', groupKey: 'archetype', label: '대문파 장문인', applicableCategories: ['character'] },
  { id: 'ar-12', groupKey: 'archetype', label: '차원 방랑자', applicableCategories: ['character'] },
  { id: 'ar-13', groupKey: 'archetype', label: '군주 치세자', applicableCategories: ['character'] },
  { id: 'ar-14', groupKey: 'archetype', label: '첩보원 간작', applicableCategories: ['character'] },
  { id: 'ar-15', groupKey: 'archetype', label: '괴도 방랑자', applicableCategories: ['character'] },
  { id: 'ar-16', groupKey: 'archetype', label: '소환수 신수', applicableCategories: ['character'] },
  { id: 'ar-17', groupKey: 'archetype', label: '은둔고수 도인', applicableCategories: ['character'] },
  { id: 'ar-18', groupKey: 'archetype', label: '슬럼가 수장', applicableCategories: ['character'] },
  { id: 'ar-19', groupKey: 'archetype', label: '용병대장', applicableCategories: ['character'] },
  { id: 'ar-20', groupKey: 'archetype', label: '네크로맨서 (강령술사)', applicableCategories: ['character'] },
  { id: 'ar-21', groupKey: 'archetype', label: '흑마법사', applicableCategories: ['character'] },
  { id: 'ar-22', groupKey: 'archetype', label: '스트리머 (인방 BJ)', applicableCategories: ['character'] },
  { id: 'ar-23', groupKey: 'archetype', label: '셰프 (요리사)', applicableCategories: ['character'] }
];

// ============================================================================
// 2. 카테고리별 세부유형 (Subtype) 시드 — 슬래시 묶음 항목 완전히 개별 독립 분류
// ============================================================================

export const CATEGORY_SUBTYPES: Record<ArchiveCategory, SubtypeItem[]> = {
  character: [
    // 종족 분리
    { id: 'sub-char-1', name: '종족 - 인간', category: 'character', description: '다재다능하고 다양한 문화권의 인물' },
    { id: 'sub-char-2a', name: '종족 - 엘프', category: 'character', description: '숲과 자연을 사랑하고 숲의 지혜를 가진 신비로운 존재', recommendedMoods: ['신비로운', '은은한'], recommendedPhonetics: ['유음 (ㄹ 위주)', '비음 (ㅁㄴㅇ 위주)'] },
    { id: 'sub-char-2b', name: '종족 - 하이엘프', category: 'character', description: '고대 순혈 왕가 출신으로 우아하고 결점이 없는 고귀한 인물', recommendedMoods: ['고귀함', '우아함', '장엄한'], recommendedPhonetics: ['개방모음 (ㅏㅑ 위주)', '유음 (ㄹ 위주)'] },
    { id: 'sub-char-2c', name: '종족 - 다크엘프', category: 'character', description: '밤의 지혜와 기습에 능하며 도도하고 서늘한 암흑 숲의 족속', recommendedMoods: ['서늘한 차가운', '은밀하고 서늘한'], recommendedPhonetics: ['날카로운 소리 (Kiki형)'] },
    { id: 'sub-char-3a', name: '종족 - 드워프', category: 'character', description: '단단하고 강인하며 대장간과 광산을 지배하는 명장 족속', recommendedMoods: ['견고한', '거침 야만적'], recommendedPhonetics: ['파열음 겹받침 (묵직함)', '경음 (된소리 ㄲㄸㅃㅆㅉ)'] },
    { id: 'sub-char-3b', name: '종족 - 하프링 (호빗)', category: 'character', description: '체구는 작지만 손재주가 좋고 눈치가 빠르며 민첩한 종족', recommendedMoods: ['유쾌함', '시원하고 경쾌한'], recommendedPhonetics: ['단음절 (1~2자)'] },
    { id: 'sub-char-3c', name: '종족 - 수인 (야수족)', category: 'character', description: '야수적 감각과 강렬한 혈기를 가진 묘족, 수인 전사', recommendedMoods: ['야만적인', '혈기왕성 열혈'], recommendedPhonetics: ['경음 (된소리 ㄲㄸㅃㅆㅉ)'] },
    { id: 'sub-char-4a', name: '종족 - 마족', category: 'character', description: '치명적인 마기와 위압감을 품은 마계의 족속', recommendedMoods: ['위압적인', '서늘한 차가운'], recommendedPhonetics: ['격음 (거센소리 ㅋㅌㅍㅊ)', '날카로운 소리 (Kiki형)'] },
    { id: 'sub-char-4b', name: '종족 - 반마족', category: 'character', description: '인간과 마족의 피가 섞여 갈등하는 고독한 혼혈 존재', recommendedMoods: ['우울함 고독', '퇴폐적인'], recommendedPhonetics: ['폐쇄모음 (ㅣㅡ 위주)'] },
    { id: 'sub-char-4c', name: '종족 - 마왕 (데몬로드)', category: 'character', description: '마계를 통치하며 절대적인 힘과 정복욕을 지닌 치세자', recommendedMoods: ['압도적인 압도감', '오만함', '칠흑 같은'], recommendedPhonetics: ['파열음 겹받침 (묵직함)'] },
    { id: 'sub-char-5a', name: '종족 - 천사', category: 'character', description: '천상계 신의 명을 받아 신성한 은총과 날개를 지닌 수호자', recommendedMoods: ['성스러운', '신성하고 찬란한'], recommendedPhonetics: ['둥근 소리 (Bouba형)', '유음 (ㄹ 위주)'] },
    { id: 'sub-char-5b', name: '종족 - 신족 (신격체)', category: 'character', description: '초월적 권능을 지니고 인간 세상을 관조하는 전설적 존재', recommendedMoods: ['장엄한', '오만함'], recommendedPhonetics: ['낭독형 서사조 (3글자 대칭)'] },
    { id: 'sub-char-5c', name: '종족 - 영령 (고대 영웅)', category: 'character', description: '역사 속 전설이 영혼 상태로 소환된 불멸의 무사', recommendedMoods: ['고귀함', '충의지사 절개'], recommendedPhonetics: ['한자 성어형 4음절'] },
    { id: 'sub-char-6a', name: '종족 - 흡혈귀 (뱀파이어)', category: 'character', description: '퇴폐적이고 매혹적이며 불사의 피와 붉은 눈을 가진 영주', recommendedMoods: ['퇴폐적인', '피비린내 나는 잔혹한'], recommendedPhonetics: ['비음 (ㅁㄴㅇ 위주)', '폐쇄모음 (ㅣㅡ 위주)'] },
    { id: 'sub-char-6b', name: '종족 - 언데드 (리치)', category: 'character', description: '죽음을 극복하고 영혼을 마도서에 묶은 사령의 군주', recommendedMoods: ['음산한', '저주받은'], recommendedPhonetics: ['날카로운 소리 (Kiki형)'] },
    // 직군 분리
    { id: 'sub-char-7a', name: '직군 - 기사 (소드마스터)', category: 'character', description: '검기를 다루며 규율과 충의를 지키는 무사' },
    { id: 'sub-char-7b', name: '직군 - 마검사', category: 'character', description: '검과 원소 마법을 동시에 자유자재로 구사하는 퓨전 전사' },
    { id: 'sub-char-8a', name: '직군 - 대마법사 (탑주)', category: 'character', description: '마탑을 이끌며 아카나 서사를 통달한 지혜로운 학자' },
    { id: 'sub-char-8b', name: '직군 - 흑마법사', category: 'character', description: '금기의 마술과 저주, 역마법을 연마하는 잔혹한 술사' },
    { id: 'sub-char-8c', name: '직군 - 네크로맨서 (강령술사)', category: 'character', description: '사령과 불사의 군단을 부리며 유골을 조종하는 자' },
    { id: 'sub-char-9a', name: '직군 - 암살자 (살수)', category: 'character', description: '그림자 속에서 일격필살을 지향하는 은밀한 살인귀' },
    { id: 'sub-char-9b', name: '직군 - 도적 (괴도)', category: 'character', description: '자유분방하고 민첩하며 보물을 추적하는 길드원' },
    { id: 'sub-char-10', name: '직군 - 헌터 (S급 에이스)', category: 'character', description: '현대 어반 판타지 게이트를 정복하는 능력자', recommendedMoods: ['카리스마', '압도적인 압도감'], recommendedPhonetics: ['단음절 (1~2자)'] },
    { id: 'sub-char-11', name: '직군 - 성좌 (신의 대리인)', category: 'character', description: '차원 너머에서 계약자를 관조하는 절대적 존재', recommendedMoods: ['장엄한', '신비로운', '오만함'], recommendedPhonetics: ['낭독형 서사조 (3글자 대칭)'] },
    { id: 'sub-char-12a', name: '직군 - 무림인 (정파 고수)', category: 'character', description: '단전과 내공을 수행하여 경지에 오른 정통 무협 검객' },
    { id: 'sub-char-12b', name: '직군 - 선인 (선협 단전수행자)', category: 'character', description: '영기를 흡수하여 비선하고 신선이 되는 선협 세계관 지배자', recommendedMoods: ['침착함 냉정', '견고한'], recommendedPhonetics: ['한자 성어형 4음절'] },
    // 웹소설 인재 직군 추가
    { id: 'sub-char-13', name: '직군 - 인방 스트리머 (BJ)', category: 'character', description: '성좌 방송 및 헌터 채널을 운영하는 인기 스트리머' },
    { id: 'sub-char-14', name: '직군 - 셰프 (마도 요리사)', category: 'character', description: '마수 식재료와 영약으로 미식을 연성하는 귀농 요리사' },
    { id: 'sub-char-15', name: '직군 - 수전노 상인 (연금술사)', category: 'character', description: '돈과 물품에 민감하며 이득을 철저히 계산하는 수전노' }
  ],
  equipment: [
    {
      id: 'sub-eq-sword-a',
      name: '냉병기 - 장검 (롱소드)',
      category: 'equipment',
      description: '정통 기사 및 검사들이 사용하는 균형 잡힌 명검',
      recommendedMoods: ['고귀함', '장엄한', '성스러운'],
      recommendedPhonetics: ['다음절 (3자 이상)', '유음 (ㄹ 위주)', '개방모음 (ㅏㅑ 위주)']
    },
    {
      id: 'sub-eq-sword-b',
      name: '냉병기 - 대검 (클레이모어)',
      category: 'equipment',
      description: '육중하고 묵직하게 적의 장갑을 파쇄하는 거대 도검',
      recommendedMoods: ['위압적인', '파괴적인', '견고한'],
      recommendedPhonetics: ['파열음 겹받침 (묵직함)']
    },
    {
      id: 'sub-eq-dagger-a',
      name: '냉병기 - 단검 (스틸레토)',
      category: 'equipment',
      description: '암살자가 갑옷 틈새를 찌르기 위해 벼린 예리한 송곳 단검',
      recommendedMoods: ['은은한', '신비로운'],
      recommendedPhonetics: ['단음절 (1~2자)', '날카로운 소리 (Kiki형)', '폐쇄모음 (ㅣㅡ 위주)']
    },
    {
      id: 'sub-eq-dagger-b',
      name: '냉병기 - 비도 (표창/암기)',
      category: 'equipment',
      description: '무림 살수나 닌자가 은밀히 투척하는 암기류',
      recommendedMoods: ['은밀하고 서늘한'],
      recommendedPhonetics: ['단음절 (1~2자)']
    },
    {
      id: 'sub-eq-blunt-a',
      name: '타격무기 - 워해머',
      category: 'equipment',
      description: '드워프 및 중갑 기사들이 사용하는 묵직한 전투망치',
      recommendedMoods: ['파괴적인', '야만적인', '위압적인'],
      recommendedPhonetics: ['파열음 겹받침 (묵직함)', '경음 (된소리 ㄲㄸㅃㅆㅉ)']
    },
    {
      id: 'sub-eq-blunt-b',
      name: '타격무기 - 메이스 (철퇴)',
      category: 'equipment',
      description: '성기사나 사제들이 사용하는 철퇴 무기',
      recommendedMoods: ['성스러운', '견고한']
    },
    {
      id: 'sub-eq-polearm-a',
      name: '장병기 - 창 (스피어/삼지창)',
      category: 'equipment',
      description: '찌르기에 특화된 신속한 리치의 장병기',
      recommendedMoods: ['위압적인', '견고한']
    },
    {
      id: 'sub-eq-polearm-b',
      name: '장병기 - 할버드 (미늘창)',
      category: 'equipment',
      description: '도끼와 창이 결합된 중장병 전용 대형 무기',
      recommendedMoods: ['장엄한', '파괴적인']
    },
    {
      id: 'sub-eq-ranged-a',
      name: '투사무기 - 장궁 (엘프활)',
      category: 'equipment',
      description: '정밀하고 유려하게 원거리 목표를 사살하는 정령 활',
      recommendedMoods: ['은은한', '고요한'],
      recommendedPhonetics: ['날카로운 소리 (Kiki형)']
    },
    {
      id: 'sub-eq-ranged-b',
      name: '투사무기 - 석궁 (크로스보우)',
      category: 'equipment',
      description: '강력한 관통력으로 철갑을 뚫는 기계식 활',
      recommendedMoods: ['기계적 냉정한']
    },
    {
      id: 'sub-eq-magic-a',
      name: '마법무구 - 스태프 (지팡이)',
      category: 'equipment',
      description: '마정석이 박혀 원소 마법을 증폭시키는 지팡이',
      recommendedMoods: ['신비로운', '성스러운', '몽환적인']
    },
    {
      id: 'sub-eq-magic-b',
      name: '마법무구 - 그리모어 (마도서)',
      category: 'equipment',
      description: '고대 마법 공식과 저주가 기록된 영혼 마도서',
      recommendedMoods: ['저주받은', '음산한']
    },
    {
      id: 'sub-eq-armor-a',
      name: '방어구 - 플레이트 아머 (판금갑옷)',
      category: 'equipment',
      description: '전신을 철통같이 보호하는 무적의 판금 갑주',
      recommendedMoods: ['견고한', '장엄한']
    },
    {
      id: 'sub-eq-armor-b',
      name: '방어구 - 수호 방패',
      category: 'equipment',
      description: '아군을 보호하고 마법 충격을 흡수하는 문양 방패',
      recommendedMoods: ['성스러운', '견고한']
    },
    {
      id: 'sub-eq-accessory-a',
      name: '장신구 - 인장 반지',
      category: 'equipment',
      description: '귀족 및 마탑주의 권위를 상징하는 마력 반지',
      recommendedMoods: ['고귀함', '은은한']
    },
    {
      id: 'sub-eq-accessory-b',
      name: '장신구 - 아뮬렛 (신성 부적)',
      category: 'equipment',
      description: '저주와 흑마법을 막아주는 영험한 펜던트',
      recommendedMoods: ['신비로운', '성스러운']
    },
    {
      id: 'sub-eq-gun-a',
      name: '마도공학 - 마도권총 (리볼버)',
      category: 'equipment',
      description: '마정탄을 연사하는 현대/어반 판타지 마도 권총',
      recommendedMoods: ['기계적 냉정한', '파괴적인']
    },
    {
      id: 'sub-eq-gun-b',
      name: '마도공학 - 나노 드론 (아티팩트)',
      category: 'equipment',
      description: '성좌 시스템 및 헌터 장비 전용 첨단 지원 기기',
      recommendedMoods: ['압도적인 압도감']
    }
  ],
  location: [
    { id: 'sub-loc-mountain-a', name: '지형 - 험준한 산맥', category: 'location', description: '만년설과 절벽으로 이루어진 험준한 산악지대' },
    { id: 'sub-loc-mountain-b', name: '지형 - 봉우리 (영봉)', category: 'location', description: '신선이나 드래곤이 거주하는 하늘과 맞닿은 봉우리' },
    { id: 'sub-loc-forest-a', name: '지형 - 신비한 숲 (대림)', category: 'location', description: '엘프와 정령들이 거주하는 고대 삼림' },
    { id: 'sub-loc-forest-b', name: '지형 - 저주받은 수풀 (마수 숲)', category: 'location', description: '마수와 흑마법사가 숨어드는 위험한 지대' },
    { id: 'sub-loc-sea-a', name: '지형 - 해안 항구도시', category: 'location', description: '무역 상선과 해적들이 번화한 항구' },
    { id: 'sub-loc-sea-b', name: '지형 - 심해 군도', category: 'location', description: '크라켄과 수인이 서식하는 전설의 섬' },
    { id: 'sub-loc-desert-a', name: '지형 - 사막 황무지', category: 'location', description: '뜨거운 태양과 오아시스가 교차하는 모래사막' },
    { id: 'sub-loc-desert-b', name: '지형 - 유목지대', category: 'location', description: '야만 부족과 용병들이 건너는 고원' },
    { id: 'sub-loc-city-a', name: '지형 - 제국 왕도', category: 'location', description: '황궁과 귀족 전각이 늘어선 대도시' },
    { id: 'sub-loc-city-b', name: '지형 - 요새 성채', category: 'location', description: '마수의 침공을 막아내는 철통 방어 성벽' },
    { id: 'sub-loc-dungeon-a', name: '지형 - 지하 미궁 (던전)', category: 'location', description: '함정과 몬스터가 도사린 보물 미궁' },
    { id: 'sub-loc-dungeon-b', name: '지형 - 봉인된 유적', category: 'location', description: '고대 문명이 멸망하고 남긴 슬픔의 폐허' },
    { id: 'sub-loc-gate-a', name: '지형 - 차원 게이트', category: 'location', description: '헌터들이 진입하는 시공간 붉은 균열' },
    { id: 'sub-loc-gate-b', name: '지형 - 파멸의 탑', category: 'location', description: '층마다 몬스터와 시련이 기다리는 탑' },
    { id: 'sub-loc-academy-a', name: '지형 - 제국 아카데미', category: 'location', description: '귀족 자제들과 헌터 사관생들이 경쟁하는 캠퍼스' },
    { id: 'sub-loc-academy-b', name: '지형 - 무림 맹주 전각 (문파)', category: 'location', description: '화산파, 무당파, 마교 교단이 위치한 무림 영지' }
  ],
  skill: [
    { id: 'sub-sk-elemental-a', name: '계열 - 화염 마법', category: 'skill', description: '불꽃과 메테오를 일으키는 파괴적 마법' },
    { id: 'sub-sk-elemental-b', name: '계열 - 빙설 마법', category: 'skill', description: '동결과 얼음 송곳으로 제압하는 냉기 술법' },
    { id: 'sub-sk-elemental-c', name: '계열 - 뇌전 마법', category: 'skill', description: '벼락과 체인 라이트닝을 내리치는 신속 마법' },
    { id: 'sub-sk-elemental-d', name: '계열 - 폭풍 마법', category: 'skill', description: '칼바람과 기류를 조종하는 바람 마법' },
    { id: 'sub-sk-wuxia-a', name: '계열 - 검기 검강', category: 'skill', description: '검 끝에 이기어검과 검강을 맺는 절대 초식' },
    { id: 'sub-sk-wuxia-b', name: '계열 - 경공 보법', category: 'skill', description: '물 위를 달리고 허공을 밟는 신법' },
    { id: 'sub-sk-wuxia-c', name: '계열 - 단전 내공 심법', category: 'skill', description: '운기조식으로 내력을 축적하는 진기 술법' },
    { id: 'sub-sk-holy-a', name: '계열 - 신성 치유술', category: 'skill', description: '상처를 즉시 복원하는 정화 및 힐링 가호' },
    { id: 'sub-sk-holy-b', name: '계열 - 결계 보호막', category: 'skill', description: '마기와 저주를 방어하는 신성 아우라' },
    { id: 'sub-sk-curse-a', name: '계열 - 흑마술 저주', category: 'skill', description: '상대의 정신과 육체를 부식시키는 쇠약 주술' },
    { id: 'sub-sk-curse-b', name: '계열 - 강령술 (네크로맨시)', category: 'skill', description: '유골과 죽은 자를 일으켜 언데드 군단을 만드는 부활술' },
    { id: 'sub-sk-constellation-a', name: '계열 - 성좌 권능', category: 'skill', description: '스폰서 신격체가 하사하는 초월적 패시브 특성' },
    { id: 'sub-sk-constellation-b', name: '계열 - 시스템 상태창 스킬', category: 'skill', description: '레벨업 및 퀘스트 보상으로 획득하는 스킬' }
  ],
  etc: [
    { id: 'sub-etc-knights-a', name: '조직 - 제국 기사단', category: 'etc', description: '황실을 수호하는 맹세의 정예 기사단' },
    { id: 'sub-etc-knights-b', name: '조직 - 성기사단', category: 'etc', description: '교단 신의 명으로 마기를 토벌하는 십자군' },
    { id: 'sub-etc-merchant-a', name: '조직 - 거대 상단', category: 'etc', description: '대륙 전역의 물품과 아티팩트를 유통하는 가문' },
    { id: 'sub-etc-merchant-b', name: '조직 - 헌터 길드', category: 'etc', description: '레이드 공격대와 던전 지분을 관리하는 S급 길드' },
    { id: 'sub-etc-cult-a', name: '조직 - 신성 교단', category: 'etc', description: '빛의 신을 모시는 대륙 최고 권위의 종교 단체' },
    { id: 'sub-etc-cult-b', name: '조직 - 비밀 성회 (이교도)', category: 'etc', description: '심연의 마왕을 부활시키려는 음밀한 흑마법 결사' },
    { id: 'sub-etc-mercenary-a', name: '조직 - 붉은 용병단', category: 'etc', description: '골드만 주면 어떤 전쟁이든 참전하는 베테랑 결사' },
    { id: 'sub-etc-mercenary-b', name: '조직 - 암살 길드 (살수문)', category: 'etc', description: '의뢰인의 피값을 받고 흑색 살인을 집행하는 첩보망' },
    { id: 'sub-etc-family-a', name: '조직 - 무림 정파 세가', category: 'etc', description: '남궁세가, 모용세가 등 혈통 전승 가문' },
    { id: 'sub-etc-family-b', name: '조직 - 천마신교 (마교)', category: 'etc', description: '십십만 교도를 이끄는 absolute 강자의 무림 단체' }
  ]
};

// ============================================================================
// 3. 시대 및 시대별 가변 지역/문화권 계층 구조 (Simplification Redesign)
// ============================================================================

export interface RegionHierarchyItem {
  major: string;
  subRegions: string[];
}

export const ERA_LIST: import('../components/workspace/types').EraType[] = ['고대', '중세', '근대', '현대', '미래/SF'];

export const DYNAMIC_ERA_REGIONS: Record<import('../components/workspace/types').EraType, RegionHierarchyItem[]> = {
  '현대': [
    { major: '동아시아 한자권', subRegions: ['한국 (현대)', '중국 (현대)', '일본 (현대)'] },
    { major: '영어권 (Anglo-American)', subRegions: ['미국 (북미)', '영국 (브리튼)', '아일랜드/켈트', '호주/뉴질랜드'] },
    { major: '서유럽권', subRegions: ['프랑스', '독일', '이탈리아', '스페인/포르투갈'] },
    { major: '동유럽/슬라브권', subRegions: ['러시아', '폴란드', '체코/슬로바키아'] },
    { major: '중동/아랍권', subRegions: ['이집트', '사우디/아랍', '터키/안돌아'] },
    { major: '어반/SF 구역', subRegions: ['어반 판타지 게이트', '사이버펑크 메가시티'] }
  ],
  '중세': [
    { major: '동양 한자권 (고전)', subRegions: ['조선 (중기/후기)', '고려 (발해/신라)', '당/송 무협', '명/청 무협', '일본 (전국/에도)'] },
    { major: '서양 중세권', subRegions: ['서양 정통 중세 (기사/귀족)', '북유럽 바이킹 (전사)', '켈트 족속 (드루이드)', '그리스/로마 전승', '르네상스 이탈리아'] },
    { major: '중동/사막 오아시스', subRegions: ['바빌로니아/아랍', '페르시아 실크로드', '이집트 파라오'] },
    { major: '기타/하이 판타지', subRegions: ['하이 판타지 제국', '드워프 대장간', '엘프 고대 삼림'] }
  ],
  '고대': [
    { major: '고대 동방권', subRegions: ['고구려/신라/백제', '고대 단군/고조선', '한나라/춘추전국'] },
    { major: '고대 서방권', subRegions: ['로마 제국', '고대 그리스', '메소포타미아/바빌론', '고대 이집트 (신왕국)'] },
    { major: '신화/부족 전승', subRegions: ['북유럽 신화 전승', '켈트 원시 부족', '아즈텍/마야'] }
  ],
  '근대': [
    { major: '동아시아 근대', subRegions: ['대한제국/일제강점기', '청말/민국초', '메이지/대정 개화기'] },
    { major: '서구 산업 근대', subRegions: ['빅토리아 영국 (스팀펑크)', '미국 서부 개척 시대', '서유럽 산업혁명'] }
  ],
  '미래/SF': [
    { major: '우주/스페이스', subRegions: ['스페이스 오페라 연방', '행성 연합 제국', '사이버펑크 구역'] },
    { major: '포스트 아포칼립스', subRegions: ['황무지 황폐 구역', '지하 쉘터 방주', 'AI 관리 도시'] }
  ]
};

