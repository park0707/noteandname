import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CreateProjectModal from '../components/CreateProjectModal';
import {
  Plus,
  FolderOpen,
  Trash2,
  Sparkles,
  GitCommit,
  BookOpen,
  Link2,
  RefreshCw,
  Globe,
  Eye,
  EyeOff,
  User,
  Layers,
  ChevronRight
} from 'lucide-react';
import InfoPage from './InfoPage';

interface Project {
  id: string;
  name: string;
  description: string;
  genre: string;
  created_at: string;
  updated_at: string;
}

interface WorkspacePageProps {
  themeMode: 'dark' | 'light';
}

const GENRE_COLORS: Record<string, string> = {
  '판타지': '#5E6AD2',
  '무협': '#E2487A',
  '현대': '#2ECC71',
  '로맨스': '#E91E8C',
  'SF': '#00BCD4',
  '스릴러': '#F39C12',
  '기타': '#A1A1AA',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 한글 자모 분해 알고리즘
function decomposeHangeul(str: string): string {
  const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNGSUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
  const JONGSUNG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const result: string[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const jong = offset % 28;
      const jung = ((offset - jong) / 28) % 21;
      const cho = Math.floor((offset - jong) / 28 / 21);
      result.push(CHOSUNG[cho]);
      result.push(JUNGSUNG[jung]);
      if (jong > 0) result.push(JONGSUNG[jong]);
    } else {
      result.push(str[i]);
    }
  }
  return result.join(' ');
}

// Levenshtein Distance 계산
function getLevenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 삭제
          dp[i][j - 1] + 1,    // 삽입
          dp[i - 1][j - 1] + 1 // 대체
        );
      }
    }
  }
  return dp[m][n];
}

// 자모 기반 어감 유사도 계산
function calculateSimilarity(name1: string, name2: string): number {
  const decomposed1 = decomposeHangeul(name1).replace(/\s/g, '');
  const decomposed2 = decomposeHangeul(name2).replace(/\s/g, '');
  const dist = getLevenshteinDistance(decomposed1, decomposed2);
  const maxLen = Math.max(decomposed1.length, decomposed2.length);
  if (maxLen === 0) return 0;
  return Math.round((1 - dist / maxLen) * 100);
}

