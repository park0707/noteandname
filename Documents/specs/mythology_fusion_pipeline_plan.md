# [기획서] 설화·신화(Mythology) RAG 융합형 복합 작명 파이프라인 설계

## 1. 개요 및 기획 배경

### 기존 구현의 한계점
현재 노벨플로우 작명 엔진에서 **설화·전승 탐색기**는 독립된 별도 탭으로 분리되어 있어, 검색된 신화 캐릭터 데이터를 단독으로 조회하거나 단순 파생 이름을 추출하는 것에 그쳤습니다.
이로 인해 사용자가 **"태그(예: 악당, 초능력자) + 자연어 서사(예: 선역이었다가 배신당해 악역이 된 초능력자) + 설화(예: 그리스로마 신화)"**를 동시에 조합하여 신화적 어원과 모티브가 자연스럽게 입혀진 캐릭터 이름을 종합 생성하고자 할 때 수평적 결합 작명이 불가능한 한계가 존재했습니다.

### 개선 목표
설화·전승 코퍼스를 3단계 마이크로 파이프라인의 **3대 융합 축(3-Axis Fusion Architecture)**의 주요 구성 요소로 통합합니다.
사용자가 **태그 조합 + 자연어 요구사항 + 설화/신화 모티브**를 동시에 설정하면, 엔진이 선택된 신화에서 서사에 가장 부합하는 신화 인물·사건·어원을 RAG(검색 증강 생성) 방식으로 자동 추출하여 최종 작명에 융합합니다.

---

## 2. 3대 융합 파이프라인 아키텍처 (3-Axis Fusion Architecture)

```
 [입력 1: 복합 태그 가중치]   [입력 2: 자연어 서사 Prompt]   [입력 3: 설화/신화 선택]
 (예: 악당, 초능력자)       (예: 배신당해 악역이 됨)        (예: 그리스로마 신화)
             │                           │                           │
             └───────────────────────────┼───────────────────────────┘
                                         ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Step 1: 서사 & 상징 파서 (Narrative & Motif Parser)                        │
 │  - 자연어 입력문에서 핵심 상징어('배신', '악당', '초능력', '복수') 파싱    │
 └───────────────────────────────────┬───────────────────────────────────────┘
                                     │ (상징어/정서 추출 JSON)
                                     ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Step 2: 신화 RAG 코퍼스 융합 & 정제기 (Mythology RAG & Taxonomy Resolver)  │
 │  - 선택된 신화(그리스로마) 코퍼스 내에서 상징어/태그와 가장 매칭되는       │
 │    신화 인물 및 모티브 자동 RAG 검색                                      │
 │    (예: 메데이아 - 배신당해 복수의 귀신이 됨 / 프로메테우스 - 권능을 훔친 자)│
 │  - 그리스풍 발음 체계 + 태그 가중치 + 신화 모티브 통합 컨텍스트 구성       │
 └───────────────────────────────────┬───────────────────────────────────────┘
                                     │ (통합 융합 JSON 컨텍스트)
                                     ▼
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Step 3: 최종 융합 작명 & 어원 합성 엔진 (Master Fusion Synthesizer)         │
 │  - [무료 로컬]: 신화 어원 어휘 스템 + 태그 조합 + 자연어 조합 ($0원)     │
 │  - [프리미엄 AI]: Gemini 2.0 Flash / Groq / OpenAI                       │
 │  - 신화 모티브 기반 베스트 고유명사 10개 + 어원 풀이 + 서사 힌트 창작    │
 └───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 세부 데이터 모델 & 인터페이스 설계

### 3-1. `GenerateNameParams` 타입 확장 (types.ts)
작명 실행 시 **설화/신화 선택 데이터**가 함께 전달되도록 데이터 구조를 확장합니다.

```ts
export interface GenerateNameParams {
  targetCategory: ArchiveCategory;
  subtype?: string;
  tagWeights: TagWeight[];
  keywords: string; // 자연어 서사 요구사항 (예: "선역이었다가 배신당해...")
  
  // 🌟 [신규 추가] 신화/설화 융합 파라미터
  mythologyCulture?: string; // 예: '그리스로마', '북유럽', '켈트', '한국전통', '동양신화', '아랍'
  selectedMythologyEntryIds?: string[]; // 선택적 신화 특정 인물 모티브 ID 리스트
  
  constraints?: NamingConstraint;
  count?: number;
  gender?: 'all' | 'male' | 'female';
}
```

### 3-2. `ResolvedNamingContext` 확장 (aiNamingService.ts)
RAG로 매칭된 신화 데이터가 프롬프트 빌더에 정확히 전달되도록 설계합니다.

```ts
export interface MatchedMythologyContext {
  characterName: string;
  storyTitle: string;
  storySummary: string;
  meaning?: string;
  relevanceScore?: number;
}

