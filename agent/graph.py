"""LangGraph state machine — SQL Tutor agent graph."""
import uuid
from langgraph.graph import StateGraph, END
from agent.state import TutorState
from agent.nodes import (
    generate_question_node,
    grade_answer_node,
    give_hint_node,
    level_up_node,
    force_next_node,
    session_complete_node,
    route_after_grade,
    route_after_level,
)


def build_graph():
    g = StateGraph(TutorState)

    g.add_node("generate_question", generate_question_node)
    g.add_node("grade_answer",      grade_answer_node)
    g.add_node("give_hint",         give_hint_node)
    g.add_node("level_up",          level_up_node)
    g.add_node("force_next",        force_next_node)
    g.add_node("session_complete",  session_complete_node)

    g.set_entry_point("generate_question")

    # After generating a question, pause and wait for user input
    g.add_edge("generate_question", END)

    # After grading, branch on outcome
    g.add_conditional_edges("grade_answer", route_after_grade, {
        "correct":      "level_up",
        "wrong":        "give_hint",
        "max_attempts": "force_next",
    })

    # After hint, pause and wait for user retry
    g.add_edge("give_hint", END)

    # After level up, check if done
    g.add_conditional_edges("level_up", route_after_level, {
        "next_level": "generate_question",
        "complete":   "session_complete",
    })

    # After force_next, check if done
    g.add_conditional_edges("force_next", route_after_level, {
        "next_level": "generate_question",
        "complete":   "session_complete",
    })

    g.add_edge("session_complete", END)

    return g.compile()


tutor_graph = build_graph()


def create_initial_state(user_name: str, start_level: int = 1) -> TutorState:
    return TutorState(
        session_id=str(uuid.uuid4()),
        user_name=user_name,
        level=start_level,
        score=0,
        current_question="",
        schema_hint="",
        reference_sql="",
        user_sql=None,
        attempts=0,
        max_attempts=3,
        hints_shown=[],
        last_outcome=None,
        last_result=[],
        last_feedback=None,
        history=[],
        status="awaiting_answer",
        langsmith_run_id=None,
    )


def start_session(user_name: str, start_level: int = 1) -> TutorState:
    """Initialize state and generate the first question."""
    initial = create_initial_state(user_name, start_level)
    result = tutor_graph.invoke(initial)
    return result


def submit_answer(state: TutorState, user_sql: str) -> TutorState:
    """Grade the user's SQL and advance the state."""
    from agent.nodes import (
        grade_answer_node, give_hint_node, level_up_node,
        force_next_node, session_complete_node,
        generate_question_node, route_after_grade, route_after_level
    )

    # Step 1: grade
    state = {**state, "user_sql": user_sql}
    state = grade_answer_node(state)

    # Step 2: route
    route = route_after_grade(state)

    if route == "correct":
        state = level_up_node(state)
        next_route = route_after_level(state)
        if next_route == "complete":
            state = session_complete_node(state)
        else:
            state = generate_question_node(state)

    elif route == "wrong":
        state = give_hint_node(state)

    elif route == "max_attempts":
        state = force_next_node(state)
        next_route = route_after_level(state)
        if next_route == "complete":
            state = session_complete_node(state)
        else:
            state = generate_question_node(state)

    return state


def request_hint(state: TutorState) -> TutorState:
    """Generate next hint for the current question."""
    if len(state.get("hints_shown", [])) >= state.get("max_attempts", 3):
        return state
    from agent.nodes import give_hint_node
    return give_hint_node(state)
