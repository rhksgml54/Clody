// 마이페이지: 퍼스널컬러 AI 분석, 체형 진단 퀴즈, 프로필 저장

import React, { useState, useEffect, useRef } from "react";
import type { Profile } from "../types";
import { InputField, StyledInput, StyledSelect } from "../components/ui/Form";

type ScoreTable = {
  [bodyType: string]: number;
};

interface QuizAnswerItem {
  text: string;
  score: ScoreTable;
}

interface QuizItem {
  question: string;
  answers: QuizAnswerItem[];
};

/* -------------------------------------------------
   점수 기반 체형 퀴즈 (남/여별 5문항)
---------------------------------------------------*/
const femaleQuiz: QuizItem[] = [
  {
    question: "어깨 너비와 골반 너비를 비교했을 때 어떤가요?",
    answers: [
      { text: "어깨가 더 넓다", score: { "Inverted Triangle": 2 } },
      { text: "골반이 더 넓다", score: { "Pear": 2 } },
      { text: "비슷하다", score: { "Hourglass": 1, "Rectangle": 1 } },
    ],
  },

  {
    question: "허리 라인의 굴곡은 어떤 편인가요?",
    answers: [
      { text: "허리가 잘록하게 들어갔다", score: { "Hourglass": 2 } },
      { text: "허리 굴곡이 거의 없다", score: { "Rectangle": 2 } },
      { text: "허리보다 배가 더 나온다", score: { "Apple": 2 } },
    ],
  },

  {
    question: "상체 길이와 다리 길이를 비교했을 때 어떤가요?",
    answers: [
      { text: "상체가 길다", score: { "Rectangle": 1, "Apple": 1 } },
      { text: "다리가 길다", score: { "Hourglass": 1, "Pear": 1 } },
      { text: "비슷하다", score: { "Hourglass": 1 } },
    ],
  },

  {
    question: "골반과 힙(엉덩이) 라인은 어떤가요?",
    answers: [
      { text: "힙이 발달해 있다", score: { "Pear": 2 } },
      { text: "힙이 크지 않다", score: { "Rectangle": 1, "Inverted Triangle": 1 } },
      { text: "힙보다 배가 더 나온다", score: { "Apple": 2 } },
    ],
  },

  {
    question: "체중이 증가하면 어느 부위에 주로 쌓이나요?",
    answers: [
      { text: "복부·허리", score: { "Apple": 2 } },
      { text: "엉덩이·허벅지", score: { "Pear": 2 } },
      { text: "상체·팔", score: { "Inverted Triangle": 2 } },
      { text: "전체적으로 고르게", score: { "Rectangle": 2 } },
    ],
  },
];


const maleQuiz: QuizItem[] = [
  {
    question: "어깨와 허리 너비를 비교했을 때 어떤가요?",
    answers: [
      { text: "어깨가 훨씬 넓다", score: { "Inverted Triangle": 2 } },
      { text: "비슷하다", score: { "Rectangle": 2 } },
      { text: "허리가 더 넓다", score: { "Triangle": 2 } },
    ],
  },

  {
    question: "가슴·등 근육 발달은 어떤 편인가요?",
    answers: [
      { text: "많이 발달했다", score: { "Inverted Triangle": 1, "Trapezoid": 1 } },
      { text: "보통이다", score: { "Trapezoid": 1 } },
      { text: "적은 편이다", score: { "Rectangle": 1 } },
    ],
  },

  {
    question: "하체(엉덩이·허벅지) 발달은 어떤가요?",
    answers: [
      { text: "하체가 발달했다", score: { "Triangle": 2 } },
      { text: "보통이다", score: { "Trapezoid": 1 } },
      { text: "슬림하다", score: { "Inverted Triangle": 1 } },
    ],
  },

  {
    question: "체중 증가 시 주로 어디에 살이 붙나요?",
    answers: [
      { text: "복부", score: { "Rectangle": 2, "Triangle": 1 } },
      { text: "전체적으로 고르게", score: { "Trapezoid": 2 } },
      { text: "상체", score: { "Inverted Triangle": 1 } },
    ],
  },

  {
    question: "어깨(쇄골) 라인의 형태는 어떤가요?",
    answers: [
      { text: "수평·직선형", score: { "Rectangle": 1, "Inverted Triangle": 1 } },
      { text: "살짝 둥글고 균형 있음", score: { "Trapezoid": 2 } },
      { text: "좁거나 경사 있음", score: { "Triangle": 2 } },
    ],
  },
];


