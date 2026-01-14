export const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;

if (!KAKAO_API_KEY) {
  console.error("카카오 API 키가 설정되지 않았습니다. .env 파일을 확인해주세요.");
}

let isScriptLoading = false;
let isScriptLoaded = false;

export const loadKakaoSdk = () => {
  return new Promise((resolve, reject) => {
    if (isScriptLoaded) {
      resolve(window.kakao);
      return;
    }

    if (isScriptLoading) {
      const checkInterval = setInterval(() => {
        if (isScriptLoaded) {
          clearInterval(checkInterval);
          resolve(window.kakao);
        }
      }, 100);
      return;
    }

    isScriptLoading = true;

    const script = document.createElement("script");
    script.type = "text/javascript";
    // 템플릿 리터럴에서 불필요한 공백이나 문자가 들어가지 않도록 주의
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY.trim()}&libraries=services&autoload=false`;
    script.async = true;

    console.log("Loading Kakao SDK with Key:", KAKAO_API_KEY);
    console.log("Full Script URL:", script.src);

    script.onload = () => {
      if (!window.kakao || !window.kakao.maps) {
        isScriptLoading = false;
        reject(new Error("카카오 맵 SDK 로드에 실패했습니다. (window.kakao.maps 없음)"));
        return;
      }

      window.kakao.maps.load(() => {
        isScriptLoaded = true;
        isScriptLoading = false;
        resolve(window.kakao);
      });
    };

    script.onerror = (error) => {
      isScriptLoading = false;
      console.error("Kakao SDK Load Error:", error);
      console.error("Possible reasons: Invalid API Key, Domain not registered, or Network issue.");
      reject(error);
    };

    document.head.appendChild(script);
  });
};
