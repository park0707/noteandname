import { calculateSimilarity, decomposeHangeul } from '../utils';
import type {
  ArchiveCategory,
  ArchiveItem,
  GenerateNameParams,
  HanjaEntry,
  MythologyEntry,
  NameBankItem,
  NameCandidate
} from '../types';
import { HANJA_DICTIONARY, HANJA_SURNAMES } from '../../../data/hanja_dict';
import { MYTHOLOGY_SEEDS } from '../../../data/mythology_seeds';

// ============================================================================
// 1. 카테고리별 네이밍 템플릿 어휘 워드 풀 (Pool)
// ============================================================================

const CATEGORY_WORD_POOLS: Record<ArchiveCategory, {
  prefixes: Record<string, string[]>;
  bodies: Record<string, string[]>;
  suffixes: Record<string, string[]>;
}> = {
  character: {
    prefixes: {
      '서양': ['알렉스', '루시엔', '칼엘', '아리엘', '테오', '세리스', '발레리', '길버트', '클로에', '레오', '로리안', '헬레나', '가브리엘', '베네딕트'],
      '동양': ['청운', '소룡', '백운', '서진', '도윤', '해원', '승하', '유화', '무영', '하진', '설아', '단우', '혜성', '담율'],
      '북유럽': ['에릭', '토르스', '비요른', '시구르', '헬가', '아스트리드', '프레이', '라그나', '스벤', '발드', '울프', '브륀힐트'],
      '켈트': ['아서', '랜슬롯', '가웨인', '모드레드', '트리스탄', '이졸데', '브리짓', '코맥', '피온', '메이브', '그라니아', '핀발'],
      '아랍': ['하산', '타리크', '라이라', '자인', '파티마', '오마르', '세림', '라시드', '야스민', '사밀', '카림', '나지르'],
      '중동': ['하산', '타리크', '라이라', '자인', '파티마', '오마르', '세림', '라시드', '야스민', '사밀', '카림', '나지르'],
      '그리스로마': ['아킬레스', '카시우스', '오리온', '세르펜트', '아그라이아', '테세우스', '헤르메스', '헬레네', '옥타비아', '클라우디우스'],
      '메소포타미아': ['길가메시', '엔키두', '이슈타르', '마르두크', '우투', '샤마슈', '닌후르사그', '타무즈']
    },
    bodies: {
      '판타지': ['도르', '리온', '스타', '베인', '하르트', '실바', '가드', '미르', '펠', '시아', '엘라', '노아', '르난'],
      '무협': ['풍', '검', '무', '혁', '룡', '학', '천', '강', '영', '설', '혈', '귀', '극', '혼'],
      'SF': ['크로노', '사이언', '넥서스', '제론', '볼트', '사이퍼', '노바', '코어', '레이', '하이브', '벡터', '시그마'],
      '현대': ['준', '민', '우', '현', '아', '은', '서', '율', '하', '진', '도', '연'],
      '성좌물': ['아스테르', '셀레스', '크로노스', '아이온', '에테르', '솔라리스', '루멘', '오리온']
    },
    suffixes: {
      '주인공': ['스', '엘', '아', '온', '린', '인', '원', '율', '란', '휘'],
      '빌런': ['로스', '자르', '모르', '독', '악', '마', '크로', '섀도', '바알', '베헤'],
      '조연': ['길', '수', '호', '진', '석', '찬', '영', '희', '건', '재']
    }
  },
  location: {
    prefixes: {
      '서양': ['검은', '새벽의', '바람의', '붉은', '그림자', '황금', '서리', '푸른', '용의', '달빛', '성스러운', '영원의'],
      '동양': ['청룡', '백두', '낙월', '망향', '무릉', '비룡', '운무', '천산', '수룡', '혈풍', '백학', '단목'],
      '북유럽': ['요툰', '발하', '아스가', '니플', '무스펠', '헬', '미드가', '비프로', '우르드', '엘리', '임수르'],
      '켈트': ['아발론', '에린', '알바', '타라', '티르나', '케이르', '글렌', '던', '키르', '킬', '코르크'],
      '아랍/중동': ['알제라', '바그다', '자하라', '사하라', '메디나', '오아시', '페르시아', '수크', '미나르', '다마스', '바스라']
    },
    bodies: {
      '판타지': ['계곡', '요새', '성채', '산맥', '평원', '신전', '미궁', '해안', '탑', '숲', '대륙', '회랑'],
      '무협': ['관', '문', '보', '촌', '곡', '봉', '성', '단', '도', '천', '암', '정'],
      'SF': ['섹터', '기지', '콜로니', '도킹존', '행성', '연구소', '아크', '돔', '포트', '스테이션', '궤도'],
      '현대': ['시티', '빌리지', '스퀘어', '타운', '밸리', '파크', '레지던스', '플라자', '센터', '거리', '복합체']
    },
    suffixes: {
      '기타': ['지대', '영지', '구역', '회랑', '개척지', '폐허', '요새', '성지', '결계구역', '관할지']
    }
  },
  equipment: {
    prefixes: {
      '전설': ['태초의', '파멸의', '전설의', '신성한', '용의', '불멸의', '어둠의', '천상의', '영원의', '마왕의', '별빛의', '심연의'],
      '일반': ['청동', '강철', '은빛', '흑철', '바람의', '서리의', '화염의', '번개의', '가죽', '나무', '칠흑의']
    },
    bodies: {
      '무기': ['검', '창', '도', '활', '지팡이', '망치', '단검', '채찍', '궁', '극', '권갑', '환도'],
      '방어구': ['갑주', '방패', '투구', '장갑', '부츠', '망토', '흉갑', '아머', '클록', '벨트', '면구'],
      '장신구': ['반지', '목걸이', '인장', '브로치', '아뮬렛', '크리스탈', '펜던트', '어둠석', '성배', '옥쇄', '귀걸이']
    },
    suffixes: {
      '특성': ['의 의지', '의 파도', '의 불꽃', '의 그림자', '의 서약', '의 구원', '의 심장', '의 눈물', '의 사명', '의 가호']
    }
  },
  skill: {
    prefixes: {
      '판타지': ['파이어', '아이시', '라이트닝', '섀도', '홀리', '드래곤', '아케인', '사이오닉', '카오스', '에테르', '보이드', '노바'],
      '무협': ['무영', '혈풍', '파천', '비룡', '뇌전', '유엽', '태극', '백학', '금강', '마교', '단전', '소멸'],
      'SF': ['오버드라이브', '플라즈마', '나노', '퀀텀', '펄스', '사이보그', '하이퍼', '매트릭스', '제로', '포톤', '싱귤래리티']
    },
    bodies: {
      '공격': ['참', '격', '파', '살', '포', '폭', '권', '장', '검', '창', '멸', '붕'],
      '방어/보조': ['장막', '결계', '보호막', '환영', '수호', '치유', '공간이동', '은신', '강화', '회복', '역천']
    },
    suffixes: {
      '무공': ['식', '권', '법', '술', '공', '보', '진', '결', '강', '경', '초', '오의']
    }
  },
  etc: {
    prefixes: {
      '조직': ['붉은', '검은', '황금', '그림자', '새벽', '은빛', '강철', '자주', '백호', '청룡', '현무', '주작'],
      '세력': ['철혈', '자유', '신성', '칠성', '해적', '상업', '비밀', '황실', '학술', '마법', '성좌']
    },
    bodies: {
      '단체': ['기사단', '상단', '문파', '클랜', '동맹', '연합', '길드', '의회', '교단', '학회', '가문', '세가'],
      '기타': ['제국', '공국', '연방', '원탁', '서기국', '형제단', '결사대', '비밀회', '총사령부', '기업']
    },
    suffixes: {
      '수식': ['회', '단', '파', '성', '원', '본부', '지부', '지회', '연맹', '총회']
    }
  }
};

