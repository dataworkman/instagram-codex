import io

from PIL import Image
from sqlalchemy.orm import Session

from .auth import get_password_hash
from .database import SessionLocal
from .models import Comment, Follow, Like, Post, User


def create_placeholder_image(color: tuple, filename: str) -> bytes:
    img = Image.new("RGB", (600, 600), color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def seed_database():
    db: Session = SessionLocal()
    try:
        if db.query(User).first():
            return

        from .auth import UPLOAD_DIR, save_upload_file

        users_data = [
            {"username": "alice", "email": "alice@example.com", "full_name": "Alice Kim", "bio": "Photography lover 📸", "color": (255, 183, 177)},
            {"username": "bob", "email": "bob@example.com", "full_name": "Bob Lee", "bio": "Travel enthusiast ✈️", "color": (174, 214, 241)},
            {"username": "charlie", "email": "charlie@example.com", "full_name": "Charlie Park", "bio": "Food blogger 🍕", "color": (187, 222, 251)},
        ]

        users = []
        for data in users_data:
            avatar_bytes = create_placeholder_image(data["color"], f"{data['username']}.jpg")
            avatar_url = save_upload_file(avatar_bytes, f"{data['username']}.jpg")
            user = User(
                username=data["username"],
                email=data["email"],
                password_hash=get_password_hash("password123"),
                full_name=data["full_name"],
                bio=data["bio"],
                avatar_url=avatar_url,
            )
            db.add(user)
            users.append(user)

        db.commit()
        for user in users:
            db.refresh(user)

        # Follow relationships: alice->bob, bob->charlie, charlie->alice, alice->charlie
        follows = [
            (users[0].id, users[1].id),
            (users[1].id, users[2].id),
            (users[2].id, users[0].id),
            (users[0].id, users[2].id),
        ]
        for follower_id, following_id in follows:
            db.add(Follow(follower_id=follower_id, following_id=following_id))

        post_colors = [
            ((255, 205, 210), "Beautiful sunset today! 🌅"),
            ((200, 230, 201), "Coffee and coding ☕💻"),
            ((255, 224, 178), "Weekend vibes 🎉"),
            ((225, 190, 231), "New adventure begins ✨"),
            ((179, 229, 252), "City lights at night 🌃"),
            ((255, 245, 157), "Homemade pasta 🍝"),
        ]

        posts = []
        for i, (color, caption) in enumerate(post_colors):
            user = users[i % len(users)]
            img_bytes = create_placeholder_image(color, f"post{i}.jpg")
            image_url = save_upload_file(img_bytes, f"post{i}.jpg")
            post = Post(user_id=user.id, image_url=image_url, caption=caption)
            db.add(post)
            posts.append(post)

        db.commit()
        for post in posts:
            db.refresh(post)

        comments_data = [
            (0, users[1].id, "Amazing shot! 😍"),
            (0, users[2].id, "Where is this?"),
            (1, users[0].id, "Same setup here!"),
            (2, users[2].id, "Looks fun!"),
            (3, users[0].id, "Have a great trip!"),
        ]
        for post_idx, user_id, content in comments_data:
            db.add(Comment(post_id=posts[post_idx].id, user_id=user_id, content=content))

        likes_data = [
            (0, users[0].id), (0, users[1].id), (0, users[2].id),
            (1, users[1].id), (1, users[2].id),
            (2, users[0].id), (2, users[2].id),
            (3, users[0].id), (3, users[1].id), (3, users[2].id),
            (4, users[1].id),
            (5, users[0].id), (5, users[2].id),
        ]
        for post_idx, user_id in likes_data:
            db.add(Like(post_id=posts[post_idx].id, user_id=user_id))

        db.commit()
    finally:
        db.close()


def ensure_admin_user():
    db: Session = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if admin is None:
            admin = User(
                username="admin",
                email="admin@instagram.local",
                password_hash=get_password_hash("pass123"),
                full_name="Administrator",
                is_admin=True,
            )
            db.add(admin)
        else:
            admin.is_admin = True
            admin.password_hash = get_password_hash("pass123")
        db.commit()
    finally:
        db.close()
