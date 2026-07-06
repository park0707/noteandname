# 노벨플로우(Novelflow) 프로젝트 기획/설계 문서 지도
(Project Documentation Map)

이 문서는 노벨플로우(Novelflow) 프로젝트의 `Documents/` 디렉터리 내에 존재하는 모든 기획, 설계, 가이드라인 문서의 구조와 핵심 수록 내용을 간략히 요약하여 한눈에 파악할 수 있도록 돕는 네비게이션 가이드(지도)입니다.

---

## 📂 Documents 디렉터리 지도 (Directory Tree Map)

```
c:/project/noteandname/Documents/
├── map.md                        # 본 문서 (문서 트리 네비게이션 지도)
├── 1_planning_and_features.md    # 기획, 사용자 연구, 에디터 기능 명세 통합본
├── 2_system_architecture.md       # 시스템 아키텍처, 컴포넌트 흐름, DB & API 규격 통합본
└── specs/                        # 상세 개별 기능 사양 수납 폴더
    ├── ui_design_spec.md         # 디자인 시스템 및 UI/UX 세부 가이드라인
    ├── world_map_spec.md         # 세계관 및 지도 편집기 상세 기획 사양서
    └── detailed_implementation_plan.md # 상세 기능 구현 계획 및 개발 로드맵 기획서
```

---

## 📄 각 문서별 핵심 내용 요약

### 1. [map.md](file:///c:/project/noteandname/Documents/map.md) (본 문서)
*   **역할**: `Documents/` 내 전체 기획/설계 자산의 폴더 구조와 문서별 핵심 내용을 정리한 색인(Index) 지도.

### 2. [1_planning_and_features.md](file:///c:/project/noteandname/Documents/1_planning_and_features.md)
*   **기획 및 요구사항 총괄 문서**
*   **수록 내용**:
    *   **프로젝트 비전**: Always-on-Top Tauri 위젯, Levenshtein 유사도 필터, 스포일러 프리 도감 웹 공유, 노션 양방향 동기화, 계층형 지도 편집기 등 5대 코어 기능 정의.
    *   **작가 페인 포인트 분석**: 설정 붕괴(설붕), 캐릭터 관계도 분리, 작명 단절 문제, 지리적 불일치 고충 및 극복 대안 수립.
    *   **에디터 기능 벤치마킹**: Scrivener, 노벨라, 뮤블 등 주요 툴 분석 및 한국 웹소설 연재 환경의 요구사항 도출.
    *   **외부 임포트 규격**: Google Drive(txt, docx) 및 Notion 데이터베이스 임포트 사양서.
    *   **버전 관리 아키텍처**: 10분/1,000자 자동 스냅샷 수집 및 LCS(최장 공통 부분 수열) 기반 Split Diff 비교 메커니즘.
    *   **집필실 평가 및 로드맵**: 현재 에디터 분석 평가 및 Split-pane 분할 뷰어, Edge Function 맞춤법 검사기, 금칙어 필터링 등 5대 개선 로드맵 탑재.

### 3. [2_system_architecture.md](file:///c:/project/noteandname/Documents/2_system_architecture.md)
*   **엔지니어링 및 개발 사양 총괄 문서**
*   **수록 내용**:
    *   **기술 스택 사양**: 클라이언트(Tauri, React, Tailwind v4, Leaflet.js, Zustand) 및 백엔드(Supabase Database, Auth, Realtime, Edge Functions) 정의.
    *   **Notion API 동기화 스펙**: OAuth 2.0 및 Deno Edge Function의 2 rps 레이트 리밋 분산 Queue 설계.
    *   **프로젝트 디렉터리 구조**: src/ 하위 소스 파일들의 역할 정의 및 컴포넌트 간 Props/State 데이터 흐름도.
    *   **Mermaid 아키텍처 다이어그램**: 인프라-라우팅-워크스페이스-서브 모듈 간 의존 구조 시각화.
    *   **PostgreSQL DDL 스키마 DDL**: 인물, 관계도, 에피소드, 복선 링크, 동기화 매핑, RAG 벡터 청크 및 지도/스냅샷 등 PostgreSQL DDL 전체 쿼리문.
    *   **Supabase RLS 보안 정책**: Row Level Security 활성화 및 본인 데이터 소유 체크 SELECT 쿼리 정책 예시 DDL.
    *   **Edge Functions 서버리스 스펙**: `notion-oauth`, `notion-sync`, `ai-assistant`, `billing-webhook` 함수의 역할 정리.

