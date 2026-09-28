import google.generativeai as genai
import PIL.Image
import io
import json
import os
from dotenv import load_dotenv # [신규] .env 파일 로드

# --- [핵심 수정] ---
# .env 파일에서 환경 변수(API 키)를 불러옵니다.
load_dotenv() 

API_KEY_LOADED = False
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        API_KEY_LOADED = True
    except Exception as e:
        print(f"Gemini API 키 설정 오류: {e}")
else:
    print("경고: GOOGLE_API_KEY가 .env 파일에 설정되지 않았습니다.")
# --- [핵심 수정 끝] ---


def analyze_color_with_gemini(image_stream):
    """
    Gemini 1.5 Flash 모델을 사용하여 이미지의 퍼스널 컬러를 분석합니다.
    """
    # API 키가 로드되지 않았으면 즉시 오류 반환
    if not API_KEY_LOADED:
        return "진단 실패: 서버에 API 키가 설정되지 않았습니다."
        
    try:
        img = PIL.Image.open(image_stream)
        
        # 모델 설정
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # 프롬프트
        prompt_text = """
        이 인물의 피부톤, 머리카락 색, 눈동자 색을 분석해서 
        '봄 웜톤', '여름 쿨톤', '가을 웜톤', '겨울 쿨톤' 중 
        가장 가능성이 높은 퍼스널 컬러를 진단해줘. 
        조명이나 화장의 영향을 최대한 보정해줘.
        결과는 반드시 아래 JSON 형식으로만 알려줘.
        {"personal_color": "진단 결과"}
        """
        
        # 이미지와 텍스트를 함께 모델에 전달
        response = model.generate_content([prompt_text, img])
        
        # 모델의 응답에서 JSON 텍스트 추출
        response_text = response.text
        json_part = response_text.strip().replace("```json", "").replace("```", "").strip()
        
        # JSON 파싱
        result_json = json.loads(json_part)
        
        personal_color = result_json.get("personal_color")
        
        if personal_color and personal_color in ["봄 웜톤", "여름 쿨톤", "가을 웜톤", "겨울 쿨톤"]:
            return personal_color
        else:
            print(f"Gemini가 유효하지 않은 응답을 반환했습니다: {response_text}")
            return "진단 실패: AI가 유효한 응답을 생성하지 못했습니다."

    except Exception as e:
        print(f"Gemini API 호출 중 오류 발생: {e}")
        return f"진단 중 오류 발생: {e}"

