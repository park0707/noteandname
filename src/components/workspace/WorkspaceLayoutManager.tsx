import { useState, useRef, useEffect } from 'react';
import { Columns, Rows, X, Plus, ChevronDown } from 'lucide-react';
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from 'react-resizable-panels';
import type { LayoutNode, PanelNode } from './layoutUtils';
import type { Project, Episode, Node, Foreshadowing } from './types';

// Import modular components
import ProjectDashboard from './ProjectDashboard';
import AiNamingEngine from './AiNamingEngine';
import JamoFilter from './JamoFilter';
import RelationsMap from './RelationsMap';
import ForeshadowingTimeline from './ForeshadowingTimeline';
import CharacterHistory from './CharacterHistory';
import WorldMap from './WorldMap';
import WritingSpace from './WritingSpace';
import InfoPage from '../../pages/InfoPage';

interface WorkspaceLayoutManagerProps {
  layoutTree: LayoutNode;
  focusedPanelId: string;
  onFocus: (panelId: string) => void;
  onSplit: (panelId: string, direction: 'row' | 'col', position: 'first' | 'second') => void;
  onClose: (panelId: string) => void;
  onRatioChange: (splitId: string, ratio: number) => void;
  onUpdatePanelState: (panelId: string, updates: Partial<Omit<PanelNode, 'type' | 'id'>>) => void;

  // Shared state props from WorkspacePage
  selectedProject: Project;
  setSelectedProject: (p: Project | null) => void;
  episodes: Episode[];
  setEpisodes: React.Dispatch<React.SetStateAction<Episode[]>>;
  editorSaveStatus: 'saved' | 'saving';
  relationNodes: Node[];
  setRelationNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  foreshadowings: Foreshadowing[];
  setForeshadowings: React.Dispatch<React.SetStateAction<Foreshadowing[]>>;
  notes: string;
  setNotes: (n: string) => void;
  saveStatus: string;
  setSaveStatus: (s: string) => void;
  onUpdateProjectDetails: (newName: string, newDescription: string) => Promise<void>;
  isDark: boolean;
  themeMode: 'dark' | 'light';
  targetWordCount: number;
  setTargetWordCount: (v: number) => void;
}

export default function WorkspaceLayoutManager(props: WorkspaceLayoutManagerProps) {
  const { layoutTree } = props;

  // 패널이 1개 초과인지 확인하여 닫기 버튼 활성화 여부 결정
  const countPanels = (node: LayoutNode): number => {
    if (node.type === 'panel') return 1;
    return countPanels(node.children[0]) + countPanels(node.children[1]);
  };
  const totalPanels = countPanels(layoutTree);
  const showCloseButton = totalPanels > 1;

  return (
    <div className="w-full h-full flex overflow-hidden relative select-none">
      <LayoutNodeRenderer
        node={layoutTree}
        showCloseButton={showCloseButton}
        {...props}
      />
    </div>
  );
}

interface LayoutNodeRendererProps extends WorkspaceLayoutManagerProps {
  node: LayoutNode;
  showCloseButton: boolean;
}

function LayoutNodeRenderer(props: LayoutNodeRendererProps) {
  const { node, onRatioChange } = props;

  if (node.type === 'split') {
    const direction = node.direction;

    return (
      <PanelGroup
        orientation={direction === 'row' ? 'horizontal' : 'vertical'}
        className="w-full h-full"
      >
        <Panel
          defaultSize={node.ratio}
          minSize={15}
          onResize={(size) => {
            // 미세 조절 시 무한 루프 예방 및 최적화
            if (Math.abs(node.ratio - size.asPercentage) > 0.5) {
              onRatioChange(node.id, size.asPercentage);
            }
          }}
          className="overflow-hidden flex relative"
        >
          <LayoutNodeRenderer {...props} node={node.children[0]} />
        </Panel>

        <PanelResizeHandle
          className={`relative z-20 shrink-0 select-none transition-colors duration-150 hover:bg-[#5E6AD2]/50 ${
            direction === 'row' ? 'w-1.5 cursor-col-resize' : 'h-1.5 cursor-row-resize'
          } ${props.isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`}
        />

        <Panel
          minSize={15}
          className="overflow-hidden flex relative"
        >
          <LayoutNodeRenderer {...props} node={node.children[1]} />
        </Panel>
      </PanelGroup>
    );
  }

  return <PanelRenderer panel={node} {...props} />;
}

