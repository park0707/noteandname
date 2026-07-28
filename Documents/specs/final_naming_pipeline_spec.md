# [최종 기획안 및 명세서] 3단계 마이크로 AI 파이프라인 작명 엔진 (Micro-Agent Pipeline Architecture)

이 문서는 노벨플로우 작명 엔진(Naming Engine)의 최종 3단계 마이크로 AI 파이프라인(Sandwich Architecture) 및 무료 무제한/프리미엄 AI 하이브리드 연동 명세서입니다.

---

## 1. 3단계 마이크로 AI 파이프라인 아키텍처 (Sandwich Architecture)

```
[사용자 입력: 자연어 백스토리 + 복합 태그 조합 + 세부유형]
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│ Step 1: 자연어 서사 해석기 (Narrative Parser)            │
│  - 담당: 로컬 형태소/상징 파서 (WebLLM SLM 확장 구조)  │
│  - 역할: 복잡한 문맥에서 상징어(Symbols) 및 정서 추출  │
└────────────────────────┬───────────────────────────────┘
                         │ (정제된 상징어 JSON)
                         ▼
┌────────────────────────────────────────────────────────┐
│ Step 2: 태그 & 세부유형 정제기 (Taxonomy Resolver)      │
│  - 담당: 로컬 매트릭스 알고리즘 (Pure TS / 0.001초)   │
│  - 역할: 상충 태그 자동 튜닝, 발음 어감(경음/격음) 규격화 │
└────────────────────────┬───────────────────────────────┘
                         │ (완벽히 구조화된 통합 JSON 컨텍스트)
                         ▼
┌────────────────────────────────────────────────────────┐
│ Step 3: 최종 작명 & 서사 합성 엔진 (Master Synthesizer) │
│  - [무료 무제한 기본]: 로컬 조합 엔진 (Pure TS / $0원)│
│  - [프리미엄 클라우드]: Gemini 2.0 Flash / Groq / OpenAI│
│  - 역할: 고유명사 10개 + 어원 풀이 + 1문장 서사 힌트    │
└────────────────────────────────────────────────────────┘
```

---

## 2. 모듈별 역할 및 인터페이스 설계

### 2-1. Step 1: `parseNarrativePrompt(keywords: string)`
- **역할**: 자연어 문장에서 주어, 상징물, 정서 뉘앙스를 파싱
- **출력 데이터**:
  ```ts
  export interface ParsedNarrativeContext {
    symbolicTokens: string[];
    emotionalMood: string[];
    characterArchetype: string;
  }
  ```

### 2-2. Step 2: `resolveTaxonomyAndPhonetics(params, parsedContext)`
- **역할**: 복합 태그 + 세부유형 + 음성상징학 제약조건 + Step 1 상징어를 패키징
- **출력 데이터**:
  ```ts
  export interface ResolvedNamingContext {
    targetCategory: string;
    subtypeName?: string;
    cleanTagWeights: TagWeight[];
    symbolicTokens: string[];
    phoneticRules: string[];
  }
  ```

### 2-3. Step 3: `generateFinalNames(params, options, archiveItems)`
- **엔진 구성**:
  - `local`: 100% 오프라인 완전 무제한 로컬 조합 생성 ($0원)
  - `gemini`: Google Gemini 2.0 Flash (429 시 1.5 Flash 2차 자동 재시도)
  - `groq`: Groq LPU 초고속 API
  - `openai`: OpenAI GPT-4o-mini
- **안전한 결함 허용 (Fault-Tolerant Fallback)**:
  - 클라우드 API 호출 실패 시 100% 무제한 로컬 엔진으로 자동 비상 폴백.

---

## 3. 구현 파일 계획
1. `src/services/aiNamingService.ts`: 3단계 마이크로 파이프라인 함수 (`parseNarrativePrompt`, `resolveTaxonomyAndPhonetics`, `generateNamesWithAI`) 구현.
2. `src/components/workspace/naming/NamingEngineHub.tsx`: 파이프라인 단계별 실시간 로딩 인디케이터 배지 및 엔진 선택 지원.
