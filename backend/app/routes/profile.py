# -*- coding: utf-8 -*-
from flask import Blueprint, g, jsonify, request

from ..db import get_db
from ..decorators import login_required
from ..services import personal_color

bp = Blueprint('profile', __name__, url_prefix='/api/profile')


# ===============================
# 프로필 조회 (로그인 직후 프로필 완성 여부 확인용)
# ===============================
@bp.route('/me', methods=['GET'])
@login_required
def profile_me():
    user_id = g.user['id']
    db = get_db()

    row = db.execute(
        "SELECT gender, height, weight, personal_color, body_type FROM users WHERE id = ?",
        (user_id,)
    ).fetchone()

    if not row:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    return jsonify({
        'success': True,
        'profile': {
            'gender': row['gender'],
            'height': row['height'],
            'weight': row['weight'],
            'personal_color': row['personal_color'],
            'body_type': row['body_type']
        }
    })


# ===============================
# 프로필 조회 & 저장
# ===============================
@bp.route('', methods=['GET', 'POST'])
@login_required
def profile():
    user_id = g.user['id']
    db = get_db()

    if request.method == 'POST':
        data = request.get_json()
        try:
            db.execute(
                """
                UPDATE users SET
                    gender = ?, height = ?, weight = ?, personal_color = ?, body_type = ?,
                    preferred_style = ?, preferred_fit = ?, style_priority = ?
                WHERE id = ?
                """,
                (
                    data.get('gender'),
                    data.get('height'),
                    data.get('weight'),
                    data.get('personal_color'),
                    data.get('body_type'),
                    data.get('preferred_style'),
                    data.get('preferred_fit'),
                    data.get('style_priority'),
                    user_id
                )
            )
            db.commit()
            return jsonify({'success': True})
        except Exception:
            return jsonify({'success': False, 'error': 'Failed to update profile'}), 500

    row = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()

    if not row:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    profile_data = {k: row[k] for k in row.keys() if k != "password_hash"}
    return jsonify({'success': True, 'profile': profile_data})


# ===============================
# 퍼스널 컬러 분석
# ===============================
@bp.route('/analyze_color', methods=['POST'])
def analyze_color():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': '이미지 파일이 없습니다.'}), 400

    image_file = request.files['image']

    try:
        result = personal_color.analyze_color_with_gemini(image_file.stream)

        if isinstance(result, dict):
            if not result.get("success"):
                return jsonify({'success': False, 'error': result.get("error")}), 500
            return jsonify({'success': True, 'personal_color': result.get("personal_color")})

        return jsonify({'success': True, 'personal_color': result})

    except Exception:
        return jsonify({'success': False, 'error': 'Color analysis failed'}), 500