interface PanelRendererProps extends WorkspaceLayoutManagerProps {
  panel: PanelNode;
  showCloseButton: boolean;
}

function PanelRenderer(props: PanelRendererProps) {
  const {
    panel,
    focusedPanelId,
    onFocus,
    onSplit,
    onClose,
    onUpdatePanelState,
    selectedProject,
    setSelectedProject,
    episodes,
    setEpisodes,
    editorSaveStatus,
    relationNodes,
    setRelationNodes,
    foreshadowings,
    setForeshadowings,
    notes,
    setNotes,
    saveStatus,
    setSaveStatus,
    onUpdateProjectDetails,
    isDark,
    themeMode,
    showCloseButton,
    targetWordCount,
    setTargetWordCount,
  } = props;

  const isFocused = focusedPanelId === panel.id;
  const [showSplitDropdown, setShowSplitDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as HTMLDivElement)) {
        setShowSplitDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 패널 포커스 전파
  const handlePanelClick = () => {
    if (!isFocused) {
      onFocus(panel.id);
    }
  };

  // 패널 제목 가져오기
  const getPanelTitle = (): string => {
    switch (panel.activeFeature) {
      case 'dashboard':
        return '프로젝트 홈';
      case 'naming':
        return 'AI 작명 엔진';
      case 'jamo':
        return '자모 유사도 필터';
      case 'relations':
        return '인물 관계도';
      case 'timeline':
        return '복선 타임라인';
      case 'history':
        return '캐릭터 히스토리';

      case 'worldmap':
        return '세계관 지도';
      case 'info':
        return '정보';
      case 'editor':
        if (panel.selectedEpisodeId) {
          const ep = episodes.find((e) => e.id === panel.selectedEpisodeId);
          return ep ? `집필실 - ${ep.title}` : '집필실';
        }
        return '집필실';
      default:
        return '작업 화면';
    }
  };

  // 개별 패널 단위의 setSelectedEpisodeId 전달용 래퍼 함수
  const handleSetSelectedEpisodeId = (id: string | null) => {
    onUpdatePanelState(panel.id, {
      activeFeature: 'editor',
      selectedEpisodeId: id,
    });
  };

  // 개별 패널 단위의 setActiveFeature 전달용 래퍼 함수
  const handleSetActiveFeature = (feat: string) => {
    onUpdatePanelState(panel.id, {
      activeFeature: feat,
    });
  };

  return (
    <div
      onClick={handlePanelClick}
      className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-200 ${
        isFocused && showCloseButton
          ? isDark
            ? 'border-2 border-[#5E6AD2]'
            : 'border-2 border-[#5E6AD2]'
          : isDark
          ? 'border border-white/[0.04]'
          : 'border border-black/[0.04]'
      }`}
    >
      {/* 패널 헤더 바 */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b select-none shrink-0 transition-colors duration-150 ${
          isFocused && showCloseButton
            ? isDark
              ? 'bg-[#18191E] border-white/[0.08]'
              : 'bg-[#ECECF0] border-black/[0.08]'
            : isDark
            ? 'bg-[#0E0F12] border-white/[0.04]'
            : 'bg-[#F4F4F6] border-black/[0.04]'
        }`}
      >
        {/* 좌측 패널 정보 */}
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isFocused && showCloseButton ? 'bg-[#5E6AD2] shadow-[0_0_8px_#5E6AD2]' : 'bg-transparent'
            }`}
          />
          <span
            className={`text-xs font-semibold tracking-wide truncate ${
              isFocused && showCloseButton
                ? isDark
                  ? 'text-white font-bold'
                  : 'text-black font-bold'
                : isDark
                ? 'text-[#A1A1AA]'
                : 'text-[#55555A]'
            }`}
          >
            {getPanelTitle()}
          </span>
        </div>

        {/* 우측 컨트롤 도구 */}
        <div className="flex items-center gap-1.5">
          {/* 분할 드롭다운 */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePanelClick();
                setShowSplitDropdown(!showSplitDropdown);
              }}
              title="화면 분할"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition-all duration-150 ${
                isDark
                  ? 'border-white/[0.06] bg-white/[0.02] text-[#A1A1AA] hover:bg-white/[0.08] hover:text-white'
                  : 'border-black/[0.06] bg-black/[0.01] text-[#55555A] hover:bg-black/[0.05] hover:text-black'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>분할</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showSplitDropdown && (
              <div
                className={`absolute right-0 mt-1.5 w-36 rounded-xl border p-1 shadow-xl z-30 animate-in fade-in slide-in-from-top-2 duration-150 ${
                  isDark
                    ? 'bg-[#111215]/95 border-white/[0.08] text-gray-200 backdrop-blur-md shadow-black/80'
                    : 'bg-white/95 border-black/[0.08] text-gray-800 backdrop-blur-md shadow-black/10'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit(panel.id, 'row', 'second');
                    setShowSplitDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors duration-150 ${
                    isDark ? 'hover:bg-white/[0.06] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>우측 분할</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit(panel.id, 'col', 'second');
                    setShowSplitDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors duration-150 ${
                    isDark ? 'hover:bg-white/[0.06] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black'
                  }`}
                >
                  <Rows className="w-3.5 h-3.5" />
                  <span>하단 분할</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit(panel.id, 'row', 'first');
                    setShowSplitDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors duration-150 ${
                    isDark ? 'hover:bg-white/[0.06] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5 rotate-180" />
                  <span>좌측 분할</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSplit(panel.id, 'col', 'first');
                    setShowSplitDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors duration-150 ${
                    isDark ? 'hover:bg-white/[0.06] hover:text-white' : 'hover:bg-black/[0.05] hover:text-black'
                  }`}
                >
                  <Rows className="w-3.5 h-3.5 rotate-180" />
                  <span>상단 분할</span>
                </button>
              </div>
            )}
          </div>

          {/* 닫기 버튼 */}
          {showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(panel.id);
              }}
              title="화면 닫기"
              className={`p-1 rounded-lg border transition-all duration-150 ${
                isDark
                  ? 'border-white/[0.06] bg-white/[0.02] text-[#A1A1AA] hover:bg-red-950/30 hover:text-red-400 hover:border-red-900/30'
                  : 'border-black/[0.06] bg-black/[0.01] text-[#55555A] hover:bg-red-50 hover:text-red-500 hover:border-red-200'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 패널 내부 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden relative select-text" onClick={handlePanelClick}>
        {panel.activeFeature === 'dashboard' && (
          <ProjectDashboard
            selectedProject={selectedProject}
            notes={notes}
            setNotes={setNotes}
            saveStatus={saveStatus}
            setSaveStatus={setSaveStatus}
            onUpdateProjectDetails={onUpdateProjectDetails}
            setActiveFeature={handleSetActiveFeature}
            isDark={isDark}
            episodes={episodes}
            relationNodes={relationNodes}
            setSelectedEpisodeId={handleSetSelectedEpisodeId}
            targetWordCount={targetWordCount}
            onTargetWordCountChange={setTargetWordCount}
          />
        )}
        {panel.activeFeature === 'editor' && (
          <WritingSpace
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            setActiveFeature={handleSetActiveFeature}
            episodes={episodes}
            setEpisodes={setEpisodes}
            selectedEpisodeId={panel.selectedEpisodeId}
            setSelectedEpisodeId={handleSetSelectedEpisodeId}
            editorSaveStatus={editorSaveStatus}
            relationNodes={relationNodes}
            isDark={isDark}
            targetWordCount={targetWordCount}
          />
        )}
        {panel.activeFeature === 'naming' && (
          <AiNamingEngine
            isDark={isDark}
            relationNodes={relationNodes}
          />
        )}
        {panel.activeFeature === 'jamo' && (
          <JamoFilter
            isDark={isDark}
            relationNodes={relationNodes}
          />
        )}
        {panel.activeFeature === 'relations' && (
          <RelationsMap
            isDark={isDark}
            relationNodes={relationNodes}
            setRelationNodes={setRelationNodes}
          />
        )}
        {panel.activeFeature === 'timeline' && (
          <ForeshadowingTimeline
            isDark={isDark}
            foreshadowings={foreshadowings}
            setForeshadowings={setForeshadowings}
          />
        )}
        {panel.activeFeature === 'history' && (
          <CharacterHistory
            isDark={isDark}
          />
        )}
        {panel.activeFeature === 'worldmap' && (
          <WorldMap
            isDark={isDark}
            selectedProject={selectedProject}
            episodes={episodes}
            relationNodes={relationNodes}
            foreshadowings={foreshadowings}
          />
        )}
        {panel.activeFeature === 'info' && (
          <InfoPage
            themeMode={themeMode}
            onClose={() => handleSetActiveFeature('dashboard')}
          />
        )}
      </div>
    </div>
  );
}
