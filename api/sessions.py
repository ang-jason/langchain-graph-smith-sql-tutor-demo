"""In-memory session store (in-memory — not for production)."""
from agent.state import TutorState

_sessions: dict[str, TutorState] = {}


def save(state: TutorState) -> None:
    _sessions[state["session_id"]] = state


def get(session_id: str) -> TutorState | None:
    return _sessions.get(session_id)


def delete(session_id: str) -> None:
    _sessions.pop(session_id, None)


def all_ids() -> list[str]:
    return list(_sessions.keys())
