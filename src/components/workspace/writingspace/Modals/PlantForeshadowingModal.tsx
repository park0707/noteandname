import { useState, useEffect, useMemo } from 'react';
import { X, GitCommit } from 'lucide-react';
import type { Episode } from '../../types';
import { getOrderedDocumentList } from '../../utils';

interface PlantForeshadowingModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  episodes: Episode[];
  selectedEpisodeId: string | null;
  onPlant: (
    title: string,
    description: string,
    createdChapter: number,
    targetChapter: number,
    plantedEpisodeId?: string,
    plantedEpisodeTitle?: string
  ) => void;
}

export default function PlantForeshadowingModal({
  isDark,
  isOpen,
  onClose,
  episodes,
  selectedEpisodeId,
  onPlant,
}: PlantForeshadowingModalProps) {
  const orderedDocs = useMemo(() => getOrderedDocumentList(episodes), [episodes]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetEpisodeId, setTargetEpisodeId] = useState<string>('');
  const [offsetChapters, setOffsetChapters] = useState<number>(30);

  // 현재 선택된 문서의 1-based 순번 및 에피소드 찾기
  const selectedDocIndex = useMemo(() => {
    if (!targetEpisodeId) return 1;
    const idx = orderedDocs.findIndex(doc => doc.id === targetEpisodeId);
    return idx >= 0 ? idx + 1 : 1;
  }, [orderedDocs, targetEpisodeId]);

  const plantedDoc = useMemo(() => {
    return orderedDocs.find(doc => doc.id === targetEpisodeId) || orderedDocs[0] || null;
  }, [orderedDocs, targetEpisodeId]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setOffsetChapters(30);
      const defaultId = selectedEpisodeId || (orderedDocs[0]?.id || '');
      setTargetEpisodeId(defaultId);
    }
  }, [isOpen, selectedEpisodeId, orderedDocs]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const createdChapter = selectedDocIndex;
    const targetChapter = createdChapter + Math.max(1, offsetChapters);

    onPlant(
      title.trim(),
      description.trim(),
      createdChapter,
      targetChapter,
      plantedDoc?.id,
      plantedDoc?.title
    );
    onClose();
  };

  const calculatedTargetChapter = selectedDocIndex + Math.max(1, offsetChapters);

  return (
    <div className="fixed inset-[#00000080] z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark
            ? 'bg-[#18191C] border-white/[0.08] text-gray-200'
            : 'bg-white border-black/[0.08] text-gray-800'
        }`}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-500/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#5E6AD2]/10 text-[#7480E2]">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">새 복선 설치</h3>
              <p className="text-[11px] text-gray-500">선택한 에피소드 문서에 복선 단서를 등록하고 회수 타임라인을 설정합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors ${
              isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.06]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">
              복선 설치 문서 (기본: 현재 보는 문서) <span className="text-red-400">*</span>
            </label>
            <select
              value={targetEpisodeId}
              onChange={e => setTargetEpisodeId(e.target.value)}
              className={`px-3 py-2.5 rounded-xl text-xs border outline-none cursor-pointer transition-all ${
                isDark
                  ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]/60'
                  : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]/60'
              }`}
            >
              {orderedDocs.length === 0 ? (
                <option value="">(등록된 회차 문서 없음)</option>
              ) : (
                orderedDocs.map((doc, idx) => (
                  <option key={doc.id} value={doc.id}>
                    [{idx + 1}화] {doc.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">
              복선 이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 주인공 오른쪽 목덜미의 붉은 낙인"
              className={`px-3 py-2.5 rounded-xl text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]/60'
                  : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]/60'
              }`}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">복선 상세 내용 및 단서</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="복선 관련 비밀 연출, 단서 힌트, 회수 구상 등을 자유롭게 메모하세요."
              className={`px-3 py-2.5 rounded-xl text-xs border outline-none resize-none transition-all ${
                isDark
                  ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]/60'
                  : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]/60'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">회수 주기 (몇 화 뒤 회수)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  required
                  value={offsetChapters}
                  onChange={e => setOffsetChapters(parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition-all ${
                    isDark
                      ? 'bg-[#121316] border-white/[0.08] text-white focus:border-[#5E6AD2]/60'
                      : 'bg-gray-50 border-black/[0.08] text-gray-900 focus:border-[#5E6AD2]/60'
                  }`}
                />
                <span className="text-xs text-gray-400 font-bold shrink-0">화 뒤</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 justify-end pb-1">
              <div className={`p-2.5 rounded-xl border text-[11px] flex flex-col justify-center ${
                isDark ? 'bg-[#121316] border-white/[0.06] text-gray-300' : 'bg-gray-50 border-black/[0.06] text-gray-700'
              }`}>
                <span className="text-[10px] text-gray-500 font-semibold">목표 회수 회차 산정</span>
                <span className="font-bold text-[#7480E2]">
                  {selectedDocIndex}화 + {Math.max(1, offsetChapters)}화 ➔ <span className="text-emerald-400">{calculatedTargetChapter}화</span>
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-500/10 mt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isDark ? 'hover:bg-white/[0.06] text-gray-400' : 'hover:bg-black/[0.06] text-gray-600'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#5E6AD2] hover:bg-[#7480E2] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#5E6AD2]/20"
            >
              복선 설치 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
