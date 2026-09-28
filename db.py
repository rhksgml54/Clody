# db.py

import sqlite3
import click
from flask import current_app, g

def get_db():
    """현재 앱 컨텍스트에 대한 데이터베이스 연결"""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    """데이터베이스 연결 종료"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """schema.sql 기반으로 테이블 생성"""
    db = get_db()
    with current_app.open_resource('schema.sql') as f:
        db.executescript(f.read().decode('utf8'))
    print("🔥 init_db() 실행됨: schema.sql 테이블 생성 완료")

@click.command('init-db')
def init_db_command():
    """CLI에서 flask init-db 실행 가능"""
    init_db()
    click.echo('Initialized the database.')

def init_app(app):
    """Flask에 DB 관련 함수 등록"""
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
