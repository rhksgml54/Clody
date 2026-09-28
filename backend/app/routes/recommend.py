# -*- coding: utf-8 -*-
from flask import Blueprint, g, jsonify, request

from ..db import get_db
from ..decorators import login_required
from ..services import recommendation

bp = Blueprint('recommend', __name__, url_prefix='/api')


# ===============================
# 추천 엔진 연결
# ===============================
@bp.route('/recommend', methods=['POST'])
@login_required
def recommend():
    data = request.get_json()
    weather = data.get('weather')
    tpo = data.get('tpo')

    if not weather or not tpo:
        return jsonify({'success': False, 'error': '날씨와 TPO 정보가 필요합니다.'}), 400

    db = get_db()
    user_id = g.user['id']

    profile = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    closet = db.execute('SELECT * FROM closet_items WHERE user_id = ?', (user_id,)).fetchall()

    try:
        result = recommendation.recommend_outfit(
            dict(profile),
            [dict(row) for row in closet],
            weather,
            tpo
        )
        return jsonify({'success': True, **result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
