from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from typing import Literal
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import delete_upload_file, get_current_user, get_current_user_optional, save_upload_file
from ..database import get_db
from ..models import Follow, User
from ..schemas import FollowResponse, UserBrief, UserResponse, UserUpdate
from ..utils import build_user_brief, build_user_response

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/search", response_model=list[UserBrief])
def search_users(
    q: str = Query(min_length=1, max_length=50),
    sort_by: Literal["latest", "username"] = Query(default="latest"),
    db: Session = Depends(get_db),
):
    query = q.strip()
    if not query:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Search query cannot be empty")
    users_query = (
        db.query(User)
        .filter(User.is_admin.is_(False))
        .filter(or_(User.username.ilike(f"%{query}%"), User.full_name.ilike(f"%{query}%")))
    )
    if sort_by == "username":
        users_query = users_query.order_by(User.username.asc(), User.id.asc())
    else:
        users_query = users_query.order_by(User.created_at.desc(), User.id.desc())
    users = users_query.limit(20).all()
    return [build_user_brief(u) for u in users]


@router.get("/suggestions", response_model=list[UserBrief])
def get_user_suggestions(
    limit: int = Query(default=20, ge=1, le=50),
    sort_by: Literal["latest", "username"] = Query(default="latest"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    query = db.query(User).filter(User.is_admin.is_(False))
    if current_user:
        followed_ids = db.query(Follow.following_id).filter(Follow.follower_id == current_user.id)
        query = query.filter(User.id != current_user.id, ~User.id.in_(followed_ids))
    if sort_by == "username":
        query = query.order_by(User.username.asc(), User.id.asc())
    else:
        query = query.order_by(User.created_at.desc(), User.id.desc())
    users = query.limit(limit).all()
    return [build_user_brief(user) for user in users]


@router.get("/{username}", response_model=UserResponse)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    user = db.query(User).filter(User.username == username, User.is_admin.is_(False)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return build_user_response(user, db, current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user, db, current_user)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    old_avatar = current_user.avatar_url
    new_avatar = save_upload_file(content, file.filename or "avatar.jpg")
    current_user.avatar_url = new_avatar
    try:
        db.commit()
    except Exception:
        db.rollback()
        delete_upload_file(new_avatar)
        raise
    if old_avatar != new_avatar:
        delete_upload_file(old_avatar)
    db.refresh(current_user)
    return build_user_response(current_user, db, current_user)


@router.post("/{username}/follow", response_model=FollowResponse)
def toggle_follow(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = db.query(User).filter(User.username == username).first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself",
        )

    existing = (
        db.query(Follow)
        .filter(
            Follow.follower_id == current_user.id,
            Follow.following_id == target.id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        is_following = False
    else:
        db.add(Follow(follower_id=current_user.id, following_id=target.id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Follow state changed; please retry")
        is_following = True

    followers_count = db.query(Follow).filter(Follow.following_id == target.id).count()
    return FollowResponse(is_following=is_following, followers_count=followers_count)
