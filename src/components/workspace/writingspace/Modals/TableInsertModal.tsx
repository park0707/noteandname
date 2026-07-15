import React from 'react';

interface TableInsertModalProps {
  isDark: boolean;
  showTableModal: boolean;
  setShowTableModal: (show: boolean) => void;
  tableRows: number;
  setTableRows: (rows: number) => void;
  tableCols: number;
  setTableCols: (cols: number) => void;
  tableWidth: number;
  setTableWidth: (width: number) => void;
  tableHasHeader: boolean;
  setTableHasHeader: (header: boolean) => void;
  executeInsertTable: (e: React.FormEvent) => void;
}

export default function TableInsertModal({
  isDark,
  showTableModal,
  setShowTableModal,
  tableRows,
  setTableRows,
  tableCols,
  setTableCols,
  tableWidth,
  setTableWidth,
  tableHasHeader,
  setTableHasHeader,
  executeInsertTable
}: TableInsertModalProps) {
  if (!showTableModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-80 rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
        isDark ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200' : 'bg-white border-black/[0.08] text-gray-800'
      }`}>
        <div className="flex items-center justify-between pb-2 border-b border-gray-500/10">
          <h3 className="text-sm font-bold">📊 표(Table) 삽입</h3>
          <button 
            type="button"
            onClick={() => setShowTableModal(false)}
            className="text-gray-400 hover:text-gray-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={executeInsertTable} className="flex flex-col gap-3.5 text-xs">
          <div className="flex gap-3">
            {/* 행 */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="font-semibold text-gray-400">행 (Rows)</span>
              <input
                type="number"
                min="1"
                max="20"
                required
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                }`}
              />
            </div>
            {/* 열 */}
            <div className="flex-1 flex flex-col gap-1">
              <span className="font-semibold text-gray-400">열 (Cols)</span>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-1.5 rounded-lg border outline-none ${
                  isDark ? 'bg-white/[0.02] border-white/[0.08] text-white focus:border-[#5E6AD2]' : 'bg-black/[0.01] border-black/[0.08] text-black focus:border-[#5E6AD2]'
                }`}
              />
            </div>
          </div>

          {/* 너비 선택 */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-gray-400">가로폭 너비 (%)</span>
            <select
              value={tableWidth}
              onChange={(e) => setTableWidth(parseInt(e.target.value) || 100)}
              className={`px-3 py-1.5 rounded-lg border outline-none cursor-pointer ${
                isDark ? 'bg-[#1E1F22] border-white/[0.08] text-white' : 'bg-white border-black/[0.08] text-black'
              }`}
            >
              <option value="100">100% (전체)</option>
              <option value="80">80% (보통)</option>
              <option value="50">50% (절반)</option>
              <option value="30">30% (좁게)</option>
            </select>
          </div>

          {/* 첫 줄 헤더 행 여부 */}
          <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
            <input
              type="checkbox"
              checked={tableHasHeader}
              onChange={(e) => setTableHasHeader(e.target.checked)}
              className="rounded border-gray-300 text-[#5E6AD2] focus:ring-[#5E6AD2] w-4 h-4"
            />
            <span className="font-semibold text-gray-400">첫 행을 제목 열(Header)로 지정</span>
          </label>

          {/* 버튼 그룹 */}
          <div className="flex gap-2.5 mt-2">
            <button
              type="button"
              onClick={() => setShowTableModal(false)}
              className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                isDark ? 'border-white/[0.06] hover:bg-white/[0.04]' : 'border-black/[0.06] hover:bg-black/[0.04]'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl font-bold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all"
            >
              표 삽입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
