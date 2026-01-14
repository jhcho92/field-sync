# FieldSync AI 개발 규칙 (AI_RULES.md)

이 파일은 FieldSync 프로젝트의 설계 원칙, 기술 스택, 코딩 표준 및 UI/UX 가이드를 정의합니다. AI 모델이 이 프로젝트를 수정하거나 확장할 때 반드시 준수해야 하는 규칙들을 담고 있습니다.

## 1. 프로젝트 개요 및 목적
- **이름**: FieldSync
- **목적**: 현장 근무자를 위한 위치 기반 정보 공유 및 관리 웹 서비스.
- **주요 기능**: 실시간 GPS 위치 확인, 장소 저장 및 관리, 카카오톡/링크를 통한 위치 공유, 현장 보고 기능.

## 2. 기술 스택
- **Framework**: React (Vite 기반)
- **Styling**: Tailwind CSS
- **Icons**: Lucide-react
- **Maps API**: Kakao Maps SDK (services 라이브러리 포함)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: Browser LocalStorage
- **Deployment**: Vercel

## 3. 코딩 표준 및 원칙

### 3.1 컴포넌트 구조
- **함수형 컴포넌트**: 모든 컴포넌트는 함수형으로 작성합니다.
- **Props 관리**: 비구조화 할당(Destructuring)을 사용하여 Props를 명확하게 정의합니다.
- **모듈화**: `src/components` 폴더에 재사용 가능한 UI 컴포넌트를 분리합니다.
- **비즈니스 로직 분리**: 복잡한 계산이나 API 호출 로직은 `src/utils` 또는 커스텀 훅으로 분리하는 것을 지향합니다.

### 3.2 스타일링 가이드 (Tailwind CSS)
- **유틸리티 클래스**: 인라인 스타일 대신 Tailwind 유틸리티 클래스를 사용합니다.
- **일관된 간격**: `p-4`, `p-6`, `p-8` 등 4단위 시스템을 주로 사용하여 일관성을 유지합니다.
- **둥근 모서리**: 모달과 버튼에는 큰 라운딩(`rounded-2xl`, `rounded-[2.5rem]`)을 사용하여 부드러운 느낌을 줍니다.
- **상태 시각화**: `hover`, `active`, `disabled` 상태에 대한 피드백을 반드시 포함합니다 (`transition-all`, `active:scale-95`).

### 3.3 상태 관리 및 데이터 흐름
- **LocalStorage**: 저장된 장소와 최근 보고 기록은 `localStorage`를 통해 유지합니다.
- **단방향 데이터 흐름**: 데이터는 부모(`App.jsx`)에서 자식 컴포넌트로 전달하는 것을 원칙으로 합니다.
- **상태 업데이트**: 불변성을 유지하며 상태를 업데이트합니다.

## 4. UI/UX 원칙

### 4.1 모바일 우선 디자인 (Mobile-First)
- 모든 UI는 모바일 환경에서 최상의 경험을 제공하도록 설계합니다.
- 하단 시트 스타일의 모달(`items-end sm:items-center`)을 활용합니다.

### 4.2 인터랙션 및 애니메이션
- 모든 모달과 토스트 메시지에는 `index.css`에 정의된 애니메이션을 적용합니다.
  - 모달: `animate-fade-in`, `animate-slide-up` (열기) / `animate-fade-out`, `animate-slide-down` (닫기)
  - 토스트: `animate-toast-in`, `animate-toast-out`
  - 드롭다운 메뉴: `animate-menu-in`, `animate-menu-out`
- 버튼 클릭 시 물리적인 피드백을 위해 `active:scale-90` 또는 `active:scale-95`를 사용합니다.

### 4.3 색상 체계
- **Primary**: Blue (`bg-blue-500`, `text-blue-500`)
- **Secondary**: Indigo, Gray
- **Background**: White, Gray-50
- **Accent/Alert**: Red-500 (삭제, 경고)

## 5. Kakao Maps SDK 사용 규칙
- `src/utils/kakaoLoader.js`를 통해 SDK를 로드합니다.
- API 키는 `.env` 파일의 `VITE_KAKAO_API_KEY`를 사용합니다.
- 지도 초기화 및 마커 조작은 `window.kakao` 객체가 로드된 후 수행합니다.

## 6. AI 프롬프트 가이드 (지시 시 참고)
이 프로젝트를 수정할 때는 다음 프롬프트 스타일을 따르도록 합니다.
- "새로운 모달을 만들 때는 기존 `LocationListModal.jsx`의 애니메이션 로직과 스타일 구조를 참고해."
- "색상이 기존 헤더와 이질감이 느껴지지 않도록 `bg-white/80`과 `backdrop-blur`를 적절히 섞어서 수정해."
- "하드코딩된 값은 지양하고 `App.jsx`의 상단 상수로 정의하거나 초기 데이터로 관리해."

---
*마지막 업데이트: 2026-01-14*
