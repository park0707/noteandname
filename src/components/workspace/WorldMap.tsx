import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, Layers, Plus, Move, Trash2, Unlock, ChevronsLeft, ChevronsRight, ChevronLeft, 
  MapPin, Swords, Castle, Mountain, Sparkles, 
  ZoomIn, ZoomOut, Check, X, Download, RotateCcw, RotateCw, Search, Bookmark,
  PenTool, Settings2, History, Ruler, Eye, EyeOff, Grid3X3, Magnet, Lock, Map, Circle, Square,
  Upload, AlertTriangle, Image, Tag, Paintbrush, Route, Folder, FolderOpen
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
  createdTime?: string;
}

export interface MapElement {
  id: string;
  name: string;
  type: 'pin' | 'polygon' | 'route' | 'border_rect' | 'border_circle' | 'group' | 'brush' | 'image';
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

  // Brush 전용 속성
  brushStrokes?: Array<Array<{ x: number; y: number }>>;
  brushStrokeObjects?: Array<{ points: Array<{ x: number; y: number }>; width: number; shape?: 'circle' | 'square' }>;
  brushWidth?: number;
  brushShape?: 'circle' | 'square';
  
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
  // base64 imageAttachment → ObjectURL 캐시 (렌더링 성능 최적화: 브라우저 Decoded Image Cache 활용)
  const blobUrlCacheRef = useRef<{ [key: string]: string }>({});


