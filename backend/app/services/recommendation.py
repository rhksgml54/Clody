# -*- coding: utf-8 -*-

# =============================================================
# ① UI → 서버용 TPO 변환 매핑
# =============================================================
TPO_MAP_UI_TO_SERVER = {
    "일상/캐주얼": "일상",
    "출근/비즈니스": "직장",
    "데이트/모임": "데이트",
    "격식 있는 행사": "격식",
    "여행/휴양": "여행",
    "스포츠/액티비티": "스포츠",
}

# =============================================================
# ② 서버용 TPO 카테고리 매핑 (중분류 기준)
# =============================================================
TPO_CATEGORY_MAP = {
    "일상": ["반팔 티셔츠", "긴팔 티셔츠", "후드/맨투맨", "청바지", "스니커즈", "가디건"],
    "직장": ["셔츠/블라우스", "면바지", "로퍼", "자켓"],
    "데이트": ["니트/스웨터", "셔츠/블라우스", "원피스", "청바지", "로퍼"],
    "격식": ["자켓", "블라우저", "드레스 셔츠", "정장 바지", "원피스", "구두", "힐"],
    "여행": ["반팔 티셔츠", "긴팔 티셔츠", "반바지", "청바지", "샌들", "스니커즈"],
    "스포츠": ["기능성 티셔츠", "트레이닝 바지", "운동화", "바람막이"],
}

# =============================================================
# ③ 기온별 weather score
# =============================================================
def calc_weather_score(temp, item):
    if not item or "category_small" not in item:
        return 20

    small = item["category_small"]
    large = item.get("category_large", "")

    # -------------------------
    # 🔥 아우터 온도 규칙
    # -------------------------
    LIGHT_OUTERS = ["자켓", "가디건"]
    HEAVY_OUTERS = ["패딩", "두꺼운 코트", "코트", "경량 패딩"]

    if large == "아우터":
        # 13도 이하 → Light outer
        if temp <= 13 and small in LIGHT_OUTERS:
            return 40

        # 5도 이하 → Heavy outer
        if temp <= 5 and small in HEAVY_OUTERS:
            return 40

        # temp 높아서 불필요하거나 규칙 외 → 기본점수
        return 20

    # -------------------------
    # 🔥 기존 상의/하의/신발 점수
    # -------------------------
    score_map = [
        (28, ["반팔 티셔츠", "민소매", "반바지"], 40),
        (20, ["반팔 티셔츠", "얇은 긴팔", "면바지", "얇은 셔츠"], 40),
        (15, ["긴팔 티셔츠", "셔츠/블라우스", "얇은 니트", "청바지", "가디건"], 40),
        (10, ["니트/스웨터", "후드/맨투맨", "자켓", "코튼팬츠"], 40),
        (4, ["두꺼운 니트", "기모 후드", "코트", "경량 패딩", "기모 바지"], 40),
        (-5, ["두꺼운 코트", "패딩", "기모바지", "터틀넥"], 40),
    ]

    for t, items, score in score_map:
        if temp >= t and small in items:
            return score

    return 20


# =============================================================
# ④ Harmony score
# =============================================================
def calc_harmony_score(item_color, personal_color, body_type):
    if not item_color:
        return 10

    score = 0

    warm = ["베이지", "브라운", "올리브", "카키", "레드"]
    cool = ["블루", "네이비", "그레이", "화이트", "블랙"]

    if personal_color:
        if personal_color.startswith("웜") and item_color in warm:
            score += 20
        if personal_color.startswith("쿨") and item_color in cool:
            score += 20

    if body_type == "역삼각형":
        score += 5
    if body_type == "삼각형":
        score += 5

    return min(score, 30)


