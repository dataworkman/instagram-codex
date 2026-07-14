#!/usr/bin/env python3
"""End-to-end smoke test using a disposable SQLite database."""

import json
import os
import shutil
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from io import BytesIO
from pathlib import Path

from PIL import Image

BASE = "http://127.0.0.1:8011"
BACKEND = Path(__file__).resolve().parents[1]
DB = Path("/tmp/instagram-api-smoke.db")
UPLOADS = Path("/tmp/instagram-api-smoke-uploads")


def call(method, path, *, token=None, json_body=None, form=None, multipart=None, expected=200):
    headers = {}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if json_body is not None:
        data = json.dumps(json_body).encode()
        headers["Content-Type"] = "application/json"
    elif form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif multipart is not None:
        boundary = f"----instagram-{uuid.uuid4().hex}"
        body = bytearray()
        for name, value in multipart.get("fields", {}).items():
            body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
        for name, (filename, content, content_type) in multipart.get("files", {}).items():
            body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\nContent-Type: {content_type}\r\n\r\n".encode())
            body.extend(content)
            body.extend(b"\r\n")
        body.extend(f"--{boundary}--\r\n".encode())
        data = bytes(body)
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    request = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            status = response.status
            raw = response.read()
    except urllib.error.HTTPError as error:
        status = error.code
        raw = error.read()
    assert status == expected, f"{method} {path}: expected {expected}, got {status}: {raw.decode(errors='replace')}"
    content_type = ""
    try:
        content_type = response.headers.get("Content-Type", "")
    except UnboundLocalError:
        pass
    return json.loads(raw) if raw and ("json" in content_type or raw[:1] in (b"{", b"[")) else raw


def image_bytes(fmt="JPEG"):
    stream = BytesIO()
    Image.new("RGB", (24, 24), (120, 80, 200)).save(stream, format=fmt)
    return stream.getvalue()


def passed(label):
    print(f"PASS  {label}")


