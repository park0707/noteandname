import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CreateProjectModal from '../components/CreateProjectModal';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import InfoPage from './InfoPage';

// Import new modularized components
import WorkspaceLayoutManager from '../components/workspace/WorkspaceLayoutManager';
import type { LayoutNode, PanelNode } from '../components/workspace/layoutUtils';
import {
  findPanel,
  findFirstPanelId,
  updatePanelState,
  splitPanel,
  closePanel,
  updateSplitRatio,
} from '../components/workspace/layoutUtils';
import type { Project, Episode, Node } from '../components/workspace/types';

interface WorkspacePageProps {
  themeMode: 'dark' | 'light';
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function WorkspacePage({ themeMode }: WorkspacePageProps) {
  const { user } = useAuth();
  const isDark = themeMode === 'dark';

  const [layoutTree, setLayoutTree] = useState<LayoutNode>({
    type: 'panel',
    id: 'main-panel',
    activeFeature: 'dashboard',
    selectedEpisodeId: null,
  });
  const [focusedPanelId, setFocusedPanelId] = useState<string>('main-panel');

  const currentFocusedPanel = findPanel(layoutTree, focusedPanelId);
  const activeFeature = currentFocusedPanel ? currentFocusedPanel.activeFeature : 'dashboard';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // 1. 대시보드 실시간 메모장
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving'

  // 2. 인물 관계도 (AiNamingEngine 및 JamoFilter 공유 상태)
  const [relationNodes, setRelationNodes] = useState<Node[]>([
    { id: '1', name: '유진 (주인공)', x: 100, y: 150, color: '#5E6AD2' },
    { id: '2', name: '라비 (조연)', x: 260, y: 80, color: '#2ECC71' },
    { id: '3', name: '벨리알 (악역)', x: 420, y: 220, color: '#E2487A' },
  ]);

  // 3. 집필실 (Writing Editor) 에피소드 공유 상태
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [editorSaveStatus, setEditorSaveStatus] = useState<'saved' | 'saving'>('saved');

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
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'mock-p2',
            name: '청풍검가',
            description: '강호를 휩쓰는 푸른 바람의 검객 서사시',
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

  // 프로젝트 선택 시 layoutTree 및 focusedPanelId 초기화
  useEffect(() => {
    if (selectedProject) {
      setLayoutTree({
        type: 'panel',
        id: 'main-panel',
        activeFeature: 'dashboard',
        selectedEpisodeId: null,
      });
      setFocusedPanelId('main-panel');
    } else {
      setLayoutTree({
        type: 'panel',
        id: 'main-panel',
        activeFeature: 'dashboard',
        selectedEpisodeId: null,
      });
      setFocusedPanelId('main-panel');
    }
  }, [selectedProject]);

  // 프로젝트 선택 시 해당 에피소드(회차) 자동 로드
  useEffect(() => {
    if (selectedProject) {
      const epKey = `novelflow_episodes_${selectedProject.id}`;
      const saved = localStorage.getItem(epKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Episode[];
          setEpisodes(parsed);
          if (parsed.length > 0) {
            setLayoutTree(prev => {
              const firstPanelId = findFirstPanelId(prev);
              return updatePanelState(prev, firstPanelId, { selectedEpisodeId: parsed[0].id });
            });
          } else {
            setLayoutTree(prev => {
              const firstPanelId = findFirstPanelId(prev);
              return updatePanelState(prev, firstPanelId, { selectedEpisodeId: null });
            });
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        // 기본 모의 에피소드 데이터 초기화
        const initialEpisodes: Episode[] = [
          {
            id: 'ep-1',
            projectId: selectedProject.id,
            title: '제 1화: 깨어난 별빛',
            content: '별빛이 어둠 속에서 깨어났다. 하늘을 가로지르는 차가운 성광(星光) 아래, 소년은 긴 잠에서 깨어났다. 주위는 온통 고요했고, 오직 바람만이 나뭇잎을 흔드는 스산한 소리만이 숲속을 채우고 있었다.\n\n"여기는 어디지?"\n\n소년은 자신의 손을 바라보았다. 검푸른 별빛의 마력이 은은하게 맴돌고 있었다.',
            wordCount: 125,
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ep-2',
            projectId: selectedProject.id,
            title: '제 2화: 위험한 의뢰',
            content: '주점 구석에서 조용히 술을 마시던 유진에게 검은 망토의 사내가 다가왔다. 사내는 탁자 위에 낡은 양가죽 지도를 내려놓으며 나지막한 목소리로 말했다.\n\n"그림자 숲의 중심부로 안내해주게. 대가는 넉넉히 지불하지."\n\n그림자 숲. 그곳은 살아서 돌아온 자가 없다는 죽음의 땅이었다.',
            wordCount: 135,
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'ep-3',
            projectId: selectedProject.id,
            title: '제 3화: 그림자 숲의 정체',
            content: '그림자 숲의 입구는 거대한 괴물의 아가리처럼 아가리를 벌리고 있었다. 안개는 한 치 앞도 내다볼 수 없을 정도로 짙었고, 나무들은 기괴하게 비틀린 채 하늘을 가리고 있었다.\n\n"정말 괜찮겠나?"\n\n사내가 뒤를 돌아보며 물었지만, 유진은 이미 묵묵히 첫걸음을 내딛고 있었다.',
            wordCount: 134,
            updatedAt: new Date().toISOString(),
          }
        ];
        setEpisodes(initialEpisodes);
        setLayoutTree(prev => {
          const firstPanelId = findFirstPanelId(prev);
          return updatePanelState(prev, firstPanelId, { selectedEpisodeId: 'ep-1' });
        });
        localStorage.setItem(epKey, JSON.stringify(initialEpisodes));
      }
    } else {
      setEpisodes([]);
      setLayoutTree(prev => {
        const firstPanelId = findFirstPanelId(prev);
        return updatePanelState(prev, firstPanelId, { selectedEpisodeId: null });
      });
    }
  }, [selectedProject]);

  // 에피소드 변경 시 자동 저장 및 로컬 스토리지 동기화
  useEffect(() => {
    if (!selectedProject || episodes.length === 0) return;
    setEditorSaveStatus('saving');
    const timer = setTimeout(() => {
      const epKey = `novelflow_episodes_${selectedProject.id}`;
      localStorage.setItem(epKey, JSON.stringify(episodes));
      setEditorSaveStatus('saved');
    }, 1000);
    return () => clearTimeout(timer);
  }, [episodes, selectedProject]);

  // 프로젝트 생성
  const handleCreateProject = async (name: string, description: string) => {
    if (!user) return;
    if (user.id === 'guest-user-id') {
      const newProj = {
        id: `mock-p-${Date.now()}`,
        name,
        description,
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
        handleFeatureSelect('dashboard');
      }
      return;
    }

    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      handleFeatureSelect('dashboard');
    }
  };

  // 프로젝트 이름 및 설명 수정
  const handleUpdateProjectDetails = async (newName: string, newDescription: string) => {
    if (!selectedProject) return;
    const updatedFields = { name: newName, description: newDescription };
    if (selectedProject.id.startsWith('mock-')) {
      setSelectedProject({ ...selectedProject, ...updatedFields });
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...updatedFields } : p));
      return;
    }

    await supabase.from('projects').update(updatedFields).eq('id', selectedProject.id);
    setSelectedProject({ ...selectedProject, ...updatedFields });
    setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, ...updatedFields } : p));
  };

  // 화면 분할 조작 헬퍼 함수들
  const handleFocus = (panelId: string) => {
    setFocusedPanelId(panelId);
  };

  const handleSplit = (targetId: string, direction: 'row' | 'col', position: 'first' | 'second') => {
    const newPanelId = `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setLayoutTree(prev => splitPanel(prev, targetId, direction, position, newPanelId));
    setFocusedPanelId(newPanelId);
  };

  const handleClose = (panelId: string) => {
    setLayoutTree(prev => {
      const { root, nextFocusId } = closePanel(prev, panelId);
      if (nextFocusId) {
        setFocusedPanelId(nextFocusId);
      }
      return root;
    });
  };

  const handleRatioChange = (splitId: string, ratio: number) => {
    setLayoutTree(prev => updateSplitRatio(prev, splitId, ratio));
  };

  const handleUpdatePanelState = (
    panelId: string,
    updates: Partial<Omit<PanelNode, 'type' | 'id'>>
  ) => {
    setLayoutTree(prev => updatePanelState(prev, panelId, updates));
  };

  const handleFeatureSelect = (feat: string) => {
    let defaultEpId: string | null = null;
    if (feat === 'editor') {
      const currentPanel = findPanel(layoutTree, focusedPanelId);
      if (!currentPanel?.selectedEpisodeId && episodes.length > 0) {
        const firstEp = episodes.find(e => !e.isFolder);
        if (firstEp) {
          defaultEpId = firstEp.id;
        }
      }
    }

    setLayoutTree(prev => updatePanelState(prev, focusedPanelId, {
      activeFeature: feat,
      ...(feat === 'editor' && defaultEpId ? { selectedEpisodeId: defaultEpId } : {})
    }));
  };

  return (
    <div className={`w-full h-screen flex overflow-hidden ${isDark ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'}`}>
      <Sidebar
        themeMode={themeMode}
        activeFeature={activeFeature}
        onFeatureSelect={handleFeatureSelect}
        selectedProject={selectedProject}
        onBackToProjects={() => { setSelectedProject(null); handleFeatureSelect('dashboard'); }}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedProject ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 flex overflow-hidden">
                <WorkspaceLayoutManager
                  layoutTree={layoutTree}
                  focusedPanelId={focusedPanelId}
                  onFocus={handleFocus}
                  onSplit={handleSplit}
                  onClose={handleClose}
                  onRatioChange={handleRatioChange}
                  onUpdatePanelState={handleUpdatePanelState}
                  selectedProject={selectedProject}
                  setSelectedProject={setSelectedProject}
                  episodes={episodes}
                  setEpisodes={setEpisodes}
                  editorSaveStatus={editorSaveStatus}
                  relationNodes={relationNodes}
                  setRelationNodes={setRelationNodes}
                  notes={notes}
                  setNotes={setNotes}
                  saveStatus={saveStatus}
                  setSaveStatus={setSaveStatus}
                  onUpdateProjectDetails={handleUpdateProjectDetails}
                  isDark={isDark}
                  themeMode={themeMode}
                />
              </div>
            </div>
          ) : (
            <>
              {activeFeature === 'info' ? (
                <InfoPage themeMode={themeMode} onClose={() => handleFeatureSelect('dashboard')} />
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
                          return (
                            <div
                              key={project.id}
                              onClick={() => { setSelectedProject(project); handleFeatureSelect('dashboard'); }}
                              className={`group relative rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:shadow-lg ${isDark ? 'bg-[#0D0E11] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#111215]' : 'bg-white border-black/[0.06] hover:border-black/[0.12]'
                                }`}
                            >
                              <div className="flex-1">
                                <h3 className={`font-heading font-bold text-base mb-1 leading-snug ${isDark ? 'text-white' : 'text-[#121316]'}`}>{project.name}</h3>
                                {project.description && <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{project.description}</p>}
                              </div>
                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                </div>
                                <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>{formatDate(project.updated_at)}</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 ${isDark ? 'bg-[#1A1C20] text-[#A1A1AA] hover:bg-red-900/30 hover:text-red-400' : 'bg-[#F0F0F3] text-[#A1A1AA] hover:bg-red-50 hover:text-red-500'
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