export interface ResolvedNamingContext {
  targetCategory: string;
  subtypeName?: string;
  cleanTagWeights: TagWeight[];
  symbolicTokens: string[];
  phoneticRules: string[];
  narrativeSummary: string;
  
  // 🌟 [신규 추가] 신화 RAG 융합 데이터
  mythologyCulture?: string;
  matchedMythologyEntries?: MatchedMythologyContext[];
}
```

---

## 4. 프롬프트 & 로컬 합성 로직 설계

### 4-1. LLM 프롬프트 융합 구문 (`buildPipelinePrompt`)
AI 프롬프트에 선택된 신화와 RAG 매칭 모티브를 주입하여 어원 및 서사 힌트에 반영되도록 합니다.

```
[정제된 3-Axis 융합 데이터]
- 대상 카테고리: 인물 (character)
- 선택된 설화/신화 모티브: 그리스로마 신화
- RAG 자동 매칭 신화 원전:
  1) 메데이아 (사랑과 신의를 배신당하고 복수의 귀신이 된 마법사)
  2) 프로메테우스 (신들의 불꽃/초능력을 훔쳐 형벌을 받은 자)
- 자연어 서사 상징어: 배신, 악당, 초능력, 복수
- 선택된 태그 조합: 악당(가중치:1.0), 초능력자(가중치:1.0)
- 발음 제약: 그리스/로마풍 어감 반영

[작명 지침]
그리스로마 신화의 어원(그리스어/라틴어 어근)과 '배신당해 악당이 된 초능력자' 서사를 융합하여,
세련되고 이국적이면서도 서사적 깊이가 있는 이름 10개를 창작하고 각 이름의 어원/신화적 연관성과 서사 힌트를 응답하세요.
```

### 4-2. 로컬 조합 엔진 융합 (`generateNamesByCombo`)
인터넷 연결이 없거나 오프라인일 때에도 `mythologyCulture`가 선택된 경우:
- 해당 문화권(그리스로마: `카시우스`, `오리온`, `아그라이아`, `세르펜트` 등) 어휘 스템 우선 적용.
- 어원 풀이(`meaning`)에 선택된 신화 모티브와 태그 연관 텍스트 자동 조합 생성.

---

## 5. UI/UX 개편안 (`TagComboPanel.tsx` 및 `NamingEngineHub.tsx`)

### [1] `TagComboPanel.tsx` (태그 조합 작명 탭)
- **신화 모티브 융합 드롭다운 추가**:
  - `[ 🏛️ 설화·신화 모티브 선택: 전체(미선택) | 그리스로마 | 북유럽 | 켈트 | 한국전통 | 동양신화 | 아랍 ]`
- **RAG 매칭 연관 모티브 칩 자동 노출**:
  - 신화 선택 및 키워드/태그 입력 시, 하단에 연관된 신화 캐릭터 모티브 칩(예: `✨ 메데이아(배신/복수)`, `✨ 프로메테우스(권능)`)이 실시간 추천되어 사용자가 클릭하여 가중치를 부여 가능.

### [2] `MythologyExplorer.tsx` (설화·전승 탐색기 탭)
- 검색된 신화 캐릭터 카드에 **`[ ⚡ 이 신화 모티브를 태그 조합에 반영하기 ]`** 버튼 추가.
- 해당 버튼 클릭 시 태그 조합 탭으로 이동하며 해당 신화 문화권 및 인물이 자동 설정됨.

---

## 6. 구현 단계별 로드맵 (Implementation Roadmap)

| 단계 | 작업 내용 | 영향 파일 |
| :--- | :--- | :--- |
| **Phase 1** | `GenerateNameParams` 및 `ResolvedNamingContext` 신화 융합 타입 정의 | `src/components/workspace/types.ts` |
| **Phase 2** | `aiNamingService.ts` 내 RAG 매칭기 및 LLM 프롬프트 빌더 확장 | `src/services/aiNamingService.ts` |
| **Phase 3** | `namingUtils.ts` 로컬 합성 엔진에 신화 어원 스템 연동 | `src/components/workspace/naming/namingUtils.ts` |
| **Phase 4** | `TagComboPanel.tsx` UI에 설화/신화 드롭다운 및 RAG 추천 칩 추가 | `src/components/workspace/naming/TagComboPanel.tsx` |
| **Phase 5** | `MythologyExplorer.tsx`에 '태그 조합 융합하기' 연동 버튼 구현 | `src/components/workspace/naming/MythologyExplorer.tsx` |
| **Phase 6** | `npx tsc -b` & `npm run lint` 무결성 검증 및 최종 테스트 | 워크스페이스 전역 |
