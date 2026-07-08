import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { GitCommit, Plus, CheckCircle2, Circle, Trash2, Calendar, Edit3 } from 'lucide-react';
import type { Foreshadowing } from './types';

interface ForeshadowingTimelineProps {
  isDark: boolean;
  foreshadowings: Foreshadowing[];
  setForeshadowings: Dispatch<SetStateAction<Foreshadowing[]>>;
}

export default function ForeshadowingTimeline({
  isDark,
  foreshadowings,
  setForeshadowings
}: ForeshadowingTimelineProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [createdChapter, setCreatedChapter] = useState(1);
  const [targetChapter, setTargetChapter] = useState(10);

  const handleAddForeshadowing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newFs: Foreshadowing = {
      id: `fs-${Date.now()}`,
      projectId: foreshadowings[0]?.projectId || '',
      title: title.trim(),
      description: description.trim(),
      createdChapter: Number(createdChapter) || 1,
      targetChapter: Number(targetChapter) || 10,
      isResolved: false,
      createdAt: new Date().toISOString()
    };

    setForeshadowings(prev => [...prev, newFs]);
    setTitle('');
    setDescription('');
    setCreatedChapter(1);
    setTargetChapter(10);
    setShowAddForm(false);
  };

  const handleToggleResolve = (id: string) => {
    setForeshadowings(prev =>
      prev.map(f =>
        f.id === id ? { ...f, isResolved: !f.isResolved } : f
      )
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm('이 복선을 타임라인에서 영구 삭제하시겠습니까?')) return;
    setForeshadowings(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 scrollbar-thin">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-heading font-bold text-xl ${isDark ? 'text-white' : 'text-[#121316]'}`}>복선 타임라인 (Foreshadowings)</h2>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'}`}>
            소설 속 심어둔 복선들을 회차 단위로 정밀하게 추적 관리하여 미회수 복선을 사전 방지합니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-xl transition-all duration-150 flex items-center gap-1.5 shadow-md shadow-[#5E6AD2]/10"
        >
          <Plus className="w-3.5 h-3.5" /> 복선 추가
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddForeshadowing}
          className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-300 ${
            isDark ? 'bg-[#0D0E11] border-white/[0.06]' : 'bg-white border-black/[0.06] shadow-sm'
          }`}
        >
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>새 복선 설정</h3>
          <div className="flex flex-col gap-1.5">
            <label className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>복선명</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 주인공 오른손의 황금 흉터"
              className={`px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                isDark ? 'bg-[#161719] border-white/[0.08] text-white focus:border-[#5E6AD2]/50' : 'bg-gray-50 border-black/[0.08] text-gray-800 focus:border-[#5E6AD2]/50'
              }`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>상세 내용</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="복선이 회수될 시점의 연출 및 단서 등을 기록하세요."
              rows={2}
              className={`px-3 py-2 rounded-xl text-xs border outline-none resize-none transition-all ${
                isDark ? 'bg-[#161719] border-white/[0.08] text-white focus:border-[#5E6AD2]/50' : 'bg-gray-50 border-black/[0.08] text-gray-800 focus:border-[#5E6AD2]/50'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>생성 회차 (심은 화)</label>
              <input
                type="number"
                min="1"
                required
                value={createdChapter}
                onChange={e => setCreatedChapter(parseInt(e.target.value) || 1)}
                className={`px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                  isDark ? 'bg-[#161719] border-white/[0.08] text-white focus:border-[#5E6AD2]/50' : 'bg-gray-50 border-black/[0.08] text-gray-800 focus:border-[#5E6AD2]/50'
                }`}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>목표 회수 회차 (회수 예정 화)</label>
              <input
                type="number"
                min="1"
                required
                value={targetChapter}
                onChange={e => setTargetChapter(parseInt(e.target.value) || 10)}
                className={`px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                  isDark ? 'bg-[#161719] border-white/[0.08] text-white focus:border-[#5E6AD2]/50' : 'bg-gray-50 border-black/[0.08] text-gray-800 focus:border-[#5E6AD2]/50'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isDark ? 'hover:bg-white/[0.04] text-gray-400 hover:text-white' : 'hover:bg-black/[0.04] text-gray-600 hover:text-black'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-lg transition-colors"
            >
              생성하기
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {foreshadowings.length === 0 ? (
          <div className={`p-10 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${
            isDark ? 'border-white/[0.08] text-gray-500' : 'border-black/[0.08] text-gray-400'
          }`}>
            <GitCommit className="w-8 h-8 mb-2 opacity-40 animate-pulse" />
            <p className="text-xs font-medium">등록된 복선이 없습니다.</p>
            <p className="text-[10px] mt-0.5 opacity-60">우측 상단 복선 추가 버튼으로 소설의 단서를 기록해 보세요.</p>
          </div>
        ) : (
          foreshadowings.map(fs => {
            const isResolved = fs.isResolved;
            const remaining = fs.targetChapter - fs.createdChapter;

            return (
              <div
                key={fs.id}
                className={`group p-5 rounded-2xl border transition-all duration-300 flex items-start justify-between ${
                  isResolved
                    ? isDark ? 'bg-white/[0.01] border-white/[0.03] opacity-60' : 'bg-black/[0.01] border-black/[0.03] opacity-65'
                    : isDark ? 'bg-[#0D0E11] border-white/[0.06] hover:border-white/[0.12] hover:shadow-xl' : 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggleResolve(fs.id)}
                    className={`mt-1 transition-colors ${
                      isResolved ? 'text-[#2ECC71]' : isDark ? 'text-gray-600 hover:text-white' : 'text-gray-400 hover:text-black'
                    }`}
                    title={isResolved ? '복선 미회수로 돌리기' : '복선 회수 완료 처리'}
                  >
                    {isResolved ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                  </button>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-bold truncate leading-none ${
                        isResolved
                          ? 'line-through text-gray-500'
                          : isDark ? 'text-white' : 'text-[#121316]'
                      }`}>
                        {fs.title}
                      </h3>
                      {isResolved ? (
                        <span className="px-1.5 py-0.5 bg-[#2ECC71]/15 text-[#2ECC71] text-[9px] font-bold rounded-md">회수완료</span>
                      ) : (
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                          remaining > 10
                            ? 'bg-[#5E6AD2]/15 text-[#7480E2]'
                            : 'bg-red-400/15 text-red-400'
                        }`}>
                          {remaining > 0 ? `회수 대비화수: ${remaining}화 남음` : '회수 시점 도달'}
                        </span>
                      )}
                    </div>
                    {fs.description && (
                      <p className={`text-xs mt-1 leading-relaxed whitespace-pre-wrap break-all ${
                        isResolved ? 'text-gray-500' : isDark ? 'text-[#A1A1AA]' : 'text-[#55555A]'
                      }`}>
                        {fs.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>생성: {fs.createdChapter}화</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>회수목표: {fs.targetChapter}화</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(fs.id)}
                  className={`p-1.5 rounded-lg text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 transition-all shrink-0 ml-4`}
                  title="복선 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
