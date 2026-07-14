from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from ..auth import authenticate_user, create_access_token, delete_upload_file, get_current_user
from ..database import get_db
from ..models import Comment, DirectMessage, Like, Post, User
from ..schemas import AdminLogin, AdminPostResponse, AdminStats, AdminUserResponse, MessageResponse, TokenResponse
from ..utils import build_user_brief, build_user_response

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required")
    return current_user


@router.post("/login", response_model=TokenResponse)
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.username, data.password)
    if not user or not user.is_admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator credentials")
    return TokenResponse(access_token=create_access_token({"sub": user.username}), user=build_user_response(user, db, user))


@router.get("/stats", response_model=AdminStats)
def get_stats(db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    return AdminStats(
        users_count=db.query(User).filter(User.is_admin.is_(False)).count(),
        posts_count=db.query(Post).count(),
        comments_count=db.query(Comment).count(),
        likes_count=db.query(Like).count(),
        messages_count=db.query(DirectMessage).count(),
    )


@router.get("/users", response_model=list[AdminUserResponse])
def get_users(
    q: Optional[str] = Query(default=None, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    query = db.query(User).filter(User.is_admin.is_(False))
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(User.username.ilike(pattern), User.email.ilike(pattern), User.full_name.ilike(pattern)))
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [AdminUserResponse(
        id=user.id, username=user.username, email=user.email, full_name=user.full_name,
        avatar_url=user.avatar_url, created_at=user.created_at,
        posts_count=db.query(Post).filter(Post.user_id == user.id).count(),
    ) for user in users]


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(user_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    user = db.query(User).options(joinedload(User.posts)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_admin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Administrator accounts cannot be deleted")
    files = [user.avatar_url, *(post.image_url for post in user.posts)]
    db.delete(user)
    db.commit()
    for file_url in files:
        delete_upload_file(file_url)
    return MessageResponse(message="User deleted successfully")


@router.get("/posts", response_model=list[AdminPostResponse])
def get_posts(
    q: Optional[str] = Query(default=None, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    query = db.query(Post).options(joinedload(Post.user))
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.join(Post.user).filter(or_(User.username.ilike(pattern), Post.caption.ilike(pattern)))
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return [AdminPostResponse(
        id=post.id, user=build_user_brief(post.user), image_url=post.image_url,
        caption=post.caption, likes_count=db.query(Like).filter(Like.post_id == post.id).count(),
        comments_count=db.query(Comment).filter(Comment.post_id == post.id).count(), created_at=post.created_at,
    ) for post in posts]


@router.delete("/posts/{post_id}", response_model=MessageResponse)
def delete_post(post_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    image_url = post.image_url
    db.delete(post)
    db.commit()
    delete_upload_file(image_url)
    return MessageResponse(message="Post deleted successfully")
