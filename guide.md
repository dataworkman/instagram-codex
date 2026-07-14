# Instagram 클론 — 전체 프로젝트 가이드 (guide.md)

## 1. 프로젝트 소개

Instagram의 핵심 기능을 재현한 풀스택 웹 애플리케이션입니다.

### 주요 기능
- 회원가입 / 로그인 (JWT 인증)
- 게시물 업로드 (이미지 + 캡션)
- 피드 (팔로우한 사용자 게시물)
- 탐색 (전체 공개 게시물)
- 좋아요 / 댓글
- 팔로우 / 언팔로우
- 사용자 검색
- 프로필 페이지

### 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | React 18, TypeScript, Vite, React Router |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite |
| Auth | JWT (Bearer Token) |
| File Storage | 로컬 파일 시스템 (`backend/uploads/`) |

## 2. 프로젝트 구조

```
my_instagram/
├── guide.md          ← 이 파일
├── front.md          ← 프론트엔드 명세
├── backend.md        ← 백엔드 명세
├── db.md             ← DB 설계 명세
├── backend/          ← FastAPI 서버
│   ├── app/
│   ├── uploads/
│   └── requirements.txt
└── frontend/         ← React 앱
    ├── src/
    └── package.json
```

## 3. 빠른 시작

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- npm 또는 yarn

### 원클릭 실행 (권장)

프로젝트 루트에서 아래 명령 하나만 실행합니다.

```bash
./start.sh
```

처음 실행할 때 Python 가상환경과 npm 패키지를 자동으로 준비합니다. 이후 FastAPI와 Vite 서버를 함께 실행하고 `http://localhost:5173`을 기본 브라우저에서 자동으로 엽니다. 두 서버를 함께 종료하려면 실행한 터미널에서 `Ctrl+C`를 누르세요.

`make start` 명령도 동일하게 사용할 수 있습니다.

### 수동 실행

### 1단계: 백엔드 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

백엔드가 http://localhost:8000 에서 실행됩니다.  
API 문서: http://localhost:8000/docs

### 2단계: 프론트엔드 실행 (새 터미널)

```bash
cd frontend
npm install
npm run dev
```

프론트엔드: http://localhost:5173

### 3단계: 데모 계정으로 로그인

| Username | Password |
|----------|----------|
| alice | password123 |
| bob | password123 |
| charlie | password123 |

## 4. 아키텍처

```
┌─────────────┐     HTTP/REST      ┌─────────────┐     SQLAlchemy    ┌──────────┐
│   React     │ ◄──────────────►  │   FastAPI   │ ◄──────────────►  │  SQLite  │
│  (Vite)     │   JWT Bearer      │   (Python)  │                   │   .db    │
│  :5173      │                   │   :8000     │                   └──────────┘
└─────────────┘                   └──────┬──────┘
                                         │
                                  ┌──────▼──────┐
                                  │  uploads/   │
                                  │  (images)   │
                                  └─────────────┘
```

## 5. API 엔드포인트 요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/auth/me` | 내 정보 |
| GET | `/api/users/{username}` | 프로필 |
| GET | `/api/users/search` | 사용자 검색 |
| POST | `/api/users/{username}/follow` | 팔로우 토글 |
| GET | `/api/posts/feed` | 피드 |
| GET | `/api/posts/explore` | 탐색 |
| POST | `/api/posts` | 게시물 생성 |
| GET | `/api/posts/{id}` | 게시물 상세 |
| POST | `/api/posts/{id}/like` | 좋아요 토글 |
| GET/POST | `/api/posts/{id}/comments` | 댓글 |
| DELETE | `/api/comments/{id}` | 댓글 삭제 |

상세 스펙은 [backend.md](./backend.md) 참조.

## 6. 개발 워크플로

1. **DB 변경** → `db.md` 업데이트 → `models.py` 수정 → 앱 재시작
2. **API 추가** → `backend.md` 업데이트 → router 추가 → Swagger 확인
3. **UI 추가** → `front.md` 업데이트 → 컴포넌트/페이지 구현

## 7. 환경 변수 (선택)

백엔드 `.env` (기본값 내장):

```
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=sqlite:///./instagram.db
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

## 8. 배포 참고

| 구성요소 | 권장 |
|----------|------|
| Frontend | Vercel, Netlify (빌드: `npm run build`) |
| Backend | Railway, Render, Docker |
| DB (프로덕션) | PostgreSQL로 마이그레이션 권장 |
| 이미지 | AWS S3, Cloudinary |

## 9. 관련 문서

- [프론트엔드 명세서](./front.md)
- [백엔드 명세서](./backend.md)
- [데이터베이스 설계](./db.md)
