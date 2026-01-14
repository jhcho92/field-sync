import { useState, useEffect, useCallback } from 'react'
import QRCode from 'react-qr-code'
import {
  MapPin,
  Navigation,
  QrCode,
  Plus,
  Send,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Share2,
  Trash2,
  Search,
  MapPinned,
  LocateFixed,
  Pencil,
  Clock
} from 'lucide-react'

// 더미 데이터 (본사: 서울시청, 지사: 강남역)
const DUMMY_LOCATIONS = [
  {
    id: '1',
    name: '본사',
    latitude: 37.5665,
    longitude: 126.978
  },
  {
    id: '2',
    name: '지사',
    latitude: 37.498095,
    longitude: 127.027610
  }
]

// localStorage 키
const STORAGE_KEY = 'fieldSync_locations'
const LAST_SHARED_KEY = 'fieldSync_lastShared'

// Haversine 공식으로 두 좌표 간 거리 계산 (미터 단위)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000 // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ID 생성
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export default function App() {
  // 상태 관리
  const [locations, setLocations] = useState([])
  const [currentPosition, setCurrentPosition] = useState(null)
  const [gpsError, setGpsError] = useState(null)
  const [isLoadingGps, setIsLoadingGps] = useState(true)

  // 최근 공유한 위치 ID
  const [lastSharedId, setLastSharedId] = useState(null)

  // 모달 상태
  const [showQRModal, setShowQRModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showLocationListModal, setShowLocationListModal] = useState(false)

  // 위치 저장/편집 모달 상태
  const [saveMode, setSaveMode] = useState('current') // 'current' | 'search'
  const [newLocationName, setNewLocationName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [editingLocation, setEditingLocation] = useState(null)

  // 보고 모달 상태
  const [reportNote, setReportNote] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [sortedLocations, setSortedLocations] = useState([])

  // 토스트 메시지
  const [toast, setToast] = useState(null)

  // 토스트 표시 함수
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // localStorage에서 위치 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setLocations(JSON.parse(stored))
    } else {
      // 초기 더미 데이터 저장
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DUMMY_LOCATIONS))
      setLocations(DUMMY_LOCATIONS)
    }

    // 최근 공유한 위치 ID 로드
    const lastShared = localStorage.getItem(LAST_SHARED_KEY)
    if (lastShared) {
      setLastSharedId(lastShared)
    }
  }, [])

  // 위치 데이터 저장
  useEffect(() => {
    if (locations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations))
    }
  }, [locations])

  // GPS 위치 가져오기
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS를 지원하지 않는 브라우저입니다.')
      setIsLoadingGps(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
        setIsLoadingGps(false)
        setGpsError(null)
      },
      (error) => {
        let errorMessage = 'GPS 오류가 발생했습니다.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.'
            break
          case error.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다.'
            break
        }
        setGpsError(errorMessage)
        setIsLoadingGps(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // 주소 검색 (Nominatim API)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setSearchResults([])

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=kr&limit=5`,
        {
          headers: {
            'Accept-Language': 'ko'
          }
        }
      )
      const data = await response.json()
      setSearchResults(data)
    } catch (err) {
      showToast('주소 검색에 실패했습니다.', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  // 검색 결과 선택
  const handleSelectAddress = (result) => {
    setSelectedAddress({
      name: result.display_name.split(',')[0],
      fullAddress: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    })
    setNewLocationName(result.display_name.split(',')[0])
    setSearchResults([])
  }

  // 위치 저장 모달 열기
  const openSaveModal = () => {
    setSaveMode('current')
    setNewLocationName('')
    setSearchQuery('')
    setSearchResults([])
    setSelectedAddress(null)
    setShowSaveModal(true)
  }

  // 위치 편집 모달 열기
  const openEditModal = (location) => {
    setEditingLocation(location)
    setNewLocationName(location.name)
    setSaveMode('current')
    setSelectedAddress({
      latitude: location.latitude,
      longitude: location.longitude,
      fullAddress: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
    })
    setSearchQuery('')
    setSearchResults([])
    setShowEditModal(true)
  }

  // 위치 저장
  const handleSaveLocation = () => {
    if (!newLocationName.trim()) {
      showToast('장소명을 입력해주세요.', 'error')
      return
    }

    let latitude, longitude

    if (saveMode === 'current') {
      if (!currentPosition) {
        showToast('GPS 위치를 가져올 수 없습니다.', 'error')
        return
      }
      latitude = currentPosition.latitude
      longitude = currentPosition.longitude
    } else {
      if (!selectedAddress) {
        showToast('주소를 검색하여 선택해주세요.', 'error')
        return
      }
      latitude = selectedAddress.latitude
      longitude = selectedAddress.longitude
    }

    const newLocation = {
      id: generateId(),
      name: newLocationName.trim(),
      latitude,
      longitude
    }

    setLocations(prev => [...prev, newLocation])
    setNewLocationName('')
    setSelectedAddress(null)
    setShowSaveModal(false)
    showToast(`'${newLocation.name}' 위치가 저장되었습니다.`)
  }

  // 위치 편집 저장
  const handleUpdateLocation = () => {
    if (!newLocationName.trim()) {
      showToast('장소명을 입력해주세요.', 'error')
      return
    }

    if (!editingLocation) return

    let latitude, longitude

    if (saveMode === 'current') {
      if (!currentPosition) {
        showToast('GPS 위치를 가져올 수 없습니다.', 'error')
        return
      }
      latitude = currentPosition.latitude
      longitude = currentPosition.longitude
    } else if (selectedAddress) {
      latitude = selectedAddress.latitude
      longitude = selectedAddress.longitude
    } else {
      latitude = editingLocation.latitude
      longitude = editingLocation.longitude
    }

    setLocations(prev => prev.map(loc =>
      loc.id === editingLocation.id
        ? { ...loc, name: newLocationName.trim(), latitude, longitude }
        : loc
    ))

    setShowEditModal(false)
    setEditingLocation(null)
    showToast(`'${newLocationName.trim()}' 위치가 수정되었습니다.`)
  }

  // 위치 삭제
  const handleDeleteLocation = (id) => {
    const location = locations.find(loc => loc.id === id)
    setLocations(prev => prev.filter(loc => loc.id !== id))
    if (location) {
      showToast(`'${location.name}' 위치가 삭제되었습니다.`)
    }
    // 최근 공유한 위치가 삭제된 경우 초기화
    if (lastSharedId === id) {
      setLastSharedId(null)
      localStorage.removeItem(LAST_SHARED_KEY)
    }
  }

  // 위치 보고하기 버튼 클릭
  const handleReportClick = () => {
    if (!currentPosition) {
      showToast('GPS 위치를 가져올 수 없습니다.', 'error')
      return
    }

    if (locations.length === 0) {
      showToast('저장된 위치가 없습니다.', 'error')
      return
    }

    // 모든 장소에 거리 추가 후 정렬
    const locationsWithDistance = locations.map(loc => ({
      ...loc,
      distance: calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        loc.latitude,
        loc.longitude
      )
    })).sort((a, b) => a.distance - b.distance)

    setSortedLocations(locationsWithDistance)

    // 최근 공유한 위치가 있으면 그것을 선택, 없으면 가장 가까운 위치 선택
    if (lastSharedId && locations.find(loc => loc.id === lastSharedId)) {
      setSelectedLocationId(lastSharedId)
    } else {
      setSelectedLocationId(locationsWithDistance[0].id)
    }

    setReportNote('')
    setShowReportModal(true)
  }

  // 공유하기
  const handleShare = async () => {
    const location = sortedLocations.find(loc => loc.id === selectedLocationId)
    if (!location) return

    const noteText = reportNote.trim() || '도착했습니다'
    const shareText = `[${location.name}] ${noteText}`

    // 최근 공유한 위치 저장
    setLastSharedId(location.id)
    localStorage.setItem(LAST_SHARED_KEY, location.id)

    // Web Share API 지원 확인
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText
        })
        setShowReportModal(false)
        showToast('공유되었습니다.')
      } catch (err) {
        if (err.name !== 'AbortError') {
          await copyToClipboard(shareText)
        }
      }
    } else {
      await copyToClipboard(shareText)
    }
  }

  // 클립보드 복사
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setShowReportModal(false)
      showToast('클립보드에 복사되었습니다.')
    } catch (err) {
      showToast('복사에 실패했습니다.', 'error')
    }
  }

  // 최근 공유한 위치
  const lastSharedLocation = lastSharedId ? sortedLocations.find(loc => loc.id === lastSharedId) : null
  // 최근 공유 제외한 나머지 (거리순 정렬 유지)
  const otherLocations = sortedLocations

  // 메인 화면용 정렬된 위치 목록
  const displayLocations = currentPosition
    ? [...locations].map(loc => ({
        ...loc,
        distance: calculateDistance(
          currentPosition.latitude,
          currentPosition.longitude,
          loc.latitude,
          loc.longitude
        )
      })).sort((a, b) => a.distance - b.distance)
    : locations

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">FieldSync</h1>
          </div>
          <button
            onClick={() => setShowQRModal(true)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
          >
            <QrCode className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* GPS 상태 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              currentPosition ? 'bg-green-100' : gpsError ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {isLoadingGps ? (
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              ) : currentPosition ? (
                <MapPin className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">현재 위치</h2>
              <p className="text-sm text-gray-500">
                {isLoadingGps ? 'GPS 연결 중...' :
                 gpsError ? gpsError :
                 '위치 확인됨'}
              </p>
            </div>
          </div>

          {currentPosition && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">위도</p>
                  <p className="font-mono text-sm text-gray-900">
                    {currentPosition.latitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">경도</p>
                  <p className="font-mono text-sm text-gray-900">
                    {currentPosition.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
              {currentPosition.accuracy && (
                <p className="text-xs text-gray-400 mt-3">
                  정확도: ±{Math.round(currentPosition.accuracy)}m
                </p>
              )}
            </div>
          )}
        </div>

        {/* 저장된 위치 목록 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">저장된 위치</h2>
            <span className="text-sm text-gray-500">{locations.length}개</span>
          </div>

          {locations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">저장된 위치가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {displayLocations.slice(0, 3).map(loc => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      loc.distance && loc.distance <= 500 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{loc.name}</p>
                        {lastSharedId === loc.id && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">최근</span>
                        )}
                      </div>
                      {loc.distance !== undefined && (
                        <p className="text-xs text-gray-500">
                          {loc.distance < 1000
                            ? `${Math.round(loc.distance)}m`
                            : `${(loc.distance / 1000).toFixed(1)}km`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(loc)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {locations.length > 3 && (
                <button
                  onClick={() => setShowLocationListModal(true)}
                  className="w-full py-2 text-sm text-blue-500 hover:text-blue-600"
                >
                  +{locations.length - 3}개 더보기
                </button>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={openSaveModal}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            <Plus className="w-5 h-5" />
            위치 저장하기
          </button>

          <button
            onClick={handleReportClick}
            disabled={!currentPosition || locations.length === 0}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            <Send className="w-5 h-5" />
            위치 보고하기
          </button>
        </div>
      </main>

      {/* QR 코드 모달 */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">앱 공유 QR 코드</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-gray-100 flex items-center justify-center">
              <QRCode
                value={window.location.href}
                size={200}
                level="H"
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              />
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              QR 코드를 스캔하여 앱에 접속하세요
            </p>
          </div>
        </div>
      )}

      {/* 위치 저장 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">위치 저장하기</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 모드 선택 탭 */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => {
                    setSaveMode('current')
                    setSelectedAddress(null)
                    setSearchResults([])
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    saveMode === 'current'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LocateFixed className="w-4 h-4" />
                  현재 위치
                </button>
                <button
                  onClick={() => setSaveMode('search')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    saveMode === 'search'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  주소 검색
                </button>
              </div>

              {/* 현재 위치 모드 */}
              {saveMode === 'current' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  {currentPosition ? (
                    <div className="flex items-start gap-3">
                      <MapPinned className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">현재 GPS 위치 사용</p>
                        <p className="text-sm text-blue-700 font-mono mt-1">
                          {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-700">{gpsError || 'GPS 위치를 가져올 수 없습니다.'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 주소 검색 모드 */}
              {saveMode === 'search' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="주소를 입력하세요"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl transition-colors"
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      {searchResults.map((result, index) => (
                        <button
                          key={result.place_id}
                          onClick={() => handleSelectAddress(result)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            index !== 0 ? 'border-t border-gray-100' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-900 text-sm">
                            {result.display_name.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {result.display_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedAddress && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">선택된 위치</p>
                          <p className="text-sm text-green-700 mt-1">
                            {selectedAddress.fullAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 장소명 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소명
                </label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="예: 고객사 A, 현장 B"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <button
                onClick={handleSaveLocation}
                disabled={
                  !newLocationName.trim() ||
                  (saveMode === 'current' && !currentPosition) ||
                  (saveMode === 'search' && !selectedAddress)
                }
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 위치 편집 모달 */}
      {showEditModal && editingLocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">위치 편집</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingLocation(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 현재 저장된 좌표 표시 */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">현재 저장된 좌표</p>
                <p className="text-sm text-gray-700 font-mono">
                  {editingLocation.latitude.toFixed(6)}, {editingLocation.longitude.toFixed(6)}
                </p>
              </div>

              {/* 모드 선택 탭 */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => {
                    setSaveMode('keep')
                    setSelectedAddress({
                      latitude: editingLocation.latitude,
                      longitude: editingLocation.longitude,
                      fullAddress: `${editingLocation.latitude.toFixed(6)}, ${editingLocation.longitude.toFixed(6)}`
                    })
                    setSearchResults([])
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    saveMode === 'keep'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  유지
                </button>
                <button
                  onClick={() => {
                    setSaveMode('current')
                    setSelectedAddress(null)
                    setSearchResults([])
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    saveMode === 'current'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LocateFixed className="w-4 h-4" />
                  현재 위치
                </button>
                <button
                  onClick={() => setSaveMode('search')}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                    saveMode === 'search'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  검색
                </button>
              </div>

              {/* 위치 유지 모드 */}
              {saveMode === 'keep' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <MapPinned className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">기존 좌표 유지</p>
                      <p className="text-sm text-blue-700 mt-1">장소명만 수정됩니다.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 현재 위치 모드 */}
              {saveMode === 'current' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  {currentPosition ? (
                    <div className="flex items-start gap-3">
                      <MapPinned className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">현재 GPS 위치로 변경</p>
                        <p className="text-sm text-blue-700 font-mono mt-1">
                          {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <p className="text-red-700">{gpsError || 'GPS 위치를 가져올 수 없습니다.'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* 주소 검색 모드 */}
              {saveMode === 'search' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="주소를 입력하세요"
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-xl transition-colors"
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      {searchResults.map((result, index) => (
                        <button
                          key={result.place_id}
                          onClick={() => handleSelectAddress(result)}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            index !== 0 ? 'border-t border-gray-100' : ''
                          }`}
                        >
                          <p className="font-medium text-gray-900 text-sm">
                            {result.display_name.split(',')[0]}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {result.display_name}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedAddress && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-900">선택된 위치</p>
                          <p className="text-sm text-green-700 mt-1">
                            {selectedAddress.fullAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 장소명 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  장소명
                </label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="예: 고객사 A, 현장 B"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
              </div>

              <button
                onClick={handleUpdateLocation}
                disabled={
                  !newLocationName.trim() ||
                  (saveMode === 'current' && !currentPosition) ||
                  (saveMode === 'search' && !selectedAddress)
                }
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 보고 모달 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">위치 보고</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 최근 공유한 현장 */}
              {lastSharedLocation && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">최근 공유</span>
                  </div>
                  <button
                    onClick={() => setSelectedLocationId(lastSharedLocation.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedLocationId === lastSharedLocation.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{lastSharedLocation.name}</span>
                      <span className="text-sm text-gray-500">
                        {lastSharedLocation.distance < 1000
                          ? `${Math.round(lastSharedLocation.distance)}m`
                          : `${(lastSharedLocation.distance / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* 전체 현장 목록 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">전체 현장 (거리순)</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {otherLocations.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                        selectedLocationId === loc.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${selectedLocationId === loc.id ? 'text-blue-900' : 'text-gray-900'}`}>
                            {loc.name}
                          </span>
                          {lastSharedId === loc.id && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">최근</span>
                          )}
                        </div>
                        <span className={`text-sm ${selectedLocationId === loc.id ? 'text-blue-600' : 'text-gray-500'}`}>
                          {loc.distance < 1000
                            ? `${Math.round(loc.distance)}m`
                            : `${(loc.distance / 1000).toFixed(1)}km`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  특이사항 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input
                  type="text"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value.slice(0, 127))}
                  placeholder="예: 도착했습니다, 회의 시작합니다"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  maxLength={127}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {reportNote.length}/127
                </p>
              </div>

              {/* 미리보기 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">공유될 메시지</p>
                <p className="text-gray-900 font-medium">
                  [{sortedLocations.find(l => l.id === selectedLocationId)?.name}] {reportNote.trim() || '도착했습니다'}
                </p>
              </div>

              <button
                onClick={handleShare}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {navigator.share ? (
                  <>
                    <Share2 className="w-5 h-5" />
                    공유하기
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    복사하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 위치 목록 모달 */}
      {showLocationListModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">저장된 위치</h3>
              <button
                onClick={() => setShowLocationListModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {displayLocations.map(loc => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      loc.distance && loc.distance <= 500 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{loc.name}</p>
                        {lastSharedId === loc.id && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">최근</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {loc.distance !== undefined
                          ? loc.distance < 1000
                            ? `${Math.round(loc.distance)}m`
                            : `${(loc.distance / 1000).toFixed(1)}km`
                          : `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setShowLocationListModal(false)
                        openEditModal(loc)
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(loc.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 토스트 메시지 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-gray-900 text-white'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
