import { useRef, useState } from 'react';
import { X, Upload, FolderUp, FileText, Loader2, AlertCircle } from 'lucide-react';

export interface FileEntry {
  path: string;
  name: string;
  content: string;
}

interface LocalImportModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  onImport: (files: FileEntry[]) => void;
}

export default function LocalImportModal(props: LocalImportModalProps) {
  const { isDark, isOpen, onClose, onImport } = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 파일 판별 및 크기 안전장치 헬퍼 (5MB 제한)
  const isTextFile = (file: File): boolean => {
    const isTextExtension =
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.json');
    const isTextMime = file.type.startsWith('text/');
    const isUnderLimit = file.size <= 5 * 1024 * 1024; // 5MB
    return (isTextExtension || isTextMime) && isUnderLimit;
  };

  // File System Access API - Directory Reader helper
  const readDirectoryRecursive = async (
    dirHandle: any,
    currentPath: string = ''
  ): Promise<FileEntry[]> => {
    const files: FileEntry[] = [];
    for await (const entry of dirHandle.values()) {
      const relativePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        if (isTextFile(file)) {
          const content = await file.text();
          files.push({
            path: relativePath,
            name: entry.name,
            content,
          });
        }
      } else if (entry.kind === 'directory') {
        const subFiles = await readDirectoryRecursive(entry, relativePath);
        files.push(...subFiles);
      }
    }
    return files;
  };

  // 1. File System Access API - Directory Picker
  const handleDirectoryPicker = async () => {
    if (!('showDirectoryPicker' in window)) {
      // Fallback to standard input
      folderInputRef.current?.click();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const files = await readDirectoryRecursive(dirHandle);
      if (files.length === 0) {
        setError('선택한 폴더에 텍스트 파일(.txt, .md 등, 5MB 이하)이 없습니다.');
        setLoading(false);
        return;
      }
      onImport(files);
      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory Picker Error:', err);
        setError('폴더를 읽어오는 과정에서 에러가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Fallback / Standard Folder Input Change
  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const files: FileEntry[] = [];
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        if (isTextFile(file)) {
          const content = await file.text();
          files.push({
            path: file.webkitRelativePath || file.name,
            name: file.name,
            content,
          });
        }
      }

      if (files.length === 0) {
        setError('업로드한 폴더에 텍스트 파일(.txt, .md 등, 5MB 이하)이 없습니다.');
        setLoading(false);
        return;
      }

      onImport(files);
      onClose();
    } catch (err) {
      console.error(err);
      setError('폴더 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3. File Input Change (Multiple files selection)
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const files: FileEntry[] = [];
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        if (isTextFile(file)) {
          const content = await file.text();
          files.push({
            path: file.name,
            name: file.name,
            content,
          });
        }
      }

      if (files.length === 0) {
        setError('선택한 파일 중 올바른 텍스트 파일(.txt, .md 등, 5MB 이하)이 없습니다.');
        setLoading(false);
        return;
      }

      onImport(files);
      onClose();
    } catch (err) {
      console.error(err);
      setError('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      {/* Hidden Fallback Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".txt,.md,.html,.json,text/plain"
        className="hidden"
      />

      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderInputChange}
        {...({
          webkitdirectory: '',
          directory: '',
          multiple: true,
        } as any)}
        className="hidden"
      />

      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6 md:p-8 flex flex-col ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-500/10 mb-4">
          <div className="flex items-center gap-2">
            <FolderUp className="w-5 h-5 text-[#5E6AD2]" />
            <h3 className={`font-heading font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
              로컬 파일/폴더 가져오기
            </h3>
          </div>
          <button
            onClick={loading ? undefined : onClose}
            disabled={loading}
            className={`p-1 rounded hover:bg-white/[0.04] transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="leading-snug">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#5E6AD2]" />
            <span className="text-xs text-gray-500 font-medium">로컬 문서를 스캔하고 변환하는 중...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              사용자의 PC 로컬 원고 파일(`.txt`, `.md`)을 노벨플로우 집필실로 가져옵니다.
              폴더를 선택하시면 하위 폴더 구조를 유지한 채 계층형으로 자동 생성해 줍니다.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* Select Files Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`py-4 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ${
                  isDark
                    ? 'bg-[#2B2D31]/30 hover:bg-[#2B2D31]/70 border-white/[0.06] hover:border-[#5E6AD2]/50'
                    : 'bg-gray-50/50 hover:bg-gray-50 border-black/[0.06] hover:border-[#5E6AD2]/50'
                }`}
              >
                <div className={`p-2.5 rounded-full ${isDark ? 'bg-white/5 text-[#7480E2]' : 'bg-black/5 text-[#5E6AD2]'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>파일 가져오기</span>
                <span className="text-[10px] text-gray-500 text-center">개별 텍스트 파일들 선택</span>
              </button>

              {/* Select Folder Button */}
              <button
                onClick={handleDirectoryPicker}
                className={`py-4 px-4 rounded-xl border flex flex-col items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer ${
                  isDark
                    ? 'bg-[#2B2D31]/30 hover:bg-[#2B2D31]/70 border-white/[0.06] hover:border-[#5E6AD2]/50'
                    : 'bg-gray-50/50 hover:bg-gray-50 border-black/[0.06] hover:border-[#5E6AD2]/50'
                }`}
              >
                <div className={`p-2.5 rounded-full ${isDark ? 'bg-white/5 text-[#7480E2]' : 'bg-black/5 text-[#5E6AD2]'}`}>
                  <Upload className="w-5 h-5" />
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>폴더 가져오기</span>
                <span className="text-[10px] text-gray-500 text-center">폴더 통째로 구조 유지</span>
              </button>
            </div>

            <div className={`p-3 rounded-lg flex gap-2 text-[10px] leading-relaxed ${isDark ? 'bg-white/[0.02] text-gray-500' : 'bg-black/[0.02] text-gray-500'}`}>
              <span className="font-bold shrink-0">안내:</span>
              <span>
                웹 표준 보안 정책상, 로컬 파일을 가져올 때 브라우저의 파일 읽기 접근 승인 확인창이 표시될 수 있습니다.
                가져오기 처리는 전적으로 브라우저 내부(Client-side)에서 수행되므로 외부로 업로드되거나 유출되지 않아 안전합니다.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
