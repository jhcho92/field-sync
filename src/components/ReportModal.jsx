import React, { useState, useEffect, useMemo } from 'react';
import { X, Share2, ChevronRight, Star, Send } from 'lucide-react';
import { calculateDistance } from '../utils/geoUtils';

const ReportModal = ({ isOpen, onClose, onShare, locations, currentPosition, currentAddress }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [note, setNote] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');

  // 거리 순 정렬된 목록 계산
  const sortedLocations = useMemo(() => {
    if (!currentPosition) return locations;

    return [...locations].sort((a, b) => {
      const distA = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        a.latitude,
        a.longitude
      );
      const distB = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        b.latitude,
        b.longitude
      );
      return distA - distB;
    });
  }, [locations, currentPosition]);

  // 팝업 오픈 시 첫 번째 위치 자동 선택
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      if (sortedLocations.length > 0) {
        // 항상 목록의 첫 번째 항목(가장 가까운 위치)을 선택
        setSelectedLocationId(sortedLocations[0].id);
      }
    }
  }, [isOpen, sortedLocations]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setNote('');
      setSelectedLocationId('');
      setShouldRender(false);
      setIsClosing(false);
      onClose();
    }, 600);
  };

  if (!shouldRender) return null;

  const handleShare = async () => {
    if (!selectedLocationId) {
      return;
    }

    const location = locations.find(l => l.id === selectedLocationId);
    if (!location) return;
    const locationName = location.name;

    const shareText = `[${locationName}]${note}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FieldSync 위치 보고',
          text: shareText,
          url: window.location.href,
        });
        // 공유 성공 시 콜백 호출 및 상태 초기화
        onShare({ locationId: selectedLocationId, note });
        handleClose();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // 클립보드 복사 성공 시에도 콜백 호출 및 상태 초기화
      onShare({ locationId: selectedLocationId, note });
      handleClose();
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm transition-all ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    }`}>
      <div className={`bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden ${
        isClosing ? 'animate-slide-down' : 'animate-slide-up'
      }`}>
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Send className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">위치 보고하기</h2>
          </div>
          <button onClick={handleClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="px-8 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <label className="block text-base font-bold text-gray-900 ml-1">어디라고 보고할까요?</label>
            
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {/* 저장된 위치 리스트 */}
              <div className="space-y-2">
                {sortedLocations.map((loc) => {
                  const distance = currentPosition ? calculateDistance(
                    currentPosition.latitude,
                    currentPosition.longitude,
                    loc.latitude,
                    loc.longitude
                  ) : null;

                  const isNearby = distance !== null && distance <= 500;

                  return (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`w-full p-5 rounded-[1.25rem] transition-all flex items-center justify-between border-2 ${
                        selectedLocationId === loc.id
                          ? 'bg-blue-50 border-blue-500 shadow-md shadow-blue-50'
                          : 'bg-gray-50 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-left flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{loc.name}</p>
                          {distance !== null && (
                            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-gray-100 text-gray-400 font-medium shrink-0">
                              {distance < 1 ? '0m' : (distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`)}
                            </span>
                          )}
                          {isNearby && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-[10px] font-black text-red-500 rounded-md border border-red-100 animate-pulse shrink-0">
                              <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                              지금 위치
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{loc.address}</p>
                      </div>
                      {selectedLocationId === loc.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-base font-bold text-gray-900 ml-1">더 알려줄 내용이 있나요? (선택)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="내용을 입력해주세요"
              className="w-full h-14 px-6 bg-gray-50 border-transparent rounded-[1.25rem] focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-medium text-lg placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-4 pb-6">
            <button
              onClick={handleShare}
              className="w-full h-16 bg-blue-500 text-white rounded-[1.25rem] font-black text-xl shadow-2xl shadow-blue-100 active:scale-[0.97] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-2"
            >
              <Send className="w-6 h-6" />
              보고할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
