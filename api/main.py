# api/main.py

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io

from personal_color_analyzer import analyze_color_with_gemini

app = FastAPI()

# Vite 개발 서버(5173)에서 호출할 수 있게 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"ok": True}

@app.post("/api/profile/analyze_color")
async def analyze_profile_color(image: UploadFile = File(...)):
    """
    프론트에서 보낸 얼굴 사진을 받아
    personal_color_analyzer.analyze_color_with_gemini 로 분석 후 결과를 반환
    """
    try:
        image_bytes = await image.read()
        result = analyze_color_with_gemini(io.BytesIO(image_bytes))

        # personal_color_analyzer.py 에서 dict 형태로 반환하도록 이미 수정했음:
        # { "success": bool, "personal_color": str | None, "error": str | None }

        if not result.get("success"):
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": result.get("error", "AI 분석 실패"),
                },
            )

        return {
            "success": True,
            "personal_color": result.get("personal_color"),
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": f"서버 내부 오류: {e}",
            },
        )


# 선택: /api/recommend 도 404 안 나게 더미로 만들어두고 싶으면
@app.post("/api/recommend")
async def recommend_dummy():
    """
    프론트에서 /api/recommend 를 호출해도 최소한 404는 나지 않도록 하는 더미 엔드포인트.
    나중에 진짜 추천 로직으로 교체하면 됨.
    """
    return {
        "recommendation": {
            "outfit_image_path": "",
            "top": None,
            "bottom": None,
            "outerwear": None,
        }
    }
