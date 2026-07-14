from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    full_name: Optional[str] = Field(default=None, max_length=100)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        value = value.strip().lower()
        if not value.replace(".", "").replace("_", "").isalnum():
            raise ValueError("Username may contain only letters, numbers, periods and underscores")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_size(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = Field(default=None, max_length=500)

    @field_validator("full_name", "bio")
    @classmethod
    def trim_profile_fields(cls, value: Optional[str]) -> Optional[str]:
        return value.strip() if value is not None else None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=6, max_length=100)
    new_password: str = Field(min_length=6, max_length=100)

    @field_validator("current_password", "new_password")
    @classmethod
    def validate_password_size(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value


class UserBrief(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    posts_count: int = 0
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PostResponse(BaseModel):
    id: int
    user: UserBrief
    image_url: str
    caption: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Comment cannot be empty")
        return value


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user: UserBrief
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LikeResponse(BaseModel):
    is_liked: bool
    likes_count: int


class FollowResponse(BaseModel):
    is_following: bool
    followers_count: int


class MessageResponse(BaseModel):
    message: str


class DirectMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class DirectMessageResponse(BaseModel):
    id: int
    sender: UserBrief
    recipient: UserBrief
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    user: UserBrief
    last_message: str
    updated_at: datetime


class NotificationResponse(BaseModel):
    id: str
    type: Literal["like", "comment", "follow"]
    actor: UserBrief
    text: str
    post_id: Optional[int] = None
    post_image_url: Optional[str] = None
    created_at: datetime


class AdminLogin(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=100)


class AdminStats(BaseModel):
    users_count: int
    posts_count: int
    comments_count: int
    likes_count: int
    messages_count: int


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    posts_count: int


class AdminPostResponse(BaseModel):
    id: int
    user: UserBrief
    image_url: str
    caption: Optional[str] = None
    likes_count: int
    comments_count: int
    created_at: datetime
