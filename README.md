# 노벨플로우 (Novelflow) - 웹소설 작가를 위한 통합 어시스턴트

노벨플로우는 웹소설 작가의 작업 흐름을 끊지 않고, 생성한 이름과 설정을 체계적으로 관리하며 재사용할 수 있게 돕는 작가 전용 통합 창작 어시스턴트 플랫폼입니다.

---

## 📂 프로젝트 설계 명세 문서
아래의 링크를 클릭하시면 각 개발 설계 단계의 구체적인 명세서를 열람할 수 있습니다.

- [프로젝트 개요 및 기획서](file:///c:/project/noteandname/Documents/project_overview.md)
- [기술 스택 및 API 연동 상세 규격서](file:///c:/project/noteandname/Documents/tech_stack_spec.md)
- [데이터베이스 및 백엔드 서비스 설계서](file:///c:/project/noteandname/Documents/database_and_api_design.md)
- [UI/UX 디자인 가이드라인 및 규격서](file:///c:/project/noteandname/Documents/design_specification.md)

---

## ⚡ 주요 시뮬레이션 기능 목록
1. **Always-on-Top 데스크톱 위젯**: 한글/스크리브너 등 집필기 위에 항상 플로팅되어 복사/붙여넣기 및 마우스 관통 클릭 지원.
2. **한글 자모 Levenshtein 작명**: 작중 인물 간 발음 및 어감 중복(75% 임계치)을 자모 분석을 통해 자동으로 걸러내는 유사 작명 방지.
3. **Notion 양방향 실시간 동기화**: Redis 메시지 큐 버퍼링 및 초당 2회 호출 제한을 우회해 노션과 양방향 연동.
4. **인물 관계도 캔버스**: 드래그 앤 드롭 캐릭터 노드 조작 및 실시간 SVG 연결 곡선 갱신.

---

## 🚀 로컬 개발 가이드

```bash
# 의존성 패키지 설치
npm install

# 로컬 개발 서버 기동 (Vite)
npm run dev

# 프로덕션 빌드 (TypeScript 컴파일 검사 포함)
npm run build
```
개발 서버 기동 시 출력되는 로컬 포트(예: http://localhost:5174/)로 접속하여 정식 컴포넌트 환경의 노벨플로우 웹 애플리케이션을 조작할 수 있습니다.
