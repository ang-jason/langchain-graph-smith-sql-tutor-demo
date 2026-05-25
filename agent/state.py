"""TutorState — shared state schema for the LangGraph agent."""
from typing import TypedDict


class TutorState(TypedDict):
    session_id: str
    user_name: str
    level: int                  # 1–7
    score: int
    current_question: str
    schema_hint: str
    reference_sql: str
    user_sql: str | None
    attempts: int               # attempts on current question
    max_attempts: int           # default 3
    hints_shown: list[str]
    last_outcome: str | None    # "correct" | "wrong" | "sql_error" | None
    last_result: list[dict]     # user query result rows
    last_feedback: str | None
    history: list[dict]
    status: str                 # "awaiting_answer" | "complete"
    langsmith_run_id: str | None
