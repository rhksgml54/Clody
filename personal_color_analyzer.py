# personal_color_analyzer.py

import google.generativeai as genai
import PIL.Image
import io
import json
import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
    print("[DEBUG] Gemini API Key Loaded")
else:
    print("[ERROR] GOOGLE_API_KEY not found in .env")


def analyze_color_with_gemini(image_stream):
    try:
        # PIL 이미지 로딩
        img = PIL.Image.open(image_stream)

        # JPEG byte 변환
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="JPEG")
        img_bytes = img_bytes.getvalue()

        # ---- 중요: 네 환경에서 사용할 수 있는 이미지 모델 ----
        model = genai.GenerativeModel("models/gemini-2.5-flash-image")

        prompt = """
        이 사람의 피부톤, 머리색, 눈동자 색을 기준으로
        가장 가능성이 높은 퍼스널컬러를 판단해줘.

        반드시 아래 JSON 형태로만 출력해.
        {
            "personal_color": "봄 웜톤"
        }
        """

        response = model.generate_content([
            {"text": prompt},
            {
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img_bytes
                }
            }
        ])

        text = response.text.strip()
        text = text.replace("```json", "").replace("```", "").strip()

        result = json.loads(text)

        return {
            "success": True,
            "personal_color": result.get("personal_color")
        }

    except Exception as e:
        print("[ERROR] Gemini analyze_color:", e)
        return {
            "success": False,
            "personal_color": None,
            "error": str(e)
        }
