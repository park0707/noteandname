import React, { useState, useMemo } from 'react';
import type { ArchiveCategory, ArchiveItem, NameBankItem, Node } from '../types';
import { Bookmark, Trash2, PlusCircle, CheckCircle, Search, ShieldCheck } from 'lucide-react';

interface NameBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bankItems: NameBankItem[];
  onUpdateStatus: (itemId: string, status: 'saved' | 'used' | 'discarded') => void;
  onDeleteItem: (itemId: string) => void;
  onRegisterArchive?: (name: string, category: ArchiveCategory, meaning: string) => void;
  onAddToArchive?: (candidate: Partial<{ name: string; meaning: string; category: ArchiveCategory }>, targetCat?: ArchiveCategory) => void;
  isDark?: boolean;
  archiveItems?: ArchiveItem[];
  relationNodes?: Node[];
}

export const NameBankDrawer: React.FC<NameBankDrawerProps> = React.memo(({
  isOpen,
  onClose,
  bankItems,
  onUpdateStatus,
  onDeleteItem,
  onRegisterArchive,
  onAddToArchive,
  isDark: _isDark = true,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bank' | 'jamo'>('bank');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredItems = useMemo(() => {
    return bankItems.filter(item => {
      if (filterCategory !== 'all' && item.targetCategory !== filterCategory) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [bankItems, filterCategory, filterStatus, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-[#121318] border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-[#5E6AD2]" />
            <h2 className="text-sm font-bold text-slate-100">이름 보관함 및 자모 검사</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors font-medium"
          >
            닫기
          </button>
        </div>

        {/* 서브 탭 메인 툴바 */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 pt-2 space-x-2">
          <button
            onClick={() => setActiveSubTab('bank')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeSubTab === 'bank'
                ? 'bg-[#121318] border-[#5E6AD2]/60 text-slate-100 border-b-2 border-b-[#5E6AD2]'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 text-[#5E6AD2]" />
            <span>이름 뱅크 목록 ({bankItems.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('jamo')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all ${
              activeSubTab === 'jamo'
                ? 'bg-[#121318] border-emerald-500/60 text-emerald-300 border-b-2 border-b-emerald-500'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>자모 유사도 검사</span>
          </button>
        </div>

        {activeSubTab === 'bank' ? (
          <>
            {/* 검색 및 필터 */}
            <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-900/40">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="보관된 이름 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#5E6AD2]"
                />
              </div>

              <div className="flex gap-2 text-xs">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#5E6AD2]"
                >
                  <option value="all">모든 카테고리</option>
                  <option value="character">캐릭터</option>
                  <option value="location">장소</option>
                  <option value="equipment">장비</option>
                  <option value="skill">기술</option>
                  <option value="etc">기타</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#5E6AD2]"
                >
                  <option value="all">모든 상태</option>
                  <option value="saved">보관됨 (saved)</option>
                  <option value="used">사용함 (used)</option>
                  <option value="discarded">제외됨 (discarded)</option>
                </select>
              </div>
            </div>

            {/* 아이템 목록 */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  보관함에 저장된 이름이 없습니다.
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-100">{item.name}</span>
                        <span className="ml-2 text-[9px] px-2 py-0.5 rounded-md bg-[#5E6AD2]/20 text-indigo-300 border border-[#5E6AD2]/40 font-semibold">
                          {item.targetCategory}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onUpdateStatus(item.id, item.status === 'used' ? 'saved' : 'used')}
                          title="사용 완료 상태 토글"
                          className={`p-1 rounded-lg transition-colors ${
                            item.status === 'used' ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          title="삭제"
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {item.meaning}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                      <span className="text-slate-500 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>

                      <button
                        onClick={() => {
                          if (onAddToArchive) {
                            onAddToArchive({ name: item.name, meaning: item.meaning, category: item.targetCategory }, item.targetCategory);
                          } else if (onRegisterArchive) {
                            onRegisterArchive(item.name, item.targetCategory, item.meaning);
                          }
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-violet-950/40 hover:bg-violet-900/60 text-violet-200 border border-violet-800/40 rounded-lg transition-colors font-semibold"
                      >
                        <PlusCircle className="w-3 h-3 text-violet-400" />
                        <span>아카이브 등록</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 text-xs text-slate-400 leading-relaxed">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-slate-200 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>실시간 초성/자모 유사도 중복 검사 시스템</span>
              </h3>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                현재 생성된 이름 결과와 기존 아카이브 항목 간의 한글 초성/자모거리 유사도를 0~100% 비율로 정밀 분석하여 중복 작명을 방지합니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
