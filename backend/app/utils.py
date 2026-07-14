from sqlalchemy.orm import Session

from .models import Follow, Like, Post, User
from .schemas import CommentResponse, PostResponse, UserBrief, UserResponse


def build_user_brief(user: User) -> UserBrief:
    return UserBrief(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
    )


def build_user_response(
    user: User, db: Session, current_user: User | None = None
) -> UserResponse:
    posts_count = db.query(Post).filter(Post.user_id == user.id).count()
    followers_count = db.query(Follow).filter(Follow.following_id == user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()
    is_following = False
    if current_user and current_user.id != user.id:
        is_following = (
            db.query(Follow)
            .filter(
                Follow.follower_id == current_user.id,
                Follow.following_id == user.id,
            )
            .first()
            is not None
        )
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        bio=user.bio,
        avatar_url=user.avatar_url,
        posts_count=posts_count,
        followers_count=followers_count,
        following_count=following_count,
        is_following=is_following,
        created_at=user.created_at,
    )


def build_post_response(
    post: Post, db: Session, current_user: User | None = None
) -> PostResponse:
    likes_count = db.query(Like).filter(Like.post_id == post.id).count()
    comments_count = len(post.comments)
    is_liked = False
    if current_user:
        is_liked = (
            db.query(Like)
            .filter(Like.post_id == post.id, Like.user_id == current_user.id)
            .first()
            is not None
        )
    return PostResponse(
        id=post.id,
        user=build_user_brief(post.user),
        image_url=post.image_url,
        caption=post.caption,
        likes_count=likes_count,
        comments_count=comments_count,
        is_liked=is_liked,
        created_at=post.created_at,
    )


def build_comment_response(comment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user=build_user_brief(comment.user),
        content=comment.content,
        created_at=comment.created_at,
    )
