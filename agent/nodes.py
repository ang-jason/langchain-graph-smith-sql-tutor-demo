"""LangGraph nodes — each step in the tutor state machine."""
import os
from agent.state import TutorState
from agent.chains import generate_question, generate_hint, generate_feedback
from agent.grader import grade

DB_PATH = os.getenv("DATABASE_PATH", "./data/sample.db")

MAX_LEVEL = 7

POINTS = {1: 3, 2: 2, 3: 1}  # attempts → points
LEVEL_BONUS = 5               # bonus for completing level 7


def generate_question_node(state: TutorState) -> TutorState:
    result = generate_question(state["level"], state.get("history", []))
    return {
        **state,
        "current_question": result["question"],
        "reference_sql": result["reference_sql"],
        "schema_hint": result.get("schema_hint", ""),
        "user_sql": None,
        "attempts": 0,
        "hints_shown": [],
        "last_outcome": None,
        "last_result": [],
        "last_feedback": None,
        "status": "awaiting_answer",
    }


def grade_answer_node(state: TutorState) -> TutorState:
    result = grade(state["user_sql"], state["reference_sql"], DB_PATH)
    attempts = state["attempts"] + 1
    outcome = "correct" if result.correct else ("sql_error" if result.sql_error else "wrong")

    feedback = None
    if not result.correct:
        feedback = generate_feedback(
            state["current_question"],
            state["user_sql"],
            result.feedback or "Unknown error",
        )

    return {
        **state,
        "attempts": attempts,
        "last_outcome": outcome,
        "last_result": result.user_rows,
        "last_feedback": feedback if not result.correct else "Correct!",
    }


def give_hint_node(state: TutorState) -> TutorState:
    hint = generate_hint(state)
    hints = state.get("hints_shown", []) + [hint]
    return {
        **state,
        "hints_shown": hints,
        "status": "awaiting_answer",
    }


def level_up_node(state: TutorState) -> TutorState:
    points = POINTS.get(state["attempts"], 0)
    bonus = LEVEL_BONUS if state["level"] == MAX_LEVEL else 0
    new_score = state["score"] + points + bonus
    history_entry = {
        "level": state["level"],
        "question": state["current_question"],
        "user_sql": state["user_sql"],
        "correct": True,
        "attempts": state["attempts"],
        "points": points,
    }
    return {
        **state,
        "level": state["level"] + 1,
        "score": new_score,
        "history": state.get("history", []) + [history_entry],
    }


def force_next_node(state: TutorState) -> TutorState:
    """Max attempts reached — record failure and move on."""
    history_entry = {
        "level": state["level"],
        "question": state["current_question"],
        "user_sql": state["user_sql"],
        "correct": False,
        "attempts": state["attempts"],
        "points": 0,
    }
    return {
        **state,
        "level": state["level"] + 1,
        "history": state.get("history", []) + [history_entry],
        "last_feedback": (
            "Max attempts reached. Moving to the next level. "
            f"Reference answer: {state['reference_sql']}"
        ),
    }


def session_complete_node(state: TutorState) -> TutorState:
    return {**state, "status": "complete"}


# ── Routing ──────────────────────────────────────────────────────────────────

def route_after_grade(state: TutorState) -> str:
    if state["last_outcome"] == "correct":
        return "correct"
    if state["attempts"] >= state.get("max_attempts", 3):
        return "max_attempts"
    return "wrong"


def route_after_level(state: TutorState) -> str:
    if state["level"] > MAX_LEVEL:
        return "complete"
    return "next_level"
