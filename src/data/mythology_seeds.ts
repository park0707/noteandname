import type { MythologyEntry } from '../components/workspace/types';

export const MYTHOLOGY_SEEDS: MythologyEntry[] = [
  // ==========================================================================
  // 1. 한국 전통 / 고대 설화 (Korean Mythology & Folklore)
  // ==========================================================================
  {
    id: 'myth-kor-01',
    culture: '한국전통',
    storyTitle: '단군신화',
    characterName: '환웅 (桓雄)',
    romanization: 'Hwanung',
    koreanReading: '환웅',
    meaning: '하늘에서 내려온 밝고 거대한 영웅',
    storySummary: '널리 인간 세상을 이롭게 하고자(홍익인간) 천부인 3개와 풍백·운사·우사를 거느리고 내려와 고조선을 건국한 신성한 군주.',
    fameLevel: 'major',
    tags: ['한국 전통', '정통 판타지', '고귀함', '카리스마', '신성하고 찬란한', '신성/빛', '군주/치세자', '성좌/신격체'],
    categoryTags: {
      genre: ['한국 전통', '정통 판타지'],
      trait: ['고귀함', '카리스마'],
      mood: ['신성하고 찬란한', '장엄한'],
      element: ['신성/빛', '바람/폭풍'],
      archetype: ['군주/치세자', '성좌/신격체']
    },
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
    storySummary: '일곱 번째 딸로 태어나 버림받았으나, 병든 부모를 구하기 위해 서천서역국 가시밭길을 거쳐 생명수를 구해온 영혼의 인도자.',
    fameLevel: 'major',
    tags: ['한국 전통', '스릴러/오컬트/퇴마', '헌신적/충직', '순정파', '은밀하고 서늘한', '영혼/사령', '구원자/희생자', '신탁의 아이/성녀'],
    categoryTags: {
      genre: ['한국 전통', '스릴러/오컬트/퇴마'],
      trait: ['헌신적/충직', '순정파'],
      mood: ['은밀하고 서늘한', '서정적이고 아련한'],
      element: ['영혼/사령'],
      archetype: ['구원자/희생자', '신탁의 아이/성녀']
    },
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
    meaning: '천 년 동안 수련하여 아홉 꼬리를 얻은 신비한 요선',
    storySummary: '인간이 되기 위해 백 일의 기도를 드리거나 인간의 간을 취했던 치명적이고 매혹적인 여우 요괴.',
    fameLevel: 'major',
    tags: ['한국 전통', '괴수물/크리처', '도도함/자존심', '퇴폐미/나른함', '퇴폐적인', '환영/환술', '혈통/피', '흑막/조종자'],
    categoryTags: {
      genre: ['한국 전통', '괴수물/크리처'],
      trait: ['도도함/자존심', '퇴폐미/나른함'],
      mood: ['퇴폐적인', '은밀하고 서늘한'],
      element: ['환영/환술', '혈통/피'],
      archetype: ['흑막/조종자', '괴도/방랑자']
    },
    derivedNames: ['아홉', '유화', '미령', '호아', '은호', '연화']
  },
  {
    id: 'myth-kor-04',
    culture: '한국전통',
    storyTitle: '도깨비 감투',
    characterName: '김서방 도깨비',
    romanization: 'Dokkaebi',
    koreanReading: '도깨비',
    meaning: '방망이와 감투로 장난과 풍요를 부리는 정령',
    storySummary: '착한 이에게는 금은보화를 선물하고 악한 이에게는 짓궂은 벌을 내리는 해학적인 한국 고유의 신령.',
    fameLevel: 'major',
    tags: ['한국 전통', '착각계/코미디', '장난기/장난꾸러기', '마이페이스/엉뚱', '시원하고 경쾌한', '보석/금속', '괴도/방랑자'],
    categoryTags: {
      genre: ['한국 전통', '착각계/코미디'],
      trait: ['장난기/장난꾸러기', '마이페이스/엉뚱'],
      mood: ['시원하고 경쾌한'],
      element: ['보석/금속', '환영/환술'],
      archetype: ['괴도/방랑자']
    },
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
    storySummary: '겨드랑이에 날개를 타고 태어나 새로운 세상을 열고자 했으나, 왕권의 두려움과 배신으로 비극적인 결말을 맞이한 영웅.',
    fameLevel: 'minor',
    tags: ['한국 전통', '대체역사/사극', '우울함/고독', '혈기왕성/열혈', '공허한/허무한', '깃털/날개', '구원자/희생자', '가문의 수치/서자'],
    categoryTags: {
      genre: ['한국 전통', '대체역사/사극'],
      trait: ['우울함/고독', '혈기왕성/열혈'],
      mood: ['공허한/허무한', '서정적이고 아련한'],
      element: ['깃털/날개'],
      archetype: ['구원자/희생자', '가문의 수치/서자']
    },
    derivedNames: ['우혁', '날개', '투리', '비천', '우령', '천우']
  },
  {
    id: 'myth-kor-06',
    culture: '한국전통',
    storyTitle: '설문대할망 설화',
    characterName: '설문대할망',
    romanization: 'Seolmundae',
    koreanReading: '설문대할망',
    meaning: '제주도를 창조한 태초의 거인 어머니',
    storySummary: '치마폭으로 흙을 날라 한라산과 360여 개의 오름을 만들고, 자식들을 위해 죽음마저 헌신한 태초의 창세 거인 여신.',
    fameLevel: 'major',
    tags: ['한국 전통', '정통 판타지', '고귀함', '헌신적/충직', '장엄한', '대지/바위', '성좌/신격체', '군주/치세자'],
    categoryTags: {
      genre: ['한국 전통', '정통 판타지'],
      trait: ['고귀함', '헌신적/충직'],
      mood: ['장엄한', '아늑하고 따뜻한'],
      element: ['대지/바위', '자연/나무'],
      archetype: ['성좌/신격체', '군주/치세자']
    },
    derivedNames: ['설문', '한라', '탐라', '제우', '할망', '대지']
  },
  {
    id: 'myth-kor-07',
    culture: '한국전통',
    storyTitle: '차사본풀이 (저승사자)',
    characterName: '강림도령 (降臨)',
    romanization: 'Gangrim',
    koreanReading: '강림도령',
    meaning: '이승과 저승을 호령하는 차사 사령관',
    storySummary: '염라대왕의 명을 받아 죽은 자의 영혼을 착오 없이 저승으로 인도하는 명리하고 용맹한 저승 차사 수장.',
    fameLevel: 'major',
    tags: ['한국 전통', '스릴러/오컬트/퇴마', '침착함/냉정', '카리스마', '은밀하고 서늘한', '암흑/그림자', '영혼/사령', '첩보원/간작', '용병대장'],
    categoryTags: {
      genre: ['한국 전통', '스릴러/오컬트/퇴마'],
      trait: ['침착함/냉정', '카리스마'],
      mood: ['은밀하고 서늘한', '위압적인'],
      element: ['암흑/그림자', '영혼/사령'],
      archetype: ['첩보원/간작', '용병대장']
    },
    derivedNames: ['강림', '차사', '염라', '적라', '명부', '사령']
  },

  // ==========================================================================
  // 2. 중국 / 동양 무협 신화 (Chinese & Far-East Mythology)
  // ==========================================================================
  {
    id: 'myth-cn-01',
    culture: '중국 무협',
    storyTitle: '서유기 (西遊記)',
    characterName: '손오공 (孫悟空 / 제천대성)',
    romanization: 'Sun Wukong',
    koreanReading: '손오공',
    meaning: '공(空)을 깨달은 화과산 돌원숭이 무신',
    storySummary: '여의봉과 근두운을 부리며 옥황상제의 천궁을 뒤흔든 제천대성이자, 삼장법사를 호위하여 81가지 고난을 극복한 트릭스터 영웅.',
    fameLevel: 'major',
    tags: ['중국 무협', '신무협/선협', '마이페이스/엉뚱', '카리스마', '시원하고 경쾌한', '뇌전/번개', '바람/폭풍', '성좌/신격체', '은둔고수/도인'],
    categoryTags: {
      genre: ['중국 무협', '신무협/선협'],
      trait: ['마이페이스/엉뚱', '카리스마'],
      mood: ['시원하고 경쾌한', '위압적인'],
      element: ['뇌전/번개', '바람/폭풍'],
      archetype: ['성좌/신격체', '은둔고수/도인']
    },
    derivedNames: ['제천', '오공', '화과', '여의', '대성', '천공']
  },
  {
    id: 'myth-cn-02',
    culture: '중국 무협',
    storyTitle: '봉신연의 (封神演義)',
    characterName: '나타 (哪吒 / 삼두육비)',
    romanization: 'Nezha',
    koreanReading: '나타',
    meaning: '혼천릉과 풍화륜을 부리는 소년 태자',
    storySummary: '연꽃으로 다시 태어나 삼두육비의 법력과 풍화륜을 타고 용왕의 아들을 꺾은 거침없는 동자 무신.',
    fameLevel: 'major',
    tags: ['중국 무협', '신무협/선협', '혈기왕성/열혈', '거침/야만적', '타오르는/뜨거운', '화염/불꽃', '아카데미 수석/학생', '황태자/소공자'],
    categoryTags: {
      genre: ['중국 무협', '신무협/선협'],
      trait: ['혈기왕성/열혈', '거침/야만적'],
      mood: ['타오르는/뜨거운', '파괴적인'],
      element: ['화염/불꽃'],
      archetype: ['아카데미 수석/학생', '황태자/소공자']
    },
    derivedNames: ['나타', '태자', '풍화', '혼천', '연화', '육비']
  },
  {
    id: 'myth-cn-03',
    culture: '중국 무협',
    storyTitle: '탁록의 대전 (고대 전승)',
    characterName: '치우천왕 (蚩尤)',
    romanization: 'Chiyou',
    koreanReading: '치우',
    meaning: '구리 머리와 철 이마를 가진 81형제의 병신(兵神)',
    storySummary: '황제 헌원에 맞서 탁록에서 거대한 안개와 군대를 부리며 전쟁의 신으로 추앙받은 철혈 무제.',
    fameLevel: 'major',
    tags: ['중국 무협', '무협-마교/혈교', '냉혹함', '광기', '피비린내 나는/잔혹한', '혈마/마기', '혈통/피', '군주/치세자', '소드마스터/검성'],
    categoryTags: {
      genre: ['중국 무협', '무협-마교/혈교'],
      trait: ['냉혹함', '광기'],
      mood: ['피비린내 나는/잔혹한', '위압적인'],
      element: ['혈마/마기', '혈통/피'],
      archetype: ['군주/치세자', '소드마스터/검성']
    },
    derivedNames: ['치우', '탁록', '구드리', '병신', '투신', '철두']
  },
  {
    id: 'myth-cn-04',
    culture: '중국 무협',
    storyTitle: '창세 신화 (女媧補天)',
    characterName: '여와 (女媧)',
    romanization: 'Nuwa',
    koreanReading: '여와',
    meaning: '황토로 인류를 빚고 붉은 돌로 하늘을 기운 어머니',
    storySummary: '공공과 전욱의 싸움으로 무너진 하늘의 구멍을 오색 돌을 녹여 메우고 인류를 살려낸 인면뱀신의 태초 여신.',
    fameLevel: 'major',
    tags: ['중국 무협', '선협-선인/단전', '고귀함', '헌신적/충직', '신성하고 찬란한', '대지/바위', '유리가루/수정', '성좌/신격체', '구원자/희생자'],
    categoryTags: {
      genre: ['중국 무협', '선협-선인/단전'],
      trait: ['고귀함', '헌신적/충직'],
      mood: ['신성하고 찬란한', '장엄한'],
      element: ['대지/바위', '유리가루/수정'],
      archetype: ['성좌/신격체', '구원자/희생자']
    },
    derivedNames: ['여와', '오색', '보천', '인면', '황토', '태초']
  },

  // ==========================================================================
  // 3. 일본 헤이안 & 요괴 전승 (Japanese Mythology & Folklore)
  // ==========================================================================
  {
    id: 'myth-jp-01',
    culture: '일본 헤이안/요괴',
    storyTitle: '고사기 (古事記)',
    characterName: '아마테라스 (天照大御神)',
    romanization: 'Amaterasu',
    koreanReading: '아마테라스',
    meaning: '하늘에서 온 세상을 환히 비추는 태양의 여신',
    storySummary: '남동생 스사노오의 행패에 은신 동굴에 숨어 세상에 암흑을 가져왔으나, 삼종신기의 주인이 된 일본의 최고 신.',
    fameLevel: 'major',
    tags: ['일본 헤이안/요괴', '정통 판타지', '고귀함', '우아함', '신성하고 찬란한', '신성/빛', '성좌/신격체', '군주/치세자'],
    categoryTags: {
      genre: ['일본 헤이안/요괴', '정통 판타지'],
      trait: ['고귀함', '우아함'],
      mood: ['신성하고 찬란한', '화려한'],
      element: ['신성/빛'],
      archetype: ['성좌/신격체', '군주/치세자']
    },
    derivedNames: ['아마', '테라스', '야타', '곡옥', '천조', '광휘']
  },
  {
    id: 'myth-jp-02',
    culture: '일본 헤이안/요괴',
    storyTitle: '야마타노오로치 퇴치',
    characterName: '스사노오 (素戔嗚尊)',
    romanization: 'Susanoo',
    koreanReading: '스사노오',
    meaning: '여덟 머리의 뱀을 벤 폭풍과 바다의 신',
    storySummary: '독주로 야마타노오로치를 씌워 꼬리에서 천총운검(쿠사나기)을 획득하고 거친 폭풍을 다스린 거친 용사.',
    fameLevel: 'major',
    tags: ['일본 헤이안/요괴', '다크 판타지', '거침/야만적', '혈기왕성/열혈', '파괴적인', '바람/폭풍', '바다/해일', '소드마스터/검성'],
    categoryTags: {
      genre: ['일본 헤이안/요괴', '다크 판타지'],
      trait: ['거침/야만적', '혈기왕성/열혈'],
      mood: ['파괴적인', '위압적인'],
      element: ['바람/폭풍', '바다/해일'],
      archetype: ['소드마스터/검성']
    },
    derivedNames: ['스사', '노오', '쿠사나기', '오로치', '폭풍', '운검']
  },
  {
    id: 'myth-jp-03',
    culture: '일본 헤이안/요괴',
    storyTitle: '음양사 전설 (陰陽師)',
    characterName: '아베 노 세이메이 (安倍晴明)',
    romanization: 'Abe no Seimei',
    koreanReading: '아베노 세이메이',
    meaning: '백여귀행을 저지한 헤이안 최강의 음양사',
    storySummary: '여우 여신의 피를 이어받아 식신 12신장을 부리며 수도 교토의 음양 결계를 수호한 전설적인 대음양사.',
    fameLevel: 'major',
    tags: ['일본 헤이안/요괴', '스릴러/오컬트/퇴마', '침착함/냉정', '지략가/책사', '신비로운', '환영/환술', '주술/부적', '탑의 주인(탑주)', '은둔고수/도인'],
    categoryTags: {
      genre: ['일본 헤이안/요괴', '스릴러/오컬트/퇴마'],
      trait: ['침착함/냉정', '지략가/책사'],
      mood: ['신비로운', '은밀하고 서늘한'],
      element: ['환영/환술', '주술/부적'],
      archetype: ['탑의 주인(탑주)', '은둔고수/도인']
    },
    derivedNames: ['세이메이', '아베', '식신', '오망성', '음양', '천황']
  },

  // ==========================================================================
  // 4. 그리스 / 로마 신화 (Greek & Roman Mythology)
  // ==========================================================================
  {
    id: 'myth-gr-01',
    culture: '그리스로마',
    storyTitle: '오디세이아',
    characterName: '오디세우스 (Odysseus)',
    romanization: 'Odysseus',
    koreanReading: '오디세우스',
    meaning: '증오받는 자이자 지혜로운 방랑자',
    storySummary: '트로이 목마 계략을 세우고 10년간의 괴물과 마녀의 시련을 이겨내고 고향 이타카로 돌아간 지략의 영웅.',
    fameLevel: 'major',
    tags: ['그리스로마', '서양 판타지', '지략가/책사', '교활함/지혜', '서정적이고 아련한', '바다/해일', '차원 방랑자', '괴도/방랑자'],
    categoryTags: {
      genre: ['그리스로마', '서양 판타지'],
      trait: ['지략가/책사', '교활함/지혜'],
      mood: ['서정적이고 아련한', '시원하고 경쾌한'],
      element: ['바다/해일'],
      archetype: ['차원 방랑자', '괴도/방랑자']
    },
    sourceUrl: 'https://ko.wikipedia.org/wiki/%EC%98%A4%EB%94%98%EC%84%B8%EC%9A%B0%EC%8A%A4',
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
    storySummary: '제우스 몰래 올림포스의 불꽃을 훔쳐 인간에게 바친 죄로, 바위에 묶여 매일 독수리에게 간을 파먹히는 희생을 견딘 티탄.',
    fameLevel: 'major',
    tags: ['그리스로마', '하이 판타지', '헌신적/충직', '지략가/책사', '공허한/허무한', '화염/불꽃', '구원자/희생자', '성좌/신격체'],
    categoryTags: {
      genre: ['그리스로마', '하이 판타지'],
      trait: ['헌신적/충직', '지략가/책사'],
      mood: ['공허한/허무한', '장엄한'],
      element: ['화염/불꽃'],
      archetype: ['구원자/희생자', '성좌/신격체']
    },
    derivedNames: ['프로메', '티탄', '메테우스', '프롬', '테우스', '아그니스']
  },
  {
    id: 'myth-gr-03',
    culture: '그리스로마',
    storyTitle: '이아손과 금양모피',
    characterName: '메데이아 (Medeia)',
    romanization: 'Medeia',
    koreanReading: '메데이아',
    meaning: '사랑에 모든 것을 바쳤으나 배신당한 복수의 비극 마녀',
    storySummary: '이아손의 금양모피 획득을 돕기 위해 가문과 남동생까지 버렸으나 끝내 배신당하자, 잔혹한 복수를 감행한 비운의 고대 마녀.',
    fameLevel: 'major',
    tags: ['그리스로마', '다크 판타지', '얀데레/집착', '잔혹함', '피비린내 나는/잔혹한', '독/맹독', '암흑/그림자', '흑막/조종자', '가문의 수치/서자'],
    categoryTags: {
      genre: ['그리스로마', '다크 판타지'],
      trait: ['얀데레/집착', '잔혹함'],
      mood: ['피비린내 나는/잔혹한', '은밀하고 서늘한'],
      element: ['독/맹독', '암흑/그림자'],
      archetype: ['흑막/조종자', '가문의 수치/서자']
    },
    derivedNames: ['메데이', '메데이라', '이아라', '콜키스', '파르테', '에리니스']
  },
  {
    id: 'myth-gr-04',
    culture: '그리스로마',
    storyTitle: '페르세포네의 계절',
    characterName: '페르세포네 (Persephone)',
    romanization: 'Persephone',
    koreanReading: '페르세포네',
    meaning: '파괴를 가져오는 자이자 지하세계의 여왕',
    storySummary: '하데스에게 납치되어 석류를 먹고 1년의 절반은 지하세계 여왕, 절반은 봄의 여신으로 살아가는 이중성의 여신.',
    fameLevel: 'major',
    tags: ['그리스로마', '로맨스 판타지', '우아함', '퇴폐미/나른함', '몽환적인', '암흑/그림자', '자연/나무', '황태자/소공자', '성좌/신격체'],
    categoryTags: {
      genre: ['그리스로마', '로맨스 판타지'],
      trait: ['우아함', '퇴폐미/나른함'],
      mood: ['몽환적인', '은밀하고 서늘한'],
      element: ['암흑/그림자', '자연/나무'],
      archetype: ['황태자/소공자', '성좌/신격체']
    },
    derivedNames: ['페르세', '포네', '코레', '하데라', '세포네', '아도니스']
  },
  {
    id: 'myth-gr-05',
    culture: '그리스로마',
    storyTitle: '이카로스의 날개',
    characterName: '이카로스 (Icarus)',
    romanization: 'Icarus',
    koreanReading: '이카로스',
    meaning: '태양을 향해 비상한 경솔한 추락자',
    storySummary: '밀랍 날개를 타고 미궁을 탈출했으나 오만함에 태양으로 다가가 밀랍이 녹아 바다로 추락한 신화적 상징.',
    fameLevel: 'major',
    tags: ['그리스로마', '하이 판타지', '오만함', '혈기왕성/열혈', '공허한/허무한', '깃털/날개', '화염/불꽃', '가문의 수치/서자', '구원자/희생자'],
    categoryTags: {
      genre: ['그리스로마', '하이 판타지'],
      trait: ['오만함', '혈기왕성/열혈'],
      mood: ['공허한/허무한', '타오르는/뜨거운'],
      element: ['깃털/날개', '화염/불꽃'],
      archetype: ['가문의 수치/서자', '구원자/희생자']
    },
    derivedNames: ['이카르', '카로스', '데달', '비상', '솔라리스', '이카']
  },
  {
    id: 'myth-gr-06',
    culture: '그리스로마',
    storyTitle: '아킬레우스의 노래',
    characterName: '아킬레우스 (Achilles)',
    romanization: 'Achilles',
    koreanReading: '아킬레우스',
    meaning: '스틱스 강에 몸을 담근 불사의 영웅',
    storySummary: '어머니 테티스가 스틱스 강에 담가 불사의 몸을 얻었으나 뒷발목(아킬레스건)이 유일한 약점으로 남아 트로이에서 전사한 무신.',
    fameLevel: 'major',
    tags: ['그리스로마', '서양 판타지', '혈기왕성/열혈', '오만함', '위압적인', '혈통/피', '소드마스터/검성', '황태자/소공자'],
    categoryTags: {
      genre: ['그리스로마', '서양 판타지'],
      trait: ['혈기왕성/열혈', '오만함'],
      mood: ['위압적인', '피비린내 나는/잔혹한'],
      element: ['혈통/피'],
      archetype: ['소드마스터/검성', '황태자/소공자']
    },
    derivedNames: ['아킬레', '스틱스', '테티스', '헥토르', '파트로', '아킬']
  },

  // ==========================================================================
  // 5. 북유럽 (Nordic) 신화
  // ==========================================================================
  {
    id: 'myth-nor-01',
    culture: '북유럽/바이킹',
    storyTitle: '에다 (Edda)',
    characterName: '오딘 (Odin / Allfather)',
    romanization: 'Odin',
    koreanReading: '오딘',
    meaning: '지혜를 위해 외눈을 바친 최고신',
    storySummary: '미미르의 샘물을 마시기 위해 한쪽 눈을 바치고 룬 문자의 지혜를 얻기 위해 세계수에 9일간 목을 매단 집념의 주신.',
    fameLevel: 'major',
    tags: ['북유럽/바이킹', '하이 판타지', '냉철한 완벽주의자', '카리스마', '장엄한', '시간/공간', '성좌/신격체', '군주/치세자', '탑의 주인(탑주)'],
    categoryTags: {
      genre: ['북유럽/바이킹', '하이 판타지'],
      trait: ['냉철한 완벽주의자', '카리스마'],
      mood: ['장엄한', '은밀하고 서늘한'],
      element: ['시간/공간'],
      archetype: ['성좌/신격체', '군주/치세자', '탑의 주인(탑주)']
    },
    sourceUrl: 'https://ko.wikipedia.org/wiki/%EC%98%A4%EB%94%98',
    derivedNames: ['오딘', '발드르', '그림닐', '한기르', '오드', '보르']
  },
  {
    id: 'myth-nor-02',
    culture: '북유럽/바이킹',
    storyTitle: '라그나로크',
    characterName: '로키 (Loki)',
    romanization: 'Loki',
    koreanReading: '로키',
    meaning: '변신과 책략을 부리는 불꽃의 트릭스터',
    storySummary: '신들의 편과 거인의 편을 넘나들며 발드르를 죽음으로 몰아넣고 라그나로크 종말의 군대를 이끈 교활한 신.',
    fameLevel: 'major',
    tags: ['북유럽/바이킹', '다크 판타지', '교활함/지혜', '마이페이스/엉뚱', '혼돈스러운', '화염/불꽃', '환영/환술', '흑막/조종자', '괴도/방랑자'],
    categoryTags: {
      genre: ['북유럽/바이킹', '다크 판타지'],
      trait: ['교활함/지혜', '마이페이스/엉뚱'],
      mood: ['혼돈스러운', '퇴폐적인'],
      element: ['화염/불꽃', '환영/환술'],
      archetype: ['흑막/조종자', '괴도/방랑자']
    },
    derivedNames: ['로키', '록스', '라그나', '펜릴', '요르무', '스카디']
  },
  {
    id: 'myth-nor-03',
    culture: '북유럽/바이킹',
    storyTitle: '볼송가 사가',
    characterName: '시구르드 (Sigurd / Siegfried)',
    romanization: 'Sigurd',
    koreanReading: '시구르드',
    meaning: '용을 벤 승리의 성검 영웅',
    storySummary: '성검 그람으로 용 파프니르를 처단하고 용의 피를 마셔 새들의 말을 알아듣고 불사가 된 북유럽 대표 영웅.',
    fameLevel: 'major',
    tags: ['북유럽/바이킹', '정통 판타지', '헌신적/충직', '순정파', '성스러운', '용/드래곤', '혈통/피', '소드마스터/검성', '구원자/희생자'],
    categoryTags: {
      genre: ['북유럽/바이킹', '정통 판타지'],
      trait: ['헌신적/충직', '순정파'],
      mood: ['성스러운', '장엄한'],
      element: ['용/드래곤', '혈통/피'],
      archetype: ['소드마스터/검성', '구원자/희생자']
    },
    derivedNames: ['시구르', '그람', '파프', '브륀', '지그', '하겐']
  },
  {
    id: 'myth-nor-04',
    culture: '북유럽/바이킹',
    storyTitle: '발키리의 선택',
    characterName: '브륀힐트 (Brynhildr)',
    romanization: 'Brynhildr',
    koreanReading: '브륀힐트',
    meaning: '갑주를 입은 전장의 오딘의 수호 천사',
    storySummary: '오딘의 뜻을 어기고 좋아하는 영웅을 살려 징벌의 불꽃 고리에 갇혔으나 시구르드와 비극적 사랑을 맺은 발키리 수장.',
    fameLevel: 'major',
    tags: ['북유럽/바이킹', '하이 판타지', '도도함/자존심', '순정파', '서늘한/차가운', '화염/불꽃', '신탁의 아이/성녀', '소드마스터/검성'],
    categoryTags: {
      genre: ['북유럽/바이킹', '하이 판타지'],
      trait: ['도도함/자존심', '순정파'],
      mood: ['서늘한/차가운', '타오르는/뜨거운'],
      element: ['화염/불꽃'],
      archetype: ['신탁의 아이/성녀', '소드마스터/검성']
    },
    derivedNames: ['브륀', '힐트', '발키리', '시그륀', '구드룬', '힐더']
  },
  {
    id: 'myth-nor-05',
    culture: '북유럽/바이킹',
    storyTitle: '라그나로크의 파멸 마수',
    characterName: '펜릴 (Fenrir)',
    romanization: 'Fenrir',
    koreanReading: '펜릴',
    meaning: '신들의 사슬 글레이프니르를 끊은 사악한 거구 늑대',
    storySummary: '신들이 두려워하여 족쇄로 구속했으나 라그나로크 때 사슬을 풀고 주신 오딘을 삼켜버린 파멸의 거마수.',
    fameLevel: 'major',
    tags: ['북유럽/바이킹', '그림다크', '광기', '거침/야만적', '파괴적인', '암흑/그림자', '소환수/신수', '흑막/조종자'],
    categoryTags: {
      genre: ['북유럽/바이킹', '그림다크'],
      trait: ['광기', '거침/야만적'],
      mood: ['파괴적인', '위압적인'],
      element: ['암흑/그림자'],
      archetype: ['소환수/신수', '흑막/조종자']
    },
    derivedNames: ['펜릴', '글레이', '스콜', '하티', '괴수', '마랑']
  },

  // ==========================================================================
  // 6. 켈트 & 아서왕 전설 (Celtic & Arthurian Legend)
  // ==========================================================================
  {
    id: 'myth-cel-01',
    culture: '켈트',
    storyTitle: '쿠훌린의 전설',
    characterName: '쿠훌린 (Cú Chulainn)',
    romanization: 'Cu Chulainn',
    koreanReading: '쿠훌린',
    meaning: '컬린의 사냥개이자 마창 가에 볼크의 주인',
    storySummary: '마창 가에 볼크를 들고 전장에서 피의 분노(리앗 마하)를 품어 홀로 얼스터를 지켜낸 붉은 대용사.',
    fameLevel: 'major',
    tags: ['켈트', '서양 판타지', '혈기왕성/열혈', '헌신적/충직', '피비린내 나는/잔혹한', '혈통/피', '소드마스터/검성', '용병대장'],
    categoryTags: {
      genre: ['켈트', '서양 판타지'],
      trait: ['혈기왕성/열혈', '헌신적/충직'],
      mood: ['피비린내 나는/잔혹한', '위압적인'],
      element: ['혈통/피'],
      archetype: ['소드마스터/검성', '용병대장']
    },
    derivedNames: ['쿠훌', '울스터', '볼크', '세탄타', '에머', '스카하']
  },
  {
    id: 'myth-cel-02',
    culture: '켈트',
    storyTitle: '그림자 섬의 마녀',
    characterName: '스카하 (Scáthach)',
    romanization: 'Scathach',
    koreanReading: '스카하',
    meaning: '그림자 성의 게이트를 통치하는 여무신',
    storySummary: '죽음과 이계의 국경 지대인 그림자 섬을 지키며 쿠훌린에게 마창 술법과 룬 비기를 전수한 불사의 전사 스승.',
    fameLevel: 'major',
    tags: ['켈트', '다크 판타지', '냉철한 완벽주의자', '침착함/냉정', '은밀하고 서늘한', '암흑/그림자', '영혼/사령', '은둔고수/도인', '탑의 주인(탑주)'],
    categoryTags: {
      genre: ['켈트', '다크 판타지'],
      trait: ['냉철한 완벽주의자', '침착함/냉정'],
      mood: ['은밀하고 서늘한', '위압적인'],
      element: ['암흑/그림자', '영혼/사령'],
      archetype: ['은둔고수/도인', '탑의 주인(탑주)']
    },
    derivedNames: ['스카', '하티', '그림자', '게이트', '단나', '메이브']
  },
  {
    id: 'myth-cel-03',
    culture: '켈트',
    storyTitle: '엑스칼리버와 원탁',
    characterName: '아서 왕 (King Arthur)',
    romanization: 'Arthur',
    koreanReading: '아서왕',
    meaning: '바위에 꽂힌 칼을 뽑은 영원의 기사왕',
    storySummary: '바위에 꽂힌 필멸의 칼을 뽑아 브리튼을 통일하고 원탁의 기사단을 끌어 모았으나 아들 모드레드의 반역으로 아발론으로 떠난 기사왕.',
    fameLevel: 'major',
    tags: ['켈트', '정통 판타지', '고귀함', '카리스마', '성스러운', '신성/빛', '군주/치세자', '소드마스터/검성', '구원자/희생자'],
    categoryTags: {
      genre: ['켈트', '정통 판타지'],
      trait: ['고귀함', '카리스마'],
      mood: ['성스러운', '장엄한'],
      element: ['신성/빛'],
      archetype: ['군주/치세자', '소드마스터/검성', '구원자/희생자']
    },
    derivedNames: ['아서', '펜드래곤', '카멜롯', '아발론', '아트르', '칼리번']
  },
  {
    id: 'myth-cel-04',
    culture: '켈트',
    storyTitle: '아발론의 마녀',
    characterName: '모르간 레 페이 (Morgan le Fay)',
    romanization: 'Morgan le Fay',
    koreanReading: '모르간',
    meaning: '아발론의 환영 마법사이자 왕의 누이',
    storySummary: '아서 왕의 이복누이이자 강력한 고대 드루이드 마법을 전수받아 카멜롯을 위협하고 마법을 부린 미스터리한 마녀.',
    fameLevel: 'major',
    tags: ['켈트', '다크 판타지', '도도함/자존심', '지략가/책사', '퇴폐적인', '환영/환술', '암흑/그림자', '흑막/조종자', '가문의 수치/서자'],
    categoryTags: {
      genre: ['켈트', '다크 판타지'],
      trait: ['도도함/자존심', '지략가/책사'],
      mood: ['퇴폐적인', '은밀하고 서늘한'],
      element: ['환영/환술', '암흑/그림자'],
      archetype: ['흑막/조종자', '가문의 수치/서자']
    },
    derivedNames: ['모르간', '페이', '아발라', '르페이', '모르가나', '비비안']
  },

  // ==========================================================================
  // 7. 이집트 신화 (Egyptian Mythology)
  // ==========================================================================
  {
    id: 'myth-egy-01',
    culture: '이집트/신화',
    storyTitle: '오시리스의 부활',
    characterName: '오시리스 (Osiris)',
    romanization: 'Osiris',
    koreanReading: '오시리스',
    meaning: '죽음과 부활을 관장하는 저승의 영원한 왕',
    storySummary: '동생 세트의 질투로 갈갈이 찢겨 죽임을 당했으나 아내 이시스의 마법으로 부활하여 저승에서 영혼을 심판하는 저승의 왕.',
    fameLevel: 'major',
    tags: ['이집트/신화', '정통 판타지', '고귀함', '침착함/냉정', '장엄한', '영혼/사령', '군주/치세자', '성좌/신격체', '구원자/희생자'],
    categoryTags: {
      genre: ['이집트/신화', '정통 판타지'],
      trait: ['고귀함', '침착함/냉정'],
      mood: ['장엄한', '고요한'],
      element: ['영혼/사령'],
      archetype: ['군주/치세자', '성좌/신격체', '구원자/희생자']
    },
    derivedNames: ['오시리스', '우실', '저승', '심판', '아누비', '나일']
  },
  {
    id: 'myth-egy-02',
    culture: '이집트/신화',
    storyTitle: '이시스의 마법',
    characterName: '이시스 (Isis)',
    romanization: 'Isis',
    koreanReading: '이시스',
    meaning: '태초의 진정한 이름을 아는 마법의 여신',
    storySummary: '라(Ra) 신의 숨겨진 진정한 이름을 빼앗아 최고 마법 권능을 얻고 찢겨진 남편 오시리스를 되살려낸 위대한 마법의 여신.',
    fameLevel: 'major',
    tags: ['이집트/신화', '하이 판타지', '지략가/책사', '헌신적/충직', '신성하고 찬란한', '신성/빛', '환영/환술', '신탁의 아이/성녀', '탑의 주인(탑주)'],
    categoryTags: {
      genre: ['이집트/신화', '하이 판타지'],
      trait: ['지략가/책사', '헌신적/충직'],
      mood: ['신성하고 찬란한', '신비로운'],
      element: ['신성/빛', '환영/환술'],
      archetype: ['신탁의 아이/성녀', '탑의 주인(탑주)']
    },
    derivedNames: ['이시스', '이시라', '마아트', '하토르', '세크메', '라미아']
  },
  {
    id: 'myth-egy-03',
    culture: '이집트/신화',
    storyTitle: '사자의 서 (Book of the Dead)',
    characterName: '아누비스 (Anubis)',
    romanization: 'Anubis',
    koreanReading: '아누비스',
    meaning: '깃털로 심장의 무게를 달아 심판하는 자칼의 신',
    storySummary: '검은 자칼의 머리를 하고 죽은 자의 심장을 진리의 깃털과 저울질하여 천국(아루)으로 갈 자를 가려내는 저승 인도자.',
    fameLevel: 'major',
    tags: ['이집트/신화', '스릴러/오컬트/퇴마', '침착함/냉정', '냉철한 완벽주의자', '은밀하고 서늘한', '영혼/사령', '암흑/그림자', '첩보원/간작'],
    categoryTags: {
      genre: ['이집트/신화', '스릴러/오컬트/퇴마'],
      trait: ['침착함/냉정', '냉철한 완벽주의자'],
      mood: ['은밀하고 서늘한', '고요한'],
      element: ['영혼/사령', '암흑/그림자'],
      archetype: ['첩보원/간작']
    },
    derivedNames: ['아누비스', '자칼', '아루', '마아트', '케프리', '아누']
  },

  // ==========================================================================
  // 8. 아랍 / 페르시아 / 중동 (Arabian & Persian Mythology)
  // ==========================================================================
  {
    id: 'myth-ara-01',
    culture: '아랍/중동',
    storyTitle: '천일야화 (1001 Nights)',
    characterName: '셰헤라자드 (Scheherazade)',
    romanization: 'Scheherazade',
    koreanReading: '셰헤라자드',
    meaning: '도시의 자유로운 영혼이자 이야기의 구원자',
    storySummary: '잔혹한 샤흐리야르 왕의 처형을 막기 위해 천 하루 동안 매일 밤 멈추지 않는 기발한 이야기를 이어간 지혜의 현자.',
    fameLevel: 'major',
    tags: ['아랍/중동', '로맨스 판타지', '지략가/책사', '우아함', '서정적이고 아련한', '시간/공간', '구원자/희생자', '아카데미 수석/학생'],
    categoryTags: {
      genre: ['아랍/중동', '로맨스 판타지'],
      trait: ['지략가/책사', '우아함'],
      mood: ['서정적이고 아련한', '은은한'],
      element: ['시간/공간'],
      archetype: ['구원자/희생자', '아카데미 수석/학생']
    },
    derivedNames: ['셰헤라', '자드', '샤흐', '사막', '자스민', '알딘']
  },
  {
    id: 'myth-ara-02',
    culture: '아랍/중동',
    storyTitle: '솔로몬의 지니',
    characterName: '지니 (Jinn / Ifrit)',
    romanization: 'Jinn',
    koreanReading: '지니',
    meaning: '연기 없는 불꽃에서 태어난 고대의 정령',
    storySummary: '청동 병이나 램프 속에 갇혀 주인에게 세 가지 소원을 들어주거나 폭풍 같은 마법을 휘두르는 불꽃 마령.',
    fameLevel: 'major',
    tags: ['아랍/중동', '하이 판타지', '장난기/장난꾸러기', '마이페이스/엉뚱', '화려한', '화염/불꽃', '바람/폭풍', '소환수/신수'],
    categoryTags: {
      genre: ['아랍/중동', '하이 판타지'],
      trait: ['장난기/장난꾸러기', '마이페이스/엉뚱'],
      mood: ['화려한', '몽환적인'],
      element: ['화염/불꽃', '바람/폭풍'],
      archetype: ['소환수/신수']
    },
    derivedNames: ['이프리', '지니', '자파', '마리드', '술탄', '연기']
  },
  {
    id: 'myth-ara-03',
    culture: '아랍/중동',
    storyTitle: '샤나메 (왕좌의 서)',
    characterName: '자하크 (Zahhak / Azhi Dahaka)',
    romanization: 'Zahhak',
    koreanReading: '자하크',
    meaning: '양 어깨에 인간의 뇌를 먹는 뱀이 자라난 사악한 뱀왕',
    storySummary: '악마 앙그라 마이뉴의 입맞춤으로 어깨에 뱀 두 마리가 자라나 천 년간 독재와 악행을 저지른 페르시아의 사악한 마왕.',
    fameLevel: 'major',
    tags: ['아랍/중동', '다크 판타지', '잔혹함', '광기', '피비린내 나는/잔혹한', '독/맹독', '혈통/피', '흑막/조종자', '군주/치세자'],
    categoryTags: {
      genre: ['아랍/중동', '다크 판타지'],
      trait: ['잔혹함', '광기'],
      mood: ['피비린내 나는/잔혹한', '칠흑 같은'],
      element: ['독/맹독', '혈통/피'],
      archetype: ['흑막/조종자', '군주/치세자']
    },
    derivedNames: ['자하크', '다하카', '앙그라', '페레이', '마이뉴', '아지']
  },

  // ==========================================================================
  // 9. 메소포타미아 / 바빌로니아 (Mesopotamian Mythology)
  // ==========================================================================
  {
    id: 'myth-mes-01',
    culture: '메소포타미아/바빌로니아',
    storyTitle: '길가메시 서사시',
    characterName: '길가메시 (Gilgamesh)',
    romanization: 'Gilgamesh',
    koreanReading: '길가메시',
    meaning: '3분의 2는 신, 3분의 1은 인간인 태초의 수메르 영웅왕',
    storySummary: '우루크의 오만한 왕이었으나 유일한 친구 엔키두의 죽음 이후 불로불사의 약을 찾아 온 세상을 방랑한 인류 최초의 영웅.',
    fameLevel: 'major',
    tags: ['메소포타미아/바빌로니아', '하이 판타지', '오만함', '카리스마', '압도적인/압도감', '보석/금속', '군주/치세자', '성좌/신격체'],
    categoryTags: {
      genre: ['메소포타미아/바빌로니아', '하이 판타지'],
      trait: ['오만함', '카리스마'],
      mood: ['압도적인/압도감', '화려한'],
      element: ['보석/금속'],
      archetype: ['군주/치세자', '성좌/신격체']
    },
    derivedNames: ['길가', '메시', '우루크', '엔키', '에안나', '샤마슈']
  },
  {
    id: 'myth-mes-02',
    culture: '메소포타미아/바빌로니아',
    storyTitle: '에누마 엘리시 (에누마 신화)',
    characterName: '티아마트 (Tiamat)',
    romanization: 'Tiamat',
    koreanReading: '티아마트',
    meaning: '원초의 용이자 소금물의 어머니',
    storySummary: '태초의 혼돈 바다를 상징하며, 신들에게 맞서 11마리의 마수를 낳고 마르두크와 싸운 원초의 용신 여왕.',
    fameLevel: 'major',
    tags: ['메소포타미아/바빌로니아', '다크 판타지', '잔혹함', '광기', '혼돈스러운', '용/드래곤', '혼돈/심연', '성좌/신격체', '흑막/조종자'],
    categoryTags: {
      genre: ['메소포타미아/바빌로니아', '다크 판타지'],
      trait: ['잔혹함', '광기'],
      mood: ['혼돈스러운', '위압적인'],
      element: ['용/드래곤', '혼돈/심연'],
      archetype: ['성좌/신격체', '흑막/조종자']
    },
    derivedNames: ['티아', '마트', '킹구', '마르두', '아프수', '용신']
  },

  // ==========================================================================
  // 10. 슬라브 / 동유럽 신화 (Slavic Mythology & Folklore)
  // ==========================================================================
  {
    id: 'myth-sla-01',
    culture: '슬라브',
    storyTitle: '바바 야가의 닭다리 집',
    characterName: '바바 야가 (Baba Yaga)',
    romanization: 'Baba Yaga',
    koreanReading: '바바야가',
    meaning: '절구통을 타고 하늘을 날아다니는 숲속의 신비한 마녀',
    storySummary: '닭다리가 달린 울타리 집에서 살며 절구통을 타고 다니는, 길 잃은 자에게 시련과 지혜를 동시에 주는 슬라브 대표 마녀.',
    fameLevel: 'major',
    tags: ['슬라브', '스릴러/오컬트/퇴마', '교활함/지혜', '마이페이스/엉뚱', '기괴하고 기이한', '자연/나무', '주술/부적', '은둔고수/도인', '흑막/조종자'],
    categoryTags: {
      genre: ['슬라브', '스릴러/오컬트/퇴마'],
      trait: ['교활함/지혜', '마이페이스/엉뚱'],
      mood: ['기괴하고 기이한', '은밀하고 서늘한'],
      element: ['자연/나무', '주술/부적'],
      archetype: ['은둔고수/도인', '흑막/조종자']
    },
    derivedNames: ['바바', '야가', '바실', '슬라바', '이반', '마체하']
  },
  {
    id: 'myth-sla-02',
    culture: '슬라브',
    storyTitle: '불사의 코스체이',
    characterName: '코스체이 (Koshchei the Deathless)',
    romanization: 'Koshchei',
    koreanReading: '코스체이',
    meaning: '자신의 영혼을 바늘 끝에 숨겨 불사가 된 마왕',
    storySummary: '바늘 속 달걀, 달걀 속 오리, 오리 속 토끼로 영혼을 이중 봉인하여 절대 죽지 않는 슬라브의 불사 마왕.',
    fameLevel: 'major',
    tags: ['슬라브', '다크 판타지', '냉혹함', '교활함/지혜', '칠흑 같은', '영혼/사령', '암흑/그림자', '흑막/조종자', '탑의 주인(탑주)'],
    categoryTags: {
      genre: ['슬라브', '다크 판타지'],
      trait: ['냉혹함', '교활함/지혜'],
      mood: ['칠흑 같은', '은밀하고 서늘한'],
      element: ['영혼/사령', '암흑/그림자'],
      archetype: ['흑막/조종자', '탑의 주인(탑주)']
    },
    derivedNames: ['코스체', '바늘', '불사', '모레나', '체르노', '마왕']
  },

  // ==========================================================================
  // 11. 인도 / 힌두 신화 (Indian & Hindu Mythology)
  // ==========================================================================
  {
    id: 'myth-ind-01',
    culture: '인도/힌두',
    storyTitle: '마하바라타 (Mahabharata)',
    characterName: '시바 (Shiva / 마하데바)',
    romanization: 'Shiva',
    koreanReading: '시바',
    meaning: '파괴의 춤 나타라자를 추고 삼안을 가진 삼대신',
    storySummary: '이마의 세 번째 눈을 열어 세상을 파괴하고 다시 재창조하는 파괴와 춤, 그리고 고행의 절대신.',
    fameLevel: 'major',
    tags: ['인도/힌두', '하이 판타지', '카리스마', '침착함/냉정', '파괴적인', '화염/불꽃', '혼돈/심연', '성좌/신격체', '군주/치세자'],
    categoryTags: {
      genre: ['인도/힌두', '하이 판타지'],
      trait: ['카리스마', '침착함/냉정'],
      mood: ['파괴적인', '장엄한'],
      element: ['화염/불꽃', '혼돈/심연'],
      archetype: ['성좌/신격체', '군주/치세자']
    },
    derivedNames: ['시바', '마하', '나타', '루드라', '파르바', '트리슈']
  },
  {
    id: 'myth-ind-02',
    culture: '인도/힌두',
    storyTitle: '마하바라타 대전선',
    characterName: '아르주나 (Arjuna)',
    romanization: 'Arjuna',
    koreanReading: '아르주나',
    meaning: '신궁 간디바를 집어든 흰 빛의 궁수',
    storySummary: '크리슈나의 가르침(바가바드 기타)을 받고 신궁 간디바로 무수한 전장을 제패한 판다바 전사.',
    fameLevel: 'major',
    tags: ['인도/힌두', '서양 판타지', '헌신적/충직', '순정파', '신성하고 찬란한', '신성/빛', '뇌전/번개', '소드마스터/검성', '황태자/소공자'],
    categoryTags: {
      genre: ['인도/힌두', '서양 판타지'],
      trait: ['헌신적/충직', '순정파'],
      mood: ['신성하고 찬란한', '시원하고 경쾌한'],
      element: ['신성/빛', '뇌전/번개'],
      archetype: ['소드마스터/검성', '황태자/소공자']
    },
    derivedNames: ['아르주', '주나', '간디바', '판다바', '크리슈', '파르타']
  },

  // ==========================================================================
  // 12. 아메리카 원주민 / 아즈텍 신화 (Mesoamerican Mythology)
  // ==========================================================================
  {
    id: 'myth-ame-01',
    culture: '아즈텍/마야',
    storyTitle: '깃털 뱀신 전설',
    characterName: '케찰코아틀 (Quetzalcoatl)',
    romanization: 'Quetzalcoatl',
    koreanReading: '케찰코아틀',
    meaning: '녹색 깃털을 가진 바람과 농경의 뱀신',
    storySummary: '인간에게 옥수수 재배법과 역법을 가르쳐준 성스러운 깃털 뱀신이자 배를 타고 동쪽으로 떠난 후 돌아오리라 약속한 신.',
    fameLevel: 'major',
    tags: ['아즈텍/마야', '하이 판타지', '고귀함', '헌신적/충직', '신성하고 찬란한', '바람/폭풍', '깃털/날개', '성좌/신격체', '구원자/희생자'],
    categoryTags: {
      genre: ['아즈텍/마야', '하이 판타지'],
      trait: ['고귀함', '헌신적/충직'],
      mood: ['신성하고 찬란한', '평화로운'],
      element: ['바람/폭풍', '깃털/날개'],
      archetype: ['성좌/신격체', '구원자/희생자']
    },
    derivedNames: ['케찰', '코아틀', '쿠쿨칸', '바람', '깃털', '테노치']
  }
];
