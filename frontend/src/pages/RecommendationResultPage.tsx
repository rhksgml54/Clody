import React from "react";
import type { PageData } from "../types";

interface Props {
  pageData: PageData | null;
  onNavigate: (view: string) => void;
}

export const RecommendationResultPage: React.FC<Props> = ({
  pageData,
  onNavigate,
}) => {
  if (!pageData || !pageData.recommendation) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-gray-500 mb-4">추천 결과가 없습니다.</p>
        <button
          onClick={() => onNavigate("home")}
          className="bg-yellow-400 px-4 py-2 rounded-lg text-black font-bold"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const rec = pageData.recommendation;
  const score = pageData.score;

  const topImage: string | undefined = (rec as any).topImage || (rec as any).top_image_path;
  const bottomImage: string | undefined = (rec as any).bottomImage || (rec as any).bottom_image_path;
  const outerImage: string | undefined = (rec as any).outerImage || (rec as any).outer_image_path;
  const shoesImage: string | undefined = (rec as any).shoesImage || (rec as any).shoes_image_path;

  const hasAnyImage = topImage || bottomImage || outerImage || shoesImage;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-black">오늘의 추천 코디</h2>
        {hasAnyImage && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h3 className="text-xl font-bold text-black">추천 아이템 이미지</h3>
          <div className="grid grid-cols-2 gap-4">
            {topImage && <ImageCard label="상의" src={topImage} />}
            {bottomImage && <ImageCard label="하의" src={bottomImage} />}
            {outerImage && <ImageCard label="아우터" src={outerImage} />}
            {shoesImage && <ImageCard label="신발" src={shoesImage} />}
          </div>
        </div>
      )}  

      {/* 추천 아이템 박스 */}
      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <ItemRow label="상의" value={rec.상의} />
        <ItemRow label="하의" value={rec.하의} />
        <ItemRow label="아우터" value={rec.아우터} />
        <ItemRow label="신발" value={rec.신발} />
      </div>

      {/* 설명 */}
      <div className="bg-gray-100 rounded-xl shadow p-4">
        <h3 className="text-xl font-bold mb-2">스타일 설명</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{rec.설명}</p>
      </div>

      {/* 점수 */}
      {score && (
        <div className="grid grid-cols-3 gap-3">
          <ScoreBox label="총점" value={score.total} color="text-yellow-500" />
          <ScoreBox
            label="날씨 적합도"
            value={score.weather_fit}
            color="text-blue-500"
          />
          <ScoreBox
            label="조화 점수"
            value={score.harmony_fit}
            color="text-green-500"
          />
        </div>
      )}

      <button
        onClick={() => onNavigate("home")}
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl hover:bg-yellow-500"
      >
        다른 코디 다시 추천받기
      </button>
    </div>
  );
};

// ------------------------------------------
const ItemRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="font-semibold text-black">{label}</span>
    <span className="text-gray-700">{value}</span>
  </div>
);

// 🔥 이미지 카드 컴포넌트 추가
const ImageCard = ({ label, src }: { label: string; src: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-full aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
      <img src={src} alt={label} className="w-full h-full object-cover" />
    </div>
    <p className="text-sm font-semibold text-black mt-1">{label}</p>
  </div>
);

const ScoreBox = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div className="bg-white shadow rounded-lg p-3 text-center">
    <p className="font-bold text-black text-lg">{label}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);
