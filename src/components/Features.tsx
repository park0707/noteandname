import { useEffect, useRef } from 'react';
import {
  Sparkles,
  Scale,
  Network,
  GitCommit,
  Link2,
  BookOpen,
  Map
} from 'lucide-react';

interface FeaturesProps {
  themeMode: 'dark' | 'light';
}

interface FeatureItem {
  number: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  accent: string;
}

const FEATURES: FeatureItem[] = [
  {
    number: '01',
    icon: Sparkles,
    title: 'AI 작명 엔진',
    subtitle: '장르와 세계관에 어울리는 이름을 손 쉽게 생성',
    description:
      '엑스트라, 지명 등 작품에 필수적인 요소지만 성의를 들어가며 작명을 하기에느 번거로운 경험을 하신적이 있나요? 노벨플로우의 AI 작명 엔진은 작가님들이 원하는 태그 조합과 상세 설명을 통해 어울리는 이름을 빠르게 생성해드립니다. 또한 각 캐릭터나 아이템 장소 등의 개인적인 히스토리 관리와 이름의 저장 및 관리 기능을 지원합니다.',
    tags: ['태그 조합', '상세 설명', '저장 및 관리', '히스토리 관리'],
    accent: '#5E6AD2',
  },
  {
    number: '02',
    icon: Scale,
    title: '자모 유사도 필터',
    subtitle: '어감 중복을 기술로 원천 차단',
    description:
      '\'카일\'과 \'카엘\'처럼 발음이 헷갈리는 이름이 작품 속에 공존하면 독자는 쉽게 혼란에 빠집니다. 한글 유니코드를 초성·중성·종성으로 분해한 뒤 Levenshtein Distance 알고리즘으로 기존 등장인물과 자모 유사도를 실시간 계산하여, 75% 이상 겹치는 이름은 자동으로 제외하고 경고를 표시합니다.',
    tags: ['한글 자모 분해', 'Levenshtein', '75% 임계 필터', '중복 경고'],
    accent: '#E2487A',
  },
  {
    number: '03',
    icon: Network,
    title: '인물 관계도 캔버스',
    subtitle: '드래그 한 번으로 수십 명의 인물 관계를 한눈에',
    description:
      '장기 연재가 거듭될수록 캐릭터는 수십 명으로 불어나고, 그 관계는 더욱 복잡하게 얽힙니다. 인물 관계도 캔버스에서 노드를 드래그하면 SVG 벡터 곡선이 실시간으로 다시 그려지며, 관계의 성격(우호·적대·혈연 등)에 따라 색깔과 두께로 한눈에 구분할 수 있습니다. 설정 위키와 양방향 연동되어 캔버스를 수정하면 캐릭터 카드도 자동 업데이트됩니다.',
    tags: ['드래그 앤 드롭', 'SVG 관계선', '관계 유형 색상', '위키 양방향 연동'],
    accent: '#2ECC71',
  },
  {
    number: '04',
    icon: GitCommit,
    title: '복선 타임라인',
    subtitle: '심은 복선을 잊지 않도록, 시스템이 기억합니다',
    description:
      '100화에 심어 놓은 복선을 150화에 회수하지 못하면 독자의 신뢰가 깨집니다. 복선 타임라인은 각 복선에 회수 목표 화수를 설정하고, 그 시점이 지나도 해결되지 않으면 에디터와 타임라인 양쪽에 경고 플래그를 띄웁니다. 스토리 전체의 흐름을 타임라인 뷰에서 한눈에 조망하며 미회수 복선을 실수 없이 관리하세요.',
    tags: ['미회수 경고', '화수 목표 설정', '타임라인 뷰', '설정 붕괴 방지'],
    accent: '#F39C12',
  },
  {
    number: '05',
    icon: Link2,
    title: '노션 양방향 동기화',
    subtitle: '노션의 자유로움과 노벨플로우의 정밀함을 동시에',
    description:
      '이미 노션에서 설정을 관리하고 계신가요? 노벨플로우와 노션을 연결하면 인물 카드, 세계관 항목, 타임라인 이벤트가 양방향으로 실시간 동기화됩니다. Redis 메시지 큐와 초당 2회 속도 제어(레이트 리미터)로 API 한도를 안전하게 지키면서, 충돌이 발생하면 어느 쪽 데이터를 우선할지 직접 선택할 수 있습니다.',
    tags: ['OAuth 2.0 연동', 'Redis 큐', '2 rps 속도 제어', '충돌 해결'],
    accent: '#5E6AD2',
  },
  {
    number: '06',
    icon: BookOpen,
    title: '캐릭터 히스토리',
    subtitle: '캐릭터의 성장과 변화를 회차 단위로 추적',
    description:
      '처음 등장했을 때와 현재의 인물이 얼마나 성장했는지, 어떤 계기로 성격이 변했는지 기억하기 어렵습니다. 캐릭터 히스토리는 각 인물에 대해 회차·사건 단위의 변화 로그를 쌓아 두고, 특정 시점의 스탯·관계·심리 상태를 언제든 되돌아볼 수 있게 합니다. 설붕 없는 성장 서사와 일관된 인물 아크를 유지하는 가장 확실한 방법입니다.',
    tags: ['회차별 스냅샷', '성격 변화 로그', '스탯 추적', '캐릭터 아크 관리'],
    accent: '#9B59B6',
  },
  {
    number: '07',
    icon: Map,
    title: '세계관 지도 편집기',
    subtitle: '단순한 그림이 아닌 서사 관리와 시각화를 하나로',
    description:
      '작가님이 마우스로 직접 영역(폴리곤), 핀(포인트), 경로선을 캔버스 위에 그려 지도를 편집하고, 그 위에 등장인물의 동선, 세력 변화, 복선 등을 연결하여 관리할 수 있습니다. 빵 부스러기 네비게이션을 통한 무제한 계층형 드릴다운 기능과 작품 전개에 따른 지도 히스토리 스냅샷 타임라인을 제공합니다.',
    tags: ['폴리곤 드로잉', '계층형 드릴다운', '타임라인 스냅샷', '동선 추적'],
    accent: '#1ABC9C',
  },
];

