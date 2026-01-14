# FieldSync

현장 작업자를 위한 위치 기반 업무 관리 및 보고 앱입니다.

## 🚀 주요 기능

- **📍 현재 위치 확인**: GPS 좌표를 Kakao Map API를 통해 정확한 도로명 주소(건물명 포함)로 변환하여 표시합니다.
- **💾 위치 저장**: Daum 우편번호 서비스를 통해 주소를 검색하고, Kakao Map API를 이용해 해당 주소의 좌표를 자동으로 추출하여 저장합니다.
- **📊 위치 보고**: 저장된 위치를 선택하여 특이사항과 함께 간편하게 보고할 수 있습니다.
- **📱 QR 공유**: 앱 링크를 QR 코드로 생성하여 동료들과 빠르게 공유할 수 있습니다.

## 🛠 기술 스택

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Maps API**: Kakao Map API (Reverse Geocoding)
- **Address Service**: Daum Postcode Service, Kakao Map API (Forward Geocoding)
- **Icons & UI**: Lucide React, Tailwind CSS

## 💻 설치 및 실행

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 본인의 카카오 JavaScript 키를 입력하세요. 이 파일은 `.gitignore`에 등록되어 있어 저장소에 올라가지 않습니다.

```env
VITE_KAKAO_API_KEY=여기에_카카오_JS_키를_넣으세요
```

> **Vercel 배포 시**: Vercel 대시보드 ([Project Settings] > [Environment Variables])에서 `VITE_KAKAO_API_KEY`를 동일하게 추가해줘야 합니다.

> **⚠️ 중요**: 로컬 테스트 시 `localhost`를, 배포 시 해당 도메인을 [카카오 개발자 센터](https://developers.kakao.com/)의 [내 애플리케이션] > [플랫폼] > [Web]에 반드시 등록해야 정상적으로 동작합니다.

### 3. 로컬 서버 실행
```bash
pnpm run dev
```

### 4. 배포 (Vercel)
Vercel CLI를 사용하여 프로젝트를 배포할 수 있습니다.
```bash
pnpm run deploy
```

## 📂 프로젝트 구조

- `src/components/`: 재사용 가능한 UI 컴포넌트
- `src/utils/`: Kakao SDK 로더 및 위치 계산 유틸리티
- `src/App.jsx`: 메인 레이아웃 및 상태 관리
