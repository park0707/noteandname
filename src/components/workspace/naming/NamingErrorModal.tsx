import React, { useEffect, useState } from 'react';
import {
  WifiOff,
  KeyRound,
  Gauge,
  ServerCrash,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2
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
  const [showDetails, setShowDetails] = useState<boolean>(false);

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
          badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
          badgeText: '네트워크 연결 오류',
          iconColor: 'text-sky-400',
          buttonColor: 'bg-sky-600 hover:bg-sky-500 text-white'
        };
      case 'auth':
        return {
          icon: KeyRound,
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
          badgeText: 'API 인증 / 키 오류',
          iconColor: 'text-amber-400',
          buttonColor: 'bg-amber-600 hover:bg-amber-500 text-white'
        };
      case 'quota':
        return {
          icon: Gauge,
          badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          badgeText: '쿼터 / 사용량 초과',
          iconColor: 'text-orange-400',
          buttonColor: 'bg-orange-600 hover:bg-orange-500 text-white'
        };
      case 'server':
        return {
          icon: ServerCrash,
          badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          badgeText: 'AI 서비스 일시 장애',
          iconColor: 'text-rose-400',
          buttonColor: 'bg-rose-600 hover:bg-rose-500 text-white'
        };
      case 'unknown':
      default:
        return {
          icon: AlertTriangle,
          badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
          badgeText: '작명 생성 오류',
          iconColor: 'text-rose-400',
          buttonColor: 'bg-slate-700 hover:bg-slate-600 text-white'
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
          <div className="flex-1 pr-6">
            <span className={`inline-block px-3 py-0.5 text-[11px] font-semibold rounded-lg border ${theme.badgeColor} mb-1.5`}>
              {theme.badgeText}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight leading-snug">
              {error.title}
            </h3>
          </div>
        </div>

        {/* 설명 본문 */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 px-0.5">
          {error.description}
        </p>

        {/* 문제 해결 가이드 리스트 (상하좌우 여백 확장) */}
        {error.troubleshooting && error.troubleshooting.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 mb-5">
            <span className="block text-xs font-bold text-slate-300 mb-3 pb-2 border-b border-slate-800/80">
              권장 조치 가이드
            </span>
            <ul className="space-y-2.5">
              {error.troubleshooting.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-3 text-xs sm:text-[13px] text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400/90 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-normal">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 기술적 상세 에러 메시지 (아코디언 토글) */}
        {error.rawMessage && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowDetails(prev => !prev)}
              className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-800/60"
            >
              <span>기술 상세 로그 {showDetails ? '접기' : '확인'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showDetails && (
              <pre className="mt-2.5 p-4 rounded-xl bg-black/60 border border-slate-800 text-[11px] text-rose-300/90 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto leading-relaxed">
                {error.rawMessage}
              </pre>
            )}
          </div>
        )}

        {/* 하단 버튼 영역 */}
        <div className="flex items-center justify-end space-x-3 pt-3.5 border-t border-slate-800/80">
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
