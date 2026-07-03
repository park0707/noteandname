import { useState, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus } from 'lucide-react';
import type { Node } from './types';

interface RelationsMapProps {
  isDark: boolean;
  relationNodes: Node[];
  setRelationNodes: Dispatch<SetStateAction<Node[]>>;
}

export default function RelationsMap({ isDark, relationNodes, setRelationNodes }: RelationsMapProps) {
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement | null>(null);

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
          <button
            onClick={handleAddNode}
            className="px-3 py-1.5 bg-[#5E6AD2] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> 인물 추가
          </button>
        </div>
      </div>
    </div>
  );
}
