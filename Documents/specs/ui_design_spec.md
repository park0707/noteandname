# 노벨플로우 UI/UX 디자인 가이드라인 및 규격서
(UI/UX Design Specifications & System Guidelines)

이 문서는 노벨플로우(Novelflow)의 최신 UI/UX 디자인 스펙 가이드라인입니다. Linear, Campfire, Notion 등 현대 생산성 도구들의 핵심 디자인 트렌드를 분석하고 적용 사양을 규정합니다.

---

## 1. 디자인 컨셉 및 벤치마킹 포인트

| 대상 서비스 | 핵심 디자인 아이덴티티 | 적용 가능 UI/UX 요소 | 노벨플로우 반영 파트 |
| :--- | :--- | :--- | :--- |
| **Linear** | **Near-Black Craftsmanship**<br>(엔지니어 지향적 극도의 정밀함) | - 다크 모드 위주의 딥 네이비/블랙 스키마<br>- 1px 미세 테두리와 광원 그라데이션<br>- 스피디한 단축키 기반 인터랙션 | **Always-on-Top 위젯 UI 프레임**<br>- 극도로 정제된 다크 스키마 및 빛 반사 효과 라인 적용 |
| **Campfire**| **Spatial Canvas & Modular**<br>(세계관 빌딩을 위한 공간 배치) | - 드래그 앤 드롭 카드 기반 위젯 구조<br>- 패널 간 레이어 분리를 위한 **글래스모피즘**<br>- 노드 연결 시각화 | **관계도 캔버스 및 위젯 레이아웃**<br>- 윈도우 에디터 위에 오버레이되는 반투명 패널 레이어 구성 |
| **Notion** | **Functional Minimalism**<br>(정보 몰입형 단색주의) | - 극도의 미니멀리즘과 여백 활용<br>- 파스텔 톤의 기능적 컬러 토큰<br>- 호버 시에만 나타나는 반응형 컨트롤러 | **설정 카드 에디터 및 본문 텍스트**<br>- 글쓰기/설정 입력 화면에서의 시각적 방해 요소 전면 제거 |

---

## 2. 디자인 시스템 세부 사양 (Design System Spec)

### ① 다크 모드 스키마 (Dark Mode Specification)
단순한 순수 블랙(`#000000`)은 피로도가 높고 심미성이 낮으므로, 톤 다운된 딥 그레이/슬레이트 계열을 계층(Elevation)에 따라 정밀하게 구분하여 사용합니다.

*   **Color Palette Spec (CSS Variables)**:
    *   `--bg-canvas` (가장 깊은 바닥 배경): `#08090A` (Woodsmoke - 어두운 배경 기본색)
    *   `--bg-surface` (메인 콘텐츠 카드 및 사이드바): `#121316` (카드 배경)
    *   `--bg-surface-hover` (마우스 호버 상태 카드): `#1A1C20`
    *   `--bg-popover` (모달, 설정 팝오버, 툴팁): `#1D1F24`
    *   `--border-subtle` (기본 연한 테두리): `rgba(255, 255, 255, 0.06)` (1px solid)
    *   `--border-strong` (포커스 혹은 강조 테두리): `rgba(255, 255, 255, 0.15)`
    *   `--text-primary` (일반 텍스트): `#EDEDEF` (Contrast Ratio 15.6:1 - 가독성 극대화)
    *   `--text-secondary` (설명, 부가 정보): `#A1A1AA` (60% 투명도 적용 효과)
    *   `--color-accent` (포인트 액센트 퍼플/인디고): `#5E6AD2` (브랜드 대표 색)
    *   `--color-success-cyan` (완료 및 활성화 라이트): `#00F2FE` (강조 네온)

---

### ② 글래스모피즘 사양 (Glassmorphism Specification)
데스크톱 위젯이나 캔버스 오버레이 패널 등 배경 화면과의 논리적 분리가 필요한 곳에 적용합니다.

```css
/* Glassmorphism Standard CSS Class */
.glass-panel {
  background: rgba(18, 19, 22, 0.70); /* 불투명도 70%의 딥 다크 필터 */
  backdrop-filter: blur(16px) saturate(180%); /* 16px 블러 및 채도 향상으로 뒤 텍스트 가독성 사수 */
  border: 1px solid rgba(255, 255, 255, 0.08); /* 미세 광선 테두리 */
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.40); /* 입체감 형성을 위한 부드러운 그림자 */
}
```
*디자인 원칙: 백그라운드 블러 영역 아래에는 밝은 요소가 지나가도 가시성이 훼손되지 않도록 `saturate` 옵션을 반드시 결합합니다.*

---