# =============================================================
# ⑤ 유연 추천 엔진
# =============================================================
def generate_best_outfit(profile, closet_items, weather, tpo_ui):
    temp = weather.get("temp", 20)

    tpo = TPO_MAP_UI_TO_SERVER.get(tpo_ui, None)
    allowed_small = TPO_CATEGORY_MAP.get(tpo, []) if tpo else []

    # 1차 필터 (TPO)
    closet_filtered = [
        item for item in closet_items
        if item["category_small"] in allowed_small
    ]

    # 실패하면 전체 closet 사용
    if not closet_filtered:
        closet_filtered = closet_items[:]

    tops = [i for i in closet_filtered if i["category_large"] == "상의"]
    bottoms = [i for i in closet_filtered if i["category_large"] == "하의"]
    outers = [i for i in closet_filtered if i["category_large"] == "아우터"]
    shoes = [i for i in closet_filtered if i["category_large"] == "신발"]

    if not tops:
        tops = [i for i in closet_items if i["category_large"] == "상의"]
    if not bottoms:
        bottoms = [i for i in closet_items if i["category_large"] == "하의"]
    if not shoes:
        shoes = [i for i in closet_items if i["category_large"] == "신발"]
    if not outers:
        outers = [None]

    best = None
    best_score = -999999

    for top in tops:
        for bottom in bottoms:
            for shoe in shoes:
                for outer in outers:

                    weather_score = (
                        calc_weather_score(temp, top)
                        + calc_weather_score(temp, bottom)
                        + calc_weather_score(temp, shoe)
                    ) / 3

                    if outer:
                        weather_score = (
                            weather_score + calc_weather_score(temp, outer)
                        ) / 2

                    harmony_parts = []
                    for item in [top, bottom, outer]:
                        if item:
                            harmony_parts.append(
                                calc_harmony_score(
                                    item.get("color"),
                                    profile.get("personal_color"),
                                    profile.get("body_type"),
                                )
                            )

                    harmony_score = sum(harmony_parts) / len(harmony_parts)
                    tpo_fit = 30

                    total = weather_score + harmony_score + tpo_fit

                    if total > best_score:
                        best_score = total
                        # 🔥 여기서 선택된 아이템들의 image_path까지 저장
                        best = {
                            "상의": top["name"],
                            "하의": bottom["name"],
                            "아우터": outer["name"] if outer else "N/A",
                            "신발": shoe["name"],
                            "score": {
                                "total": round(total),
                                "weather_fit": round(weather_score),
                                "tpo_fit": round(tpo_fit),
                                "harmony_fit": round(harmony_score),
                            },
                            # 마네킹용 이미지 경로
                            "top_image_path": top.get("image_path"),
                            "bottom_image_path": bottom.get("image_path"),
                            "outer_image_path": outer.get("image_path") if outer else None,
                            "shoes_image_path": shoe.get("image_path"),
                        }

    return best


# =============================================================
# ⑥ 결과 반환
# =============================================================
def recommend_outfit(profile, closet_items, weather, tpo_ui):
    """최고 점수 조합과 자동 생성 설명, 점수를 반환"""
    try:
        best = generate_best_outfit(profile, closet_items, weather, tpo_ui)

        if not best:
            raise ValueError("추천 실패")

        explanation = (
            f"{tpo_ui} 상황에서 최적의 코디를 구성했습니다. "
            f"기온 {weather.get('temp')}도에 맞춰 착용감과 조화를 고려하여 조합했어요. "
            f"총점 {best['score']['total']}점으로 가장 높은 점수를 기록한 조합입니다."
        )

        # 🔥 generate_best_outfit에서 저장해 둔 image_path 꺼내기
        top_img = best.get("top_image_path")
        bottom_img = best.get("bottom_image_path")
        outer_img = best.get("outer_image_path")
        shoes_img = best.get("shoes_image_path")

        return {
            "recommendation": {
                "상의": best["상의"],
                "하의": best["하의"],
                "아우터": best["아우터"],
                "신발": best["신발"],
                "악세사리": "N/A",
                "설명": explanation,
                # 🔥 프론트 마네킹용 필드
                "topImage": top_img,
                "bottomImage": bottom_img,
                "outerImage": outer_img,
                "shoesImage": shoes_img,
            },
            "score": best["score"],   # 🔥 원본 점수 그대로 반환
        }

    except Exception as e:
        return {
            "recommendation": {
                "상의": "추천 실패",
                "하의": "N/A",
                "아우터": "N/A",
                "신발": "N/A",
                "악세사리": "N/A",
                "설명": f"오류 발생: {e}",
            },
            "score": {"total": 0, "weather_fit": 0, "tpo_fit": 0, "harmony_fit": 0},
        }
