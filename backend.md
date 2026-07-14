# Instagram 클론 백엔드 개발 명세서

## 1. 문서 목적

이 문서는 현재 구현된 React 프론트엔드 화면을 동작시키기 위한 백엔드 범위만 정의한다. Instagram 원본 서비스의 모든 기능을 복제하지 않으며, 화면이나 사용자 흐름이 없는 기능은 구현 대상에서 제외한다.

개발 환경과 프로덕션 환경 모두 FastAPI, SQLAlchemy, SQLite 및 로컬 파일 저장소를 사용한다.

> 현재 구현 상태: 프론트엔드, 사용자 API, 관리자 API와 SQLite 스키마가 연동되어 있다.

## 2. 구현 대상 화면

| 프론트엔드 경로 | 화면 | 필요한 백엔드 기능 | 인증 |
|---|---|---|---|
| `/` | 공개/개인 피드 | 탐색 피드, 로그인 사용자 피드 | 조회 선택 |
| `/login` | 로그인 | JWT 로그인 | 공개 |
| `/register` | 회원가입 | 계정 생성 및 자동 로그인 | 공개 |
| `/explore` | 탐색 | 전체 게시물 조회 | 공개 |
| `/search` | 사용자 검색 | username/full_name 검색 | 공개 |
| `/:username` | 프로필 | 프로필, 통계, 게시물, 팔로우 | 조회 공개 |
| `/p/:postId` | 게시물 상세 | 게시물, 댓글, 좋아요, 삭제 | 조회 공개 |
| `/create` | 게시물 작성 | 이미지 업로드, 캡션 저장 | 필수 |
| `/messages` | 1:1 메시지 | 연락처, 대화 목록, 송수신 | 필수 |
| `/notifications` | 활동 알림 | 좋아요, 댓글, 팔로우 활동 집계 | 필수 |
| `/settings` | 설정 | 프로필/사진/비밀번호 변경 | 필수 |
| `/admin/login` | 관리자 로그인 | 관리자 전용 JWT 로그인 | 공개 |
| `/admin` | 관리자 시스템 | 통계, 회원·게시물 관리 | 관리자 |

## 3. 기술 스택

| 영역 | 기술 및 정책 |
|---|---|
| Runtime | Python 3.11 이상 |
| API | FastAPI 0.115 이상 |
| ORM | SQLAlchemy 2.x |
| Validation | Pydantic 2.x |
| Database | SQLite 3 (개발·프로덕션 공통) |
| Auth | JWT Bearer, 유효기간 7일 |
| Password | passlib + bcrypt 4.0.1 |
| Upload | 로컬 `backend/uploads/` |
| API docs | `/docs`, `/openapi.json` |

## 4. 프로젝트 구조

```text
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── utils.py
│   ├── seed.py
│   └── routers/
│       ├── auth.py
│       ├── users.py
│       ├── posts.py
│       ├── comments.py
│       ├── likes.py
│       ├── messages.py
│       ├── notifications.py
│       └── admin.py
├── uploads/
├── instagram.db
└── requirements.txt
```

## 5. 인증 및 접근 정책

### 5.1 공개 조회

로그인하지 않은 사용자도 랜딩 피드, 탐색, 검색, 프로필, 게시물 상세 및 댓글 목록을 볼 수 있다. 공개 조회에서는 `is_liked`와 `is_following`을 `false`로 반환한다.

### 5.2 인증 필요 활동

다음 작업에는 유효한 Bearer 토큰이 필요하다.

- 게시물 작성 및 삭제
- 좋아요 토글
- 댓글 작성 및 본인 댓글 삭제
- 팔로우 토글
- 메시지 조회 및 전송
- 활동 알림 조회
- 프로필, 사진 및 비밀번호 변경

### 5.3 토큰 처리

- 로그인 및 회원가입 성공 시 access token과 사용자 정보를 함께 반환한다.
- 토큰 만료는 기본 10,080분(7일)이다.
- 인증 필수 API의 토큰 누락·만료·변조는 `401`을 반환한다.
- 선택 인증 API는 토큰이 없으면 익명 조회로 처리한다.

## 6. API 명세

Base URL은 `/api`이다.

### 6.1 인증

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | `/auth/register` | 회원가입 후 토큰 발급 | 공개 |
| POST | `/auth/login` | OAuth2 form 로그인 | 공개 |
| GET | `/auth/me` | 현재 사용자 복원 | 필수 |
| PUT | `/auth/password` | 현재 비밀번호 확인 후 변경 | 필수 |

