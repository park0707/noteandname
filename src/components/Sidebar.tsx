import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MyPageModal from './MyPageModal';
import {
  LayoutDashboard,
  Sparkles,
  Scale,
  Network,
  GitCommit,
  BookOpen,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  ChevronLeft,
  Compass,
  FileText
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SidebarProps {
  themeMode: 'dark' | 'light';
  activeFeature: string;
  onFeatureSelect: (feature: string) => void;
  selectedProject: Project | null;
  onBackToProjects: () => void;
}

export default function Sidebar({
  themeMode,
  activeFeature,
  onFeatureSelect,
  selectedProject,
  onBackToProjects
}: SidebarProps) {
  const { user } = useAuth();
  const isDark = themeMode === 'dark';
  const [collapsed, setCollapsed] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: selectedProject ? '프로젝트 홈' : '대시보드' },
    { id: 'editor', icon: FileText, label: '집필실', badge: selectedProject ? undefined : '선택 필요' },
    { id: 'naming', icon: Sparkles, label: 'AI 작명 엔진', badge: selectedProject ? undefined : '선택 필요' },
    { id: 'jamo', icon: Scale, label: '자모 유사도 필터', badge: selectedProject ? undefined : '선택 필요' },
    { id: 'relations', icon: Network, label: '인물 관계도', badge: selectedProject ? undefined : '선택 필요' },
    { id: 'timeline', icon: GitCommit, label: '복선 타임라인', badge: selectedProject ? undefined : '선택 필요' },
    { id: 'history', icon: BookOpen, label: '캐릭터 히스토리', badge: selectedProject ? undefined : '선택 필요' },
    ...(selectedProject ? [{ id: 'worldmap', icon: Compass, label: '세계관 지도' }] : []),
  ];

  return (
    <aside
      className={`h-screen flex flex-col shrink-0 border-r transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } ${isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'}`}
    >
      {/* 상단: 로고 + 접기 버튼 */}
      <div className={`flex items-center border-b border-inherit shrink-0 ${
        collapsed ? 'flex-col gap-2 px-2 py-3' : 'justify-between px-4 py-4'
      }`}>
        {/* 로고 */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.png"
            alt="Novelflow Logo"
            className="w-8 h-8 rounded-lg shrink-0 object-cover"
          />
          {!collapsed && (
            <span className={`font-heading font-bold text-base whitespace-nowrap ${
              isDark ? 'text-white' : 'text-[#121316]'
            }`}>
              Novelflow
            </span>
          )}
        </Link>

        {/* 접기/펼치기 버튼 */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className={`flex items-center justify-center rounded-lg transition-all duration-150 shrink-0 ${
            collapsed ? 'w-8 h-8' : 'w-7 h-7'
          } ${isDark
            ? 'text-[#3A3D50] hover:bg-white/[0.06] hover:text-[#A1A1AA]'
            : 'text-[#C5C5CC] hover:bg-black/[0.05] hover:text-[#55555A]'
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 프로젝트 뒤로가기 버튼 */}
      {selectedProject && (
        <div className={`flex justify-center shrink-0 ${collapsed ? 'px-2' : 'px-3 py-2'}`}>
          {collapsed ? (
            <button
              onClick={onBackToProjects}
              title="프로젝트 목록으로"
              className={`w-10 h-10 rounded-xl flex items-center justify-center border mt-2 transition-all duration-150 ${
                isDark
                  ? 'border-white/[0.06] bg-white/[0.02] text-[#A1A1AA] hover:bg-white/[0.05] hover:text-[#EDEDEF] hover:border-white/[0.12]'
                  : 'border-black/[0.06] bg-black/[0.01] text-[#55555A] hover:bg-black/[0.03] hover:text-[#121316] hover:border-black/[0.12]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onBackToProjects}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all duration-150 ${
                isDark
                  ? 'border-white/[0.06] bg-white/[0.02] text-[#A1A1AA] hover:bg-white/[0.05] hover:text-[#EDEDEF] hover:border-white/[0.12]'
                  : 'border-black/[0.06] bg-black/[0.01] text-[#55555A] hover:bg-black/[0.03] hover:text-[#121316] hover:border-black/[0.12]'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              프로젝트 목록
            </button>
          )}
        </div>
      )}

      {/* 네비게이션 */}
      <nav className={`flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto ${
        collapsed ? 'px-2 items-center' : 'px-3'
      }`}>
        {navItems.map((item) => {
          const isActive = activeFeature === item.id;
          const isDisabled = !!item.badge && !selectedProject;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onFeatureSelect(item.id)}
              disabled={isDisabled}
              title={collapsed ? item.label : undefined}
              className={`
                flex items-center rounded-lg text-sm font-medium
                transition-all duration-150
                ${collapsed ? 'w-10 h-10 justify-center px-0' : 'w-full gap-3 px-3 py-2 text-left'}
                ${isActive
                  ? isDark
                    ? 'bg-[#5E6AD2]/15 text-[#7480E2]'
                    : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                  : isDark
                    ? 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#EDEDEF] disabled:opacity-40 disabled:cursor-not-allowed'
                    : 'text-[#55555A] hover:bg-black/[0.04] hover:text-[#121316] disabled:opacity-40 disabled:cursor-not-allowed'
                }
              `}
            >
              <IconComponent className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                      isDark ? 'bg-white/[0.06] text-[#A1A1AA]' : 'bg-black/[0.05] text-[#A1A1AA]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* 하단 영역 */}
      <div className={`border-t flex flex-col gap-0.5 py-3 ${
        collapsed ? 'px-2 items-center' : 'px-3'
      } ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}`}>

        {/* 정보 버튼 */}
        <button
          onClick={() => onFeatureSelect('info')}
          title={collapsed ? '정보' : undefined}
          className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150
            ${collapsed ? 'w-10 h-10 justify-center' : 'w-full gap-3 px-3 py-2'}
            ${activeFeature === 'info'
              ? isDark ? 'bg-[#5E6AD2]/15 text-[#7480E2]' : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
              : isDark
                ? 'text-[#A1A1AA] hover:bg-white/[0.04] hover:text-[#EDEDEF]'
                : 'text-[#55555A] hover:bg-black/[0.04] hover:text-[#121316]'
            }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          {!collapsed && <span>정보</span>}
        </button>

        {/* 유저 정보 + 마이페이지 버튼 */}
        {collapsed ? (
          /* 접힌 상태: 아바타만, 클릭 시 마이페이지 열기 */
          <button
            onClick={() => setShowMyPage(true)}
            title={`${user?.email ?? ''} — 마이페이지`}
            className="w-10 h-10 rounded-full bg-[#5E6AD2] flex items-center justify-center
              text-white text-xs font-bold mt-1 hover:opacity-80 transition-opacity"
          >
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </button>
        ) : (
          /* 펼쳐진 상태: 이메일 + 세로 점 3개 마이페이지 버튼 */
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mt-1 ${
            isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]'
          }`}>
            <div className="w-7 h-7 rounded-full bg-[#5E6AD2] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium truncate ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>
                {user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={() => setShowMyPage(true)}
              title="마이페이지"
              className={`p-1.5 rounded-lg transition-all shrink-0 ${
                isDark
                  ? 'text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#EDEDEF]'
                  : 'text-[#55555A] hover:bg-black/[0.05] hover:text-[#121316]'
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 마이페이지 모달 */}
      {showMyPage && (
        <MyPageModal
          themeMode={themeMode}
          onClose={() => setShowMyPage(false)}
        />
      )}
    </aside>
  );
}
