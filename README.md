# Instagram Codex

React와 FastAPI로 구현한 Instagram 스타일의 풀스택 클론 프로젝트입니다. 피드, 게시물, 댓글, 좋아요, 팔로우, 알림, 검색, 1:1 메시지, 프로필 및 관리자 기능을 제공합니다.

## 기술 구성

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, SQLAlchemy
- Database: SQLite

## 한 번에 실행하기

Linux 환경에서 다음 명령을 실행하면 필요한 패키지를 설치하고 프론트엔드와 백엔드를 시작한 뒤 브라우저를 엽니다.

```bash
chmod +x start.sh
./start.sh
```

- 웹 앱: <http://localhost:5173>
- API 문서: <http://127.0.0.1:8000/docs>

브라우저 자동 실행을 원하지 않으면 다음과 같이 실행합니다.

```bash
NO_BROWSER=1 ./start.sh
```

## 개발용 계정

- 일반 사용자: `alice` / `password123`
- 관리자: `admin` / `pass123`

위 계정은 로컬 개발과 시연 전용입니다. 공개 서비스에서는 반드시 강력한 비밀번호와 별도의 `SECRET_KEY` 환경변수를 사용하세요.

## 데이터 보관

SQLite 데이터베이스와 사용자가 업로드한 이미지는 로컬 실행 중 자동으로 만들어집니다. 개인정보와 실행 데이터가 Git에 포함되지 않도록 데이터베이스, 업로드 폴더, 가상환경 및 `node_modules`는 `.gitignore`에서 제외됩니다.

## 문서

- [프론트엔드 명세](front.md)
- [백엔드 및 API 명세](backend.md)
- [데이터베이스 설계](db.md)
- [프로젝트 가이드](guide.md)

## 주의

이 저장소는 학습 및 포트폴리오 목적으로 제작된 독립적인 클론 프로젝트이며 Meta 또는 Instagram의 공식 제품이 아닙니다.
