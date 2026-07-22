# Coding Rules — 노벨플로우 코딩 규칙 문서

> 이 문서는 개발 과정에서 실제로 겪은 문제와 해결책, 지켜야 할 코딩 관행을 기록합니다.  
> 에이전트는 **작업 시작 전 반드시 이 문서를 읽고** 동일한 실수를 반복하지 않습니다.  
> 새로운 문제나 해결책이 생기면 이 문서에 지속적으로 추가합니다.

---

## 🚫 하지 말아야 할 것 (Anti-Patterns)

### [일반]

- **지시 범위 외 코드 수정 금지**  
  요청과 직접 관련 없는 코드(개선 여지가 보이더라도)를 임의로 수정하면 안 됩니다.  
  → 수정이 필요하다고 판단되면 사용자에게 이유를 먼저 설명하고 허가를 받습니다.

- **사용자가 작성한 코드 허가 없이 변경 금지**  
  사용자가 직접 수정한 코드는 명시적 승인 없이 변경 불가합니다.  
  → 단, 해당 코드가 빌드를 파괴하는 치명적 컴파일 에러를 유발하는 경우에만 최소 처리 후 즉시 보고합니다.

- **대규모 블록 치환 금지**  
  수백 줄에 달하는 코드를 한 번에 통째로 치환하면 기존에 정상 작동하던 로직이 사라지는 사고가 납니다.  
  → 반드시 줄 단위로 정밀하게 비교·대체하는 Surgical Edit 방식을 사용합니다.

- **추측으로 수정하지 않기**  
  에러 메시지를 보지 않고 짐작으로 코드를 고치면 새로운 버그가 생깁니다.  
  → 반드시 터미널 출력과 실제 파일 내용을 확인한 후 수정합니다.

---

### [TypeScript / React]

- **`transition-all duration-200` 을 드래그 요소에 사용 금지**  
  드래그 중 좌표가 매 프레임 갱신될 때 CSS 트랜지션이 200ms 보간을 재설정하면서  
  요소가 마우스 커서를 못 따라오는 고무줄 현상(Rubber-banding)이 발생합니다.  
  → 드래그하는 요소에는 `transition: 'none'`을 명시적으로 적용합니다.

- **SVG `<image>` 요소에 base64 Data URL을 직접 href로 사용 금지**  
  드래그 시 매 프레임마다 대용량 base64 문자열을 재파싱·재래스터화하여 CPU 사용량이 급증하고 프레임 드롭이 발생합니다.  
  → `URL.createObjectURL(Blob)`으로 변환하여 브라우저 Decoded Image Cache를 활용합니다.

- **SVG 요소의 `x`, `y` 속성을 드래그 좌표로 직접 갱신 금지**  
  SVG `x`, `y` 속성을 변경하면 Layout(Reflow)이 유발되어 CPU 래스터화 비용이 발생합니다.  
  → `<g style="transform: translate(bx px, by px)">` 래퍼를 사용하여 GPU Composite 레이어로 이동합니다.

- **Map 제네릭 타입 TypeScript 선언 시 `new Map()` 주의**  
  ```ts
  // ❌ 컴파일 에러: Expected 1 arguments, but got 0
  const ref = useRef<Map<string, string>>(new Map());

  // ✅ 올바른 방법: 일반 객체 사용
  const ref = useRef<{ [key: string]: string }>({});
  ```

- **`const [, setter] = useState()` 패턴 — 미사용 state 값 처리**  
  state 값을 선언하되 읽지 않을 경우 TypeScript가 `TS6133: declared but never read` 에러를 냅니다.  
  ```ts
  // ❌ 에러 발생
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);

  // ✅ 첫 번째 요소를 콤마로 생략
  const [, setHoveredElementId] = useState<string | null>(null);
  ```

---

### [SVG / 렌더링 성능]

- **이미지 요소의 스냅(Snap) 좌표 적용 금지**  
  이미지(type: 'image') 요소를 리사이즈할 때 격자 스냅이 적용된 snapped 좌표를 사용하면  
  크기가 계단식으로 툭툭 끊기는 현상이 발생합니다.  
  → 이미지 리사이즈 시에는 스냅이 없는 순수 물리 마우스 좌표(`currentCoords`)를 사용합니다.

- **이미지 드래그 시 점간(Node) 자석 스냅 적용 금지**  
  이미지 요소를 드래그할 때 `pointSnapEnabled`가 켜져 있으면 주변 핀·꼭짓점에 달라붙어 뚝뚝 끊깁니다.  
  → 드래그 대상이 이미지 전용일 때는 점간 스냅 연산을 건너뜁니다.

---

## ✅ 해야 할 것 (Best Practices)