// ============================================================================
// 2. 태그 조합 기반 이름 생성 함수
// ============================================================================

// ============================================================================
// 2. 태그 조합 기반 이름 생성 함수 (세부유형 & 상충 검사 지원)
// ============================================================================

import { DYNAMIC_ERA_REGIONS } from '../../../data/tag_taxonomy_seeds';

export function generateNamesByCombo(
  params: GenerateNameParams,
  archiveItems: ArchiveItem[] = []
): NameCandidate[] {
  const {
    targetCategory,
    customCategory,
    era = '중세',
    subRegion,
    socialClass = '귀족/양반',
    worldbuildingRuleTags = [],
    activeRuleTagIds = [],
    keywords,
    constraints,
    count = 10
  } = params;

  // 1) 시대별 동적 지역 무작위 선택 처리
  const availableEraGroups = DYNAMIC_ERA_REGIONS[era] || DYNAMIC_ERA_REGIONS['중세'];
  let resolvedSub = subRegion;

  if (!resolvedSub) {
    const randomGroup = availableEraGroups[Math.floor(Math.random() * availableEraGroups.length)];
    resolvedSub = randomGroup.subRegions[Math.floor(Math.random() * randomGroup.subRegions.length)];
  }

  // 2) 활성화된 세계관 규칙 태그 시드 및 제약 합산
  const activeRuleTags = worldbuildingRuleTags.filter(t => activeRuleTagIds.includes(t.id));
  const worldbuildingSeeds: string[] = [];
  const extraRequiredSyllables: string[] = [];
  const extraForbiddenSyllables: string[] = [];

  activeRuleTags.forEach(ruleTag => {
    if (ruleTag.name) {
      worldbuildingSeeds.push(ruleTag.name.replace(/^🏷️\s*/, ''));
    }
    if (ruleTag.customRulesPrompt) {
      const tokens = ruleTag.customRulesPrompt.split(/[\s,.;:'"()]+/).filter(t => t.length >= 2);
      worldbuildingSeeds.push(...tokens);
    }
    if (ruleTag.requiredSyllables) extraRequiredSyllables.push(...ruleTag.requiredSyllables);
    if (ruleTag.forbiddenSyllables) extraForbiddenSyllables.push(...ruleTag.forbiddenSyllables);
  });

  const mergedRequired = Array.from(new Set([...(constraints?.requiredSyllables || []), ...extraRequiredSyllables]));
  const mergedForbidden = Array.from(new Set([...(constraints?.forbiddenSyllables || []), ...extraForbiddenSyllables]));

  // 3) 자연어 키워드 어휘 토큰 분석 & 워드 풀 설정
  const hasKeywords = Boolean(keywords && keywords.trim());
  const keywordClean = keywords ? keywords.trim() : '';

  let naturalStems: string[] = [];
  let naturalPrefixes: string[] = [];
  let naturalBodies: string[] = [];

  if (hasKeywords) {
    const rawTokens = keywordClean.split(/[\s,.;:'"()!?~]+/).filter(w => w.length >= 1);
    const stopSuffixes = /(들의|에서|과의|적인|으로|부터|하고|있는|처럼|같이|에게|[은는이가을를의과와])$/;

    rawTokens.forEach(t => {
      const stripped = t.replace(stopSuffixes, '');
      if (stripped.length >= 1) naturalStems.push(stripped);
      if (t.length >= 1 && t !== stripped) naturalStems.push(t);
    });

    naturalStems = Array.from(new Set(naturalStems)).filter(Boolean);

    const phoneticSuffixes = ['스', '르', '카', '도르', '론', '투', '기르', '아', '온', '린', '시아', '엘', '로스', '하', '율', '민', '간', '칸', '라', '드', '왕', '제', '신', '존', '검'];
    naturalStems.forEach(stem => {
      naturalPrefixes.push(stem);
      naturalBodies.push(stem);
      if (stem.length >= 1 && stem.length <= 4) {
        phoneticSuffixes.forEach(syl => {
          const combined = stem + syl;
          if (combined.length <= 7) {
            naturalBodies.push(combined);
          }
        });
      }
    });
  }

  const pool = CATEGORY_WORD_POOLS[targetCategory] || CATEGORY_WORD_POOLS.character;

  let cultureKey = '서양';
  if (resolvedSub?.includes('한국') || resolvedSub?.includes('조선') || resolvedSub?.includes('고려') || resolvedSub?.includes('신라')) {
    cultureKey = '동양';
  } else if (resolvedSub?.includes('중국') || resolvedSub?.includes('무협') || resolvedSub?.includes('한나라')) {
    cultureKey = '동양';
  }

  const prefixList = hasKeywords && naturalPrefixes.length > 0
    ? naturalPrefixes
    : (pool.prefixes[cultureKey] || pool.prefixes['서양'] || pool.prefixes['전설'] || ['신비한']);

  let bodyList = hasKeywords && naturalBodies.length > 0
    ? naturalBodies
    : (pool.bodies['판타지'] || pool.bodies['무기'] || pool.bodies['공격'] || ['영혼']);

  if (customCategory) {
    const rawTokens = customCategory.trim().split(/[\s,]+/).filter(Boolean);
    bodyList = [...rawTokens, ...bodyList];
  }
  if (worldbuildingSeeds.length > 0) {
    bodyList = [...worldbuildingSeeds, ...bodyList];
  }

  const suffixList = pool.suffixes['주인공'] || pool.suffixes['기타'] || [''];

  const generatedList: NameCandidate[] = [];
  const generatedNamesSet = new Set<string>();

  let attempts = 0;
  while (generatedList.length < count && attempts < count * 35) {
    attempts++;

    let p = prefixList[Math.floor(Math.random() * prefixList.length)];
    let b = bodyList[Math.floor(Math.random() * bodyList.length)];
    const s = suffixList[Math.floor(Math.random() * suffixList.length)];

    let candidateName = '';

    if (hasKeywords) {
      // 자연어 키워드가 있는 경우 자연어 어휘 조합 우선 생성
      if (p === b) {
        candidateName = p;
      } else {
        candidateName = Math.random() > 0.4 ? `${p} ${b}`.trim() : `${p}${b}`.trim();
      }
      // 고유 명사 괄호 및 불필요 공백 정리
      candidateName = candidateName.replace(/\s+/g, ' ');
    } else if (targetCategory === 'character') {
      if (cultureKey === '동양') {
        if (socialClass === '평민') {
          const plainNames = ['돌쇠', '막동', '갑돌', '삼돌', '길동', '칠복', '덕배', '마름', '쇠똥', '바위', '달래'];
          candidateName = plainNames[Math.floor(Math.random() * plainNames.length)];
        } else if (socialClass === '선비/학자') {
          const titles = ['청운', '동방', '매화', '우암', '퇴계', '율곡', '담헌', '백운', '단정', '송암'];
          const suffixes = ['선생', '거사', '학인', '처사', '산인', '재'];
          candidateName = `${titles[Math.floor(Math.random() * titles.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
        } else {
          const surnames = ['남궁', '황보', '제갈', '독고', '사공', '이', '김', '박', '최', '정', '강', '윤'];
          const surname = surnames[Math.floor(Math.random() * surnames.length)];
          candidateName = `${surname}${b}${s}`.trim();
        }
      } else {
        if (socialClass === '평민') {
          candidateName = `${b}`.trim();
        } else if (socialClass === '선비/학자') {
          candidateName = `${p} ${b} (학인)`.trim();
        } else {
          candidateName = `${p} ${b}${s}`.trim();
          if (Math.random() > 0.5) candidateName = `${p}${s}`.trim();
        }
      }
    } else {
      candidateName = `${p} ${b}${s}`.trim();
    }

    const isEnglishExplicitlyRequested = /영어|알파벳|english|latin|로마자|영문/i.test(keywords || '');
    if (!isEnglishExplicitlyRequested) {
      if (/[가-힣]/.test(candidateName) && /[a-zA-Z]/.test(candidateName)) {
        candidateName = candidateName.replace(/[a-zA-Z]/g, '').trim();
      }
    }

    // 제약조건 체크
    if (constraints) {
      if (constraints.minLength && candidateName.length < constraints.minLength) continue;
      if (constraints.maxLength && candidateName.length > constraints.maxLength) continue;
    }

    if (mergedForbidden.length > 0) {
      const hasForbidden = mergedForbidden.some(syl => syl && candidateName.includes(syl));
      if (hasForbidden) continue;
    }

    if (mergedRequired.length > 0) {
      const hasRequired = mergedRequired.some(syl => syl && candidateName.includes(syl));
      if (!hasRequired) continue;
    }

    if (generatedNamesSet.has(candidateName)) continue;
    generatedNamesSet.add(candidateName);

    // 기존 ArchiveItem 자모 유사도 계산
    let maxSimilarity = 0;
    let matchItemName = '';

    for (const item of archiveItems) {
      const sim = calculateSimilarity(candidateName, item.name);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        matchItemName = item.name;
      }
    }

    const activeSubtypeName = customCategory || (hasKeywords ? '자연어 서사 모드' : `${era} ${resolvedSub}`);
    const meaningDesc = hasKeywords
      ? `'${keywordClean.slice(0, 24)}${keywordClean.length > 24 ? '...' : ''}' 서사 묘사에서 유래한 ${
          targetCategory === 'character' ? '인물 고유명' :
          targetCategory === 'location' ? '지명/장소명' :
          targetCategory === 'equipment' ? '장비/아이템명' :
          targetCategory === 'skill' ? '기술/마법명' : '고유 명칭'
        }`
      : `${era} [${resolvedSub}] (${socialClass}) 어감의 고유 명칭`;

    const candidateTags = hasKeywords
      ? Array.from(new Set([keywordClean.slice(0, 15), ...naturalStems.slice(0, 3)]))
      : [era, resolvedSub, socialClass].filter(Boolean) as string[];

    generatedList.push({
      id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: candidateName,
      meaning: meaningDesc,
      similarity: maxSimilarity,
      matchItem: maxSimilarity >= 75 ? matchItemName : undefined,
      category: targetCategory,
      subtype: activeSubtypeName,
      tags: candidateTags
    });
  }

  return generatedList;
}

// ============================================================================
// 3. 설화/전승 RAG 코퍼스 검색 & 파생 이름 생성 함수
// ============================================================================

export function searchMythologyEntries(
  query: string,
  selectedCultures: string[],
  fameFilter: 'all' | 'major' | 'minor' = 'all',
  archiveItems: ArchiveItem[] = []
): { entries: MythologyEntry[]; derivedCandidates: NameCandidate[] } {
  const lowerQuery = query.toLowerCase().trim();

  // 1) 신화 entries 필터링 및 유사도 스코어링
  const filtered = MYTHOLOGY_SEEDS.filter(item => {
    if (selectedCultures.length > 0 && !selectedCultures.includes(item.culture)) {
      return false;
    }
    if (fameFilter !== 'all' && item.fameLevel !== fameFilter) {
      return false;
    }
    if (!lowerQuery) return true;

    const inTitle = item.storyTitle.toLowerCase().includes(lowerQuery);
    const inName = item.characterName.toLowerCase().includes(lowerQuery);
    const inReading = (item.koreanReading || '').toLowerCase().includes(lowerQuery);
    const inSummary = item.storySummary.toLowerCase().includes(lowerQuery);
    const inTags = item.tags.some((t: string) => t.toLowerCase().includes(lowerQuery));

    return inTitle || inName || inReading || inSummary || inTags;
  });

  // 2) 파생 이름 생성 (자모 분해 및 40~70% 어감 유사도 구간 재조합)
  const derivedCandidates: NameCandidate[] = [];
  const derivedSet = new Set<string>();

  filtered.forEach(entry => {
    const rawName = entry.koreanReading || entry.characterName.split(' ')[0];
    const derivedPool = entry.derivedNames || [];

    // 시드에 포함된 derivedNames 활용
    derivedPool.forEach((dName: string) => {
      if (!derivedSet.has(dName)) {
        derivedSet.add(dName);

        let maxSim = 0;
        let matchName = '';
        archiveItems.forEach((ai: ArchiveItem) => {
          const sim = calculateSimilarity(dName, ai.name);
          if (sim > maxSim) {
            maxSim = sim;
            matchName = ai.name;
          }
        });

        derivedCandidates.push({
          id: `myth-derived-${entry.id}-${dName}`,
          name: dName,
          meaning: `'${entry.characterName}' (${entry.storyTitle})의 분위기를 계승한 파생 이름`,
          similarity: maxSim,
          matchItem: maxSim >= 75 ? matchName : undefined,
          originMythologyId: entry.id,
          originStoryTitle: entry.storyTitle,
          category: 'character',
          tags: entry.tags
        });
      }
    });

    // 음절 분해 및 재조합을 통한 실시간 파생 알고리즘
    const decomposed = decomposeHangeul(rawName, '');
    if (decomposed.length >= 2) {
      const extraSyllables = ['아', '온', '린', '시아', '엘', '로스', '하', '율', '민'];
      extraSyllables.forEach(syl => {
        const testName = rawName.substring(0, Math.max(1, rawName.length - 1)) + syl;
        const simWithOriginal = calculateSimilarity(rawName, testName);

        // 40% ~ 75% 사이의 적절히 연상되면서도 베끼지 않는 음절 구간
        if (simWithOriginal >= 40 && simWithOriginal <= 75 && !derivedSet.has(testName)) {
          derivedSet.add(testName);

          let maxSim = 0;
          let matchName = '';
          archiveItems.forEach((ai: ArchiveItem) => {
            const sim = calculateSimilarity(testName, ai.name);
            if (sim > maxSim) {
              maxSim = sim;
              matchName = ai.name;
            }
          });

          derivedCandidates.push({
            id: `myth-derived-algo-${entry.id}-${testName}`,
            name: testName,
            meaning: `'${rawName}' (${entry.storyTitle})에서 유래한 변형 파생명 (유사도 ${simWithOriginal}%)`,
            similarity: maxSim,
            matchItem: maxSim >= 75 ? matchName : undefined,
            originMythologyId: entry.id,
            originStoryTitle: entry.storyTitle,
            category: 'character',
            tags: entry.tags
          });
        }
      });
    }
  });

  return { entries: filtered, derivedCandidates };
}

// ============================================================================
// 4. 한자 조합 생성 함수
// ============================================================================

export function generateHanjaNames(
  surname: string = '李',
  meaningTag?: string,
  count: number = 8,
  archiveItems: ArchiveItem[] = []
): NameCandidate[] {
  const matchingHanja = meaningTag
    ? HANJA_DICTIONARY.filter((h: HanjaEntry) => h.meaningTag === meaningTag || h.category === meaningTag)
    : HANJA_DICTIONARY;

  const pool = matchingHanja.length > 0 ? matchingHanja : HANJA_DICTIONARY;
  const surnameObj = HANJA_SURNAMES.find((s: { char: string; eum: string; hun: string }) => s.char === surname || s.eum === surname) || HANJA_SURNAMES[0];

  const results: NameCandidate[] = [];
  const set = new Set<string>();

  let attempts = 0;
  while (results.length < count && attempts < count * 30) {
    attempts++;

    const h1 = pool[Math.floor(Math.random() * pool.length)];
    const h2 = HANJA_DICTIONARY[Math.floor(Math.random() * HANJA_DICTIONARY.length)];

    const nameKo = `${surnameObj.eum}${h1.eum}${h2.eum}`;
    const hanjaFull = `${surnameObj.char}${h1.char}${h2.char}`;

    if (set.has(nameKo)) continue;
    set.add(nameKo);

    let maxSim = 0;
    let matchName = '';
    archiveItems.forEach((ai: ArchiveItem) => {
      const sim = calculateSimilarity(nameKo, ai.name);
      if (sim > maxSim) {
        maxSim = sim;
        matchName = ai.name;
      }
    });

    results.push({
      id: `hanja-${Date.now()}-${attempts}`,
      name: `${nameKo} (${hanjaFull})`,
      meaning: `${h1.hun} ${h1.eum} (${h1.char}) + ${h2.hun} ${h2.eum} (${h2.char})`,
      similarity: maxSim,
      matchItem: maxSim >= 75 ? matchName : undefined,
      category: 'character',
      tags: ['한자조합', h1.meaningTag, h2.meaningTag]
    });
  }

  return results;
}

// ============================================================================
// 5. 이름 뱅크 LocalStorage 지속성 연동 헬퍼
// ============================================================================

export function getSavedNameBank(projectId: string): NameBankItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`novelflow_name_bank_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNameBankItem(projectId: string, item: Omit<NameBankItem, 'id' | 'createdAt'>): NameBankItem[] {
  const current = getSavedNameBank(projectId);
  const newItem: NameBankItem = {
    ...item,
    id: `nb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  // 중복 방지
  const updated = [newItem, ...current.filter(c => c.name !== item.name)];
  try {
    localStorage.setItem(`novelflow_name_bank_${projectId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save name bank:', e);
  }
  return updated;
}

export function updateNameBankStatus(projectId: string, itemId: string, status: 'saved' | 'used' | 'discarded', linkedArchiveItemId?: string): NameBankItem[] {
  const current = getSavedNameBank(projectId);
  const updated = current.map(item => {
    if (item.id === itemId) {
      return { ...item, status, linkedArchiveItemId: linkedArchiveItemId || item.linkedArchiveItemId };
    }
    return item;
  });
  try {
    localStorage.setItem(`novelflow_name_bank_${projectId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update name bank:', e);
  }
  return updated;
}

export function deleteNameBankItem(projectId: string, itemId: string): NameBankItem[] {
  const current = getSavedNameBank(projectId);
  const updated = current.filter(item => item.id !== itemId);
  try {
    localStorage.setItem(`novelflow_name_bank_${projectId}`, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete name bank item:', e);
  }
  return updated;
}
