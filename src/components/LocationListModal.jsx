import React from 'react';
import { X, MapPin, Share2, Clock, MapPinned, Trash2, Edit2 } from 'lucide-react';

const LocationListModal = ({ 
  isOpen, 
  onClose, 
  title = '목록', 
  icon: Icon = Clock,
  locations, 
  onShare, 
  onEdit,
  onDelete, 
  onClearAll,
  emptyMessage = '목록이 비어있어요',
  showClearAll = true
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

  const isLocationMode = title === '저장한 장소들';

  return (
    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm transition-all ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    }`}>
      <div className={`bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden ${
        isClosing ? 'animate-slide-down' : 'animate-slide-up'
      }`}>
        <div className="pt-8 px-8 pb-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Icon className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          {showClearAll && locations.length > 0 && (
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm px-8 py-4 border-b border-gray-50 flex justify-start shrink-0">
              <button
                onClick={onClearAll}
                className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors px-1"
              >
                모두 지우기
              </button>
            </div>
          )}
          
          <div className="px-8 space-y-4 py-4">
            {locations.length > 0 ? (
              locations.map((loc) => (
                <div 
                  key={loc.id} 
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-bold text-gray-900 text-lg truncate">{loc.name}</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{loc.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onEdit && isLocationMode && (
                      <button 
                        onClick={() => onEdit(loc)} 
                        className="p-3 bg-indigo-50 text-indigo-500 hover:bg-indigo-100 rounded-xl transition-all active:scale-90"
                        title="수정하기"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                    )}
                    {onShare && !isLocationMode && (
                      <button 
                        onClick={() => onShare(loc)} 
                        className="p-3 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-all active:scale-90"
                        title="공유하기"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(loc.id)} 
                        className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-90"
                        title="지우기"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">{emptyMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationListModal;