### 4. [specs/ui_design_spec.md](file:///c:/project/noteandname/Documents/specs/ui_design_spec.md)
*   **디자인 시스템 및 스타일 가이드**
*   **수록 내용**:
    *   **벤치마킹 분석**: Linear(Near-Black 정밀함), Campfire(반투명 글래스모피즘), Notion(기능적 미니멀리즘)의 브랜드 아이덴티티 차용 스펙.
    *   **다크 모드 컬러 가이드**: 깊이(Elevation)에 따른 딥 그레이/슬레이트 계열 HSL/CSS 변수 팔레트.
    *   **글래스모피즘 표준 CSS**: 백그라운드 블러 및 saturation이 결합된 CSS 스펙.
    *   **타이포그래피**: Google Fonts의 Outfit(제목용) 및 Inter(본문/소설 원고용) 서체 크기/줄간격 시스템.
    *   **마이크로 인터랙션**: Snappy(150ms) 및 Dynamic(300ms) cubic-bezier 표준 모션 속도 및 피드백 규칙.
    *   **Tauri 위젯 물리 규격**: 320x520 프레임리스 윈도우 사양 및 자물쇠 아이콘 클릭 시 마우스 클릭 관통(Click-Through) 모드 구현 스펙.
    *   **세계관 지도 UI 사양**: 좌/우 레이어 및 속성 패널(width 280/320px) 구성 및 계층 브레드크럼, 타임라인 동적 펄스 모션 스펙.

### 5. [specs/world_map_spec.md](file:///c:/project/noteandname/Documents/specs/world_map_spec.md)
*   **세계관 지도 편집기 기능 상세 명세서**
*   **수록 내용**:
    *   **계층형 구조 (Nested Map)**: 세계 지도 ↔ 왕국 지도 ↔ 수도 내부도 등 무제한 계층 네스팅 드릴다운 구조 및 빵 부스러기 네비게이션.
    *   **드로잉 도구**: 꼭짓점 편집이 지원되는 폴리곤 영역 그리기(유형별 기본 HSL 팔레트 연계), 포인트(핀) 배치, 선(국경/경로선) 및 자유 텍스트 레이블 사양.
    *   **지도 히스토리 및 타임라인**: 캘린더 일치 스냅샷 및 하단 타임라인 슬라이더 조작 시 세력 변화 영역의 시각적 하이라이트 효과.
    *   **캐릭터 동선 추적**: 프로필 연동 마커 매핑 및 회차별 동선 점선 시각화, 세력별 다중 캐릭터 필터링.
    *   **서사 결합**: 핀 ↔ 복선 카드 ↔ 에디터 본문 언급 회차 간의 양방향 핫링크 및 포커싱 이동 연계.
    *   **GeoJSON 데이터 스키마**: 폴리곤, 캐릭터 좌표, 이동 경로 이력을 품은 커스텀 JSON 스키마 예시 규격.
    *   **개발 로드맵**: Phase 1(핵심 편집기), Phase 2(동선 추적 및 링크), Phase 3(타임라인 스냅샷 및 고해상도 PNG 내보내기) MVP 설계.