export default function WorkspacePage({ themeMode }: WorkspacePageProps) {
  const { user } = useAuth();
  const isDark = themeMode === 'dark';

  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // -----------------------------------------------------------
  // [LIFTED STATES] Hook Rules 준수를 위해 상위 컴포넌트로 상태 승격
  // -----------------------------------------------------------
  // 1. 대시보드 실시간 메모장
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  // 2. AI 작명 엔진
  const [namingConcept, setNamingConcept] = useState('fantasy');
  const [namingGender, setNamingGender] = useState('all');
  const [namingKeywords, setNamingKeywords] = useState('');
  const [namingLoading, setNamingLoading] = useState(false);
  const [namingResults, setNamingResults] = useState<{ name: string; meaning: string; similarity: number; matchChar?: string }[]>([]);

  // 3. 자모 유사도 필터
  const [jamoTestName, setJamoTestName] = useState('');

  // 4. 인물 관계도 캔버스
  const [relationNodes, setRelationNodes] = useState([
    { id: '1', name: '유진 (주인공)', x: 100, y: 150, color: '#5E6AD2' },
    { id: '2', name: '라비 (조연)', x: 260, y: 80, color: '#2ECC71' },
    { id: '3', name: '벨리알 (악역)', x: 420, y: 220, color: '#E2487A' },
  ]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

  // 5. 세계관 지도 편집기
  const [worldMapSnapshotIdx, setWorldMapSnapshotIdx] = useState(0);

  // 프로젝트 목록 불러오기
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      setProjects(data as Project[]);
    } else {
      // 게스트/데브 모드 또는 DB가 비었을 때 기본 목 데이터 탑재
      if (import.meta.env.DEV || (user && user.id === 'guest-user-id')) {
        setProjects([
          {
            id: 'mock-p1',
            name: '검은 마법사의 최후',
            description: '세계관 지도와 캐릭터 히스토리가 살아 숨쉬는 현대 판타지 웹소설',
            genre: '판타지',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-p2',
            name: '청풍검가',
            description: '강호를 휩쓰는 푸른 바람의 검객 서사시',
            genre: '무협',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
      } else {
        if (!error && data) setProjects(data as Project[]);
      }
    }
    setLoadingProjects(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 프로젝트 선택 시 해당 메모 자동 로드
  useEffect(() => {
    if (selectedProject) {
      const noteKey = `novelflow_notes_${selectedProject.id}`;
      setNotes(localStorage.getItem(noteKey) || '');
      setSaveStatus('saved');
    }
  }, [selectedProject]);

  // 메모 변경 시 자동 저장 디바운스
  useEffect(() => {
    if (!selectedProject) return;
    const noteKey = `novelflow_notes_${selectedProject.id}`;
    const timer = setTimeout(() => {
      localStorage.setItem(noteKey, notes);
      setSaveStatus('saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [notes, selectedProject]);

  // 프로젝트 생성
  const handleCreateProject = async (name: string, description: string) => {
    if (!user) return;
    if (user.id === 'guest-user-id') {
      const newProj = {
        id: `mock-p-${Date.now()}`,
        name,
        description,
        genre: '기타',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProjects(prev => [newProj, ...prev]);
      setShowCreateModal(false);
      return;
    }

    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name,
      description,
      genre: '기타'
    });
    if (!error) {
      setShowCreateModal(false);
      fetchProjects();
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (id: string) => {
    if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
    if (id.startsWith('mock-')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setActiveFeature('dashboard');
      }
      return;
    }

    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setActiveFeature('dashboard');
    }
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 1. 프로젝트 대시보드 (Home)
  // -----------------------------------------------------------
  const renderProjectDashboard = () => {
    if (!selectedProject) return null;

    const handleNotesChange = (val: string) => {
      setNotes(val);
      setSaveStatus('saving');
    };

    const mockChapters = [
      { id: '1', title: '제 1화: 깨어난 별빛', words: 4520, date: '2026.06.28' },
      { id: '2', title: '제 2화: 위험한 의뢰', words: 4890, date: '2026.06.29' },
      { id: '3', title: '제 3화: 그림자 숲의 정체', words: 5120, date: '2026.06.30' },
    ];

    const totalWords = mockChapters.reduce((sum, ch) => sum + ch.words, 0) + 29020;

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        {/* 프로젝트 개요 헤더 */}
        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                isDark ? 'bg-white/[0.06] text-[#A1A1AA]' : 'bg-black/[0.05] text-[#55555A]'
              }`}>
                {selectedProject.genre || '장르 미지정'}
              </span>
              <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>
                생성일: {formatDate(selectedProject.created_at)}
              </span>
            </div>
            <h2 className={`font-heading font-bold text-2xl mb-1.5 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
              {selectedProject.name}
            </h2>
            <p className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              {selectedProject.description || '작품 한 줄 소개가 없습니다.'}
            </p>
          </div>
        </div>

        {/* 위젯 보드 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 통계 및 챕터 목록 */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 통계 요약 */}
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
              }`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-[#3A3D50]' : 'text-[#A1A1AA]'}`}>전체 자수</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{totalWords.toLocaleString()} 자</span>
              </div>
              <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
              }`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-[#3A3D50]' : 'text-[#A1A1AA]'}`}>챕터 수</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{mockChapters.length} 화</span>
              </div>
              <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${
                isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
              }`}>
                <span className={`text-xs font-semibold ${isDark ? 'text-[#3A3D50]' : 'text-[#A1A1AA]'}`}>등록 인물</span>
                <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>3 명</span>
              </div>
            </div>

            {/* 목표 달성 트래커 */}
            <div className={`p-6 rounded-2xl border flex flex-col gap-3 ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>1권 완결 목표 달성도</span>
                <span className="text-xs font-medium text-[#5E6AD2]">44.1% ({totalWords.toLocaleString()}자 / 100,000자)</span>
              </div>
              <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`}>
                <div className="h-full bg-gradient-to-r from-[#5E6AD2] to-[#7480E2] transition-all duration-300" style={{ width: '44.1%' }} />
              </div>
            </div>

            {/* 최근 원고 리스트 */}
            <div className={`p-6 rounded-2xl border flex flex-col gap-4 ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-heading font-bold text-base ${isDark ? 'text-white' : 'text-[#121316]'}`}>최근 집필 원고</h3>
                <button className="text-xs font-bold text-[#5E6AD2] hover:underline flex items-center gap-1">
                  전체 보기 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {mockChapters.map(ch => (
                  <div key={ch.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isDark ? 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]' : 'border-black/[0.04] bg-black/[0.01] hover:bg-black/[0.03]'
                  }`}>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{ch.title}</p>
                      <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{ch.words.toLocaleString()} 자 · {ch.date}</p>
                    </div>
                    <button className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                      isDark ? 'border-white/[0.08] text-[#A1A1AA] hover:text-white hover:bg-white/[0.05]' : 'border-black/[0.08] text-[#55555A] hover:text-[#121316] hover:bg-black/[0.05]'
                    }`}>
                      수정
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 메모장 및 요약 위젯 */}
          <div className="flex flex-col gap-6">
            {/* 실시간 메모장 */}
            <div className={`p-6 rounded-2xl border flex flex-col gap-3 flex-1 min-h-[280px] ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-heading font-bold text-base ${isDark ? 'text-white' : 'text-[#121316]'}`}>아이디어 데스크 메모</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  saveStatus === 'saved' ? 'bg-[#2ECC71]/15 text-[#2ECC71]' : 'bg-[#F39C12]/15 text-[#F39C12]'
                }`}>
                  {saveStatus === 'saved' ? '저장 완료' : '저장 중...'}
                </span>
              </div>
              <textarea
                value={notes}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="마감 일정, 복선 복기, 혹은 떠오르는 아이디어를 즉흥적으로 기록하세요..."
                className={`flex-1 w-full p-4 rounded-xl text-sm outline-none border resize-none leading-relaxed transition-all duration-200 ${
                  isDark
                    ? 'bg-[#121316] border-white/[0.06] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                    : 'bg-[#F8F8FA] border-black/[0.06] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                }`}
              />
            </div>

            {/* 세계관 지도 위젯 */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>세계관 지도 요약</h3>
              <div className={`relative h-28 rounded-xl border overflow-hidden flex items-center justify-center ${
                isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
              }`}>
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                  <Globe className="w-16 h-16 text-[#5E6AD2]" />
                </div>
                <div className="text-center relative z-10">
                  <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>아이론 대륙 (지리 계층: 3단계)</p>
                  <button
                    onClick={() => setActiveFeature('worldmap')}
                    className="px-3 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold transition-colors"
                  >
                    지도 편집기 열기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 2. AI 작명 엔진
  // -----------------------------------------------------------
  const renderAiNamingEngine = () => {
    const handleGenerate = () => {
      setNamingLoading(true);
      setTimeout(() => {
        const pool: Record<string, { name: string; meaning: string }[]> = {
          fantasy: [
            { name: '알리스타', meaning: '별빛을 수호하는 숭고한 방패' },
            { name: '카엘', meaning: '태양의 열기를 인도하는 광휘' },
            { name: '실비아', meaning: '푸른 은빛 숲속의 요정' },
            { name: '레온', meaning: '타오르는 불꽃의 의지를 계승한 용사' },
          ],
          wuxia: [
            { name: '백운', meaning: '기구한 운명 속에서 맑게 흐르는 흰 구름' },
            { name: '청풍', meaning: '세속의 번뇌를 씻어내는 정갈하고 푸른 바람' },
            { name: '검아', meaning: '가장 날카롭게 다듬어진 전설의 검신' },
          ],
          modern: [
            { name: '민준', meaning: '지혜롭고 빼어난 용모를 지닌 소년' },
            { name: '서연', meaning: '가장 아름답고 부드럽게 빛나는 서사' },
          ],
          sf: [
            { name: '제논', meaning: '미지의 차원을 탐구하는 양자 엔지니어' },
            { name: '아이라', meaning: '인공지능 비서에서 자아를 획득한 특이점' },
          ],
        };

        const list = pool[namingConcept] || [];
        const result = list.map(item => {
          const charNames = ['카일', '유진', '라비', '제논', '아라'];
          let maxSim = 0;
          let matched = '';
          charNames.forEach(cName => {
            const sim = calculateSimilarity(item.name, cName);
            if (sim > maxSim) {
              maxSim = sim;
              matched = cName;
            }
          });
          return {
            ...item,
            similarity: maxSim,
            matchChar: maxSim >= 75 ? matched : undefined
          };
        });

        setNamingResults(result);
        setNamingLoading(false);
      }, 600);
    };

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>AI 작명 엔진</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            장르와 분위기에 맞는 주인공, 주연, 조연, 지명 이름을 빠르게 제안합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border flex flex-col gap-4 h-fit ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>세계관 분위기</label>
              <select
                value={namingConcept}
                onChange={e => setNamingConcept(e.target.value)}
                className={`px-3 py-2.5 rounded-lg text-sm border outline-none ${
                  isDark ? 'bg-[#121316] border-white/[0.08] text-white' : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316]'
                }`}
              >
                <option value="fantasy">판타지 서양풍</option>
                <option value="wuxia">무협 동양풍</option>
                <option value="modern">현대 로맨스/드라마</option>
                <option value="sf">SF/사이버펑크 미래풍</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>성별 어감</label>
              <div className="flex gap-2">
                {['all', 'male', 'female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setNamingGender(g)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      namingGender === g
                        ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white'
                        : isDark
                          ? 'border-white/[0.08] text-[#A1A1AA] hover:border-white/20'
                          : 'border-black/[0.08] text-[#55555A] hover:border-black/20'
                    }`}
                  >
                    {g === 'all' ? '중성' : g === 'male' ? '남성풍' : '여성풍'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={`text-xs font-semibold ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>의미 키워드</label>
              <input
                type="text"
                value={namingKeywords}
                onChange={e => setNamingKeywords(e.target.value)}
                placeholder="예) 빛, 칼, 어둠"
                className={`px-3 py-2.5 rounded-lg text-sm border outline-none ${
                  isDark ? 'bg-[#121316] border-white/[0.08] text-white' : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316]'
                }`}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={namingLoading}
              className="mt-2 w-full py-3 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-sm font-semibold transition-all duration-150"
            >
              {namingLoading ? 'AI 추천 분석 중...' : '이름 추천 생성'}
            </button>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#121316]'}`}>작명 결과</h3>
            {namingResults.length === 0 ? (
              <div className={`flex-1 rounded-2xl border border-dashed flex flex-col items-center justify-center p-10 text-center ${
                isDark ? 'border-white/[0.06] bg-white/[0.01] text-[#3A3D50]' : 'border-black/[0.06] bg-black/[0.01] text-[#C5C5CC]'
              }`}>
                <Sparkles className="w-8 h-8 mb-2 animate-pulse" />
                <p className="text-sm font-medium">조건을 설정한 뒤 생성 버튼을 클릭하세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {namingResults.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{item.name}</span>
                        {item.matchChar && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                            유사도 {item.similarity}% 경고 (기존 인물 '{item.matchChar}' 존재)
                          </span>
                        )}
                        {!item.matchChar && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-bold">
                            어감 안전 (유사도 {item.similarity}%)
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{item.meaning}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.name);
                        alert(`"${item.name}" 이름이 복사되었습니다.`);
                      }}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-semibold hover:bg-white/[0.05] transition-colors ${
                        isDark ? 'border-white/[0.08] text-[#EDEDEF]' : 'border-black/[0.08] text-[#121316]'
                      }`}
                    >
                      복사
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 3. 자모 유사도 필터
  // -----------------------------------------------------------
  const renderJamoFilter = () => {
    const mockCharacters = [
      { name: '카일', role: '주연' },
      { name: '유진', role: '주인공' },
      { name: '라비', role: '조연' },
      { name: '제논', role: '주연' },
    ];

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>자모 유사도 필터</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            한글의 초성·중성·종성 유니코드 오프셋을 역산 분해하여, 칼릭스-카엘 등 발음 어감이 유사한 인물을 필터링합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-2xl border flex flex-col gap-4 h-fit ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>실시간 이름 자모 검사</h3>
            <input
              type="text"
              value={jamoTestName}
              onChange={e => setJamoTestName(e.target.value.trim())}
              placeholder="검사할 이름을 입력하세요 (예: 카엘)"
              className={`px-3 py-2.5 rounded-lg text-sm border outline-none ${
                isDark ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-[#F8F8FA] border-black/[0.08] text-[#121316] focus:border-[#5E6AD2]'
              }`}
            />
            {jamoTestName && (
              <div className="flex flex-col gap-2">
                <span className={`text-[10px] font-bold ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>자모 쪼개기 결과</span>
                <div className={`p-3 rounded-lg font-mono text-xs flex justify-between ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                  <span className="text-[#5E6AD2] font-bold">{jamoTestName}</span>
                  <span className={isDark ? 'text-white' : 'text-[#121316]'}>{decomposeHangeul(jamoTestName)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col gap-2.5">
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>주요 인물 어감 유사도 비교 (임계치 75%)</h3>
            {mockCharacters.map((char, idx) => {
              const sim = jamoTestName ? calculateSimilarity(jamoTestName, char.name) : 0;
              const isWarning = sim >= 75;

              return (
                <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-200 ${
                  jamoTestName && isWarning
                    ? 'border-red-500/30 bg-red-500/[0.02]'
                    : isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{char.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded bg-white/[0.05] ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{char.role}</span>
                    </div>
                    {jamoTestName && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                        자모 분해 비교: <span className="font-mono text-[#5E6AD2]">{decomposeHangeul(jamoTestName)}</span> vs <span className="font-mono text-gray-500">{decomposeHangeul(char.name)}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {jamoTestName ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold ${isWarning ? 'text-red-400' : 'text-green-400'}`}>{sim}% 유사</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isWarning ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>{isWarning ? '발음 중복 경고' : '안전'}</span>
                      </div>
                    ) : (
                      <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>대기 중</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 4. 인물 관계도 캔버스
  // -----------------------------------------------------------
  const renderRelationsMap = () => {
    const lines = [
      { from: '1', to: '2', label: '동료', color: '#2ECC71', dashed: false },
      { from: '1', to: '3', label: '적대', color: '#E2487A', dashed: false },
    ];

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!draggingNodeId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left));
      const y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top));
      setRelationNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
    };

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>인물 관계도 캔버스</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            캐릭터 카드를 마우스 드래그 앤 드롭하여 배치하고, 인물 간 관계를 시각선으로 한눈에 조망합니다.
          </p>
        </div>

        <div className={`relative w-full h-[400px] rounded-2xl border overflow-hidden select-none cursor-grab ${
          draggingNodeId ? 'cursor-grabbing' : ''
        } ${isDark ? 'bg-[#090A0C] border-white/[0.06]' : 'bg-[#FAF8FA] border-black/[0.06]'}`}>
          <svg
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setDraggingNodeId(null)}
            onMouseUp={() => setDraggingNodeId(null)}
          >
            {lines.map((line, idx) => {
              const fromNode = relationNodes.find(n => n.id === line.from);
              const toNode = relationNodes.find(n => n.id === line.to);
              if (!fromNode || !toNode) return null;

              const midX = (fromNode.x + toNode.x) / 2;
              const midY = (fromNode.y + toNode.y) / 2;

              return (
                <g key={idx}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={line.color}
                    strokeWidth="2"
                    strokeDasharray={line.dashed ? '5,5' : undefined}
                    opacity="0.6"
                  />
                  <rect x={midX - 20} y={midY - 10} width="40" height="18" rx="5" fill={isDark ? '#121316' : '#FFFFFF'} stroke={line.color} strokeWidth="1" />
                  <text x={midX} y={midY + 3} textAnchor="middle" fill={isDark ? '#EDEDEF' : '#121316'} fontSize="9" fontWeight="bold">{line.label}</text>
                </g>
              );
            })}
          </svg>

          {relationNodes.map(node => (
            <div
              key={node.id}
              onMouseDown={() => setDraggingNodeId(node.id)}
              className={`absolute px-4 py-2 rounded-xl border flex items-center gap-2.5 transition-shadow shadow ${
                draggingNodeId === node.id ? 'shadow-2xl border-[#5E6AD2]' : 'hover:shadow-md'
              } ${isDark ? 'bg-[#121316] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-[#121316]'}`}
              style={{ left: `${node.x}px`, top: `${node.y}px`, transform: 'translate(-50%, -50%)', cursor: 'inherit' }}
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
              <span className="text-xs font-bold">{node.name}</span>
            </div>
          ))}

          <div className="absolute top-4 left-4 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex gap-2">
            <button className="px-3 py-1.5 bg-[#5E6AD2] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> 인물 추가
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 5. 복선 타임라인
  // -----------------------------------------------------------
  const renderForeshadowingTimeline = () => {
    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>복선 타임라인</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            소설 속 심어둔 복선들을 챕터 단위로 정밀하게 추적 관리하여 미회수 복선을 사전 감지합니다.
          </p>
        </div>
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
          <div className="flex items-center gap-2 mb-4">
            <GitCommit className="w-5 h-5 text-[#5E6AD2]" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>황금 열쇠의 비밀 복선</h3>
          </div>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            제 10화에 등장한 황금 열쇠 복선이 설정되었습니다. 목표 회수 시점: 제 50화 (남은 화수: 37화)
          </p>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 6. 캐릭터 히스토리
  // -----------------------------------------------------------
  const renderCharacterHistory = () => {
    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>캐릭터 히스토리</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            주요 인물들의 변화 로그, 캐릭터 아크 성장 및 성격 전이를 챕터 로그별로 추적합니다.
          </p>
        </div>
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
          <div className="flex items-center gap-2.5 mb-3">
            <BookOpen className="w-5 h-5 text-[#5E6AD2]" />
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>유진 (주인공) - 성장 변천사</h3>
          </div>
          <div className="flex flex-col gap-3 pl-3 border-l border-[#5E6AD2]">
            <div className="text-xs">
              <span className="font-bold text-[#5E6AD2]">제 1화</span>: 고대 대현자의 전승 영혼 각성
            </div>
            <div className="text-xs">
              <span className="font-bold text-[#5E6AD2]">제 12화</span>: 동부 전선 흑마법 방어막 극복 성공
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 7. 노션 동기화
  // -----------------------------------------------------------
  const renderNotionSync = () => {
    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>노션 양방향 동기화</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            노벨플로우의 인물 및 세계관 데이터가 노션 페이지 데이터베이스와 실시간 동기화 상태를 유지합니다.
          </p>
        </div>
        <div className={`p-6 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-green-500" />
            <div>
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>연동 상태: 양호</p>
              <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>마지막 동기화 완료: 5분 전</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> 수동 동기화
          </button>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------
  // [SUB-VIEW] 8. 세계관 지도 편집기 (World Map Editor)
  // -----------------------------------------------------------
  const renderWorldMap = () => {
    const snapshots = [
      { name: '1권 시작 기준', date: '작중 932년 4월', desc: '평화로운 아이론 왕국 영토와 가문 세력권.' },
      { name: '동부 요새 함락 사건', date: '작중 932년 10월', desc: '제국의 흑마법 기습 침공으로 동부 요새가 소실됨.' },
      { name: '제국 연합군 병합 완료', date: '작중 933년 6월', desc: '아이론 북부 영토가 제국으로 색상 이전되고 가시성 변경.' },
    ];

    const elements = [
      { id: 'r1', name: '아이론 왕국', type: 'polygon', color: worldMapSnapshotIdx === 2 ? '#E2487A' : '#5E6AD2', opacity: 0.25, coords: 'M 60 80 L 220 80 L 240 200 L 80 180 Z' },
      { id: 'r2', name: '제국 영토', type: 'polygon', color: '#E2487A', opacity: 0.35, coords: 'M 240 80 L 400 80 L 400 200 L 240 200 Z', visible: worldMapSnapshotIdx > 0 },
      { id: 'p1', name: '수도 아이론시', type: 'pin', x: 150, y: 130, active: true },
      { id: 'p2', name: '동부 국경 요새', type: 'pin', x: 230, y: 140, active: worldMapSnapshotIdx === 0 },
    ];

    const currentSnapshot = snapshots[worldMapSnapshotIdx];

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-[#5E6AD2] font-semibold mb-1">
              <span>세계 지도</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              <span className={isDark ? 'text-white' : 'text-[#121316]'}>아이론 왕국</span>
            </div>
            <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>세계관 지도 편집기</h2>
          </div>
          <div className="p-1 rounded-xl bg-black/20 border border-white/[0.08] flex items-center gap-1">
            <button className="p-2 rounded-lg bg-[#5E6AD2] text-white text-xs font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> 영역 그리기
            </button>
            <button className="p-2 rounded-lg text-[#A1A1AA] hover:bg-white/[0.04] text-xs font-bold flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> 핀 배치
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 h-[350px] overflow-y-auto ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>지도 레이어 및 요소</h3>
            <div className="flex flex-col gap-2">
              {elements.map(el => (
                <div key={el.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <span className={`font-medium ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>{el.name}</span>
                  <div className="flex items-center gap-1.5">
                    {el.type === 'pin' && !el.active ? <EyeOff className="w-3.5 h-3.5 text-gray-600" /> : <Eye className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className={`relative h-[280px] rounded-2xl border overflow-hidden flex items-center justify-center ${
              isDark ? 'bg-[#090A0C] border-white/[0.06]' : 'bg-[#FAF8FA] border-black/[0.06]'
            }`}>
              <svg className="absolute inset-0 w-full h-full">
                {elements.filter(el => el.type === 'polygon' && el.visible !== false).map(el => (
                  <path key={el.id} d={el.coords} fill={el.color} fillOpacity={el.opacity} stroke={el.color} strokeWidth="2.5" className="transition-all duration-300" />
                ))}
              </svg>

              {elements.filter(el => el.type === 'pin' && el.active).map(el => (
                <div key={el.id} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ left: `${el.x}px`, top: `${el.y}px` }}>
                  <div className="w-3 h-3 rounded-full bg-[#F39C12] border border-white shrink-0" />
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-black/80 text-white">{el.name}</span>
                </div>
              ))}

              <div className="absolute top-4 right-4 p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] flex flex-col gap-1 w-48 shadow-2xl">
                <span className="text-[#5E6AD2] font-bold">🗺️ 시점 연동 사건 분석</span>
                <p className="text-white font-semibold">{currentSnapshot.name}</p>
                <p className="text-[#A1A1AA] leading-normal">{currentSnapshot.desc}</p>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>타임라인 연동 슬라이더</span>
                <span className="text-[#5E6AD2] font-bold">{currentSnapshot.date}</span>
              </div>
              <div className="relative pt-2">
                <input type="range" min="0" max="2" step="1" value={worldMapSnapshotIdx} onChange={e => setWorldMapSnapshotIdx(parseInt(e.target.value))} className="w-full h-1.5 bg-[#5E6AD2]/20 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]" />
                <div className="flex justify-between text-[9px] font-bold mt-2 text-gray-500">
                  <span>1권 시작</span>
                  <span>요새 함락</span>
                  <span>연합군 병합</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfoPage = () => <InfoPage themeMode={themeMode} onClose={() => setActiveFeature('dashboard')} />;

  return (
    <div className={`w-full h-screen flex overflow-hidden ${isDark ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'}`}>
      <Sidebar
        themeMode={themeMode}
        activeFeature={activeFeature}
        onFeatureSelect={setActiveFeature}
        selectedProject={selectedProject}
        onBackToProjects={() => { setSelectedProject(null); setActiveFeature('dashboard'); }}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedProject ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className={`px-8 py-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-white/[0.06] bg-[#0D0E11]' : 'border-black/[0.06] bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: GENRE_COLORS[selectedProject.genre] ?? '#5E6AD2' }}
                  >
                    {selectedProject.genre?.[0] || '기'}
                  </div>
                  <div>
                    <h1 className={`font-heading font-bold text-sm leading-none ${isDark ? 'text-white' : 'text-[#121316]'}`}>{selectedProject.name}</h1>
                    <span className="text-[10px] text-gray-500">워크스페이스 활성 상태 · {formatDate(selectedProject.updated_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex overflow-hidden">
                {activeFeature === 'dashboard' && renderProjectDashboard()}
                {activeFeature === 'naming' && renderAiNamingEngine()}
                {activeFeature === 'jamo' && renderJamoFilter()}
                {activeFeature === 'relations' && renderRelationsMap()}
                {activeFeature === 'timeline' && renderForeshadowingTimeline()}
                {activeFeature === 'history' && renderCharacterHistory()}
                {activeFeature === 'notion' && renderNotionSync()}
                {activeFeature === 'worldmap' && renderWorldMap()}
                {activeFeature === 'info' && renderInfoPage()}
              </div>
            </div>
          ) : (
            <>
              {activeFeature === 'info' ? (
                <InfoPage themeMode={themeMode} onClose={() => setActiveFeature('dashboard')} />
              ) : (
                <>
                  <div className={`px-8 py-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>
                    <div>
                      <h1 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>내 프로젝트</h1>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                        {loadingProjects ? '불러오는 중...' : `총 ${projects.length}개의 프로젝트`}
                      </p>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold hover:bg-[#7480E2]">
                      <Plus className="w-4 h-4 shrink-0" /> 새 프로젝트
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    {loadingProjects ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`rounded-2xl border p-5 h-44 animate-pulse ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`} />
                        ))}
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4 py-20">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`}>
                          <FolderOpen className={`w-8 h-8 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-heading font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>아직 프로젝트가 없습니다</p>
                          <p className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>첫 번째 작품을 만들어 보세요.</p>
                        </div>
                        <button onClick={() => setShowCreateModal(true)} className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold hover:bg-[#7480E2]">
                          <Plus className="w-4 h-4" /> 새 프로젝트 만들기
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {projects.map((project) => {
                          const genreColor = GENRE_COLORS[project.genre] ?? '#A1A1AA';
                          return (
                            <div
                              key={project.id}
                              onClick={() => { setSelectedProject(project); setActiveFeature('dashboard'); }}
                              className={`group relative rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                isDark ? 'bg-[#0D0E11] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#111215]' : 'bg-white border-black/[0.06] hover:border-black/[0.12]'
                              }`}
                            >
                              <div className="w-8 h-1 rounded-full" style={{ backgroundColor: genreColor }} />
                              <div className="flex-1">
                                <h3 className={`font-heading font-bold text-base mb-1 leading-snug ${isDark ? 'text-white' : 'text-[#121316]'}`}>{project.name}</h3>
                                {project.description && <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{project.description}</p>}
                              </div>
                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                  {project.genre && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${genreColor}18`, color: genreColor }}>
                                      {project.genre}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>{formatDate(project.updated_at)}</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 ${
                                  isDark ? 'bg-[#1A1C20] text-[#A1A1AA] hover:bg-red-900/30 hover:text-red-400' : 'bg-[#F0F0F3] text-[#A1A1AA] hover:bg-red-50 hover:text-red-500'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <CreateProjectModal
          themeMode={themeMode}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