// ---- 체형 결과 매핑: 한글 + 영어 출력 ----
const BODY_TYPE_LABEL: Record<string, string> = {
  "Hourglass": "모래시계형 (Hourglass)",
  "Rectangle": "직사각형형 (Rectangle)",
  "Apple": "사과형 (Apple)",
  "Pear": "서양배형 (Pear)",
  "Inverted Triangle": "역삼각형형 (Inverted Triangle)",
  "Trapezoid": "사다리꼴형 (Trapezoid)",
  "Triangle": "삼각형 (Triangle)",
};


/* -------------------------------------------------
    체형 퀴즈 모달
---------------------------------------------------*/
interface BodyTypeQuizModalProps {
  gender: string | null | undefined;
  onClose: () => void;
  onComplete: (bodyType: string) => void;
}

const BodyTypeQuizModal: React.FC<BodyTypeQuizModalProps> = ({ gender, onClose, onComplete }) => {
  const quiz = gender === "male" ? maleQuiz : femaleQuiz;

  const [step, setStep] = useState(0);

  // 🔥 score 타입 명확하게 지정
  const [score, setScore] = useState<Record<string, number>>({} as Record<string, number>);

  const handleAnswer = (answerScore: Record<string, number>) => {
    // 🔥 updated 타입 지정
    const updated: Record<string, number> = { ...score };

    // 점수 누적
    Object.entries(answerScore).forEach(([key, val]) => {
      updated[key] = (updated[key] || 0) + val;
    });

    setScore(updated);

    // 다음 문제 or 결과 계산
    if (step + 1 < quiz.length) {
      setStep(step + 1);
    } else {
      // 결과 계산
let bestType = "";
let bestValue = -999;

Object.entries(updated).forEach(([type, value]) => {
  if (value > bestValue) {
    bestValue = value;
    bestType = type;
  }
});

// 🔥 영어 key → 한글(영어) 포맷으로 변환
const finalLabel = BODY_TYPE_LABEL[bestType] || bestType;

onComplete(finalLabel);

    }
  };


  const current = quiz[step];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-center mb-4">
          체형 진단 ({step + 1}/5)
        </h3>
        <p className="text-gray-700 text-center mb-6">{current.question}</p>

        <div className="space-y-3">
          {current.answers.map((ans, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(ans.score)}
              className="w-full bg-gray-100 py-3 rounded-lg font-semibold hover:bg-yellow-400"
            >
              {ans.text}
            </button>
          ))}
        </div>

        <button
          className="w-full text-center text-gray-500 mt-6"
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------
     MyPage 본체
