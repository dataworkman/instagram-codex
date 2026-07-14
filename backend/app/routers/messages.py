from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from ..auth import get_current_user
from ..database import get_db
from ..models import DirectMessage, User
from ..schemas import ConversationResponse, DirectMessageCreate, DirectMessageResponse, UserBrief
from ..utils import build_user_brief

router = APIRouter(prefix="/api/messages", tags=["messages"])


def serialize(message: DirectMessage) -> DirectMessageResponse:
    return DirectMessageResponse(
        id=message.id,
        sender=build_user_brief(message.sender),
        recipient=build_user_brief(message.recipient),
        content=message.content,
        created_at=message.created_at,
    )


@router.get("/contacts", response_model=list[UserBrief])
def get_contacts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).filter(User.id != current_user.id, User.is_admin.is_(False)).order_by(User.username).all()
    return [build_user_brief(user) for user in users]


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = (
        db.query(DirectMessage)
        .options(joinedload(DirectMessage.sender), joinedload(DirectMessage.recipient))
        .filter(or_(DirectMessage.sender_id == current_user.id, DirectMessage.recipient_id == current_user.id))
        .order_by(DirectMessage.created_at.desc())
        .all()
    )
    conversations = []
    seen = set()
    for message in messages:
        other = message.recipient if message.sender_id == current_user.id else message.sender
        if other.id in seen:
            continue
        seen.add(other.id)
        conversations.append(ConversationResponse(user=build_user_brief(other), last_message=message.content, updated_at=message.created_at))
    return conversations


@router.get("/{username}", response_model=list[DirectMessageResponse])
def get_messages(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    other = db.query(User).filter(User.username == username).first()
    if not other:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    messages = (
        db.query(DirectMessage)
        .options(joinedload(DirectMessage.sender), joinedload(DirectMessage.recipient))
        .filter(or_(
            and_(DirectMessage.sender_id == current_user.id, DirectMessage.recipient_id == other.id),
            and_(DirectMessage.sender_id == other.id, DirectMessage.recipient_id == current_user.id),
        ))
        .order_by(DirectMessage.created_at.desc())
        .limit(500)
        .all()
    )
    messages.reverse()
    return [serialize(message) for message in messages]


@router.post("/{username}", response_model=DirectMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(username: str, data: DirectMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipient = db.query(User).filter(User.username == username).first()
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot message yourself")
    message = DirectMessage(sender_id=current_user.id, recipient_id=recipient.id, content=data.content)
    db.add(message)
    db.commit()
    db.refresh(message)
    message.sender = current_user
    message.recipient = recipient
    return serialize(message)