### [작업 시작 전]

- 작업 전 반드시 `Documents/Coding_Rules.md`(이 파일)를 읽습니다.
- 작업 전 연관된 `Documents/` 내 설계서·기획서를 확인합니다.
- 수정 범위(영향받는 파일, 타입 시스템, 의존 관계)를 먼저 파악합니다.

### [작업 중]

- **컴파일 무결성 우선**: 파일 수정 후 반드시 `npx tsc -b` → `npm run lint` 순서로 검증합니다.
- **Self-Healing 루프**: 에러 발생 시 터미널 로그 → 파일 확인 → 수술식 수정 → 재검증 사이클을 반복합니다.
- **비파괴적 인터페이스 유지**: Props 변경 시 기존 호출부가 깨지지 않도록 선택적 프로퍼티(`?`) 또는 기본값을 우선 사용합니다.
- **오픈소스 라이브러리 우선 검토**: 새 기능 구현 전 MIT/Apache 2.0 라이브러리가 있는지 먼저 조사합니다.

### [SVG 요소 드래그·리사이즈]

- 드래그하는 요소는 `<g style={{ transform: 'translate(x px, y px)', willChange: isDragging ? 'transform' : 'auto' }}>` 패턴을 사용합니다.
- 이미지 요소는 드래그 중 `transition: 'none'`을 반드시 인라인 스타일로 지정합니다.
- 이미지 `href`에는 base64 대신 `URL.createObjectURL()` 캐시를 사용합니다.
- 리사이즈 핸들 앵커는 SVG 전체 좌표계(절대 좌표 `bx, by`)를 기준으로 렌더링합니다.  
  (`<g transform>` 방식 사용 시 자식 요소는 로컬 좌표 `0, 0` 기준)

### [사이드바 요소 연동]

- 새로운 `MapElement` 타입을 추가할 때 반드시 아래 항목을 함께 업데이트합니다:
  1. `MapElement` 타입 유니온 추가
  2. `FlatTreeNode` 타입 유니온 추가
  3. `selectedSidebarTypes` 기본값 배열에 추가
  4. 사이드바 아이콘 맵에 이모지 추가
  5. 사이드바 필터 팝업 체크박스 추가
  6. `focusOnElement` 함수에 타입 분기 추가 (클릭 시 해당 위치로 이동)
  7. 드래그 이동 및 리사이즈 이벤트 핸들러에 타입 포함 여부 확인

---

## 🐛 발생한 문제 기록 (Issue Log)

| 날짜 | 문제 | 원인 | 해결 |
|------|------|------|------|
| 2026-07-22 | 이미지 드래그 시 고무줄 현상 | `transition-all duration-200` CSS가 드래그 좌표에 200ms 보간 적용 | `transition: 'none'` 인라인 스타일 적용 |
| 2026-07-22 | 이미지 리사이즈 시 계단식 끊김 | 격자 스냅(`snapped` 좌표) 이 리사이즈 dx/dy에 반영됨 | 이미지 타입 감지 후 `currentCoords`(물리 좌표) 사용 |
| 2026-07-22 | 이미지 드래그 이동 시 점간 자석 달라붙음 | `pointSnapEnabled` 연산이 이미지 요소에도 동일 적용 | 이미지 전용 드래그 시 점간 스냅 건너뜀 |
| 2026-07-22 | 이미지 렌더링 성능 저하 | SVG `<image>` 에 1MB base64 문자열 직접 사용 → 매 repaint마다 재파싱 | `URL.createObjectURL(Blob)` + `useRef` 캐시 도입 |
| 2026-07-22 | 사이드바에서 이미지 클릭해도 위치 이동 안 됨 | `focusOnElement()` 함수에 `image` 타입 분기 누락 | `image` 타입 분기 추가 (`bx + bw/2`, `by + bh/2` 중심 좌표 사용) |
| 2026-07-22 | `useRef<Map<string, string>>(new Map())` TypeScript 에러 | TypeScript가 제네릭 Map을 제대로 인식 못함 | `useRef<{ [key: string]: string }>({})` 로 변경 |
| 2026-07-22 | `hoveredElementId` TS6133 미사용 변수 에러 | state 값을 읽지 않고 선언만 한 경우 | `const [, setHoveredElementId]` 패턴으로 값 생략 |

---

> 📝 **이 문서 관리 방법**  
> - 새 버그·문제 발생 시 Issue Log 테이블에 행을 추가합니다.  
> - 반복되는 패턴이 생기면 "하지 말아야 할 것" 또는 "해야 할 것" 섹션에 규칙을 추가합니다.  
> - 날짜는 `YYYY-MM-DD` 형식으로 기록합니다.