export default function Features({ themeMode }: FeaturesProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('feature-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const isDark = themeMode === 'dark';

  return (
    <section className={`w-full pb-24 ${isDark ? 'bg-[#08090A]' : 'bg-[#F4F4F6]'}`}>
      {/* 섹션 헤더 */}
      <div className="w-full mx-auto px-12 md:px-24 mb-24 text-center">
        <p className={`text-sm font-semibold tracking-widest uppercase mb-4 pb-2 ${isDark ? 'text-[#5E6AD2]' : 'text-[#5E6AD2]'}`}>
          Core Features
        </p>
        <h2 className={`font-heading font-bold text-3xl md:text-4xl tracking-tight pb-2 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
          작가의 불편함을 설계로 해결합니다
        </h2>
        <p className={`mt-4 text-base mx-auto leading-relaxed pb-2 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          연재 마감의 압박 속에서도 설정 붕괴 없이 탄탄한 서사를 이어갈 수 있도록,
          노벨플로우가 7가지 핵심 도구를 제공합니다.
        </p>
      </div>

      {/* 기능 카드 목록 */}
      <div className="w-ful mx-auto px-12 md:px-24 flex flex-col gap-6">
        {FEATURES.map((feat, idx) => {
          const IconComponent = feat.icon;
          return (
            <div
              key={feat.number}
              ref={(el) => { itemRefs.current[idx] = el; }}
              className="feature-item"
            >
              <div className={`
                group relative rounded-2xl border p-8 md:p-10 overflow-hidden
                transition-all duration-300 cursor-default
                ${isDark
                  ? 'bg-[#0D0E11] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#111215]'
                  : 'bg-white border-black/[0.06] hover:border-black/[0.14] hover:shadow-lg'
                }
              `}>
                {/* 배경 액센트 글로우 (다크 모드) */}
                {isDark && (
                  <div
                    className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                    style={{ backgroundColor: feat.accent }}
                  />
                )}

                <div className="relative flex flex-col md:flex-row md:items-start gap-6 md:gap-10">
                  {/* 번호 + 아이콘 */}
                  <div className="flex-shrink-0 flex flex-col items-start gap-3">
                    <span className={`font-heading font-bold text-xs tracking-widest ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>
                      {feat.number}
                    </span>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${feat.accent}18`, border: `1px solid ${feat.accent}30` }}
                    >
                      <IconComponent className="w-5 h-5 shrink-0" style={{ color: feat.accent }} />
                    </div>
                  </div>

                  {/* 본문 */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-heading font-bold text-xl mb-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                      {feat.title}
                    </h3>
                    <p className="text-sm font-medium mb-4" style={{ color: feat.accent }}>
                      {feat.subtitle}
                    </p>
                    <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                      {feat.description}
                    </p>
                    {/* 태그 */}
                    <div className="flex flex-wrap gap-2">
                      {feat.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-xs px-3 py-1 rounded-full font-medium ${isDark ? 'bg-white/[0.05] text-[#A1A1AA]' : 'bg-black/[0.05] text-[#55555A]'
                            }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
