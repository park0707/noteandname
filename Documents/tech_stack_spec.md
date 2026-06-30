# 노벨플로우 기술 스택 및 API 연동 상세 규격서
(Technology Stack & API Integration Specification)

이 문서는 노벨플로우(Novelflow)의 통합 작가 어시스턴트 기능들을 실제로 구현하기 위한 구체적인 개발 언어, 인프라, AI API 요금 비교, 맞춤법/노션 외부 연동 규격을 정의합니다.

---

## 1. 개발 언어 및 프레임워크 스택

- **클라이언트 & 웹**:
  - **Tauri (Rust + React / TypeScript)**: Always-on-Top 백그라운드 위젯에 가장 적합한 경량 데스크톱 엔진.
  - **React & Tailwind CSS (v4)**: 컴포넌트 기반 UI/UX 구축 및 스타일링 최적화.
  - **Supabase Client SDK**: 백엔드 REST API 컨트롤러 코딩 없이 직접 쿼리 수행.
  - **Leaflet.js & Leaflet-Geoman (react-leaflet)**: 가상 좌표계(`CRS.Simple`) 기반 지도 캔버스 구동 및 꼭짓점 기반 폴리곤/경로선 그리기 및 마우스 드로잉 편집 인터랙션.
  - **leaflet-image & html2canvas**: Leaflet 레이어를 병합하여 브라우저 상에서 고해상도 PNG 이미지로 캡처/내보내기 수행.
  - **Zustand**: 계층형 지도 트리 구조(Nested Map Tree) 및 히스토리 스냅샷 타임라인 상태 관리.
- **백엔드 및 서버리스 (BaaS)**:
  - **Supabase Database (PostgreSQL / pgvector)**: 인물 데이터, 세계관 설정 저장 및 RAG 벡터 데이터 통합 관리.
  - **Supabase Realtime**: 데스크톱 위젯과 웹 에디터 간의 데이터 실시간 양방향 싱크.
  - **Supabase Edge Functions (Deno / TypeScript)**: OAuth 콜백, 결제 웹훅, RAG LLM 조립 등 보안 로직 구동.
  - **Supabase Auth**: 카카오, 구글 소셜 간편 로그인 및 계정 인증 처리.

---

## 2. AI API 선정 및 단가 분석

- **GPT-4o-mini**: $0.15 / 1M input. 일반 작명 (엑스트라, 지명 대량 생성).
- **Claude 3.5 Sonnet**: $3.00 / 1M input. 프리미엄 설정 (핵심 인물 묘사 및 관계 설정 작명).

---

## 3. Notion API 실시간 양방향 동기화 규격

- **인증 방식**: Public OAuth 2.0. Access Token은 Supabase Vault 암호화 스토어에 보관.
- **Rate Limit 제어**:
  - 클라이언트 단의 변경 사항 디바운스(Debounce) 조절.
  - Supabase Edge Functions의 Redis Queue 버퍼링 및 **초당 2회(2 rps)** API 호출 속도 제한 처리.
  - 지수 백오프(Exponential Backoff + Jitter) 재전송 프로세스 구현.