def main():
    DB.unlink(missing_ok=True)
    for suffix in ("-wal", "-shm"):
        Path(str(DB) + suffix).unlink(missing_ok=True)
    shutil.rmtree(UPLOADS, ignore_errors=True)
    env = os.environ.copy()
    env.update({
        "DATABASE_URL": f"sqlite:///{DB}",
        "UPLOAD_DIR": str(UPLOADS),
        "SEED_DEMO_DATA": "true",
    })
    process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8011"],
        cwd=BACKEND,
        env=env,
        start_new_session=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
    )
    try:
        for _ in range(80):
            try:
                if call("GET", "/api/health")["status"] == "ok":
                    break
            except Exception:
                time.sleep(0.25)
        else:
            raise RuntimeError("server did not start")

        assert call("GET", "/api/posts/explore")
        assert call("GET", "/api/users/search?q=Alice")[0]["username"] == "alice"
        assert call("GET", "/api/users/alice")["username"] == "alice"
        call("GET", "/api/auth/me", expected=401)
        call("GET", "/api/posts/feed", expected=401)
        passed("공개 조회 및 비인증 접근 차단")

        registration = call("POST", "/api/auth/register", json_body={
            "username": "Diana.Test", "email": "DIANA@example.com", "password": "password123", "full_name": "Diana Test"
        }, expected=201)
        token = registration["access_token"]
        assert registration["user"]["username"] == "diana.test"
        call("POST", "/api/auth/register", json_body={
            "username": "DIANA.TEST", "email": "other@example.com", "password": "password123"
        }, expected=400)
        assert call("POST", "/api/auth/login", form={"username": "DIANA.TEST", "password": "password123"})["access_token"]
        assert call("GET", "/api/auth/me", token=token)["email"] == "diana@example.com"
        assert isinstance(call("GET", "/api/posts/feed", token=token), list)
        passed("회원가입, 중복 방지, 로그인, 사용자 복원")

        call("POST", "/api/posts", token=token, multipart={
            "fields": {"caption": "invalid"},
            "files": {"image": ("fake.jpg", b"not-an-image", "image/jpeg")},
        }, expected=400)

        post = call("POST", "/api/posts", token=token, multipart={
            "fields": {"caption": "Smoke test post"},
            "files": {"image": ("post.jpg", image_bytes(), "image/jpeg")},
        }, expected=201)
        post_id = post["id"]
        assert call("GET", post["image_url"], expected=200)
        assert call("GET", f"/api/posts/{post_id}")["caption"] == "Smoke test post"
        assert call("POST", f"/api/posts/{post_id}/like", token=token)["is_liked"] is True
        assert call("POST", f"/api/posts/{post_id}/like", token=token)["is_liked"] is False
        assert call("POST", f"/api/posts/{post_id}/like", token=token)["is_liked"] is True
        passed("이미지 검증, 게시물 작성·조회, 좋아요 토글")

        comment = call("POST", f"/api/posts/{post_id}/comments", token=token, json_body={"content": "  hello  "}, expected=201)
        assert comment["content"] == "hello"
        assert call("GET", f"/api/posts/{post_id}/comments")[0]["id"] == comment["id"]
        call("POST", f"/api/posts/{post_id}/comments", token=token, json_body={"content": "   "}, expected=422)
        passed("댓글 작성·공개 조회·빈 댓글 차단")

        follow = call("POST", "/api/users/bob/follow", token=token)
        assert follow["is_following"] is True
        message = call("POST", "/api/messages/bob", token=token, json_body={"content": "  Hi Bob  "}, expected=201)
        assert message["content"] == "Hi Bob"
        assert call("GET", "/api/messages/bob", token=token)[-1]["id"] == message["id"]
        assert call("GET", "/api/messages/conversations", token=token)[0]["user"]["username"] == "bob"
        assert any(user["username"] == "bob" for user in call("GET", "/api/messages/contacts", token=token))
        call("POST", "/api/messages/bob", token=token, json_body={"content": "   "}, expected=422)
        passed("팔로우 및 1:1 메시지 송수신")

        bob = call("POST", "/api/auth/login", form={"username": "bob", "password": "password123"})
        bob_notifications = call("GET", "/api/notifications", token=bob["access_token"])
        assert any(item["type"] == "follow" and item["actor"]["username"] == "diana.test" for item in bob_notifications)
        passed("좋아요·댓글·팔로우 기반 활동 알림")

        updated = call("PUT", "/api/users/me", token=token, json_body={"full_name": "Diana Updated", "bio": "Testing"})
        assert updated["full_name"] == "Diana Updated"
        avatar = call("POST", "/api/users/me/avatar", token=token, multipart={
            "files": {"file": ("avatar.png", image_bytes("PNG"), "image/png")}
        })
        assert call("GET", avatar["avatar_url"], expected=200)
        call("PUT", "/api/auth/password", token=token, json_body={"current_password": "password123", "new_password": "password456"})
        assert call("POST", "/api/auth/login", form={"username": "diana.test", "password": "password456"})["access_token"]
        passed("프로필·아바타·비밀번호 설정")

        call("DELETE", f"/api/comments/{comment['id']}", token=token)
        image_url = post["image_url"]
        call("DELETE", f"/api/posts/{post_id}", token=token)
        call("GET", image_url, expected=404)
        call("PUT", f"/api/posts/{post_id}", token=token, json_body={"caption": "not supported"}, expected=405)
        call("GET", "/api/users/alice/followers", token=token, expected=404)
        call("GET", "/api/users/alice/following", token=token, expected=404)
        assert call("POST", "/api/users/bob/follow", token=token)["is_following"] is False
        passed("댓글·게시물·파일 삭제 및 미사용 API 제거")

        call("POST", "/api/admin/login", json_body={"username":"admin","password":"wrong"}, expected=401)
        admin_login=call("POST", "/api/admin/login", json_body={"username":"admin","password":"pass123"})
        admin_token=admin_login["access_token"]
        call("GET", "/api/admin/stats", token=bob["access_token"], expected=403)
        stats=call("GET", "/api/admin/stats", token=admin_token)
        assert stats["users_count"]==4 and stats["posts_count"]>=6
        managed_users=call("GET", "/api/admin/users", token=admin_token)
        diana=next(user for user in managed_users if user["username"]=="diana.test")
        assert diana["created_at"] and "posts_count" in diana

        managed_post=call("POST", "/api/posts", token=token, multipart={
            "fields":{"caption":"Admin delete target"},
            "files":{"image":("admin-target.jpg",image_bytes(),"image/jpeg")},
        }, expected=201)
        assert any(post["id"]==managed_post["id"] for post in call("GET", "/api/admin/posts", token=admin_token))
        call("DELETE", f"/api/admin/posts/{managed_post['id']}", token=admin_token)
        call("GET", managed_post["image_url"], expected=404)
        call("DELETE", f"/api/admin/users/{diana['id']}", token=admin_token)
        call("GET", "/api/auth/me", token=token, expected=401)
        passed("관리자 인증·권한·통계·회원 및 게시물 관리")
        print("api-smoke-ok")
    finally:
        try:
            os.killpg(process.pid, signal.SIGTERM)
        except ProcessLookupError:
            pass
        process.wait(timeout=10)
        DB.unlink(missing_ok=True)
        for suffix in ("-wal", "-shm"):
            Path(str(DB) + suffix).unlink(missing_ok=True)
        shutil.rmtree(UPLOADS, ignore_errors=True)


if __name__ == "__main__":
    main()
