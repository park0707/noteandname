export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  projectId: string;
  title: string;
  content: string;
  charCount: number;
  updatedAt: string;
  isFolder?: boolean;
  parentId?: string | null;
  deletedAt?: string;
}

export interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  role?: string;
  summary?: string;
  description?: string;
  avatar?: string;
  archiveItemId?: string;
}

export interface Link {
  from: string;
  to: string;
  label: string;
  color: string;
  dashed: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  content: string;
  isForeshadow: boolean;
  isResolved: boolean;
  resolvedAt: string;
  updatedAt: string;
}

export interface JamoResult {
  name: string;
  similarity: number;
  matchChar: string;
}

export interface Snapshot {
  id: string;
  timestamp: string;
  name: string;
  memo: string;
  content: string;
  charCount: number;
  type: 'manual' | 'auto_words' | 'auto_time';
  createdAt?: string;
  isBookmarked?: boolean;
}

export interface Foreshadowing {
  id: string;
  projectId: string;
  title: string;
  description: string;
  createdChapter: number;
  targetChapter: number;
  createdEpisodeId?: string;
  createdEpisodeTitle?: string;
  isResolved: boolean;
  createdAt: string;
}

export type ArchiveCategory = 'character' | 'equipment' | 'location' | 'skill' | 'etc';

export interface ArchiveAttribute {
  key: string;
  value: string;
}

export interface ArchiveItem {
  id: string;
  projectId: string;
  name: string;
  category: ArchiveCategory;
  summary: string;
  description: string;
  tags: string[];
  attributes?: ArchiveAttribute[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Naming Engine Interfaces
// ============================================================================

export type TagGroupKey = 'custom' | 'genre' | 'culture' | 'trait' | 'mood' | 'element' | 'archetype' | 'phonetic' | 'social_status' | 'subtype';

export interface SubtypeItem {
  id: string;
  name: string;
  category: ArchiveCategory;
  description?: string;
  examples?: string;
  recommendedMoods?: string[];
  recommendedPhonetics?: string[];
  conflictTags?: string[];
}

export interface NameCandidate {
  id?: string;
  name: string;
  meaning: string;
  similarity: number; // 기존 ArchiveItem과의 자모 유사도 (0~100)
  matchItem?: string; // 유사도 경고 시 매칭된 기존 항목명
  originMythologyId?: string; // 설화 파생 이름일 경우 출처 ID
  originStoryTitle?: string; // 설화 파생 이름 출처 제목
  category?: ArchiveCategory;
  gender?: 'male' | 'female' | 'neutral';
  tags?: string[];
  subtype?: string;
  isConflict?: boolean;
  conflictReason?: string;
}

export interface MythologyEntry {
  id: string;
  culture: string; // '그리스로마' | '북유럽' | '켈트' | '한국전통' | '동양' | '아랍' 등
  storyTitle: string;
  characterName: string;
  romanization?: string;
  koreanReading?: string;
  meaning?: string;
  storySummary: string;
  fameLevel: 'major' | 'minor';
  tags: string[]; // 표준 택사노미 세분화 태그 리스트
  categoryTags?: {
    genre?: string[];
    trait?: string[];
    mood?: string[];
    element?: string[];
    archetype?: string[];
  };
  sourceUrl?: string;
  derivedNames?: string[];
}

export interface TagWeight {
  tagId: string;
  label: string;
  groupKey: TagGroupKey;
  weight: number;
}

export interface NamingConstraint {
  forbiddenSyllables: string[];
  requiredSyllables: string[];
  minLength: number;
  maxLength: number;
}

export interface NamingPreset {
  id: string;
  projectId?: string;
  name: string;
  targetCategory: ArchiveCategory;
  tagWeights: TagWeight[];
  constraints?: NamingConstraint;
  createdAt?: string;
}

export interface NameBankItem {
  id: string;
  projectId: string;
  name: string;
  targetCategory: ArchiveCategory;
  meaning: string;
  originMythologyId?: string;
  status: 'saved' | 'used' | 'discarded';
  linkedArchiveItemId?: string;
  createdAt: string;
}

export interface HanjaEntry {
  char: string; // 한자
  hun: string;  // 훈 (뜻)
  eum: string;  // 음 (소리)
  meaningTag: string; // 예: '검', '바람', '불', '하늘', '달', '지혜', '용기'
  category?: string;
}

export type EraType = '고대' | '중세' | '근대' | '현대' | '미래/SF';
export type SocialClassType = '평민' | '귀족/양반' | '선비/학자';

export interface WorldbuildingRuleTag {
  id: string;
  projectId?: string;
  name: string; // 예: "🏷️ 펠드 마법가문"
  description?: string;
  baseEra?: EraType;
  baseRegion?: string;
  socialClass?: SocialClassType;
  customRulesPrompt?: string; // 자연어 명명 규칙 (예: "접두사 '펠드-' 필수, 화염/마도공학 어감")
  requiredSyllables?: string[];
  forbiddenSyllables?: string[];
  createdAt?: string;
}

export type NamingSidebarItemKey = 'category' | 'tag' | 'description' | 'mythology' | 'hanja';

export interface EnabledNamingItems {
  category: boolean;
  tag: boolean;
  description: boolean;
  mythology: boolean;
  hanja: boolean;
}

export interface EnabledEngineSections {
  tag: boolean;
  mythology: boolean;
  naturalLanguage: boolean;
}

export interface GenerateNameParams {
  targetCategory: ArchiveCategory;
  subtype?: string;
  customCategory?: string;
  era?: EraType;
  majorRegion?: string;
  subRegion?: string;
  socialClass?: SocialClassType;
  worldbuildingRuleTags?: WorldbuildingRuleTag[];
  activeRuleTagIds?: string[];
  randomFallbackNotice?: string;
  tagWeights: TagWeight[];
  keywords: string;
  constraints?: NamingConstraint;
  count?: number;
  gender?: 'all' | 'male' | 'female';
  enabledItems?: EnabledNamingItems;
  enabledSections?: EnabledEngineSections;
  selectedMythologyEntry?: MythologyEntry;
}



