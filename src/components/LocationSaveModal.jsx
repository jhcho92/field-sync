import React, { useState, useEffect } from 'react';
import DaumPostcode from 'react-daum-postcode';
import { X, Search, Loader2, MapPin, CheckCircle2, AlertCircle, Edit2 } from 'lucide-react';
import { loadKakaoSdk } from '../utils/kakaoLoader';

const LocationSaveModal = ({ isOpen, onClose, onSave, onUpdate, currentPosition, currentAddress, editData }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [showPostcode, setShowPostcode] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      if (editData) {
        setName(editData.name);
        setAddress(editData.address);
        setCoords({
          latitude: editData.latitude,
          longitude: editData.longitude
        });
      } else {
        useCurrentLocation();
      }
    }
  }, [isOpen, editData, currentAddress, currentPosition]);

  if (!isOpen) return null;

  const handleComplete = async (data) => {
    let fullAddress = data.address;
    let extraAddress = '';

    if (data.addressType === 'R') {
      if (data.bname !== '') {
        extraAddress += data.bname;
      }
      if (data.buildingName !== '') {
        extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
      }
      fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
    }

    setAddress(fullAddress);
    setShowPostcode(false);
    
    // Kakao Geocoding (Forward)
    setIsGeocoding(true);
    setGeocodingError(null);
    setCoords(null); 

    try {
      const kakao = await loadKakaoSdk();
      const geocoder = new kakao.maps.services.Geocoder();

      geocoder.addressSearch(data.address, (result, status) => {
        if (status === kakao.maps.services.Status.OK) {
          if (result && result.length > 0) {
            setCoords({
              latitude: parseFloat(result[0].y),
              longitude: parseFloat(result[0].x)
            });
          } else {
            setGeocodingError('좌표 정보를 찾지 못했어요');
          }
        } else {
          console.error('Kakao Geocoding status error:', status);
          setGeocodingError('좌표를 가져오지 못했어요');
        }
        setIsGeocoding(false);
      });
    } catch (error) {
      console.error('Kakao Geocoding error details:', error);
      setGeocodingError('지도를 불러오지 못했어요');
      setIsGeocoding(false);
    }
  };

  const handleSave = () => {
    if (!name || !address) {
      return;
    }

    const locationData = {
      name,
      address,
      latitude: coords?.latitude || currentPosition?.latitude,
      longitude: coords?.longitude || currentPosition?.longitude,
    };

    if (editData) {
      onUpdate({ ...locationData, id: editData.id });
    } else {
      onSave(locationData);
    }

    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      // Reset
      setName('');
      setAddress('');
      setCoords(null);
      setGeocodingError(null);
      setShouldRender(false);
      setIsClosing(false);
      onClose();
    }, 600);
  };

  const useCurrentLocation = () => {
    if (currentPosition && currentAddress) {
      setAddress(currentAddress);
      setGeocodingError(null);
      setCoords({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude
      });
    }
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm transition-all ${
      isClosing ? 'animate-fade-out' : 'animate-fade-in'
    }`}>
      <div className={`bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col max-h-[95vh] shadow-2xl overflow-hidden ${
        isClosing ? 'animate-slide-down' : 'animate-slide-up'
      }`}>
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${editData ? 'bg-indigo-50' : 'bg-blue-50'}`}>
              {editData ? (
                <Edit2 className="w-6 h-6 text-indigo-500" />
              ) : (
                <MapPin className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {editData ? '장소 수정하기' : '위치 저장하기'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="px-8 overflow-y-auto space-y-8">
          <div className="space-y-3">
            <label className="block text-base font-bold text-gray-900 ml-1">어디를 저장할까요?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 본사, 거래처"
              className="w-full h-14 px-5 bg-gray-50 border-transparent rounded-[1.25rem] focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-bold text-lg placeholder:text-gray-300"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-base font-bold text-gray-900">주소</label>
              <button 
                onClick={useCurrentLocation}
                className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                지금 위치로
              </button>
            </div>
            <div className="space-y-4">
              <div className="w-full p-5 bg-gray-50 rounded-[1.25rem] border-transparent text-gray-900 font-bold text-lg min-h-[5.5rem] flex items-center leading-snug break-all">
                {address ? (
                  <span className="animate-in fade-in duration-500">{address}</span>
                ) : (
                  <span className="text-gray-300 italic animate-in fade-in duration-500">
                    위치를 찾고 있어요
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPostcode(true)}
                className="w-full h-14 bg-blue-50 text-blue-500 rounded-[1.25rem] font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-95 transition-all"
              >
                <Search className="w-5 h-5" />
                다른 주소 검색하기
              </button>
            </div>
          </div>

          {isGeocoding && (
            <div className="flex items-center justify-center gap-3 py-4 text-blue-500 font-bold bg-blue-50 rounded-2xl animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>지금 어디인지 확인하고 있어요</span>
            </div>
          )}

          {coords && !isGeocoding && (
            <div className="p-5 bg-green-50 text-green-600 rounded-2xl text-base font-bold flex items-center gap-3 border border-green-100 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-green-500 rounded-full p-1.5 shadow-lg shadow-green-100">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span>위치를 확인했어요</span>
            </div>
          )}

          {geocodingError && !isGeocoding && (
            <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-base font-bold flex items-center gap-3 border border-red-100 animate-in fade-in shake-1 duration-300">
              <div className="bg-red-500 rounded-full p-1.5 shadow-lg shadow-red-100">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span>{geocodingError}</span>
            </div>
          )}

          <div className="pb-4">
            <button
              onClick={handleSave}
              disabled={isGeocoding || !name || !address}
              className="w-full h-16 bg-blue-500 text-white rounded-[1.25rem] font-black text-xl shadow-2xl shadow-blue-100 active:scale-[0.97] transition-all disabled:opacity-30 disabled:grayscale disabled:shadow-none"
            >
              저장할게요
            </button>
          </div>
        </div>
      </div>

      {showPostcode && (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900">주소 검색</h2>
            <button onClick={() => setShowPostcode(false)} className="p-3 bg-gray-50 rounded-xl">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DaumPostcode
              onComplete={handleComplete}
              autoClose={false}
              style={{ width: '100%', height: '100%', minHeight: '450px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSaveModal;
