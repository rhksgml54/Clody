// src/App.tsx
import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { HomePage } from "./components/HomePage";
import { RecommendationResultPage } from "./components/RecommendationResultPage";
import { SplashScreen } from "./components/SplashScreen";
import { MyPage } from "./components/MyPage";
import { MyClosetPage } from "./components/MyClosetPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import type { Profile, PageData, WeatherInfo, UserRecord } from "./types";

const defaultProfile: Profile = {
  gender: "male",
  height: 175,
  weight: 70,
  personal_color: "spring warm",
  body_type: "hourglass",
  top_size: "M",
  bottom_size: "27",
};

function App() {
  const [view, setView] = useState<
    | "splash"
    | "home"
    | "login"
    | "register"
    | "my-page"
    | "my-closet"
    | "recommendation"
    | "recommendation-result"
  >("splash");

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserRecord | null>(null);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [pageData, setPageData] = useState<PageData | null>(null);

  // -----------------------------
  // 초기 스플래시 → 홈 전환
  // -----------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setView("home");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const loadUsers = (): Record<string, UserRecord> => {
    const data = localStorage.getItem("users");
    return data ? JSON.parse(data) : {};
  };

  const saveUsers = (users: Record<string, UserRecord>) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  // -----------------------------
  // 로그인
  // -----------------------------
const handleLogin = async (
  username: string,
  password: string
): Promise<boolean> => {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) return false;

    setUser(result.user);

    let hasProfile = false;

    try {
      const pRes = await fetch("/api/profile/me", {
        method: "GET",
        credentials: "include",
      });
      const pData = await pRes.json();

      if (pRes.ok && pData.success && pData.profile) {
        setProfile(pData.profile);

        const pf = pData.profile as any;
        if (
          pf.gender &&
          pf.height &&
          pf.weight &&
          pf.personal_color &&
          pf.body_type
        ) {
          hasProfile = true;
        } else {
          hasProfile = false;
        }
      } else {
        setProfile(defaultProfile);
        hasProfile = false;
      }
    } catch {
      setProfile(defaultProfile);
      hasProfile = false;
    }

    if (hasProfile) {
      setView("home");
    } else {
      alert("먼저 마이페이지에서 프로필을 작성해 주세요.");
      setView("my-page");
    }

    return true;
  } catch {
    return false;
  }
};


  // -----------------------------
  // 회원가입
  // -----------------------------
  const handleRegister = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) return false;

      alert("회원가입이 완료되었습니다.");
      setView("login");
      return true;
    } catch {
      return false;
    }
  };

  // -----------------------------
  // 로그아웃
  // -----------------------------
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    setUser(null);
    setView("home");
  };

  // -----------------------------
  // 프로필 저장
  // -----------------------------
  const handleSaveProfile = async (updatedProfile: Profile) => {
    if (!user) {
      alert("로그인해주세요.");
      setView("login");
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedProfile),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        alert(result.error || "프로필 저장 실패");
        return;
      }

      setProfile(updatedProfile);
      setUser((prev) =>
        prev ? { ...prev, profile: updatedProfile } : prev
      );

      alert("저장되었습니다.");
      setView("home");
    } catch {
      alert("서버 오류");
    }
  };

  // -----------------------------
  // 추천 받기
  // -----------------------------
  const handleGetRecommendation = async (
    weather: { temp: number } | null,
    tpo?: string
  ) => {
    if (loading) return;

    let weatherData = weather || { temp: 20 };

    setLoading(true);

    try {
      const payload = {
        weather: weatherData,
        tpo,
        user_id: user ? (user as any).username : null,
      };

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json();

      // 🌤️ weatherInfo 생성 (강수확률 포함)
const weatherInfo: WeatherInfo = {
  temp: weatherData.temp,
  description: "맑음",
  uv: 3,
  precipitation: data?.precipitation || 0, // ← 서버가 주지 않으면 0
  icon: "sunny",
};

// 🌧️ 강수확률 기반 설명 문구 생성
let explanation = data.recommendation.설명 || "";

// 강수확률이 30% 이상이면 자동으로 우산 멘트 추가
if (weatherInfo.precipitation >= 30) {
  explanation += "\n\n💧 강수 확률이 30% 이상이니 우산을 챙기는 게 좋아요.";
}

// 📦 PageData 구성
const finalPageData: PageData = {
  profile,
  weather: weatherInfo,
  tpo: tpo || "OOTD",
  recommendation: {
    ...data.recommendation,
    설명: explanation, // ← 수정된 설명 반영
  },
  score: data.score,
  alternatives: {},
};


      setPageData(finalPageData);

      // 🔥 추천 결과 페이지로 이동
      setView("recommendation-result");
    } catch {
      alert("추천 실패");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // 화면 전환
  // -----------------------------
  const renderContent = () => {
    switch (view) {
      case "splash":
        return <SplashScreen />;

      case "home":
        return (
          <HomePage
            onGetRecommendation={handleGetRecommendation}
            loading={loading}
          />
        );


      case "recommendation-result":
        return pageData ? (
          <RecommendationResultPage 
          pageData={pageData} 
          onNavigate={setView}
          />
          
        ) : (
          <HomePage
            onGetRecommendation={handleGetRecommendation}
            loading={loading}
          />
        );

      case "my-page":
        return user ? (
          <MyPage profile={profile} onSave={handleSaveProfile} />
        ) : (
          <LoginPage onLogin={handleLogin} onNavigate={setView} />
        );

      case "my-closet":
        return user ? (
          <MyClosetPage />
        ) : (
          <LoginPage onLogin={handleLogin} onNavigate={setView} />
        );

      case "login":
        return <LoginPage onLogin={handleLogin} onNavigate={setView} />;

      case "register":
        return <RegisterPage onRegister={handleRegister} onNavigate={setView} />;

      default:
        return (
          <HomePage
            onGetRecommendation={handleGetRecommendation}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className="bg-gray-50">
      <div className="bg-white max-w-md mx-auto shadow-lg min-h-screen flex flex-col">
        {view !== "splash" && (
          <Header
            isLoggedIn={!!user}
            onNavigate={setView}
            onLogout={handleLogout}
            view={view}
            onBack={() => setView("home")}
          />
        )}
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
