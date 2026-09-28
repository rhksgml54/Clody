import React, { useState, useEffect } from 'react';

// Vite를 통해 .env 파일에서 API 키를 가져옵니다.
const KMA_API_KEY = import.meta.env.VITE_KMA_API_KEY;

// App.tsx에서 전달받을 props 타입을 정의합니다.
interface HomePageProps {
  onGetRecommendation: (weather: { temp: number } | null, tpo?: string) => void;
  loading: boolean;
}

// 날씨 분위기 타입
type WeatherMood = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'unknown';

// 아이콘 SVG 컴포넌트들
const SunIcon = () => <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>;
const FadedSunIcon = () => <div className="w-4 h-4 bg-yellow-400/50 rounded-full"></div>;

// 🔥 WeatherCard (수정 없음)
const WeatherCard: React.FC<{
  temperature: number | null;
  precipitationProb: number | null;
  condition: WeatherMood;
  error: string | null;
}> = ({ temperature, precipitationProb, condition, error }) => {

  // 🔥 public/weather 안의 이미지 연결
  const weatherImages: Record<WeatherMood, string> = {
    sunny: "/weather/sunny.png",
    cloudy: "/weather/cloudy.png",
    rainy: "/weather/rainy.png",
    snowy: "/weather/snowy.png",
    unknown: "/weather/sunny.png",
  };

  const bgUrl = weatherImages[condition];

  return (
    <div
      className="rounded-2xl shadow-lg text-white bg-cover bg-center h-40 flex flex-col justify-between overflow-hidden"
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      <div className="p-4 bg-black/20 h-full flex flex-col justify-between">
        <div>
          {error && <p className="text-sm text-red-300">{error}</p>}

          {!temperature && !error && (
            <p className="text-lg animate-pulse">날씨 정보 로딩 중...</p>
          )}

          {temperature !== null && (
            <>
              <span className="text-5xl font-bold tracking-tighter">
                {temperature}°
              </span>

              <p className="font-semibold text-lg -mt-1">
                {condition === "sunny" && "맑은 날씨 지속"}
                {condition === "cloudy" && "구름 많은 날씨"}
                {condition === "rainy" && "비 소식 있어요"}
                {condition === "snowy" && "눈 오는 날씨"}
                {condition === "unknown" && "날씨 정보 없음"}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex flex-col gap-1">
            <span>자외선 지수 높음</span>
            {precipitationProb !== null && (
              <span>{`강수 확률 ${precipitationProb}%`}</span>
            )}
          </div>

          <div className="flex space-x-1">
            <SunIcon />
            <SunIcon />
            <SunIcon />
            <SunIcon />
            <FadedSunIcon />
          </div>
        </div>
      </div>
    </div>
  );
};


// TPO 선택 모달
const TpoModal: React.FC<{
  onSelect: (tpo: string) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ onSelect, onClose, loading }) => {
  const tpos = [
    '일상/캐주얼 🚶‍♂️',
    '출근/비즈니스 👔',
    '데이트/모임 ❤️',
    '격식 있는 행사 ✨',
    '여행/휴양 ✈️',
    '스포츠/액티비티 🏃‍♀️',
  ];
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-clody-main-text mb-4">
          어떤 상황의 옷을 추천받을까요?
        </h3>
        <div className="space-y-3">
          {tpos.map((tpo) => (
            <button
              key={tpo}
              onClick={() => onSelect(tpo.split(' ')[0])}
              disabled={loading}
              className="w-full bg-gray-100 text-clody-main-text font-semibold py-3 px-4 rounded-lg hover:bg-clody-logo transition-colors disabled:bg-gray-300"
            >
              {tpo}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-clody-sub-text hover:text-clody-main-text"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};



export const HomePage: React.FC<HomePageProps> = ({
  onGetRecommendation,
  loading,
}) => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [precipitationProb, setPrecipitationProb] = useState<number | null>(null);
  const [weatherCondition, setWeatherCondition] = useState<WeatherMood>('unknown');
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showTpoModal, setShowTpoModal] = useState(false);

  useEffect(() => {
    const fetchKmaWeather = async () => {
      if (!KMA_API_KEY || KMA_API_KEY.includes('YOUR_API_KEY')) {
        setWeatherError("기상청 API 키가 설정되지 않았습니다.");
        setTemperature(36);
        setWeatherCondition('unknown');
        return;
      }

      const now = new Date();
      let base_date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const currentHour = now.getHours();
      const availableTimes = [2, 5, 8, 11, 14, 17, 20, 23];
      let baseHour = availableTimes.slice().reverse().find(t => t <= currentHour);

      if (baseHour === undefined) {
        const yesterday = new Date(now.getTime() - 86400000);
        base_date = `${yesterday.getFullYear()}${String(yesterday.getMonth() + 1).padStart(2, '0')}${String(yesterday.getDate()).padStart(2, '0')}`;
        baseHour = 23;
      }

      const base_time = `${String(baseHour).padStart(2, '0')}00`;
      const url =
        `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${encodeURIComponent(
          KMA_API_KEY
        )}&pageNo=1&numOfRows=50&dataType=JSON&base_date=${base_date}&base_time=${base_time}&nx=59&ny=74`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        const items = data.response.body.items.item;

        const tempItem = items.find((item: any) => item.category === 'TMP');
        const popItem = items.find((item: any) => item.category === 'POP');
        const skyItem = items.find((item: any) => item.category === 'SKY');
        const ptyItem = items.find((item: any) => item.category === 'PTY');

        setTemperature(parseInt(tempItem.fcstValue, 10));
        setPrecipitationProb(parseInt(popItem.fcstValue, 10));

        const sky = skyItem.fcstValue;
        const pty = ptyItem.fcstValue;

        let mood: WeatherMood = 'unknown';
        if (pty !== '0') mood = ['1','5','6'].includes(pty) ? 'rainy' : 'snowy';
        else mood = sky === '1' ? 'sunny' : ['3','4'].includes(sky) ? 'cloudy' : 'unknown';

        setWeatherCondition(mood);

      } catch {
        setWeatherError("날씨 정보 로딩 실패");
        setTemperature(36);
        setWeatherCondition('unknown');
      }
    };

    fetchKmaWeather();
  }, []);

  // 🔥 OOTD = HOW 기능 이동
  const handleOotdClick = () => {
    if (loading) return;
    setShowTpoModal(true);
  };

  const handleTpoSelect = (tpo: string) => {
    setShowTpoModal(false);
    onGetRecommendation(
      temperature !== null ? { temp: temperature } : null,
      tpo
    );
  };

  return (
    <div className="p-4 space-y-5">
      {/* 날씨 카드 */}
      <WeatherCard
        temperature={temperature}
        precipitationProb={precipitationProb}
        condition={weatherCondition}
        error={weatherError}
      />

      {/* 🔥 복구된 OOTD 카드 (HOW 기능 통합됨) */}
      <div
        onClick={handleOotdClick}
        className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer h-96 flex items-end p-6 text-white font-black bg-cover bg-center group"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto-format=fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity group-hover:from-black/40"></div>
        <span className="relative z-10 text-6xl tracking-wider">OOTD</span>

        {loading && !showTpoModal && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-clody-logo border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* 해시태그 */}
      <div className="text-center text-xs text-clody-sub-text font-medium -mt-3 px-2">
        <p>#오늘의 착장 #올해의 컬러 #패션 랭킹 #AI 모델 #선글라스 #썬크림 #여름 패션템</p>
      </div>

      {/* TPO 모달 */}
      {showTpoModal && (
        <TpoModal
          onSelect={handleTpoSelect}
          onClose={() => setShowTpoModal(false)}
          loading={loading}
        />
      )}
    </div>
  );
};
