import { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'
import {
  MapPin,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Clock,
  Trash2,
  Share2,
  QrCode,
  List,
  ChevronDown
} from 'lucide-react'

// 컴포넌트 임포트
import Header from './components/Header'
import CurrentLocation from './components/CurrentLocation'
import ActionButtons from './components/ActionButtons'
import LocationSaveModal from './components/LocationSaveModal'
import ReportModal from './components/ReportModal'
import LocationListModal from './components/LocationListModal'
import ConfirmModal from './components/ConfirmModal'

// 유틸리티 임포트
import { calculateDistance, generateId } from './utils/geoUtils'

// 더미 데이터
const DUMMY_LOCATIONS = [
  { id: '1', name: '본사', address: '서울 서초구 반포대로 118', latitude: 37.4906849, longitude: 127.0085829 }
]

const STORAGE_KEY = 'fieldSync_locations'
const RECENT_REPORTS_KEY = 'fieldSync_recentReports'

export default function App() {
  const [locations, setLocations] = useState([])
  const [recentReportIds, setRecentReportIds] = useState([])
  const [currentPosition, setCurrentPosition] = useState(null)
  const [currentAddress, setCurrentAddress] = useState('')
  const [gpsError, setGpsError] = useState(null)
  const [isLoadingGps, setIsLoadingGps] = useState(true)

  const [showQRModal, setShowQRModal] = useState(false)
  const [isQRClosing, setIsQRClosing] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showLocationListModal, setShowLocationListModal] = useState(false)
  const [listModalMode, setListModalMode] = useState('reports') // 'locations' or 'reports'
  const [editingLocation, setEditingLocation] = useState(null)
  const [confirmConfig, setConfirmConfig] = useState(null)
  const [visibleReportCount, setVisibleReportCount] = useState(1)
  const [toast, setToast] = useState(null)
  const [isToastClosing, setIsToastClosing] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setIsToastClosing(false)
    
    // 3초 뒤에 닫기 애니메이션 시작
    setTimeout(() => {
      setIsToastClosing(true)
      // 애니메이션 시간(600ms) 뒤에 상태 제거
      setTimeout(() => {
        setToast(null)
        setIsToastClosing(false)
      }, 600)
    }, 3000)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setLocations(JSON.parse(stored))
    } else {
      setLocations(DUMMY_LOCATIONS)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_LOCATIONS))
    }

    const storedReports = localStorage.getItem(RECENT_REPORTS_KEY)
    if (storedReports) {
      setRecentReportIds(JSON.parse(storedReports))
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('사용할 수 없는 브라우저예요')
      setIsLoadingGps(false)
      return
    }

    setIsLoadingGps(true)
    setGpsError(null)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLon = pos.coords.longitude;
        console.log("GPS Position Received:", newLat, newLon);
        
        setCurrentPosition(prev => {
          // 이전 위치가 없거나, 10m 이상 이동했을 때만 업데이트
          if (!prev) return { latitude: newLat, longitude: newLon };
          
          const distance = calculateDistance(
            prev.latitude, 
            prev.longitude, 
            newLat, 
            newLon
          );
          
          if (distance > 10) { // 10미터
            return { latitude: newLat, longitude: newLon };
          }
          return prev;
        });
        
        setIsLoadingGps(false);
        setGpsError(null);
      },
      (err) => {
        console.error("Geolocation Error:", err);
        setGpsError(err.code === 3 ? '위치 확인 시간이 너무 오래 걸려요' : '위치 정보를 가져오지 못했어요')
        setIsLoadingGps(false)
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 5000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [retryCount])

  const handleSaveLocation = (newLoc) => {
    const updated = [{ ...newLoc, id: generateId() }, ...locations]
    setLocations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    showToast('장소를 저장했어요')
  }

  const handleUpdateLocation = (updatedLoc) => {
    const updated = locations.map(loc => loc.id === updatedLoc.id ? updatedLoc : loc)
    setLocations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    showToast('장소 정보를 수정했어요')
  }

  const handleDeleteLocation = (id) => {
    const updated = locations.filter(loc => loc.id !== id)
    setLocations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // 최근 보고 목록에서도 삭제
    setRecentReportIds(prev => {
      const filtered = prev.filter(reportId => reportId !== id);
      localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(filtered));
      return filtered;
    });

    showToast('위치를 삭제했어요')
  }

  const handleClearRecentReports = () => {
    setConfirmConfig({
      title: '내역을 모두 지울까요?',
      message: '보고했던 모든 기록들이 사라져요.',
      confirmText: '모두 삭제하기',
      type: 'danger',
      onConfirm: () => {
        setRecentReportIds([]);
        localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify([]));
        showToast('보고했던 기록들을 모두 비웠어요');
      }
    });
  };

  const handleDeleteRecentReport = (id) => {
    setRecentReportIds(prev => {
      const updated = prev.filter(reportId => reportId !== id);
      localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(updated));
      return updated;
    });
    showToast('보고했던 기록을 지웠어요');
  };

  const handleClearAllLocations = () => {
    setConfirmConfig({
      title: '장소를 모두 지울까요?',
      message: '저장된 모든 위치 정보가 사라져요.',
      confirmText: '모두 삭제하기',
      type: 'danger',
      onConfirm: () => {
        setLocations([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        setRecentReportIds([]);
        localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify([]));
        showToast('저장된 모든 장소를 비웠어요');
      }
    });
  };

  const handleDirectShare = async (location) => {
    if (!location) return;
    const shareText = `[${location.name}]`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FieldSync 위치 보고',
          text: shareText,
        });
        showToast('위치를 공유했어요');
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard(shareText, location.name);
        }
      }
    } else {
      copyToClipboard(shareText, location.name);
    }
  };

  const copyToClipboard = (text, locationName) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('위치 정보를 복사했어요');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      showToast('복사하지 못했어요', 'error');
    });
  };

  const handleShare = (shareData) => {
    if (shareData.locationId !== 'current') {
      const location = locations.find(l => l.id === shareData.locationId);
      if (location) {
        // 최근 보고된 ID 업데이트 (현재 위치가 아닌 경우에만 저장)
        setRecentReportIds(prev => {
          const filtered = prev.filter(id => id !== shareData.locationId);
          const updated = [shareData.locationId, ...filtered].slice(0, 5); // 최대 5개 유지
          localStorage.setItem(RECENT_REPORTS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    }
    showToast('위치를 공유했어요')
  }

  const closeQRModal = () => {
    setIsQRClosing(true);
    setTimeout(() => {
      setShowQRModal(false);
      setIsQRClosing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative pb-20">
        <Header 
          onShowQR={() => setShowQRModal(true)} 
          onShowSave={() => setShowSaveModal(true)}
          onShowLocationList={() => {
            setListModalMode('locations');
            setShowLocationListModal(true);
          }} 
        />

        <main className="flex-1 overflow-y-auto">
          <CurrentLocation 
            currentPosition={currentPosition} 
            gpsError={gpsError} 
            isLoadingGps={isLoadingGps} 
            onAddressUpdate={setCurrentAddress}
          />

          <ActionButtons 
            onShowReport={() => setShowReportModal(true)} 
          />

          {/* 위치 리스트 섹션 */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Clock className="w-5 h-5 text-gray-400" />
                최근 보고한 위치
              </h3>
              {recentReportIds.length > 0 && (
                <button 
                  onClick={() => {
                    setListModalMode('reports');
                    setShowLocationListModal(true);
                  }}
                  className="text-sm font-bold text-blue-500 hover:text-blue-600 transition-colors"
                >
                  전체보기
                </button>
              )}
            </div>
            <div className="space-y-4">
              {recentReportIds.length > 0 ? (
                <>
                  {recentReportIds.slice(0, visibleReportCount).map((id) => {
                    const loc = locations.find(l => l.id === id);
                    if (!loc) return null;
                    return (
                      <div key={loc.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between transition-all active:scale-[0.98]">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-lg truncate">{loc.name}</p>
                          <p className="text-sm text-gray-500 truncate mt-0.5">{loc.address}</p>
                        </div>
                        <button 
                          onClick={() => handleDirectShare(loc)} 
                          className="ml-4 p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors active:scale-90"
                          title="공유하기"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {visibleReportCount < recentReportIds.length && (
                    <div className="flex justify-center pt-2">
                      <button 
                        onClick={() => setVisibleReportCount(prev => prev + 3)}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-full text-sm font-bold transition-all active:scale-95 border border-gray-100 shadow-sm"
                      >
                        더 보기
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400">최근에 보고한 위치가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* 모달들 */}
        <LocationSaveModal 
          isOpen={showSaveModal || !!editingLocation} 
          onClose={() => {
            setShowSaveModal(false);
            setEditingLocation(null);
          }} 
          onSave={handleSaveLocation}
          onUpdate={handleUpdateLocation}
          currentPosition={currentPosition}
          currentAddress={currentAddress}
          editData={editingLocation}
        />

        <ReportModal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)} 
          onShare={handleShare}
          locations={locations}
          currentPosition={currentPosition}
          currentAddress={currentAddress}
        />

        <LocationListModal 
          isOpen={showLocationListModal} 
          onClose={() => setShowLocationListModal(false)} 
          title={listModalMode === 'locations' ? '저장한 장소들' : '공유한 위치 목록'}
          icon={listModalMode === 'locations' ? MapPin : Clock}
          locations={listModalMode === 'locations' ? locations : recentReportIds.map(id => locations.find(loc => loc.id === id)).filter(Boolean)}
          onShare={handleDirectShare}
          onEdit={(loc) => {
            setEditingLocation(loc);
            setShowLocationListModal(false);
          }}
          onDelete={listModalMode === 'locations' ? handleDeleteLocation : handleDeleteRecentReport}
          onClearAll={listModalMode === 'locations' ? handleClearAllLocations : handleClearRecentReports}
          showClearAll={true}
          emptyMessage={listModalMode === 'locations' ? '저장된 장소가 없어요' : '최근에 보고한 위치가 없어요'}
        />

        {confirmConfig && (
          <ConfirmModal
            isOpen={!!confirmConfig}
            onClose={() => setConfirmConfig(null)}
            {...confirmConfig}
          />
        )}

        {/* QR 모달 */}
        {showQRModal && (
          <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/30 backdrop-blur-sm transition-all ${
            isQRClosing ? 'animate-fade-out' : 'animate-fade-in'
          }`}>
            <div className={`bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl ${
              isQRClosing ? 'animate-slide-down' : 'animate-slide-up'
            }`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">QR 공유</h2>
                <button onClick={closeQRModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="bg-gray-50 p-8 rounded-3xl flex justify-center mb-6">
                <QRCode value={window.location.href} size={200} />
              </div>
              <p className="text-gray-500 mb-8 leading-relaxed">이 QR 코드를 스캔하여<br/>동료에게 앱을 공유하세요.</p>
              <button 
                onClick={() => {
                  const appLink = 'https://field-sync-ecs.vercel.app/';
                  navigator.clipboard.writeText(appLink).then(() => {
                    showToast('링크를 복사했어요');
                  }).catch(err => {
                    console.error('Could not copy text: ', err);
                    showToast('복사하지 못했어요', 'error');
                  });
                }}
                className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100"
              >
                <Share2 className="w-5 h-5" />
                링크 복사하기
              </button>
            </div>
          </div>
        )}

        {/* 토스트 */}
        {toast && (
          <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xs px-6 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-3 transition-all ${
            isToastClosing ? 'animate-toast-out' : 'animate-toast-in'
          } bg-gray-900 text-white`}>
            {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-blue-400" /> : <AlertCircle className="w-6 h-6 text-orange-400" />}
            <span className="font-bold">{toast.message}</span>
          </div>
        )}
      </div>
    </div>
  )
}
