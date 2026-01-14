import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { loadKakaoSdk } from '../utils/kakaoLoader';

const CurrentLocation = ({ currentPosition, gpsError, isLoadingGps, onAddressUpdate }) => {
  const [address, setAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);

  useEffect(() => {
    if (currentPosition) {
      // 주소가 이미 있고, 이전 위치와의 거리가 10m 이내라면 재호출 방지
      // (단, 처음 로딩 시에는 호출해야 함)
      fetchAddress(currentPosition.latitude, currentPosition.longitude);
    }
  }, [currentPosition]);

  const fetchAddress = async (lat, lon) => {
    setIsLoadingAddress(true);
    setAddressError(null);
    try {
      console.log("Fetching address for:", lat, lon);
      const kakao = await loadKakaoSdk();
      const geocoder = new kakao.maps.services.Geocoder();

      geocoder.coord2Address(lon, lat, (result, status) => {
        console.log("Kakao coord2Address Status:", status);
        if (status === kakao.maps.services.Status.OK) {
          const addrInfo = result[0];
          let fullAddress = addrInfo.road_address 
            ? addrInfo.road_address.address_name 
            : addrInfo.address.address_name;
          
          if (addrInfo.road_address && addrInfo.road_address.building_name) {
            fullAddress += ` (${addrInfo.road_address.building_name})`;
          }
          
          setAddress(fullAddress);
          if (onAddressUpdate) {
            onAddressUpdate(fullAddress);
          }
        } else {
          setAddressError('어디인지 찾지 못했어요');
        }
        setIsLoadingAddress(false);
      });
    } catch (error) {
      console.error('Kakao Geocoding Error:', error);
      setAddressError('지도를 불러오지 못했어요');
      setIsLoadingAddress(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-50 transition-all hover:shadow-2xl hover:shadow-gray-200/50 min-h-[180px] flex flex-col">
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="p-2 bg-blue-50 rounded-xl">
          <MapPin className="w-5 h-5 text-blue-500" />
        </div>
        <span className="text-base font-bold text-gray-500">현재 위치</span>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {isLoadingGps || isLoadingAddress ? (
          <div className="flex items-center gap-3 py-4 animate-in fade-in duration-500">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-gray-400 font-bold text-lg italic">어디인지 확인하고 있어요</span>
          </div>
        ) : gpsError ? (
          <div className="flex items-start gap-3 py-4 text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-500">
            <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg leading-tight">GPS를 연결할 수 없어요</p>
              <p className="text-sm mt-1 opacity-80">설정에서 위치 권한을 확인해주세요</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <h2 className="text-2xl font-black text-gray-900 leading-snug break-keep">
              {address || '어디인지 찾는 중이에요'}
            </h2>
            {addressError && (
              <p className="text-sm text-red-500 font-medium">{addressError}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium w-fit">
              <span>위도: {currentPosition?.latitude.toFixed(6)}</span>
              <div className="w-px h-3 bg-gray-200"></div>
              <span>경도: {currentPosition?.longitude.toFixed(6)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentLocation;
