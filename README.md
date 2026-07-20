# Instagram Codex

React와 FastAPI로 구현한 Instagram 스타일의 풀스택 클론 프로젝트입니다. 피드, 게시물, 댓글, 좋아요, 팔로우, 알림, 검색, 1:1 메시지, 프로필 및 관리자 기능을 제공합니다.

## 기술 구성

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, SQLAlchemy
- Database: SQLite

## 운영 배포 현황

2026년 7월 20일 기준으로 다음 주소에 배포되어 있습니다.

- 서비스: <https://instagram.dataworkman.dedyn.io>
- Frontend: Vite 운영 빌드를 Nginx에서 정적 제공
- Backend: Python 3.11, Uvicorn, FastAPI (`127.0.0.1:8000`)
- Process: `instagram.service`를 통한 자동 시작 및 장애 시 재시작
- HTTPS: Let's Encrypt 인증서와 HTTP → HTTPS 리디렉션
- 인증서 갱신: `certbot-renew.timer`
- Database: `/var/www/instagram/backend/instagram.db`
- Uploads: `/var/www/instagram/backend/uploads`

현재 운영 상태를 확인하는 명령은 다음과 같습니다.

```bash
sudo systemctl status instagram nginx
curl -fsS https://instagram.dataworkman.dedyn.io/api/health
sudo journalctl -u instagram -f
```

소스 변경 후 재배포할 때는 프론트엔드를 다시 빌드하고 백엔드 서비스를 재시작합니다.

```bash
cd /var/www/instagram
git pull --ff-only
backend/.venv/bin/python -m pip install -r backend/requirements.txt
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build
sudo systemctl restart instagram
sudo nginx -t && sudo systemctl reload nginx
```

운영 환경변수는 Git에 포함하지 않는 `/etc/instagram-codex.env`에 저장하며 파일 권한은 `600`으로 제한합니다. `SECRET_KEY`, `ADMIN_PASSWORD`, `CORS_ORIGINS`, `DATABASE_URL`, `UPLOAD_DIR` 등을 이 파일에서 관리합니다. systemd와 Nginx 설정 원본은 [`deploy/`](deploy/) 디렉터리에 있습니다.

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

현재 운영 서버에는 시연용 일반 사용자 `alice`가 준비되어 있습니다. 운영 관리자 비밀번호는 공개된 기본값을 사용하지 않으며 서버의 `/etc/instagram-codex.env`에서만 관리합니다. 운영 환경에서는 `SEED_DEMO_DATA=false`로 설정되어 재시작 시 데모 데이터가 자동 생성되지 않습니다.

## 데이터 보관

SQLite 데이터베이스와 사용자가 업로드한 이미지는 로컬 실행 중 자동으로 만들어집니다. 개인정보와 실행 데이터가 Git에 포함되지 않도록 데이터베이스, 업로드 폴더, 가상환경 및 `node_modules`는 `.gitignore`에서 제외됩니다.

## 문서

- [프론트엔드 명세](front.md)
- [백엔드 및 API 명세](backend.md)
- [데이터베이스 설계](db.md)
- [프로젝트 가이드](guide.md)

## 주의

이 저장소는 학습 및 포트폴리오 목적으로 제작된 독립적인 클론 프로젝트이며 Meta 또는 Instagram의 공식 제품이 아닙니다.
