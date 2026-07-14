# 프론트엔드 명세서 (front.md)

## 1. 개요

| 항목 | 내용 |
|------|------|
| 프레임워크 | React 18 + Vite |
| 언어 | TypeScript |
| 라우팅 | React Router v6 |
| HTTP 클라이언트 | Axios |
| 스타일 | CSS Modules + CSS Variables |
| 상태 관리 | React Context (AuthContext) |

## 2. 프로젝트 구조

```
frontend/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css              # 글로벌 스타일, CSS 변수
│   ├── api/
│   │   └── client.ts          # Axios 인스턴스, 인터셉터
│   ├── context/
│   │   └── AuthContext.tsx    # 인증 상태 관리
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Layout.tsx
│   │   ├── Post/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostGrid.tsx
│   │   │   └── CreatePostModal.tsx
│   │   ├── User/
│   │   │   ├── UserAvatar.tsx
│   │   │   └── FollowButton.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Modal.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Feed.tsx
│   │   ├── Explore.tsx
│   │   ├── Profile.tsx
│   │   ├── PostDetail.tsx
│   │   └── Search.tsx
│   └── types/
│       └── index.ts           # TypeScript 타입 정의
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 3. 페이지 명세

### 3.1 로그인 (`/login`)

- username + password 폼
- 로그인 성공 → `/` (피드) 리다이렉트
- "계정 만들기" → `/register` 링크
- Instagram 스타일 2단 레이아웃 (모바일: 단일 컬럼)

### 3.2 회원가입 (`/register`)

- username, email, password, full_name 입력
- 가입 성공 → 자동 로그인 후 `/` 이동

### 3.3 피드 (`/`)

- 팔로우한 사용자 + 본인 게시물 타임라인
- 무한 스크롤 또는 "더 보기" 버튼
- 각 PostCard: 아바타, username, 이미지, 좋아요, 댓글 수, 캡션
- 로그인 필요 (PrivateRoute)

### 3.4 탐색 (`/explore`)

- 전체 공개 게시물 그리드 (3열)
- 클릭 → PostDetail 모달 또는 페이지

### 3.5 프로필 (`/:username`)

- 프로필 헤더: 아바타, username, full_name, bio
- 통계: 게시물 / 팔로워 / 팔로잉
- FollowButton (본인 프로필 제외)
- 본인 프로필: "프로필 수정", "로그아웃" 버튼
- 게시물 그리드 (PostGrid)

### 3.6 게시물 상세 (`/p/:postId`)

- 큰 이미지 + 댓글 목록 + 댓글 입력
- 좋아요 토글
- 작성자만 삭제 가능

### 3.7 검색 (`/search`)

- Navbar 검색창 또는 전용 페이지
- username 실시간 검색 (debounce 300ms)
- 결과: 아바타 + username + full_name

## 4. 컴포넌트 명세

### Navbar
- 로고 (홈 링크)
- 검색 입력
- 홈 / 탐색 / 게시물 작성(+) / 프로필 아이콘
- 모바일: 하단 고정 네비게이션

### PostCard
- Props: `post: Post`
- 좋아요 하트 (filled/outline)
- 댓글 아이콘 → PostDetail
- 캡션: `username caption...`
- 상대 시간 표시 (예: "2시간 전")

### CreatePostModal
- 이미지 파일 선택 + 미리보기
- 캡션 textarea
- "공유" 버튼 → POST `/api/posts`

### FollowButton
- Props: `username`, `isFollowing`, `onToggle`
- 팔로우 / 팔로잉 상태 토글

## 5. 인증 흐름

```
1. 로그인 → access_token을 localStorage에 저장
2. Axios 인터셉터가 모든 요청에 Authorization: Bearer {token} 추가
3. 401 응답 → 토큰 삭제, /login 리다이렉트
4. AuthContext가 앱 로드 시 /api/auth/me로 사용자 복원
```

## 6. UI/UX 가이드

### 디자인 토큰 (CSS Variables)
```css
--color-primary: #0095f6;
--color-danger: #ed4956;
--color-bg: #fafafa;
--color-border: #dbdbdb;
--color-text: #262626;
--color-text-secondary: #8e8e8e;
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--max-width: 935px;
--navbar-height: 60px;
```

### 반응형 브레이크포인트
- Mobile: < 768px (단일 컬럼, 하단 네비)
- Desktop: ≥ 768px (상단 네비, 2단 레이아웃)

### Instagram 유사 UX
- 더블탭(또는 더블클릭)으로 좋아요
- 좋아요 애니메이션 (하트 scale)
- 이미지 lazy loading
- 스켈레톤 로딩 상태

## 7. API 연동

Base URL: `http://localhost:8000/api`  
이미지 URL: `http://localhost:8000` + `image_url` 경로

Vite proxy 설정 (`vite.config.ts`):
```ts
proxy: {
  '/api': 'http://localhost:8000',
  '/uploads': 'http://localhost:8000',
}
```

## 8. 실행 방법

```bash
cd frontend
npm install
npm run dev
```

- 개발 서버: http://localhost:5173

## 9. 데모 계정

| username | password |
|----------|----------|
| alice | password123 |
| bob | password123 |
| charlie | password123 |
