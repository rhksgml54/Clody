# -*- coding: utf-8 -*-
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key_for_clody_project')

    # 세션 쿠키 설정 (로컬 개발용)
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = False  # HTTP 환경이므로 False
    SESSION_COOKIE_HTTPONLY = True

    # Vite dev 서버와 쿠키 공유를 위해 origin 명시
    CORS_ORIGINS = ["http://localhost:5173"]

    DATABASE = os.path.join(BACKEND_DIR, 'instance', 'user.db')
    UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')
