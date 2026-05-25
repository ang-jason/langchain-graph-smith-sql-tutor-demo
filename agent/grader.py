"""SQL grader — executes and compares query result sets."""
import sqlite3
import os
from dataclasses import dataclass

DB_PATH = os.getenv("DATABASE_PATH", "./data/sample.db")


@dataclass
class GradeResult:
    correct: bool
    user_rows: list[dict]
    expected_row_count: int | None = None
    feedback: str | None = None
    sql_error: str | None = None


def exec_query(sql: str, db_path: str = DB_PATH) -> list[dict]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cur = conn.execute(sql)
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()


def normalize(rows: list[dict]) -> list[dict]:
    """Sort rows and lowercase column names for comparison."""
    if not rows:
        return []
    normalized = [{k.lower(): v for k, v in row.items()} for row in rows]
    try:
        return sorted(normalized, key=lambda r: str(sorted(r.items())))
    except Exception:
        return normalized


def diff_feedback(user_rows: list[dict], ref_rows: list[dict]) -> str:
    user_cols = set(user_rows[0].keys()) if user_rows else set()
    ref_cols = set(ref_rows[0].keys()) if ref_rows else set()

    if len(user_rows) != len(ref_rows):
        return (
            f"Got {len(user_rows)} row(s), expected {len(ref_rows)}. "
            "Check your WHERE clause or JOIN conditions."
        )
    missing = ref_cols - user_cols
    extra = user_cols - ref_cols
    if missing or extra:
        parts = []
        if missing:
            parts.append(f"Missing columns: {', '.join(sorted(missing))}")
        if extra:
            parts.append(f"Unexpected columns: {', '.join(sorted(extra))}")
        return ". ".join(parts) + "."
    return "Row count matches but values differ. Check your filters or JOIN conditions."


def explain_sql_error(error: str) -> str:
    error_lower = error.lower()
    if "no such table" in error_lower:
        table = error.split(":")[-1].strip()
        return f"Table '{table}' does not exist. Check available tables in the schema hint."
    if "no such column" in error_lower:
        col = error.split(":")[-1].strip()
        return f"Column '{col}' does not exist. Check column names in the schema hint."
    if "syntax error" in error_lower:
        near = error.split("near")[-1].strip() if "near" in error_lower else ""
        return f"SQL syntax error{f' near {near}' if near else ''}. Check your query structure."
    return f"SQL error: {error}"


def grade(user_sql: str, reference_sql: str, db_path: str = DB_PATH) -> GradeResult:
    try:
        user_rows = exec_query(user_sql, db_path)
        ref_rows = exec_query(reference_sql, db_path)
        user_norm = normalize(user_rows)
        ref_norm = normalize(ref_rows)
        correct = user_norm == ref_norm
        feedback = None if correct else diff_feedback(user_norm, ref_norm)
        return GradeResult(
            correct=correct,
            user_rows=user_rows[:10],  # preview only
            expected_row_count=len(ref_rows),
            feedback=feedback,
        )
    except sqlite3.OperationalError as e:
        return GradeResult(
            correct=False,
            user_rows=[],
            feedback=explain_sql_error(str(e)),
            sql_error=str(e),
        )
    except Exception as e:
        return GradeResult(
            correct=False,
            user_rows=[],
            feedback=f"Unexpected error: {str(e)}",
            sql_error=str(e),
        )