회원가입 요청:

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "password123",
  "full_name": "Alice Kim"
}
```

비밀번호 변경 요청:

```json
{
  "current_password": "password123",
  "new_password": "new-password123"
}
```

### 6.2 사용자와 설정

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/users/search?q=` | username/full_name 부분 검색, 최대 20명 | 공개 |
| GET | `/users/{username}` | 프로필과 게시물/팔로우 통계 | 선택 |
| PUT | `/users/me` | 이름과 소개 변경 | 필수 |
| POST | `/users/me/avatar` | 프로필 이미지 변경 | 필수 |
| POST | `/users/{username}/follow` | 팔로우/언팔로우 토글 | 필수 |

프로필 응답에는 `posts_count`, `followers_count`, `following_count`, `is_following`을 포함한다. 별도의 팔로워·팔로잉 목록 화면이 없으므로 목록 API는 필수 범위에서 제외한다.

### 6.3 게시물과 피드

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/posts/feed?skip=0&limit=10` | 본인과 팔로잉 게시물 | 필수 |
| GET | `/posts/explore?skip=0&limit=30` | 전체 게시물 최신순 | 선택 |
| GET | `/posts/user/{username}` | 특정 사용자의 게시물 | 선택 |
| GET | `/posts/{post_id}` | 게시물 상세 | 선택 |
| POST | `/posts` | 이미지와 캡션으로 게시물 작성 | 필수 |
| DELETE | `/posts/{post_id}` | 본인 게시물 삭제 | 필수 |

게시물 작성은 `multipart/form-data`를 사용한다.

- `image`: jpg/jpeg/png/webp, 최대 5MB
- `caption`: 선택, 최대 2,200자

현재 UI에는 캡션 수정 화면이 없으므로 `PUT /posts/{post_id}`는 필수 범위에서 제외한다.

### 6.4 좋아요와 댓글

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | `/posts/{post_id}/like` | 좋아요/취소 토글 | 필수 |
| GET | `/posts/{post_id}/comments` | 댓글 목록 | 선택 |
| POST | `/posts/{post_id}/comments` | 댓글 작성 | 필수 |
| DELETE | `/comments/{comment_id}` | 본인 댓글 삭제 | 필수 |

좋아요 응답:

```json
{ "is_liked": true, "likes_count": 12 }
```

### 6.5 1:1 메시지

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/messages/contacts` | 본인을 제외한 연락처 | 필수 |
| GET | `/messages/conversations` | 상대별 최근 대화 | 필수 |
| GET | `/messages/{username}` | 상대와 주고받은 메시지 | 필수 |
| POST | `/messages/{username}` | 텍스트 메시지 전송 | 필수 |

- 메시지는 1~2,000자 텍스트만 지원한다.
- 프론트엔드는 선택된 대화를 3초 간격으로 다시 조회한다.
- 읽음 상태, 첨부 파일, 그룹 채팅, 메시지 삭제는 구현하지 않는다.

### 6.6 활동 알림

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | `/notifications?limit=50` | 좋아요·댓글·팔로우 활동 최신순 조회 | 필수 |

알림은 별도 테이블에 중복 저장하지 않는다. `likes`, `comments`, `follows`를 조회해 응답 시 조합한다.

```json
{
  "id": "like-15",
  "type": "like",
  "actor": { "id": 2, "username": "bob" },
  "text": "회원님의 게시물을 좋아합니다.",
  "post_id": 4,
  "post_image_url": "/uploads/post.jpg",
  "created_at": "2026-07-14T12:00:00Z"
}
```

읽음 여부와 푸시 알림은 현재 디자인에 없으므로 구현하지 않는다.

### 6.7 실행 상태 및 이미지 제공

| Method | Endpoint | 설명 | 인증 | 사용처 |
|---|---|---|---|---|
| GET | `/health` | 백엔드 준비 상태 확인 | 공개 | `start.sh` |
| GET | `/uploads/{filename}` | 게시물·프로필 이미지 정적 제공 | 공개 | 모든 이미지 UI |

`/health`의 실제 전체 경로는 `/api/health`이며 정상 상태에서 `200 { "status": "ok" }`를 반환한다. `/uploads`는 API JSON 엔드포인트가 아니라 FastAPI `StaticFiles` 마운트다. DB에는 파일 바이너리가 아닌 `/uploads/{uuid}.{ext}` 상대 경로만 저장한다.

