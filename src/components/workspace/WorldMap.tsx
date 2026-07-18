import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, ChevronDown, Layers, Plus, Move, Trash2, Unlock, ChevronsLeft, ChevronsRight, ChevronLeft, 
  MapPin, Swords, Castle, Mountain, Sparkles, 
  ZoomIn, ZoomOut, Check, X, Download, RotateCcw, RotateCw, Search,
  PenTool, Settings2, History, Ruler, Eye, EyeOff, Grid3X3, Magnet, Lock, Map
} from 'lucide-react';
import type { Project, Episode, Node, Foreshadowing } from './types';
import { useAlertConfirm } from '../../context/AlertConfirmContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// --- Types for WorldMap ---
export interface MapSnapshot {
  id: string;
  order: number;
  name: string;
  date: string;
  description: string;
}

export interface MapElement {
  id: string;
  name: string;
  type: 'pin' | 'polygon' | 'route' | 'border_rect' | 'border_circle' | 'group';
  parentMapId: string; // 계층 구조 연동을 위함 (기본 'root')
  
  // Pin 전용 속성
  x?: number;
  y?: number;
  icon?: 'castle' | 'swords' | 'mountain' | 'mappin';
  
  // Polygon/Route 전용 속성
  points?: Array<{ x: number; y: number }>;
  color?: string;
  opacity?: number;
  texture?: 'none' | 'slash' | 'dots' | 'sand'; // 지형 텍스처
  
  // Border (rect/circle) 전용 속성
  bx?: number;   // 사각형: 좌상단 X, 원: 중심 X
  by?: number;   // 사각형: 좌상단 Y, 원: 중심 Y
  bw?: number;   // 사각형: 너비,   원: 반지름X
  bh?: number;   // 사각형: 높이,   원: 반지름Y
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderWidth?: number;
  
  // 상세 속성
  summary?: string;
  description?: string;
  category?: string; // 유형: 왕국, 제국, 숲, 던전, 자연 등
  imageAttachment?: string; // base64 또는 이미지 url
  tags?: string[]; // 몬스터, 아이템, 세력 등 태그
  associatedCharacters?: string[]; // Node ID 배열 (관련 인물)
  associatedEpisodes?: string[]; // Episode ID 배열 (등장 회차)
  
  childMapId?: string;
  
  // 시점 스냅샷별 오버라이드 데이터 (Snapshot ID -> ElementState)
  statesBySnapshot?: Record<string, {
    visible: boolean;
    name?: string;
    x?: number;
    y?: number;
    points?: Array<{ x: number; y: number }>;
    color?: string;
    description?: string;
  }>;
}

// 스케일 축척 타입
export interface MapScale {
  pixels: number; // 기준 픽셀 (예: 100px)
  value: number; // 기준 실제 거리 (예: 50)
  unit: 'km' | 'days_walk' | 'days_horse' | 'days_carriage'; // 단위
}

interface WorldMapProps {
  isDark: boolean;
  selectedProject: Project;
  episodes: Episode[];
  relationNodes: Node[];
  foreshadowings: Foreshadowing[];
}

