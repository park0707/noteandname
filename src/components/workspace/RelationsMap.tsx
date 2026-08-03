import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
} from 'reactflow';
import type { Node as FlowNode, Edge, NodeChange } from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Search, User, X, Check, Sparkles, UserPlus } from 'lucide-react';
import type { Node, ArchiveItem } from './types';

interface RelationsMapProps {
  isDark: boolean;
  relationNodes: Node[];
  setRelationNodes: Dispatch<SetStateAction<Node[]>>;
  archiveItems?: ArchiveItem[];
  setArchiveItems?: Dispatch<SetStateAction<ArchiveItem[]>>;
}

export default function RelationsMap({
  isDark,
  relationNodes,
  setRelationNodes,
  archiveItems = [],
  setArchiveItems,
}: RelationsMapProps) {
  // 모달 오픈 및 탭 상태
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'archive' | 'custom'>('archive');
  const [searchQuery, setSearchQuery] = useState('');

  // 신규 직접 생성 입력 상태
  const [customName, setCustomName] = useState('');
  const [customSummary, setCustomSummary] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // 기존 하드코딩된 정적 관계선 데이터 정의
  const staticLines = useMemo(() => [
    { from: '1', to: '2', label: '동료', color: '#2ECC71', dashed: false },
    { from: '1', to: '3', label: '적대', color: '#E2487A', dashed: false },
  ], []);

  // relationNodes를 ReactFlow Node 규격으로 변환하는 헬퍼 함수
  const createFlowNodes = useCallback((nodesList: Node[], dark: boolean): FlowNode[] => {
    return nodesList.map(n => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: n.name },
      style: {
        background: dark ? '#121316' : '#FFFFFF',
        color: dark ? '#FFFFFF' : '#121316',
        border: `2px solid ${n.color || '#5E6AD2'}`,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '8px 16px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        textAlign: 'center',
        minWidth: '100px',
        transition: 'none'
      }
    }));
  }, []);

  // ReactFlow 제어용 로컬 노드 상태 (드래그 실시간 이동 반영)
  const [nodes, setNodes] = useState<FlowNode[]>(() => createFlowNodes(relationNodes, isDark));

  // 외부 relationNodes 또는 테마 변경 시 로컬 노드 상태 동기화
  useEffect(() => {
    setNodes(createFlowNodes(relationNodes, isDark));
  }, [relationNodes, isDark, createFlowNodes]);

  // 노드 드래그 시 실시간 캔버스 좌표 변경 반영 (드래그 과정이 부드럽게 보이도록 처리)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  // staticLines를 ReactFlow Edge로 변환
  const flowEdges = useMemo<Edge[]>(() => {
    return staticLines.map((line, idx) => {
      const fromNode = nodes.find(n => n.id === line.from);
      const toNode = nodes.find(n => n.id === line.to);
      if (!fromNode || !toNode) return null;

      return {
        id: `edge-${idx}`,
        source: line.from,
        target: line.to,
        label: line.label,
        type: 'smoothstep',
        style: { 
          stroke: line.color, 
          strokeWidth: 2,
          strokeDasharray: line.dashed ? '5, 5' : undefined 
        },
        labelStyle: { 
          fill: isDark ? '#EDEDEF' : '#121316', 
          fontWeight: 700, 
          fontSize: 10 
        },
        labelBgStyle: { 
          fill: isDark ? '#121316' : '#FFFFFF', 
          rx: 4, 
          ry: 4,
          fillOpacity: 0.95
        }
      };
    }).filter(Boolean) as Edge[];
  }, [staticLines, nodes, isDark]);

  // 노드 드래그 완료 시 상위 전역 상태에 최종 위치 저장
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: FlowNode) => {
    setRelationNodes(prev =>
      prev.map(n =>
        n.id === node.id
          ? { ...n, x: node.position.x, y: node.position.y }
          : n
      )
    );
  }, [setRelationNodes]);

  // 캐릭터 카테고리의 아카이브 목록 및 검색 필터링
  const characterArchives = useMemo(() => {
    const chars = archiveItems.filter(item => item.category === 'character');
    if (!searchQuery.trim()) return chars;
    const q = searchQuery.toLowerCase().trim();
    return chars.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.summary.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [archiveItems, searchQuery]);

  // 이미 캔버스에 추가되었는지 확인
  const isNodeAdded = useCallback((archiveItem: ArchiveItem) => {
    return relationNodes.some(n => n.archiveItemId === archiveItem.id || n.name === archiveItem.name);
  }, [relationNodes]);

  // 아카이브 캐릭터 선택하여 관계도에 추가
  const handleSelectArchiveCharacter = (item: ArchiveItem) => {
    const randomColors = ['#5E6AD2', '#2ECC71', '#E2487A', '#F1C40F', '#9B59B6', '#E67E22'];
    const newId = `node-${Date.now()}`;
    const newNode: Node = {
      id: newId,
      name: item.name,
      summary: item.summary,
      description: item.description,
      x: 150 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      color: randomColors[Math.floor(Math.random() * randomColors.length)],
      archiveItemId: item.id
    };

    setRelationNodes(prev => [...prev, newNode]);
    setIsSelectModalOpen(false);
  };

  // 신규 캐릭터 직접 입력 후 생성 (아카이브에도 자동 반영)
  const handleCreateCustomCharacter = () => {
    if (!customName.trim()) return;
    const randomColors = ['#5E6AD2', '#2ECC71', '#E2487A', '#F1C40F', '#9B59B6', '#E67E22'];
    const now = new Date().toISOString();
    const newArchiveId = `arch-${Date.now()}`;
    const newNodeId = `node-${Date.now()}`;

    // 1. 아카이브 항목 자동 등록
    const newArchiveItem: ArchiveItem = {
      id: newArchiveId,
      projectId: '',
      name: customName.trim(),
      category: 'character',
      summary: customSummary.trim() || '신규 캐릭터',
      description: customDescription.trim(),
      tags: ['인물관계도'],
      createdAt: now,
      updatedAt: now
    };

    if (setArchiveItems) {
      setArchiveItems(prev => [newArchiveItem, ...prev]);
    }

    // 2. 관계도 노드 등록
    const newNode: Node = {
      id: newNodeId,
      name: customName.trim(),
      summary: customSummary.trim(),
      description: customDescription.trim(),
      x: 150 + Math.random() * 200,
      y: 150 + Math.random() * 200,
      color: randomColors[Math.floor(Math.random() * randomColors.length)],
      archiveItemId: newArchiveId
    };

    setRelationNodes(prev => [...prev, newNode]);

    // 폼 초기화 및 모달 닫기
    setCustomName('');
    setCustomSummary('');
    setCustomDescription('');
    setIsSelectModalOpen(false);
  };

  return (
    <div className="flex-1 h-full w-full overflow-hidden flex flex-col">
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>인물 관계도 캔버스</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          캐릭터 카드를 드래그하여 자유롭게 배치하고 마우스 휠로 확대/축소 및 캔버스를 패닝하여 조망하세요.
        </p>
      </div>

      <div className={`relative flex-1 w-full h-full border-t overflow-hidden select-none ${
        isDark ? 'bg-[#090A0C] border-white/[0.06]' : 'bg-[#FAF8FA] border-black/[0.06]'
      }`}>
        <ReactFlow
          nodes={nodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          fitView
          className="h-full w-full"
        >
          <Background color={isDark ? '#333' : '#ccc'} gap={16} size={1} />
          <Controls className="!bg-[#121316] !border-white/10 !text-white" />
        </ReactFlow>

        <div className="absolute top-4 left-4 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex gap-2 z-10">
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveTab('archive');
              setIsSelectModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-lg transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#5E6AD2]/20"
          >
            <Plus className="w-4 h-4" /> 인물 추가
          </button>
        </div>
      </div>

      {/* 인물 추가 및 아카이브 캐릭터 선택 모달 */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-[#121316] border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'
          }`}>
            {/* 모달 헤더 */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-black/[0.08] bg-black/[0.01]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#5E6AD2]/10 text-[#5E6AD2]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">인물 관계도에 추가</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    아카이브 캐릭터를 선택하거나 새 인물을 추가합니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSelectModalOpen(false)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDark ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5' : 'border-black/10 text-gray-500 hover:text-black hover:bg-black/5'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 탭 구분 및 검색바 */}
            <div className="p-4 border-b border-white/[0.06] flex flex-col gap-3">
              <div className={`flex p-1 rounded-xl border ${
                isDark ? 'bg-black/30 border-white/10' : 'bg-gray-100 border-black/10'
              }`}>
                <button
                  onClick={() => setActiveTab('archive')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'archive'
                      ? 'bg-[#5E6AD2] text-white shadow-md'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  아카이브 캐릭터 ({characterArchives.length})
                </button>
                <button
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'custom'
                      ? 'bg-[#5E6AD2] text-white shadow-md'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  직접 입력하기
                </button>
              </div>

              {activeTab === 'archive' && (
                <div className="relative">
                  <Search className={`absolute left-3 top-2.5 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="캐릭터 이름 또는 요약 검색..."
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:border-[#5E6AD2] transition-colors ${
                      isDark 
                        ? 'bg-black/40 border-white/10 text-white placeholder-gray-500' 
                        : 'bg-white border-black/10 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* 탭 내용 콘텐츠 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'archive' ? (
                characterArchives.length > 0 ? (
                  characterArchives.map(item => {
                    const added = isNodeAdded(item);
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                          isDark
                            ? 'bg-white/[0.02] border-white/[0.08] hover:border-[#5E6AD2]/50 hover:bg-white/[0.04]'
                            : 'bg-gray-50 border-black/[0.08] hover:border-[#5E6AD2]/50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs truncate">{item.name}</span>
                              {added && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> 이미 배치됨
                                </span>
                              )}
                            </div>
                            {item.summary && (
                              <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {item.summary}
                              </p>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {item.tags.map(t => (
                                  <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                    isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-black/5 border-black/10 text-gray-600'
                                  }`}>
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSelectArchiveCharacter(item)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                            added
                              ? isDark ? 'bg-white/10 text-gray-300 hover:bg-white/20' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-[#5E6AD2] hover:bg-[#7480E2] text-white shadow-sm'
                          }`}
                        >
                          {added ? '추가하기' : '선택'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
                    <User className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {searchQuery ? '검색어와 일치하는 아카이브 캐릭터가 없습니다.' : '등록된 아카이브 캐릭터가 없습니다.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('custom')}
                      className="mt-2 text-xs text-[#5E6AD2] font-bold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> 새 인물 직접 입력하기
                    </button>
                  </div>
                )
              ) : (
                /* 신규 인물 직접 입력 폼 */
                <div className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      캐릭터 이름 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="예: 유진, 라비"
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-[#5E6AD2] ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      한 줄 요약 (역할)
                    </label>
                    <input
                      type="text"
                      value={customSummary}
                      onChange={(e) => setCustomSummary(e.target.value)}
                      placeholder="예: 주인공, 조력자, 마왕"
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-[#5E6AD2] ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      상세 설명 (선택)
                    </label>
                    <textarea
                      rows={3}
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="인물의 성격, 배경 설정을 입력하세요."
                      className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-[#5E6AD2] ${
                        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white border-black/10 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                    isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  }`}>
                    💡 생성된 인물은 **인물 관계도**와 **아카이브(캐릭터)** 카테고리에 자동으로 동기화되어 저장됩니다.
                  </div>

                  <button
                    onClick={handleCreateCustomCharacter}
                    disabled={!customName.trim()}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-md ${
                      customName.trim()
                        ? 'bg-[#5E6AD2] hover:bg-[#7480E2] text-white cursor-pointer'
                        : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    인물 생성 및 관계도 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
