import type { MythologyEntry } from '../components/workspace/types';

export const MYTHOLOGY_SEEDS: MythologyEntry[] = [
  // 한국 전통 / 동양 설화
  {
    id: 'myth-kor-01',
    culture: '한국전통',
    storyTitle: '단군신화',
    characterName: '환웅 (桓雄)',
    romanization: 'Hwanung',
    koreanReading: '환웅',
    meaning: '하늘에서 내려온 밝고 거대한 영웅',
    storySummary: '널리 인간 세상을 이롭게 하고자(홍익인간) 웅녀와 결합하여 고조선을 건국한 신성한 군주.',
    fameLevel: 'major',
    tags: ['건국', '하늘', '홍익인간', '신성', '군주'],
    sourceUrl: 'https://ko.wikipedia.org/wiki/%EB%8B%A8%EA%B5%B0%EC%8B%A0%ED%99%94',
    derivedNames: ['환영', '웅천', '환림', '천웅', '홍범', '웅림']
  },
  {
    id: 'myth-kor-02',
    culture: '한국전통',
    storyTitle: '바리공주 설화',
    characterName: '바리데기 (捨棄)',
    romanization: 'Baridegi',
    koreanReading: '바리공주',
    meaning: '버려진 자이자 저승과 이승을 잇는 구원자',
    storySummary: '일곱 번째 딸로 태어나 버림받았으나, 병든 부모를 구하기 위해 저승의 생명수를 구하러 고난의 여정을 떠난 영혼의 인도자.',
    fameLevel: 'major',
    tags: ['구원', '희생', '영혼의 인도자', '저승', '효심'],
    sourceUrl: 'https://ko.wikipedia.org/wiki/%EB%B0%94%EB%A6%AC%EA%B3%B5%EC%A3%BC',
    derivedNames: ['바리', '진오리', '령아', '연화', '무령', '서천']
  },
  {
    id: 'myth-kor-03',
    culture: '한국전통',
    storyTitle: '구미호전',
    characterName: '여우누이 (九尾狐)',
    romanization: 'Yeowunui',
    koreanReading: '구미호',
    meaning: '천 년 동안 수련하여 아홉 꼬리를 얻은 신비한 존재',
    storySummary: '인간이 되기 위해 간 백 개를 먹거나 비밀을 유지해야 했던 슬프고 치명적인 여우 요괴.',
    fameLevel: 'major',
    tags: ['요괴', '변신', '비밀', '환상', '유혹'],
    derivedNames: ['아홉', '유화', '미령', '호아', '은호', '연화']
  },
  {
    id: 'myth-kor-04',
    culture: '한국전통',
    storyTitle: '도깨비 감투',
    characterName: '김서방 도깨비',
    romanization: 'Dokkaebi',
    koreanReading: '도깨비',
    meaning: '방망이와 감투로 장난과 풍요를 부리는 장난꾸러기 정령',
    storySummary: '착한 이에게는 금은보화를 주고 악한 이에게는 벌을 주는 해학적인 한국 고유의 신령.',
    fameLevel: 'major',
    tags: ['트릭스터', '해학', '변신', '금은보화', '정령'],
    derivedNames: ['깨비', '두억', '도령', '망이', '감투', '귀마']
  },
  {
    id: 'myth-kor-05',
    culture: '한국전통',
    storyTitle: '아기장수 우투리',
    characterName: '우투리',
    romanization: 'Uturi',
    koreanReading: '우투리',
    meaning: '날개를 지니고 태어난 민중의 비운의 영웅',
    storySummary: '날개를 타고 태어나 새로운 세상을 열고자 했으나 조정의 두려움으로 인해 비극적인 결말을 맞이한 비운의 장수.',
    fameLevel: 'minor',
    tags: ['비운', '날개', '영웅', '민중', '혁명'],
    derivedNames: ['우혁', '날개', '투리', '비천', '우령', '천우']
  },

  // 그리스 / 로마 신화
  {
    id: 'myth-gr-01',
    culture: '그리스로마',
    storyTitle: '오디세이아',
    characterName: '오디세우스 (Odysseus)',
    romanization: 'Odysseus',
    koreanReading: '오디세우스',
    meaning: '증오받는 자이자 지혜로운 방랑자',
    storySummary: '트로이 전쟁 후 10년간의 모험과 시련을 지혜와 괴략으로 이겨내고 고향 이타카로 돌아간 영웅.',
    fameLevel: 'major',
    tags: ['지혜', '방랑', '귀환', '트로이', '계략', '영웅의 여정'],
    sourceUrl: 'https://ko.wikipedia.org/wiki/%EC%98%A4%EB%94%94%EC%84%B8%EC%9A%B0%EC%8A%A4',
    derivedNames: ['오디스', '세우스', '이타카', '오르테', '디세우스', '유리스']
  },
  {
    id: 'myth-gr-02',
    culture: '그리스로마',
    storyTitle: '프로메테우스의 불',
    characterName: '프로메테우스 (Prometheus)',
    romanization: 'Prometheus',
    koreanReading: '프로메테우스',
    meaning: '먼저 생각하는 자이자 인류의 구원자',
    storySummary: '제우스의 명을 어기고 인간에게 불을 전해준 죄로 바위에 묶여 매일 독수리에게 간을 쪼아먹히는 형벌을 참아낸 티탄.',
    fameLevel: 'major',
    tags: ['희생', '불', '지혜', '지식', '반역', '티탄'],
    derivedNames: ['프로메', '티탄', '메테우스', '프롬', '테우스', '아그니스']
  },
  {
    id: 'myth-gr-03',
    culture: '그리스로마',
    storyTitle: '페르세포네의 계절',
    characterName: '페르세포네 (Persephone)',
    romanization: 'Persephone',
    koreanReading: '페르세포네',
    meaning: '파괴를 가져오는 자이자 지하세계의 여왕',
    storySummary: '하데스에게 납치되어 석류 알을 먹고 1년의 일부를 지하세계의 여왕으로 보내는 봄과 죽음의 여신.',
    fameLevel: 'major',
    tags: ['여왕', '지하세계', '봄', '석류', '이중성'],
    derivedNames: ['페르세', '포네', '코레', '하데라', '세포네', '아도니스']
  },
  {
    id: 'myth-gr-04',
    culture: '그리스로마',
    storyTitle: '이카로스의 날개',
    characterName: '이카로스 (Icarus)',
    romanization: 'Icarus',
    koreanReading: '이카로스',
    meaning: '태양을 향해 비상한 경솔한 추락자',
    storySummary: '밀랍 날개를 타고 미궁을 탈출했으나 태양에 너무 가까이 다가가 날개가 녹아 바다에 추락한 인물.',
    fameLevel: 'major',
    tags: ['욕망', '추락', '날개', '태양', '경고'],
    derivedNames: ['이카르', '카로스', '데달', '비상', '솔라리스', '이카']
  },

  // 북유럽 신화
  {
    id: 'myth-nor-01',
    culture: '북유럽',
    storyTitle: '에다 (Edda)',
    characterName: '오딘 (Odin / Allfather)',
    romanization: 'Odin',
    koreanReading: '오딘',
    meaning: '지혜를 위해 외눈을 바친 모든 것의 아버지',
    storySummary: '지혜의 샘물을 마시기 위해 한쪽 눈을 바치고, 룬 문자의 비밀을 얻기 위해 스스로를 세계수에 목매단 북신들의 왕.',
    fameLevel: 'major',
    tags: ['지혜', '외눈', '마법', '룬', '지휘관', '희생'],
    sourceUrl: 'https://ko.wikipedia.org/wiki/%EC%98%A4%EB%94%98',
    derivedNames: ['오딘', '발드르', '그림닐', '한기르', '오드', '보르']
  },
  {
    id: 'myth-nor-02',
    culture: '북유럽',
    storyTitle: '라그나로크',
    characterName: '로키 (Loki)',
    romanization: 'Loki',
    koreanReading: '로키',
    meaning: '불꽃이자 변화와 변신을 부르는 장난의 신',
    storySummary: '거인족의 피를 가진 짓궂은 변신술사. 빛의 신 발드르를 죽게 하고 라그나로크 때 신들에 맞서 싸운 트릭스터.',
    fameLevel: 'major',
    tags: ['트릭스터', '변신', '배신', '불꽃', '라그나로크'],
    derivedNames: ['로키', '록스', '라그나', '펜릴', '요르무', '스카디']
  },
  {
    id: 'myth-nor-03',
    culture: '북유럽',
    storyTitle: '볼송가 사가',
    characterName: '시구르드 (Sigurd / Siegfried)',
    romanization: 'Sigurd',
    koreanReading: '시구르드',
    meaning: '용을 벤 승리의 보호자',
    storySummary: '성검 그람을 고쳐 잡고 사악한 용 파프니르를 처단한 후 용의 피를 받아 불사의 몸이 된 북유럽 제일의 영웅.',
    fameLevel: 'major',
    tags: ['드래곤슬레이어', '성검', '불사', '영웅', '비극'],
    derivedNames: ['시구르', '그람', '파프', '브륀', '지그', '하겐']
  },

  // 켈트 / 아서왕 전설
  {
    id: 'myth-cel-01',
    culture: '켈트',
    storyTitle: '쿠훌린의 전설',
    characterName: '쿠훌린 (Cú Chulainn)',
    romanization: 'Cu Chulainn',
    koreanReading: '쿠훌린',
    meaning: '컬린의 사냥개이자 붉은 자루의 마창사',
    storySummary: '마창 가에 볼크를 들고 광란의 분노(리앗 마하)를 품어 얼스터를 수호한 켈트 최고의 붉은 대용사.',
    fameLevel: 'major',
    tags: ['마창', '광란', '용맹', '사냥개', '충성'],
    derivedNames: ['쿠훌', '울스터', '볼크', '세탄타', '에머', '스카하']
  },
  {
    id: 'myth-cel-02',
    culture: '켈트',
    storyTitle: '그림자 섬의 마녀',
    characterName: '스카하 (Scáthach)',
    romanization: 'Scathach',
    koreanReading: '스카하',
    meaning: '그림자의 영지 게이트를 지키는 여무신',
    storySummary: '죽음의 국경 지대인 그림자 섬을 통치하며 쿠훌린에게 마창 술법과 비기를 전수한 전설의 무술 스승.',
    fameLevel: 'major',
    tags: ['스승', '마창', '그림자', '여전사', '비기'],
    derivedNames: ['스카', '하티', '그림자', '게이트', '단나', '메이브']
  },

  // 아랍 / 이슬람 / 천일야화
  {
    id: 'myth-ara-01',
    culture: '아랍',
    storyTitle: '천일야화 (1001 Nights)',
    characterName: '셰헤라자드 (Scheherazade)',
    romanization: 'Scheherazade',
    koreanReading: '셰헤라자드',
    meaning: '도시의 자유로운 영혼이자 이야기의 구원자',
    storySummary: '잔혹한 왕 샤흐리야르의 처형을 막기 위해 천 하루 동안 매일 밤 흥미진진한 이야기를 이어나간 현명한 여인.',
    fameLevel: 'major',
    tags: ['지혜', '이야기', '구원', '현자', '아라비아'],
    derivedNames: ['셰헤라', '자드', '샤흐', '사막', '자스민', '알딘']
  },
  {
    id: 'myth-ara-02',
    culture: '아랍',
    storyTitle: '솔로몬의 지니',
    characterName: '지니 (Jinn / Ifrit)',
    romanization: 'Jinn',
    koreanReading: '지니',
    meaning: '연기 없는 불꽃에서 태어난 고대의 정령',
    storySummary: '램프나 병 속에 갇혀 소원을 들어주거나 강력한 마법을 휘두르는 사막의 마령.',
    fameLevel: 'major',
    tags: ['정령', '소원', '마법', '불꽃', '봉인'],
    derivedNames: ['이프리', '지니', '자파', '마리드', '술탄', '연기']
  }
];
