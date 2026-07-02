import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import CreateProjectModal from '../components/CreateProjectModal';
import Footer from '../components/Footer';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';

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

// 장르별 색상 매핑
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

export default function WorkspacePage({ themeMode }: WorkspacePageProps) {
  const { user } = useAuth();
  const isDark = themeMode === 'dark';

  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 프로젝트 목록 불러오기
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) setProjects(data as Project[]);
    setLoadingProjects(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 프로젝트 생성
  const handleCreateProject = async (name: string, description: string) => {
    if (!user) return;
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name,
      description,
      genre: '기타',
    });
    if (!error) {
      setShowCreateModal(false);
      fetchProjects();
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (id: string) => {
    if (!confirm('프로젝트를 삭제하시겠습니까?')) return;
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className={`w-full h-screen flex overflow-hidden ${
      isDark ? 'bg-[#08090A] text-[#EDEDEF]' : 'bg-[#F4F4F6] text-[#121316]'
    }`}>
      {/* 사이드바 */}
      <Sidebar
        themeMode={themeMode}
        activeFeature={activeFeature}
        onFeatureSelect={setActiveFeature}
        selectedProject={null}
        onBackToProjects={() => setActiveFeature('dashboard')}
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className={`px-8 py-5 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
        }`}>
          <div>
            <h1 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>
              내 프로젝트
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
              {loadingProjects ? '불러오는 중...' : `총 ${projects.length}개의 프로젝트`}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold
              hover:bg-[#7480E2] active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-4 h-4 shrink-0" />
            새 프로젝트
          </button>
        </div>

        {/* 프로젝트 그리드 */}
        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
          {loadingProjects ? (
            // 로딩 스켈레톤
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border p-5 h-44 animate-pulse ${
                      isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : projects.length === 0 ? (
            // 빈 상태
            <div className="w-full flex-1 flex flex-col items-center justify-center gap-4 py-20">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'
              }`}>
                <FolderOpen className={`w-8 h-8 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`} />
              </div>
              <div className="text-center">
                <p className={`font-heading font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
                  아직 프로젝트가 없습니다
                </p>
                <p className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
                  첫 번째 작품을 만들어 보세요.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5E6AD2] text-white text-sm font-semibold
                  hover:bg-[#7480E2] transition-all duration-150"
              >
                <Plus className="w-4 h-4" />
                새 프로젝트 만들기
              </button>
            </div>
          ) : (
            // 프로젝트 카드 그리드
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.map((project) => {
                  const genreColor = GENRE_COLORS[project.genre] ?? '#A1A1AA';
                  return (
                    <div
                      key={project.id}
                      className={`group relative rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer
                        transition-all duration-200 hover:shadow-lg
                        ${isDark
                          ? 'bg-[#0D0E11] border-white/[0.06] hover:border-white/[0.12] hover:bg-[#111215]'
                          : 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-black/5'
                        }`}
                    >
                      {/* 장르 색상 바 */}
                      <div
                        className="w-8 h-1 rounded-full"
                        style={{ backgroundColor: genreColor }}
                      />

                      {/* 제목 */}
                      <div className="flex-1">
                        <h3 className={`font-heading font-bold text-base mb-1 leading-snug ${
                          isDark ? 'text-white' : 'text-[#121316]'
                        }`}>
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className={`text-xs leading-relaxed line-clamp-2 ${
                            isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'
                          }`}>
                            {project.description}
                          </p>
                        )}
                      </div>

                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2">
                          {project.genre && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: `${genreColor}18`,
                                color: genreColor,
                              }}
                            >
                              {project.genre}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>
                          {formatDate(project.updated_at)}
                        </span>
                      </div>

                      {/* 삭제 버튼 (호버 시 표시) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                        className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center
                          opacity-0 group-hover:opacity-100 transition-all duration-150
                          ${isDark
                            ? 'bg-[#1A1C20] text-[#A1A1AA] hover:bg-red-900/30 hover:text-red-400'
                            : 'bg-[#F0F0F3] text-[#A1A1AA] hover:bg-red-50 hover:text-red-500'
                          }`}
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 대시보드 하단 푸터 */}
          <Footer themeMode={themeMode} />
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