---------------------------------------------------*/
export const MyPage: React.FC<{
  profile: Profile;
  onSave: (p: Profile) => void;
}> = ({ profile, onSave }) => {
  const [formData, setFormData] = useState(profile);
  const [showQuiz, setShowQuiz] = useState(false);

  // 카메라 관련 변수
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // 카메라 제어
  useEffect(() => {
    const start = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        alert("카메라 접근 실패");
        setShowCamera(false);
      }
    };

    if (showCamera) start();
    else {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [showCamera]);

  /* -------------------------------
      입력값 변경
  --------------------------------*/
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "height" || name === "weight") {
      setFormData((p) => ({ ...p, [name]: value === "" ? null : Number(value) }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  /* -------------------------------
      프로필 저장
  --------------------------------*/
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    const result = await res.json();

    if (!result.success) {
      alert("프로필 저장 실패: " + result.error);
      return;
    }

    // 🔥 부모(App) 쪽 profile 상태도 최신 formData로 업데이트
    onSave(formData);

    alert("프로필이 저장되었습니다!");

  } catch (err) {
    alert("서버 오류로 저장에 실패했습니다.");
    console.error(err);
  }
};



  /* -------------------------------
      체형 퀴즈 완료
  --------------------------------*/
  const handleQuizComplete = (type: string) => {
    setFormData((p) => ({ ...p, body_type: type }));
    setShowQuiz(false);
  };

  /* -------------------------------
      퍼스널 컬러 분석 API
  --------------------------------*/
  const analyzeColor = async (blob: Blob) => {
    setIsAnalyzing(true);

    const form = new FormData();
    form.append("image", blob);

    try {
      const res = await fetch("/api/profile/analyze_color", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const r = await res.json();
      if (r.success && r.personal_color) {
        setFormData((p) => ({ ...p, personal_color: r.personal_color }));
        alert("AI 결과: " + r.personal_color);
      } else {
        throw new Error(r.error || "AI 분석 실패");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* -------------------------------
      웹캠 캡처
  --------------------------------*/
  const handleCapture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;

    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob((blob) => blob && analyzeColor(blob), "image/jpeg");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    analyzeColor(f);
    e.target.value = "";
  };

  /* -------------------------------------------------
        UI 렌더링
  ---------------------------------------------------*/
  return (
    <>
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6">My Profile</h2>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 신체 정보 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">신체 정보</h3>

            <InputField label="성별">
              <StyledSelect
                name="gender"
                value={formData.gender || ""}
                onChange={handleChange}
              >
                <option value="">선택</option>
                <option value="female">여성</option>
                <option value="male">남성</option>
              </StyledSelect>
            </InputField>

            <div className="grid grid-cols-2 gap-4">
              <InputField label="키(cm)">
                <StyledInput
                  name="height"
                  type="number"
                  value={formData.height ?? ""}
                  onChange={handleChange}
                  step="0.1"
                />
              </InputField>

              <InputField label="몸무게(kg)">
                <StyledInput
                  name="weight"
                  type="number"
                  value={formData.weight ?? ""}
                  onChange={handleChange}
                  step="0.1"
                />
              </InputField>
            </div>
          </div>

          {/* 스타일 진단 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">스타일 진단</h3>

            {/* 체형 */}
            <InputField
              label="체형"
              description={`현재 진단: ${
                formData.body_type || "아직 없음"
              }`}
            >
              <button
                type="button"
                onClick={() => setShowQuiz(true)}
                disabled={!formData.gender}
                className="w-full py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
              >
                {formData.gender ? "체형 진단 시작" : "성별을 먼저 선택해주세요"}
              </button>
            </InputField>

            {/* 퍼스널컬러 */}
            <InputField label="퍼스널 컬러" description={formData.personal_color || "정보 없음"}>
              {/* 파일 업로드 */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              {/* 웹캠 */}
              {showCamera ? (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    className="w-full rounded-lg bg-black"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCapture}
                      className="flex-1 py-2 bg-yellow-400 rounded-lg"
                    >
                      {isAnalyzing ? "분석중..." : "촬영 & 분석"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCamera(false)}
                      className="flex-1 py-2 bg-gray-200 rounded-lg"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="w-full py-2 bg-gray-200 rounded-lg"
                  >
                    웹캠 촬영하기
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-gray-100 rounded-lg"
                  >
                    사진 업로드해서 분석
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

                            {/* 직접 선택 드롭다운 */}
<div className="mt-2">
  <p className="text-xs text-gray-500 mb-1">직접 선택하기</p>
  <StyledSelect
    name="personal_color"
    value={formData.personal_color || ""}
    onChange={handleChange}
  >
    <option value="">선택 안 함</option>
    <option value="봄 웜톤">봄 웜톤</option>
    <option value="여름 쿨톤">여름 쿨톤</option>
    <option value="가을 웜톤">가을 웜톤</option>
    <option value="겨울 쿨톤">겨울 쿨톤</option>
    <option value="모르겠음">모르겠음</option>
  </StyledSelect>
</div>

            </InputField>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-yellow-400 rounded-lg font-semibold hover:bg-yellow-500"
          >
            저장하기
          </button>
        </form>
      </div>

      {showQuiz && (
        <BodyTypeQuizModal
          gender={formData.gender}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </>
  );
};
