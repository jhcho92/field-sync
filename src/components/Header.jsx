import React, { useState, useEffect } from 'react';
import { QrCode, MapPinned, Plus, List, Menu, X } from 'lucide-react';

const Header = ({ onShowQR, onShowSave, onShowLocationList }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (showMenu) {
      setShouldRender(true);
      setIsClosing(false);
    }
  }, [showMenu]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMenu(false);
      setIsClosing(false);
      setShouldRender(false);
    }, 300); // 메뉴 애니메이션은 모달보다 조금 빠르게 설정
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = () => handleClose();
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showMenu]);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-all border-b border-gray-50">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
          <MapPinned className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          FieldSync
        </h1>
      </div>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (showMenu) {
              handleClose();
            } else {
              setShowMenu(true);
            }
          }}
          className={`p-2.5 rounded-full transition-all active:scale-90 shadow-sm ${
            showMenu ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
          aria-label="Menu"
        >
          {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* 확장 메뉴 (Dropdown) */}
        {shouldRender && (
          <div 
            className={`absolute top-full right-0 w-48 bg-white rounded-[1.5rem] shadow-2xl border border-gray-50 overflow-hidden origin-top-right z-[110] ${
              isClosing ? 'animate-menu-out' : 'animate-menu-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 flex flex-col gap-1">
              <button
                onClick={() => {
                  onShowSave();
                  handleClose();
                }}
                className="flex items-center gap-3 w-full p-4 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl transition-colors font-bold text-base group"
              >
                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                위치 추가
              </button>
              
              <button
                onClick={() => {
                  onShowLocationList();
                  handleClose();
                }}
                className="flex items-center gap-3 w-full p-4 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl transition-colors font-bold text-base group"
              >
                <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                  <List className="w-4 h-4" />
                </div>
                장소 목록
              </button>

              <button
                onClick={() => {
                  onShowQR();
                  handleClose();
                }}
                className="flex items-center gap-3 w-full p-4 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-xl transition-colors font-bold text-base group"
              >
                <div className="p-1.5 bg-gray-100 text-gray-500 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
                  <QrCode className="w-4 h-4" />
                </div>
                앱 공유
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
