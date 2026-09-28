# -*- coding: utf-8 -*-
"""개발 서버 실행: backend/ 폴더에서 `python run.py`"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
