"""Session endpoints — start, get, reset."""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from agent.graph import start_session
from agent import sessions

router = APIRouter(prefix="/session", tags=["session"])


class StartSessionRequest(BaseModel):
    user_name: str = Field(min_length=1, max_length=50)
    start_level: int = Field(default=1, ge=1, le=7)


class ResetSessionRequest(BaseModel):
    session_id: str


@router.post("/start", status_code=201)
def start(req: StartSessionRequest):
    state = start_session(req.user_name, req.start_level)
    sessions.save(state)
    return _serialize(state)


@router.get("/{session_id}")
def get_session(session_id: str):
    state = sessions.get(session_id)
    if not state:
        raise HTTPException(404, f"Session {session_id} not found")
    return _serialize(state)


@router.post("/reset")
def reset(req: ResetSessionRequest):
    state = sessions.get(req.session_id)
    if not state:
        raise HTTPException(404, f"Session {req.session_id} not found")
    sessions.delete(req.session_id)
    new_state = start_session(state["user_name"], 1)
    sessions.save(new_state)
    return _serialize(new_state)


def _serialize(state: dict) -> dict:
    return {
        "session_id":       state["session_id"],
        "user_name":        state["user_name"],
        "level":            state["level"],
        "score":            state["score"],
        "status":           state["status"],
        "current_question": state["current_question"],
        "schema_hint":      state["schema_hint"],
        "attempts":         state["attempts"],
        "max_attempts":     state["max_attempts"],
        "hints_shown":      state["hints_shown"],
        "last_outcome":     state["last_outcome"],
        "last_result":      state["last_result"],
        "last_feedback":    state["last_feedback"],
        "history":          state["history"],
        "langsmith_run_id": state["langsmith_run_id"],
    }
