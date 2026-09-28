# Clody

날씨 · TPO · 퍼스널컬러 · 체형을 바탕으로 내 옷장 속 옷으로 코디를 추천해 주는 웹 앱.

## 폴더 구조

```
Clody/
├─ frontend/                 # React + Vite + TypeScript
│  ├─ public/weather/        # 날씨 카드 배경 이미지
│  └─ src/
│     ├─ App.tsx             # 화면 전환, 로그인/추천 상태
│     ├─ pages/              # 화면 단위 컴포넌트
│     ├─ components/         # Header, SplashScreen 등 공용 컴포넌트
│     │  └─ ui/Form.tsx      # InputField / StyledInput / StyledSelect
│     └─ types.ts
├─ backend/                  # Flask API
│  ├─ run.py                 # 개발 서버 진입점
│  ├─ app/
│  │  ├─ __init__.py         # create_app() 팩토리
│  │  ├─ config.py
│  │  ├─ db.py, schema.sql
│  │  ├─ decorators.py       # login_required
│  │  ├─ routes/             # auth, profile, closet, recommend (Blueprint)
│  │  └─ services/           # recommendation(추천 엔진), personal_color(Gemini)
│  ├─ instance/user.db       # SQLite DB (git 제외)
│  └─ uploads/               # 옷 이미지 (git 제외)
└─ ml/                       # YOLO 학습 스크립트 (앱과 아직 미연동)
```

## 실행

### 1. 백엔드 (http://localhost:5000)

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

`backend/.env`:

```
GOOGLE_API_KEY=...               # 퍼스널컬러 분석용 Gemini 키
SECRET_KEY=...                   # 세션 서명 키 (없으면 개발용 기본값)
```

DB가 없을 때만 초기화 (**기존 데이터가 모두 삭제됨**):

```bash
flask --app run init-db
```

```bash
python run.py
```

### 2. 프론트엔드 (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

`frontend/.env.local`:

```
VITE_KMA_API_KEY=...             # 기상청 단기예보 API 키
```

`/api`, `/uploads` 요청은 Vite 프록시가 백엔드(5000)로 넘깁니다.
