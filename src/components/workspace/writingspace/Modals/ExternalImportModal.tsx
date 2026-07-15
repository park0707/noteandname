interface ExternalImportModalProps {
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
  type: 'notion' | 'google' | null;
  onImport: (selectedItems: { title: string; content: string }[]) => void;
}

export default function ExternalImportModal(props: ExternalImportModalProps) {
  const { isDark, isOpen, onClose, type } = props;

  if (!isOpen || !type) return null;

  const providerName = type === 'notion' ? '노션(Notion)' : '구글 드라이브(Google Drive)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-md mx-4 rounded-2xl border shadow-2xl p-6 md:p-8 flex flex-col items-center text-center ${isDark ? 'bg-[#1E1F22] border-white/[0.08]' : 'bg-white border-black/[0.08]'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl ${isDark ? 'bg-yellow-500/10 text-yellow-400' : 'bg-yellow-500/5 text-yellow-600'}`}>
          ⚠️
        </div>
        <h3 className={`font-heading font-bold text-base mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          {providerName} 가져오기 기능 안내
        </h3>
        <p className={`text-xs leading-relaxed mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          현재 {providerName} 작업물 가져오기 및 실시간 연동 기능은 <strong>설계 단계(미구현)</strong>에 있습니다.<br />
          추후 공식 API 서버 자격 증명 연동이 완료되면 본 기능을 통해 외부 원고를 가져오실 수 있도록 업데이트될 예정입니다.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#5E6AD2] hover:bg-[#7480E2] text-white transition-all shadow-md shadow-[#5E6AD2]/20"
        >
          확인
        </button>
      </div>
    </div>
  );
}
