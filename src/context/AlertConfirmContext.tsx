import { createContext, useContext, useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

interface AlertConfirmContextType {
  showAlert: (message: string, title?: string) => Promise<boolean>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertConfirmContext = createContext<AlertConfirmContextType | undefined>(undefined);

export function AlertConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isConfirm, setIsConfirm] = useState(false);
  const [resolveRef, setResolveRef] = useState<((val: boolean) => void) | null>(null);

  const showAlert = (msg: string, t = '알림') => {
    setMessage(msg);
    setTitle(t);
    setIsConfirm(false);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const showConfirm = (msg: string, t = '확인') => {
    setMessage(msg);
    setTitle(t);
    setIsConfirm(true);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveRef) resolveRef(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveRef) resolveRef(false);
  };

  // Check dark mode class on document
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () => {
      const darkActive =
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark') ||
        document.querySelector('#root')?.parentElement?.classList.contains('dark') ||
        false;
      setIsDark(darkActive);
    };

    checkDark();
    // Observe class attribute changes
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return (
    <AlertConfirmContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isConfirm ? undefined : handleCancel} />
          <div className={`relative w-full max-w-sm mx-4 rounded-2xl border p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-2xl ${
            isDark
              ? 'bg-[#1E1F22] border-white/[0.08] text-gray-200 shadow-black/80'
              : 'bg-white border-black/[0.08] text-gray-800 shadow-black/10'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full shrink-0 ${
                isConfirm
                  ? isDark ? 'bg-[#5E6AD2]/10 text-[#7480E2]' : 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                  : 'bg-orange-500/10 text-orange-500'
              }`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap break-all">{message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              {isConfirm && (
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-white/[0.06] hover:bg-white/[0.04] text-gray-400 hover:text-white'
                      : 'border-black/[0.06] hover:bg-black/[0.04] text-gray-600 hover:text-black'
                  }`}
                >
                  취소
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-md shadow-[#5E6AD2]/20 cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlertConfirm() {
  const context = useContext(AlertConfirmContext);
  if (!context) {
    throw new Error('useAlertConfirm must be used within an AlertConfirmProvider');
  }
  return context;
}
