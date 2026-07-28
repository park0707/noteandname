# [디자인 가이드] 집필실(WritingSpace) 스타일 헤더 툴바 규격 지침서

이 문서는 노벨플로우 워크스페이스 내 모든 모듈(작명 엔진, 아카이브, 관계도, 타임라인 등)의 상단 헤더 툴바를 구축하거나 수정할 때 준수해야 하는 **집필실 헤더 디자인 표준 가이드라인**입니다.

---

## 1. 헤더 레이아웃 & 컨테이너 규격

| 항목 | Tailwind CSS 규격 | 비고 |
| :--- | :--- | :--- |
| **위치 및 고정** | `sticky top-0 z-20 backdrop-blur-md` | 패널 스크롤 시 최상단 고정 |
| **높이 & 패딩** | `min-h-[38px] px-4 py-1.5` | 슬림하고 컴팩트한 드롭다운 툴바 스타일 |
| **배치** | `flex items-center justify-between gap-3` | 양 끝 정렬 수평 레이아웃 |

---

## 2. 테마 색상 (Color Tokens)

| 테마 구분 | 배경색 (Background) | 하단 경계선 (Border Bottom) |
| :--- | :--- | :--- |
| **Dark Mode** *(기본)* | `bg-[#121319]` | `border-b border-[#22242f]` |
| **Light Mode** | `bg-white/90` | `border-b border-slate-200` |

---

## 3. 세부 영역 구성 규칙

### 3-1. 좌측 영역 (Left Section)
- **거창한 문장 및 거대 타이틀 금지**: "노벨플로우 AI 작명 엔진"과 같은 커다란 모듈 타이틀 문장이나 이모지/대형 아이콘을 노출하지 않습니다.
- **상태 배지 전용**: 필요할 경우 실행 중인 진행 상태 배지(`1단계: 백스토리 분석 중...`)만 11px 크기의 미니멀 배지로 표출합니다.

### 3-2. 우측 컨트롤 바 (Right Toolbar Section)
- **드롭다운 / 셀렉터 칩 (Select Chip)**:
  - 칩 배경: `bg-[#1a1c26] border border-[#2d3040] rounded-md px-2 py-1`
  - 폰트 및 아이콘: `text-xs (12px)`, Lucide 아이콘 `w-3.5 h-3.5`
- **주요 실행 버튼 (Action Button)**:
  - 모서리: `rounded-md`
  - 패딩 및 그림자: `px-3 py-1 text-xs font-semibold shadow-sm`
  - 스타일: `bg-indigo-600 hover:bg-indigo-500 text-white`

---

## 4. 체크리스트
- [ ] 상단 헤더 배경색이 `#121319`이고 하단 경계선이 `#22242f`인가?
- [ ] 좌측에 거창한 제목 문장이나 큰 모듈 아이콘이 완전히 제거되었는가?
- [ ] 오른쪽 컨트롤 버튼들이 얇은 칩 스타일로 집필실 에디터 툴바와 조화를 이루는가?
- [ ] OS 텍스트 이모지(`🖼️`, `📍` 등) 대신 `lucide-react` SVG 아이콘을 전용 사용하였는가?
