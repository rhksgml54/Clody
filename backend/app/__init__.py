# -*- coding: utf-8 -*-
import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from .config import BACKEND_DIR, Config

# 서비스 모듈이 import 시점에 API 키를 읽으므로 가장 먼저 로드
load_dotenv(os.path.join(BACKEND_DIR, '.env'))


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    os.makedirs(os.path.dirname(app.config['DATABASE']), exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    CORS(app, supports_credentials=True, origins=app.config['CORS_ORIGINS'])

    from . import db
    db.init_app(app)

    from .routes import auth, closet, profile, recommend
    app.register_blueprint(auth.bp)
    app.register_blueprint(profile.bp)
    app.register_blueprint(closet.bp)
    app.register_blueprint(recommend.bp)

    return app
