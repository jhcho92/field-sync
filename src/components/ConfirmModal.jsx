import React from 'react';
import { X, AlertCircle } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = '확인했어요', 
  type = 'default' // 'default' or 'danger'
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShouldRender(false);
      setIsClosing(false);
      onClose();
    }, 600);
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm transition-all ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    }`}>
      <div className={`bg-white w-full max-sm:max-w-xs max-w-sm rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden relative ${
        isClosing ? 'animate-slide-down' : 'animate-slide-up'
      }`}>
        <button 
          onClick={handleClose} 
          className="absolute top-6 right-6 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95 z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
        <div className="p-8 pb-4 flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
          }`}>
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-gray-500 font-medium leading-relaxed break-keep text-center px-2">
            {message}
          </p>
        </div>

        <div className="p-6 pt-2 flex flex-col gap-2">
          <button
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className={`w-full h-14 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] ${
              type === 'danger' 
                ? 'bg-red-500 text-white shadow-lg shadow-red-100' 
                : 'bg-blue-500 text-white shadow-lg shadow-blue-100'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