### 6. [specs/detailed_implementation_plan.md](file:///c:/project/noteandname/Documents/specs/detailed_implementation_plan.md)
*   **상세 기능 구현 계획 및 개발 로드맵 기획서**
*   **수록 내용**:
    *   **집필실 에디터 고도화**: 분할 뷰어(Split-pane), 서버리스 한국어 맞춤법 검사기 연동, 트리거 기반 금칙어/은어 사전, 프로젝트 단위 글로벌 검색 및 일괄 치환, 본문 설정 백과 실시간 연계.
    *   **세계관 지도**: Leaflet.js 가상 좌표계 CRS.Simple 편집기, 시간/회차별 영토/세력 스냅샷 보간 애니메이션 및 캐릭터 동선.
    *   **서사 안전 장치**: 복선 상태 전이(Planted ↔ Paid Off) 칸반 보드 및 초과 시 에디터 경고 알림.
    *   **인물 연대기**: 캐릭터 프로필 역사 로그 및 에피소드 시간 역산 기반 실시간 나이/위치 자동 연산.
    *   **노션 실시간 싱크**: OAuth 2.0 및 Rate Limit(초당 2회) 준수를 위한 Deno Edge Function 분산 Queue 파이프라인.
    *   **추가 DDL**: `world_maps`, `map_elements`, `foreshadowings`, `character_history_logs` 마이그레이션 테이블 쿼리안.design_spec.md)
*   **디자인 시스템 및 스타일 가이드**
*   **수록 내용**:
    *   **벤치마킹 분석**: Linear(Near-Black 정밀함), Campfire(반투명 글래스모피즘), Notion(기능적 미니멀리즘)의 브랜드 아이덴티티 차용 스펙.
    *   **다크 모드 컬러 가이드**: 깊이(Elevation)에 따른 딥 그레이/슬레이트 계열 HSL/CSS 변수 팔레트.
    *   **글래스모피즘 표준 CSS**: 백그라운드 블러 및 saturation이 결합된 CSS 스펙.
    *   **타이포그래피**: Google Fonts의 Outfit(제목용) 및 Inter(본문/소설 원고용) 서체 크기/줄간격 시스템.
    *   **마이크로 인터랙션**: Snappy(150ms) 및 Dynamic(300ms) cubic-bezier 표준 모션 속도 및 피드백 규칙.
    *   **Tauri 위젯 물리 규격**: 320x520 프레임리스 윈도우 사양 및 자물쇠 아이콘 클릭 시 마우스 클릭 관통(Click-Through) 모드 구현 스펙.
    *   **세계관 지도 UI 사양**: 좌/우 레이어 및 속성 패널(width 280/320px) 구성 및 계층 브레드크럼, 타임라인 동적 펄스 모션 스펙.

### 5. [specs/world_map_spec.md](file:///c:/project/noteandname/Documents/specs/world_map_spec.md)
*   **세계관 지도 편집기 기능 상세 명세서**
*   **수록 내용**:
    *   **계층형 구조 (Nested Map)**: 세계 지도 ↔ 왕국 지도 ↔ 수도 내부도 등 무제한 계층 네스팅 드릴다운 구조 및 빵 부스러기 네비게이션.
    *   **드로잉 도구**: 꼭짓점 편집이 지원되는 폴리곤 영역 그리기(유형별 기본 HSL 팔레트 연계), 포인트(핀) 배치, 선(국경/경로선) 및 자유 텍스트 레이블 사양.
    *   **지도 히스토리 및 타임라인**: 캘린더 일치 스냅샷 및 하단 타임라인 슬라이더 조작 시 세력 변화 영역의 시각적 하이라이트 효과.
    *   **캐릭터 동선 추적**: 프로필 연동 마커 매핑 및 회차별 동선 점선 시각화, 세력별 다중 캐릭터 필터링.
    *   **서사 결합**: 핀 ↔ 복선 카드 ↔ 에디터 본문 언급 회차 간의 양방향 핫링크 및 포커싱 이동 연계.
    *   **GeoJSON 데이터 스키마**: 폴리곤, 캐릭터 좌표, 이동 경로 이력을 품은 커스텀 JSON 스키마 예시 규격.
    *   **개발 로드맵**: Phase 1(핵심 편집기), Phase 2(동선 추적 및 링크), Phase 3(타임라인 스냅샷 및 고해상도 PNG 내보내기) MVP 설계.
