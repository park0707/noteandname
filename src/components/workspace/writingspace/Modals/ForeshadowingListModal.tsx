import { useState, useMemo } from 'react';
import {
  X,
  ListOrdered,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Calendar,
  Save,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import type { Foreshadowing } from '../../types';
import { useAlertConfirm } from '../../../../context/AlertConfirmContext';

interface ForeshadowingListModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  foreshadowings: Foreshadowing[];
  currentChapterNumber?: number;
  onUpdateForeshadowing: (updated: Foreshadowing) => void;
  onDeleteForeshadowing: (id: string) => void;
  onToggleResolve: (id: string) => void;
}

export default function ForeshadowingListModal({
  isDark,
  isOpen,
  onClose,
  foreshadowings,
  currentChapterNumber = 1,
  onUpdateForeshadowing,
  onDeleteForeshadowing,
  onToggleResolve
}: ForeshadowingListModalProps) {
  const { showConfirm, showAlert } = useAlertConfirm();

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unresolved' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'target' | 'created' | 'latest'>('target');

  // 편집 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCreatedChapter, setEditCreatedChapter] = useState<number>(1);
  const [editTargetChapter, setEditTargetChapter] = useState<number>(10);

  // 편집 시작
  const startEditing = (fs: Foreshadowing) => {
    setEditingId(fs.id);
    setEditTitle(fs.title);
    setEditDescription(fs.description || '');
    setEditCreatedChapter(fs.createdChapter);
    setEditTargetChapter(fs.targetChapter);
  };

  // 편집 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
  };

  // 편집 저장
  const handleSaveEdit = (fs: Foreshadowing) => {
    if (!editTitle.trim()) {
      showAlert('복선 이름을 입력해 주세요.');
      return;
    }

    const created = Math.max(1, Number(editCreatedChapter) || 1);
    const target = Math.max(created, Number(editTargetChapter) || created);

    onUpdateForeshadowing({
      ...fs,
      title: editTitle.trim(),
      description: editDescription.trim(),
      createdChapter: created,
      targetChapter: target
    });

    setEditingId(null);
    showAlert('복선 정보가 수정되었습니다.');
  };

  // 빠른 목표 회차 증가 (+1, +5, +10 등)
  const handleExtendTargetChapter = (fs: Foreshadowing, amount: number) => {
    const newTarget = Math.max(fs.createdChapter, fs.targetChapter + amount);
    onUpdateForeshadowing({
      ...fs,
      targetChapter: newTarget
    });
    showAlert(`복선 "${fs.title}"의 목표 회수 시점이 ${newTarget}화로 ${amount > 0 ? `+${amount}화 연장` : `${amount}화 변경`}되었습니다.`);
  };

  // 삭제 처리
  const handleDelete = async (fs: Foreshadowing) => {
    const confirmed = await showConfirm(`복선 "${fs.title}"을(를) 영구 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`);
    if (confirmed) {
      onDeleteForeshadowing(fs.id);
      showAlert(`복선 "${fs.title}"이(가) 삭제되었습니다.`);
    }
  };

  // 필터링 및 정렬
  const filteredList = useMemo(() => {
    let list = [...foreshadowings];

    // 탭 필터
    if (filterTab === 'unresolved') {
      list = list.filter(f => !f.isResolved);
    } else if (filterTab === 'resolved') {
      list = list.filter(f => f.isResolved);
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(f =>
        f.title.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.createdEpisodeTitle && f.createdEpisodeTitle.toLowerCase().includes(q))
      );
    }

    // 정렬
    list.sort((a, b) => {
      if (sortBy === 'target') {
        // 목표 회수 회차순 (미해결 우선)
        if (a.isResolved !== b.isResolved) {
          return a.isResolved ? 1 : -1;
        }
        return a.targetChapter - b.targetChapter;
      }
      if (sortBy === 'created') {
        return a.createdChapter - b.createdChapter;
      }
      if (sortBy === 'latest') {
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      }
      return 0;
    });

    return list;
  }, [foreshadowings, filterTab, searchQuery, sortBy]);

  // 통계 카운트
  const totalCount = foreshadowings.length;
  const unresolvedCount = useMemo(() => foreshadowings.filter(f => !f.isResolved).length, [foreshadowings]);
  const resolvedCount = totalCount - unresolvedCount;
  const dueCount = useMemo(() => {
    return foreshadowings.filter(f => !f.isResolved && f.targetChapter <= currentChapterNumber).length;
  }, [foreshadowings, currentChapterNumber]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-3xl rounded-2xl border shadow-2xl transition-all flex flex-col max-h-[88vh] ${
          isDark
            ? 'bg-[#18191C] border-white/[0.08] text-gray-200'
            : 'bg-white border-black/[0.08] text-gray-800'
        }`}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-500/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#5E6AD2]/10 text-[#7480E2] shrink-0">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold">복선 목록 관리</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#5E6AD2]/15 text-[#7480E2] border border-[#5E6AD2]/25">
                  총 {totalCount}개
                </span>
                {dueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                    🔥 즉시 회수 {dueCount}건
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                현재 문서({currentChapterNumber}화) 기준 설치된 모든 복선의 이름, 회수 목표 회차를 실시간으로 확인하고 수정합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 상단 탭 필터, 검색바, 정렬 툴바 */}
        <div className="p-4 border-b border-gray-500/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* 상태 탭 */}
          <div className={`flex items-center p-1 rounded-xl border text-xs font-semibold ${
            isDark ? 'bg-[#121316] border-white/[0.06]' : 'bg-gray-100 border-black/[0.06]'
          }`}>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterTab === 'all'
                  ? isDark
                    ? 'bg-[#2A2B30] text-white shadow-xs'
                    : 'bg-white text-black shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              전체 ({totalCount})
            </button>
            <button
              onClick={() => setFilterTab('unresolved')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'unresolved'
                  ? isDark
                    ? 'bg-[#2A2B30] text-amber-400 shadow-xs'
                    : 'bg-white text-amber-600 shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>미회수 ({unresolvedCount})</span>
            </button>
            <button
              onClick={() => setFilterTab('resolved')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'resolved'
                  ? isDark
                    ? 'bg-[#2A2B30] text-emerald-400 shadow-xs'
                    : 'bg-white text-emerald-600 shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>회수 완료 ({resolvedCount})</span>
            </button>
          </div>

          {/* 검색 및 정렬 */}
          <div className="flex items-center gap-2">
            <div className={`relative flex items-center flex-1 sm:w-60 rounded-xl border pl-3.5 pr-2 py-1.5 transition-all ${
              isDark ? 'bg-[#121316] border-white/[0.08] focus-within:border-[#5E6AD2]' : 'bg-gray-50 border-black/[0.08] focus-within:border-[#5E6AD2]'
            }`}>
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="복선명, 단서 검색..."
                className="w-full text-xs bg-transparent outline-none pl-1"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-400 shrink-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'target' | 'created' | 'latest')}
              className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none cursor-pointer ${
                isDark ? 'bg-[#121316] border-white/[0.08] text-gray-300' : 'bg-gray-50 border-black/[0.08] text-gray-700'
              }`}
            >
              <option value="target">목표 회차순</option>
              <option value="created">설치 회차순</option>
              <option value="latest">최근 등록순</option>
            </select>
          </div>
        </div>

        {/*    리스트 영역 */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
          {filteredList.length === 0 ? (
            <div className={`py-14 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center ${
              isDark ? 'border-white/[0.08] text-gray-500' : 'border-black/[0.08] text-gray-400'
            }`}>
              <ListOrdered className="w-9 h-9 mb-2 opacity-30 animate-pulse text-[#7480E2]" />
              <p className="text-sm font-semibold">표시할 복선이 없습니다.</p>
              <p className="text-xs mt-1 opacity-70">
                {searchQuery ? '검색어와 일치하는 복선이 없습니다.' : '상단의 [새 복선 설치] 버튼으로 첫 복선을 심어보세요.'}
              </p>
            </div>
          ) : (
            filteredList.map(fs => {
              const isEditing = editingId === fs.id;
              const isResolved = fs.isResolved;
              const isDueNow = !isResolved && fs.targetChapter <= currentChapterNumber;
              const remainingChapters = fs.targetChapter - currentChapterNumber;

              if (isEditing) {
                // 인라인 편집 모드 폼
                return (
                  <div
                    key={fs.id}
                    className={`p-4 rounded-2xl border flex flex-col gap-3.5 transition-all shadow-lg ${
                      isDark
                        ? 'bg-[#1c1d22] border-[#5E6AD2]/50 shadow-black/40'
                        : 'bg-white border-[#5E6AD2]/50 shadow-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-[#7480E2]" />
                        <span className="text-xs font-bold text-[#7480E2]">복선 정보 수정</span>
                      </div>
                      <span className="text-[10px] text-gray-500">등록일: {new Date(fs.createdAt || '').toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-gray-400">
                        복선 이름 <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="복선 이름을 입력하세요"
                        className={`px-3 py-2 rounded-xl text-xs border outline-none font-bold transition-all ${
                          isDark
                            ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]'
                            : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-semibold text-gray-400">설치 회차 (심은 화)</label>
                        <input
                          type="number"
                          min="1"
                          value={editCreatedChapter}
                          onChange={e => setEditCreatedChapter(Math.max(1, parseInt(e.target.value) || 1))}
                          className={`px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                            isDark
                              ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]'
                              : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-gray-400">회수 목표 회차 (회수 예정)</label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditTargetChapter(prev => Math.max(1, prev + 5))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/15 text-[#7480E2] hover:bg-[#5E6AD2]/25"
                            >
                              +5화
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditTargetChapter(prev => Math.max(1, prev + 10))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5E6AD2]/15 text-[#7480E2] hover:bg-[#5E6AD2]/25"
                            >
                              +10화
                            </button>
                          </div>
                        </div>
                        <input
                          type="number"
                          min={editCreatedChapter}
                          value={editTargetChapter}
                          onChange={e => setEditTargetChapter(Math.max(1, parseInt(e.target.value) || 1))}
                          className={`px-3 py-2 rounded-xl text-xs border outline-none font-bold transition-all ${
                            isDark
                              ? 'bg-[#121316] border-white/[0.08] text-emerald-400 focus:border-[#5E6AD2]'
                              : 'bg-gray-50 border-black/[0.08] text-emerald-600 focus:border-[#5E6AD2]'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-semibold text-gray-400">상세 내용 및 복선 단서</label>
                      <textarea
                        rows={2}
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        placeholder="복선 관련 복선 힌트, 단서, 회수 연출 등을 자유롭게 메모하세요."
                        className={`px-3 py-2 rounded-xl text-xs border outline-none resize-none transition-all ${
                          isDark
                            ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]'
                            : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]'
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-500/10">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-black/[0.06] text-gray-600'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>취소</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(fs)}
                        className="px-4 py-1.5 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-[#5E6AD2]/20"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>수정 완료</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // 기본 카드 뷰
              return (
                <div
                  key={fs.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                    isResolved
                      ? isDark
                        ? 'bg-emerald-500/[0.03] border-emerald-500/20 opacity-80'
                        : 'bg-emerald-50/60 border-emerald-300/50 opacity-90'
                      : isDueNow
                        ? isDark
                          ? 'bg-red-500/[0.07] border-red-500/40 shadow-md shadow-red-500/5'
                          : 'bg-red-50/90 border-red-300/80 shadow-sm'
                        : isDark
                          ? 'bg-[#121316] border-white/[0.06] hover:border-white/[0.15]'
                          : 'bg-gray-50/80 border-black/[0.06] hover:border-black/[0.15]'
                  }`}
                >
                  {/* 카드 1열: 상태 체크, 제목, 뱃지, 액션 버튼 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleResolve(fs.id)}
                        className={`mt-0.5 transition-colors shrink-0 ${
                          isResolved
                            ? 'text-emerald-400 hover:text-emerald-300'
                            : isDueNow
                              ? 'text-red-400 hover:text-red-300'
                              : 'text-amber-400 hover:text-amber-300'
                        }`}
                        title={isResolved ? '복선 미회수 상태로 되돌리기' : '복선 회수 완료 처리'}
                      >
                        {isResolved ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Circle className={`w-4 h-4 ${isDueNow ? 'animate-pulse' : ''}`} />
                        )}
                      </button>

                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`text-sm font-bold truncate ${
                              isResolved
                                ? isDark
                                  ? 'line-through text-emerald-400/70'
                                  : 'line-through text-emerald-700/70'
                                : isDueNow
                                  ? 'text-red-400 dark:text-red-300'
                                  : isDark
                                    ? 'text-white'
                                    : 'text-gray-900'
                            }`}
                          >
                            {fs.title}
                          </h4>

                          {/* 상태 뱃지 */}
                          {isResolved ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>회수 완료</span>
                            </span>
                          ) : isDueNow ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1 animate-pulse">
                              🔥 즉시 회수 대상 ({fs.targetChapter}화 목표)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#5E6AD2]/15 text-[#7480E2] border border-[#5E6AD2]/25 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{remainingChapters}화 남음 ({fs.targetChapter}화 목표)</span>
                            </span>
                          )}
                        </div>

                        {/* 출처 및 상세 설명 */}
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            설치: [{fs.createdChapter}화] {fs.createdEpisodeTitle ? `"${fs.createdEpisodeTitle}"` : ''}
                          </span>
                          <span className="flex items-center gap-1 text-[#7480E2] font-semibold">
                            <ArrowUpRight className="w-3 h-3" />
                            목표: [{fs.targetChapter}화]
                          </span>
                        </div>

                        {fs.description && (
                          <p className={`text-xs mt-0.5 leading-relaxed whitespace-pre-wrap break-all line-clamp-2 ${
                            isResolved
                              ? isDark ? 'text-emerald-300/50' : 'text-emerald-900/60'
                              : isDueNow
                                ? isDark ? 'text-red-200/80' : 'text-red-900/80'
                                : isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {fs.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 액션 버튼 그룹 */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEditing(fs)}
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors ${
                          isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]'
                        }`}
                        title="복선 수정 (이름, 화수, 단서)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fs)}
                        className={`p-1.5 rounded-lg text-gray-400 hover:text-red-400 transition-colors ${
                          isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                        }`}
                        title="복선 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 카드 2열: 빠른 회수 화수 연장 컨트롤바 */}
                  {!isResolved && (
                    <div className={`mt-1 pt-2 border-t flex items-center justify-between gap-2 flex-wrap text-[11px] ${
                      isDark ? 'border-white/[0.04]' : 'border-black/[0.04]'
                    }`}>
                      <span className="text-gray-500 text-[10px] font-medium flex items-center gap-1">
                        ⚡ 빠른 목표 화수 늘리기:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleExtendTargetChapter(fs, 1)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] border ${
                            isDark
                              ? 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 border-white/[0.08]'
                              : 'bg-white hover:bg-gray-100 text-gray-700 border-black/[0.08]'
                          }`}
                          title="목표 회수를 +1화 뒤로 늘립니다"
                        >
                          +1화
                        </button>
                        <button
                          onClick={() => handleExtendTargetChapter(fs, 5)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] border ${
                            isDark
                              ? 'bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#7480E2] border-[#5E6AD2]/20'
                              : 'bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#5E6AD2] border-[#5E6AD2]/20'
                          }`}
                          title="목표 회수를 +5화 뒤로 늘립니다"
                        >
                          +5화
                        </button>
                        <button
                          onClick={() => handleExtendTargetChapter(fs, 10)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] border ${
                            isDark
                              ? 'bg-[#5E6AD2]/15 hover:bg-[#5E6AD2]/25 text-[#7480E2] border-[#5E6AD2]/30'
                              : 'bg-[#5E6AD2]/15 hover:bg-[#5E6AD2]/25 text-[#5E6AD2] border-[#5E6AD2]/30'
                          }`}
                          title="목표 회수를 +10화 뒤로 늘립니다"
                        >
                          +10화
                        </button>
                        <button
                          onClick={() => handleExtendTargetChapter(fs, 20)}
                          className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] border ${
                            isDark
                              ? 'bg-[#5E6AD2]/20 hover:bg-[#5E6AD2]/30 text-[#7480E2] border-[#5E6AD2]/40'
                              : 'bg-[#5E6AD2]/20 hover:bg-[#5E6AD2]/30 text-[#5E6AD2] border-[#5E6AD2]/40'
                          }`}
                          title="목표 회수를 +20화 뒤로 늘립니다"
                        >
                          +20화
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 하단 푸터 */}
        <div className="p-4 border-t border-gray-500/10 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-gray-500">
            총 {totalCount}개 중 {filteredList.length}개 표시됨
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              isDark ? 'hover:bg-white/[0.06] text-gray-300' : 'hover:bg-black/[0.06] text-gray-700'
            }`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
