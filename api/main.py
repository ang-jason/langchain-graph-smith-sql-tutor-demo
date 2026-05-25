import os
import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import session, answer, hint
from data.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_path = os.getenv("DATABASE_PATH", "./data/sample.db")
    if not os.path.exists(db_path):
        init_db(db_path)
    yield


app = FastAPI(
    title="SQL Tutor",
    version="1.0.0",
    lifespan=lifespan,
)

# Local dev origins + optional Render frontend URL
_render_url = os.getenv("FRONTEND_URL", "")
_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if _render_url:
    _origins.append(_render_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(session.router, prefix="/api/v1")
app.include_router(answer.router, prefix="/api/v1")
app.include_router(hint.router,   prefix="/api/v1")


@app.get("/api/v1/health")
def health():
    db_path = os.getenv("DATABASE_PATH", "./data/sample.db")
    db_ok = os.path.exists(db_path)
    langsmith_ok = bool(os.getenv("LANGCHAIN_API_KEY"))
    claude_ok = bool(os.getenv("ANTHROPIC_API_KEY"))
    return {
        "status": "ok" if all([db_ok, claude_ok]) else "degraded",
        "db": "connected" if db_ok else "missing",
        "langsmith": "connected" if langsmith_ok else "not configured",
        "claude_api": "connected" if claude_ok else "missing key",
    }
