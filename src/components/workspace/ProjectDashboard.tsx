import { ChevronRight, Globe } from 'lucide-react';
import type { Project } from './types';

interface ProjectDashboardProps {
  selectedProject: Project;
  notes: string;
  setNotes: (val: string) => void;
  saveStatus: string;
  setSaveStatus: (status: string) => void;
  setActiveFeature: (feat: string) => void;
  isDark: boolean;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function ProjectDashboard({
  selectedProject,
  notes,
  setNotes,
  saveStatus,
  setSaveStatus,
  setActiveFeature,
  isDark,
}: ProjectDashboardProps) {
  const handleNotesChange = (val: string) => {
    setNotes(val);
    setSaveStatus('saving');
  };

  // Mock chapters for UI representation or can use actual episodes if preferred
  const mockChapters = [
    { id: '1', title: '제 1화: 깨어난 별빛', words: 4520, date: '2026.06.28' },
    { id: '2', title: '제 2화: 위험한 의뢰', words: 4890, date: '2026.06.29' },
    { id: '3', title: '제 3화: 그림자 숲의 정체', words: 5120, date: '2026.06.30' },
  ];

  const totalWords = mockChapters.reduce((sum, ch) => sum + ch.words, 0) + 29020;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
      {/* 프로젝트 개요 헤더 */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
      }`}>
        <div>
          <span className={`text-xs ${isDark ? 'text-[#3A3D50]' : 'text-[#C5C5CC]'}`}>
            생성일: {formatDate(selectedProject.created_at)}
          </span>
          <h2 className={`font-heading font-bold text-2xl mb-1.5 mt-1 ${isDark ? 'text-white' : 'text-[#121316]'}`}>
            {selectedProject.name}
          </h2>
          <p className={`text-sm ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            {selectedProject.description || '작품 한 줄 소개가 없습니다.'}
          </p>
        </div>
      </div>

      {/* 위젯 보드 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 통계 및 챕터 목록 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-[#3A3D50]' : 'text-[#A1A1AA]'}`}>전체 자수</span>
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{totalWords.toLocaleString()} 자</span>
            </div>
            <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-[#3A3D50]' : 'text-[#A1A1AA]'}`}>챕터 수</span>
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{mockChapters.length} 화</span>
            </div>
            <div className={`p-5 rounded-2xl border flex flex-col gap-1 ${
              isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
            }`}>
              <span className={`text-xs font-semibold ${isDark ? 'text-[#3A3D50]' : 'text-[#A1A1AA]'}`}>등록 인물</span>
              <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#121316]'}`}>3 명</span>
            </div>
          </div>

          {/* 목표 달성 트래커 */}
          <div className={`p-6 rounded-2xl border flex flex-col gap-3 ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>1권 완결 목표 달성도</span>
              <span className="text-xs font-medium text-[#5E6AD2]">44.1% ({totalWords.toLocaleString()}자 / 100,000자)</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`}>
              <div className="h-full bg-gradient-to-r from-[#5E6AD2] to-[#7480E2] transition-all duration-300" style={{ width: '44.1%' }} />
            </div>
          </div>

          {/* 최근 원고 리스트 */}
          <div className={`p-6 rounded-2xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-heading font-bold text-base ${isDark ? 'text-white' : 'text-[#121316]'}`}>최근 집필 원고</h3>
              <button
                onClick={() => setActiveFeature('editor')}
                className="text-xs font-bold text-[#5E6AD2] hover:underline flex items-center gap-1"
              >
                전체 보기 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {mockChapters.map(ch => (
                <div key={ch.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isDark ? 'border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]' : 'border-black/[0.04] bg-black/[0.01] hover:bg-black/[0.03]'
                }`}>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#121316]'}`}>{ch.title}</p>
                    <p className={`text-xs ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>{ch.words.toLocaleString()} 자 · {ch.date}</p>
                  </div>
                  <button
                    onClick={() => setActiveFeature('editor')}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                      isDark ? 'border-white/[0.08] text-[#A1A1AA] hover:text-white hover:bg-white/[0.05]' : 'border-black/[0.08] text-[#55555A] hover:text-[#121316] hover:bg-black/[0.05]'
                    }`}
                  >
                    수정
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 메모장 및 요약 위젯 */}
        <div className="flex flex-col gap-6">
          {/* 실시간 메모장 */}
          <div className={`p-6 rounded-2xl border flex flex-col gap-3 flex-1 min-h-[280px] ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-heading font-bold text-base ${isDark ? 'text-white' : 'text-[#121316]'}`}>아이디어 데스크 메모</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                saveStatus === 'saved' ? 'bg-[#2ECC71]/15 text-[#2ECC71]' : 'bg-[#F39C12]/15 text-[#F39C12]'
              }`}>
                {saveStatus === 'saved' ? '저장 완료' : '저장 중...'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              placeholder="마감 일정, 복선 복기, 혹은 떠오르는 아이디어를 즉흥적으로 기록하세요..."
              className={`flex-1 w-full p-4 rounded-xl text-sm outline-none border resize-none leading-relaxed transition-all duration-200 ${
                isDark
                  ? 'bg-[#121316] border-white/[0.06] text-[#EDEDEF] placeholder-[#3A3D50] focus:border-[#5E6AD2]'
                  : 'bg-[#F8F8FA] border-black/[0.06] text-[#121316] placeholder-[#C5C5CC] focus:border-[#5E6AD2]'
              }`}
            />
          </div>

          {/* 세계관 지도 위젯 */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-4 ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06]'
          }`}>
            <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-[#121316]'}`}>세계관 지도 요약</h3>
            <div className={`relative h-28 rounded-xl border overflow-hidden flex items-center justify-center ${
              isDark ? 'bg-white/[0.02] border-white/[0.04]' : 'bg-black/[0.02] border-black/[0.04]'
            }`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                <Globe className="w-16 h-16 text-[#5E6AD2]" />
              </div>
              <div className="text-center relative z-10">
                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-[#EDEDEF]' : 'text-[#121316]'}`}>아이론 대륙 (지리 계층: 3단계)</p>
                <button
                  onClick={() => setActiveFeature('worldmap')}
                  className="px-3 py-1.5 rounded-lg bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold transition-colors"
                >
                  지도 편집기 열기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
