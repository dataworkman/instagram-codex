from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from ..auth import delete_upload_file, get_current_user, get_current_user_optional, save_upload_file
from ..database import get_db
from ..models import Follow, Post, User
from ..schemas import MessageResponse, PostResponse
from ..utils import build_post_response

router = APIRouter(prefix="/api/posts", tags=["posts"])


@router.get("/feed", response_model=list[PostResponse])
def get_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    following_ids = [
        f.following_id
        for f in db.query(Follow).filter(Follow.follower_id == current_user.id).all()
    ]
    user_ids = following_ids + [current_user.id]

    posts = (
        db.query(Post)
        .options(joinedload(Post.user))
        .filter(Post.user_id.in_(user_ids))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [build_post_response(p, db, current_user) for p in posts]


@router.get("/explore", response_model=list[PostResponse])
def get_explore(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    posts = (
        db.query(Post)
        .options(joinedload(Post.user))
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [build_post_response(p, db, current_user) for p in posts]


@router.get("/user/{username}", response_model=list[PostResponse])
def get_user_posts(
    username: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    posts = (
        db.query(Post)
        .options(joinedload(Post.user))
        .filter(Post.user_id == user.id)
        .order_by(Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [build_post_response(p, db, current_user) for p in posts]


@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    post = (
        db.query(Post)
        .options(joinedload(Post.user))
        .filter(Post.id == post_id)
        .first()
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return build_post_response(post, db, current_user)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    caption: str = Form(default="", max_length=2200),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await image.read()
    image_url = save_upload_file(content, image.filename or "post.jpg")

    post = Post(user_id=current_user.id, image_url=image_url, caption=caption.strip() or None)
    db.add(post)
    try:
        db.commit()
    except Exception:
        db.rollback()
        delete_upload_file(image_url)
        raise
    db.refresh(post)
    post.user = current_user
    return build_post_response(post, db, current_user)


@router.delete("/{post_id}", response_model=MessageResponse)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    image_url = post.image_url
    db.delete(post)
    db.commit()
    delete_upload_file(image_url)
    return MessageResponse(message="Post deleted successfully")
