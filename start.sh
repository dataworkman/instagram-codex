#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_URL="http://127.0.0.1:8000"
FRONTEND_URL="http://localhost:5173"
BACKEND_PID=""
FRONTEND_PID=""

info() { printf '\033[1;36m[Instagram]\033[0m %s\n' "$1"; }
fail() { printf '\033[1;31m[오류]\033[0m %s\n' "$1" >&2; exit 1; }
if command -v python3.11 >/dev/null 2>&1; then PYTHON_BIN=python3.11; else PYTHON_BIN=python3; fi
command -v "$PYTHON_BIN" >/dev/null 2>&1 || fail "Python 3가 필요합니다."
command -v npm >/dev/null 2>&1 || fail "Node.js와 npm이 필요합니다."

cleanup() {
  trap - INT TERM EXIT
  info "서버를 종료합니다."
  # 각 서버의 전체 프로세스 그룹을 종료해 uvicorn reloader와 Vite 자식도 남지 않게 한다.
  [[ -n "$BACKEND_PID" ]] && kill -- -"$BACKEND_PID" 2>/dev/null || true
  [[ -n "$FRONTEND_PID" ]] && kill -- -"$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

info "백엔드 환경을 준비합니다."
if [[ ! -x "$BACKEND_DIR/.venv/bin/python" ]]; then
  "$PYTHON_BIN" -m venv "$BACKEND_DIR/.venv"
fi
"$BACKEND_DIR/.venv/bin/python" -m pip install --disable-pip-version-check -q -r "$BACKEND_DIR/requirements.txt"

info "프론트엔드 패키지를 준비합니다."
(cd "$FRONTEND_DIR" && npm install --no-audit --no-fund)

curl -fsS "$BACKEND_URL/api/health" >/dev/null 2>&1 && fail "8000 포트가 이미 사용 중입니다. 기존 서버를 종료한 뒤 다시 실행해 주세요."
curl -fsS "$FRONTEND_URL" >/dev/null 2>&1 && fail "5173 포트가 이미 사용 중입니다. 기존 서버를 종료한 뒤 다시 실행해 주세요."

info "FastAPI 서버를 시작합니다: $BACKEND_URL"
setsid bash -c 'cd "$1" && exec "$2" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000' _ "$BACKEND_DIR" "$BACKEND_DIR/.venv/bin/python" &
BACKEND_PID=$!

info "백엔드가 준비될 때까지 기다립니다."
backend_ready=false
for _ in {1..60}; do
  kill -0 "$BACKEND_PID" 2>/dev/null || fail "백엔드 서버 실행에 실패했습니다. 위 로그를 확인해 주세요."
  if curl -fsS "$BACKEND_URL/api/health" >/dev/null 2>&1; then backend_ready=true; break; fi
  sleep 1
done
[[ "$backend_ready" == true ]] || fail "60초 안에 백엔드가 준비되지 않았습니다."

info "React 서버를 시작합니다: $FRONTEND_URL"
setsid bash -c 'cd "$1" && exec npm run dev -- --host 0.0.0.0 --strictPort' _ "$FRONTEND_DIR" &
FRONTEND_PID=$!

info "프론트엔드가 준비될 때까지 기다립니다."
ready=false
for _ in {1..60}; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null || ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    fail "서버 실행에 실패했습니다. 위 로그를 확인해 주세요."
  fi
  if curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done
[[ "$ready" == true ]] || fail "60초 안에 서버가 준비되지 않았습니다."

info "브라우저에서 앱을 엽니다."
if [[ "${NO_BROWSER:-0}" == "1" ]]; then
  info "NO_BROWSER=1 설정으로 브라우저 열기를 건너뜁니다."
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$FRONTEND_URL" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open "$FRONTEND_URL" >/dev/null 2>&1 &
else
  info "브라우저를 자동으로 열 수 없습니다. 직접 $FRONTEND_URL 을 열어 주세요."
fi

printf '\n\033[1;32m실행 완료!\033[0m 종료하려면 Ctrl+C를 누르세요.\n'
printf '  앱:       %s\n  API 문서: %s/docs\n\n' "$FRONTEND_URL" "$BACKEND_URL"
wait -n "$BACKEND_PID" "$FRONTEND_PID"
