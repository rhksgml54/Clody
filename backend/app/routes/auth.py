# -*- coding: utf-8 -*-
from flask import Blueprint, g, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from ..db import get_db
from ..decorators import login_required

bp = Blueprint('auth', __name__, url_prefix='/api')


# ===============================
# 로그인 상태 로드
# ===============================
@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')
    if user_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            'SELECT * FROM users WHERE id = ?', (user_id,)
        ).fetchone()


# ===============================
# 회원가입
# ===============================
@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username, password, gender = data.get('username'), data.get('password'), data.get('gender')
    db = get_db()

    if not username or not password:
        return jsonify({'success': False, 'error': '아이디와 비밀번호를 모두 입력해주세요.'}), 400

    try:
        if db.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone():
            return jsonify({'success': False, 'error': '이미 사용 중인 아이디입니다.'}), 409

        db.execute(
            'INSERT INTO users (username, password_hash, gender) VALUES (?, ?, ?)',
            (username, generate_password_hash(password), gender)
        )
        db.commit()
    except Exception:
        return jsonify({'success': False, 'error': '데이터베이스 오류가 발생했습니다.'}), 500

    return jsonify({'success': True}), 201


# ===============================
# 로그인
# ===============================
@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username, password = data.get('username'), data.get('password')
    db = get_db()

    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if user is None or not check_password_hash(user['password_hash'], password):
        return jsonify({'success': False, 'error': '아이디 또는 비밀번호가 올바르지 않습니다.'}), 401

    session.clear()
    session['user_id'] = user['id']

    return jsonify({
        'success': True,
        'user': {
            'id': user['id'],
            'username': user['username']
        }
    }), 200


# ===============================
# 로그아웃
# ===============================
@bp.route('/logout', methods=['POST'])
@login_required
def logout():
    session.clear()
    return jsonify({'success': True})