### 6.8 최종 엔드포인트와 DB 매핑

아래 사용자 API 25개와 관리자 API 6개, 정적 파일 경로 1개가 최종 범위다. `R`은 조회, `W`는 생성·수정·삭제를 뜻한다.

| Endpoint | users | posts | comments | likes | follows | messages | 비고 |
|---|---:|---:|---:|---:|---:|---:|---|
| POST `/auth/register` | W |  |  |  |  |  | bcrypt 해시 저장 |
| POST `/auth/login` | R |  |  |  |  |  | username NOCASE 조회 |
| GET `/auth/me` | R | R |  |  | R |  | 프로필 통계 파생 |
| PUT `/auth/password` | W |  |  |  |  |  | password_hash만 변경 |
| GET `/users/search` | R |  |  |  |  |  | username/full_name 검색 |
| GET `/users/{username}` | R | R |  |  | R |  | 게시물·팔로우 통계 파생 |
| PUT `/users/me` | W |  |  |  |  |  | full_name, bio만 변경 |
| POST `/users/me/avatar` | W |  |  |  |  |  | avatar_url 저장 |
| POST `/users/{username}/follow` | R |  |  |  | R/W |  | UNIQUE 쌍 토글 |
| GET `/posts/feed` | R | R | R | R | R |  | 본인+팔로잉 필터 |
| GET `/posts/explore` | R | R | R | R |  |  | 공개 최신 피드 |
| GET `/posts/user/{username}` | R | R | R | R |  |  | 프로필 그리드 |
| GET `/posts/{post_id}` | R | R | R | R |  |  | 게시물 상세 |
| POST `/posts` | R | W |  |  |  |  | image_url, caption 저장 |
| DELETE `/posts/{post_id}` |  | W | W | W |  |  | CASCADE로 댓글·좋아요 삭제 |
| POST `/posts/{post_id}/like` |  | R |  | R/W |  |  | UNIQUE 쌍 토글 |
| GET `/posts/{post_id}/comments` | R | R | R |  |  |  | 오래된 순 조회 |
| POST `/posts/{post_id}/comments` | R | R | W |  |  |  | 1~1,000자 |
| DELETE `/comments/{comment_id}` |  |  | W |  |  |  | 작성자 소유권 확인 |
| GET `/messages/contacts` | R |  |  |  |  |  | 본인 제외 사용자 |
| GET `/messages/conversations` | R |  |  |  |  | R | 상대별 최신 메시지 파생 |
| GET `/messages/{username}` | R |  |  |  |  | R | 양방향 대화 조회 |
| POST `/messages/{username}` | R |  |  |  |  | W | 1~2,000자, 자기 전송 금지 |
| GET `/notifications` | R | R | R | R | R |  | 별도 알림 테이블 없음 |
| GET `/health` |  |  |  |  |  |  | DB 비의존 상태 확인 |

모든 프론트엔드 저장 필드는 위 6개 테이블에 존재한다. 화면 전용 값인 `posts_count`, `followers_count`, `following_count`, `likes_count`, `comments_count`, `is_following`, `is_liked`, 최근 대화와 활동 알림은 조회 시 계산하며 중복 저장하지 않는다.

### 6.9 프론트엔드 응답 계약

#### UserBrief

```json
{
  "id": 1,
  "username": "alice",
  "full_name": "Alice Kim",
  "avatar_url": "/uploads/avatar.jpg"
}
```

`users` 테이블에서 직접 구성하며 검색 결과, 게시물 작성자, 댓글 작성자, 메시지 참여자, 알림 행위자에 공통 사용한다.

#### UserResponse

```json
{
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "full_name": "Alice Kim",
  "bio": "Hello",
  "avatar_url": "/uploads/avatar.jpg",
  "posts_count": 7,
  "followers_count": 10,
  "following_count": 5,
  "is_following": false,
  "created_at": "2026-07-14T12:00:00"
}
```

#### PostResponse

```json
{
  "id": 1,
  "user": { "id": 1, "username": "alice", "full_name": "Alice Kim", "avatar_url": null },
  "image_url": "/uploads/post.jpg",
  "caption": "Hello",
  "likes_count": 3,
  "comments_count": 2,
  "is_liked": false,
  "created_at": "2026-07-14T12:00:00"
}
```

#### CommentResponse

필수 필드: `id`, `post_id`, `user: UserBrief`, `content`, `created_at`.

#### DirectMessageResponse

