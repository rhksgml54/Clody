# -*- coding: utf-8 -*-
import os
import time

from flask import Blueprint, current_app, g, jsonify, request, send_from_directory

from ..db import get_db
from ..decorators import login_required

bp = Blueprint('closet', __name__)


# ===============================
# 옷장 조회 (+ 자동 복원)
# ===============================
@bp.route('/api/closet', methods=['GET'])
@login_required
def get_closet():
    user_id = g.user['id']
    db = get_db()

    rows = db.execute(
        'SELECT * FROM closet_items WHERE user_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()

    if len(rows) == 0:
        uploads_path = current_app.config['UPLOAD_FOLDER']

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
@bp.route('/api/closet/<int:item_id>', methods=['DELETE'])
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
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_path)

        if os.path.exists(file_path):
            os.remove(file_path)

        return jsonify({'success': True})
    except Exception as e:
        current_app.logger.error(f"Delete closet item error: {e}")
        return jsonify({'success': False, 'error': 'Delete failed'}), 500


# ===============================
# 옷 등록
# ===============================
@bp.route('/api/closet/add', methods=['POST'])
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

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)

    filename = f"{user_id}_{int(time.time())}_{image_file.filename}"
    save_path = os.path.join(upload_folder, filename)

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
@bp.route('/uploads/<path:filename>')
def serve_uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
