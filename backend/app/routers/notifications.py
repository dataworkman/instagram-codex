from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import Comment, Follow, Like, Post, User
from ..schemas import NotificationResponse
from ..utils import build_user_brief

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    limit: int = Query(50, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post_ids = [row[0] for row in db.query(Post.id).filter(Post.user_id == current_user.id).all()]
    items: list[NotificationResponse] = []

    if post_ids:
        likes = (
            db.query(Like)
            .options(joinedload(Like.user), joinedload(Like.post))
            .filter(Like.post_id.in_(post_ids), Like.user_id != current_user.id)
            .order_by(Like.created_at.desc()).limit(limit).all()
        )
        for like in likes:
            items.append(NotificationResponse(id=f"like-{like.id}", type="like", actor=build_user_brief(like.user), text="회원님의 게시물을 좋아합니다.", post_id=like.post_id, post_image_url=like.post.image_url, created_at=like.created_at))

        comments = (
            db.query(Comment)
            .options(joinedload(Comment.user), joinedload(Comment.post))
            .filter(Comment.post_id.in_(post_ids), Comment.user_id != current_user.id)
            .order_by(Comment.created_at.desc()).limit(limit).all()
        )
        for comment in comments:
            preview = comment.content if len(comment.content) <= 45 else comment.content[:45] + "…"
            items.append(NotificationResponse(id=f"comment-{comment.id}", type="comment", actor=build_user_brief(comment.user), text=f'댓글을 남겼습니다: "{preview}"', post_id=comment.post_id, post_image_url=comment.post.image_url, created_at=comment.created_at))

    follows = (
        db.query(Follow)
        .options(joinedload(Follow.follower))
        .filter(Follow.following_id == current_user.id)
        .order_by(Follow.created_at.desc()).limit(limit).all()
    )
    for follow in follows:
        items.append(NotificationResponse(id=f"follow-{follow.id}", type="follow", actor=build_user_brief(follow.follower), text="회원님을 팔로우하기 시작했습니다.", created_at=follow.created_at))

    items.sort(key=lambda item: item.created_at, reverse=True)
    return items[:limit]