  // 세부 항목 잠그기(Filter) 지원 타입 정의 (Lucide React SVG 아이콘 및 표준 용어 단일화)
  const LOCKABLE_ELEMENT_TYPES = [
    { type: 'image', label: '배경 이미지', Icon: Image },
    { type: 'polygon', label: '다각형 영역', Icon: Map },
    { type: 'route', label: '이동 교역로', Icon: Route },
    { type: 'brush', label: '붓 그리기 영역', Icon: Paintbrush },
    { type: 'pin', label: '거점 핀 마커', Icon: MapPin },
    { type: 'border_rect', label: '구역 사각형 테두리', Icon: Square },
    { type: 'border_circle', label: '구역 원형 테두리', Icon: Circle },
  ];

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
  const [editMode, setEditMode] = useState<'select' | 'pan' | 'draw_polygon' | 'add_pin' | 'draw_route' | 'measure' | 'draw_border_rect' | 'draw_border_circle' | 'draw_brush'>('select');

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
  const [dragInitialElementsCoords, setDragInitialElementsCoords] = useState<Record<string, {
    x: number;
    y: number;
    w?: number;
    h?: number;
    points?: Array<{ x: number; y: number }>;
    brushStrokes?: Array<Array<{ x: number; y: number }>>;
    brushStrokeObjects?: Array<{ points: Array<{ x: number; y: number }>; width: number; shape?: 'circle' | 'square' }>;
  }>>({});
  const [preDragElements, setPreDragElements] = useState<MapElement[] | null>(null);
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);
  
  // --- 타임라인 스냅샷 상태 ---
  const [snapshots, setSnapshots] = useState<MapSnapshot[]>([
    { id: 'snap-default', order: 0, name: '1권 시작 기준', date: '작중 932년 4월', description: '평화로운 아이론 왕국 영토와 가문 세력권.', createdTime: '26-07-21, 09:00' },
    { id: 'snap-war', order: 1, name: '동부 요새 함락 사건', date: '작중 932년 10월', description: '제국의 흑마법 기습 침공으로 동부 요새가 함락되고 소실됨.', createdTime: '26-07-21, 09:15' },
    { id: 'snap-fall', order: 2, name: '제국 연합군 병합 완료', date: '작중 933년 6월', description: '아이론 북동부 요충지가 완전히 함락되어 제국 영토로 편입됨.', createdTime: '26-07-21, 09:30' }
  ]);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string>('snap-fall');
  const activeSnapshotIdx = snapshots.findIndex(s => s.id === activeSnapshotId) === -1 ? 0 : snapshots.findIndex(s => s.id === activeSnapshotId);
  const currentSnapshot = snapshots[activeSnapshotIdx] || snapshots[0];

  const [isSnapshotEditUnlocked, setIsSnapshotEditUnlocked] = useState(false);
  const isLatestSnapshot = snapshots.length > 0 && activeSnapshotId === snapshots[snapshots.length - 1].id;
  const isReadOnly = !isLatestSnapshot && !isSnapshotEditUnlocked;

  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [memoEditName, setMemoEditName] = useState('');
  const [memoEditDate, setMemoEditDate] = useState('');
  const [memoEditDescription, setMemoEditDescription] = useState('');

  // --- 미니맵 (Minimap) 제어 상태 ---
  // --- 미니맵 (Minimap) 제어 상태 ---
  const [showMinimap, setShowMinimap] = useState(false);
  const [minimapPos, setMinimapPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const [dragMinimapStart, setDragMinimapStart] = useState<{ x: number; y: number; posX: number; posY: number }>({ x: 0, y: 0, posX: 0, posY: 0 });
  const [minimapSize, setMinimapSize] = useState<{ width: number; height: number }>({ width: 320, height: 240 });
  const [minimapZoom, setMinimapZoom] = useState(1.0);
  const [resizeDir, setResizeDir] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null);
  const [resizeMinimapStart, setResizeMinimapStart] = useState<{ x: number; y: number; width: number; height: number; posX: number; posY: number }>({ x: 0, y: 0, width: 320, height: 240, posX: 0, posY: 0 });
  
  // 미니맵 내부 마우스 드래그 캔버스 팬(Pan) 상태
  const [isNavigatingMinimap, setIsNavigatingMinimap] = useState(false);
  const [navMinimapStart, setNavMinimapStart] = useState<{ mouseX: number; mouseY: number; initialPanX: number; initialPanY: number; spanW: number; spanH: number; mapWidth: number; mapHeight: number }>({ mouseX: 0, mouseY: 0, initialPanX: 0, initialPanY: 0, spanW: 10000, spanH: 10000, mapWidth: 300, mapHeight: 200 });

  // 미니맵 위치 기억 (북마크/웨이포인트) 상태
  const [savedBookmarks, setSavedBookmarks] = useState<Array<{ id: string; name: string; x: number; y: number; zoom: number }>>([]);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkNameInput, setBookmarkNameInput] = useState('');

  // --- 안개 모드 및 레이어 락 제어 ---
  const [fogVisible, setFogVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSize, setGridSize] = useState<number>(40);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);

  // 격자 메뉴 바깥 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(event.target as globalThis.Node)) {
        setShowGridMenu(false);
      }
    };
    if (showGridMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGridMenu]);

  const [pointSnapEnabled, setPointSnapEnabled] = useState(true);

  // 세부 항목 잠그기(Element Type Locking) 상태 (기본값: 배경 이미지 'image' 잠금)
  const [lockedElementTypes, setLockedElementTypes] = useState<string[]>(['image']);
  const [showLockFilterDropdown, setShowLockFilterDropdown] = useState(false);
  const lockFilterRef = useRef<HTMLDivElement>(null);

  // 항목 잠그기 드롭다운 바깥 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lockFilterRef.current && !lockFilterRef.current.contains(event.target as globalThis.Node)) {
        setShowLockFilterDropdown(false);
      }
    };
    if (showLockFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLockFilterDropdown]);

  // 특정 요소 타입이 현재 잠겨 있는지 여부를 확인하는 헬퍼 함수
  const isElementLocked = useCallback((type: string | undefined): boolean => {
    if (!type) return false;
    return lockedElementTypes.includes(type);
  }, [lockedElementTypes]);
  
  // 레이어별 가시성 토글
  const [layerVisibility, setLayerVisibility] = useState({
    terrain: true,   // 자연물
    political: true, // 국경/세력
    routes: true,    // 경로
    characters: true // 캐릭터 마커
  });

  // --- 마우스 호버 시 항목 이름 오버레이 상태 및 이름보기 토글 ---
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [hoveredMousePos, setHoveredMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showElementNames, setShowElementNames] = useState(true);

  // --- 사이드바 항목 종류 필터 상태 ---
  const [selectedSidebarTypes, setSelectedSidebarTypes] = useState<string[]>([
    'pin', 'brush', 'polygon', 'route', 'border_rect', 'border_circle', 'image'
  ]);
  const [showSidebarFilterDropdown, setShowSidebarFilterDropdown] = useState(false);
  const sidebarFilterRef = useRef<HTMLDivElement>(null);

  // 사이드바 필터 바깥 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarFilterRef.current && !sidebarFilterRef.current.contains(event.target as globalThis.Node)) {
        setShowSidebarFilterDropdown(false);
      }
    };
    if (showSidebarFilterDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSidebarFilterDropdown]);

  // --- 미니맵 창 드래그, 전방위 리사이즈, 미니맵 캔버스 팬(Pan) 이벤트 처리 ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingMinimap) {
        const dx = e.clientX - dragMinimapStart.x;
        const dy = e.clientY - dragMinimapStart.y;
        setMinimapPos({
          x: Math.max(10, Math.min(window.innerWidth - 100, dragMinimapStart.posX + dx)),
          y: Math.max(10, Math.min(window.innerHeight - 50, dragMinimapStart.posY + dy))
        });
      } else if (resizeDir && resizeMinimapStart) {
        const dx = e.clientX - resizeMinimapStart.x;
        const dy = e.clientY - resizeMinimapStart.y;
        
        let newW = resizeMinimapStart.width;
        let newH = resizeMinimapStart.height;
        let newX = resizeMinimapStart.posX;
        let newY = resizeMinimapStart.posY;

        if (resizeDir.includes('e')) {
          newW = Math.max(200, Math.min(750, resizeMinimapStart.width + dx));
        }
        if (resizeDir.includes('w')) {
          const possibleW = resizeMinimapStart.width - dx;
          if (possibleW >= 200 && possibleW <= 750) {
            newW = possibleW;
            newX = resizeMinimapStart.posX + dx;
          }
        }
        if (resizeDir.includes('s')) {
          newH = Math.max(150, Math.min(550, resizeMinimapStart.height + dy));
        }
        if (resizeDir.includes('n')) {
          const possibleH = resizeMinimapStart.height - dy;
          if (possibleH >= 150 && possibleH <= 550) {
            newH = possibleH;
            newY = resizeMinimapStart.posY + dy;
          }
        }

        setMinimapSize({ width: newW, height: newH });
        if (resizeDir.includes('w') || resizeDir.includes('n')) {
          setMinimapPos({ x: newX, y: newY });
        }
      } else if (isNavigatingMinimap) {
        const dx = e.clientX - navMinimapStart.mouseX;
        const dy = e.clientY - navMinimapStart.mouseY;

        const canvasDx = (dx / navMinimapStart.mapWidth) * navMinimapStart.spanW;
        const canvasDy = (dy / navMinimapStart.mapHeight) * navMinimapStart.spanH;

        setPan({
          x: navMinimapStart.initialPanX + canvasDx * zoom,
          y: navMinimapStart.initialPanY + canvasDy * zoom,
        });
      }
    };

    const handleMouseUp = () => {
      if (isDraggingMinimap) setIsDraggingMinimap(false);
      if (resizeDir) setResizeDir(null);
      if (isNavigatingMinimap) setIsNavigatingMinimap(false);
    };

    if (isDraggingMinimap || resizeDir || isNavigatingMinimap) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingMinimap, resizeDir, isNavigatingMinimap, dragMinimapStart, resizeMinimapStart, navMinimapStart, zoom]);
  const [tempPoints, setTempPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; isPointSnapped?: boolean } | null>(null);
  const [activeAnchorPointIdx, setActiveAnchorPointIdx] = useState<number | null>(null);
  const [activeBorderResizeDirection, setActiveBorderResizeDirection] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);

  // --- 붓 그리기 리액트 상태 ---
  const [brushWidth, setBrushWidth] = useState<number>(20);
  const [brushShape, setBrushShape] = useState<'circle' | 'square'>('circle');
  const [tempBrushStrokes, setTempBrushStrokes] = useState<Array<{ points: Array<{ x: number; y: number }>; width: number; shape: 'circle' | 'square' }>>([]);
  const [currentBrushStroke, setCurrentBrushStroke] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawingBrush, setIsDrawingBrush] = useState<boolean>(false);
  const [showBrushWidthDropdown, setShowBrushWidthDropdown] = useState<boolean>(false);
  const [showBorderDropdown, setShowBorderDropdown] = useState<boolean>(false);
  const [showPointDropdown, setShowPointDropdown] = useState<boolean>(false);
  const brushDropdownRef = useRef<HTMLDivElement | null>(null);
  const borderDropdownRef = useRef<HTMLDivElement | null>(null);
  const pointDropdownRef = useRef<HTMLDivElement | null>(null);
  const historyDropdownRef = useRef<HTMLDivElement | null>(null);
  const isGroupSelectedBeforeMouseDownRef = useRef<boolean>(false);

  // 드롭다운 바깥 영역 클릭 시 자동 닫기 핸들러
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as unknown as HTMLElement;
      if (brushDropdownRef.current && !brushDropdownRef.current.contains(target)) {
        setShowBrushWidthDropdown(false);
      }
      if (borderDropdownRef.current && !borderDropdownRef.current.contains(target)) {
        setShowBorderDropdown(false);
      }
      if (pointDropdownRef.current && !pointDropdownRef.current.contains(target)) {
        setShowPointDropdown(false);
      }
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(target)) {
        setShowHistoryDropdown(false);
      }
    };

    if (showBrushWidthDropdown || showBorderDropdown || showPointDropdown || showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showBrushWidthDropdown, showBorderDropdown, showPointDropdown, showHistoryDropdown]);

  // --- 이미지 업로드 배경 및 프리셋 ---
  const [presetBg, setPresetBg] = useState<'vintage' | 'cosmic' | 'grid'>('vintage');
  const [showBgUploadModal, setShowBgUploadModal] = useState(false);
  const [bgUploadError, setBgUploadError] = useState<string | null>(null);

  /**
   * base64 Data URL을 브라우저 ObjectURL로 변환하여 캐싱합니다.
   * SVG <image> 요소에서 직접 base64 문자열을 사용하면 드래그 시 매 프레임마다
   * 대용량 문자열을 재파싱/재래스터화하여 심각한 렌더링 지연이 발생합니다.
   * ObjectURL은 브라우저 Decoded Image Cache를 활용하여 이 비용을 원천 차단합니다.
   */
  const getImageRenderUrl = useCallback((base64DataUrl: string | undefined): string | undefined => {
    if (!base64DataUrl) return undefined;
    // 이미 ObjectURL인 경우 (blob:) 그대로 반환
    if (base64DataUrl.startsWith('blob:')) return base64DataUrl;
    
    const cache = blobUrlCacheRef.current;
    if (cache[base64DataUrl]) return cache[base64DataUrl];

    // base64 → Blob → ObjectURL 변환
    try {
      const [header, data] = base64DataUrl.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const objectUrl = URL.createObjectURL(blob);
      cache[base64DataUrl] = objectUrl;
      return objectUrl;
    } catch {
      return base64DataUrl; // 변환 실패 시 원본 사용
    }
  }, []);
  
  // --- 줌 수동 편집 상태 ---
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInputVal, setZoomInputVal] = useState('');

  const handleImageFile = (file: File) => {

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBgUploadError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setBgUploadError(`용량 제한(1MB)을 초과했습니다. (선택한 파일: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      if (base64Data) {
        pushHistory();
        
        const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : 1200;
        const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : 800;
        const camX = (-pan.x + containerW / 2) / zoom;
        const camY = (-pan.y + containerH / 2) / zoom;
        const width = 400;
        const height = 300;

        const newImageElement: MapElement = {
          id: `image-${Date.now()}`,
          name: `배경 이미지 ${elements.filter(el => el.type === 'image').length + 1}`,
          type: 'image',
          parentMapId: currentMapId,
          bx: camX - width / 2,
          by: camY - height / 2,
          bw: width,
          bh: height,
          imageAttachment: base64Data,
          opacity: 0.85,
          tags: []
        };

        setElements(prev => [...prev, newImageElement]);
        setBgUploadError(null);
        setShowBgUploadModal(false); // 업로드 즉시 적용 후 창 닫기
      } else {
        setBgUploadError('이미지를 읽는 데 실패했습니다.');
      }
    };
    reader.onerror = () => {
      setBgUploadError('파일을 읽는 과정에서 오류가 발생했습니다.');
    };
    reader.readAsDataURL(file);
  };

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
  const [activeHeaderTab, setActiveHeaderTab] = useState<'tool' | 'draw' | 'timeline' | 'settings' | null>('tool');
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

  /*
  const toggleElementSelection = useCallback((id: string) => {
    setSelectedElementIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setSelectedElementId(next.length > 0 ? next[next.length - 1] : null);
      return next;
    });
  }, []);
  */

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

  /*
  const getSelectionTargetId = useCallback((elId: string, e: React.MouseEvent | React.TouchEvent) => {
    const topGroup = getTopLevelGroupOrElement(elId);
    const isChildSelected = selectedElementIds.includes(elId);
    const isParentSelected = selectedElementIds.includes(topGroup);
    const altPressed = 'altKey' in e && e.altKey;
    return (isChildSelected || isParentSelected || altPressed) ? elId : topGroup;
  }, [selectedElementIds, getTopLevelGroupOrElement]);
  */

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

  // 현재 맵(currentMapId) 기준 활성 요소 목록 메모이제이션 (매 렌더마다 반복 필터링하는 연산 오버헤드 원천 제거)
  const currentActiveElements: MapElement[] = useMemo(() => {
    return getAllActiveElementsForMap(currentMapId);
  }, [getAllActiveElementsForMap, currentMapId]);

  const getElementsInSelectionBox = useCallback((
    start: { x: number; y: number },
    current: { x: number; y: number }
  ): string[] => {
    const x1 = Math.min(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const x2 = Math.max(start.x, current.x);
    const y2 = Math.max(start.y, current.y);

    const activeEls = currentActiveElements;
    const selected: string[] = [];

    activeEls.forEach(el => {
      if (isElementLocked(el.type)) return;
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
      } else if (el.brushStrokes && el.brushStrokes.length > 0) {
        const anyPointInBox = el.brushStrokes.some(stroke => stroke.some(p => p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2));
        if (anyPointInBox) {
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
  }, [currentActiveElements, isElementLocked]);

  const handleGroupElements = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    pushHistory();

    // 선택된 요소들의 최상위 부모 노드들을 수집
    const topLevelTargetIds = Array.from(new Set(selectedElementIds.map(id => getTopLevelGroupOrElement(id))));
    const topLevelGroups = elements.filter(el => el.type === 'group' && topLevelTargetIds.includes(el.id));
    const topLevelStandaloneEls = elements.filter(el => el.type !== 'group' && topLevelTargetIds.includes(el.id));

    // 케이스 1: 기존 그룹이 정확히 1개 존재하고 독립 요소들이 선택된 경우
    // -> 신규 그룹 생성 없이 독립 요소들을 기존 그룹의 자식 멤버로 흡수/통합!
    if (topLevelGroups.length === 1 && topLevelStandaloneEls.length > 0) {
      const targetGroup = topLevelGroups[0];
      const standaloneIds = topLevelStandaloneEls.map(el => el.id);

      setElements(prev => prev.map(el => {
        if (standaloneIds.includes(el.id)) {
          return {
            ...el,
            parentMapId: targetGroup.id
          };
        }
        return el;
      }));

      setMapExpandedFolderIds(prev => prev.includes(targetGroup.id) ? prev : [...prev, targetGroup.id]);
      const allMembers = collectAllMemberElements([targetGroup.id]).map(m => m.id);
      setSelectedElementId(targetGroup.id);
      setSelectedElementIds(allMembers);
      return;
    }

    // 케이스 2 & 3: 복수 그룹 묶음(중첩 그룹 생성) 또는 독립 요소들 신규 그룹화
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
        // 최상위 노드들만 신규 상위 그룹의 자식으로 등록 (기존 그룹 내부 자식 소속은 온전히 유지!)
        if (topLevelTargetIds.includes(el.id)) {
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
    const newAllMembers = collectAllMemberElements([groupId]).map(m => m.id);
    setSelectedElementId(groupId);
    setSelectedElementIds(newAllMembers.length > 0 ? newAllMembers : [groupId]);
  }, [selectedElementIds, elements, currentMapId, pushHistory, getTopLevelGroupOrElement, collectAllMemberElements]);

  const handleUngroupElements = useCallback((groupIdsToUngroup: string[], memberIdsToRelease: string[]) => {
    pushHistory();

    setElements(prev => {
      let updated = prev.map(el => {
        if (memberIdsToRelease.includes(el.id)) {
          const parentGroup = prev.find(p => p.id === el.parentMapId);
          return {
            ...el,
            parentMapId: parentGroup ? parentGroup.parentMapId : currentMapId
          };
        }
        if (groupIdsToUngroup.includes(el.parentMapId)) {
          const parentGroup = prev.find(p => p.id === el.parentMapId);
          return {
            ...el,
            parentMapId: parentGroup ? parentGroup.parentMapId : currentMapId
          };
        }
        return el;
      });

      updated = updated.filter(el => !(el.type === 'group' && groupIdsToUngroup.includes(el.id)));
      return updated;
    });

    setSelectedElementIds(prev => prev.filter(id => !groupIdsToUngroup.includes(id)));
    if (selectedElementId && groupIdsToUngroup.includes(selectedElementId)) {
      setSelectedElementId(null);
    }
  }, [currentMapId, pushHistory, selectedElementId]);

  const handleLeaveGroup = useCallback((elementId: string) => {
    const el = elements.find(item => item.id === elementId);
    if (!el) return;
    
    const parentGroup = elements.find(p => p.id === el.parentMapId && p.type === 'group');
    if (!parentGroup) return;

    pushHistory();

    setElements(prev => prev.map(item => {
      if (item.id === elementId) {
        return {
          ...item,
          parentMapId: parentGroup.parentMapId
        };
      }
      return item;
    }));
  }, [elements, pushHistory]);

  const handleUngroupSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;

    const selectedGroups = elements.filter(el => selectedElementIds.includes(el.id) && el.type === 'group');
    const selectedGroupIds = selectedGroups.map(g => g.id);

    const selectedMembersInGroups = elements.filter(el => 
      selectedElementIds.includes(el.id) && 
      el.type !== 'group' && 
      elements.some(p => p.id === el.parentMapId && p.type === 'group')
    );
    const selectedMemberIds = selectedMembersInGroups.map(m => m.id);

    if (selectedGroupIds.length > 0 || selectedMemberIds.length > 0) {
      handleUngroupElements(selectedGroupIds, selectedMemberIds);
    }
  }, [selectedElementIds, elements, handleUngroupElements]);



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
        if (e.shiftKey) {
          handleUngroupSelected();
        } else {
          const topLevelTargetIds = Array.from(new Set(selectedElementIds.map(id => getTopLevelGroupOrElement(id))));
          if (topLevelTargetIds.length === 1 && elements.some(el => el.id === topLevelTargetIds[0] && el.type === 'group')) {
            handleUngroupSelected();
          } else {
            handleGroupElements();
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleUndo, handleRedo, handleGroupElements, handleUngroupSelected, selectedElementIds, elements, getTopLevelGroupOrElement]);

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
    bookmarksKey: `novelflow_worldmap_bookmarks_${selectedProject.id}`,
  }), [selectedProject.id]);

  const isGuest = !user || user.id === 'guest-user-id' || selectedProject.id.startsWith('mock-');

  // --- 초기 로드: Supabase 우선, 없으면 localStorage, 없으면 기본값 ---
  useEffect(() => {
    if (!selectedProject) return;

    const { elementKey, snapshotKey, configKey, charPosKey, bookmarksKey } = getStorageKeys();

    const applyData = (data: {
      elements?: MapElement[];
      snapshots?: MapSnapshot[];
      config?: { customBgImage: string | null; presetBg: string; scale: MapScale; gridSize?: number };
      characterPositions?: Record<string, Record<string, { x: number; y: number; trail: Array<{ x: number; y: number }> }>>;
      savedBookmarks?: Array<{ id: string; name: string; x: number; y: number; zoom: number }>;
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
        setActiveSnapshotId(data.snapshots[data.snapshots.length - 1].id);
      } else {
        const defaultSnaps: MapSnapshot[] = [
          { id: 'snap-default', order: 0, name: '1권 시작 기준', date: '작중 932년 4월', description: '평화로운 아이론 왕국 영토와 가문 세력권.' },
          { id: 'snap-war', order: 1, name: '동부 요새 함락 사건', date: '작중 932년 10월', description: '제국의 흑마법 기습 침공으로 동부 요새가 함락되고 소실됨.' },
          { id: 'snap-fall', order: 2, name: '제국 연합군 병합 완료', date: '작중 933년 6월', description: '아이론 북동부 요충지가 완전히 함락되어 제국 영토로 편입됨.' }
        ];
        setSnapshots(defaultSnaps);
        setActiveSnapshotId(defaultSnaps[defaultSnaps.length - 1].id);
      }

      if (data.config) {
        setPresetBg((data.config.presetBg as 'vintage' | 'cosmic' | 'grid') || 'vintage');
        setScale(data.config.scale || { pixels: 100, value: 50, unit: 'km' });
        if (data.config.gridSize && typeof data.config.gridSize === 'number') {
          setGridSize(Math.max(5, Math.min(1000, data.config.gridSize)));
        }
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

      if (data.savedBookmarks) {
        setSavedBookmarks(data.savedBookmarks);
      }
    };

    const loadFromLocalStorage = () => {
      const savedElements = localStorage.getItem(elementKey);
      const savedSnapshots = localStorage.getItem(snapshotKey);
      const savedConfig = localStorage.getItem(configKey);
      const savedCharPos = localStorage.getItem(charPosKey);
      const savedBms = localStorage.getItem(bookmarksKey);
      applyData({
        elements: savedElements ? JSON.parse(savedElements) : undefined,
        snapshots: savedSnapshots ? JSON.parse(savedSnapshots) : undefined,
        config: savedConfig ? JSON.parse(savedConfig) : undefined,
        characterPositions: savedCharPos ? JSON.parse(savedCharPos) : undefined,
        savedBookmarks: savedBms ? JSON.parse(savedBms) : undefined,
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
            config?: { customBgImage: string | null; presetBg: string; scale: MapScale; gridSize?: number };
            characterPositions?: Record<string, Record<string, { x: number; y: number; trail: Array<{ x: number; y: number }> }>>;
            savedBookmarks?: Array<{ id: string; name: string; x: number; y: number; zoom: number }>;
          };
          applyData(wm);
          // localStorage에도 캐시
          if (wm.elements) localStorage.setItem(elementKey, JSON.stringify(wm.elements));
          if (wm.snapshots) localStorage.setItem(snapshotKey, JSON.stringify(wm.snapshots));
          if (wm.config) localStorage.setItem(configKey, JSON.stringify(wm.config));
          if (wm.characterPositions) localStorage.setItem(charPosKey, JSON.stringify(wm.characterPositions));
          if (wm.savedBookmarks) localStorage.setItem(bookmarksKey, JSON.stringify(wm.savedBookmarks));
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
    const { elementKey, snapshotKey, configKey, charPosKey, bookmarksKey } = getStorageKeys();

    // localStorage 즉시 갱신 (캐시)
    localStorage.setItem(elementKey, JSON.stringify(elements));
    localStorage.setItem(snapshotKey, JSON.stringify(snapshots));
    localStorage.setItem(configKey, JSON.stringify({ customBgImage: null, presetBg, scale, gridSize }));
    localStorage.setItem(charPosKey, JSON.stringify(characterPositions));
    localStorage.setItem(bookmarksKey, JSON.stringify(savedBookmarks));

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
              config: { customBgImage: null, presetBg, scale, gridSize },
              characterPositions,
              savedBookmarks,
            }
          })
          .eq('id', selectedProject.id);
        if (error) throw error;
      } catch (err) {
        console.error('WorldMap: Supabase 저장 실패:', err);
      }
    }, 2000);
  }, [elements, snapshots, presetBg, scale, gridSize, characterPositions, savedBookmarks, selectedProject, getStorageKeys, isGuest]);

  // 데이터 변경 시 자동 저장 트리거
  useEffect(() => {
    saveWorldMapData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, snapshots, presetBg, scale, gridSize, characterPositions, savedBookmarks]);

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
  const applySnapping = (coords: { x: number; y: number }, excludeElementId?: string): { x: number; y: number; isPointSnapped?: boolean } => {
    let result = { ...coords };
    
    // 1. 점간(Node) 포인트 스냅 (기존 모든 요소들의 꼭짓점, 핀, 붓 궤적 지점, 테두리 코너/중심점과 가깝다면 자동 자석 효과)
    if (pointSnapEnabled) {
      const snapThreshold = 14 / zoom; // 화면상 일정한 자석 임계 거리
      let minDistance = snapThreshold;
      let snappedPt: { x: number; y: number } | null = null;

      for (const el of elements) {
        if (el.parentMapId !== currentMapId) continue;
        if (excludeElementId && el.id === excludeElementId) continue;

        // 핀형 요소 (pin)
        if (el.type === 'pin' && el.x !== undefined && el.y !== undefined) {
          const dist = Math.hypot(coords.x - el.x, coords.y - el.y);
          if (dist < minDistance) {
            minDistance = dist;
            snappedPt = { x: el.x, y: el.y };
          }
        }
        
        // 영역/경로 꼭짓점 (polygon, route)
        if (el.points) {
          for (const pt of el.points) {
            const dist = Math.hypot(coords.x - pt.x, coords.y - pt.y);
            if (dist < minDistance) {
              minDistance = dist;
              snappedPt = { x: pt.x, y: pt.y };
            }
          }
        }

        // 붓 궤적 지점들 (brushStrokes)은 자유 드로잉 영역이므로 점간 자석 스냅 대상에서 제외

        // 사각/원형 테두리 코너 & 중심점 (border_rect, border_circle)
        if ((el.type === 'border_rect' || el.type === 'border_circle') && el.bx !== undefined && el.by !== undefined) {
          const bw = el.bw || 100;
          const bh = el.bh || 100;
          const corners = [
            { x: el.bx, y: el.by },
            { x: el.bx + bw, y: el.by },
            { x: el.bx, y: el.by + bh },
            { x: el.bx + bw, y: el.by + bh },
            { x: el.bx + bw / 2, y: el.by + bh / 2 }
          ];
          for (const pt of corners) {
            const dist = Math.hypot(coords.x - pt.x, coords.y - pt.y);
            if (dist < minDistance) {
              minDistance = dist;
              snappedPt = { x: pt.x, y: pt.y };
            }
          }
        }
      }

      // 캐릭터 위치 (characterPositions)
      if (activeSnapshotId && characterPositions[activeSnapshotId]) {
        Object.values(characterPositions[activeSnapshotId]).forEach(pos => {
          const dist = Math.hypot(coords.x - pos.x, coords.y - pos.y);
          if (dist < minDistance) {
            minDistance = dist;
            snappedPt = { x: pos.x, y: pos.y };
          }
        });
      }

      if (snappedPt) {
        return { x: snappedPt.x, y: snappedPt.y, isPointSnapped: true };
      }
    }
    
    // 2. 격자 스냅
    if (gridSnapEnabled && gridSize > 0) {
      result.x = Math.round(result.x / gridSize) * gridSize;
      result.y = Math.round(result.y / gridSize) * gridSize;
    }
    
    return result;
  };

  // --- 붓 드로잉 외곽 가장자리(Edge) 자석 스냅 연산 함수 ---
  const applyBrushEdgeSnapping = (coords: { x: number; y: number }, brushWidthVal: number): { x: number; y: number } => {
    let result = { ...coords };
    if (!gridSnapEnabled || gridSize <= 0) return result;

    const radius = brushWidthVal / 2;
    const left = coords.x - radius;
    const right = coords.x + radius;
    const top = coords.y - radius;
    const bottom = coords.y + radius;

    const snapLeft = Math.round(left / gridSize) * gridSize;
    const snapRight = Math.round(right / gridSize) * gridSize;
    const snapTop = Math.round(top / gridSize) * gridSize;
    const snapBottom = Math.round(bottom / gridSize) * gridSize;

    const diffLeft = Math.abs(snapLeft - left);
    const diffRight = Math.abs(snapRight - right);
    const diffTop = Math.abs(snapTop - top);
    const diffBottom = Math.abs(snapBottom - bottom);

    if (diffLeft <= diffRight) {
      result.x = snapLeft + radius;
    } else {
      result.x = snapRight - radius;
    }

    if (diffTop <= diffBottom) {
      result.y = snapTop + radius;
    } else {
      result.y = snapBottom - radius;
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
      nextZoom = Math.max(0.1, zoom / zoomFactor);
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
    if (isElementLocked(el.type)) return;

    if (isReadOnly) {
      showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
      return;
    }

    const topGroup = getTopLevelGroupOrElement(el.id);
    const hasGroup = topGroup !== el.id;

    let activeSelectedIds = selectedElementIds;

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      // Ctrl 복수 선택 모드: 그룹에 속한 요소이면 첫 클릭 시 그룹 전체 자식 멤버들이 함께 복수 선택됨!
      const groupMembers = hasGroup ? collectAllMemberElements([topGroup]).map(m => m.id) : [el.id];
      let nextSelectedIds: string[] = [];

      setSelectedElementIds(prev => {
        const isGroupFullySelected = groupMembers.every(id => prev.includes(id));
        if (isGroupFullySelected) {
          // 이미 그룹 전체가 선택되어 있는 상태인 경우 -> 그룹 멤버 전체 해제
          nextSelectedIds = prev.filter(x => !groupMembers.includes(x));
        } else {
          // 아직 그룹이 선택되지 않은 경우 -> 그룹 멤버 전체를 복수 선택 목록에 추가
          nextSelectedIds = Array.from(new Set([...prev, ...groupMembers]));
        }
        setSelectedElementId(nextSelectedIds.length > 0 ? nextSelectedIds[nextSelectedIds.length - 1] : null);
        return nextSelectedIds;
      });

      // Ctrl 복수 선택 상태에서도 선택된 요소 일괄 드래그 이동 가능하도록 초기 좌표 수집
      setIsDraggingElements(true);
      const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
      setElementDragStartCoords(canvasCoords);
      setPreDragElements(JSON.parse(JSON.stringify(elements)));
      setHasMovedDuringDrag(false);

      const members = collectAllMemberElements(selectedElementIds.includes(el.id) ? selectedElementIds : [...selectedElementIds, el.id]);
      const initialCoords: Record<string, {
        x: number;
        y: number;
        w?: number;
        h?: number;
        points?: Array<{ x: number; y: number }>;
        brushStrokes?: Array<Array<{ x: number; y: number }>>;
        brushStrokeObjects?: Array<{ points: Array<{ x: number; y: number }>; width: number; shape?: 'circle' | 'square' }>;
      }> = {};
      members.forEach(item => {
        if (item.type === 'pin') {
          initialCoords[item.id] = { x: item.x || 0, y: item.y || 0 };
        } else if (item.type === 'border_rect' || item.type === 'border_circle' || item.type === 'image') {
          initialCoords[item.id] = { x: item.bx || 0, y: item.by || 0, w: item.bw || 0, h: item.bh || 0 };
        } else if (item.type === 'brush' || item.brushStrokes || item.brushStrokeObjects) {
          initialCoords[item.id] = {
            x: 0,
            y: 0,
            brushStrokes: item.brushStrokes ? JSON.parse(JSON.stringify(item.brushStrokes)) : undefined,
            brushStrokeObjects: item.brushStrokeObjects ? JSON.parse(JSON.stringify(item.brushStrokeObjects)) : undefined,
          };
        } else if (item.points) {
          initialCoords[item.id] = { x: 0, y: 0, points: JSON.parse(JSON.stringify(item.points)) };
        }
      });
      setDragInitialElementsCoords(initialCoords);
      return;
    }

    // Ctrl이 없는 일반 클릭/드래그 모드
    const isTargetAlreadySelected = selectedElementIds.includes(el.id);

    if (isTargetAlreadySelected) {
      // 이미 사이드바/Ctrl/이전 클릭 등을 통해 선택되어 있는 항목을 잡고 드래그하는 경우:
      // 기존 선택 항목들(selectedElementIds)을 100% 온전히 유지하여 그 항목들만 이동!
      activeSelectedIds = selectedElementIds;
      isGroupSelectedBeforeMouseDownRef.current = hasGroup && selectedElementIds.includes(topGroup);
    } else {
      // 신규 요소 마우스다운/드래그 시작:
      if (hasGroup) {
        const groupMembers = collectAllMemberElements([topGroup]).map(m => m.id);
        isGroupSelectedBeforeMouseDownRef.current = false;
        setSelectedElementId(el.id);
        setSelectedElementIds(groupMembers);
        activeSelectedIds = groupMembers;
      } else {
        isGroupSelectedBeforeMouseDownRef.current = false;
        selectSingleElement(el.id);
        activeSelectedIds = [el.id];
      }
    }

    // 요소 드래그 시작
    setIsDraggingElements(true);
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    setElementDragStartCoords(canvasCoords);
    setPreDragElements(JSON.parse(JSON.stringify(elements)));
    setHasMovedDuringDrag(false);
    
    const members = collectAllMemberElements(activeSelectedIds);

    const initialCoords: Record<string, {
      x: number;
      y: number;
      w?: number;
      h?: number;
      points?: Array<{ x: number; y: number }>;
      brushStrokes?: Array<Array<{ x: number; y: number }>>;
      brushStrokeObjects?: Array<{ points: Array<{ x: number; y: number }>; width: number; shape?: 'circle' | 'square' }>;
    }> = {};
    members.forEach(item => {
      if (item.type === 'pin') {
        initialCoords[item.id] = { x: item.x || 0, y: item.y || 0 };
      } else if (item.type === 'border_rect' || item.type === 'border_circle' || item.type === 'image') {
        initialCoords[item.id] = { x: item.bx || 0, y: item.by || 0, w: item.bw || 0, h: item.bh || 0 };
      } else if (item.type === 'brush' || item.brushStrokes || item.brushStrokeObjects) {
        initialCoords[item.id] = {
          x: 0,
          y: 0,
          brushStrokes: item.brushStrokes ? JSON.parse(JSON.stringify(item.brushStrokes)) : undefined,
          brushStrokeObjects: item.brushStrokeObjects ? JSON.parse(JSON.stringify(item.brushStrokeObjects)) : undefined,
        };
      } else if (item.points) {
        initialCoords[item.id] = { x: 0, y: 0, points: JSON.parse(JSON.stringify(item.points)) };
      }
    });
    setDragInitialElementsCoords(initialCoords);
  };

  // --- 테두리 리사이즈 마우스 다운 핸들러 ---
  const handleBorderResizeMouseDown = (
    e: React.MouseEvent,
    el: MapElement,
    dir: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isReadOnly) {
      showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
      return;
    }

    pushHistory();
    setActiveBorderResizeDirection(dir);
    
    const canvasCoords = getCanvasCoords(e.clientX, e.clientY);
    setElementDragStartCoords(canvasCoords);
    setPreDragElements(JSON.parse(JSON.stringify(elements)));
    setHasMovedDuringDrag(false);
    
    const initialCoords: Record<string, { x: number; y: number; w?: number; h?: number; brushStrokes?: Array<Array<{ x: number; y: number }>> }> = {};
    if (el.type === 'brush' && el.brushStrokes) {
      const bbox = getBrushBoundingBox(el.brushStrokes);
      initialCoords[el.id] = {
        x: bbox.minX,
        y: bbox.minY,
        w: bbox.w,
        h: bbox.h,
        brushStrokes: JSON.parse(JSON.stringify(el.brushStrokes))
      };
    } else {
      initialCoords[el.id] = {
        x: el.bx || 0,
        y: el.by || 0,
        w: el.bw || 0,
        h: el.bh || 0
      };
    }
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
      editMode === 'draw_route' ||
      editMode === 'draw_brush'
    )) {
      showAlert('현재 시점 버전 이력을 탐색 중입니다. 편집을 진행하려면 상단 시점 제어 바에서 [편집 잠금 해제]를 클릭하세요.');
      return;
    }

    // 붓 그리기 모드 클릭 (드래그 획 시작)
    if (editMode === 'draw_brush') {
      setIsDrawingBrush(true);
      setCurrentBrushStroke([snapped]);
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
    setHoveredMousePos(currentCoords);

    // 붓 그리기 모드 드래그 중인 경우 (가장자리 자석 스냅 적용)
    if (editMode === 'draw_brush' && isDrawingBrush) {
      const brushEdgeSnapped = applyBrushEdgeSnapping(currentCoords, brushWidth);
      setCurrentBrushStroke(prev => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const dist = Math.hypot(brushEdgeSnapped.x - last.x, brushEdgeSnapped.y - last.y);
          if (dist < 3 / zoom) {
            return prev;
          }
        }
        return [...prev, brushEdgeSnapped];
      });
      return;
    }

    // 테두리 리사이즈 드래그 중인 경우
    if (activeBorderResizeDirection && selectedElementId && elementDragStartCoords) {
      // 이미지 요소 리사이즈 시 스냅 없이 순수 물리 좌표 사용 (Pixel-Perfect 제어)
      const isResizingImage = elements.find(el => el.id === selectedElementId)?.type === 'image';
      const resizeCoords = isResizingImage ? currentCoords : snapped;
      const dx = resizeCoords.x - elementDragStartCoords.x;
      const dy = resizeCoords.y - elementDragStartCoords.y;
      
      setElements(prev => prev.map(item => {
        if (item.id !== selectedElementId) return item;
        
        const initial = dragInitialElementsCoords[item.id];
        if (!initial) return item;
        
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        const initW = initial.w ?? 0;
        const initH = initial.h ?? 0;
        
        if (item.type === 'border_rect' || item.type === 'brush' || item.type === 'image') {
          x1 = initial.x;
          y1 = initial.y;
          x2 = initial.x + initW;
          y2 = initial.y + initH;
        } else if (item.type === 'border_circle') {
          x1 = initial.x - initW;
          y1 = initial.y - initH;
          x2 = initial.x + initW;
          y2 = initial.y + initH;
        } else {
          return item;
        }
        
        let newX1 = x1;
        let newY1 = y1;
        let newX2 = x2;
        let newY2 = y2;
        const minSize = 10;
        
        if (activeBorderResizeDirection === 'top-left') {
          newX1 = Math.min(x1 + dx, x2 - minSize);
          newY1 = Math.min(y1 + dy, y2 - minSize);
        } else if (activeBorderResizeDirection === 'top-right') {
          newX2 = Math.max(x2 + dx, x1 + minSize);
          newY1 = Math.min(y1 + dy, y2 - minSize);
        } else if (activeBorderResizeDirection === 'bottom-left') {
          newX1 = Math.min(x1 + dx, x2 - minSize);
          newY2 = Math.max(y2 + dy, y1 + minSize);
        } else if (activeBorderResizeDirection === 'bottom-right') {
          newX2 = Math.max(x2 + dx, x1 + minSize);
          newY2 = Math.max(y2 + dy, y1 + minSize);
        }
        
        if (item.type === 'brush') {
          const newW = newX2 - newX1;
          const newH = newY2 - newY1;
          const scaleX = initW > 0 ? newW / initW : 1;
          const scaleY = initH > 0 ? newH / initH : 1;

          const initStrokes = initial.brushStrokes || item.brushStrokes || [];
          const nextStrokes = initStrokes.map(stroke => 
            stroke.map(pt => ({
              x: newX1 + (pt.x - x1) * scaleX,
              y: newY1 + (pt.y - y1) * scaleY
            }))
          );

          return {
            ...item,
            brushStrokes: nextStrokes
          };
        } else if (item.type === 'border_rect' || item.type === 'image') {
          return {
            ...item,
            bx: newX1,
            by: newY1,
            bw: newX2 - newX1,
            bh: newY2 - newY1
          };
        } else {
          return {
            ...item,
            bx: (newX1 + newX2) / 2,
            by: (newY1 + newY2) / 2,
            bw: (newX2 - newX1) / 2,
            bh: (newY2 - newY1) / 2
          };
        }
      }));
      setHasMovedDuringDrag(true);
      return;
    }

    // 요소 전체 드래그 이동 (테두리 기준 자석 스냅 연동)
    if (isDraggingElements && elementDragStartCoords) {
      const rawDx = currentCoords.x - elementDragStartCoords.x;
      const rawDy = currentCoords.y - elementDragStartCoords.y;

      if (Math.abs(rawDx) > 1 || Math.abs(rawDy) > 1) {
        setHasMovedDuringDrag(true);
      }

      let finalDx = rawDx;
      let finalDy = rawDy;

      // 격자 자석 스냅 활성화 시: 선택된 요소들의 통합 Bounding Box 테두리가 격자선에 딱 착붙도록 보정
      if (gridSnapEnabled && gridSize > 0 && Object.keys(dragInitialElementsCoords).length > 0) {
        let origMinX = Infinity, origMaxX = -Infinity;
        let origMinY = Infinity, origMaxY = -Infinity;

        Object.values(dragInitialElementsCoords).forEach(initial => {
          if (initial.x !== undefined && initial.y !== undefined) {
            origMinX = Math.min(origMinX, initial.x);
            origMaxX = Math.max(origMaxX, initial.x);
            origMinY = Math.min(origMinY, initial.y);
            origMaxY = Math.max(origMaxY, initial.y);
          }
          if (initial.w !== undefined && initial.h !== undefined && initial.x !== undefined && initial.y !== undefined) {
            origMaxX = Math.max(origMaxX, initial.x + initial.w);
            origMaxY = Math.max(origMaxY, initial.y + initial.h);
          }
          if (initial.points) {
            initial.points.forEach(pt => {
              origMinX = Math.min(origMinX, pt.x);
              origMaxX = Math.max(origMaxX, pt.x);
              origMinY = Math.min(origMinY, pt.y);
              origMaxY = Math.max(origMaxY, pt.y);
            });
          }
          if (initial.brushStrokes) {
            initial.brushStrokes.forEach(stroke => stroke.forEach(pt => {
              origMinX = Math.min(origMinX, pt.x);
              origMaxX = Math.max(origMaxX, pt.x);
              origMinY = Math.min(origMinY, pt.y);
              origMaxY = Math.max(origMaxY, pt.y);
            }));
          }
        });

        if (isFinite(origMinX) && isFinite(origMinY)) {
          const curMinX = origMinX + rawDx;
          const curMaxX = origMaxX + rawDx;
          const curMinY = origMinY + rawDy;
          const curMaxY = origMaxY + rawDy;

          const snapLeft = Math.round(curMinX / gridSize) * gridSize;
          const snapRight = Math.round(curMaxX / gridSize) * gridSize;
          const snapTop = Math.round(curMinY / gridSize) * gridSize;
          const snapBottom = Math.round(curMaxY / gridSize) * gridSize;

          const diffLeft = Math.abs(snapLeft - curMinX);
          const diffRight = Math.abs(snapRight - curMaxX);
          const diffTop = Math.abs(snapTop - curMinY);
          const diffBottom = Math.abs(snapBottom - curMaxY);

          finalDx = diffLeft <= diffRight ? (snapLeft - origMinX) : (snapRight - origMaxX);
          finalDy = diffTop <= diffBottom ? (snapTop - origMinY) : (snapBottom - origMaxY);
        }
      }

      // 점간(Node) 자석 스냅 활성화 시: 드래그 중인 핀 및 꼭짓점이 다른 요소의 점에 접근하면 1:1 자석 착붙
      // (이미지 및 붓 그리기 요소가 포함된 경우 점간 스냅 제외 - 자유 이동 필요)
      const isExcludedFromPointSnap = Object.keys(dragInitialElementsCoords).length > 0 &&
        Object.keys(dragInitialElementsCoords).some(id => {
          const type = elements.find(el => el.id === id)?.type;
          return type === 'image' || type === 'brush';
        });
      if (pointSnapEnabled && Object.keys(dragInitialElementsCoords).length > 0 && !isExcludedFromPointSnap) {
        const snapThreshold = 14 / zoom;
        let minPtDist = snapThreshold;
        let nodeSnappedPt: { x: number; y: number } | null = null;
        let ptDx = finalDx;
        let ptDy = finalDy;

        for (const [elId, initial] of Object.entries(dragInitialElementsCoords)) {
          const checkPoints: Array<{ x: number; y: number }> = [];
          if (initial.x !== undefined && initial.y !== undefined) {
            checkPoints.push({ x: initial.x, y: initial.y });
          }
          if (initial.points && Array.isArray(initial.points)) {
            (initial.points as Array<{ x: number; y: number }>).forEach(pt => checkPoints.push(pt));
          }

          for (const pt of checkPoints) {
            const curPt = { x: pt.x + rawDx, y: pt.y + rawDy };
            const snapped = applySnapping(curPt, elId);
            if (snapped.isPointSnapped) {
              const dist = Math.hypot(snapped.x - curPt.x, snapped.y - curPt.y);
              if (dist < minPtDist) {
                minPtDist = dist;
                ptDx = snapped.x - pt.x;
                ptDy = snapped.y - pt.y;
                nodeSnappedPt = { x: snapped.x, y: snapped.y };
              }
            }
          }
        }

        if (nodeSnappedPt !== null) {
          finalDx = ptDx;
          finalDy = ptDy;
          setHoveredPoint({ x: nodeSnappedPt.x, y: nodeSnappedPt.y, isPointSnapped: true });
        }
      }

      setElements(prev => prev.map(item => {
        const initial = dragInitialElementsCoords[item.id];
        if (!initial) return item;
        
        if (item.type === 'pin') {
          return {
            ...item,
            x: initial.x + finalDx,
            y: initial.y + finalDy
          };
        } else if (item.type === 'border_rect' || item.type === 'border_circle' || item.type === 'image') {
          return {
            ...item,
            bx: initial.x + finalDx,
            by: initial.y + finalDy
          };
        } else if (item.type === 'brush' || item.brushStrokes || item.brushStrokeObjects) {
          const newBrushStrokes = initial.brushStrokes ? initial.brushStrokes.map(stroke => stroke.map(pt => ({
            x: pt.x + finalDx,
            y: pt.y + finalDy
          }))) : item.brushStrokes;

          const newBrushStrokeObjects = initial.brushStrokeObjects ? initial.brushStrokeObjects.map(sObj => ({
            ...sObj,
            points: sObj.points.map(pt => ({
              x: pt.x + finalDx,
              y: pt.y + finalDy
            }))
          })) : item.brushStrokeObjects;

          return {
            ...item,
            brushStrokes: newBrushStrokes,
            brushStrokeObjects: newBrushStrokeObjects
          };
        } else if (item.points && initial.points) {
          return {
            ...item,
            points: initial.points.map(pt => ({
              x: pt.x + finalDx,
              y: pt.y + finalDy
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

    // 다각형 꼭짓점 드래그 편집 모드 (점간 자석 스냅 및 핑 인디케이터 연동)
    if (editMode === 'select' && activeAnchorPointIdx !== null && selectedElementId) {
      const anchorSnapped = applySnapping(currentCoords, selectedElementId);
      setHoveredPoint(anchorSnapped);
      setElements(prev => prev.map(el => {
        if (el.id === selectedElementId && el.points) {
          const nextPoints = [...el.points];
          nextPoints[activeAnchorPointIdx] = { x: anchorSnapped.x, y: anchorSnapped.y };
          return { ...el, points: nextPoints };
        }
        return el;
      }));
    }
  };

  // --- 마우스 업 핸들러 ---
  const handleCanvasMouseUp = (e?: React.MouseEvent) => {
    // 붓 그리기 모드 마우스 업 (획 종료)
    if (editMode === 'draw_brush' && isDrawingBrush) {
      setIsDrawingBrush(false);
      if (currentBrushStroke.length > 0) {
        setTempBrushStrokes(prev => [
          ...prev,
          { points: currentBrushStroke, width: brushWidth, shape: brushShape }
        ]);
      }
      setCurrentBrushStroke([]);
      return;
    }

    // 테두리 리사이즈 완료 처리
    if (activeBorderResizeDirection) {
      if (hasMovedDuringDrag && preDragElements) {
        pushHistory(preDragElements);
      }
      setActiveBorderResizeDirection(null);
      setElementDragStartCoords(null);
      setDragInitialElementsCoords({});
      setPreDragElements(null);
      setHasMovedDuringDrag(false);
      return;
    }

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

  // --- 붓 드로잉 빌드 완성 ---
  const finalizeBrush = () => {
    if (tempBrushStrokes.length === 0) {
      setTempBrushStrokes([]);
      setCurrentBrushStroke([]);
      return;
    }

    pushHistory();
    const newBrushId = `brush-${Date.now()}`;
    const newBrush: MapElement = {
      id: newBrushId,
      name: '새 붓 영역',
      type: 'brush',
      parentMapId: currentMapId,
      brushStrokes: tempBrushStrokes.map(s => s.points),
      brushStrokeObjects: tempBrushStrokes,
      brushWidth: brushWidth,
      brushShape: brushShape,
      color: '#5E6AD2',
      opacity: 0.4,
      category: 'nature',
      summary: '붓으로 칠해진 영역입니다.',
      description: '붓 드로잉으로 생성된 영역입니다. 설명을 추가해보세요.',
      tags: []
    };
    
    setElements(prev => [...prev, newBrush]);
    setSelectedElementId(newBrushId);
    loadElementToEdit(newBrush);
    setIsDetailOpen(true);
    setTempBrushStrokes([]);
    setCurrentBrushStroke([]);
    setEditMode('select');
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
    } else if (el.type === 'image' && el.bx !== undefined && el.by !== undefined) {
      targetX = el.bx + (el.bw ?? 400) / 2;
      targetY = el.by + (el.bh ?? 300) / 2;
    } else if (el.type === 'brush' && el.brushStrokes) {
      const bbox = getBrushBoundingBox(el.brushStrokes);
      targetX = bbox.minX + bbox.w / 2;
      targetY = bbox.minY + bbox.h / 2;
    } else {
      return;
    }

    setPan({
      x: centerX - targetX * zoom,
      y: centerY - targetY * zoom
    });
  };



  // --- 붓 드로잉 패스 빌더 헬퍼 ---
  const buildStrokesPathData = (strokes: Array<Array<{ x: number; y: number }>>) => {
    return strokes
      .map(stroke => {
        if (stroke.length === 0) return '';
        return `M ${stroke[0].x} ${stroke[0].y} ` + stroke.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
      })
      .join(' ');
  };

  // --- 붓 영역 바운딩 박스 계산 헬퍼 ---
  const getBrushBoundingBox = (strokes: Array<Array<{ x: number; y: number }>>) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    strokes.forEach(stroke => {
      stroke.forEach(pt => {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      });
    });

    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      w: maxX - minX,
      h: maxY - minY
    };
  };

  // --- 전체 지도 레이아웃 계층 트리 뷰 빌드 ---
  interface FlatTreeNode {
    id: string;
    name: string;
    type: 'root' | 'pin' | 'polygon' | 'route' | 'border_rect' | 'border_circle' | 'group' | 'brush' | 'image';
    depth: number;
    childMapId?: string;
    parentMapId?: string;
    element?: MapElement;
    path: Array<{ id: string; name: string }>;
  }

  const buildFlatTree = (): FlatTreeNode[] => {
    const list: FlatTreeNode[] = [];
    
    const traverse = (mapId: string, currentPath: Array<{ id: string; name: string }>, depth: number) => {
      // 모든 요소를 순회하되, 핀/영역/경로/붓 등 실제 항목은 종류 필터에 맞춰 필터링
      const mapElements = elements.filter(el => {
        if (el.parentMapId !== mapId) return false;
        if ((el.childMapId && el.childMapId !== '') || el.type === 'group') {
          return true;
        }
        return selectedSidebarTypes.includes(el.type);
      });
      
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
      if (node.type === 'group') {
        const groupMembers = collectAllMemberElements([node.id]).map(m => m.id);
        setSelectedElementId(node.id);
        setSelectedElementIds(groupMembers);
      } else {
        selectSingleElement(node.id);
      }
      if (node.element) {
        loadElementToEdit(node.element);
        setIsDetailOpen(true);
        setTimeout(() => {
          if (node.element) focusOnElement(node.element);
        }, 50);
      }
    }
  };

  // --- 사이드바 트리 Drag & Drop 상태 및 핸들러 ---
  const [sidebarDragSourceId, setSidebarDragSourceId] = useState<string | null>(null);
  const [sidebarDropTargetId, setSidebarDropTargetId] = useState<string | null>(null);

  const handleSidebarDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    setSidebarDragSourceId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSidebarDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (sidebarDropTargetId !== id) {
      setSidebarDropTargetId(id);
    }
  };

  const handleSidebarDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = sidebarDragSourceId || e.dataTransfer.getData('text/plain');
    setSidebarDragSourceId(null);
    setSidebarDropTargetId(null);

    if (!sourceId || sourceId === targetId) return;

    const sourceEl = elements.find(item => item.id === sourceId);
    if (!sourceEl) return;

    // 자기 자신 또는 자기 하위 그룹으로 드래그 시 순환 방지
    if (sourceEl.type === 'group') {
      const allSubMembers = collectAllMemberElements([sourceId]).map(m => m.id);
      if (allSubMembers.includes(targetId)) return;
    }

    pushHistory();

    const targetEl = elements.find(item => item.id === targetId);

    setElements(prev => {
      const next = [...prev];
      const sourceIndex = next.findIndex(item => item.id === sourceId);
      if (sourceIndex === -1) return prev;

      const [removed] = next.splice(sourceIndex, 1);

      if (targetId === 'root') {
        // 루트 노드로 드롭 ➔ 그룹에서 나와 최상위 노드로 탈출!
        removed.parentMapId = currentMapId;
        next.push(removed);
      } else if (targetEl && targetEl.type === 'group') {
        // 그룹 노드로 드롭 ➔ 해당 그룹 내부로 편입!
        removed.parentMapId = targetEl.id;
        const targetIndex = next.findIndex(item => item.id === targetId);
        next.splice(targetIndex + 1, 0, removed);
      } else if (targetEl) {
        // 일반 항목으로 드롭 ➔ 타깃 노드와 동일한 부모 소속으로 배치 & 순서 재배치!
        removed.parentMapId = targetEl.parentMapId;
        const targetIndex = next.findIndex(item => item.id === targetId);
        next.splice(targetIndex, 0, removed);
      } else {
        next.push(removed);
      }

      return next;
    });

    if (targetEl && targetEl.type === 'group') {
      setMapExpandedFolderIds(prev => prev.includes(targetEl.id) ? prev : [...prev, targetEl.id]);
    }
  };

  const handleSidebarDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    setSidebarDragSourceId(null);
    setSidebarDropTargetId(null);
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
    setElementEditBorderWidth(el.type === 'brush' ? (el.brushWidth || 20) : (el.borderWidth || 3));
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
          brushWidth: el.type === 'brush' ? elementEditBorderWidth : el.brushWidth,
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

  const handleElementClick = (el: MapElement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isElementLocked(el.type)) return;
    if (hasMovedDuringDrag) return;

    const topGroup = getTopLevelGroupOrElement(el.id);
    const hasGroup = topGroup !== el.id;
    let targetId = el.id;

    if (editMode === 'select') {
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        // 이미 handleElementMouseDown 시점에 Ctrl 다중 선택 1번 처리가 완결되었으므로, 2중 토글 차단!
        const targetEl = elements.find(x => x.id === el.id) || el;
        loadElementToEdit(targetEl);
        setIsDetailOpen(true);
        focusOnElement(targetEl);
        return;
      } else {
        if (hasGroup) {
          if (isGroupSelectedBeforeMouseDownRef.current) {
            // 2번째 클릭: 이미 마우스다운 직전부터 그룹이 완벽히 선택된 상태에서 다시 뗐을 때만 개별 자식 선택으로 전환
            targetId = el.id;
            selectSingleElement(el.id);
          } else {
            // 첫 번째 클릭: 어디를 누르든 무조건 그룹 전체 선택 유지!
            targetId = topGroup;
            const groupMembers = collectAllMemberElements([topGroup]).map(m => m.id);
            setSelectedElementId(el.id);
            setSelectedElementIds(groupMembers);
          }
        } else {
          targetId = el.id;
          selectSingleElement(el.id);
        }
      }
    } else {
      targetId = el.id;
      selectSingleElement(el.id);
    }
    const targetEl = elements.find(x => x.id === targetId) || el;
    loadElementToEdit(targetEl);
    setIsDetailOpen(true);
    focusOnElement(targetEl);
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
    if (isElementLocked(el.type)) return;
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

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const createdTime = `${yy}-${mm}-${dd}, ${hh}:${min}`;

    const nextId = `snap-${Date.now()}`;
    const newSnap: MapSnapshot = {
      id: nextId,
      order: snapshots.length,
      name: newSnapshotName,
      date: newSnapshotDate,
      description: newSnapshotDesc,
      createdTime
    };
    setSnapshots(prev => [...prev, newSnap]);
    setActiveSnapshotId(nextId);
    setShowNewSnapshotModal(false);
    setNewSnapshotName('');
    setNewSnapshotDate('');
    setNewSnapshotDesc('');
  };

  // --- 버전 관리: 스냅샷 이력 메모/설정 저장 ---
  const handleSaveSnapshotMemo = () => {
    if (!currentSnapshot) return;
    setSnapshots(prev =>
      prev.map(snap =>
        snap.id === currentSnapshot.id
          ? {
              ...snap,
              name: memoEditName.trim() || snap.name,
              date: memoEditDate.trim(),
              description: memoEditDescription.trim(),
            }
          : snap
      )
    );
    setShowMemoModal(false);
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

              {/* 항목 종류 필터 팝오버 (검색창 하단 단독 배치 및 여백 적용) */}
              <div className="relative mt-2 mb-3 px-0.5" ref={sidebarFilterRef}>
                <button
                  type="button"
                  onClick={() => setShowSidebarFilterDropdown(!showSidebarFilterDropdown)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isDark 
                      ? 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.06] text-gray-300' 
                      : 'bg-black/[0.01] border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="w-3 h-3 text-[#7480E2]" />
                    종류 필터
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showSidebarFilterDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSidebarFilterDropdown && (
                  <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-lg border shadow-xl p-3 flex flex-col gap-1.5 ${
                    isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                  }`}>
                    {/* 모두 토글 */}
                    <button
                      type="button"
                      onClick={() => {
                        const allTypes = ['pin', 'brush', 'polygon', 'route', 'border_rect', 'border_circle', 'image'];
                        const isAllChecked = allTypes.every(t => selectedSidebarTypes.includes(t));
                        if (isAllChecked) {
                          setSelectedSidebarTypes([]);
                        } else {
                          setSelectedSidebarTypes(allTypes);
                        }
                      }}
                      className={`flex items-center gap-2 w-full text-left py-1 px-1.5 rounded text-[11px] font-bold transition-colors ${
                        isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.04]'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={['pin', 'brush', 'polygon', 'route', 'border_rect', 'border_circle', 'image'].every(t => selectedSidebarTypes.includes(t))}
                        readOnly
                        className="accent-[#5E6AD2] cursor-pointer w-3.5 h-3.5"
                      />
                      모두
                    </button>
                    
                    <div className={`w-full h-px my-0.5 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                    {/* 개별 종류 필터 목록 (Lucide React 아이콘 및 표준 명칭) */}
                    {[
                      { label: '거점 핀 마커', types: ['pin'], Icon: MapPin },
                      { label: '붓 그리기 영역', types: ['brush'], Icon: Paintbrush },
                      { label: '다각형 영역', types: ['polygon'], Icon: Map },
                      { label: '구역 사각형 테두리', types: ['border_rect'], Icon: Square },
                      { label: '구역 원형 테두리', types: ['border_circle'], Icon: Circle },
                      { label: '이동 교역로', types: ['route'], Icon: Route },
                      { label: '배경 이미지', types: ['image'], Icon: Image }
                    ].map(item => {
                      const isChecked = item.types.every(t => selectedSidebarTypes.includes(t));
                      const IconComp = item.Icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setSelectedSidebarTypes(prev => {
                              const alreadyHas = item.types.every(t => prev.includes(t));
                              if (alreadyHas) {
                                return prev.filter(t => !item.types.includes(t));
                              } else {
                                return Array.from(new Set([...prev, ...item.types]));
                              }
                            });
                          }}
                          className={`flex items-center gap-2 w-full text-left py-1 px-1.5 rounded text-[11px] font-medium transition-colors ${
                            isDark ? 'hover:bg-white/[0.05]' : 'hover:bg-black/[0.04]'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="accent-[#5E6AD2] cursor-pointer w-3.5 h-3.5"
                          />
                          <IconComp className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
                  
                  let NodeIconComp = MapPin;
                  if (node.type === 'root' || (node.childMapId && node.childMapId !== '') || node.type === 'group') {
                    NodeIconComp = isExpanded ? FolderOpen : Folder;
                  } else if (node.type === 'brush') {
                    NodeIconComp = Paintbrush;
                  } else if (node.type === 'polygon') {
                    NodeIconComp = Map;
                  } else if (node.type === 'route') {
                    NodeIconComp = Route;
                  } else if (node.type === 'border_rect') {
                    NodeIconComp = Square;
                  } else if (node.type === 'border_circle') {
                    NodeIconComp = Circle;
                  } else if (node.type === 'image') {
                    NodeIconComp = Image;
                  }

                  return (
                    <div
                      key={node.id}
                      draggable={node.id !== 'root'}
                      onDragStart={(e) => handleSidebarDragStart(e, node.id)}
                      onDragOver={(e) => handleSidebarDragOver(e, node.id)}
                      onDrop={(e) => handleSidebarDrop(e, node.id)}
                      onDragEnd={handleSidebarDragEnd}
                      onClick={() => handleTreeNodeClick(node)}
                      style={{ paddingLeft: `${node.depth * 12 + 6}px` }}
                      className={`flex items-center justify-between py-1 px-2 rounded text-xs cursor-grab active:cursor-grabbing transition-all duration-150 ${
                        sidebarDragSourceId === node.id ? 'opacity-40 scale-95 border border-dashed border-[#5E6AD2]' : ''
                      } ${
                        sidebarDropTargetId === node.id ? 'bg-[#5E6AD2]/30 ring-2 ring-[#7480E2] font-bold' : ''
                      } ${
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
                        
                        <NodeIconComp className="w-3.5 h-3.5 shrink-0 ml-0.5 opacity-85 text-[#5E6AD2]" />
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
        <div className={`relative z-30 shrink-0 border-b ${isDark ? 'bg-[#0E0F12] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>

          {/* 1행: 탭 버튼 + 우측 고정 액션 */}
          <div className={`px-4 flex items-center justify-between gap-4 border-b h-12 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? 'border-white/[0.05]' : 'border-black/[0.05]'}`}>
            {/* 탭 버튼 그룹 */}
            <div className="flex items-center gap-1 shrink-0">
              {([
                { id: 'tool',     Icon: Sparkles,  label: '도구'   },
                { id: 'draw',     Icon: PenTool,   label: '그리기' },
                { id: 'timeline', Icon: History,   label: '시점'   },
                { id: 'settings', Icon: Settings2, label: '설정'   },
              ] as const).map(({ id, Icon, label }) => {
                const isActive = activeHeaderTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveHeaderTab(prev => prev === id ? null : id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'bg-[#5E6AD2] text-white shadow-md shadow-[#5E6AD2]/25'
                        : isDark
                          ? 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-black/[0.05]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 우측 고정: 현재 도구 표시 + Zoom + Undo/Redo + 내보내기 */}
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] font-semibold hidden md:flex items-center gap-1 shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {editMode === 'select' && <><Sparkles className="w-3 h-3 text-[#7480E2] shrink-0" /> 선택/꼭짓점 수정</>}
                {editMode === 'pan' && <><Move className="w-3 h-3 text-[#7480E2] shrink-0" /> 패닝 이동</>}
                {editMode === 'draw_polygon' && <><Layers className="w-3 h-3 text-[#7480E2] shrink-0" /> 영역 그리기</>}
                {editMode === 'add_pin' && <><MapPin className="w-3 h-3 text-[#7480E2] shrink-0" /> 핀 거점 추가</>}
                {editMode === 'draw_route' && <><ChevronRight className="w-3 h-3 text-[#7480E2] shrink-0" /> 선 긋기</>}
                {editMode === 'draw_brush' && <><PenTool className="w-3 h-3 text-[#7480E2] shrink-0" /> 붓 그리기</>}
                {editMode === 'measure' && <><Ruler className="w-3 h-3 text-[#7480E2] shrink-0" /> 거리 측정</>}
                {editMode === 'draw_border_rect' && <><span className="border border-current rounded-sm inline-block w-3 h-3 shrink-0 text-[#7480E2]" /> 사각 테두리</>}
                {editMode === 'draw_border_circle' && <><span className="border border-current rounded-full inline-block w-3 h-3 shrink-0 text-[#7480E2]" /> 원형 테두리</>}
              </span>
              <div className={`w-px h-4 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'} hidden md:block`} />
              <div className={`flex items-center rounded-xl overflow-hidden text-xs border shrink-0 ${isDark ? 'border-white/[0.08] bg-black/20' : 'border-black/[0.08]'}`}>
                <button onClick={() => setZoom(prev => Math.max(0.1, prev - 0.2))} className={`p-1.5 transition-colors shrink-0 ${isDark ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-500'}`}><ZoomOut className="w-3.5 h-3.5 shrink-0" /></button>
                {isEditingZoom ? (
                  <input
                    type="text"
                    value={zoomInputVal}
                    onChange={(e) => {
                      // 규칙 2: 전부 지우는 것(빈 문자열)과 숫자 입력만 허용
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setZoomInputVal(val);
                      }
                    }}
                    onBlur={() => {
                      // 규칙 2, 3: 외부 클릭 시 반영 또는 복구
                      setIsEditingZoom(false);
                      const parsed = parseInt(zoomInputVal, 10);
                      if (isNaN(parsed) || parsed < 10 || parsed > 400) {
                        // 규칙 1, 2: 범위가 아니거나 숫자가 아니거나(전부 지우고 외부 클릭) 이전 값 복구
                        return;
                      }
                      setZoom(parsed / 100);
                    }}
                    onKeyDown={(e) => {
                      // 규칙 3: Enter 시 반영
                      if (e.key === 'Enter') {
                        setIsEditingZoom(false);
                        const parsed = parseInt(zoomInputVal, 10);
                        if (isNaN(parsed) || parsed < 10 || parsed > 400) {
                          // 규칙 1: 범위가 아니거나 숫자가 아니면 이전 값 복구
                          return;
                        }
                        setZoom(parsed / 100);
                      } else if (e.key === 'Escape') {
                        setIsEditingZoom(false);
                      }
                    }}
                    autoFocus
                    className="w-12 text-center font-mono text-[10px] font-bold text-[#7480E2] bg-transparent border-none outline-none focus:ring-0 px-1"
                  />
                ) : (
                  <span 
                    onClick={() => {
                      setZoomInputVal(String(Math.round(zoom * 100)));
                      setIsEditingZoom(true);
                    }}
                    className="px-2 font-mono text-[10px] font-bold text-[#7480E2] shrink-0 cursor-pointer hover:bg-[#5E6AD2]/10 rounded transition-colors duration-150 py-0.5"
                    title="클릭하여 직접 줌 배율 수정 (10% ~ 400%)"
                  >
                    {Math.round(zoom * 100)}%
                  </span>
                )}
                <button onClick={() => setZoom(prev => Math.min(4, prev + 0.2))} className={`p-1.5 transition-colors shrink-0 ${isDark ? 'hover:bg-white/[0.06] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-500'}`}><ZoomIn className="w-3.5 h-3.5 shrink-0" /></button>
              </div>
              <button onClick={handleUndo} disabled={undoStack.length === 0} title="실행 취소 (Ctrl+Z)" className={`p-1.5 rounded-lg border transition-colors shrink-0 ${undoStack.length === 0 ? 'opacity-30 cursor-not-allowed border-gray-500/20 text-gray-500' : isDark ? 'border-white/[0.08] hover:bg-white/[0.06] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}><RotateCcw className="w-3.5 h-3.5 shrink-0" /></button>
              <button onClick={handleRedo} disabled={redoStack.length === 0} title="다시 실행 (Ctrl+Y)" className={`p-1.5 rounded-lg border transition-colors shrink-0 ${redoStack.length === 0 ? 'opacity-30 cursor-not-allowed border-gray-500/20 text-gray-500' : isDark ? 'border-white/[0.08] hover:bg-white/[0.06] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'}`}><RotateCw className="w-3.5 h-3.5 shrink-0" /></button>
              <button onClick={handleExportMap} className="p-1.5 px-3 rounded-xl bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-lg shadow-[#5E6AD2]/20"><Download className="w-3.5 h-3.5 shrink-0" />내보내기</button>
            </div>
          </div>

          {/* 2행: 탭 내용 패널 (조건부 렌더링) */}
          {activeHeaderTab && (
            <div className={`relative z-30 px-4 py-2.5 flex items-center gap-4 flex-nowrap overflow-visible animate-in slide-in-from-top-1 duration-150 ${isDark ? 'bg-white/[0.01]' : 'bg-black/[0.01]'}`}>

              {/* ── 1. 도구 탭 ── */}
              {activeHeaderTab === 'tool' && (
                <div className="flex items-center gap-1.5 flex-nowrap shrink-0 text-xs">
                  {[
                    { mode: 'select',           Icon: Sparkles,   label: '선택/편집' },
                    { mode: 'pan',              Icon: Move,       label: '이동/손바닥' },
                  ].map(({ mode, Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => { setEditMode(mode as typeof editMode); setTempPoints([]); setTempBrushStrokes([]); setCurrentBrushStroke([]); }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-150 ${
                        editMode === mode
                          ? 'bg-[#5E6AD2] text-white shadow-sm'
                          : isDark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                    </button>
                  ))}

                  <div className={`w-px h-5 shrink-0 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                  {/* 미니맵 토글 버튼 */}
                  <button
                    onClick={() => setShowMinimap(!showMinimap)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all duration-150 ${
                      showMinimap
                        ? 'bg-[#5E6AD2]/15 border-[#5E6AD2]/30 text-[#7480E2]'
                        : isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.05]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    미니맵 {showMinimap ? '표시 중' : '숨김'}
                  </button>

                  {/* 이름 보기 토글 버튼 (단일화 적용) */}
                  <button
                    onClick={() => setShowElementNames(!showElementNames)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all duration-150 ${
                      showElementNames
                        ? 'bg-[#5E6AD2]/15 border-[#5E6AD2]/30 text-[#7480E2]'
                        : isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.05]'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    이름 보기 {showElementNames ? '켜짐' : '꺼짐'}
                  </button>

                  <div className={`w-px h-5 shrink-0 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                  {/* 격자선 설정 메뉴 */}
                  <div ref={gridMenuRef} className="relative inline-flex items-stretch shrink-0">
                    <div className={`flex items-center rounded-lg shrink-0 transition-all duration-150 ${
                      gridVisible
                        ? 'bg-[#5E6AD2]/10 border border-[#5E6AD2]/30 text-[#7480E2]'
                        : isDark ? 'border border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border border-black/[0.08] text-gray-600 hover:bg-black/[0.05]'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setGridVisible(!gridVisible)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-l-lg hover:bg-white/10"
                      >
                        <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
                        격자선 ({gridSize}px)
                      </button>
                      <div className={`w-px h-3.5 shrink-0 ${gridVisible ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <button
                        type="button"
                        onClick={() => setShowGridMenu(prev => !prev)}
                        className="px-1.5 py-1.5 text-xs font-semibold rounded-r-lg hover:bg-white/10 flex items-center justify-center"
                      >
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>

                    {showGridMenu && (
                      <div className={`absolute left-0 top-full mt-1.5 w-60 rounded-xl border p-3.5 shadow-2xl z-50 flex flex-col gap-2.5 animate-in fade-in-50 zoom-in-95 ${
                        isDark ? 'bg-[#141517] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                      }`}>
                        <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                          <span className="text-[11px] font-bold text-gray-400">격자 간격 수치 입력</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="5"
                              max="1000"
                              value={gridSize}
                              onChange={(e) => setGridSize(Number(e.target.value))}
                              onBlur={() => {
                                setGridSize(prev => Math.max(5, Math.min(1000, prev || 40)));
                              }}
                              className={`w-14 px-1 py-0.5 text-right font-mono text-xs font-bold rounded border bg-transparent ${
                                isDark ? 'border-white/20 text-[#7480E2]' : 'border-black/20 text-[#5E6AD2]'
                              }`}
                            />
                            <span className="text-xs font-bold text-gray-400">px</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-1">
                          <div className="flex justify-between text-[11px] text-gray-400">
                            <span>간격 조절</span>
                            <span>10px ~ 500px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="500"
                            step="5"
                            value={gridSize}
                            onChange={(e) => setGridSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-gray-600/40 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
                          />
                        </div>

                        <div className="space-y-1 mb-1">
                          <span className="text-[10px] font-semibold text-gray-400">빠른 선택:</span>
                          <div className="grid grid-cols-4 gap-1">
                            {[10, 20, 40, 50, 100, 200, 500].map((size) => (
                              <button
                                key={size}
                                onClick={() => setGridSize(size)}
                                className={`py-1 text-[10px] font-bold rounded border transition-colors ${
                                  gridSize === size
                                    ? 'bg-[#5E6AD2] text-white border-[#5E6AD2]'
                                    : isDark ? 'border-white/10 bg-white/[0.04] hover:bg-white/10 text-gray-300' : 'border-black/10 bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                {size}px
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10">
                          <button
                            onClick={() => setGridSnapEnabled(!gridSnapEnabled)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              gridSnapEnabled
                                ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 text-[#7480E2]'
                                : isDark ? 'border-white/10 text-gray-400 hover:bg-white/5' : 'border-black/10 text-gray-600 hover:bg-black/5'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <Magnet className="w-3.5 h-3.5 shrink-0" />
                              격자 자석 스냅
                            </span>
                            <span className="text-[10px] font-bold">
                              {gridSnapEnabled ? 'ON' : 'OFF'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 격자선 자석 스냅 & 점간 자동 스냅 */}
                  {[
                    { Icon: Magnet, label: '격자 자석 스냅', checked: gridSnapEnabled, onChange: setGridSnapEnabled },
                    { Icon: Magnet, label: '점간 자동 스냅', checked: pointSnapEnabled, onChange: setPointSnapEnabled },
                  ].map(({ Icon, label, checked, onChange }) => (
                    <button
                      key={label}
                      onClick={() => onChange(!checked)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all duration-150 ${
                        checked
                          ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 text-[#7480E2]'
                          : isDark ? 'border-white/[0.08] text-gray-500 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-400 hover:bg-black/[0.04]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />{label}
                    </button>
                  ))}

                  <div className={`w-px h-5 shrink-0 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                  {/* 거리 측정 도구 */}
                  <button
                    onClick={() => { setEditMode('measure'); setTempPoints([]); setTempBrushStrokes([]); setCurrentBrushStroke([]); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all duration-150 ${
                      editMode === 'measure'
                        ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white shadow-sm'
                        : isDark ? 'border-white/[0.08] text-gray-500 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-400 hover:bg-black/[0.04]'
                    }`}
                  >
                    <Ruler className="w-3.5 h-3.5 shrink-0" />
                    거리 측정
                  </button>
                  {editMode === 'measure' && measurePoints.length > 1 && (
                    <span className={`text-xs font-bold shrink-0 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {calculateDistanceInfo()}
                    </span>
                  )}
                  {editMode === 'measure' && measurePoints.length > 0 && (
                    <button onClick={() => setMeasurePoints([])} className="px-2 py-1 rounded-lg bg-red-500/15 text-red-400 text-[10px] font-bold hover:bg-red-500/25 border border-red-500/20 transition-colors shrink-0">측정 초기화</button>
                  )}
                </div>
              )}

              {/* ── 2. 그리기 탭 ── */}
              {activeHeaderTab === 'draw' && (
                <div className="flex items-center gap-2 flex-nowrap shrink-0">
                  <button
                    onClick={() => { setEditMode('add_pin'); setTempPoints([]); setTempBrushStrokes([]); setCurrentBrushStroke([]); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-150 ${
                      editMode === 'add_pin'
                        ? 'bg-[#5E6AD2] text-white shadow-sm'
                        : isDark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />핀 거점
                  </button>

                  {/* 포인트 도구 (선 긋기 / 영역 그리기 드롭다운 포함) */}
                  <div ref={pointDropdownRef} className="relative inline-flex items-stretch shrink-0">
                    <div className={`flex items-center rounded-lg shrink-0 transition-all duration-150 ${
                      editMode === 'draw_route' || editMode === 'draw_polygon'
                        ? 'bg-[#5E6AD2] text-white shadow-sm'
                        : isDark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (editMode !== 'draw_polygon' && editMode !== 'draw_route') {
                            setEditMode('draw_polygon');
                          }
                          setTempPoints([]);
                          setTempBrushStrokes([]);
                          setCurrentBrushStroke([]);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-l-lg transition-colors ${
                          editMode === 'draw_route' || editMode === 'draw_polygon'
                            ? 'hover:bg-white/10'
                            : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        포인트
                      </button>
                      <div className={`w-px h-3.5 shrink-0 ${
                        editMode === 'draw_route' || editMode === 'draw_polygon'
                          ? 'bg-white/20'
                          : isDark ? 'bg-white/10' : 'bg-black/10'
                      }`} />
                      <button
                        type="button"
                        onClick={() => setShowPointDropdown(prev => !prev)}
                        className={`px-1.5 py-1.5 text-xs font-semibold rounded-r-lg transition-colors flex items-center justify-center ${
                          editMode === 'draw_route' || editMode === 'draw_polygon'
                            ? 'hover:bg-white/10'
                            : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>

                    {showPointDropdown && (
                      <div className={`absolute left-0 top-full mt-1 z-50 rounded-lg border shadow-xl p-1.5 flex flex-col gap-1 min-w-36 ${
                        isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                      }`}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditMode('draw_route');
                            setTempPoints([]);
                            setShowPointDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold text-left transition-colors ${
                            editMode === 'draw_route'
                              ? 'bg-[#5E6AD2] text-white'
                              : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                          선 긋기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditMode('draw_polygon');
                            setTempPoints([]);
                            setShowPointDropdown(false);
                          }}
                          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold text-left transition-colors ${
                            editMode === 'draw_polygon'
                              ? 'bg-[#5E6AD2] text-white'
                              : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5 shrink-0" />
                          영역 그리기
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 붓 그리기 도구 (굵기 드롭다운 포함) */}
                  <div ref={brushDropdownRef} className="relative inline-flex items-stretch shrink-0">
                    <div className={`flex items-center rounded-lg shrink-0 transition-all duration-150 ${
                      editMode === 'draw_brush'
                        ? 'bg-[#5E6AD2] text-white shadow-sm'
                        : isDark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
                    }`}>
                      <button
                        type="button"
                        onClick={() => { setEditMode('draw_brush'); setTempPoints([]); setTempBrushStrokes([]); setCurrentBrushStroke([]); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-l-lg transition-colors ${
                          editMode === 'draw_brush'
                            ? 'hover:bg-white/10'
                            : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                        }`}
                      >
                        <PenTool className="w-3.5 h-3.5 shrink-0" />
                        붓 그리기
                      </button>
                      <div className={`w-px h-3.5 shrink-0 ${
                        editMode === 'draw_brush'
                          ? 'bg-white/20'
                          : isDark ? 'bg-white/10' : 'bg-black/10'
                      }`} />
                      <button
                        type="button"
                        onClick={() => setShowBrushWidthDropdown(prev => !prev)}
                        className={`px-1.5 py-1.5 text-xs font-semibold rounded-r-lg transition-colors flex items-center justify-center ${
                          editMode === 'draw_brush'
                            ? 'hover:bg-white/10'
                            : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.05]'
                        }`}
                      >
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>
                    {showBrushWidthDropdown && (
                      <div className={`absolute left-0 top-full mt-1 z-50 rounded-lg border shadow-xl p-3 flex flex-col gap-2 min-w-44 ${
                        isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                      }`}>
                        {/* 붓 모양 선택 토글 */}
                        <div className="flex flex-col gap-1 mb-1">
                          <span className="text-[10px] font-bold text-gray-400">붓 모양</span>
                          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/10 dark:bg-white/5">
                            <button
                              type="button"
                              onClick={() => setBrushShape('circle')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                brushShape === 'circle'
                                  ? 'bg-[#5E6AD2] text-white shadow-sm'
                                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Circle className="w-3 h-3 shrink-0" />
                              원형
                            </button>
                            <button
                              type="button"
                              onClick={() => setBrushShape('square')}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[11px] font-semibold transition-all ${
                                brushShape === 'square'
                                  ? 'bg-[#5E6AD2] text-white shadow-sm'
                                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Square className="w-3 h-3 shrink-0" />
                              네모
                            </button>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-gray-400">붓 굵기: {brushWidth}px</span>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={brushWidth}
                          onChange={(e) => setBrushWidth(Number(e.target.value))}
                          className="w-full accent-[#5E6AD2] cursor-pointer"
                        />
                        <div className="grid grid-cols-4 gap-1 mt-1">
                          {[10, 20, 40, 60].map(w => (
                            <button
                              key={w}
                              onClick={() => { setBrushWidth(w); setShowBrushWidthDropdown(false); }}
                              className={`py-1 rounded text-[10px] font-bold border transition-all ${
                                brushWidth === w
                                  ? 'bg-[#5E6AD2] border-[#5E6AD2] text-white'
                                  : isDark ? 'border-white/[0.08] text-gray-400 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-500 hover:bg-black/[0.04]'
                              }`}
                            >
                              {w}px
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 테두리 그리기 도구 (사각/원형 드롭다운 포함) */}
                  <div ref={borderDropdownRef} className="relative">
                    <button
                      onClick={() => setShowBorderDropdown(prev => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all duration-150 ${
                        editMode === 'draw_border_rect' || editMode === 'draw_border_circle'
                          ? 'bg-[#5E6AD2] text-white shadow-sm'
                          : isDark ? 'text-gray-300 hover:text-white hover:bg-white/[0.06]' : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 border-2 border-current rounded-sm inline-block shrink-0" />
                      테두리
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    </button>
                    {showBorderDropdown && (
                      <div className={`absolute left-0 mt-1 z-50 rounded-lg border shadow-xl p-1.5 flex flex-col gap-1 min-w-32 ${
                        isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                      }`}>
                        <button
                          onClick={() => {
                            setEditMode('draw_border_rect');
                            setTempPoints([]);
                            setShowBorderDropdown(false);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-left transition-colors ${
                            editMode === 'draw_border_rect'
                              ? 'bg-[#5E6AD2] text-white'
                              : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                          }`}
                        >
                          <span className="w-3 h-3 border-2 border-current rounded-sm inline-block shrink-0" />
                          사각형
                        </button>
                        <button
                          onClick={() => {
                            setEditMode('draw_border_circle');
                            setTempPoints([]);
                            setShowBorderDropdown(false);
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-left transition-colors ${
                            editMode === 'draw_border_circle'
                              ? 'bg-[#5E6AD2] text-white'
                              : isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'
                          }`}
                        >
                          <span className="w-3 h-3 border-2 border-current rounded-full inline-block shrink-0" />
                          원형
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`w-px h-5 shrink-0 mx-1 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                  {/* 배경 이미지 추가 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      setBgUploadError(null);
                      setShowBgUploadModal(true);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all duration-150 ${
                      isDark ? 'border-white/[0.08] text-gray-300 hover:bg-white/[0.06]' : 'border-black/[0.08] text-gray-600 hover:bg-black/[0.05]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0 text-current" />
                    배경 업로드
                  </button>
                  
                  {/* 완료/초기화 (드로잉 중일 때만 노출) */}
                  {(tempPoints.length > 0 || tempBrushStrokes.length > 0) && (
                    <>
                      <div className={`w-px h-5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                      <button onClick={() => { setTempPoints([]); setTempBrushStrokes([]); setCurrentBrushStroke([]); }} className="px-2.5 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-xs font-bold hover:bg-red-500/25 border border-red-500/20 transition-colors shrink-0">초기화</button>
                      <button onClick={editMode === 'draw_brush' ? finalizeBrush : editMode === 'draw_polygon' ? finalizePolygon : finalizeRoute} className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors shrink-0">완료 {editMode === 'draw_brush' ? `(${tempBrushStrokes.length}획)` : `(${tempPoints.length}점)`}</button>
                    </>
                  )}
                </div>
              )}

              {/* ── 설정 탭 ── */}
              {activeHeaderTab === 'settings' && (
                <div className="flex items-center gap-3 shrink-0 text-xs">
                  {/* 항목 잠그기 (Element Type Locking) 세부 필터 드롭다운 */}
                  <div className="relative" ref={lockFilterRef}>
                    <button
                      onClick={() => setShowLockFilterDropdown(prev => !prev)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 transition-all duration-150 shadow-sm ${
                        lockedElementTypes.length > 0
                          ? 'bg-amber-500/15 border-amber-500/35 text-amber-400 font-extrabold'
                          : isDark ? 'border-white/[0.1] text-gray-300 hover:bg-white/[0.05]' : 'border-black/[0.1] text-gray-700 hover:bg-black/[0.05]'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>항목 잠그기</span>
                      {lockedElementTypes.length > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/30">
                          {lockedElementTypes.length}
                        </span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showLockFilterDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* 항목 잠그기 세부 선택 드롭다운 팝업 */}
                    {showLockFilterDropdown && (
                      <div className={`absolute left-0 mt-2 w-60 rounded-xl shadow-2xl border p-3 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                        isDark ? 'bg-[#121316]/95 border-white/10 backdrop-blur-md text-gray-200' : 'bg-white/95 border-black/10 backdrop-blur-md text-gray-800'
                      }`}>
                        {/* 팝업 헤더 & 모두 잠그기/해제 버튼 */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs">
                          <span className="font-bold flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            잠금 항목 선택
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <button
                              onClick={() => setLockedElementTypes(LOCKABLE_ELEMENT_TYPES.map(x => x.type))}
                              className="text-amber-400 hover:underline font-semibold"
                            >
                              모두 잠금
                            </button>
                            <span className="text-gray-500">|</span>
                            <button
                              onClick={() => setLockedElementTypes([])}
                              className="text-gray-400 hover:underline font-medium"
                            >
                              모두 해제
                            </button>
                          </div>
                        </div>

                        {/* 세부 항목 체크박스 리스트 */}
                        <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5 text-xs">
                          {LOCKABLE_ELEMENT_TYPES.map(({ type, label, Icon }) => {
                            const isChecked = lockedElementTypes.includes(type);
                            return (
                              <label
                                key={type}
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                                  isChecked
                                    ? isDark ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/20' : 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                                    : isDark ? 'hover:bg-white/5 text-gray-300 border border-transparent' : 'hover:bg-black/5 text-gray-700 border border-transparent'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setLockedElementTypes(prev => [...prev, type]);
                                      } else {
                                        setLockedElementTypes(prev => prev.filter(t => t !== type));
                                      }
                                    }}
                                    className="rounded border-gray-400 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                  <span>{label}</span>
                                </div>
                                {isChecked && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`w-px h-5 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                  {/* 표시 레이어 필터 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>표시 레이어:</span>
                    {[
                      { label: '자연 지형', checked: layerVisibility.terrain, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, terrain: v })) },
                      { label: '정치/국경', checked: layerVisibility.political, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, political: v })) },
                      { label: '이동 교역로', checked: layerVisibility.routes, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, routes: v })) },
                      { label: '인물 위치', checked: layerVisibility.characters, onChange: (v: boolean) => setLayerVisibility(prev => ({ ...prev, characters: v })) },
                      { label: '요소 이름', checked: showElementNames, onChange: setShowElementNames },
                      { label: '안개(Fog)', checked: fogVisible, onChange: setFogVisible },
                    ].map(({ label, checked, onChange }) => (
                      <button
                        key={label}
                        onClick={() => onChange(!checked)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all duration-150 ${
                          checked
                            ? 'bg-[#5E6AD2]/20 border-[#5E6AD2]/40 text-[#7480E2]'
                            : isDark ? 'border-white/[0.08] text-gray-500 hover:bg-white/[0.04]' : 'border-black/[0.08] text-gray-400 hover:bg-black/[0.04]'
                        }`}
                      >
                        {checked ? <Eye className="w-3.5 h-3.5 shrink-0" /> : <EyeOff className="w-3.5 h-3.5 shrink-0" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 시점 탭 ── */}
              {activeHeaderTab === 'timeline' && (
                <div className="flex items-center justify-between gap-6 shrink-0 min-w-max select-none">
                  <style>{`
                    @keyframes novela-circular-marquee-anim {
                      0% {
                        transform: translateX(0%);
                      }
                      7.14% {
                        transform: translateX(0%);
                      }
                      100% {
                        transform: translateX(-50%);
                      }
                    }
                    .novela-circular-marquee {
                      display: inline-flex;
                      white-space: nowrap;
                      animation: novela-circular-marquee-anim 14s linear infinite;
                      will-change: transform;
                    }
                  `}</style>
                  {/* 좌측: 현재 시점 표시 및 목록 드롭다운 */}
                  <div className="flex items-center gap-2 relative shrink-0">
                    <span className={`shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>현재 시점:</span>
                    <div className="relative shrink-0" ref={historyDropdownRef}>
                      <button
                        onClick={() => setShowHistoryDropdown(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shrink-0 transition-all ${
                          activeSnapshotId && activeSnapshotId !== 'snap-default'
                            ? 'bg-[#5E6AD2]/10 border-[#5E6AD2]/30 text-[#7480E2] font-bold' 
                            : isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                      >
                        {(() => {
                          const currentName = activeSnapshotId && activeSnapshotId !== 'snap-default' 
                            ? (snapshots.find(s => s.id === activeSnapshotId)?.name || '기본 상태')
                            : '기본 상태';
                          
                          if (currentName.length <= 11) {
                            return <span className="truncate inline-block">{currentName}</span>;
                          }
                          return (
                            <div className="overflow-hidden whitespace-nowrap inline-flex relative max-w-[190px]">
                              <div className="novela-circular-marquee inline-flex shrink-0">
                                <span className="shrink-0 font-bold">{currentName}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                <span className="shrink-0 font-bold">{currentName}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;</span>
                              </div>
                            </div>
                          );
                        })()}
                        <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      </button>

                      {/* 이력 목록 드롭다운 */}
                      {showHistoryDropdown && (
                        <div className={`absolute top-full left-0 mt-1.5 w-80 rounded-xl border p-2 shadow-2xl z-50 flex flex-col gap-1 max-h-80 overflow-y-auto ${
                          isDark ? 'bg-[#141517] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
                        }`}>
                          <button
                            onClick={() => {
                              setActiveSnapshotId('snap-default');
                              setShowHistoryDropdown(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors ${activeSnapshotId === 'snap-default' ? 'text-[#7480E2] font-bold bg-[#5E6AD2]/10' : ''}`}
                          >
                            기본 상태
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
                                    className={`flex-1 text-left px-2.5 py-2 transition-colors flex flex-col gap-1 min-w-0 ${
                                      activeSnapshotId === snap.id ? 'text-[#7480E2] font-bold' : ''
                                    }`}
                                  >
                                    {/* 1행: 이름 & 생성 타임스탬프 */}
                                    <div className="flex items-center justify-between gap-1.5 w-full overflow-hidden">
                                      {snap.name.length <= 10 ? (
                                        <span className="truncate flex-1 font-semibold text-xs">{snap.name}</span>
                                      ) : (
                                        <div className="overflow-hidden whitespace-nowrap inline-flex relative flex-1 min-w-0 max-w-[190px]">
                                          <div className="novela-circular-marquee inline-flex shrink-0">
                                            <span className="shrink-0 font-semibold text-xs">{snap.name}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                            <span className="shrink-0 font-semibold text-xs">{snap.name}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                          </div>
                                        </div>
                                      )}
                                      {snap.createdTime && (
                                        <span className="text-[11px] font-semibold text-[#7480E2] shrink-0 font-mono tracking-tight ml-auto">
                                          {snap.createdTime}
                                        </span>
                                      )}
                                    </div>

                                    {/* 2행: 작중 연도 (메모 위로 이동 & 폰트 확대) */}
                                    {snap.date && (
                                      <span className="text-[11px] text-gray-400 font-mono leading-tight block truncate">
                                        {snap.date}
                                      </span>
                                    )}

                                    {/* 3행: 이력 메모 (1줄 한정 truncate & 폰트 확대) */}
                                    {snap.description && (
                                      <span className="text-xs text-gray-300 font-normal truncate w-full block leading-tight text-left">
                                        {snap.description}
                                      </span>
                                    )}
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSnapshot(snap.id, snap.name);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                                    title="이력 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
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
                        onClick={() => {
                          if (currentSnapshot) {
                            setMemoEditName(currentSnapshot.name || '');
                            setMemoEditDate(currentSnapshot.date || '');
                            setMemoEditDescription(currentSnapshot.description || '');
                          }
                          setShowMemoModal(true);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shrink-0 transition-all ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-300' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-600'
                        }`}
                      >
                        <span className="shrink-0">
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
                        <span className="px-2 py-1 rounded bg-[#5E6AD2]/10 text-[#7480E2] text-[10px] font-bold shrink-0">
                          최신 시점 (편집 가능)
                        </span>
                      ) : (
                        <button
                          onClick={() => setIsSnapshotEditUnlocked(prev => !prev)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] shrink-0 transition-all ${
                            isSnapshotEditUnlocked
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400 font-bold'
                              : isDark ? 'border-white/[0.08] hover:bg-white/[0.04] text-gray-400' : 'border-black/[0.08] hover:bg-black/[0.04] text-gray-500'
                          }`}
                          title="이력을 보고 있는 상태에서 지도를 수정하려면 편집 잠금을 해제하세요."
                        >
                          {isSnapshotEditUnlocked ? <Unlock className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
                          <span className="shrink-0">{isSnapshotEditUnlocked ? '편집 잠금' : '편집 잠금 해제'}</span>
                        </button>
                      )
                    )}
                  </div>

                  {/* 우측: 시점 이동 제어판 및 이력 생성 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 shrink-0">
                      {/* 가장 옛날 이력으로 이동 */}
                      <button
                        onClick={() => {
                          if (snapshots.length > 0) {
                            setActiveSnapshotId(snapshots[0].id);
                          }
                        }}
                        disabled={snapshots.length === 0}
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04] disabled:opacity-40' : 'border-black/[0.08] hover:bg-black/[0.04] disabled:opacity-40'
                        }`}
                        title="가장 옛날 이력으로 이동"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5 shrink-0" />
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
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                        title="이전 이력으로 이동"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
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
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-black/[0.08] hover:bg-black/[0.04]'
                        }`}
                        title="다음 이력으로 이동"
                      >
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      </button>

                      {/* 가장 최근 이력으로 이동 */}
                      <button
                        onClick={() => {
                          if (snapshots.length > 0) {
                            setActiveSnapshotId(snapshots[snapshots.length - 1].id);
                          }
                        }}
                        disabled={snapshots.length === 0}
                        className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
                          isDark ? 'border-white/[0.08] hover:bg-white/[0.04] disabled:opacity-40' : 'border-black/[0.08] hover:bg-black/[0.04] disabled:opacity-40'
                        }`}
                        title="가장 최근 이력으로 이동"
                      >
                        <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    </div>

                    <div className={`w-px h-4 shrink-0 ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />

                    {/* 이력 생성 버튼 */}
                    <button
                      onClick={() => setShowNewSnapshotModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#7480E2] text-white shrink-0 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span className="shrink-0">새 시점 추가</span>
                    </button>
                  </div>
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
          
          {/* SVG 드로잉 및 패닝 컨테이너 (GPU 가속 & 지연 무무 1:1 추종) */}
          <div 
            className="absolute transform-gpu origin-top-left pointer-events-none"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
              willChange: 'transform',
              width: '10000px',
              height: '10000px'
            }}
          >
            {/* 메인 SVG 드로잉/배경/격자 레이어 (LOD 모아레 방지 연산 포함) */}
            {(() => {
              // 줌아웃 시 격자 과밀(모아레 현상) 방지 LOD 계산
              let effectiveGridSize = gridSize;
              while (effectiveGridSize * zoom < 14 && effectiveGridSize < gridSize * 32) {
                effectiveGridSize *= 2;
              }

              return (
                <svg 
                  className="absolute inset-0 w-full h-full overflow-visible"
                  style={{ pointerEvents: 'auto' }}
                >
                  <defs>
                    <pattern id="grid-pattern" width={effectiveGridSize} height={effectiveGridSize} patternUnits="userSpaceOnUse">
                      <path 
                        d={`M 0 0 H ${effectiveGridSize} M 0 0 V ${effectiveGridSize}`} 
                        fill="none" 
                        stroke={isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.32)"} 
                        strokeWidth={Math.max(1, 1.2 / zoom)} 
                        shapeRendering="crispEdges"
                      />
                    </pattern>
                  </defs>

              {/* 1. 복수 개 업로드 가능한 이미지 요소 레이어 */}
              {selectedSidebarTypes.includes('image') && currentActiveElements
                .filter(el => el.type === 'image')
                .map(el => {
                  const state = el.statesBySnapshot?.[activeSnapshotId];
                  const isVisible = state ? state.visible : true;
                  if (!isVisible) return null;

                  const isSelected = isElementSelected(el.id);
                  const isDraggingThis = isSelected && isDraggingElements;
                  const bx = el.bx ?? 0;
                  const by = el.by ?? 0;
                  const bw = el.bw || 400;
                  const bh = el.bh || 300;
                  // base64 → ObjectURL 변환 (브라우저 Decoded Image Cache 활용으로 repaint 비용 차단)
                  const renderUrl = getImageRenderUrl(el.imageAttachment);

                  return (
                    <g
                      key={el.id}
                      // SVG x/y 속성 직접 수정(Reflow 유발) 대신 translate3d로 GPU Composite 레이어 이동
                      style={{
                        transform: `translate(${bx}px, ${by}px)`,
                        // 드래그 중인 경우 will-change: transform으로 GPU 레이어 미리 승격
                        willChange: isDraggingThis ? 'transform' : 'auto',
                      }}
                      onMouseEnter={() => setHoveredElementId(el.id)}
                      onMouseLeave={() => setHoveredElementId(null)}
                    >
                      <image
                        href={renderUrl}
                        x={0}
                        y={0}
                        width={bw}
                        height={bh}
                        preserveAspectRatio="none"
                        opacity={el.opacity !== undefined ? el.opacity : 0.85}
                        onMouseDown={(e) => handleElementMouseDown(e, el)}
                        onClick={(e) => handleElementClick(el, e)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleElementDoubleClick(el);
                        }}
                        style={{
                          pointerEvents: 'auto',
                          // transition 완전 제거: 드래그 시 200ms 보간 충돌로 cursor를 못 따라오는 현상 방지
                          transition: 'none',
                        }}
                        className={`${isElementLocked(el.type) ? 'cursor-not-allowed' : editMode === 'select' ? 'cursor-move' : 'cursor-pointer'}`}
                      />
                      {/* 선택 상태일 때만 외곽선 가이드라인 표시 */}
                      {isSelected && (
                        <rect
                          x={0}
                          y={0}
                          width={bw}
                          height={bh}
                          fill="none"
                          stroke="#E74C3C"
                          strokeWidth="1.5"
                          strokeDasharray="4,3"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}
                    </g>
                  );
                })}

              {/* 2. 배경 격자 Grid 렌더링 (Dynamic Viewport Grid Rendering으로 초거대 크기 브라우저 렌더링 디스카드 버그 원천 해결 및 GPU 래스터 부하 최소화) */}
              {gridVisible && (() => {
                const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
                const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);
                
                const pad = 200;
                const x = -pan.x / zoom - pad;
                const y = -pan.y / zoom - pad;
                const w = containerW / zoom + pad * 2;
                const h = containerH / zoom + pad * 2;
                
                return (
                  <rect 
                    x={x} 
                    y={y} 
                    width={w} 
                    height={h} 
                    fill="url(#grid-pattern)" 
                    style={{ pointerEvents: 'none' }} 
                  />
                );
              })()}
              {/* 다각형 면적 레이어 */}
              {layerVisibility.political && selectedSidebarTypes.includes('polygon') && currentActiveElements
                .filter(el => el.type === 'polygon')
                .map(el => {
                  const state = el.statesBySnapshot?.[activeSnapshotId];
                  const isVisible = state ? state.visible : true;
                  if (!isVisible) return null;

                  const color = state?.color || el.color || '#5E6AD2';
                  const opacity = el.opacity || 0.3;
                  const ptsString = el.points?.map(p => `${p.x},${p.y}`).join(' ') || '';
                  const isSelected = isElementSelected(el.id);

                  return (
                    <g 
                      key={el.id}
                      onMouseEnter={() => setHoveredElementId(el.id)}
                      onMouseLeave={() => setHoveredElementId(null)}
                    >
                      {/* 본체 채우기 */}
                      <polygon 
                        points={ptsString}
                        fill={color}
                        fillOpacity={opacity}
                        stroke={isSelected ? "#E74C3C" : color}
                        strokeWidth={isSelected ? "4.5" : "3.5"}
                        strokeDasharray={el.statesBySnapshot?.[activeSnapshotId] ? "6,4" : undefined}
                        onMouseDown={(e) => handleElementMouseDown(e, el)}
                        onClick={(e) => handleElementClick(el, e)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleElementDoubleClick(el);
                        }}
                        className={`transition-colors duration-200 ${
                          isElementLocked(el.type) ? 'cursor-not-allowed' : editMode === 'select' ? 'cursor-move' : 'cursor-pointer hover:stroke-white'
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
              {layerVisibility.routes && selectedSidebarTypes.includes('route') && currentActiveElements
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
                    <g 
                      key={el.id}
                      onMouseEnter={() => setHoveredElementId(el.id)}
                      onMouseLeave={() => setHoveredElementId(null)}
                    >
                      <polyline 
                        points={ptsString}
                        fill="none"
                        stroke={isSelected ? "#E74C3C" : color}
                        strokeWidth={isSelected ? "5" : "4"}
                        strokeDasharray="8,6"
                        onMouseDown={(e) => handleElementMouseDown(e, el)}
                        onClick={(e) => handleElementClick(el, e)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          handleElementDoubleClick(el);
                        }}
                        className={`transition-colors duration-200 ${
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
                          onClick={(e) => handleElementClick(el, e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                        />
                      )}
                    </g>
                  );
                })}

              {/* 붓 그리기 영역 레이어 */}
              {layerVisibility.political && selectedSidebarTypes.includes('brush') && currentActiveElements
                .filter(el => el.type === 'brush')
                .map(el => {
                  const state = el.statesBySnapshot?.[activeSnapshotId];
                  const isVisible = state ? state.visible : true;
                  if (!isVisible) return null;

                  const isSelected = isElementSelected(el.id);
                  const color = state?.color || el.color || '#5E6AD2';
                  const baseOpacity = el.opacity !== undefined ? el.opacity : 0.4;
                  const opacity = isSelected ? Math.min(1, baseOpacity + 0.2) : baseOpacity;
                  const brushWidthVal = el.brushWidth || 20;
                  const pathData = buildStrokesPathData(el.brushStrokes || []);

                  return (
                    <g 
                      key={el.id}
                      onMouseEnter={() => setHoveredElementId(el.id)}
                      onMouseLeave={() => setHoveredElementId(null)}
                    >
                      {/* 실제 붓 영역 표현 (획 별 개별 굵기 및 형태 보존) */}
                      {el.brushStrokeObjects && el.brushStrokeObjects.length > 0 ? (
                        el.brushStrokeObjects.map((sObj, sIdx) => {
                          const sPathData = buildStrokesPathData([sObj.points]);
                          const sWidth = sObj.width || el.brushWidth || 20;
                          const sShape = sObj.shape || el.brushShape || 'circle';
                          return (
                            <path
                              key={sIdx}
                              d={sPathData}
                              fill="none"
                              stroke={isSelected ? '#E74C3C' : color}
                              strokeWidth={sWidth}
                              strokeLinecap={sShape === 'square' ? 'square' : 'round'}
                              strokeLinejoin={sShape === 'square' ? 'miter' : 'round'}
                              opacity={opacity}
                              onMouseDown={(e) => handleElementMouseDown(e, el)}
                              onClick={(e) => handleElementClick(el, e)}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleElementDoubleClick(el);
                              }}
                              className={`transition-colors duration-200 ${
                                editMode === 'select' ? 'cursor-move' : 'cursor-pointer hover:opacity-80'
                              }`}
                            />
                          );
                        })
                      ) : (
                        <path
                          d={pathData}
                          fill="none"
                          stroke={isSelected ? '#E74C3C' : color}
                          strokeWidth={brushWidthVal}
                          strokeLinecap={el.brushShape === 'square' ? 'square' : 'round'}
                          strokeLinejoin={el.brushShape === 'square' ? 'miter' : 'round'}
                          opacity={opacity}
                          onMouseDown={(e) => handleElementMouseDown(e, el)}
                          onClick={(e) => handleElementClick(el, e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                          className={`transition-colors duration-200 ${
                            editMode === 'select' ? 'cursor-move' : 'cursor-pointer hover:opacity-80'
                          }`}
                        />
                      )}
                      {/* 드래그 및 마우스 감지를 위한 투명 캡슐 패스 */}
                      {editMode === 'select' && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={brushWidthVal + 10}
                          strokeLinecap={el.brushShape === 'square' ? 'square' : 'round'}
                          strokeLinejoin={el.brushShape === 'square' ? 'miter' : 'round'}
                          className="cursor-move pointer-events-auto"
                          onMouseDown={(e) => handleElementMouseDown(e, el)}
                          onClick={(e) => handleElementClick(el, e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                        />
                      )}
                    </g>
                  );
                })}

              {/* 붓 드로잉 중일 때 실시간 프리뷰 */}
              {editMode === 'draw_brush' && (tempBrushStrokes.length > 0 || currentBrushStroke.length > 0) && (
                <g style={{ pointerEvents: 'none' }}>
                  {tempBrushStrokes.map((sObj, idx) => (
                    <path
                      key={idx}
                      d={buildStrokesPathData([sObj.points])}
                      fill="none"
                      stroke="#5E6AD2"
                      strokeWidth={sObj.width}
                      strokeLinecap={sObj.shape === 'square' ? 'square' : 'round'}
                      strokeLinejoin={sObj.shape === 'square' ? 'miter' : 'round'}
                      opacity={0.4}
                    />
                  ))}
                  {currentBrushStroke.length > 0 && (
                    <path
                      d={buildStrokesPathData([currentBrushStroke])}
                      fill="none"
                      stroke="#5E6AD2"
                      strokeWidth={brushWidth}
                      strokeLinecap={brushShape === 'square' ? 'square' : 'round'}
                      strokeLinejoin={brushShape === 'square' ? 'miter' : 'round'}
                      opacity={0.4}
                    />
                  )}
                </g>
              )}

              {/* 붓 드로잉 마우스 포인터 브러시 크기 가이드 (원형 vs 네모) */}
              {editMode === 'draw_brush' && hoveredPoint && (
                brushShape === 'square' ? (
                  <rect
                    x={hoveredPoint.x - brushWidth / 2}
                    y={hoveredPoint.y - brushWidth / 2}
                    width={brushWidth}
                    height={brushWidth}
                    fill="rgba(94, 106, 210, 0.15)"
                    stroke="#5E6AD2"
                    strokeWidth="1.5"
                    style={{ pointerEvents: 'none' }}
                  />
                ) : (
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={brushWidth / 2}
                    fill="rgba(94, 106, 210, 0.15)"
                    stroke="#5E6AD2"
                    strokeWidth="1.5"
                    style={{ pointerEvents: 'none' }}
                  />
                )
              )}

              {/* 테두리 (사각형 및 원형) 레이어 */}
              {layerVisibility.political && selectedSidebarTypes.includes('polygon') && currentActiveElements
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
                      <g 
                        key={el.id}
                        onMouseEnter={() => setHoveredElementId(el.id)}
                        onMouseLeave={() => setHoveredElementId(null)}
                      >
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
                          onClick={(e) => handleElementClick(el, e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                          className={`transition-colors duration-200 ${isSelected ? 'stroke-[4px]' : 'hover:stroke-white'} ${editMode === 'select' ? 'cursor-move' : 'cursor-pointer'}`}
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
                      <g 
                        key={el.id}
                        onMouseEnter={() => setHoveredElementId(el.id)}
                        onMouseLeave={() => setHoveredElementId(null)}
                      >
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
                          onClick={(e) => handleElementClick(el, e)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            handleElementDoubleClick(el);
                          }}
                          className={`transition-colors duration-200 ${isSelected ? 'stroke-[4px]' : 'hover:stroke-white'} ${editMode === 'select' ? 'cursor-move' : 'cursor-pointer'}`}
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

              {/* 점간(Node) 자석 스냅 시각적 가이드 인디케이터 (animate-ping 제거로 (0,0) 이동 잔상 원천 차단) */}
              {hoveredPoint && hoveredPoint.isPointSnapped && (
                <g className="pointer-events-none">
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={10 / zoom}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth={2 / zoom}
                    opacity="0.85"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={5 / zoom}
                    fill="#A855F7"
                    stroke="white"
                    strokeWidth={1.5 / zoom}
                  />
                </g>
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
                .filter(el => el.id === selectedElementId && el.points && !isElementLocked(el.type))
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
              
              {/* 선택된 테두리(rect / circle) 및 붓(brush)의 리사이즈 드래그 핸들 (Anchor Points) */}
              {editMode === 'select' && selectedElementId && elements
                .filter(el => el.id === selectedElementId && !isElementLocked(el.type) && (el.type === 'border_rect' || el.type === 'border_circle' || el.type === 'brush' || el.type === 'image'))
                .map(el => {
                  let tl = { x: 0, y: 0 };
                  let tr = { x: 0, y: 0 };
                  let bl = { x: 0, y: 0 };
                  let br = { x: 0, y: 0 };
                  
                  let boxX = 0, boxY = 0, boxW = 0, boxH = 0;

                  if (el.type === 'brush' && el.brushStrokes) {
                    const bbox = getBrushBoundingBox(el.brushStrokes);
                    const bwMargin = (el.brushWidth || 20) / 2;
                    boxX = bbox.minX - bwMargin;
                    boxY = bbox.minY - bwMargin;
                    boxW = bbox.w + bwMargin * 2;
                    boxH = bbox.h + bwMargin * 2;

                    tl = { x: boxX, y: boxY };
                    tr = { x: boxX + boxW, y: boxY };
                    bl = { x: boxX, y: boxY + boxH };
                    br = { x: boxX + boxW, y: boxY + boxH };
                  } else if (el.type === 'border_rect' || el.type === 'image') {
                    const bx = el.bx || 0;
                    const by = el.by || 0;
                    const bw = el.bw || 0;
                    const bh = el.bh || 0;
                    boxX = bx; boxY = by; boxW = bw; boxH = bh;

                    tl = { x: bx, y: by };
                    tr = { x: bx + bw, y: by };
                    bl = { x: bx, y: by + bh };
                    br = { x: bx + bw, y: by + bh };
                  } else { // border_circle
                    const bx = el.bx || 0;
                    const by = el.by || 0;
                    const bw = el.bw || 0;
                    const bh = el.bh || 0;
                    boxX = bx - bw; boxY = by - bh; boxW = bw * 2; boxH = bh * 2;

                    tl = { x: bx - bw, y: by - bh };
                    tr = { x: bx + bw, y: by - bh };
                    bl = { x: bx - bw, y: by + bh };
                    br = { x: bx + bw, y: by + bh };
                  }
                  
                  const anchors: Array<{ dir: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; pt: { x: number; y: number } }> = [
                    { dir: 'top-left', pt: tl },
                    { dir: 'top-right', pt: tr },
                    { dir: 'bottom-left', pt: bl },
                    { dir: 'bottom-right', pt: br }
                  ];
                  
                  return (
                    <g key={`border-resize-${el.id}`}>
                      {/* 가이드 바운딩 박스 선 */}
                      <rect 
                        x={boxX}
                        y={boxY}
                        width={boxW}
                        height={boxH}
                        fill="none"
                        stroke="#E74C3C"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        style={{ pointerEvents: 'none' }}
                      />
                      {anchors.map(({ dir, pt }) => (
                        <circle 
                          key={dir}
                          cx={pt.x}
                          cy={pt.y}
                          r="7"
                          fill="#E74C3C"
                          stroke="white"
                          strokeWidth="2"
                          className={`pointer-events-auto ${
                            dir === 'top-left' || dir === 'bottom-right' ? 'cursor-nwse-resize' : 'cursor-nesw-resize'
                          }`}
                          onMouseDown={(e) => handleBorderResizeMouseDown(e, el, dir)}
                        />
                      ))}
                    </g>
                  );
                })}
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
              );
            })()}

            {/* 호버 라벨 오버레이 팝업 (하한선 2배 확장 Min 16px 보장) */}
            {showElementNames && hoveredElementId && (() => {
              const el = elements.find(x => x.id === hoveredElementId);
              if (!el) return null;

              // 화면 배율 하한선을 2배 확장하여 (Min 16px) 화면 확대 시에도 16px 미만으로 작아지지 않게 보장
              const effectiveZoomForLabel = Math.max(1.0, zoom);
              const targetScreenFontSize = Math.max(16, Math.min(22, Math.round(16 / Math.pow(effectiveZoomForLabel, 0.45))));
              const effectiveFontSize = targetScreenFontSize / zoom;
              const fontScale = effectiveFontSize / 16;

              const labelHeight = 28 * fontScale;
              const labelRx = 5 * fontScale;
              const strokeWidth = 1.3 * fontScale;

              const getLabelWidth = (text: string): number => {
                let width = 0;
                for (let i = 0; i < text.length; i++) {
                  const code = text.charCodeAt(i);
                  if (code >= 0 && code <= 128) {
                    width += 10 * fontScale;
                  } else {
                    width += 18 * fontScale;
                  }
                }
                return width + (18 * fontScale);
              };

              const offsetX = 12 * fontScale;
              const offsetY = 12 * fontScale;

              let pos = { x: 0, y: 0 };
              if (hoveredMousePos) {
                // 마우스 커서의 바로 우측 상단에 띄우기
                pos = { x: hoveredMousePos.x + offsetX, y: hoveredMousePos.y - offsetY };
              } else {
                // Fallback (요소 앵커 위치)
                if (el.type === 'pin') {
                  pos = { x: (el.x || 0) + offsetX, y: (el.y || 0) - (18 * fontScale) };
                } else if (el.type === 'polygon' || el.type === 'route') {
                  const pts = el.points || [];
                  if (pts.length > 0) {
                    let maxX = pts[0].x;
                    let minY = pts[0].y;
                    pts.forEach(p => {
                      if (p.x > maxX) maxX = p.x;
                      if (p.y < minY) minY = p.y;
                    });
                    pos = { x: maxX + offsetX, y: minY - (12 * fontScale) };
                  }
                } else if (el.type === 'brush' && el.brushStrokes) {
                  const bbox = getBrushBoundingBox(el.brushStrokes);
                  pos = { x: bbox.maxX + offsetX, y: bbox.minY - (12 * fontScale) };
                } else if (el.type === 'border_rect' || el.type === 'image') {
                  pos = { x: (el.bx || 0) + (el.bw || 0) + offsetX, y: (el.by || 0) - (12 * fontScale) };
                } else if (el.type === 'border_circle') {
                  pos = { x: (el.bx || 0) + (el.bw || 0) + offsetX, y: (el.by || 0) - (el.bh || 0) - (12 * fontScale) };
                }
              }

              return (
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none select-none">
                  <g filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.35))">
                    <rect
                      x={pos.x}
                      y={pos.y - (20 * fontScale)}
                      rx={labelRx}
                      fill={isDark ? "#121316" : "#FFFFFF"}
                      stroke="#5E6AD2"
                      strokeWidth={strokeWidth}
                      opacity="0.96"
                      height={labelHeight}
                      width={getLabelWidth(el.name)}
                    />
                    <text
                      x={pos.x + (9 * fontScale)}
                      y={pos.y - (2 * fontScale)}
                      fontSize={effectiveFontSize}
                      fontWeight="800"
                      fill={isDark ? "#A5B4FC" : "#4F46E5"}
                    >
                      {el.name}
                    </text>
                  </g>
                </svg>
              );
            })()}

            {/* 4. 절대 배치형 거점 핀(Pin Marker) 리스트 */}
            {layerVisibility.political && selectedSidebarTypes.includes('pin') && currentActiveElements
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
                    className="absolute pointer-events-auto flex flex-col items-center gap-1 group transform -translate-x-1/2 -translate-y-1/2 select-none"
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
                    onClick={(e) => handleElementClick(el, e)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleElementDoubleClick(el);
                    }}
                    onMouseEnter={() => setHoveredElementId(el.id)}
                    onMouseLeave={() => setHoveredElementId(null)}
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

        const parentGroup = elements.find(p => p.id === el.parentMapId && p.type === 'group');

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

              {/* 소속 그룹 정보 */}
              {parentGroup && (
                <div className={`p-2.5 rounded-lg border flex items-center justify-between text-[11px] font-semibold ${
                  isDark ? 'bg-white/[0.03] border-white/[0.08] text-gray-300' : 'bg-black/[0.02] border-black/[0.08] text-gray-600'
                }`}>
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <span className="text-[10px] text-gray-500 font-bold shrink-0">소속 그룹:</span>
                    <span className="truncate text-gray-300 dark:text-white font-bold">{parentGroup.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLeaveGroup(el.id);
                    }}
                    type="button"
                    className="px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all shrink-0 text-[10px] font-bold"
                  >
                    그룹에서 나오기
                  </button>
                </div>
              )}

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
              {el.type === 'brush' && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-gray-400">붓 굵기 (px)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={elementEditBorderWidth}
                      onChange={e => setElementEditBorderWidth(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-[#5E6AD2]/20 rounded-lg appearance-none cursor-pointer accent-[#5E6AD2]"
                    />
                    <span className="font-mono text-xs w-6 text-right">{elementEditBorderWidth}px</span>
                  </div>
                </div>
              )}

              {/* 투명도 조절 */}
              {(el.type === 'polygon' || el.type === 'brush') && (
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

      {/* ── 플로팅 미니맵 (Minimap) ── */}
      {showMinimap && (
        <div
          style={{
            position: 'fixed',
            left: minimapPos ? `${minimapPos.x}px` : 'auto',
            top: minimapPos ? `${minimapPos.y}px` : 'auto',
            right: minimapPos ? 'auto' : '24px',
            bottom: minimapPos ? 'auto' : '24px',
            width: `${minimapSize.width}px`,
            height: `${minimapSize.height}px`,
          }}
          className={`z-40 rounded-2xl border shadow-2xl backdrop-blur-md flex flex-col overflow-hidden select-none ${
            isDraggingMinimap || resizeDir || isNavigatingMinimap ? 'transition-none' : ''
          } ${
            isDark ? 'bg-[#0E0F12]/90 border-white/10 text-gray-200' : 'bg-white/90 border-black/10 text-gray-800'
          }`}
        >
          {/* 미니맵 헤더 (상단 드래그 이동 핸들) */}
          <div
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              // 버튼이나 선택창 클릭 시에는 헤더 창 드래그 제외
              if (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.tagName === 'OPTION' || target.closest('button') || target.closest('select')) {
                return;
              }
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setDragMinimapStart({
                  x: e.clientX,
                  y: e.clientY,
                  posX: rect.left,
                  posY: rect.top,
                });
                setIsDraggingMinimap(true);
              }
            }}
            className={`px-3 py-1.5 border-b flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0 select-none gap-1.5 ${
              isDark ? 'bg-white/[0.04] border-white/10' : 'bg-black/[0.03] border-black/10'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-bold text-[#7480E2]">
              <Map className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">미니맵</span>
            </div>

            {/* 📍 기억한 위치 이동 드롭다운 */}
            <div className="flex items-center gap-1 flex-1 max-w-[150px]">
              <select
                value=""
                onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const targetBm = savedBookmarks.find(b => b.id === selectedId);
                  if (targetBm) {
                    const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
                    const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);
                    const newPanX = (containerW / 2) - (targetBm.x * zoom);
                    const newPanY = (containerH / 2) - (targetBm.y * zoom);
                    setPan({ x: newPanX, y: newPanY });
                  }
                }}
                className={`w-full text-[10px] px-1.5 py-0.5 rounded border outline-none cursor-pointer truncate ${
                  isDark ? 'bg-[#1E1F22] border-white/10 text-gray-300' : 'bg-white border-black/10 text-gray-700'
                }`}
              >
                {savedBookmarks.length === 0 ? (
                  <option value="" disabled>항목 없음</option>
                ) : (
                  <>
                    <option value="" disabled>📍 기억 위치 선택</option>
                    {savedBookmarks.map(bm => (
                      <option key={bm.id} value={bm.id}>{bm.name}</option>
                    ))}
                  </>
                )}
              </select>

              {/* 현재 위치 저장 버튼 */}
              <button
                onClick={() => setShowBookmarkModal(true)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#5E6AD2]/30 transition-colors shrink-0"
                title="현재 시점 위치 기억 (포인트 찍기)"
              >
                <Bookmark className="w-3 h-3 text-[#7480E2]" />
              </button>
            </div>

            {/* 🔍 1. 시점 축소/확대 버튼 그룹 */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setMinimapZoom(prev => Math.max(0.4, prev / 1.25))}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="시점 축소 (-)"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] font-mono font-bold text-gray-400 min-w-[28px] text-center select-none">
                {Math.round(minimapZoom * 100)}%
              </span>
              <button
                onClick={() => setMinimapZoom(prev => Math.min(4.0, prev * 1.25))}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="시점 확대 (+)"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              
              <div className="w-[1px] h-3 bg-white/10 mx-0.5" />

              <button
                onClick={() => {
                  setMinimapPos(null);
                  setMinimapSize({ width: 320, height: 240 });
                  setMinimapZoom(1.0);
                }}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10"
                title="위치/크기 초기화"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowMinimap(false)}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-red-500/20"
                title="닫기"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 미니맵 축소 뷰 캔버스 영역 */}
          <div 
            onWheel={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (e.deltaY < 0) {
                setMinimapZoom(prev => Math.min(4.0, prev * 1.15));
              } else {
                setMinimapZoom(prev => Math.max(0.4, prev / 1.15));
              }
            }}
            className="flex-1 relative overflow-hidden p-2 bg-black/20 flex items-center justify-center select-none"
          >
            {(() => {
              const mapWidth = minimapSize.width - 16;
              const mapHeight = minimapSize.height - 40;
              
              // 현재 선택된 맵 및 시점의 실제 활성화된 레이아웃 요소들
              const activeEls = getAllActiveElementsForMap(currentMapId);

              // 캔버스 물리 규격 (기본 10,000 x 10,000 px)
              const BASE_W = 10000;

              const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
              const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);

              // 현재 지도의 카메라 중심 캔버스 좌표 (CamX, CamY)
              const camX = (-pan.x + containerW / 2) / zoom;
              const camY = (-pan.y + containerH / 2) / zoom;

              // 미니맵 조망 가시 범위 (minimapZoom 반영)
              const spanW = BASE_W / minimapZoom;
              const spanH = (BASE_W * (mapHeight / mapWidth)) / minimapZoom;

              // 시점이 미니맵 중앙에 든든하게 고정되도록 viewBox 설정
              const viewBoxX = camX - spanW / 2;
              const viewBoxY = camY - spanH / 2;

              // 화면 뷰포트 사각형 규격 (캔버스 좌표 기준)
              const rectW = containerW / zoom;
              const rectH = containerH / zoom;

              const handleStartMinimapNav = (e: React.MouseEvent<SVGSVGElement>) => {
                if (e.button === 2) return; // 우클릭 제외
                
                // 마우스 클릭 시 손으로 지도를 잡고 직접 끄는(1:1 Drag-Pan) 모드 활성화
                setNavMinimapStart({
                  mouseX: e.clientX,
                  mouseY: e.clientY,
                  initialPanX: pan.x,
                  initialPanY: pan.y,
                  spanW,
                  spanH,
                  mapWidth,
                  mapHeight,
                });
                setIsNavigatingMinimap(true);
              };

              // 미니맵 배경색 통일: 빈티지일 경우 전체 배경을 갈색톤(#282319 또는 #F4ECD8)으로 통일
              const bgColor = presetBg === 'vintage' ? (isDark ? "#282319" : "#F4ECD8") : (isDark ? "#121316" : "#E5E7EB");

              return (
                <svg
                  width={mapWidth}
                  height={mapHeight}
                  viewBox={`${viewBoxX} ${viewBoxY} ${spanW} ${spanH}`}
                  preserveAspectRatio="none"
                  onMouseDown={handleStartMinimapNav}
                  className="cursor-grab active:cursor-grabbing rounded border border-white/10 shadow-inner select-none overflow-hidden"
                  style={{ backgroundColor: bgColor }}
                >
                  {/* 축소된 메인 배경 그리드 */}
                  <defs>
                    <pattern id="miniGrid" width={gridSize * 4} height={gridSize * 4} patternUnits="userSpaceOnUse">
                      <path d={`M 0 0 H ${gridSize * 4} M 0 0 V ${gridSize * 4}`} fill="none" stroke={isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)"} strokeWidth="1.5" shapeRendering="crispEdges" />
                    </pattern>
                  </defs>
                  
                  {/* 전체 10000x10000 및 뷰포트 전체 통일 배경 */}
                  <rect 
                    x={viewBoxX}
                    y={viewBoxY}
                    width={spanW}
                    height={spanH}
                    fill={bgColor} 
                  />

                  {/* 미니맵 복수 이미지 요소 렌더링 */}
                  {selectedSidebarTypes.includes('image') && currentActiveElements
                    .filter(el => el.type === 'image')
                    .map(el => {
                      const state = el.statesBySnapshot?.[activeSnapshotId];
                      const isVisible = state ? state.visible : true;
                      if (!isVisible) return null;

                      return (
                        <image
                          key={`mini-img-${el.id}`}
                          href={getImageRenderUrl(el.imageAttachment)}
                          x={el.bx}
                          y={el.by}
                          width={el.bw || 400}
                          height={el.bh || 300}
                          opacity={el.opacity !== undefined ? el.opacity : 0.85}
                          preserveAspectRatio="none"
                        />
                      );
                    })}

                  {gridVisible && (
                    <rect 
                      x={viewBoxX} 
                      y={viewBoxY} 
                      width={spanW} 
                      height={spanH} 
                      fill="url(#miniGrid)" 
                    />
                  )}

                  {/* 🌟 100% 미니맵 상에 또렷이 출력되는 모든 나의 레이아웃 요소들 🌟 */}
                  {activeEls.map((el) => {
                    // 1) 붓 스트로크 (brush)
                    if (el.type === 'brush' && el.brushStrokes) {
                      return (
                        <g key={el.id}>
                          {el.brushStrokes.map((stroke, sIdx) => {
                            if (!stroke || stroke.length === 0) return null;
                            const d = stroke.reduce((acc, pt, idx) => {
                              return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                            }, '');
                            return (
                              <path
                                key={sIdx}
                                d={d}
                                fill="none"
                                stroke={el.color || '#38BDF8'}
                                strokeWidth={Math.max(6, (el.brushWidth || 20) * 0.8)}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.85}
                              />
                            );
                          })}
                        </g>
                      );
                    }

                    // 2) 사각형/원형 테두리 (border_rect / border_circle)
                    if (el.type === 'border_rect' && el.bx !== undefined && el.by !== undefined) {
                      return (
                        <rect
                          key={el.id}
                          x={el.bx}
                          y={el.by}
                          width={el.bw || 100}
                          height={el.bh || 100}
                          fill={el.color || '#5E6AD2'}
                          fillOpacity={0.2}
                          stroke={el.color || '#7480E2'}
                          strokeWidth={Math.max(4, el.borderWidth || 4)}
                        />
                      );
                    }
                    if (el.type === 'border_circle' && el.bx !== undefined && el.by !== undefined) {
                      const rx = (el.bw || 100) / 2;
                      const ry = (el.bh || 100) / 2;
                      return (
                        <ellipse
                          key={el.id}
                          cx={el.bx + rx}
                          cy={el.by + ry}
                          rx={rx}
                          ry={ry}
                          fill={el.color || '#5E6AD2'}
                          fillOpacity={0.2}
                          stroke={el.color || '#7480E2'}
                          strokeWidth={Math.max(4, el.borderWidth || 4)}
                        />
                      );
                    }

                    // 3) 영역 다각형 (polygon)
                    if (el.type === 'polygon' && el.points && el.points.length > 0) {
                      return (
                        <polygon
                          key={el.id}
                          points={el.points.map((p) => `${p.x},${p.y}`).join(' ')}
                          fill={el.color || '#5E6AD2'}
                          fillOpacity={0.45}
                          stroke={el.color || '#7480E2'}
                          strokeWidth={Math.max(6, spanW / 400)}
                        />
                      );
                    }

                    // 4) 경로 (route / polyline)
                    if (el.points && el.points.length > 0) {
                      return (
                        <polyline
                          key={el.id}
                          points={el.points.map((p) => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke={el.color || '#38BDF8'}
                          strokeWidth={Math.max(8, spanW / 350)}
                        />
                      );
                    }

                    // 5) 마커 핀 (pin)
                    if (el.x !== undefined && el.y !== undefined) {
                      return (
                        <g key={el.id}>
                          <circle
                            cx={el.x}
                            cy={el.y}
                            r={Math.max(20, spanW / 120)}
                            fill={el.color || '#EF4444'}
                            stroke="#FFFFFF"
                            strokeWidth={Math.max(4, spanW / 600)}
                          />
                          {el.name && (
                            <text
                              x={el.x}
                              y={el.y + Math.max(35, spanW / 70)}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize={Math.max(28, spanW / 90)}
                              fontWeight="bold"
                              className="drop-shadow-md"
                            >
                              {el.name}
                            </text>
                          )}
                        </g>
                      );
                    }
                    return null;
                  })}

                  {/* 🌟 미니맵 중앙 고정 시야 사각형 (Center Viewfinder) 🌟 */}
                  <g>
                    <rect
                      x={camX - rectW / 2}
                      y={camY - rectH / 2}
                      width={rectW}
                      height={rectH}
                      fill="rgba(116, 128, 226, 0.25)"
                      stroke="#FFFFFF"
                      strokeWidth={Math.max(8, spanW / 250)}
                      rx={8}
                      ry={8}
                    />
                    <rect
                      x={camX - rectW / 2}
                      y={camY - rectH / 2}
                      width={rectW}
                      height={rectH}
                      fill="none"
                      stroke="#5E6AD2"
                      strokeWidth={Math.max(3, spanW / 550)}
                      rx={8}
                      ry={8}
                    />
                    {/* 미니맵 중앙 정밀 십자선 (Center Crosshair) */}
                    <line x1={camX - 15} y1={camY} x2={camX + 15} y2={camY} stroke="#FFFFFF" strokeWidth={3} />
                    <line x1={camX} y1={camY - 15} x2={camX} y2={camY + 15} stroke="#FFFFFF" strokeWidth={3} />
                  </g>
                </svg>
              );
            })()}
          </div>

          {/* 🌟 미니맵 테두리 (4개 변 + 4개 모서리) 전방위 크기 조절 리사이즈 핸들 🌟 */}
          {/* 상단 테두리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('n');
              }
            }}
            className="absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-50"
            title="상하 크기 조절"
          />
          {/* 하단 테두리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('s');
              }
            }}
            className="absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize z-50"
            title="상하 크기 조절"
          />
          {/* 좌측 테두리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('w');
              }
            }}
            className="absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-50"
            title="좌우 크기 조절"
          />
          {/* 우측 테두리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('e');
              }
            }}
            className="absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-50"
            title="좌우 크기 조절"
          />
          {/* 좌측 상단 모서리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('nw');
              }
            }}
            className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize z-50 rounded-tl"
            title="대각선 크기 조절"
          />
          {/* 우측 상단 모서리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('ne');
              }
            }}
            className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize z-50 rounded-tr"
            title="대각선 크기 조절"
          />
          {/* 좌측 하단 모서리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('sw');
              }
            }}
            className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize z-50 rounded-bl"
            title="대각선 크기 조절"
          />
          {/* 우측 하단 모서리 */}
          <div
            onMouseDown={(e) => {
              const rect = e.currentTarget.parentElement?.getBoundingClientRect();
              if (rect) {
                setResizeMinimapStart({ x: e.clientX, y: e.clientY, width: minimapSize.width, height: minimapSize.height, posX: rect.left, posY: rect.top });
                setResizeDir('se');
              }
            }}
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize z-50 rounded-br"
            title="대각선 크기 조절"
          />
        </div>
      )}

      {/* 이력 메모 수정/관리 모달 창 */}
      {showMemoModal && currentSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-[460px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold text-[#7480E2] flex items-center gap-1.5">
                <span>📝 시점 이력 메모 및 설정 수정</span>
              </h3>
              <button 
                onClick={() => setShowMemoModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">시점 이력 이름</label>
                <input 
                  type="text" 
                  value={memoEditName} 
                  onChange={e => setMemoEditName(e.target.value)}
                  placeholder="이력 이름을 입력하세요."
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">작중 캘린더 시간대 <span className="text-[10px] font-normal text-gray-500">(선택)</span></label>
                <input 
                  type="text" 
                  value={memoEditDate} 
                  onChange={e => setMemoEditDate(e.target.value)}
                  placeholder="예: 제국력 104년 8월"
                  className={`px-3 py-1.5 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">이력 메모 <span className="text-[10px] font-normal text-gray-500">(선택)</span></label>
                <textarea 
                  rows={4}
                  value={memoEditDescription} 
                  onChange={e => setMemoEditDescription(e.target.value)}
                  placeholder="시점 변경 시 참조될 사건 전개 및 상세 이력 메모를 수정/기입하세요."
                  className={`px-3 py-2 rounded-lg border outline-none resize-none leading-relaxed ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white' : 'bg-black/[0.01] border-black/[0.08] text-black'
                  }`}
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => setShowMemoModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                  isDark ? 'border-white/[0.06] hover:bg-[#1E1F22] text-gray-300' : 'border-black/[0.06] hover:bg-gray-100 text-gray-700'
                }`}
              >
                취소
              </button>
              <button 
                onClick={handleSaveSnapshotMemo}
                className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
              >
                저장
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
                <label className="font-semibold text-gray-400">작중 캘린더 시간대 <span className="text-[10px] font-normal text-gray-500">(선택)</span></label>
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
                <label className="font-semibold text-gray-400">이력 메모 <span className="text-[10px] font-normal text-gray-500">(선택)</span></label>
                <textarea 
                  rows={3}
                  value={newSnapshotDesc} 
                  onChange={e => setNewSnapshotDesc(e.target.value)}
                  placeholder="해당 시점에 대한 사건 전개 및 메모를 자유롭게 기입하세요."
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

      {/* 📍 위치 기억 (북마크/웨이포인트) 추가 모달 창 */}
      {showBookmarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-96 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
            isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-[#7480E2]">
                <Bookmark className="w-4 h-4" /> 📍 현재 지도 시점 기억
              </h3>
              <button 
                onClick={() => setShowBookmarkModal(false)}
                className="text-gray-400 hover:text-gray-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-col gap-3 text-xs">
              <p className="text-gray-400">
                현재 카메라 중심 시점 좌표를 북마크에 등록합니다. 추후 드롭다운에서 선택하여 바로 이동할 수 있습니다.
              </p>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-400">장소/시점 기억 이름</label>
                <input 
                  type="text" 
                  value={bookmarkNameInput} 
                  onChange={e => setBookmarkNameInput(e.target.value)}
                  placeholder="예: 중앙 성곽 광장, 북쪽 마법숲 입구"
                  className={`px-3 py-2 rounded-lg border outline-none ${
                    isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                  }`}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && bookmarkNameInput.trim()) {
                      const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
                      const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);
                      const camX = (-pan.x + containerW / 2) / zoom;
                      const camY = (-pan.y + containerH / 2) / zoom;

                      setSavedBookmarks(prev => [
                        ...prev,
                        {
                          id: `bm-${Date.now()}`,
                          name: `📍 ${bookmarkNameInput.trim()}`,
                          x: camX,
                          y: camY,
                          zoom,
                        }
                      ]);
                      setBookmarkNameInput('');
                      setShowBookmarkModal(false);
                    }
                  }}
                />
              </div>

              {/* 저장된 북마크 관리 리스트 */}
              {savedBookmarks.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <label className="font-semibold text-gray-400">저장된 기억 장소 목록</label>
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto border border-white/10 rounded-lg p-1">
                    {savedBookmarks.map(bm => (
                      <div key={bm.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-white/5">
                        <span className="truncate font-semibold text-gray-300">{bm.name}</span>
                        <button
                          onClick={() => setSavedBookmarks(prev => prev.filter(b => b.id !== bm.id))}
                          className="text-gray-500 hover:text-red-400 text-xs px-1 font-bold"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => setShowBookmarkModal(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                  isDark ? 'border-white/[0.06] hover:bg-[#1E1F22]' : 'border-black/[0.06] hover:bg-gray-100'
                }`}
              >
                취소
              </button>
              <button 
                onClick={() => {
                  if (!bookmarkNameInput.trim()) return;
                  const containerW = canvasContainerRef.current ? canvasContainerRef.current.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1200);
                  const containerH = canvasContainerRef.current ? canvasContainerRef.current.clientHeight : (typeof window !== 'undefined' ? window.innerHeight : 800);
                  const camX = (-pan.x + containerW / 2) / zoom;
                  const camY = (-pan.y + containerH / 2) / zoom;

                  setSavedBookmarks(prev => [
                    ...prev,
                    {
                      id: `bm-${Date.now()}`,
                      name: `📍 ${bookmarkNameInput.trim()}`,
                      x: camX,
                      y: camY,
                      zoom,
                    }
                  ]);
                  setBookmarkNameInput('');
                  setShowBookmarkModal(false);
                }}
                className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-lg shadow-[#5E6AD2]/20"
              >
                위치 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {showBgUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
              isDark ? 'bg-[#0E0F12] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
            }`}
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#5E6AD2]" />
                배경 이미지 업로드
              </h3>
              <button 
                onClick={() => setShowBgUploadModal(false)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-gray-900'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* 저작권 경고 안내 박스 */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex gap-2.5">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">저작권 및 법적 책임 고지</span>
                  <p className="mt-0.5 text-amber-500/80">
                    업로드하는 배경 이미지 파일의 저작권 위반으로 발생하는 모든 법적 책임은 사용자 본인에게 있습니다. 저작권이 침해되지 않는 안전한 이미지만 업로드해 주세요.
                  </p>
                </div>
              </div>

              {/* 용량 제한 안내 박스 */}
              <div className="p-3 rounded-xl bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 text-[#7480E2] flex gap-2.5">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">업로드 규격</span>
                  <p className="mt-0.5 text-gray-400">
                    서버 성능 및 최적화를 위해 <span className="font-bold text-white">1MB 이하</span>의 이미지 파일(<span className="font-mono">jpg, png, webp</span> 등)만 지원합니다.
                  </p>
                </div>
              </div>

              {/* 드롭존 및 파일 선택 인풋 */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = e.dataTransfer.files;
                  if (files && files.length > 0) {
                    handleImageFile(files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 ${
                  isDark 
                    ? 'border-white/10 hover:border-[#5E6AD2]/50 bg-white/[0.02] hover:bg-white/[0.04]' 
                    : 'border-black/10 hover:border-[#5E6AD2]/50 bg-black/[0.01] hover:bg-black/[0.03]'
                }`}
                onClick={() => document.getElementById('bg-image-file-input')?.click()}
              >
                <input
                  id="bg-image-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleImageFile(files[0]);
                    }
                  }}
                  className="hidden"
                />
                
                <Image className="w-7 h-7 text-gray-500" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-gray-300">클릭하거나 이미지를 여기에 끌어다 놓으세요</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">JPG, PNG, WEBP (최대 1MB)</p>
                </div>
              </div>

              {/* 에러 메시지 표시 */}
              {bgUploadError && (
                <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-center flex items-center justify-center gap-1.5">
                  <span>⚠️</span> {bgUploadError}
                </div>
              )}
            </div>

            <div className="flex gap-2.5 mt-5 pt-3 border-t border-white/10">
              <button 
                onClick={() => setShowBgUploadModal(false)}
                className={`w-full py-2 rounded-xl font-bold border transition-colors text-xs ${
                  isDark ? 'border-white/[0.06] hover:bg-[#1E1F22]' : 'border-black/[0.06] hover:bg-gray-100'
                }`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