필수 필드: `id`, `sender: UserBrief`, `recipient: UserBrief`, `content`, `created_at`.

#### ConversationResponse

필수 필드: `user: UserBrief`, `last_message`, `updated_at`. 별도 conversations 테이블 없이 `messages`에서 상대별 최신 행을 선택한다.

#### NotificationResponse

필수 필드: `id`, `type`, `actor: UserBrief`, `text`, `post_id?`, `post_image_url?`, `created_at`. `type`은 `like`, `comment`, `follow`만 허용한다.

### 6.10 제거할 과도한 엔드포인트

다음 엔드포인트는 현재 프론트엔드에서 호출하지 않고 대응 화면도 없으므로 최종 API 범위에서 제거한다.

| Endpoint | 제거 근거 |
|---|---|
| PUT `/posts/{post_id}` | 캡션 수정 화면이 없음 |
| GET `/users/{username}/followers` | 팔로워 목록 화면이 없음 |
| GET `/users/{username}/following` | 팔로잉 목록 화면이 없음 |

따라서 JSON `PostUpdate` 스키마도 필요하지 않다. 게시물 생성은 multipart이므로 독립적인 JSON `PostCreate` 스키마를 사용하지 않는다. 향후 해당 UI가 추가되기 전까지 위 엔드포인트와 스키마를 다시 도입하지 않는다.

### 6.11 구현 일치 상태

최종 계약과 FastAPI 구현의 일치 여부를 검증했으며 다음 항목이 반영됐다.

- `/users/search`는 로그인 없이 username과 full_name을 검색한다.
- 미사용 `PUT /posts/{post_id}`와 followers/following 목록 엔드포인트를 제거했다.
- 미사용 `PostCreate`, `PostUpdate` Pydantic 스키마를 제거했다.
- `NotificationResponse.type`은 `like | comment | follow`로 제한한다.
- 댓글과 메시지는 공백 제거 후 빈 문자열을 거부한다.
- 업로드 파일은 크기, 확장자와 실제 이미지 포맷을 함께 검증한다.
- 게시물 삭제와 프로필 이미지 교체 시 사용하지 않는 로컬 파일을 정리한다.

### 6.12 공통 조회 형식

- 피드 계열은 `skip >= 0`, `1 <= limit <= 50`을 사용한다.
- 현재 프론트엔드는 페이지 객체가 아닌 JSON 배열을 기대하므로 응답을 `{ items, total }`로 감싸지 않는다.
- `/posts/feed` 기본 limit은 10, `/posts/explore` 화면 limit은 30이다.
- 사용자 검색은 300ms debounce 후 호출되며 최대 20명을 반환한다.
- 메시지 상세는 시간 오름차순으로 최대 500개를 반환하고 프론트엔드가 3초마다 다시 요청한다.
- 알림은 시간 내림차순으로 최대 50개를 반환한다.
- 모든 삭제 성공 응답은 `{ "message": "..." }` 형식을 사용한다.

### 6.13 관리자 API

| Method | Endpoint | 설명 | 인증 | DB 매핑 |
|---|---|---|---|---|
| POST | `/admin/login` | 관리자 로그인 | 공개 | users R |
| GET | `/admin/stats` | 회원·게시물·댓글·좋아요·메시지 통계 | 관리자 | 6개 테이블 R |
| GET | `/admin/users` | 가입 날짜·게시물 수 포함 회원 목록 | 관리자 | users/posts R |
| DELETE | `/admin/users/{user_id}` | 회원 탈퇴 및 관련 데이터·파일 삭제 | 관리자 | users W, CASCADE |
| GET | `/admin/posts` | 작성자·반응 수 포함 게시물 목록 | 관리자 | posts/users/comments/likes R |
| DELETE | `/admin/posts/{post_id}` | 게시물·관련 반응·이미지 삭제 | 관리자 | posts W, CASCADE |

- 관리자 JWT는 `users.is_admin = true`를 추가로 검증한다.
- 일반 사용자의 관리자 API 접근은 `403`이다.
- 관리자 계정은 일반 검색, 프로필과 메시지 연락처에 노출하지 않는다.
- 관리자 계정은 관리자 API로 삭제할 수 없다.

## 7. 데이터베이스 명세

