import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .auth import UPLOAD_DIR
from .database import Base, engine
from .routers import admin, auth, comments, likes, messages, notifications, posts, users
from .seed import ensure_admin_user, seed_database


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if os.getenv("SEED_DEMO_DATA", "true").lower() in {"1", "true", "yes"}:
        seed_database()
    ensure_admin_user()
    yield


app = FastAPI(title="Instagram Clone API", version="1.0.0", lifespan=lifespan)

origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(comments.router)
app.include_router(likes.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["system"])
def health_check():
    return {"status": "ok"}
