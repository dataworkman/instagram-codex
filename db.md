# 데이터베이스 설계 명세서 (db.md)

## 1. 개요

Instagram 클론 애플리케이션의 데이터 저장소로 **SQLite**를 사용한다.  
ORM은 **SQLAlchemy**를 사용하며, 개발 환경에서는 `backend/instagram.db` 파일에 저장된다.

## 2. ERD 개요

```
users ──┬──< posts
        ├──< comments
        ├──< likes
        ├──< follows (follower_id)
        └──< follows (following_id)

posts ──┬──< comments
        └──< likes
```

## 3. 테이블 정의

### 3.1 users (사용자)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 사용자 고유 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 로그인 ID (3~50자) |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 이메일 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해시 비밀번호 |
| full_name | VARCHAR(100) | NULL | 표시 이름 |
| bio | TEXT | NULL | 자기소개 (최대 500자) |
| avatar_url | VARCHAR(500) | NULL | 프로필 이미지 URL |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | 가입일 |
| updated_at | DATETIME | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스:** `username`, `email`

### 3.2 posts (게시물)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 게시물 ID |
| user_id | INTEGER | FK → users.id, NOT NULL | 작성자 |
| image_url | VARCHAR(500) | NOT NULL | 게시물 이미지 URL |
| caption | TEXT | NULL | 캡션 (최대 2200자) |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | 작성일 |
| updated_at | DATETIME | NOT NULL, DEFAULT NOW | 수정일 |

**인덱스:** `user_id`, `created_at DESC`

### 3.3 comments (댓글)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 댓글 ID |
| post_id | INTEGER | FK → posts.id, NOT NULL | 대상 게시물 |
| user_id | INTEGER | FK → users.id, NOT NULL | 작성자 |
| content | TEXT | NOT NULL | 댓글 내용 (최대 1000자) |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | 작성일 |

**인덱스:** `post_id`, `user_id`

**CASCADE:** post 삭제 시 관련 comment 자동 삭제

### 3.4 likes (좋아요)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 좋아요 ID |
| post_id | INTEGER | FK → posts.id, NOT NULL | 대상 게시물 |
| user_id | INTEGER | FK → users.id, NOT NULL | 좋아요 누른 사용자 |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | 좋아요 일시 |

**UNIQUE:** `(post_id, user_id)` — 중복 좋아요 방지

**CASCADE:** post 삭제 시 관련 like 자동 삭제

### 3.5 follows (팔로우)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK, AUTO_INCREMENT | 팔로우 ID |
| follower_id | INTEGER | FK → users.id, NOT NULL | 팔로우하는 사용자 |
| following_id | INTEGER | FK → users.id, NOT NULL | 팔로우 대상 |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | 팔로우 일시 |

**UNIQUE:** `(follower_id, following_id)` — 중복 팔로우 방지  
**CHECK:** `follower_id != following_id` — 자기 자신 팔로우 불가

## 4. 관계 요약

| 관계 | 카디널리티 | 설명 |
|------|-----------|------|
| User → Post | 1:N | 한 사용자는 여러 게시물 작성 |
| User → Comment | 1:N | 한 사용자는 여러 댓글 작성 |
| User → Like | 1:N | 한 사용자는 여러 게시물에 좋아요 |
| Post → Comment | 1:N | 한 게시물에 여러 댓글 |
| Post → Like | 1:N | 한 게시물에 여러 좋아요 |
| User ↔ User (Follow) | N:M | 팔로우 관계 (follows 테이블로 중간 연결) |

## 5. 집계 쿼리 (애플리케이션 레벨)

다음 값은 별도 컬럼 없이 JOIN/COUNT로 계산한다.

- **posts_count**: `COUNT(posts) WHERE user_id = ?`
- **followers_count**: `COUNT(follows) WHERE following_id = ?`
- **following_count**: `COUNT(follows) WHERE follower_id = ?`
- **likes_count**: `COUNT(likes) WHERE post_id = ?`
- **comments_count**: `COUNT(comments) WHERE post_id = ?`
- **is_liked**: 현재 사용자의 like 존재 여부
- **is_following**: 현재 사용자의 follow 존재 여부

## 6. 시드 데이터

앱 최초 실행 시 `seed.py`로 데모 데이터를 생성한다.

- 데모 사용자 3명 (password: `password123`)
- 샘플 게시물, 댓글, 좋아요, 팔로우 관계

## 7. 마이그레이션 전략

개발 단계에서는 SQLAlchemy `Base.metadata.create_all()`로 테이블을 생성한다.  
프로덕션 확장 시 Alembic 마이그레이션 도입을 권장한다.

## 8. 파일 저장

이미지는 `backend/uploads/` 디렉터리에 저장하고, DB에는 상대 URL(`/uploads/{filename}`)만 기록한다.