### ③ 타이포그래피 사양 (Typography - Google Fonts)
구조적이고 세련된 **Outfit** 서체와 중립적이고 가독성이 극대화된 **Inter** 서체를 혼용하여 사용합니다.
- **Outfit**: Title / Heading / Key Metrics (제목, 인물 이름, 상태창 수치 등)
- **Inter**: Body / UI Labels / Settings Descriptions (소설 에디터 원고, 세부 인터페이스 라벨 등)

*   **Type Scale 및 시스템**:
    *   **Display Large**: 32px / Outfit Bold / Line-height 1.2 / Letter-spacing -0.03em
    *   **Heading 1**: 22px / Outfit Semibold / Line-height 1.3 / Letter-spacing -0.02em
    *   **Heading 2**: 16px / Outfit Medium / Line-height 1.4 / Letter-spacing -0.01em
    *   **Body Regular**: 14px / Inter Regular / Line-height 1.6 / Letter-spacing -0.01em (소설 원고 최적화)
    *   **UI Text**: 13px / Inter Medium / Line-height 1.4
    *   **Caption / Mini**: 11px / Inter Medium / Line-height 1.3 (태그 및 단축키 힌트)

---

### ④ 마이크로 인터랙션 (Micro-interactions)
*   **속도 표준**:
    *   Snappy Transition (일반 버튼, 호버): `all 150ms cubic-bezier(0.16, 1, 0.3, 1)` (시작은 빠르고 마무리는 부드럽게)
    *   Dynamic Transition (모달 팝업, 서랍식 사이드바): `all 300ms cubic-bezier(0.16, 1, 0.3, 1)`
*   **피드백 규칙**:
    *   **Button Hover**: 배경 불투명도가 10% 증가하며, 테두리가 `--border-strong`으로 활성화. 미세하게 `translateY(-1px)` 만큼 플로팅.
    *   **Active / Click-down**: `scale(0.98)`의 미세 크기 변화로 햅틱한 물리 감각 유도.
    *   **Success Toast (이름 복사 성공 등)**: 하단에서 위로 8px 솟아오르며 렌더링. 테두리에 액센트 컬러(`--color-success-cyan`) 펄스 이펙트 1회 적용.

---

### ⑤ 반응형 및 그리드 레이아웃 (Responsive Layout)
*   **브레이크포인트**:
    *   `sm` (640px): 모바일 / 독자 설정 도감 뷰어 최적화.
    *   `md` (768px): 미니 태블릿 / 위젯 풀 스크린.
    *   `lg` (1024px): 웹 화면 분할 모드 (작성기 + 설정창 나란히 배치).
    *   `xl` (1280px 이상): 와이드 모니터. 관계도 시각화 캔버스 전체화면 기준.
*   **레이아웃 흐름**:
    *   좌측 네비게이션은 접이식(Collapsible) 사이드바로 설계하여, 접었을 때는 아이콘 모드(64px width), 폈을 때는 텍스트 모드(240px width)로 유연하게 작동합니다.
    *   메인 집필 에디터 폼 영역은 최대 가로폭 `800px`로 한계점을 두어, 시선 분산을 막고 글쓰기에만 완전히 몰입하도록 설계합니다.

---

## 3. 데스크톱 Always-on-Top 미니 위젯 특화 스펙

작가가 다른 집필 도구(한글, 워드 등)와 함께 보면서 조작하는 **Tauri 컴팩트 위젯**의 디자인 설계입니다.

*   **물리적 레이아웃 규격**:
    *   **고정 해상도**: `width: 320px` (고정) / `height: 520px` (반응형).
    *   **프레임리스**: `decorations: false`로 설정하여 OS 기본 타이틀바와 테두리를 전면 제거.
    *   **커스텀 타이틀 드래그**: 상단 24px 높이 영역을 마우스 드래그 영역(`data-tauri-drag-region`)으로 선언하고 좌측 신호등 버튼 배치.
*   **배경 및 투명도 (Visual Blending)**:
    *   위젯이 띄워지는 집필창(한글의 흰 종이 또는 워드의 다크 배경 등)과 조화롭게 융합되도록 블러 값을 한층 더 강화하여 적용합니다. (`background: rgba(10, 11, 13, 0.78)` + `backdrop-filter: blur(24px)`)
*   **마우스 클릭 관통 모드 (Click-Through Mode)**:
    *   위젯 우측 상단 **자물쇠 아이콘**을 클릭해 모드를 활성화하면, 위젯의 투명도가 `opacity: 0.35`로 옅어져 뒷배경의 소설 원고가 투명하게 보입니다.
    *   Rust API(`window.set_ignore_cursor_events(true)`)를 트리거하여 마우스 클릭 이벤트가 위젯을 뚫고 지나가 뒤에 켜진 한글(HWP) 에디터를 막힘없이 조작할 수 있게 설계합니다.
    *   위젯을 다시 깨우기 위해 전용 전역 단축키 `Ctrl+Alt+N`을 입력하면 관통이 풀리며 `opacity: 1.0` Active 상태로 즉시 돌아옵니다.
