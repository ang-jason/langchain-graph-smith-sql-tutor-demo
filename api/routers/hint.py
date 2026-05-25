"""Hint endpoint."""
from fastapi import APIRouter, HTTPException
from agent.graph import request_hint
from api import sessions
from api.routers.session import _serialize

router = APIRouter(prefix="/hint", tags=["hint"])


@router.get("/{session_id}")
def get_hint(session_id: str):
    state = sessions.get(session_id)
    if not state:
        raise HTTPException(404, f"Session {session_id} not found")

    hints_used = len(state.get("hints_shown", []))
    max_hints = state.get("max_attempts", 3)

    if hints_used >= max_hints:
        return {
            "hint": None,
            "hints_remaining": 0,
            "message": "No more hints available. Submit your best attempt!",
        }

    new_state = request_hint(state)
    sessions.save(new_state)
    latest_hint = new_state["hints_shown"][-1] if new_state["hints_shown"] else None

    return {
        "hint": latest_hint,
        "hints_remaining": max_hints - len(new_state["hints_shown"]),
        "session": _serialize(new_state),
    }