화면 기능에 필요한 테이블은 다음 6개만 사용한다. 모든 PK는 SQLite `INTEGER PRIMARY KEY`, 모든 시간은 UTC `DATETIME`, 모든 FK 삭제 정책은 `ON DELETE CASCADE`다. `created_at`과 `updated_at`은 DB 직접 삽입에서도 동작하도록 `CURRENT_TIMESTAMP` 기본값을 갖는다.

### 7.1 users

| 컬럼 | 타입 | Null | 제약 및 기본값 |
|---|---|---|---|
| id | INTEGER | N | PK |
| username | VARCHAR(50) COLLATE NOCASE | N | UNIQUE, 길이 3~50 |
| email | VARCHAR(100) COLLATE NOCASE | N | UNIQUE, 길이 3~100 |
| password_hash | VARCHAR(255) | N | 길이 1~255 |
| full_name | VARCHAR(100) | Y | 최대 100자 |
| bio | TEXT | Y | 최대 500자 |
| avatar_url | VARCHAR(500) | Y | 최대 500자 |
| is_admin | BOOLEAN | N | DEFAULT false, 관리자 권한 구분 |
| created_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP, ORM 수정 시 갱신 |

username과 email은 대소문자를 구분하지 않고 중복을 차단한다.

### 7.2 posts

| 컬럼 | 타입 | Null | 제약 및 기본값 |
|---|---|---|---|
| id | INTEGER | N | PK |
| user_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| image_url | VARCHAR(500) | N | 길이 1~500 |
| caption | TEXT | Y | 최대 2,200자 |
| created_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP, ORM 수정 시 갱신 |

인덱스: `created_at`, `(user_id, created_at)`.

### 7.3 comments

| 컬럼 | 타입 | Null | 제약 및 기본값 |
|---|---|---|---|
| id | INTEGER | N | PK |
| post_id | INTEGER | N | FK → posts.id ON DELETE CASCADE |
| user_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| content | TEXT | N | 길이 1~1,000 |
| created_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP |

인덱스: `(post_id, created_at)`, `user_id`.

### 7.4 likes

| 컬럼 | 타입 | Null | 제약 및 기본값 |
|---|---|---|---|
| id | INTEGER | N | PK |
| post_id | INTEGER | N | FK → posts.id ON DELETE CASCADE |
| user_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| created_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP |

UNIQUE: `(post_id, user_id)`. 이 UNIQUE 인덱스가 `post_id` 조회도 지원하므로 중복 단일 인덱스를 만들지 않는다. `user_id`에는 별도 인덱스를 둔다.

### 7.5 follows

| 컬럼 | 타입 | Null | 제약 및 기본값 |
|---|---|---|---|
| id | INTEGER | N | PK |
| follower_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| following_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| created_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP |

UNIQUE: `(follower_id, following_id)`. CHECK: `follower_id != following_id`. UNIQUE 인덱스가 `follower_id` 조회를 지원하며 `following_id`에는 별도 인덱스를 둔다.

### 7.6 messages

| 컬럼 | 타입 | Null | 제약 및 기본값 |
|---|---|---|---|
| id | INTEGER | N | PK |
| sender_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| recipient_id | INTEGER | N | FK → users.id ON DELETE CASCADE |
| content | TEXT | N | 길이 1~2,000 |
| created_at | DATETIME | N | DEFAULT CURRENT_TIMESTAMP |

CHECK: `sender_id != recipient_id`. 인덱스: `(sender_id, recipient_id, created_at)`, `(recipient_id, sender_id, created_at)`. 두 복합 인덱스가 각각 발신자·수신자 선두 조회를 지원하므로 중복 단일 인덱스를 만들지 않는다.

### 7.7 저장하지 않는 파생 데이터

다음 값은 별도 컬럼이나 테이블 없이 조회 시 계산한다.

- 게시물/팔로워/팔로잉/좋아요/댓글 수
- 현재 사용자의 좋아요 및 팔로우 여부
- 상대별 최근 메시지
- 좋아요·댓글·팔로우 활동 알림

## 8. SQLite 공통 운영 정책

개발과 프로덕션 모두 `backend/instagram.db`를 사용한다.

### 8.1 연결 설정

