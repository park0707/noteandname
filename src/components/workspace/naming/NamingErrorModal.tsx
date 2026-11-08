import React, { useEffect } from 'react';
import {
  WifiOff,
  KeyRound,
  Gauge,
  ServerCrash,
  AlertTriangle,
  X
} from 'lucide-react';
import type { NamingErrorInfo, NamingErrorType } from './namingErrors';

interface NamingErrorModalProps {
  error: NamingErrorInfo | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const NamingErrorModal: React.FC<NamingErrorModalProps> = ({
  error,
  onClose,
  onRetry
}) => {
  useEffect(() => {
    if (!error) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [error, onClose]);

  if (!error) return null;

  const getTheme = (type: NamingErrorType) => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          iconColor: 'text-sky-400'
        };
      case 'auth':
        return {
          icon: KeyRound,
          iconColor: 'text-amber-400'
        };
      case 'quota':
        return {
          icon: Gauge,
          iconColor: 'text-orange-400'
        };
      case 'server':
        return {
          icon: ServerCrash,
          iconColor: 'text-rose-400'
        };
      case 'unknown':
      default:
        return {
          icon: AlertTriangle,
          iconColor: 'text-rose-400'
        };
    }
  };

  const theme = getTheme(error.type);
  const IconComponent = theme.icon;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-[#161720] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl text-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title="닫기 (ESC)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 상단 아이콘 & 배지/제목 헤더 */}
        <div className="flex items-center space-x-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
            <IconComponent className={`w-6 h-6 ${theme.iconColor}`} />
          </div>
          <div className="flex-1 pr-6 pl-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-snug">
              {error.title}
            </h3>
          </div>
        </div>

        {/* 설명 본문 */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 px-0.5 py-1">
          {error.description}
        </p>

        

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-end space-x-3 pt-3.5  gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              다시 시도
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-[#5E6AD2] hover:bg-[#4D58C0] text-white transition-colors shadow-md"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
