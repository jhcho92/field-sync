// Haversine 공식으로 두 좌표 간 거리 계산 (미터 단위)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ID 생성
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 공휴일 체크 (간이 예시 - 실제 구현 시 API나 공휴일 리스트 필요)
export function isPublicHoliday() {
  const now = new Date();
  // 일요일(0) 또는 토요일(6) 체크
  const day = now.getDay();
  return day === 0 || day === 6;
}

// 현재 시간 포맷팅
export function formatCurrentTime() {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());
}