export default function WorldMap({ 
  isDark, 
  selectedProject, 
  episodes, 
  relationNodes, 
  foreshadowings: _foreshadowings 
}: WorldMapProps) {
  const { showAlert, showConfirm } = useAlertConfirm();
  const { user } = useAuth();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 계층형 뎁스 상태 ---
  const [mapPath, setMapPath] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: '세계 지도' }
  ]);
  const currentMapId = mapPath[mapPath.length - 1].id;

  // --- 캔버스 줌 & 패닝 상태 ---
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [editMode, setEditMode] = useState<'select' | 'pan' | 'draw_polygon' | 'add_pin' | 'draw_route' | 'measure' | 'draw_border_rect' | 'draw_border_circle'>('select');

  // --- 테두리 드래그 임시 상태 ---
  const [borderDragStart, setBorderDragStart] = useState<{ x: number; y: number } | null>(null);
  const [borderDragCurrent, setBorderDragCurrent] = useState<{ x: number; y: number } | null>(null);
  
  // --- 지도 요소 데이터 ---
  const [elements, setElements] = useState<MapElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);

  // 마키/선택 상자 드래그 상태
  const [selectionBoxStart, setSelectionBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBoxCurrent, setSelectionBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  // 요소 드래그 이동 상태
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [elementDragStartCoords, setElementDragStartCoords] = useState<{ x: number; y: number } | null>(null);
  const [dragInitialElementsCoords, setDragInitialElementsCoords] = useState<Record<string, { x: number; y: number; points?: Array<{ x: number; y: number }> }>>({});
  const [preDragElements, setPreDragElements] = useState<MapElement[] | null>(null);
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);
  
  // --- 타임라인 스냅샷 상태 ---
  const [snapshots, setSnapshots] = useState<MapSnapshot[]>([
    { id: 'snap-default', order: 0, name: '1권 시작 기준', date: '작중 932년 4월', description: '평화로운 아이론 왕국 영토와 가문 세력권.' }
  ]);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string>('snap-default');
  const activeSnapshotIdx = snapshots.findIndex(s => s.id === activeSnapshotId) === -1 ? 0 : snapshots.findIndex(s => s.id === activeSnapshotId);
  const currentSnapshot = snapshots[activeSnapshotIdx] || snapshots[0];

  const [isSnapshotEditUnlocked, setIsSnapshotEditUnlocked] = useState(false);
  const isLatestSnapshot = snapshots.length > 0 && activeSnapshotId === snapshots[snapshots.length - 1].id;
  const isReadOnly = activeSnapshotId !== 'snap-default' && !isLatestSnapshot && !isSnapshotEditUnlocked;

  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);

  // --- 안개 모드 및 레이어 락 제어 ---
  const [fogVisible, setFogVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);
  const [pointSnapEnabled, setPointSnapEnabled] = useState(true);
  const [lockLayers, setLockLayers] = useState({
    background: true,
    regions: false,
    pins: false
  });
  
  // 레이어별 가시성 토글
  const [layerVisibility, setLayerVisibility] = useState({
    terrain: true,   // 자연물
    political: true, // 국경/세력
    routes: true,    // 경로
    characters: true // 캐릭터 마커
  });

  // --- 임시 그리기 리액트 상태 ---
  const [tempPoints, setTempPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeAnchorPointIdx, setActiveAnchorPointIdx] = useState<number | null>(null);

  // --- 이미지 업로드 배경 및 프리셋 ---
  const [customBgImage, setCustomBgImage] = useState<string | null>(null);
  const [presetBg, setPresetBg] = useState<'vintage' | 'cosmic' | 'grid'>('vintage');

  // --- 스케일바 및 거리 측정 상태 ---
  const [scale, setScale] = useState<MapScale>({ pixels: 100, value: 50, unit: 'km' });
  const [measurePoints, setMeasurePoints] = useState<Array<{ x: number; y: number }>>([]);

  // --- 상세 정보창 모드 및 상태 ---
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [elementEditName, setElementEditName] = useState('');
  const [elementEditCategory, setElementEditCategory] = useState('kingdom');
  const [elementEditSummary, setElementEditSummary] = useState('');
  const [elementEditDesc, setElementEditDesc] = useState('');
  const [elementEditColor, setElementEditColor] = useState('#5E6AD2');
  const [elementEditOpacity, setElementEditOpacity] = useState(30);
  const [elementEditTexture, setElementEditTexture] = useState<'none' | 'slash' | 'dots' | 'sand'>('none');
  const [elementEditIcon, setElementEditIcon] = useState<'castle' | 'swords' | 'mountain' | 'mappin'>('mappin');
  const [elementEditBorderStyle, setElementEditBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [elementEditBorderWidth, setElementEditBorderWidth] = useState<number>(3);
  const [elementEditTags, setElementEditTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [elementEditChars, setElementEditChars] = useState<string[]>([]);
  const [elementEditEpisodes, setElementEditEpisodes] = useState<string[]>([]);
  const [elementEditChildMap, setElementEditChildMap] = useState('');

  // --- 신규 스냅샷 생성 폼 상태 ---
  const [showNewSnapshotModal, setShowNewSnapshotModal] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [newSnapshotDate, setNewSnapshotDate] = useState('');
  const [newSnapshotDesc, setNewSnapshotDesc] = useState('');

  // --- 신규 세부 지도 레이아웃 추가 모달 상태 ---
  const [showNewLayoutModal, setShowNewLayoutModal] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutParentMapId, setNewLayoutParentMapId] = useState<string | null>(null);
  const [layoutSearchQuery, setLayoutSearchQuery] = useState('');

  // --- 사이드바 접기/펼치기 ---
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // --- 헤더 탭 선택 상태 (null이면 서브패널 닫힘) ---
  const [activeHeaderTab, setActiveHeaderTab] = useState<'draw' | 'settings' | 'timeline' | 'measure' | null>('draw');
  // --- 지도 계층 트리 폴더 접기/펼치기 상태 ---
  const [mapExpandedFolderIds, setMapExpandedFolderIds] = useState<string[]>(['root']);

  // --- 캐릭터 마커 연동 상태 ---
  // 캐릭터 마커는 (Snapshot ID -> CharacterPositionMap) 형태로 관리
  const [characterPositions, setCharacterPositions] = useState<Record<string, Record<string, { x: number; y: number; trail: Array<{ x: number; y: number }> }>>>({});
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  // --- Undo / Redo History States ---
  const [undoStack, setUndoStack] = useState<Array<{
    elements: MapElement[];
    characterPositions: typeof characterPositions;
  }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{
    elements: MapElement[];
    characterPositions: typeof characterPositions;
  }>>([]);

  // 히스토리에 현재 상태 적재
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pushHistory = useCallback((customElements?: MapElement[], customCharPos?: typeof characterPositions) => {
    setUndoStack(prev => {
      const entry = {
        elements: JSON.parse(JSON.stringify(customElements || elements)),
        characterPositions: JSON.parse(JSON.stringify(customCharPos || characterPositions))
      };
      const next = [...prev, entry];
      if (next.length > 50) next.shift(); // 최대 50개 제한
      return next;
    });
    setRedoStack([]);
  }, [elements, characterPositions]);

  // 실행 취소 (Undo)
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const currentEntry = {
      elements: JSON.parse(JSON.stringify(elements)),
      characterPositions: JSON.parse(JSON.stringify(characterPositions))
    };
    setRedoStack(prev => [...prev, currentEntry]);

    const prevEntry = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));

    setElements(prevEntry.elements);
    setCharacterPositions(prevEntry.characterPositions);
  }, [undoStack, elements, characterPositions]);

  // 다시 실행 (Redo)
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const currentEntry = {
      elements: JSON.parse(JSON.stringify(elements)),
      characterPositions: JSON.parse(JSON.stringify(characterPositions))
    };
    setUndoStack(prev => [...prev, currentEntry]);

    const nextEntry = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));

    setElements(nextEntry.elements);
    setCharacterPositions(nextEntry.characterPositions);
  }, [redoStack, elements, characterPositions]);

  // --- 복수 선택 / 그룹화 유틸리티 함수들 ---
  const selectSingleElement = useCallback((id: string | null) => {
    setSelectedElementId(id);
    setSelectedElementIds(id ? [id] : []);
  }, []);

  const toggleElementSelection = useCallback((id: string) => {
    setSelectedElementIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setSelectedElementId(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  }, []);

  const getTopLevelGroupOrElement = useCallback((id: string): string => {
    let currentId = id;
    while (true) {
      const el = elements.find(item => item.id === currentId);
      if (!el) break;
      const parent = elements.find(p => p.id === el.parentMapId && p.type === 'group');
      if (parent) {
        currentId = parent.id;
      } else {
        break;
      }
    }
    return currentId;
  }, [elements]);

  const collectAllMemberElements = useCallback((ids: string[]): MapElement[] => {
    const list: MapElement[] = [];
    const visited = new Set<string>();
    
    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const el = elements.find(item => item.id === id);
      if (!el) return;
      
      list.push(el);
      if (el.type === 'group') {
        const children = elements.filter(child => child.parentMapId === el.id);
        children.forEach(child => visit(child.id));
      }
    };
    
    ids.forEach(visit);
    return list;
  }, [elements]);

  const isElementSelected = useCallback((id: string): boolean => {
    if (selectedElementIds.includes(id)) return true;
    
    let currentId = id;
    while (true) {
      const el = elements.find(item => item.id === currentId);
      if (!el) break;
      if (selectedElementIds.includes(el.parentMapId)) return true;
      currentId = el.parentMapId;
    }
    return false;
  }, [selectedElementIds, elements]);

  const getAllActiveElementsForMap = useCallback((mapId: string): MapElement[] => {
    const directElements = elements.filter(el => el.parentMapId === mapId);
    const all: MapElement[] = [];
    
    const collect = (el: MapElement) => {
      all.push(el);
      if (el.type === 'group') {
        const children = elements.filter(child => child.parentMapId === el.id);
        children.forEach(collect);
      }
    };
    
    directElements.forEach(collect);
    return all;
  }, [elements]);

  const getElementsInSelectionBox = useCallback((
    start: { x: number; y: number },
    current: { x: number; y: number }
  ): string[] => {
    const x1 = Math.min(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const x2 = Math.max(start.x, current.x);
    const y2 = Math.max(start.y, current.y);

    const activeEls = getAllActiveElementsForMap(currentMapId);
    const selected: string[] = [];

    activeEls.forEach(el => {
      if (el.type === 'pin') {
        const x = el.x || 0;
        const y = el.y || 0;
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          selected.push(el.id);
        }
      } else if (el.type === 'border_rect' || el.type === 'border_circle') {
        const x = el.bx || 0;
        const y = el.by || 0;
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
          selected.push(el.id);
        }
      } else if (el.points && el.points.length > 0) {
        const anyPointInBox = el.points.some(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2);
        if (anyPointInBox) {
          selected.push(el.id);
        }
      }
    });

    return selected;
  }, [currentMapId, getAllActiveElementsForMap]);

  const handleGroupElements = useCallback(() => {
    if (selectedElementIds.length < 2) return;

    pushHistory();

    const groupId = `group-${Date.now()}`;
    const groupName = `그룹 ${elements.filter(el => el.type === 'group').length + 1}`;

    const newGroup: MapElement = {
      id: groupId,
      name: groupName,
      type: 'group',
      parentMapId: currentMapId,
      tags: []
    };

    setElements(prev => {
      const updated = prev.map(el => {
        if (selectedElementIds.includes(el.id)) {
          return {
            ...el,
            parentMapId: groupId
          };
        }
        return el;
      });
      return [...updated, newGroup];
    });

    setMapExpandedFolderIds(prev => [...prev, groupId]);
    selectSingleElement(groupId);
  }, [selectedElementIds, elements, currentMapId, pushHistory, selectSingleElement]);

  const getCursorClass = useCallback((): string => {
    if (isPanning) return 'cursor-grabbing';
    
    switch (editMode) {
      case 'select':
        return 'cursor-default';
      case 'pan':
        return 'cursor-grab';
      case 'draw_polygon':
      case 'draw_route':
      case 'draw_border_rect':
      case 'draw_border_circle':
        return 'cursor-crosshair';
      case 'add_pin':
        return 'cursor-cell';
      case 'measure':
        return 'cursor-help';
      default:
        return 'cursor-default';
    }
  }, [editMode, isPanning]);

  // Ctrl+Z / Ctrl+Y / Ctrl+G 단축키 연동
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleGroupElements();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleUndo, handleRedo, handleGroupElements]);

  // References
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 마우스 휠(휠클릭) 브라우저 기본 기능(자동 스크롤 등) 방지
  useEffect(() => {
    const canvas = canvasContainerRef.current;
    if (!canvas) return;

    const handleNativeMouseDown = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault(); // 마우스 휠 클릭시 자동 스크롤 모드 진입 차단
      }
    };

    canvas.addEventListener('mousedown', handleNativeMouseDown, { passive: false });
    return () => {
      canvas.removeEventListener('mousedown', handleNativeMouseDown);
    };
  }, []);

  // --- LocalStorage key helpers ---
  const getStorageKeys = useCallback(() => ({
    elementKey: `novelflow_worldmap_elements_${selectedProject.id}`,
    snapshotKey: `novelflow_worldmap_snapshots_${selectedProject.id}`,
    configKey: `novelflow_worldmap_config_${selectedProject.id}`,
    charPosKey: `novelflow_worldmap_char_pos_${selectedProject.id}`,
  }), [selectedProject.id]);

  const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');

  // --- 초기 로드: Supabase 우선, 없으면 localStorage, 없으면 기본값 ---
  useEffect(() => {
    if (!selectedProject) return;

    const { elementKey, snapshotKey, configKey, charPosKey } = getStorageKeys();

    const applyData = (data: {
      elements?: MapElement[];
      snapshots?: MapSnapshot[];
      config?: { customBgImage: string | null; presetBg: string; scale: MapScale };
      characterPositions?: Record<string, Record<string, { x: number; y: number; trail: Array<{ x: number; y: number }> }>>;
    }) => {
      if (data.elements && data.elements.length > 0) {
        setElements(data.elements);
      } else {
        setElements([
          { id: 'r1', name: '아이론 왕국', type: 'polygon', parentMapId: 'root', color: '#5E6AD2', opacity: 0.25, texture: 'slash', category: 'kingdom', summary: '대륙 중부에 자리 잡은 유서 깊은 왕국.', description: '아이론 가문이 지배하는 넓고 비옥한 영토.', points: [{ x: 100, y: 150 }, { x: 300, y: 120 }, { x: 350, y: 350 }, { x: 80, y: 300 }], statesBySnapshot: {} },
          { id: 'r2', name: '남방 제국', type: 'polygon', parentMapId: 'root', color: '#E2487A', opacity: 0.35, texture: 'sand', category: 'empire', summary: '철기 무기와 마법으로 팽창 중인 호전국.', description: '철의 장막 뒤에 숨은 기계 문명 중심 국가.', points: [{ x: 380, y: 100 }, { x: 650, y: 150 }, { x: 600, y: 400 }, { x: 360, y: 380 }], statesBySnapshot: { 'snap-war': { visible: true, color: '#E2487A', description: '제국의 기습 침공으로 국경선이 서쪽으로 밀려났습니다.' } } },
          { id: 'p1', name: '수도 아이론시', type: 'pin', parentMapId: 'root', x: 220, y: 200, icon: 'castle', category: 'city', summary: '왕국의 정치, 경제 중심수도.', description: '고대 마법 장벽으로 둘러싸여 난공불락을 자랑한다.', tags: ['수도', '안전지대'], associatedCharacters: ['1'] },
          { id: 'p2', name: '동부 국경 요새', type: 'pin', parentMapId: 'root', x: 330, y: 220, icon: 'swords', category: 'fortress', summary: '제국의 침략을 감시하는 핵심 군사 기지.', description: '견고한 성벽을 가졌으나 흑마법의 기습에는 취약하다.', tags: ['요새', '분쟁지역'], statesBySnapshot: { 'snap-fall': { visible: false } } }
        ]);
      }

      if (data.snapshots && data.snapshots.length > 0) {
        setSnapshots(data.snapshots);
        setActiveSnapshotId(data.snapshots[0].id);
      } else {
        setSnapshots([
          { id: 'snap-default', order: 0, name: '1권 시작 기준', date: '작중 932년 4월', description: '평화로운 아이론 왕국 영토와 가문 세력권.' },
          { id: 'snap-war', order: 1, name: '동부 요새 함락 사건', date: '작중 932년 10월', description: '제국의 흑마법 기습 침공으로 동부 요새가 함락되고 소실됨.' },
          { id: 'snap-fall', order: 2, name: '제국 연합군 병합 완료', date: '작중 933년 6월', description: '아이론 북동부 요충지가 완전히 함락되어 제국 영토로 편입됨.' }
        ]);
      }

      if (data.config) {
        setCustomBgImage(data.config.customBgImage || null);
        setPresetBg((data.config.presetBg as 'vintage' | 'cosmic' | 'grid') || 'vintage');
        setScale(data.config.scale || { pixels: 100, value: 50, unit: 'km' });
      }

      if (data.characterPositions && Object.keys(data.characterPositions).length > 0) {
        setCharacterPositions(data.characterPositions);
      } else {
        setCharacterPositions({
          'snap-default': {
            '1': { x: 220, y: 200, trail: [{ x: 100, y: 150 }, { x: 220, y: 200 }] },
            '2': { x: 330, y: 220, trail: [{ x: 330, y: 220 }] }
          },
          'snap-war': {
            '1': { x: 330, y: 220, trail: [{ x: 100, y: 150 }, { x: 220, y: 200 }, { x: 330, y: 220 }] },
            '2': { x: 420, y: 150, trail: [{ x: 330, y: 220 }, { x: 420, y: 150 }] }
          },
          'snap-fall': {
            '1': { x: 150, y: 280, trail: [{ x: 100, y: 150 }, { x: 220, y: 200 }, { x: 330, y: 220 }, { x: 150, y: 280 }] },
            '2': { x: 500, y: 180, trail: [{ x: 330, y: 220 }, { x: 420, y: 150 }, { x: 500, y: 180 }] }
          }
        });
      }
    };

    const loadFromLocalStorage = () => {
      const savedElements = localStorage.getItem(elementKey);
      const savedSnapshots = localStorage.getItem(snapshotKey);
      const savedConfig = localStorage.getItem(configKey);
      const savedCharPos = localStorage.getItem(charPosKey);
      applyData({
        elements: savedElements ? JSON.parse(savedElements) : undefined,
        snapshots: savedSnapshots ? JSON.parse(savedSnapshots) : undefined,
        config: savedConfig ? JSON.parse(savedConfig) : undefined,
        characterPositions: savedCharPos ? JSON.parse(savedCharPos) : undefined,
      });
    };

    if (isGuest) {
      loadFromLocalStorage();
      return;
    }

    // Supabase에서 worldmap_data 로드
    (async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('worldmap_data')
          .eq('id', selectedProject.id)
          .single();

        if (error) throw error;

        if (data?.worldmap_data) {
          const wm = data.worldmap_data as {
            elements?: MapElement[];
            snapshots?: MapSnapshot[];
            config?: { customBgImage: string | null; presetBg: string; scale: MapScale };
            characterPositions?: Record<string, Record<string, { x: number; y: number; trail: Array<{ x: number; y: number }> }>>;
          };
          applyData(wm);
          // localStorage에도 캐시
          if (wm.elements) localStorage.setItem(elementKey, JSON.stringify(wm.elements));
          if (wm.snapshots) localStorage.setItem(snapshotKey, JSON.stringify(wm.snapshots));
          if (wm.config) localStorage.setItem(configKey, JSON.stringify(wm.config));
          if (wm.characterPositions) localStorage.setItem(charPosKey, JSON.stringify(wm.characterPositions));
        } else {
          // DB에 없으면 localStorage 캐시에서 복구 시도
          loadFromLocalStorage();
        }
      } catch (err) {
        console.error('WorldMap: Supabase 로드 실패, localStorage fallback 사용:', err);
        loadFromLocalStorage();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject.id]);

  // --- Supabase + localStorage 자동 저장 (debounce 2초) ---
  const saveWorldMapData = useCallback(() => {
    if (!selectedProject) return;
    const { elementKey, snapshotKey, configKey, charPosKey } = getStorageKeys();

    // localStorage 즉시 갱신 (캐시)
    localStorage.setItem(elementKey, JSON.stringify(elements));
    localStorage.setItem(snapshotKey, JSON.stringify(snapshots));
    localStorage.setItem(configKey, JSON.stringify({ customBgImage, presetBg, scale }));
    localStorage.setItem(charPosKey, JSON.stringify(characterPositions));

    if (isGuest) return;

    // Supabase debounce 저장 (2초 후)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('projects')
          .update({
            worldmap_data: {
              elements,
              snapshots,
              config: { customBgImage, presetBg, scale },
              characterPositions,
            }
          })
          .eq('id', selectedProject.id);
        if (error) throw error;
      } catch (err) {
        console.error('WorldMap: Supabase 저장 실패:', err);
      }
    }, 2000);
  }, [elements, snapshots, customBgImage, presetBg, scale, characterPositions, selectedProject, getStorageKeys, isGuest]);

  // 데이터 변경 시 자동 저장 트리거
  useEffect(() => {
    saveWorldMapData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, snapshots, customBgImage, presetBg, scale, characterPositions]);

  // 빈 그룹 자동 삭제 감지
  useEffect(() => {
    const emptyGroups = elements.filter(el => el.type === 'group' && !elements.some(item => item.parentMapId === el.id));
    if (emptyGroups.length > 0) {
      const emptyGroupIds = emptyGroups.map(g => g.id);
      setElements(prev => prev.filter(el => !emptyGroupIds.includes(el.id)));
      if (selectedElementId && emptyGroupIds.includes(selectedElementId)) {
        setSelectedElementId(null);
      }
      setSelectedElementIds(prev => prev.filter(id => !emptyGroupIds.includes(id)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, selectedElementId]);

  // 스냅샷 변경 시 편집 잠금 상태 초기화
  useEffect(() => {
    setIsSnapshotEditUnlocked(false);
  }, [activeSnapshotId]);


  // --- 마우스 좌표를 캔버스 공간상 좌표로 변환 ---
  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 };
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };
  // --- 스냅(Snapping) 연산 함수 ---
  const applySnapping = (coords: { x: number; y: number }): { x: number; y: number } => {
    let result = { ...coords };
    
    // 1. 포인트 스냅 (기존 요소들의 꼭짓점 및 핀 좌표와 가깝다면 자동 자석 효과)
    if (pointSnapEnabled) {
      const snapThreshold = 12 / zoom; // 화면상 일정한 자석 임계 거리
      for (const el of elements) {
        if (el.parentMapId !== currentMapId) continue;
        
        // 핀형 요소 체크
        if (el.type === 'pin' && el.x !== undefined && el.y !== undefined) {
          const dist = Math.hypot(coords.x - el.x, coords.y - el.y);
          if (dist < snapThreshold) {
            return { x: el.x, y: el.y };
          }
        }
        
        // 다각형 꼭짓점 체크
        if (el.points) {
          for (const pt of el.points) {
            const dist = Math.hypot(coords.x - pt.x, coords.y - pt.y);
            if (dist < snapThreshold) {
              return { x: pt.x, y: pt.y };
            }
          }
        }
      }
    }
    
    // 2. 격자 스냅
    if (gridSnapEnabled) {
      const gridSize = 40;
      result.x = Math.round(result.x / gridSize) * gridSize;
      result.y = Math.round(result.y / gridSize) * gridSize;
    }
    
    return result;
  };

  // --- 마우스 휠 줌 핸들러 ---
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let nextZoom = zoom;
    if (e.deltaY < 0) {
      nextZoom = Math.min(4, zoom * zoomFactor);
    } else {
      nextZoom = Math.max(0.4, zoom / zoomFactor);
    }
    
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const dx = mouseX - pan.x;
    const dy = mouseY - pan.y;
    
    setPan({
      x: mouseX - dx * (nextZoom / zoom),
      y: mouseY - dy * (nextZoom / zoom)
    });
    setZoom(nextZoom);
  };

  // --- 지도 요소 마우스 다운 (이동 드래그 시작) ---
  const handleElementMouseDown = (e: React.MouseEvent, el: MapElement) => {
    e.stopPropagation();
    
    if (editMode !== 'select') return;

    if (isReadOnly) {
      showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
      return;
    }

    // 상위 그룹이 있으면 그룹 전체를 선택/이동 대상으로 선정
    const targetId = getTopLevelGroupOrElement(el.id);

    // Ctrl / Shift 키 복수 선택 처리
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      toggleElementSelection(targetId);
      return;
    }

    // 이미 선택된 복수 그룹에 포함되지 않은 경우 단일 선택으로 갱신
    if (!isElementSelected(targetId)) {
      selectSingleElement(targetId);
    }
    
    // 요소 드래그 시작
    setIsDraggingElements(true);
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    setElementDragStartCoords(canvasCoords);
    setPreDragElements(JSON.parse(JSON.stringify(elements)));
    setHasMovedDuringDrag(false);
    
    // 현재 선택된 모든 요소 및 해당 요소의 모든 하위 그룹 멤버 수집
    const members = collectAllMemberElements(
      selectedElementIds.includes(targetId) 
        ? selectedElementIds 
        : [...selectedElementIds, targetId]
    );

    const initialCoords: Record<string, { x: number; y: number; points?: Array<{ x: number; y: number }> }> = {};
    members.forEach(item => {
      if (item.type === 'pin') {
        initialCoords[item.id] = { x: item.x || 0, y: item.y || 0 };
      } else if (item.type === 'border_rect' || item.type === 'border_circle') {
        initialCoords[item.id] = { x: item.bx || 0, y: item.by || 0 };
      } else if (item.points) {
        initialCoords[item.id] = { x: 0, y: 0, points: JSON.parse(JSON.stringify(item.points)) };
      }
    });
    setDragInitialElementsCoords(initialCoords);
  };

  // --- 패닝 마우스 다운 핸들러 ---
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (editMode === 'pan' || e.button === 1 || e.button === 2) {
      // 마우스 우클릭, 휠클릭 혹은 패닝 모드 시 드래그 동작
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const canvasClickCoords = getCanvasCoords(e.clientX, e.clientY);
    const snapped = applySnapping(canvasClickCoords);

    // 선택/편집 모드 빈 공간 클릭 시 드래그 마키 선택 시작
    if (editMode === 'select') {
      const isShiftOrCtrl = e.shiftKey || e.ctrlKey || e.metaKey;
      if (!isShiftOrCtrl) {
        selectSingleElement(null);
      }
      setSelectionBoxStart(canvasClickCoords);
      setSelectionBoxCurrent(canvasClickCoords);
      return;
    }

    // 편집 불가(ReadOnly) 예외 감지 및 잠금해제 알림 모달 출력
    if (isReadOnly && (
      editMode === 'draw_border_rect' || 
      editMode === 'draw_border_circle' || 
      editMode === 'add_pin' || 
      editMode === 'draw_polygon' || 
      editMode === 'draw_route'
    )) {
      showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
      return;
    }

    // 테두리 드래그 시작 (mouseDown)
    if (editMode === 'draw_border_rect' || editMode === 'draw_border_circle') {
      setBorderDragStart(snapped);
      setBorderDragCurrent(snapped);
      return;
    }

    // 거리 측정 모드 클릭
    if (editMode === 'measure') {
      setMeasurePoints(prev => [...prev, snapped]);
      return;
    }

    // 핀 생성 모드 클릭
    if (editMode === 'add_pin') {
      pushHistory();
      const newPinId = `pin-${Date.now()}`;
      const newPin: MapElement = {
        id: newPinId,
        name: '새 거점 핀',
        type: 'pin',
        parentMapId: currentMapId,
        x: snapped.x,
        y: snapped.y,
        icon: 'mappin',
        category: 'landmark',
        summary: '지도상 새로운 마크 지점입니다.',
        description: '자세한 설명을 추가해 설정집을 채우세요.',
        tags: []
      };
      setElements(prev => [...prev, newPin]);
      selectSingleElement(newPinId);
      loadElementToEdit(newPin);
      setIsDetailOpen(true);
      setEditMode('select');
      return;
    }

    // 다각형 그리기 모드 클릭
    if (editMode === 'draw_polygon') {
      if (tempPoints.length > 2) {
        // 첫 꼭짓점 근처(닫힘 임계 반경)를 누르면 자동 닫기 처리
        const firstPt = tempPoints[0];
        const dist = Math.hypot(snapped.x - firstPt.x, snapped.y - firstPt.y);
        if (dist < 15 / zoom) {
          finalizePolygon();
          return;
        }
      }
      setTempPoints(prev => [...prev, snapped]);
      return;
    }

    // 경로선 그리기 모드 클릭
    if (editMode === 'draw_route') {
      setTempPoints(prev => [...prev, snapped]);
      return;
    }
  };

  // --- 마우스 무브 핸들러 (그리기 미리보기 가이드선 렌더링) ---
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const currentCoords = getCanvasCoords(e.clientX, e.clientY);
    const snapped = applySnapping(currentCoords);
    setHoveredPoint(snapped);

    // 요소 전체 드래그 이동
    if (isDraggingElements && elementDragStartCoords) {
      const dx = currentCoords.x - elementDragStartCoords.x;
      const dy = currentCoords.y - elementDragStartCoords.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setHasMovedDuringDrag(true);
      }
      setElements(prev => prev.map(item => {
        const initial = dragInitialElementsCoords[item.id];
        if (!initial) return item;
        
        if (item.type === 'pin') {
          return {
            ...item,
            x: initial.x + dx,
            y: initial.y + dy
          };
        } else if (item.type === 'border_rect' || item.type === 'border_circle') {
          return {
            ...item,
            bx: initial.x + dx,
            by: initial.y + dy
          };
        } else if (item.points && initial.points) {
          return {
            ...item,
            points: initial.points.map(pt => ({
              x: pt.x + dx,
              y: pt.y + dy
            }))
          };
        }
        return item;
      }));
      return;
    }

    // 마키 선택 박스 영역 갱신
    if (selectionBoxStart) {
      setSelectionBoxCurrent(currentCoords);
      return;
    }

    // 테두리 드래그 진행 중 현재 좌표 갱신
    if ((editMode === 'draw_border_rect' || editMode === 'draw_border_circle') && borderDragStart) {
      setBorderDragCurrent(snapped);
      return;
    }

    // 다각형 꼭짓점 드래그 편집 모드
    if (editMode === 'select' && activeAnchorPointIdx !== null && selectedElementId) {
      setElements(prev => prev.map(el => {
        if (el.id === selectedElementId && el.points) {
          const nextPoints = [...el.points];
          nextPoints[activeAnchorPointIdx] = snapped;
          return { ...el, points: nextPoints };
        }
        return el;
      }));
    }
  };

  // --- 마우스 업 핸들러 ---
  const handleCanvasMouseUp = (e?: React.MouseEvent) => {
    // 1. 요소 드래그 완료 처리
    if (isDraggingElements) {
      if (hasMovedDuringDrag && preDragElements) {
        pushHistory(preDragElements);
      }
      setIsDraggingElements(false);
      setElementDragStartCoords(null);
      setDragInitialElementsCoords({});
      setPreDragElements(null);
      setHasMovedDuringDrag(false);
      return;
    }

    // 2. 마키 드래그 복수 선택 완료 처리
    if (selectionBoxStart && selectionBoxCurrent) {
      const selected = getElementsInSelectionBox(selectionBoxStart, selectionBoxCurrent);
      const isShiftOrCtrl = e ? (e.shiftKey || e.ctrlKey || e.metaKey) : false;
      if (isShiftOrCtrl) {
        setSelectedElementIds(prev => {
          const next = [...prev];
          selected.forEach(id => {
            if (!next.includes(id)) next.push(id);
          });
          setSelectedElementId(next.length > 0 ? next[next.length - 1] : null);
          return next;
        });
      } else {
        setSelectedElementIds(selected);
        setSelectedElementId(selected.length > 0 ? selected[selected.length - 1] : null);
      }
      setSelectionBoxStart(null);
      setSelectionBoxCurrent(null);
      return;
    }

    // 3. 테두리 드래그 완료 및 최종 엘리먼트 생성
    if ((editMode === 'draw_border_rect' || editMode === 'draw_border_circle') && borderDragStart && borderDragCurrent) {
      const x1 = Math.min(borderDragStart.x, borderDragCurrent.x);
      const y1 = Math.min(borderDragStart.y, borderDragCurrent.y);
      const x2 = Math.max(borderDragStart.x, borderDragCurrent.x);
      const y2 = Math.max(borderDragStart.y, borderDragCurrent.y);
      const w = x2 - x1;
      const h = y2 - y1;
      
      if (w > 5 && h > 5) {
        pushHistory();
        const isRect = editMode === 'draw_border_rect';
        const newId = `border-${Date.now()}`;
        const newBorder: MapElement = {
          id: newId,
          name: isRect ? '새 사각 테두리' : '새 원형 테두리',
          type: isRect ? 'border_rect' : 'border_circle',
          parentMapId: currentMapId,
          bx: isRect ? x1 : (x1 + x2) / 2,
          by: isRect ? y1 : (y1 + y2) / 2,
          bw: isRect ? w : w / 2,
          bh: isRect ? h : h / 2,
          color: '#5E6AD2',
          opacity: 1.0,
          borderStyle: 'solid',
          borderWidth: 3,
          category: 'border',
          summary: isRect ? '사각형 테두리 구역입니다.' : '원형 테두리 구역입니다.',
          description: '테두리 영역 설명을 추가하세요.',
          tags: []
        };
        setElements(prev => [...prev, newBorder]);
        setSelectedElementId(newId);
        loadElementToEdit(newBorder);
        setIsDetailOpen(true);
      }
      setBorderDragStart(null);
      setBorderDragCurrent(null);
      setEditMode('select');
      return;
    }
    
    setIsPanning(false);
    setActiveAnchorPointIdx(null);
  };

  // --- 다각형 영역 빌드 완성 ---
  const finalizePolygon = () => {
    if (tempPoints.length < 3) {
      setTempPoints([]);
      return;
    }

    pushHistory();
    const newPolygonId = `poly-${Date.now()}`;
    const newPoly: MapElement = {
      id: newPolygonId,
      name: '새 세력권 영역',
      type: 'polygon',
      parentMapId: currentMapId,
      points: tempPoints,
      color: '#2ECC71',
      opacity: 0.3,
      texture: 'none',
      category: 'nature',
      summary: '지정된 다각형 영역입니다.',
      description: '어떤 소속 국가나 영지, 던전 세력권인지 자세한 역사적 설정을 작성해 조율하세요.',
      tags: []
    };
    setElements(prev => [...prev, newPoly]);
    setSelectedElementId(newPolygonId);
    loadElementToEdit(newPoly);
    setIsDetailOpen(true);
    setTempPoints([]);
    setEditMode('select');
  };

  // --- 경로 드로잉 마감 ---
  const finalizeRoute = () => {
    if (tempPoints.length < 2) {
      setTempPoints([]);
      return;
    }
    pushHistory();
    const newRouteId = `route-${Date.now()}`;
    const newRoute: MapElement = {
      id: newRouteId,
      name: '새 국경/교역 경로',
      type: 'route',
      parentMapId: currentMapId,
      points: tempPoints,
      color: '#F1C40F',
      opacity: 0.8,
      category: 'route',
      summary: '이동 경로 혹은 점선 경계선.',
      description: '주요 캐릭터들의 이동 동선이나 험난한 국경 경로선입니다.',
      tags: []
    };
    setElements(prev => [...prev, newRoute]);
    setSelectedElementId(newRouteId);
    loadElementToEdit(newRoute);
    setIsDetailOpen(true);
    setTempPoints([]);
    setEditMode('select');
  };

  // --- 특정 지도 요소로 화면 포커스 이동 ---
  const focusOnElement = (el: MapElement) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    let targetX = 0;
    let targetY = 0;

    if (el.type === 'pin' && el.x !== undefined && el.y !== undefined) {
      targetX = el.x;
      targetY = el.y;
    } else if ((el.type === 'polygon' || el.type === 'route') && el.points && el.points.length > 0) {
      const sum = el.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      targetX = sum.x / el.points.length;
      targetY = sum.y / el.points.length;
    } else if ((el.type === 'border_rect' || el.type === 'border_circle') && el.bx !== undefined && el.by !== undefined) {
      if (el.type === 'border_rect') {
        targetX = el.bx + (el.bw ?? 0) / 2;
        targetY = el.by + (el.bh ?? 0) / 2;
      } else {
        targetX = el.bx;
        targetY = el.by;
      }
    } else {
      return;
    }

    setPan({
      x: centerX - targetX * zoom,
      y: centerY - targetY * zoom
    });
  };



  // --- 전체 지도 레이아웃 계층 트리 뷰 빌드 ---
  interface FlatTreeNode {
    id: string;
    name: string;
    type: 'root' | 'pin' | 'polygon' | 'route' | 'border_rect' | 'border_circle' | 'group';
    depth: number;
    childMapId?: string;
    parentMapId?: string;
    element?: MapElement;
    path: Array<{ id: string; name: string }>;
  }

  const buildFlatTree = (): FlatTreeNode[] => {
    const list: FlatTreeNode[] = [];
    
    const traverse = (mapId: string, currentPath: Array<{ id: string; name: string }>, depth: number) => {
      // 모든 요소를 순회하도록 원래대로 복원
      const mapElements = elements.filter(el => el.parentMapId === mapId);
      
      for (const el of mapElements) {
        list.push({
          id: el.id,
          name: el.name,
          type: el.type,
          depth,
          childMapId: el.childMapId,
          parentMapId: el.parentMapId,
          element: el,
          path: currentPath
        });
        
        // 하위 지도가 연결된 폴더이거나 그룹 요소이며, 펼쳐져 있을 때 재귀 순회
        if ((el.childMapId && el.childMapId !== '' && mapExpandedFolderIds.includes(el.id)) || (el.type === 'group' && mapExpandedFolderIds.includes(el.id))) {
          const nextMapId = (el.childMapId && el.childMapId !== '') ? el.childMapId : el.id;
          const nextPath = (el.childMapId && el.childMapId !== '') ? [...currentPath, { id: el.childMapId, name: el.name }] : currentPath;
          traverse(nextMapId, nextPath, depth + 1);
        }
      }
    };
    
    const rootPath = [{ id: 'root', name: '세계 지도' }];
    list.push({
      id: 'root',
      name: '세계 지도',
      type: 'root',
      depth: 0,
      childMapId: 'root',
      path: rootPath
    });
    
    if (mapExpandedFolderIds.includes('root')) {
      traverse('root', rootPath, 1);
    }

    // parentMapId가 'layout-root'인 신규 최상위 독립 레이아웃들 추가
    const extraRootElements = elements.filter(el => el.parentMapId === 'layout-root');
    for (const el of extraRootElements) {
      const extraPath = [{ id: el.childMapId || '', name: el.name }];
      list.push({
        id: el.id,
        name: el.name,
        type: el.type,
        depth: 0,
        childMapId: el.childMapId,
        parentMapId: el.parentMapId,
        element: el,
        path: extraPath
      });

      if (el.childMapId && el.childMapId !== '' && mapExpandedFolderIds.includes(el.id)) {
        traverse(el.childMapId, extraPath, 1);
      }
    }

    return list;
  };

  // --- 트리 노드 클릭 시 해당 지도/요소로 이동 ---
  const handleTreeNodeClick = (node: FlatTreeNode) => {
    if (node.id === 'root') {
      setMapPath([{ id: 'root', name: '세계 지도' }]);
      selectSingleElement(null);
      setIsDetailOpen(false);
      return;
    }

    if (node.childMapId && node.childMapId !== '') {
      setMapPath([...node.path, { id: node.childMapId, name: node.name }]);
      selectSingleElement(null);
      setIsDetailOpen(false);
    } else {
      setMapPath(node.path);
      selectSingleElement(node.id);
      if (node.element) {
        loadElementToEdit(node.element);
        setIsDetailOpen(true);
        setTimeout(() => {
          if (node.element) focusOnElement(node.element);
        }, 50);
      }
    }
  };

  // --- 신규 세부 지도 레이아웃 생성 ---
  const handleCreateLayout = () => {
    if (!newLayoutName.trim() || !newLayoutParentMapId) return;
    pushHistory();

    const parentId = newLayoutParentMapId;
    const isLayoutRoot = parentId === 'layout-root';
    const isRoot = parentId === 'root';
    const nextChildId = `map-child-${Date.now()}`;

    // 새로운 자식 지도를 갖는 부모 요소를 임시 핀 형태로 캔버스 중앙 부근(500, 500)에 생성
    const newElementId = `layout-pin-${Date.now()}`;
    const newLayoutElement: MapElement = {
      id: newElementId,
      name: newLayoutName,
      type: 'pin',
      parentMapId: parentId,
      x: 500,
      y: 500,
      icon: 'mappin',
      category: 'city',
      summary: `${newLayoutName} 세부 지도 진입점 구역입니다.`,
      description: '세부 설정 내용을 기입하고 지도를 꾸며보세요.',
      tags: [],
      childMapId: nextChildId
    };

    setElements(prev => [...prev, newLayoutElement]);
    
    // 트리 계층 펼침 상태에 부모 노드 추가
    setMapExpandedFolderIds(prev => prev.includes(parentId) ? prev : [...prev, parentId]);
    
    // 생성된 세부 지도 레이아웃으로 즉시 이동
    setMapPath(prev => {
      if (isLayoutRoot) {
        return [{ id: nextChildId, name: newLayoutName }];
      } else if (isRoot) {
        return [{ id: 'root', name: '세계 지도' }, { id: nextChildId, name: newLayoutName }];
      } else {
        const parentIdx = prev.findIndex(item => item.id === parentId);
        if (parentIdx !== -1) {
          return [...prev.slice(0, parentIdx + 1), { id: nextChildId, name: newLayoutName }];
        }
        return [...prev, { id: nextChildId, name: newLayoutName }];
      }
    });

    setSelectedElementId(newElementId);
    loadElementToEdit(newLayoutElement);
    setIsDetailOpen(true);

    // 모달 상태 초기화 및 닫기
    setShowNewLayoutModal(false);
    setNewLayoutName('');
    setNewLayoutParentMapId(null);
  };

  // --- 요소 선택 시 상세 폼 필드 로딩 ---
  const loadElementToEdit = (el: MapElement) => {
    // 현재 스냅샷별 오버라이드가 있으면 적용
    const state = el.statesBySnapshot?.[activeSnapshotId];
    
    setElementEditName(state?.name || el.name);
    setElementEditCategory(el.category || 'kingdom');
    setElementEditSummary(el.summary || '');
    setElementEditDesc(state?.description || el.description || '');
    setElementEditColor(state?.color || el.color || '#5E6AD2');
    setElementEditOpacity(el.opacity !== undefined ? Math.round(el.opacity * 100) : 100);
    setElementEditTexture(el.texture || 'none');
    setElementEditIcon(el.icon || 'mappin');
    setElementEditBorderStyle(el.borderStyle || 'solid');
    setElementEditBorderWidth(el.borderWidth || 3);
    setElementEditTags(el.tags || []);
    setElementEditChars(el.associatedCharacters || []);
    setElementEditEpisodes(el.associatedEpisodes || []);
    setElementEditChildMap(el.childMapId || '');
  };

  // --- 상세 폼 정보 실시간 요소에 적용 ---
  const handleSaveProperties = () => {
    if (!selectedElementId) return;

    pushHistory();
    setElements(prev => prev.map(el => {
      if (el.id === selectedElementId) {
        // 스냅샷 방식 키프레임 상태 제어 분기
        const baseUpdate = {
          ...el,
          category: elementEditCategory,
          summary: elementEditSummary,
          opacity: elementEditOpacity / 100,
          texture: elementEditTexture,
          icon: elementEditIcon,
          borderStyle: elementEditBorderStyle,
          borderWidth: elementEditBorderWidth,
          tags: elementEditTags,
          associatedCharacters: elementEditChars,
          associatedEpisodes: elementEditEpisodes,
          childMapId: elementEditChildMap
        };

        // 활성 스냅샷 상태 오버라이드 생성 및 보간
        const states = { ...(el.statesBySnapshot || {}) };
        states[activeSnapshotId] = {
          visible: true,
          color: elementEditColor,
          description: elementEditDesc
        };

        // 기본 정보도 실시간 갱신
        return {
          ...baseUpdate,
          name: elementEditName,
          color: elementEditColor,
          description: elementEditDesc,
          statesBySnapshot: states
        };
      }
      return el;
    }));
    setIsDetailOpen(false);
  };

  // --- 요소 영구 제거 ---
  const handleDeleteElement = async (id: string) => {
    if (isReadOnly) return;
    const elToDelete = elements.find(el => el.id === id);
    if (!elToDelete) return;

    const ok = await showConfirm(
      elToDelete.type === 'group' 
        ? '이 그룹을 해제하시겠습니까? 그룹에 속한 요소들은 상위 레이아웃으로 해제되어 보존됩니다.' 
        : '이 세계관 지도 요소를 완전히 삭제하시겠습니까?'
    );
    if (ok) {
      pushHistory();
      if (elToDelete.type === 'group') {
        setElements(prev => prev
          .filter(el => el.id !== id)
          .map(el => {
            if (el.parentMapId === id) {
              return {
                ...el,
                parentMapId: elToDelete.parentMapId
              };
            }
            return el;
          })
        );
      } else {
        setElements(prev => prev.filter(el => el.id !== id));
      }

      if (selectedElementId === id) {
        selectSingleElement(null);
        setIsDetailOpen(false);
      } else if (selectedElementIds.includes(id)) {
        setSelectedElementIds(prev => prev.filter(x => x !== id));
      }
    }
  };

  // --- 지형 텍스처 패턴 URL 획득 ---
  const getTextureUrl = (tex: string | undefined): string => {
    if (!tex || tex === 'none') return 'transparent';
    return `url(#pattern-mountain-${tex})`;
  };


  // --- 핀/영역 더블클릭 하위 드릴다운 이동 ---
  const handleElementDoubleClick = async (el: MapElement) => {
    if (el.childMapId) {
      setMapPath(prev => [...prev, { id: el.childMapId || '', name: el.name }]);
      setSelectedElementId(null);
      setIsDetailOpen(false);
    } else {
      // 하위 지도가 없을 시 임시 계층 생성 제안
      const newChildId = `map-child-${el.id}`;
      const ok = await showConfirm(`'${el.name}' 하위에 연결된 세부 지도가 없습니다. 새로운 세부 지도 레이어를 연결하고 진입하시겠습니까?`);
      if (ok) {
        pushHistory();
        setElements(prev => prev.map(item => item.id === el.id ? { ...item, childMapId: newChildId } : item));
        setMapPath(prev => [...prev, { id: newChildId, name: el.name }]);
        setSelectedElementId(null);
        setIsDetailOpen(false);
      }
    }
  };


  // --- 신규 스냅샷 추가 ---
  const handleCreateSnapshot = () => {
    if (!newSnapshotName.trim()) return;
    const nextId = `snap-${Date.now()}`;
    const newSnap: MapSnapshot = {
      id: nextId,
      order: snapshots.length,
      name: newSnapshotName,
      date: newSnapshotDate,
      description: newSnapshotDesc
    };
    setSnapshots(prev => [...prev, newSnap]);
    setActiveSnapshotId(nextId);
    setShowNewSnapshotModal(false);
    setNewSnapshotName('');
    setNewSnapshotDate('');
    setNewSnapshotDesc('');
  };

  // --- 버전 관리: 스냅샷 삭제 ---
  const handleDeleteSnapshot = async (id: string, name: string) => {
    if (id === 'snap-default') return;
    const ok = await showConfirm(`'${name}' 시점 이력을 완전히 삭제하시겠습니까?`);
    if (ok) {
      setSnapshots(prev => prev.filter(snap => snap.id !== id));
      if (activeSnapshotId === id) {
        setActiveSnapshotId('snap-default');
      }
      showAlert('스냅샷 버전이 성공적으로 삭제되었습니다.');
    }
  };

  // --- 캐릭터 스냅샷 좌표 드래그 이동 설정 ---
  const handleCharacterMarkerDrag = (charId: string, clientX: number, clientY: number) => {
    const canvasCoords = getCanvasCoords(clientX, clientY);
    const snapped = applySnapping(canvasCoords);

    setCharacterPositions(prev => {
      const nextPositions = { ...prev };
      const currentSnapPos = { ...(nextPositions[activeSnapshotId] || {}) };
      
      // 기존 궤적(trail) 복원 및 신규 좌표 꼬리물기
      const oldTrail = currentSnapPos[charId]?.trail || [];
      const isAlreadyOnPoint = oldTrail.some(pt => pt.x === snapped.x && pt.y === snapped.y);
      const nextTrail = isAlreadyOnPoint ? oldTrail : [...oldTrail, snapped];

      currentSnapPos[charId] = {
        x: snapped.x,
        y: snapped.y,
        trail: nextTrail
      };
      nextPositions[activeSnapshotId] = currentSnapPos;
      return nextPositions;
    });
  };

  // --- 거리 계산 공식 구현 ---
  const calculateDistanceInfo = (): string => {
    if (measurePoints.length < 2) return '';
    let totalPixels = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      totalPixels += Math.hypot(measurePoints[i+1].x - measurePoints[i].x, measurePoints[i+1].y - measurePoints[i].y);
    }
    
    // 스케일 계산 적용
    const actualVal = (totalPixels / scale.pixels) * scale.value;
    const rounded = Math.round(actualVal * 10) / 10;
    
    // 소요 일정 변환 연산
    let timeText = '';
    if (scale.unit === 'km') {
      timeText = `(도보 약 ${Math.round(rounded / 20 * 10) / 10}일, 마차 약 ${Math.round(rounded / 40 * 10) / 10}일 소요)`;
    } else {
      const unitLabel: Record<string, string> = {
        days_walk: '도보',
        days_horse: '승마',
        days_carriage: '마차'
      };
      const label = unitLabel[scale.unit] || '이동';
      timeText = `(${label} 기준 약 ${rounded}일 소요)`;
    }
    
    return `총 거리: ${rounded} ${scale.unit === 'km' ? 'km' : '일분'} ${timeText}`;
  };

  // --- 지도 이미지 내보내기 ---
  const handleExportMap = () => {
    showAlert('고해상도 세계관 지도 PNG 캡처 기능이 작동되었습니다. (임시 동작: 브라우저 기본 화면 캡처 및 지리 데이터 백업 완료)');
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full select-none relative font-sans">
      
      {/* SVG 지형 패턴 정의 */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <pattern id="pattern-mountain-slash" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="10" x2="10" y2="0" stroke="#8B7D6B" strokeWidth="1.5" opacity="0.4" />
          </pattern>
          <pattern id="pattern-mountain-dots" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="6" cy="6" r="2" fill="#2E7D32" opacity="0.3" />
          </pattern>
          <pattern id="pattern-mountain-sand" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill="#E5A93B" opacity="0.4" />
            <circle cx="6" cy="6" r="0.8" fill="#D4AC0D" opacity="0.4" />
          </pattern>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"} strokeWidth="1" />
          </pattern>
        </defs>
      </svg>

      {/* 좌측 레이어 관리 바 (접기/펼치기 포함) */}
      <div className="relative shrink-0 h-full flex">
        <div className={`${sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-72'} shrink-0 border-r flex flex-col justify-between transition-all duration-200 ${
          isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
        }`}>
          <div className="p-4 flex flex-col gap-3 overflow-y-auto flex-1">
            {/* 레이아웃 계층 트리 뷰 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-[#7480E2]" />
                  <span className="text-[11px] font-bold tracking-wide text-gray-400">레이아웃</span>
                </div>
                <button
                  onClick={() => {
                    setNewLayoutParentMapId('layout-root');
                    setShowNewLayoutModal(true);
                  }}
                  className="p-1 rounded text-gray-500 hover:text-[#7480E2] hover:bg-[#5E6AD2]/10 transition-colors shrink-0"
                  title="새 최상위 레이아웃 추가"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 검색창 */}
              <div className="relative mb-2">
                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text"
                  value={layoutSearchQuery}
                  onChange={e => setLayoutSearchQuery(e.target.value)}
                  placeholder="이름 검색..."
                  className={`w-full pl-7 pr-3 py-1.5 rounded-lg text-xs outline-none border transition-all ${
                    isDark 
                      ? 'bg-white/[0.02] border-white/[0.08] text-white placeholder-gray-600 focus:border-[#5E6AD2]' 
                      : 'bg-black/[0.01] border-black/[0.08] text-black placeholder-gray-400 focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              <div className={`flex flex-col gap-0.5 max-h-full overflow-y-auto rounded-xl p-1.5 ${
                isDark ? 'bg-black/20 border border-white/[0.06]' : 'bg-black/[0.02] border border-black/[0.06]'
              }`}>
                {buildFlatTree()
                  .filter(node => !layoutSearchQuery || node.name.toLowerCase().includes(layoutSearchQuery.toLowerCase()))
                  .map(node => {
                  const isFolder = node.type === 'root' || node.type === 'group' || (node.childMapId !== undefined && node.childMapId !== null && node.childMapId !== '');
                  const isExpanded = mapExpandedFolderIds.includes(node.id);
                  const isCurrentMap = (node.id === 'root' && currentMapId === 'root') || (node.childMapId !== undefined && node.childMapId !== null && node.childMapId !== '' && node.childMapId === currentMapId);
                  const isSelectedElement = isElementSelected(node.id);
                  
                  let icon = '📍';
                  if (node.type === 'root') {
                    icon = isExpanded ? '📂' : '📁';
                  } else if (node.childMapId && node.childMapId !== '') {
                    icon = isExpanded ? '📂' : '📁';
                  } else if (node.type === 'group') {
                    icon = isExpanded ? '📂' : '📁';
                  } else if (node.type === 'polygon') {
                    icon = '▰';
                  } else if (node.type === 'route') {
                    icon = '⏂';
                  } else if (node.type === 'border_rect') {
                    icon = '□';
                  } else if (node.type === 'border_circle') {
                    icon = '○';
                  }

                  return (
                    <div
                      key={node.id}
                      onClick={() => handleTreeNodeClick(node)}
                      style={{ paddingLeft: `${node.depth * 12 + 6}px` }}
                      className={`flex items-center justify-between py-1 px-2 rounded text-xs cursor-pointer transition-all duration-150 ${
                        isCurrentMap 
                          ? (isDark ? 'bg-[#5E6AD2]/30 text-white border-l-2 border-[#7480E2]' : 'bg-[#5E6AD2]/15 text-[#5E6AD2] border-l-2 border-[#5E6AD2]')
                          : isSelectedElement
                            ? 'bg-[#5E6AD2]/15 text-[#7480E2] font-semibold'
                            : isDark ? 'hover:bg-white/[0.04] text-gray-300' : 'hover:bg-black/[0.04] text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {isFolder ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMapExpandedFolderIds(prev => 
                                prev.includes(node.id) ? prev.filter(item => item !== node.id) : [...prev, node.id]
                              );
                            }}
                            className="p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
                          >
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        ) : (
                          <div className="w-4.5 h-4.5 shrink-0" />
                        )}
                        
                        <span className="shrink-0 text-[11px] ml-0.5">{icon}</span>
                        <span className={`truncate ${isCurrentMap ? 'font-bold' : ''}`}>
                          {node.name || '이름 없음'}
                        </span>
                      </div>
                      {isFolder && node.type !== 'group' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewLayoutParentMapId(node.id === 'root' ? 'root' : node.childMapId!);
                            setShowNewLayoutModal(true);
                          }}
                          className="p-1 rounded text-gray-600 hover:text-[#7480E2] hover:bg-[#5E6AD2]/10 transition-colors shrink-0"
                          title="새 하위 레이아웃 추가"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                      {node.childMapId && node.childMapId !== '' && (
                        <span className="text-[9px] text-[#7480E2] opacity-60 font-semibold uppercase shrink-0">
                          지도
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        {/* 사이드바 접기/펼치기 토글 버튼 */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute top-1/2 -translate-y-1/2 z-20 w-5 h-10 border rounded-r-md flex items-center justify-center transition-all ${
            sidebarCollapsed ? 'left-0' : 'left-72'
          } ${isDark ? 'bg-[#0E0F12] border-white/[0.08] hover:bg-[#1A1B1F] text-gray-500' : 'bg-white border-black/[0.08] hover:bg-[#F3F4F6] text-gray-400'}`}
          title={sidebarCollapsed ? '사이드바 열기' : '사이드바 닫기'}
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* 중앙 메인 캔버스 뷰 (flex-1) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* ═══ 상단 헤더 ═══ */}
        <div className={`shrink-0 border-b ${isDark ? 'bg-[#0E0F12] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>

          {/* 1행: 탭 버튼 + 우측 고정 액션 */}
          <div className={`px-4 flex items-center justify-between gap-2 border-b h-12 ${isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'}`}>
            {/* 탭 버튼 그룹 */}
            <div className="flex items-center gap-1">
              {([
                { id: 'draw',     Icon: PenTool,   label: '도구'   },
                { id: 'settings', Icon: Settings2,  label: '설정'   },
                { id: 'timeline', Icon: History,    label: '시점'   },
                { id: 'measure',  Icon: Ruler,      label: '측정'   },
              ] as const).map(({ id, Icon, label }) => {
                const isActive = activeHeaderTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveHeaderTab(prev => prev === id ? null : id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#5E6AD2] text-white shadow-md shadow-[#5E6AD2]/25'
                        : isDark
                          ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.05]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 우측 고정: 현재 도구 표시 + Zoom + Undo/Redo + 내보내기 */}
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-semibold hidden md:flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {editMode === 'select' && <><Sparkles className="w-3 h-3 text-[#7480E2]" /> 선택/꼭짓점 수정</>}
                {editMode === 'pan' && <><Move className="w-3 h-3 text-[#7480E2]" /> 패닝 이동</>}
                {editMode === 'draw_polygon' && <><Layers className="w-3 h-3 text-[#7480E2]" /> 영역 그리기</>}
                {editMode === 'add_pin' && <><MapPin className="w-3 h-3 text-[#7480E2]" /> 핀 거점 추가</>}
                {editMode === 'draw_route' && <><ChevronRight className="w-3 h-3 text-[#7480E2]" /> 국경/이동선 그리기</>}
                {editMode === 'measure' && <><Ruler className="w-3 h-3 text-[#7480E2]" /> 거리 측정</>}
                {editMode === 'draw_border_rect' && <><span className="border border-current rounded-sm inline-block w-3 h-3 shrink-0 text-[#7480E2]" /> 사각 테두리</>}
                {editMode === 'draw_border_circle' && <><span className="border border-current rounded-full inline-block w-3 h-3 shrink-0 text-[#7480E2]" /> 원형 테두리</>}
              </span>
              <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'} hidden md:block`} />
              <div className={`flex items-center rounded-xl overflow-hidden text-xs border ${isDark ? 'border-white/[0.08] bg-black/20' : 'border-black/[0.08]'}`}>
                <button onClick={() => setZoom(prev => Math.max(0.4, prev - 0.2))} className={`p-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-500'}`}><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="px-2 font-mono text-[10px] font-bold text-[#7480E2]">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(prev => Math.min(4, prev + 0.2))} className={`p-1.5 transition-colors ${isDark ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-500'}`}><ZoomIn className="w-3.5 h-3.5" /></button>
              </div>
              <button onClick={handleUndo} disabled={undoStack.length === 0} title="실행 취소 (Ctrl+Z)" className={`p-1.5 rounded-lg border transition-colors ${undoStack.length === 0 ? 'opacity-30 cursor-not-allowed border-gray-500/20 text-gray-500' : isDark ? 'border-white/[0.08] hover:bg-white/[0.06] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}><RotateCcw className="w-3.5 h-3.5" /></button>
              <button onClick={handleRedo} disabled={redoStack.length === 0} title="다시 실행 (Ctrl+Y)" className={`p-1.5 rounded-lg border transition-colors ${redoStack.length === 0 ? 'opacity-30 cursor-not-allowed border-gray-500/20 text-gray-500' : isDark ? 'border-white/[0.08] hover:bg-white/[0.06] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}><RotateCw className="w-3.5 h-3.5" /></button>
              <button onClick={handleExportMap} className="p-1.5 px-3 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-[#5E6AD2]/20"><Download className="w-3.5 h-3.5" />내보내기</button>
            </div>
          </div>

          {/* 2행: 탭 내용 패널 (조건부 렌더링) */}
          {activeHeaderTab && (
            <div className={`px-4 py-2.5 flex items-center gap-4 flex-wrap animate-in slide-in-from-top-1 duration-150 ${isDark ? 'bg-white/[0.01]' : 'bg-black/[0.01]'}`}>

              {/* ── 도구 탭 ── */}
              {activeHeaderTab === 'draw' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { mode: 'select',           Icon: Sparkles,   label: '선택/편집' },
                    { mode: 'pan',              Icon: Move,       label: '이동/손바닥' },
                    { mode: 'add_pin',          Icon: MapPin,     label: '핀 거점' },
                    { mode: 'draw_polygon',     Icon: Layers,     label: '세력권(영역)' },
                    { mode: 'draw_route',       Icon: ChevronRight, label: '국경/이동교역선' },
                  ].map(({ mode, Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => { setEditMode(mode as typeof editMode); setTempPoints([]); }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                        editMode === mode
                          ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white shadow-sm'
                          : isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                  <button
                    onClick={() => { setEditMode('draw_border_rect'); setTempPoints([]); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${editMode === 'draw_border_rect' ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white shadow-sm' : isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'}`}
                  >
                    <span className="w-3.5 h-3.5 border-2 border-current rounded-sm inline-block shrink-0" /> 사각 테두리
                  </button>
                  <button
                    onClick={() => { setEditMode('draw_border_circle'); setTempPoints([]); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${editMode === 'draw_border_circle' ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white shadow-sm' : isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'}`}
                  >
                    <span className="w-3.5 h-3.5 border-2 border-current rounded-full inline-block shrink-0" /> 원형 테두리
                  </button>
                  
                  {/* 완료/초기화 (드로잉 중일 때만 노출) */}
                  {tempPoints.length > 0 && (
                    <>
                      <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <button onClick={() => setTempPoints([])} className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500/25 border border-red-500/20 transition-colors">초기화</button>
                      <button onClick={editMode === 'draw_polygon' ? finalizePolygon : finalizeRoute} className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors">완료 ({tempPoints.length}점)</button>
                    </>
                  )}
                </div>
              )}

              {/* ── 설정 탭 ── */}
              {activeHeaderTab === 'settings' && (
                <div className="flex items-center gap-4 flex-wrap text-xs">
                  {/* 스냅 & 편집 보호 */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { Icon: Grid3X3, label: '격자선(Grid) 표시', checked: gridVisible, onChange: setGridVisible },
                      { Icon: Magnet, label: '격자 자석 스냅', checked: gridSnapEnabled, onChange: setGridSnapEnabled },
                      { Icon: Magnet, label: '점간(Node) 자동 스냅', checked: pointSnapEnabled, onChange: setPointSnapEnabled },
                      { Icon: Lock, label: '배경 이미지 잠금', checked: lockLayers.background, onChange: (v: boolean) => setLockLayers(prev => ({ ...prev, background: v })) },
                    ].map(({ Icon, label, checked, onChange }) => (
                      <button
                        key={label}
                        onClick={() => onChange(!checked)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                          checked
                            ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 text-[#7480E2]'
                            : isDark ? 'border-white/[0.08] text-gray-500 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-400 hover:bg-black/[0.04]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />{label}
                      </button>
                    ))}
                  </div>

                  <div className={`w-px h-5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                  {/* 레이어 표시 토글 */}
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>표시 레이어:</span>
                    {[
                      { label: '자연 지형', checked: layerVisibility.terrain, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, terrain: v })) },
                      { label: '정치/국경', checked: layerVisibility.political, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, political: v })) },
                      { label: '이동 교역로', checked: layerVisibility.routes, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, routes: v })) },
                      { label: '인물 위치', checked: layerVisibility.characters, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, characters: v })) },
                      { label: '안개(Fog)', checked: fogVisible, onChange: setFogVisible },
                    ].map(({ label, checked, onChange }) => (
                      <button
                        key={label}
                        onClick={() => onChange(!checked)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                          checked
                            ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 text-[#7480E2]'
                            : isDark ? 'border-white/[0.08] text-gray-500 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-400 hover:bg-black/[0.04]'
                        }`}
                      >
                        {checked ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 시점 탭 ── */}
              {activeHeaderTab === 'timeline' && (
                <div className="flex items-center justify-between gap-4 flex-1 min-w-0 select-none">
                  {/* 좌측: 현재 시점 표시 및 목록 드롭다운 */}
                  <div className="flex items-center gap-2 relative">
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>현재 시점:</span>
                    <div className="relative">
                      <button
                        onClick={() => setShowHistoryDropdown(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                          activeSnapshotId && activeSnapshotId !== 'snap-default'
                            ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#7480E2] font-bold' 
                            : isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                      >
                        <span>{activeSnapshotId && activeSnapshotId !== 'snap-default' ? snapshots.find(s => s.id === activeSnapshotId)?.name : '기본 상태'}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </button>

                      {/* 이력 목록 드롭다운 */}
                      {showHistoryDropdown && (
                        <div className={`absolute top-full left-0 mt-1.5 w-72 rounded-xl border p-2 shadow-2xl z-50 flex flex-col gap-1 max-h-80 overflow-y-auto ${
                          isDark ? 'bg-[#141517] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                        }`}>
                          <button
                            onClick={() => {
                              setActiveSnapshotId('snap-default');
                              setShowHistoryDropdown(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors ${activeSnapshotId === 'snap-default' ? 'text-[#7480E2] font-bold bg-[#5E6AD2]/10' : ''}`}
                          >
                            기본 상태 (편집 가능)
                          </button>
                          <div className={`h-px my-1 ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.06]'}`} />
                          {snapshots.length === 0 || (snapshots.length === 1 && snapshots[0].id === 'snap-default') ? (
                            <div className="text-[10px] text-gray-500 text-center py-3">생성된 시점 이력이 없습니다.</div>
                          ) : (
                            snapshots.map((snap) => {
                              if (snap.id === 'snap-default') return null;
                              return (
                                <div
                                  key={snap.id}
                                  className={`w-full rounded-lg hover:bg-white/[0.04] flex items-center justify-between gap-1 group px-1 ${
                                    activeSnapshotId === snap.id ? 'bg-[#5E6AD2]/10' : ''
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      setActiveSnapshotId(snap.id);
                                      setShowHistoryDropdown(false);
                                    }}
                                    className={`flex-1 text-left px-2 py-1.5 transition-colors flex flex-col min-w-0 ${
                                      activeSnapshotId === snap.id ? 'text-[#7480E2] font-bold' : ''
                                    }`}
                                  >
                                    <span className="truncate w-full">{snap.name}</span>
                                    {snap.description && (
                                      <span className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 whitespace-pre-wrap leading-tight font-normal text-left">
                                        {snap.description.length > 50 ? `${snap.description.slice(0, 50)}...` : snap.description}
                                      </span>
                                    )}
                                    <span className="text-[9px] text-gray-500 font-mono mt-0.5">{snap.date}</span>
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSnapshot(snap.id, snap.name);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                                    title="이력 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* 이력 메모 버튼 */}
                    {activeSnapshotId && (
                      <button
                        onClick={() => setShowMemoModal(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                        }`}
                      >
                        <span>
                          {(() => {
                            if (currentSnapshot && currentSnapshot.description && currentSnapshot.description.trim()) {
                              const m = currentSnapshot.description.trim();
                              return m.length > 10 ? `${m.slice(0, 10)}...` : m;
                            }
                            return '이력 메모';
                          })()}
                        </span>
                      </button>
                    )}

                    {/* 최신 시점 편집 가능 안내 혹은 편집 잠금 해제 토글 버튼 */}
                    {activeSnapshotId && (
                      isLatestSnapshot ? (
                        <span className="px-2 py-1 rounded bg-[#5E6AD2]/10 text-[#7480E2] text-[10px] font-bold">
                          최신 시점 (편집 가능)
                        </span>
                      ) : (
                        <button
                          onClick={() => setIsSnapshotEditUnlocked(prev => !prev)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                            isSnapshotEditUnlocked
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold'
                              : isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-500'
                          }`}
                          title="이력을 보고 있는 상태에서 지도를 수정하려면 편집 잠금을 해제하세요."
                        >
                          {isSnapshotEditUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{isSnapshotEditUnlocked ? '편집 잠금' : '편집 잠금 해제'}</span>
                        </button>
                      )
                    )}
                  </div>

                  {/* 우측: 시점 이동 제어판 및 이력 생성 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {/* 가장 옛날 이력으로 이동 */}
                      <button
                        onClick={() => {
                          if (snapshots.length > 0) {
                            setActiveSnapshotId(snapshots[0].id);
                          }
                        }}
                        disabled={snapshots.length === 0}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04] disabled:opacity-40' : 'border-black/[0.08] hover:bg-black/[0.04] disabled:opacity-40'
                        }`}
                        title="가장 옛날 이력으로 이동"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* 이전 이력으로 이동 */}
                      <button
                        onClick={() => {
                          if (snapshots.length === 0) return;
                          const idx = snapshots.findIndex(s => s.id === activeSnapshotId);
                          if (idx > 0) {
                            setActiveSnapshotId(snapshots[idx - 1].id);
                          } else {
                            setActiveSnapshotId('snap-default');
                          }
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                        title="이전 이력으로 이동"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {/* 다음 이력으로 이동 */}
                      <button
                        onClick={() => {
                          if (snapshots.length === 0) return;
                          const idx = snapshots.findIndex(s => s.id === activeSnapshotId);
                          if (idx >= 0 && idx < snapshots.length - 1) {
                            setActiveSnapshotId(snapshots[idx + 1].id);
                          }
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                        title="다음 이력으로 이동"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {/* 가장 최근 이력으로 이동 */}
                      <button
                        onClick={() => {
                          if (snapshots.length > 0) {
                            setActiveSnapshotId(snapshots[snapshots.length - 1].id);
                          }
                        }}
                        disabled={snapshots.length === 0}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04] disabled:opacity-40' : 'border-black/[0.08] hover:bg-black/[0.04] disabled:opacity-40'
                        }`}
                        title="가장 최근 이력으로 이동"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className={`w-px h-4 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                    {/* 이력 생성 버튼 */}
                    <button
                      onClick={() => setShowNewSnapshotModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>새 시점 추가</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── 측정 탭 ── */}
              {activeHeaderTab === 'measure' && (
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => { setEditMode('measure'); setMeasurePoints([]); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-semibold transition-all duration-150 ${
                      editMode === 'measure'
                        ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white'
                        : isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.04]'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5" /> 거리 측정 모드 활성화
                  </button>
                  {measurePoints.length > 1 && (
                    <span className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {calculateDistanceInfo()}
                    </span>
                  )}
                  {measurePoints.length > 0 && (
                    <button onClick={() => setMeasurePoints([])} className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500/25 border border-red-500/20 transition-colors">측정 초기화</button>
                  )}
                </div>
              )}

            </div>
          )}
        </div>



        {/* 캔버스 드로잉 물리 보드 */}
        <div 
          ref={canvasContainerRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          className={`flex-1 overflow-hidden relative ${getCursorClass()} ${
            presetBg === 'cosmic' ? 'bg-[#050608]' : presetBg === 'grid' ? (isDark ? 'bg-[#18191B]' : 'bg-[#F3F4F6]') : (isDark ? 'bg-[#1A1813]' : 'bg-[#FAF4E8]')
          }`}
        >
          
          {/* SVG 드로잉 및 패닝 컨테이너 */}
          <div 
            className="absolute transform-gpu origin-top-left transition-transform duration-75 pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: '10000px',
              height: '10000px'
            }}
          >
            {/* 1. 배경 격자 Grid 렌더링 */}
            {gridVisible && (
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            )}

            {/* 2. 지도 배경 이미지 */}
            {customBgImage ? (
              <image 
                href={customBgImage} 
                width="2000" 
                height="1500" 
                opacity="0.85" 
                style={{ pointerEvents: 'none' }}
              />
            ) : presetBg === 'vintage' ? (
              <rect 
                width="3000" 
                height="2000" 
                fill={isDark ? "#282319" : "#F4ECD8"} 
                stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} 
                strokeWidth="10"
                opacity="0.9"
              />
            ) : presetBg === 'cosmic' ? (
              <rect 
                width="3000" 
                height="2000" 
                fill="#0A0D14" 
                opacity="0.95"
              />
            ) : null}

            {/* 3. SVG 면적/선 드로잉 */}
            <svg 
              className="absolute inset-0 w-full h-full overflow-visible"
              style={{ pointerEvents: 'auto' }}
            >
              {/* 다각형 면적 레이어 */}
              {layerVisibility.political && elements
                .filter(el => el.type === 'polygon' && el.parentMapId === currentMapId)
                .map(el => {
                  const state = el.statesBySnapshot?.[activeSnapshotId];
                  const isVisible = state ? state.visible : true;
                  if (!isVisible) return null;

                  const color = state?.color || el.color || '#5E6AD2';
                  const opacity = el.opacity || 0.3;
                  const ptsString = el.points?.map(p => `${p.x},${p.y}`).join(' ') || '';
                  const isSelected = isElementSelected(el.id);

                  return (
                    <g key={el.id}>
                      {/* 본체 채우기 */}
                      <polygon 
                        points={ptsString}
                        fill={color}
                        fillOpacity={opacity}
                        stroke={isSelected ? "#E74C3C" : color}
                        strokeWidth={isSelected ? "4.5" : "3.5"}
                        strokeDasharray={el.statesBySnapshot?.[activeSnapshotId] ? "6,4" : undefined}
                        onMouseDown={(e) => handleElementMouseDown(e, el)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = getTopLevelGroupOrElement(el.id);
                          if (e.ctrlKey || e.metaKey || e.shiftKey) {
                            toggleElementSelection(targetId);
                          } else {
                            selectSingleElement(targetId);
                          }
                          loadElementToEdit(el);
                          setIsDetailOpen(true);
                          focusOnElement(el);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleElementDoubleClick(el);
                        }}
                        className={`transition-all duration-200 ${
                          editMode === 'select' ? 'cursor-move' : 'cursor-pointer hover:stroke-white'
                        }`}
                      />
                      {/* 경계선 마우스 드래그 핸들 (두꺼운 투명 선) */}
                      {editMode === 'select' && (
                        <polygon
                          points={ptsString}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="24"
                          className="cursor-move pointer-events-auto"
                          onMouseDown={(e) => handleElementMouseDown(e, el)}
                        />
                      )}
                      {/* 지형 텍스처 중첩 */}
                      {el.texture && el.texture !== 'none' && (
                        <polygon 
                          points={ptsString}
                          fill={getTextureUrl(el.texture)}
                          fillOpacity="0.75"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                    </g>
                  );
                })}

              {/* 경로선 레이어 */}
              {layerVisibility.routes && getAllActiveElementsForMap(currentMapId)
                .filter(el => el.type === 'route')
                .map(el => {
                  const state = el.statesBySnapshot?.[activeSnapshotId];
                  const isVisible = state ? state.visible : true;
                  if (!isVisible) return null;

                  const color = state?.color || el.color || '#F1C40F';
                  const ptsString = el.points?.map(p => `${p.x},${p.y}`).join(' ') || '';
                  const isSelected = isElementSelected(el.id);
                  
                  // SVG 폴리라인 좌표
                  return (
                    <g key={el.id}>
                      <polyline 
                        points={ptsString}
                        fill="none"
                        stroke={isSelected ? "#E74C3C" : color}
                        strokeWidth={isSelected ? "5" : "4"}
                        strokeDasharray="8,6"
                        onMouseDown={(e) => handleElementMouseDown(e, el)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = getTopLevelGroupOrElement(el.id);
                          if (e.ctrlKey || e.metaKey || e.shiftKey) {
                            toggleElementSelection(targetId);
                          } else {
                            selectSingleElement(targetId);
                          }
                          loadElementToEdit(el);
                          setIsDetailOpen(true);
                          focusOnElement(el);
                        }}
                        className={`transition-all duration-200 ${
                          editMode === 'select' ? 'cursor-move' : 'cursor-pointer hover:stroke-white'
                        }`}
                      />
                      {/* 경계선 마우스 드래그 핸들 (두꺼운 투명 선) */}
                      {editMode === 'select' && (
                        <polyline
                          points={ptsString}
                          fill="none"
                          stroke="transparent"
                          strokeWidth="24"
                          className="cursor-move pointer-events-auto"
                          onMouseDown={(e) => handleElementMouseDown(e, el)}
                        />
                      )}
                    </g>
                  );
                })}

              {/* 테두리 (사각형 및 원형) 레이어 */}
              {layerVisibility.political && getAllActiveElementsForMap(currentMapId)
                .filter(el => el.type === 'border_rect' || el.type === 'border_circle')
                .map(el => {
                  const state = el.statesBySnapshot?.[activeSnapshotId];
                  const isVisible = state ? state.visible : true;
                  if (!isVisible) return null;

                  const color = state?.color || el.color || '#5E6AD2';
                  const opacity = el.opacity !== undefined ? el.opacity : 1.0;
                  const strokeWidth = el.borderWidth || 3;
                  const borderStyle = el.borderStyle || 'solid';
                  const isSelected = isElementSelected(el.id);

                  const strokeDash = borderStyle === 'dashed' ? '8,6' : borderStyle === 'dotted' ? '3,3' : undefined;

                  if (el.type === 'border_rect') {
                    return (
                      <g key={el.id}>
                        <rect
                          x={el.bx}
                          y={el.by}
                          width={el.bw}
                          height={el.bh}
                          fill="none"
                          stroke={isSelected ? '#E74C3C' : color}
                          strokeWidth={isSelected ? strokeWidth + 1.5 : strokeWidth}
                          strokeOpacity={opacity}
                          strokeDasharray={strokeDash}
                          onMouseDown={(e) => handleElementMouseDown(e, el)}
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = getTopLevelGroupOrElement(el.id);
                            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                              toggleElementSelection(targetId);
                            } else {
                              selectSingleElement(targetId);
                            }
                            loadElementToEdit(el);
                            setIsDetailOpen(true);
                            focusOnElement(el);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                          className={`transition-all duration-200 ${isSelected ? 'stroke-[4px]' : 'hover:stroke-white'} ${editMode === 'select' ? 'cursor-move' : 'cursor-pointer'}`}
                        />
                        {/* 테두리 드래그 핸들 */}
                        {editMode === 'select' && (
                          <rect
                            x={el.bx}
                            y={el.by}
                            width={el.bw}
                            height={el.bh}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="24"
                            className="cursor-move pointer-events-auto"
                            onMouseDown={(e) => handleElementMouseDown(e, el)}
                          />
                        )}
                      </g>
                    );
                  } else {
                    return (
                      <g key={el.id}>
                        <ellipse
                          cx={el.bx}
                          cy={el.by}
                          rx={el.bw}
                          ry={el.bh}
                          fill="none"
                          stroke={isSelected ? '#E74C3C' : color}
                          strokeWidth={isSelected ? strokeWidth + 1.5 : strokeWidth}
                          strokeOpacity={opacity}
                          strokeDasharray={strokeDash}
                          onMouseDown={(e) => handleElementMouseDown(e, el)}
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = getTopLevelGroupOrElement(el.id);
                            if (e.ctrlKey || e.metaKey || e.shiftKey) {
                              toggleElementSelection(targetId);
                            } else {
                              selectSingleElement(targetId);
                            }
                            loadElementToEdit(el);
                            setIsDetailOpen(true);
                            focusOnElement(el);
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                          className={`transition-all duration-200 ${isSelected ? 'stroke-[4px]' : 'hover:stroke-white'} ${editMode === 'select' ? 'cursor-move' : 'cursor-pointer'}`}
                        />
                        {/* 원형 테두리 드래그 핸들 */}
                        {editMode === 'select' && (
                          <ellipse
                            cx={el.bx}
                            cy={el.by}
                            rx={el.bw}
                            ry={el.bh}
                            fill="none"
                            stroke="transparent"
                            strokeWidth="24"
                            className="cursor-move pointer-events-auto"
                            onMouseDown={(e) => handleElementMouseDown(e, el)}
                          />
                        )}
                      </g>
                    );
                  }
                })}

              {/* 드래그 중인 테두리 임시 프리뷰 */}
              {borderDragStart && borderDragCurrent && (() => {
                const x1 = Math.min(borderDragStart.x, borderDragCurrent.x);
                const y1 = Math.min(borderDragStart.y, borderDragCurrent.y);
                const x2 = Math.max(borderDragStart.x, borderDragCurrent.x);
                const y2 = Math.max(borderDragStart.y, borderDragCurrent.y);
                const w = x2 - x1;
                const h = y2 - y1;
                
                if (editMode === 'draw_border_rect') {
                  return (
                    <rect
                      x={x1}
                      y={y1}
                      width={w}
                      height={h}
                      fill="none"
                      stroke="#5E6AD2"
                      strokeWidth="2.5"
                      strokeDasharray="5,5"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                } else if (editMode === 'draw_border_circle') {
                  return (
                    <ellipse
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      rx={w / 2}
                      ry={h / 2}
                      fill="none"
                      stroke="#5E6AD2"
                      strokeWidth="2.5"
                      strokeDasharray="5,5"
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                }
                return null;
              })()}

              {/* 거리 측정 선 미리보기 */}
              {measurePoints.length > 0 && (
                <polyline 
                  points={measurePoints.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke="#E74C3C"
                  strokeWidth="3.5"
                  strokeDasharray="5,5"
                />
              )}

              {/* 임시 그리기 다각형 및 가이드선 */}
              {tempPoints.length > 0 && (
                <>
                  <polyline 
                    points={tempPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#2ECC71"
                    strokeWidth="3"
                  />
                  {/* 다음 꼭짓점 예측 선 */}
                  {hoveredPoint && (
                    <line 
                      x1={tempPoints[tempPoints.length - 1].x}
                      y1={tempPoints[tempPoints.length - 1].y}
                      x2={hoveredPoint.x}
                      y2={hoveredPoint.y}
                      stroke="#2ECC71"
                      strokeWidth="2.5"
                      strokeDasharray="4,4"
                    />
                  )}
                  {/* 꼭짓점 마커 */}
                  {tempPoints.map((pt, idx) => (
                    <circle 
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill={idx === 0 ? "#E74C3C" : "#2ECC71"}
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  ))}
                </>
              )}

              {/* 선택된 다각형 꼭짓점 수정 드래그 핸들 (Anchor Points) */}
              {editMode === 'select' && selectedElementId && elements
                .filter(el => el.id === selectedElementId && el.points)
                .map(el => (
                  <g key={`anchors-${el.id}`}>
                    {el.points?.map((pt, idx) => (
                      <circle 
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="7"
                        fill="#E74C3C"
                        stroke="white"
                        strokeWidth="2"
                        className="cursor-move pointer-events-auto"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (isReadOnly) {
                            showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
                            return;
                          }
                          pushHistory();
                          setActiveAnchorPointIdx(idx);
                        }}
                      />
                    ))}
                  </g>
                ))}
              {/* 마키/선택 상자 드래그 오버레이 */}
              {selectionBoxStart && selectionBoxCurrent && (() => {
                const x = Math.min(selectionBoxStart.x, selectionBoxCurrent.x);
                const y = Math.min(selectionBoxStart.y, selectionBoxCurrent.y);
                const w = Math.max(selectionBoxStart.x, selectionBoxCurrent.x) - x;
                const h = Math.max(selectionBoxStart.y, selectionBoxCurrent.y) - y;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="rgba(94, 106, 210, 0.08)"
                    stroke="#5E6AD2"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })()}
            </svg>

            {/* 4. 절대 배치형 거점 핀(Pin Marker) 리스트 */}
            {layerVisibility.political && getAllActiveElementsForMap(currentMapId)
              .filter(el => el.type === 'pin')
              .map(el => {
                const state = el.statesBySnapshot?.[activeSnapshotId];
                const isVisible = state ? state.visible : true;
                if (!isVisible) return null;

                const color = state?.color || el.color || '#5E6AD2';
                const isSelected = isElementSelected(el.id);

                // 핀 아이콘 매핑
                const IconComponent = {
                  castle: Castle,
                  swords: Swords,
                  mountain: Mountain,
                  mappin: MapPin
                }[el.icon || 'mappin'] || MapPin;

                return (
                  <div 
                    key={el.id}
                    className="absolute pointer-events-auto flex flex-col items-center gap-1 group transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${el.x}px`,
                      top: `${el.y}px`,
                      cursor: editMode === 'select' ? 'move' : 'pointer'
                    }}
                    onMouseDown={(e) => {
                      if (editMode === 'select') {
                        handleElementMouseDown(e, el);
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetId = getTopLevelGroupOrElement(el.id);
                      if (editMode === 'select') {
                        if (e.ctrlKey || e.metaKey || e.shiftKey) {
                          toggleElementSelection(targetId);
                        } else {
                          selectSingleElement(targetId);
                        }
                      } else {
                        selectSingleElement(targetId);
                      }
                      loadElementToEdit(el);
                      setIsDetailOpen(true);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleElementDoubleClick(el);
                    }}
                  >
                    <div 
                      className={`p-2 rounded-full shadow-lg transition-transform hover:scale-115 flex items-center justify-center border-2 ${
                        isSelected ? 'border-white bg-[#E74C3C] scale-110' : 'border-white bg-gray-900'
                      }`}
                      style={isSelected ? undefined : { backgroundColor: color }}
                    >
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* 한 줄 요약 툴팁 팝업 오버레이 */}
                    <div className="absolute top-11 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-950/90 text-white rounded-lg p-2 text-[10px] w-48 shadow-2xl border border-white/10 z-50 flex flex-col gap-0.5">
                      <span className="font-bold text-[#7480E2]">{el.name}</span>
                      {el.summary && <p className="text-gray-300 leading-normal">{el.summary}</p>}
                    </div>

                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/85 text-white whitespace-nowrap shadow border border-white/5">
                      {el.name}
                    </span>
                  </div>
                );
              })}

            {/* 5. 캐릭터 동선 경로선 및 마커 */}
            {layerVisibility.characters && (() => {
              const snapPosMap = characterPositions[activeSnapshotId] || {};
              return relationNodes.map(node => {
                const charPos = snapPosMap[node.id];
                if (!charPos) return null;

                const isSelected = selectedCharacterId === node.id;

                return (
                  <React.Fragment key={`char-${node.id}`}>
                    {/* 동선 경로 점선 그리기 */}
                    {charPos.trail && charPos.trail.length > 1 && (
                      <svg className="absolute inset-0 w-full h-full overflow-visible" style={{ pointerEvents: 'none' }}>
                        <polyline 
                          points={charPos.trail.map(p => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke={node.color || '#2ECC71'}
                          strokeWidth="2.5"
                          strokeDasharray="6,4"
                        />
                      </svg>
                    )}

                    {/* 캐릭터 이동 위치 마커 */}
                    <div 
                      className="absolute pointer-events-auto cursor-move flex flex-col items-center gap-1 z-30 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${charPos.x}px`,
                        top: `${charPos.y}px`
                      }}
                      onMouseDown={(e) => {
                        if (isReadOnly) {
                          showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
                          return;
                        }
                        // 캐릭터 이동을 드래그로 조작하기 위해
                        e.stopPropagation();
                        pushHistory();
                        setSelectedCharacterId(node.id);
                        
                        const handleDragMove = (moveEvent: MouseEvent) => {
                          handleCharacterMarkerDrag(node.id, moveEvent.clientX, moveEvent.clientY);
                        };
                        const handleDragEnd = () => {
                          window.removeEventListener('mousemove', handleDragMove);
                          window.removeEventListener('mouseup', handleDragEnd);
                        };
                        window.addEventListener('mousemove', handleDragMove);
                        window.addEventListener('mouseup', handleDragEnd);
                      }}
                    >
                      <div 
                        className={`w-9 h-9 rounded-full shadow-xl flex items-center justify-center border-2 hover:scale-110 transition-transform ${
                          isSelected ? 'border-yellow-400 bg-yellow-400/20' : 'border-white bg-gray-800'
                        }`}
                        style={{ borderColor: node.color }}
                      >
                        <span className="text-[10px] font-bold text-white uppercase">{node.name.slice(0,2)}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#2ECC71] text-white whitespace-nowrap shadow border border-white/5">
                        👤 {node.name}
                      </span>
                    </div>
                  </React.Fragment>
                );
              });
            })()}

            {/* Fog of War (안개 마스크 영역 효과) */}
            {fogVisible && (
              <div 
                className="absolute inset-0 bg-black/75 mix-blend-multiply transition-opacity duration-300"
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* 거리 측정 결과 오버레이 팝업 */}
          {editMode === 'measure' && measurePoints.length > 1 && (
            <div className="absolute top-4 left-4 p-3.5 rounded-xl bg-black/85 border border-white/10 text-xs text-white flex flex-col gap-1.5 shadow-2xl z-50">
              <span className="font-bold text-[#E74C3C]">📏 스케일 거리 연산기</span>
              <p className="font-semibold text-gray-200">{calculateDistanceInfo()}</p>
              <div className="flex gap-2.5 mt-1 border-t border-white/10 pt-2 text-[10px] text-gray-400">
                <button onClick={() => setMeasurePoints([])} className="hover:text-white">측정 리셋</button>
                <span>|</span>
                <button onClick={() => setEditMode('select')} className="hover:text-white">종료</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 우측 세부 설정 편집 정보창 (width 320px) */}
      {isDetailOpen && selectedElementId && (() => {
        const el = elements.find(item => item.id === selectedElementId);
        if (!el) return null;

        return (
          <div className={`w-80 shrink-0 border-l flex flex-col justify-between ${
            isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <fieldset disabled={isReadOnly} className="p-4 flex flex-col gap-4 overflow-y-auto flex-1 text-xs border-none m-0" style={{ minWidth: 0 }}>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="font-bold text-sm">📝 장소 속성 편집</h3>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 기본 요약 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">장소/세력권 명</label>
                <input 
                  type="text"
                  value={elementEditName}
                  onChange={e => setElementEditName(e.target.value)}
                  className={`px-3 py-2 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              {/* 카테고리 유형 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">유형 (Category)</label>
                <select 
                  value={elementEditCategory}
                  onChange={e => setElementEditCategory(e.target.value)}
                  className={`px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                    isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                  }`}
                >
                  <option value="kingdom">왕국 / 제국</option>
                  <option value="city">수도 / 도시 / 마을</option>
                  <option value="fortress">성 / 군사용 요새</option>
                  <option value="dungeon">던전 / 비밀 유적</option>
                  <option value="nature">자연물 (산맥/숲/바다)</option>
                  <option value="danger">금지구역 / 분쟁지</option>
                </select>
              </div>

              {/* 핀 아이콘 (핀 타입 전용) */}
              {el.type === 'pin' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-400">마커 핀 아이콘</label>
                  <select 
                    value={elementEditIcon}
                    onChange={e => setElementEditIcon(e.target.value as any)}
                    className={`px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                    }`}
                  >
                    <option value="mappin">📍 일반 위치 핀</option>
                    <option value="castle">🏰 중세 성/수도 요새</option>
                    <option value="swords">⚔️ 전장/던전 분쟁지</option>
                    <option value="mountain">🏔️ 산맥/숲 랜드마크</option>
                  </select>
                </div>
              )}

              {/* 영역 텍스처 오버레이 패턴 (폴리곤 타입 전용) */}
              {el.type === 'polygon' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-400">지형 텍스처 패턴</label>
                  <select 
                    value={elementEditTexture}
                    onChange={e => setElementEditTexture(e.target.value as any)}
                    className={`px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                      isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                    }`}
                  >
                    <option value="none">색상 단색 채우기</option>
                    <option value="slash">🏔️ 산맥 지형 (빗금 무늬)</option>
                    <option value="dots">🌲 정글/숲 (숲 패턴)</option>
                    <option value="sand">🏜️ 사막/성곽 (모래 점무늬)</option>
                  </select>
                </div>
              )}

              {/* 테두리 (사각형 및 원형) 전용 옵션 */}
              {(el.type === 'border_rect' || el.type === 'border_circle') && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-gray-400">테두리 선 스타일</label>
                    <select 
                      value={elementEditBorderStyle}
                      onChange={e => setElementEditBorderStyle(e.target.value as any)}
                      className={`px-3 py-2 rounded-lg border outline-none cursor-pointer ${
                        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
                      }`}
                    >
                      <option value="solid">━━━━ 실선 (Solid)</option>
                      <option value="dashed">╍╍╍╍ 파선 (Dashed)</option>
                      <option value="dotted">•••• 점선 (Dotted)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-semibold text-gray-400">테두리 두께 (px)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={elementEditBorderWidth}
                        onChange={e => setElementEditBorderWidth(parseInt(e.target.value))}
                        className="flex-1 h-1.5 bg-[#5E6AD2]/20 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
                      />
                      <span className="font-mono text-xs w-6 text-right">{elementEditBorderWidth}px</span>
                    </div>
                  </div>
                </>
              )}

              {/* 색상 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">색상 지정 (Color Picker)</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={elementEditColor}
                    onChange={e => setElementEditColor(e.target.value)}
                    className="w-10 h-8 rounded border-none cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={elementEditColor}
                    onChange={e => setElementEditColor(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border outline-none ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                    }`}
                  />
                </div>
              </div>

              {/* 투명도 조절 */}
              {el.type === 'polygon' && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-semibold text-gray-400">
                    <span>면적 투명도</span>
                    <span>{elementEditOpacity}%</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="90"
                    value={elementEditOpacity}
                    onChange={e => setElementEditOpacity(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#5E6AD2]/20 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
                  />
                </div>
              )}

              <hr className={isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} />

              {/* 한 줄 요약 툴팁 정보 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">한 줄 요약 (마커 툴팁)</label>
                <input 
                  type="text"
                  value={elementEditSummary}
                  onChange={e => setElementEditSummary(e.target.value)}
                  placeholder="지도를 마우스로 훑어볼 때 팝업 노출됩니다"
                  className={`px-3 py-2 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              {/* 상세 정보 (마크다운) */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">상세 설명 / 역사 / 지리 설정집</label>
                <textarea 
                  rows={4}
                  value={elementEditDesc}
                  onChange={e => setElementEditDesc(e.target.value)}
                  placeholder="장소의 유래, 역사, 전략적 요충지 여부를 자세히 설정하세요"
                  className={`px-3 py-2 rounded-lg border outline-none resize-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                />
              </div>

              <hr className={isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} />

              {/* 보유 정보 태그 칩 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">보유 속성 태그 (몬스터, 아이템, 유적 등)</label>
                <div className="flex gap-1.5">
                  <input 
                    type="text"
                    value={newTagInput}
                    onChange={e => setNewTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && newTagInput.trim()) {
                        e.preventDefault();
                        if (!elementEditTags.includes(newTagInput.trim())) {
                          setElementEditTags(prev => [...prev, newTagInput.trim()]);
                        }
                        setNewTagInput('');
                      }
                    }}
                    placeholder="태그 입력 후 엔터"
                    className={`flex-1 px-2.5 py-1.5 rounded-lg border outline-none ${
                      isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                    }`}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {elementEditTags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-0.5 rounded-md bg-[#5E6AD2]/10 text-[#7480E2] font-semibold text-[10px] flex items-center gap-1"
                    >
                      #{tag}
                      <button 
                        onClick={() => setElementEditTags(prev => prev.filter(t => t !== tag))}
                        className="text-gray-400 hover:text-red-400 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <hr className={isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'} />

              {/* 관련 인물 연동 */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-gray-400">관련 인물 태깅</label>
                <div className="flex flex-col gap-1">
                  {relationNodes.map(node => {
                    const isTagged = elementEditChars.includes(node.id);
                    return (
                      <label key={node.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={isTagged}
                          onChange={e => {
                            if (e.target.checked) {
                              setElementEditChars(prev => [...prev, node.id]);
                            } else {
                              setElementEditChars(prev => prev.filter(id => id !== node.id));
                            }
                          }}
                          className="rounded text-[#5E6AD2] focus:ring-[#5E6AD2]"
                        />
                        <span className="font-semibold text-gray-300">👤 {node.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 관련 에피소드(회차) 연동 */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="font-semibold text-gray-400">주 배경 에피소드 회차 연계</label>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-32 p-1 border border-white/[0.06] rounded-lg">
                  {episodes.map(ep => {
                    const isTagged = elementEditEpisodes.includes(ep.id);
                    return (
                      <label key={ep.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={isTagged}
                          onChange={e => {
                            if (e.target.checked) {
                              setElementEditEpisodes(prev => [...prev, ep.id]);
                            } else {
                              setElementEditEpisodes(prev => prev.filter(id => id !== ep.id));
                            }
                          }}
                          className="rounded text-[#5E6AD2] focus:ring-[#5E6AD2]"
                        />
                        <span className="font-semibold text-gray-400 truncate w-60">{ep.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </fieldset>

            {/* 상세 속성 하단 제어 버튼 */}
            <div className="p-4 border-t border-white/[0.06] flex gap-2">
              {isReadOnly ? (
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className={`flex-1 py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                    isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                  }`}
                >
                  닫기
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleDeleteElement(selectedElementId)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition-colors shrink-0 flex items-center justify-center"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleSaveProperties}
                    className="flex-1 p-2 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-[#5E6AD2]/20"
                  >
                    <Check className="w-4 h-4" /> 설정 저장
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* 이력 메모 조회 모달 창 */}
      {showMemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-[450px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold text-[#7480E2]">
                <span>{currentSnapshot.name}</span>
              </h3>
              <button 
                onClick={() => setShowMemoModal(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                <span>작중 일시: {currentSnapshot.date}</span>
              </div>
              <div className={`p-4 rounded-xl border whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto ${
                isDark ? 'bg-white/[0.02] border-white/[0.08] text-gray-300' : 'bg-black/[0.01] border-black/[0.08] text-gray-700'
              }`}>
                {currentSnapshot.description || '작성된 이력 메모가 없습니다.'}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-500/10">
              <button 
                onClick={() => setShowMemoModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                  isDark ? 'border-white/[0.06] hover:bg-[#1E1F22] text-gray-300' : 'border-black/[0.06] hover:bg-gray-100 text-gray-700'
                }`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 스냅샷 추가 모달 창 */}
      {showNewSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">🎬 신규 역사적 시점(사건) 추가</h3>
              <button 
                onClick={() => setShowNewSnapshotModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">사건/스냅샷 이름</label>
                <input 
                  type="text" 
                  value={newSnapshotName} 
                  onChange={e => setNewSnapshotName(e.target.value)}
                  placeholder="예: 롬 요새 기습 전격전"
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">작중 캘린더 시간대</label>
                <input 
                  type="text" 
                  value={newSnapshotDate} 
                  onChange={e => setNewSnapshotDate(e.target.value)}
                  placeholder="예: 제국력 104년 8월"
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">사건 서사 전개 요약</label>
                <textarea 
                  rows={3}
                  value={newSnapshotDesc} 
                  onChange={e => setNewSnapshotDesc(e.target.value)}
                  placeholder="시점 변경 시 작가에게 브리핑될 사건 전개 설정입니다."
                  className={`px-3 py-1.5 rounded-lg border outline-none resize-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => setShowNewSnapshotModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                  isDark ? 'border-white/[0.06] hover:bg-[#1E1F22]' : 'border-black/[0.06] hover:bg-gray-100'
                }`}
              >
                취소
              </button>
              <button 
                onClick={handleCreateSnapshot}
                className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
              >
                추가 및 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 레이아웃 추가 모달 창 */}
      {showNewLayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold">📂 신규 세부 지도 레이아웃 추가</h3>
              <button 
                onClick={() => setShowNewLayoutModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">세부 지도(레이아웃) 이름</label>
                <input 
                  type="text" 
                  value={newLayoutName} 
                  onChange={e => setNewLayoutName(e.target.value)}
                  placeholder="예: 아이론 왕국 수도, 왕궁 내부 등"
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateLayout();
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => setShowNewLayoutModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                  isDark ? 'border-white/[0.06] hover:bg-[#1E1F22]' : 'border-black/[0.06] hover:bg-gray-100'
                }`}
              >
                취소
              </button>
              <button 
                onClick={handleCreateLayout}
                className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
              >
                레이아웃 추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
