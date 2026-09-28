# -*- coding: utf-8 -*-
import os
import sqlite3
import functools
from flask import Flask, request, jsonify, g, session, send_from_directory, current_app
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from db import init_app, get_db
import personal_color_analyzer
from dotenv import load_dotenv
import recommendation_engine
from google.generativeai import list_models

# Load .env
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev_secret_key_for_clody_project'

# 세션 쿠키 설정 (로컬 개발용)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'      # 🔧 기존 'None' → 'Lax' 로 변경
app.config['SESSION_COOKIE_SECURE'] = False        # HTTP 환경이므로 False
app.config['SESSION_COOKIE_HTTPONLY'] = True

# CORS 설정 (Vite dev 서버와 쿠키 공유를 위해 origin 명시)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

# DB 경로 설정
app.config.from_mapping(
    DATABASE=os.path.join(app.root_path, 'user.db')
)

# DB 초기화 모듈 등록
init_app(app)


# ===============================
# 로그인 상태 로드
# ===============================
@app.before_request
def load_logged_in_user():
    user_id = session.get('user_id')
    if user_id is None:
        g.user = None
    else:
        g.user = get_db().execute(
            'SELECT * FROM users WHERE id = ?', (user_id,)
        ).fetchone()


# ===============================
# 로그인 필요 데코레이터
# ===============================
def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return jsonify({'success': False, 'error': 'Login required'}), 401
        return view(**kwargs)
    return wrapped_view


# ===============================
# 회원가입
# ===============================
@app.route('/api/register', methods=['POST'])
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
@app.route('/api/login', methods=['POST'])
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
@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    session.clear()
    return jsonify({'success': True})


# ===============================
# 프로필 저장
# ===============================
@app.route('/api/profile/save', methods=['POST'])
@login_required
def save_profile():
    user_id = g.user['id']
    data = request.get_json()
    db = get_db()

    try:
        db.execute(
            """
            UPDATE users SET 
                gender = ?, 
                height = ?, 
                weight = ?, 
                personal_color = ?, 
                body_type = ?
            WHERE id = ?
            """,
            (
                data.get('gender'),
                data.get('height'),
                data.get('weight'),
                data.get('personal_color'),
                data.get('body_type'),
                user_id
            )
        )
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Profile Update Error: {e}")
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500


# ===============================
# 프로필 조회
# ===============================
@app.route('/api/profile/me', methods=['GET'])
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
@app.route('/api/profile', methods=['GET', 'POST'])
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
@app.route('/api/profile/analyze_color', methods=['POST'])
def analyze_color():
    if 'image' not in request.files:
        return jsonify({'success': False, 'error': '이미지 파일이 없습니다.'}), 400

    image_file = request.files['image']

    try:
        result = personal_color_analyzer.analyze_color_with_gemini(image_file.stream)

        if isinstance(result, dict):
            if not result.get("success"):
                return jsonify({'success': False, 'error': result.get("error")}), 500
            return jsonify({'success': True, 'personal_color': result.get("personal_color")})

        return jsonify({'success': True, 'personal_color': result})

    except Exception:
        return jsonify({'success': False, 'error': 'Color analysis failed'}), 500


# ===============================
# 추천 엔진 연결
# ===============================
@app.route('/api/recommend', methods=['POST'])
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
        result = recommendation_engine.get_gemini_recommendation(
            dict(profile), 
            [dict(row) for row in closet], 
            weather, 
            tpo
        )
        return jsonify({'success': True, **result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===============================
# 옷장 조회 (+ 자동 복원)
# ===============================
@app.route('/api/closet', methods=['GET'])
@login_required
def get_closet():
    user_id = g.user['id']
    db = get_db()

    rows = db.execute(
        'SELECT * FROM closet_items WHERE user_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()

    if len(rows) == 0:
        uploads_path = os.path.join(app.root_path, 'uploads')

        for filename in os.listdir(uploads_path):
            if filename.startswith(f"{user_id}_"):
                parts = filename.split("_")
                if len(parts) < 4:
                    continue
                _, category_large, category_small, *_ = parts
                db.execute(
                    """
                    INSERT INTO closet_items (user_id, name, image_path, category_large, category_small)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        filename,
                        f"/uploads/{filename}",
                        category_large,
                        category_small
                    )
                )
        db.commit()
        rows = db.execute(
            'SELECT * FROM closet_items WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        ).fetchall()

    return jsonify([dict(row) for row in rows])


# ===============================
# 옷 삭제
# ===============================
@app.route('/api/closet/<int:item_id>', methods=['DELETE'])
@login_required
def delete_closet_item(item_id):
    user_id = g.user['id']
    db = get_db()

    try:
        row = db.execute(
            "SELECT image_path FROM closet_items WHERE id = ? AND user_id = ?",
            (item_id, user_id)
        ).fetchone()

        if not row:
            return jsonify({'success': False, 'error': 'Item not found'}), 404

        db.execute("DELETE FROM closet_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        db.commit()

        image_path = row['image_path'].replace('/uploads/', '')
        file_path = os.path.join(app.root_path, 'uploads', image_path)

        if os.path.exists(file_path):
            os.remove(file_path)

        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Delete closet item error: {e}")
        return jsonify({'success': False, 'error': 'Delete failed'}), 500


# ===============================
# 옷 등록
# ===============================
@app.route('/api/closet/add', methods=['POST'])
@login_required
def add_closet_item():
    user_id = g.user['id']

    name = request.form.get("name")
    category_large = request.form.get("category_large")
    category_small = request.form.get("category_small")
    color = request.form.get("color")
    image_file = request.files.get("image")

    if not name or not category_large or not category_small or not image_file:
        return jsonify({"success": False, "error": "모든 필드를 입력해주세요."}), 400

    UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    filename = f"{user_id}_{int(__import__('time').time())}_{image_file.filename}"
    save_path = os.path.join(UPLOAD_FOLDER, filename)

    image_file.save(save_path)
    image_url = f"/uploads/{filename}"

    if category_large == "신발":
        color = None

    db = get_db()
    try:
        db.execute(
            """
            INSERT INTO closet_items
            (user_id, name, category_large, category_small, image_path, color)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (user_id, name, category_large, category_small, image_url, color)
        )
        db.commit()
        return jsonify({"success": True, "message": "아이템 저장 완료!", "color": color})
    except Exception as e:
        current_app.logger.error(f"옷 저장 오류: {e}")
        return jsonify({"success": False, "error": "DB 저장 오류"}), 500


# ===============================
# 업로드 파일 제공
# ===============================
@app.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory(os.path.join(app.root_path, 'uploads'), filename)


if __name__ == "__main__":
    app.run(debug=True)
