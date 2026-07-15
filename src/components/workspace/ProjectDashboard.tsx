import { useState, useEffect } from 'react';
import {
  ChevronRight,
  Globe,
  Settings,
  X,
  BookOpen,
  AlertCircle,
  TrendingUp,
  FileText,
  CheckSquare,
  Plus,
  Trash2,
  Sparkles
} from 'lucide-react';
import type { Project, Episode, Node } from './types';
import { useAlertConfirm } from '../../context/AlertConfirmContext';

interface ProjectDashboardProps {
  selectedProject: Project;
  notes: string;
  setNotes: (val: string) => void;
  saveStatus: string;
  setSaveStatus: (status: string) => void;
  onUpdateProjectDetails?: (newName: string, newDesc: string) => void;
  setActiveFeature: (feat: string) => void;
  isDark: boolean;
  episodes: Episode[];
  relationNodes: Node[];
  setSelectedEpisodeId: (id: string | null) => void;
  targetWordCount?: number;
  onTargetWordCountChange?: (v: number) => void;
}

interface ToDoItem {
  id: string;
  text: string;
  completed: boolean;
}

function formatDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProjectDashboard({
  selectedProject,
  notes,
  setNotes,
  saveStatus,
  setSaveStatus,
  onUpdateProjectDetails,
  setActiveFeature,
  isDark,
  episodes,
  relationNodes,
  setSelectedEpisodeId,
  targetWordCount: targetWordCountProp,
  onTargetWordCountChange,
}: ProjectDashboardProps) {
  const { showAlert } = useAlertConfirm();
  const [editingName, setEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState(selectedProject.name);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Extended project configurations
  const [publishSchedule, setPublishSchedule] = useState('주 5회 (월~금)');
  // 외부 prop이 있으면 우선 사용, 없으면 로컈 localStorage에서 하이드
  const [targetWordCount, setTargetWordCount] = useState(targetWordCountProp ?? 5000);

  // Modal form input states
  const [inputName, setInputName] = useState(selectedProject.name);
  const [inputDescription, setInputDescription] = useState(selectedProject.description || '');
  const [inputSchedule, setInputSchedule] = useState(publishSchedule);
  const [inputTargetWordCount, setInputTargetWordCount] = useState(targetWordCount);

  // Local To-Do lists
  const [todoList, setTodoList] = useState<ToDoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');

  // Daily writing volume stats (last 7 days)
  const [dailyStats, setDailyStats] = useState<number[]>([]);

  // Load project settings & todo list & stats from localStorage when project changes
  useEffect(() => {
    const settingsKey = `novelflow_project_settings_${selectedProject.id}`;
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setPublishSchedule(parsed.publishSchedule || '주 5회 (월~금)');
        setTargetWordCount(parsed.targetWordCount || 5000);
      } catch (e) {
        console.error(e);
      }
    } else {
      setPublishSchedule('주 5회 (월~금)');
      setTargetWordCount(5000);
    }

    // Load To-Do list
    const todoKey = `novelflow_todo_${selectedProject.id}`;
    const savedTodo = localStorage.getItem(todoKey);
    if (savedTodo) {
      try {
        setTodoList(JSON.parse(savedTodo));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Default initial checklist
      setTodoList([
        { id: '1', text: '1화 주인공 스탯 설계 완료하기', completed: true },
        { id: '2', text: '5화 클리프행어(위기 고조) 씬 피드백 반영', completed: false },
        { id: '3', text: '세계관 마법 세력 구도 지도에 마킹', completed: false },
      ]);
    }

    // Load or generate Daily stats (simulated logs)
    const statsKey = `novelflow_daily_stats_${selectedProject.id}`;
    const savedStats = localStorage.getItem(statsKey);
    if (savedStats) {
      try {
        setDailyStats(JSON.parse(savedStats));
      } catch (e) {
        console.error(e);
      }
    } else {
      const generated = [2300, 3100, 0, 4800, 2900, 5200, 1500]; // 7 days values
      setDailyStats(generated);
      localStorage.setItem(statsKey, JSON.stringify(generated));
    }

    // Update modal inputs
    setInputName(selectedProject.name);
    setInputDescription(selectedProject.description || '');
  }, [selectedProject]);

  useEffect(() => {
    setInputSchedule(publishSchedule);
    setInputTargetWordCount(targetWordCount);
  }, [publishSchedule, targetWordCount]);

  useEffect(() => {
    if (targetWordCountProp !== undefined) {
      setTargetWordCount(targetWordCountProp);
    }
  }, [targetWordCountProp]);

  useEffect(() => {
    setEditingNameValue(selectedProject.name);
  }, [selectedProject.name]);

  // Sync To-Do changes to localStorage
  const saveTodo = (list: ToDoItem[]) => {
    setTodoList(list);
    localStorage.setItem(`novelflow_todo_${selectedProject.id}`, JSON.stringify(list));
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const newItem: ToDoItem = {
      id: `todo-${Date.now()}`,
      text: newTodoText.trim(),
      completed: false,
    };
    saveTodo([...todoList, newItem]);
    setNewTodoText('');
  };

  const handleToggleTodo = (id: string) => {
    saveTodo(
      todoList.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleDeleteTodo = (id: string) => {
    saveTodo(todoList.filter(item => item.id !== id));
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    setSaveStatus('saving');
  };

  const handleSaveSettings = () => {
    const trimmedName = inputName.trim();
    if (!trimmedName) {
      showAlert('작품 이름을 입력해 주세요.');
      return;
    }

    const parsedWordCount = Number(inputTargetWordCount);
    if (isNaN(parsedWordCount) || parsedWordCount <= 0) {
      showAlert('목표 글자 수는 0보다 큰 숫자여야 합니다.');
      return;
    }

    onUpdateProjectDetails?.(trimmedName, inputDescription.trim());

    const settingsKey = `novelflow_project_settings_${selectedProject.id}`;
    const settingsData = {
      publishSchedule: inputSchedule,
      targetWordCount: parsedWordCount,
    };
    localStorage.setItem(settingsKey, JSON.stringify(settingsData));

    setPublishSchedule(inputSchedule);
    setTargetWordCount(parsedWordCount);
    // WorkspacePage의 공유 상태도 업데이트
    onTargetWordCountChange?.(parsedWordCount);
    setShowSettingsModal(false);
  };

  // Filter episodes (only manuscripts, excluding folders)
  const manuscriptEpisodes = episodes.filter(ep => !ep.isFolder);

  // Compute total characters count
  const totalWords = manuscriptEpisodes.reduce((sum, ep) => sum + (ep.charCount || 0), 0);

  // Sort episodes by updatedAt desc for "Recent Manuscripts"
  const recentEpisodes = [...manuscriptEpisodes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // Progress calculations based on the latest active episode
  const latestEpisode = recentEpisodes[0];
  const currentWords = latestEpisode ? (latestEpisode.charCount || 0) : 0;
  const progressPercent = Math.min(Math.round((currentWords / targetWordCount) * 100), 100);

  // Simulated week dates for charts
  const weekDays = ['월', '화', '수', '목', '금', '토', '일'];

  // Foreshadowing simulated alerts
  const mockForeshadows = [
    { id: 'f-1', title: '1화 검은 망토 사내의 계약', targetEp: 20, currentEp: episodes.length, status: 'warning', text: '회수 타겟: 20화 (현재 지연 중!)' },
    { id: 'f-2', title: '3화 황금 열쇠의 획득', targetEp: 50, currentEp: episodes.length, status: 'safe', text: '회수 타겟: 50화 (여유 있음)' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 relative">
      {/* 작품 정보 헤더 - 넓은 여백과 구조적 공간 배치 */}
      <div className={`p-8 md:p-10 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all ${isDark
          ? 'bg-gradient-to-r from-[#0C0D10] to-[#121318] border-white/[0.06]'
          : 'bg-gradient-to-r from-white to-[#F8F9FA] border-black/[0.06] shadow-sm'
        }`}>
        {/* 장식용 그래디언트 구체 */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#5E6AD2]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col flex-1 relative z-10 gap-3.5">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? 'bg-white/[0.04] text-gray-400' : 'bg-black/[0.04] text-gray-600'
              }`}>
              생성일자 {formatDate(selectedProject.created_at)}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#5E6AD2] font-bold">
              <Sparkles className="w-3 h-3" /> 대학생 1인 창작 지원
            </span>
          </div>

          {editingName ? (
            <input
              id="dashboard-project-name-input"
              autoFocus
              type="text"
              value={editingNameValue}
              onChange={e => setEditingNameValue(e.target.value)}
              onBlur={() => {
                const trimmed = editingNameValue.trim();
                if (trimmed && trimmed !== selectedProject.name) {
                  onUpdateProjectDetails?.(trimmed, selectedProject.description || '');
                }
                setEditingName(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'Escape') {
                  setEditingName(false);
                }
              }}
              className={`font-heading font-bold text-3xl mb-1.5 mt-2 bg-transparent border-b-2 border-[#5E6AD2] outline-none leading-tight w-full max-w-md ${isDark ? 'text-white' : 'text-[#121316]'
                }`}
            />
          ) : (
            <h2
              onClick={() => { setEditingNameValue(selectedProject.name); setEditingName(true); }}
              title="더블클릭 또는 탭하여 제목 수정"
              className={`font-heading font-bold text-3xl mb-1.5 mt-2 cursor-text select-none hover:opacity-75 transition-opacity ${isDark ? 'text-white' : 'text-[#121316]'
                }`}
            >
              {selectedProject.name}
            </h2>
          )}

          <p className={`text-sm leading-relaxed max-w-3xl mt-1.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            {selectedProject.description || '작품 소개 문장이 없습니다. 설정에서 추가해보세요.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5 pt-1.5">
            <span className={`text-[11px] px-3.5 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/20 text-[#7480E2]' : 'bg-[#5E6AD2]/5 border-[#5E6AD2]/15 text-[#5E6AD2]'
              }`}>
              📅 연재 목표: {publishSchedule}
            </span>
            <span className={`text-[11px] px-3.5 py-1.5 rounded-lg font-bold border ${isDark ? 'bg-white/[0.02] border-white/[0.04] text-gray-400' : 'bg-black/[0.02] border-black/[0.04] text-gray-600'
              }`}>
              🎯 회차별 목표: {targetWordCount.toLocaleString()}자
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowSettingsModal(true)}
          className={`px-4.5 py-3 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all shrink-0 self-start md:self-center relative z-10 ${isDark
              ? 'bg-[#18191C] border-white/[0.06] text-gray-300 hover:text-white hover:border-white/20'
              : 'bg-[#F3F4F6] border-black/[0.06] text-gray-700 hover:text-black hover:border-black/20'
            }`}
        >
          <Settings className="w-4 h-4" /> 작품 설정
        </button>
      </div>

      {/* 3단 대시보드 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 좌측 2개 열 (원고 통계, 최근 작성, 집필 분석 그래프) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* 통계 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 최근 회차 달성률 프로그레스 */}
            <div className={`p-5 rounded-2xl border flex items-center justify-between gap-4 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
              }`}>
              <div className="flex flex-col gap-1.5">
                <span className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>최근 회차 집필율</span>
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  {currentWords.toLocaleString()} 자
                </span>
                <span className="text-[10px] text-gray-500">목표: {targetWordCount.toLocaleString()}자 ({progressPercent}%)</span>
              </div>
              {/* 원형 SVG 프로그레스 차트 */}
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className={isDark ? 'text-white/[0.04]' : 'text-black/[0.04]'}
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#5E6AD2]"
                    strokeWidth="3.5"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                  {progressPercent}%
                </div>
              </div>
            </div>

            {/* 누적 글자 수 */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
              }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>누적 원고량</span>
              <span className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                {totalWords.toLocaleString()} 자
              </span>
              <span className="text-[10px] text-gray-500">집필된 모든 자수 총합</span>
            </div>

            {/* 집필 회차 수 */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
              }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>집필 회차</span>
              <span className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                {manuscriptEpisodes.length} 화
              </span>
              <span className="text-[10px] text-gray-500">인물 수: {relationNodes.length}명 대기 중</span>
            </div>
          </div>

          {/* 최근 집필 원고 바로가기 */}
          <div className={`p-6 rounded-2xl border flex flex-col gap-4 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#5E6AD2]" />
                <h3 className={`font-heading font-bold text-base ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  최근 집필 중인 원고
                </h3>
              </div>
              <button
                onClick={() => setActiveFeature('editor')}
                className="text-xs font-bold text-[#5E6AD2] hover:underline flex items-center gap-0.5"
              >
                전체 회차 편집실 <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {recentEpisodes.length === 0 ? (
                <div className={`p-8 rounded-xl border border-dashed text-center text-xs text-gray-500 ${isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'
                  }`}>
                  아직 작성된 회차가 없습니다. 에디터에서 새 회차를 만들어 보세요!
                </div>
              ) : (
                recentEpisodes.map(ep => (
                  <div
                    key={ep.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isDark
                        ? 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]'
                        : 'border-black/[0.04] bg-black/[0.01] hover:bg-black/[0.03] hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/[0.04] text-[#7480E2]' : 'bg-black/[0.04] text-[#5E6AD2]'
                        }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                          {ep.title}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {ep.charCount?.toLocaleString() || 0}자 · 마지막 저장 {formatDate(ep.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEpisodeId(ep.id);
                        setActiveFeature('editor');
                      }}
                      className={`text-xs px-3.5 py-1.5 rounded-lg border font-bold transition-all ${isDark
                          ? 'border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.05] active:scale-[0.98]'
                          : 'border-black/[0.08] text-gray-600 hover:text-[#121316] hover:bg-black/[0.05] active:scale-[0.98]'
                        }`}
                    >
                      이어 쓰기
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 주간 집필 분석 그래프 (SVG 기반 직접 구현) */}
          <div className={`p-6 rounded-2xl border flex flex-col gap-4 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#5E6AD2]" />
                <h3 className={`font-heading font-bold text-base ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  최근 7일 집필 페이스 (자수)
                </h3>
              </div>
              <span className="text-[10px] text-gray-500">단위: 글자 수 (자)</span>
            </div>

            <div className="h-44 w-full flex items-end justify-between pt-6 px-4 pb-2 relative">
              {/* 요출용 안내 가이드 선 */}
              <div className="absolute left-0 right-0 top-[25%] border-b border-dashed border-gray-500/10" />
              <div className="absolute left-0 right-0 top-[50%] border-b border-dashed border-gray-500/10" />
              <div className="absolute left-0 right-0 top-[75%] border-b border-dashed border-gray-500/10" />

              {dailyStats.map((val, idx) => {
                const maxVal = Math.max(...dailyStats, 5000);
                const heightPercent = `${(val / maxVal) * 80}%`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 z-10 relative group">
                    {/* 호버 시 자수 툴팁 */}
                    <div className="absolute bottom-[90%] left-1/2 -translate-x-1/2 bg-[#5E6AD2] text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                      {val.toLocaleString()}자
                    </div>
                    {/* 막대 바 */}
                    <div
                      className="w-8 rounded-t-md transition-all duration-500 bg-gradient-to-t from-[#5E6AD2] to-[#7480E2] group-hover:brightness-110 shadow-sm"
                      style={{ height: heightPercent }}
                    />
                    <span className="text-[10px] text-gray-500 font-bold">{weekDays[idx]}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 우측 1개 열 (메모, To-Do, 세계관 요약) */}
        <div className="flex flex-col gap-6">

          {/* 아이디어 메모 스크래치패드 */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3 h-64 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                아이디어 스크래치패드
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${saveStatus === 'saved' ? 'bg-[#2ECC71]/15 text-[#2ECC71]' : 'bg-[#F39C12]/15 text-[#F39C12]'
                }`}>
                {saveStatus === 'saved' ? '저장됨' : '입력 중...'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="마감 일정, 복선 복기, 혹은 떠오르는 아이디어를 즉흥적으로 기록하세요..."
              className={`flex-1 w-full p-3.5 rounded-xl text-xs outline-none border resize-none leading-relaxed transition-all duration-200 ${isDark
                  ? 'bg-[#121316] border-white/[0.06] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                  : 'bg-[#F8F8FA] border-black/[0.06] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
                }`}
            />
          </div>

          {/* To-Do 마감 체크리스트 */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#5E6AD2]" />
                <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  마감 투두 보드
                </h3>
              </div>
              <span className="text-[10px] text-gray-500">
                {todoList.filter(t => t.completed).length}/{todoList.length} 완료
              </span>
            </div>

            {/* 리스트 본문 */}
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {todoList.length === 0 ? (
                <p className="text-[11px] text-gray-500 text-center py-4">등록된 투두가 없습니다.</p>
              ) : (
                todoList.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-2 group/todo">
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleTodo(item.id)}
                        className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-3.5 h-3.5"
                      />
                      <span className={`text-xs truncate ${item.completed
                          ? 'line-through text-gray-500'
                          : isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteTodo(item.id)}
                      className="opacity-0 group-hover/todo:opacity-100 p-0.5 rounded text-gray-500 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* 입력 폼 */}
            <form onSubmit={handleAddTodo} className="flex items-center gap-1.5 mt-2">
              <input
                type="text"
                placeholder="새 마감 과제 추가..."
                value={newTodoText}
                onChange={e => setNewTodoText(e.target.value)}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border transition-all ${isDark
                    ? 'bg-[#121316] border-white/[0.06] text-white focus:border-[#5E6AD2]'
                    : 'bg-[#F9FAFB] border-black/[0.06] text-black focus:border-[#5E6AD2]'
                  }`}
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-[#5E6AD2] text-white hover:bg-[#7480E2] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* 복선 떡밥 현황 경고판 */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  미회수 복선 리마인더
                </h3>
              </div>
              <button
                onClick={() => setActiveFeature('timeline')}
                className="text-[10px] font-semibold text-[#5E6AD2] hover:underline"
              >
                타임라인 이동
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {mockForeshadows.map(f => (
                <div
                  key={f.id}
                  className={`p-2.5 rounded-xl border flex flex-col gap-1 ${f.status === 'warning'
                      ? isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                      : isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                    }`}
                >
                  <span className={`text-[11px] font-bold ${f.status === 'warning'
                      ? 'text-red-400'
                      : 'text-emerald-500'
                    }`}>
                    {f.title}
                  </span>
                  <span className="text-[10px] text-gray-500">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 세계관 지도 위젯 */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#5E6AD2]" />
                <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  가상 대륙 지도
                </h3>
              </div>
              <button
                onClick={() => setActiveFeature('worldmap')}
                className="text-[10px] font-semibold text-[#5E6AD2] hover:underline"
              >
                지도 열기
              </button>
            </div>
            <div className={`relative h-28 rounded-xl border overflow-hidden flex items-center justify-center ${isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
              }`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                <Globe className="w-16 h-16 text-[#5E6AD2]" />
              </div>
              <div className="text-center relative z-10">
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>
                  아이론 대륙 (계층: 3단계)
                </p>
                <button
                  onClick={() => setActiveFeature('worldmap')}
                  className="px-3 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-[10px] font-bold transition-colors"
                >
                  지리 설계기 편집
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 작품 설정 모달 */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all ${isDark ? 'bg-[#15161A] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
            }`}>
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-500/10 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5E6AD2]" /> 작품 설정
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 입력 폼 */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">작품 이름</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder="작품 이름을 입력하세요"
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${isDark
                      ? 'bg-[#1E1F22] border-white/[0.06] text-white focus:border-[#5E6AD2]'
                      : 'bg-[#F9FAFB] border-black/[0.06] text-black focus:border-[#5E6AD2]'
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">작품 정보</label>
                <textarea
                  value={inputDescription}
                  onChange={e => setInputDescription(e.target.value)}
                  placeholder="작품에 대한 상세 정보나 설명을 입력하세요"
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none transition-all ${isDark
                      ? 'bg-[#1E1F22] border-white/[0.06] text-white focus:border-[#5E6AD2]'
                      : 'bg-[#F9FAFB] border-black/[0.06] text-black focus:border-[#5E6AD2]'
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">연재 주기</label>
                <input
                  type="text"
                  value={inputSchedule}
                  onChange={e => setInputSchedule(e.target.value)}
                  placeholder="예: 주 5회 (월~금), 자유연재"
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${isDark
                      ? 'bg-[#1E1F22] border-white/[0.06] text-white focus:border-[#5E6AD2]'
                      : 'bg-[#F9FAFB] border-black/[0.06] text-black focus:border-[#5E6AD2]'
                    }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">회차별 목표 글자수 (자)</label>
                <input
                  type="number"
                  value={inputTargetWordCount}
                  onChange={e => setInputTargetWordCount(Number(e.target.value))}
                  min={1}
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none transition-all ${isDark
                      ? 'bg-[#1E1F22] border-white/[0.06] text-white focus:border-[#5E6AD2]'
                      : 'bg-[#F9FAFB] border-black/[0.06] text-black focus:border-[#5E6AD2]'
                    }`}
                />
              </div>

              <div className={`p-4 rounded-xl border flex flex-col gap-2 mt-2 text-xs ${isDark ? 'bg-white/[0.01] border-white/[0.04]' : 'bg-black/[0.01] border-black/[0.04]'
                }`}>
                <div className="flex justify-between">
                  <span className="text-gray-400">생성일자</span>
                  <span className="font-semibold">{formatDate(selectedProject.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">마지막 수정</span>
                  <span className="font-semibold">{formatDate(selectedProject.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">프로젝트 ID</span>
                  <span className="font-mono text-[10px] break-all">{selectedProject.id}</span>
                </div>
              </div>
            </div>

            {/* 하단 푸터 버튼 */}
            <div className="px-6 py-4 border-t border-gray-500/10 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${isDark
                    ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.04]'
                    : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                  }`}
              >
                취소
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
