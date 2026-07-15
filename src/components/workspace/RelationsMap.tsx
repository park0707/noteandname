import { useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import ReactFlow, {
  Controls,
  Background,
  Node as FlowNode,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus } from 'lucide-react';
import type { Node } from './types';

interface RelationsMapProps {
  isDark: boolean;
  relationNodes: Node[];
  setRelationNodes: Dispatch<SetStateAction<Node[]>>;
}

export default function RelationsMap({ isDark, relationNodes, setRelationNodes }: RelationsMapProps) {
  
  // 기존 하드코딩된 정적 관계선 데이터 정의
  const staticLines = useMemo(() => [
    { from: '1', to: '2', label: '동료', color: '#2ECC71', dashed: false },
    { from: '1', to: '3', label: '적대', color: '#E2487A', dashed: false },
  ], []);

  // relationNodes를 ReactFlow Node로 변환
  const flowNodes = useMemo<FlowNode[]>(() => {
    return relationNodes.map(n => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: n.name },
      style: {
        background: isDark ? '#121316' : '#FFFFFF',
        color: isDark ? '#FFFFFF' : '#121316',
        border: `2px solid ${n.color || '#5E6AD2'}`,
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '8px 16px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        textAlign: 'center',
        minWidth: '100px'
      }
    }));
  }, [relationNodes, isDark]);

  // staticLines를 ReactFlow Edge로 변환
  const flowEdges = useMemo<Edge[]>(() => {
    return staticLines.map((line, idx) => {
      const fromNode = relationNodes.find(n => n.id === line.from);
      const toNode = relationNodes.find(n => n.id === line.to);
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
  }, [staticLines, relationNodes, isDark]);

  // 노드 드래그 종료 시 좌표 업데이트
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: FlowNode) => {
    setRelationNodes(prev =>
      prev.map(n =>
        n.id === node.id
          ? { ...n, x: node.position.x, y: node.position.y }
          : n
      )
    );
  }, [setRelationNodes]);

  // 캐릭터 노드 추가 핸들러
  const handleAddNode = () => {
    const name = prompt('추가할 캐릭터 이름을 입력하세요:');
    if (!name) return;
    const newId = `node-${Date.now()}`;
    const randomColors = ['#5E6AD2', '#2ECC71', '#E2487A', '#F1C40F', '#9B59B6', '#E67E22'];
    setRelationNodes(prev => [
      ...prev,
      {
        id: newId,
        name: `${name} (신규)`,
        x: 150 + Math.random() * 150,
        y: 150 + Math.random() * 150,
        color: randomColors[Math.floor(Math.random() * randomColors.length)]
      }
    ]);
  };

  return (
    <div className="flex-1 overflow-hidden px-8 py-6 flex flex-col gap-6">
      <div>
        <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>인물 관계도 캔버스</h2>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
          캐릭터 카드를 드래그하여 자유롭게 배치하고 마우스 휠로 확대/축소 및 캔버스를 패닝하여 조망하세요.
        </p>
      </div>

      <div className={`relative w-full h-[500px] rounded-2xl border overflow-hidden select-none ${
        isDark ? 'bg-[#090A0C] border-white/[0.06]' : 'bg-[#FAF8FA] border-black/[0.06]'
      }`}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodeDragStop={onNodeDragStop}
          fitView
          className="h-full w-full"
        >
          <Background color={isDark ? '#333' : '#ccc'} gap={16} size={1} />
          <Controls className="!bg-[#121316] !border-white/10 !text-white" />
        </ReactFlow>

        <div className="absolute top-4 left-4 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex gap-2 z-10">
          <button
            onClick={handleAddNode}
            className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> 인물 추가
          </button>
        </div>
      </div>
    </div>
  );
}