앱 시작 시 모든 연결에 다음 PRAGMA를 적용한다.

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;
```

- SQLAlchemy 연결 옵션: `check_same_thread=False`
- 쓰기 충돌을 줄이기 위해 프로덕션 Uvicorn은 단일 worker로 실행한다.
- 여러 서버 인스턴스가 하나의 SQLite 파일을 네트워크 파일시스템으로 공유하지 않는다.

### 8.2 스키마 변경

- 초기 개발은 `Base.metadata.create_all()`을 사용한다.
- 프로덕션 데이터가 생성된 이후에는 Alembic 또는 버전별 SQL 마이그레이션을 사용한다.
- `create_all()`은 기존 컬럼 변경이나 삭제를 수행하지 않는다는 점을 전제로 한다.
- 현재 프로젝트의 데이터 보존형 스키마 재구축은 `backend/scripts/rebuild_database.py`를 사용한다. 실행 전 온라인 백업을 만들고 데이터 복사 후 `foreign_key_check`와 `integrity_check`를 통과해야 원본을 교체한다.

### 8.3 백업

- DB와 uploads를 같은 백업 단위로 관리한다.
- SQLite 온라인 백업 명령을 사용한다.

```bash
sqlite3 backend/instagram.db ".backup 'backups/instagram-$(date +%F).db'"
```

- WAL 사용 중 DB 파일만 단순 복사하지 않는다.
- 최소 일 1회 백업하고 복구 테스트를 정기적으로 수행한다.

## 9. 파일 저장 정책

- 업로드 파일 위치: `backend/uploads/`
- DB 저장 값: `/uploads/{uuid}.{ext}` 형식의 상대 URL
- 허용 형식: jpg, jpeg, png, webp
- 최대 크기: 5MB
- 파일명은 UUID로 치환해 경로 조작과 충돌을 방지한다.
- 프로덕션 배포 시 `instagram.db`와 `uploads/`를 영구 볼륨에 함께 저장한다.

## 10. 오류 응답

| Status | 상황 |
|---|---|
| 400 | 중복 계정, 현재 비밀번호 불일치, 자기 팔로우/메시지 등 |
| 401 | 토큰 누락, 만료 또는 변조 |
| 403 | 타인의 게시물·댓글 삭제 시도 |
| 404 | 사용자, 게시물, 댓글 없음 |
| 413 | 업로드 크기 초과 |
| 422 | Pydantic 입력 검증 실패 |

오류 형식은 FastAPI 기본 형식인 `{ "detail": "..." }`을 사용한다.

## 11. 보안 요구사항

- 비밀번호 원문 저장 금지, bcrypt 해시만 저장
- 프로덕션 `SECRET_KEY`는 환경 변수로 주입
- CORS origin은 실제 프론트엔드 도메인만 허용
- ORM 바인딩을 사용하고 문자열 SQL 조합 금지
- 업로드 확장자와 실제 MIME 유형을 모두 검증
- 메시지와 게시물 삭제 시 소유권 검증
- 로그인 엔드포인트에 IP/계정 단위 rate limit 적용 권장

## 12. 환경 변수

```env
APP_ENV=development
SECRET_KEY=replace-with-a-long-random-secret
DATABASE_URL=sqlite:///./instagram.db
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173
```

프로덕션에서도 `DATABASE_URL`은 SQLite를 유지하되 DB와 uploads 경로를 영구 볼륨에 둔다.

## 13. 실행 및 검증

프로젝트 루트에서 다음 한 명령으로 패키지 설치, 백엔드·프론트엔드 실행 및 브라우저 열기를 수행한다.

```bash
./start.sh
```

필수 검증 항목:

1. 비회원 피드·탐색·검색·프로필·게시물 조회
2. 회원가입, 로그인, 앱 재접속 시 사용자 복원
3. 게시물 작성·삭제, 좋아요 토글, 댓글 작성·삭제
4. 팔로우 토글과 피드 반영
5. 두 계정 사이 메시지 송수신
6. 좋아요·댓글·팔로우 알림 노출
7. 프로필 사진·소개·비밀번호 변경
8. 앱 재시작 후 SQLite 데이터와 이미지 유지

## 14. 명시적 제외 범위

현재 디자인에 화면 또는 사용자 흐름이 없으므로 다음 기능은 구현하지 않는다.

- 릴스, 스토리 업로드/재생, 라이브 방송
- 저장된 게시물, 태그된 게시물
- 그룹 채팅, 첨부 메시지, 읽음 상태, 메시지 삭제
- 알림 읽음 상태, 웹 푸시, 이메일 알림
- 비밀번호 찾기, 계정 비활성화/삭제
- 차단, 신고, 공개 범위
- 게시물 캡션 수정
- 팔로워·팔로잉 목록 전용 화면/API
- 다중 서버용 분산 캐시, 작업 큐, 외부 오브젝트 스토리지
