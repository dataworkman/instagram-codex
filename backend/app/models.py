from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, false, func
from sqlalchemy.orm import relationship

from .database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("length(username) BETWEEN 3 AND 50", name="ck_users_username_length"),
        CheckConstraint("length(email) BETWEEN 3 AND 100", name="ck_users_email_length"),
        CheckConstraint("full_name IS NULL OR length(full_name) <= 100", name="ck_users_full_name_length"),
        CheckConstraint("bio IS NULL OR length(bio) <= 500", name="ck_users_bio_length"),
        CheckConstraint("length(password_hash) BETWEEN 1 AND 255", name="ck_users_password_hash_length"),
        CheckConstraint("avatar_url IS NULL OR length(avatar_url) <= 500", name="ck_users_avatar_url_length"),
    )

    id = Column(Integer, primary_key=True)
    username = Column(String(50, collation="NOCASE"), unique=True, nullable=False, index=True)
    email = Column(String(100, collation="NOCASE"), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(500))
    is_admin = Column(Boolean, default=False, server_default=false(), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), nullable=False)
    updated_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), onupdate=utcnow, nullable=False)

    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following", cascade="all, delete-orphan", passive_deletes=True)
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower", cascade="all, delete-orphan", passive_deletes=True)


class Post(Base):
    __tablename__ = "posts"
    __table_args__ = (
        CheckConstraint("caption IS NULL OR length(caption) <= 2200", name="ck_posts_caption_length"),
        CheckConstraint("length(image_url) BETWEEN 1 AND 500", name="ck_posts_image_url_length"),
        Index("ix_posts_user_created", "user_id", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    caption = Column(Text)
    created_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), nullable=False, index=True)
    updated_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), onupdate=utcnow, nullable=False)

    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan", passive_deletes=True)
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan", passive_deletes=True)


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        CheckConstraint("length(content) BETWEEN 1 AND 1000", name="ck_comments_content_length"),
        Index("ix_comments_post_created", "post_id", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), nullable=False)

    post = relationship("Post", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Like(Base):
    __tablename__ = "likes"
    __table_args__ = (UniqueConstraint("post_id", "user_id", name="uq_post_user_like"),)

    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), nullable=False)

    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")


class Follow(Base):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_follower_following"),
        CheckConstraint("follower_id != following_id", name="ck_no_self_follow"),
    )

    id = Column(Integer, primary_key=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), nullable=False)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers")


class DirectMessage(Base):
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint("sender_id != recipient_id", name="ck_messages_no_self"),
        CheckConstraint("length(content) BETWEEN 1 AND 2000", name="ck_messages_content_length"),
        Index("ix_messages_sender_recipient_created", "sender_id", "recipient_id", "created_at"),
        Index("ix_messages_recipient_sender_created", "recipient_id", "sender_id", "created_at"),
    )

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow, server_default=func.current_timestamp(), nullable=False)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
