"""Answer submission endpoint."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from agent.graph import submit_answer
from api import sessions
from api.routers.session import _serialize

router = APIRouter(prefix="/answer", tags=["answer"])


class SubmitAnswerRequest(BaseModel):
    session_id: str
    user_sql: str = Field(min_length=1, max_length=2000)


@router.post("/submit")
def submit(req: SubmitAnswerRequest):
    state = sessions.get(req.session_id)
    if not state:
        raise HTTPException(404, f"Session {req.session_id} not found")
    if state["status"] == "complete":
        raise HTTPException(400, "Session is already complete")

    new_state = submit_answer(state, req.user_sql)
    sessions.save(new_state)
    return _serialize(new_state)