*   **위젯 스크롤바 디테일**:
    *   가로 스크롤은 제거하고, 세로 스크롤은 마우스 호버 시에만 아주 얇은 실선(`width: 3px`, `rgba(255, 255, 255, 0.2)`) 형태로 노출해 시선 방해를 최소화합니다.
*   **원클릭 클립보드 복사 인터랙션**:
    *   복사 아이콘 클릭 시, 복사가 완료되었다는 체크(`✓`) 마크로 0.8초간 변경 후 원복되어 작가가 인지하기 쉽도록 피드백합니다.

---

## 4. 세계관 지도 편집기 (World Map Editor) UI/UX 설계 스펙

지도 편집기는 작가가 큰 캔버스를 보며 직관적으로 세계를 구축하는 특성을 지닙니다. 몰입도 높은 다크 모드 캔버스와 모듈화된 패널 배치를 표준으로 합니다.

### ① 레이아웃 및 공간 분할 (Canvas Layout)
- **전체화면 캔버스**: 에디터 영역을 넘어서는 와이드 뷰포트(`100vw`, `100vh`)를 지원합니다.
- **좌측 레이어 패널 (Layer Panel)**: `width: 280px`. 지도 상의 요소(영역, 핀, 선) 목록이 트리 형태로 노출되며, 눈 모양 아이콘을 클릭하여 레이어별 가시성(`visibility`)을 토글합니다.
- **우측 속성 편집 패널 (Properties Panel)**: `width: 320px`. 선택한 지도 요소의 이름, 설명, 태그, 회차/캐릭터 연동 설정을 조작합니다.
- **하위 지도 Breadcrumb**: 상단 중앙에 플로팅되는 글래스모피즘 바. `세계 지도 > 아이론 왕국 > 수도 아이론시` 형태로 렌더링되며, 클릭 시 즉시 상위 뎁스로 네비게이션합니다.
- **하단 타임라인 슬라이더 (Timeline Slider)**: `height: 80px`. 화면 최하단 전체 가로폭에 플로팅되며, 스냅샷 목록을 틱(Tick) 형태로 시각화하고 핸들을 드래그하여 시점을 이동합니다.

### ② 캔버스 및 드로잉 스타일 (Drawing & Canvas Aesthetics)
- **가상 좌표계 캔버스**: 격자(Grid) 눈금선 디자인을 투명도 3%의 연한 실선으로 표시하여 드로잉 편의성을 제공합니다.
- **유형별 HSL 색상 스펙**:
  - 왕국/제국: `hsl(48, 80%, 80%)` (연황색, 투명도 30%) / 테두리 `hsl(48, 80%, 60%)` (투명도 70%)
  - 산맥: `hsl(24, 10%, 50%)` (회갈색) / 테두리 `hsl(24, 10%, 35%)`
  - 숲/정글: `hsl(120, 40%, 60%)` (초록색) / 테두리 `hsl(120, 40%, 45%)`
  - 바다/강: `hsl(210, 80%, 65%)` (파란색) / 테두리 `hsl(210, 80%, 50%)`
  - 사막: `hsl(38, 60%, 75%)` (모래색) / 테두리 `hsl(38, 60%, 55%)`
  - 금지구역: `hsl(0, 75%, 65%)` (적색, 투명도 40%) / 테두리 `hsl(0, 75%, 50%)`
- **선택 상태 피드백 (Selection Highlight)**:
  - 지도 요소를 클릭하여 선택하면, 경계선 주변에 액센트 퍼플(`--color-accent`, `#5E6AD2`) 컬러의 2px 테두리와 미세한 외곽 글로우(Glow) 효과를 적용합니다.
  - 꼭짓점(Vertex) 편집 모드에서는 각 꼭짓점 위치에 지름 8px of 원형 앵커가 화이트(`#FFFFFF`) 바탕에 `--color-accent` 테두리로 표시되어 마우스 드래그 가이드를 제시합니다.

### ③ 타임라인 동적 트랜지션 (Timeline Transitions)
- 타임라인 슬라이더 이동 시, 해당 시점에 새로 추가되거나 속성(예: 영토 병합으로 인한 색상)이 변경된 영역은 `1.2초` 동안 **`펄스(Pulse) 및 깜빡임(Highlight)`** 애니메이션을 수행하여 시각적 인지력을 강화합니다.
- `@keyframes map-pulse { 0% { opacity: 0.3; } 50% { opacity: 0.8; } 100% { opacity: 0.3; } }`
