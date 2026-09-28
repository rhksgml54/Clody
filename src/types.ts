// src/types.ts

// 🔹 localStorage에 저장할 유저 구조
export interface UserRecord {
  username: string;
  password: string;
  profile: Profile;
  closet: UserClothingItem[];
}

// 🔹 프로필 정보
export interface Profile {
  gender: "male" | "female";
  height: number;
  weight: number;
  personal_color: string;
  body_type: string;
  top_size: string;
  bottom_size: string;
}

// 🔹 유저가 업로드한 옷(옷장)
export interface UserClothingItem {
  id: number;
  name: string;
  image_path: string;
  category: "상의" | "하의" | "아우터" | "원피스" | "기타";
}

// 🔹 추천용 옷 정보
export interface ClothingItem {
  category: string;
  name: string;
  color: string;
  pattern: string;
  material: string;
  image_path: string;
}

// 🔹 추천 결과
export interface Recommendation {
  // 예전 구조 (혹시 쓰고 있을 수 있으니 유지)
  outfit_image_path?: string;
  top?: ClothingItem | null;
  bottom?: ClothingItem | null;
  outerwear?: ClothingItem | null;

  // 🔥 마네킹에 입히기 위한 이미지 경로 (백엔드에서 내려줌)
  topImage?: string | null;
  bottomImage?: string | null;
  outerImage?: string | null;
  shoesImage?: string | null;

  // 백엔드에서 내려오는 다른 필드들 (상의/하의/아우터/신발/설명/악세사리 등)
  [key: string]: any;
}

// 🔹 날씨 카드에서 쓸 날씨 정보
export interface WeatherInfo {
  temp: number; // 온도
  description: string; // 날씨 설명 (맑음, 흐림 등)
  uv: number; // 자외선 지수
  precipitation: number; // 강수 확률(%)
  icon: string; // 'sunny' | 'cloudy' | 'rainy' 등
  [key: string]: any;
}

// 🔹 추천 페이지에서 사용하는 전체 데이터 묶음
export interface PageData {
  profile: Profile;
  weather: WeatherInfo;
  tpo: string;
  recommendation: any; // (지금 구조랑 맞추기 위해 그대로 둠)
  score: {
    total: number;
    weather_fit: number;
    harmony_fit: number;
    tpo_fit: number;
  };
  alternatives: any;
}
