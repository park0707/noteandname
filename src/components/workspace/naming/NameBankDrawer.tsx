import React, { useState } from 'react';
import type { ArchiveCategory, NameBankItem } from '../types';
import { Bookmark, Trash2, PlusCircle, CheckCircle, Search } from 'lucide-react';

interface NameBankDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bankItems: NameBankItem[];
  onUpdateStatus: (itemId: string, status: 'saved' | 'used' | 'discarded') => void;
  onDeleteItem: (itemId: string) => void;
  onRegisterArchive: (name: string, category: ArchiveCategory, meaning: string) => void;
}

export const NameBankDrawer: React.FC<NameBankDrawerProps> = ({
  isOpen,
  onClose,
  bankItems,
  onUpdateStatus,
  onDeleteItem,
  onRegisterArchive
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredItems = bankItems.filter(item => {
    if (filterCategory !== 'all' && item.targetCategory !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* 헤더 */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-100">이름 뱅크 & 보관함 (Name Bank)</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 bg-slate-800 rounded-md"
          >
            닫기
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-900/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="보관된 이름 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 text-xs">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1"
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
              className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 rounded px-2 py-1"
            >
              <option value="all">모든 상태</option>
              <option value="saved">보관됨 (saved)</option>
              <option value="used">사용함 (used)</option>
              <option value="discarded">제외됨 (discarded)</option>
            </select>
          </div>
        </div>

        {/* 아이템 목록 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              보관함에 저장된 이름이 없습니다.
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-100">{item.name}</span>
                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                      {item.targetCategory}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onUpdateStatus(item.id, item.status === 'used' ? 'saved' : 'used')}
                      title="사용 완료 상태 토글"
                      className={`p-1 rounded transition-colors ${
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

                <p className="text-[11px] text-slate-400 leading-tight">
                  {item.meaning}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                  <span className="text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => onRegisterArchive(item.name, item.targetCategory, item.meaning)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 rounded-md transition-colors"
                  >
                    <PlusCircle className="w-3 h-3 text-indigo-400" />
                    <span>아카이브에 바로 등록</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 푸터 */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-xs text-slate-500">
          총 {filteredItems.length}개의 이름 보관 중
        </div>
      </div>
    </div>
  );
};
