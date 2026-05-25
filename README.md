# SQL Tutor — System Design

> A SQL tutor that adapts based on whether you got it right.
> Built with LangChain + LangGraph + LangSmith + FastAPI + React.

---

## Top Picks

Best candidates — simplest use cases that meaningfully use all 3 Lang products:

| Pick | LangChain | LangGraph | LangSmith | Why It Stands Out |
|---|---|---|---|---|
| **SQL Tutor** ⭐ | Questions, hints, feedback | Loop: ask → grade → branch | Trace which hints help users succeed | Real execution = real grading, no ambiguity |
| Research Agent | RAG retrieval, LLM chain | Search → retrieve → synthesize | Trace every step | Each product has a distinct visible job |
| Support Triage | Draft replies | Classify → route → draft | Trace classification accuracy | Relatable enterprise use case |
| Code Review Agent | Explain issues | Read diff → check rules → comment | Trace rule coverage | Developer-friendly demo |
| Travel Planner | Itinerary generation | Multi-step tool calls | Trace tool usage | Multi-step with clear visual output |

### Lang Component Roles

| Product | Role in SQL Tutor |
|---|---|
| **LangChain** | Prompt templates, LLM calls, question/hint/feedback generation |
| **LangGraph** | State machine: generate → wait → grade → hint → level up |
| **LangSmith** | Auto-traces every node and LLM call, surfaces trace URL in UI |

---

## Question Strategy

### Approach Comparison

| Approach | How | Pros | Cons |
|---|---|---|---|
| Curated question bank | Hardcoded JSON list per level | Predictable, fast, gradable | Limited variety |
| LLM-generated on the fly | LangChain prompts: "Generate level-3 JOIN question" | Infinite variety, adaptive | Quality varies, slower |
| **Hybrid** ⭐ | Curated templates + LLM fills in variations | Best of both | Slightly more code |

### Recommendation: Hybrid

Templates define structure and difficulty. LLM generates fresh variants each session.

**Sample DB:** `employees`, `departments`, `salaries`, `projects` — 4 tables, ~50 rows total.

### Level Progression

| Level | Concept | Sample Question |
|---|---|---|
| 1 | SELECT + WHERE | "Show all employees in the Engineering department." |
| 2 | ORDER BY + LIMIT | "Find the 5 highest-paid employees." |
| 3 | Aggregates | "What is the average salary per department?" |
| 4 | JOIN | "List employees with their department names." |
| 5 | GROUP BY + HAVING | "Which departments have more than 3 employees?" |
| 6 | Subqueries | "Find employees earning above company average." |
| 7 | Window functions | "Rank employees by salary within each department." |

### How Grading Works

```
User submits SQL
  → Run user query on SQLite
  → Run reference query on same DB
  → Compare result sets (ignore row order unless ORDER BY required)
    ├─ Match    → ✅ correct → level up
    ├─ Mismatch → ❌ show diff → hint → retry
    └─ Error    → explain error → retry
```

No LLM-as-judge needed for correctness. LLM is only used for:
- Generating question variants
- Writing hints and explanations
- Adapting feedback tone

---

## Architect Prompt

Use this prompt to regenerate or extend this design for other projects:

```
You are an expert system architect and full-stack developer.
I need you to design and plan a complete software system.

Please provide:

1. **High-Level Architecture**
   - System components and their relationships
   - Technology choices with justifications
   - Deployment strategy

2. **Data Model**
   - Database schema with all tables, fields, relationships
   - Indexes and constraints
   - State machines for key entities

3. **API Design**
   - All endpoints with methods and purposes
   - Request/response structures
   - Authentication and authorization strategy

4. **Core Mechanisms**
   - Detailed explanation of key system workflows
   - State transitions and business logic
   - Real-time update strategy (WebSocket/polling)

5. **Implementation Roadmap**
   - Phased development plan with timelines
   - Critical path and dependencies
   - Team requirements

6. **Component Block Diagram**
   - Visual representation of all components
   - Data flow for major use cases
   - Technology stack per component
   - Service interaction matrix

7. **Service Limits & Cost Analysis**
   - Free tier limits for all services
   - Usage projections at different scales
   - Cost breakdown and growth scenarios
   - Optimization strategies

Present information in tables and structured formats.
Be specific about versions, limits, and technical constraints.
After each major section, ask if I want to proceed or need clarification.
```

---

## 1. High-Level Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Chat Panel  │  │  SQL Editor  │  │   State Sidebar       │  │
│  │ Q + Hints   │  │ + Run Button │  │ Level/Score/Trace     │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
│              React 18 + Vite + TypeScript + Tailwind             │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST/JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                 │
│              FastAPI 0.110 + Uvicorn + Pydantic v2               │
│  /session/start  /question/next  /answer/submit  /session/{id}  │
└──────────┬──────────────────┬──────────────────────────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐  ┌───────────────────────────────────────┐
│   Session Store  │  │         LangGraph 0.2 Agent           │
│   (in-memory)    │  │  generate_q → wait → grade → branch   │
└──────────────────┘  └──────────┬────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   LangChain     │  │   SQLite DB      │  │   LangSmith      │
│   Claude API    │  │   (sample data)  │  │   Tracing        │
│   Prompts/Hints │  │   Query grader   │  │   Observability  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

### Technology Choices

| Layer | Choice | Version | Justification |
|---|---|---|---|
| Frontend framework | React | 18 | Component model fits chat+editor+sidebar layout |
| Build tool | Vite | 5 | Fast HMR, simple TS config |
| Styling | Tailwind | 3 | Utility-first, no CSS overhead |
| Package manager | uv | latest | Fast, lockfile-based, replaces pip |
| Backend | FastAPI | 0.110 | Async, auto OpenAPI docs, Pydantic validation |
| Orchestration | LangGraph | 0.2 | Native state machine, loops, branching |
| LLM framework | LangChain | 0.2 | Prompt templates, chain composition |
| LLM | Groq (default) / any provider | latest | Free tier, swappable via `LLM_PROVIDER` env var |
| DB | SQLite | 3 | Zero setup, file-based, enough for this project |
| Observability | LangSmith | cloud | Free tier, traces LangGraph natively |
| Language | Python | 3.11 | LangGraph/LangChain native |

### Deployment Strategy

| Component | Where | How |
|---|---|---|
| Frontend | Local / Vercel | `vite build` → static |
| Backend | Local / Railway | `uvicorn main:app` |
| SQLite DB | Backend host | File bundled with app |
| LangSmith | Cloud (SaaS) | API key only |

---

## 2. Data Model

### Schema

#### `departments`
| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| name | TEXT | NOT NULL, UNIQUE |
| location | TEXT | NOT NULL |
| budget | REAL | NOT NULL |

#### `employees`
| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| department_id | INTEGER | FK → departments.id |
| hire_date | TEXT | NOT NULL (ISO 8601) |
| is_active | INTEGER | DEFAULT 1 |

#### `salaries`
| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| employee_id | INTEGER | FK → employees.id |
| amount | REAL | NOT NULL |
| effective_date | TEXT | NOT NULL |

#### `projects`
| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| name | TEXT | NOT NULL |
| department_id | INTEGER | FK → departments.id |
| start_date | TEXT | NOT NULL |
| end_date | TEXT | NULLABLE |
| status | TEXT | CHECK IN ('active','completed','paused') |

#### `project_assignments`
| Field | Type | Constraints |
|---|---|---|
| id | INTEGER | PK, AUTOINCREMENT |
| employee_id | INTEGER | FK → employees.id |
| project_id | INTEGER | FK → projects.id |
| role | TEXT | NOT NULL |
| assigned_date | TEXT | NOT NULL |

### Relationships

```
departments ──< employees ──< salaries
     │
     └──< projects ──< project_assignments >── employees
```

### Indexes

| Table | Index | Reason |
|---|---|---|
| employees | idx_dept_id | JOIN on department_id |
| employees | idx_active | Filter is_active |
| salaries | idx_emp_id | JOIN on employee_id |
| salaries | idx_effective_date | ORDER BY queries |
| project_assignments | idx_emp_id | JOIN on employee_id |
| project_assignments | idx_proj_id | JOIN on project_id |

### Sample Data Volume

| Table | Rows | Purpose |
|---|---|---|
| departments | 5 | Engineering, HR, Sales, Finance, Ops |
| employees | 30 | Spread across departments |
| salaries | 60 | 2 records per employee (history) |
| projects | 10 | Mix of active/completed |
| project_assignments | 40 | ~4 per project |

### Session State Schema (in-memory)

```python
class TutorState(TypedDict):
    session_id:       str          # uuid4
    level:            int          # 1–7
    score:            int          # cumulative correct answers
    current_question: str          # rendered question text
    reference_sql:    str          # correct SQL (hidden from user)
    user_sql:         str | None   # last submitted SQL
    attempts:         int          # attempts on current question (max 3)
    hints_shown:      list[str]    # hints already revealed
    history:          list[dict]   # {q, user_sql, correct, level, ts}
    status:           str          # awaiting_answer | complete
    langsmith_run_id: str | None   # trace link for UI
```

### Level → Concept Mapping

| Level | Concept | Tables Used |
|---|---|---|
| 1 | SELECT + WHERE | employees |
| 2 | ORDER BY + LIMIT | employees, salaries |
| 3 | Aggregates (COUNT, AVG, SUM) | salaries, departments |
| 4 | INNER JOIN | employees + departments |
| 5 | GROUP BY + HAVING | employees + salaries |
| 6 | Subqueries | employees + salaries |
| 7 | Window functions | salaries + employees |

### State Machine: Session Lifecycle

```
[init] → awaiting_answer
              │
         user submits SQL
              │
         ┌────┴────┐
         ▼         ▼
      correct    wrong/error
         │         │
         │    attempts < 3 → show hint → awaiting_answer
         │    attempts = 3 → force next question
         │
    level < 7 → level_up → generate_question → awaiting_answer
    level = 7 → [complete]
```

---

## 3. API Design

### Base URL

```
http://localhost:8000/api/v1
```

### Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/session/start` | Create new tutor session |
| GET | `/session/{session_id}` | Fetch current session state |
| POST | `/answer/submit` | Submit SQL answer |
| GET | `/hint/{session_id}` | Request next hint |
| POST | `/session/reset` | Restart session |
| GET | `/health` | Service health check |

### Request / Response Structures

#### `POST /session/start`
```json
// Request
{
  "user_name": "Alice",
  "start_level": 1
}

// Response 201
{
  "session_id": "uuid4",
  "level": 1,
  "score": 0,
  "question": "Find all employees in the Engineering department.",
  "schema_hint": "employees(id, name, email, department_id, hire_date, is_active)",
  "langsmith_trace_url": "https://smith.langchain.com/..."
}
```

#### `GET /session/{session_id}`
```json
// Response 200
{
  "session_id": "uuid4",
  "level": 3,
  "score": 5,
  "status": "awaiting_answer",
  "current_question": "...",
  "attempts": 1,
  "hints_shown": ["Try using WHERE clause"],
  "history": [
    {
      "level": 1,
      "question": "...",
      "user_sql": "SELECT ...",
      "correct": true,
      "ts": "2026-05-14T10:00:00Z"
    }
  ],
  "langsmith_trace_url": "https://smith.langchain.com/..."
}
```

#### `POST /answer/submit`
```json
// Request
{
  "session_id": "uuid4",
  "user_sql": "SELECT * FROM employees WHERE department_id = 1"
}

// Response 200 — Correct
{
  "correct": true,
  "feedback": "Correct! You selected all Engineering employees.",
  "result_preview": [
    {"id": 1, "name": "Alice", "email": "alice@co.com"}
  ],
  "level_up": true,
  "new_level": 2,
  "score": 1,
  "next_question": "Find the 5 highest paid employees.",
  "langsmith_trace_url": "https://smith.langchain.com/..."
}

// Response 200 — Wrong
{
  "correct": false,
  "feedback": "Your result has 8 rows but expected 6. Check your WHERE clause.",
  "result_preview": [],
  "level_up": false,
  "attempts": 2,
  "hints_available": true,
  "langsmith_trace_url": "https://smith.langchain.com/..."
}

// Response 200 — SQL Error
{
  "correct": false,
  "feedback": "Syntax error near 'FORM'. Did you mean FROM?",
  "sql_error": "near 'FORM': syntax error",
  "attempts": 2,
  "hints_available": true
}
```

#### `GET /hint/{session_id}`
```json
// Response 200
{
  "hint": "Try filtering with WHERE department_id = ...",
  "hints_remaining": 1,
  "attempts": 2
}
```

### Error Responses

| HTTP Code | Scenario |
|---|---|
| 400 | Missing/invalid fields |
| 404 | Session not found |
| 422 | Pydantic validation failure |
| 500 | LLM call failed / DB error |
| 503 | Claude API / LangSmith unreachable |

```json
{
  "error": "session_not_found",
  "message": "No session with id abc123",
  "status": 404
}
```

### Pydantic Models

```python
class StartSessionRequest(BaseModel):
    user_name: str
    start_level: int = Field(default=1, ge=1, le=7)

class SubmitAnswerRequest(BaseModel):
    session_id: str
    user_sql: str = Field(min_length=1, max_length=2000)

class ResetSessionRequest(BaseModel):
    session_id: str

class QuestionResponse(BaseModel):
    question: str
    schema_hint: str
    level: int
    langsmith_trace_url: str | None
```

### Authentication

| Concern | Decision | Production Approach |
|---|---|---|
| User identity | `user_name` string only | JWT via Auth0/Supabase |
| Session ownership | `session_id` as secret | Tie session to user JWT |
| API key protection | Env vars only | API gateway + rate limiting |
| LangSmith key | Server-side only | Same |
| Claude API key | Server-side only | Same |

---

## 4. Core Mechanisms

### 4.1 LangGraph State Machine

```python
from langgraph.graph import StateGraph, END

graph = StateGraph(TutorState)

graph.add_node("generate_question", generate_question_node)
graph.add_node("grade_answer",      grade_answer_node)
graph.add_node("give_hint",         give_hint_node)
graph.add_node("level_up",          level_up_node)
graph.add_node("session_complete",  session_complete_node)

graph.set_entry_point("generate_question")
graph.add_edge("generate_question", END)

graph.add_conditional_edges("grade_answer", route_after_grade, {
    "correct":        "level_up",
    "wrong_hint":     "give_hint",
    "wrong_no_hint":  "generate_question",
    "error":          "give_hint",
})

graph.add_conditional_edges("level_up", route_after_level, {
    "next_level":  "generate_question",
    "complete":    "session_complete",
})

graph.add_edge("give_hint",        END)
graph.add_edge("session_complete", END)
```

### 4.2 Node Responsibilities

| Node | Input | Steps | Output |
|---|---|---|---|
| `generate_question` | level, history | Load template → LLM → question + reference_sql | current_question, reference_sql |
| `grade_answer` | user_sql, reference_sql | Exec both → compare result sets | last_result, last_outcome, attempts |
| `give_hint` | question, user_sql, hints_shown | LLM → progressive hint | hints_shown++ |
| `level_up` | level, score | level++, score += points | level, score, history |
| `session_complete` | state | Finalize session | status = complete |

### 4.3 Grading Logic

```python
def grade(user_sql: str, reference_sql: str, db_path: str) -> GradeResult:
    try:
        user_rows = exec_query(user_sql, db_path)
        ref_rows  = exec_query(reference_sql, db_path)
        user_norm = normalize(user_rows)
        ref_norm  = normalize(ref_rows)
        correct   = (user_norm == ref_norm)
        feedback  = diff_feedback(user_norm, ref_norm) if not correct else None
        return GradeResult(correct=correct, feedback=feedback)
    except sqlite3.OperationalError as e:
        return GradeResult(correct=False, sql_error=str(e))
```

#### Diff Feedback Rules

| Condition | Feedback |
|---|---|
| Row count differs | "Got N rows, expected M. Check your WHERE clause." |
| Columns differ | "Missing columns: X. Extra columns: Y." |
| Values differ | "Row values don't match. Check your JOIN or filter." |
| ORDER wrong | "Rows correct but wrong order. Add ORDER BY." |
| SQL syntax error | "Syntax error near X. Did you mean Y?" |
| Timeout (>2s) | "Query too slow. Avoid SELECT * on large joins." |

### 4.4 LangChain Prompt Templates

#### Question Generation
```
System: You are a SQL tutor. Generate a clear, concise SQL exercise.
        Level {level}: {concept}.
        Database tables: {schema}.
        Prior questions this session: {history_summary}.
        Rules:
        - One question only. No hints in the question.
        - Must be solvable with standard SQLite syntax.
        - Do not repeat prior questions.

User:   Generate a level {level} question and its reference SQL.
        Return JSON: {{"question": "...", "reference_sql": "..."}}
```

#### Hint Generation
```
System: You are a SQL tutor giving progressive hints.
        Question: {question}
        Level: {level} ({concept})
        Hints already given: {hints_shown}
        User's wrong SQL: {user_sql}
        Rules:
        - Do NOT reveal the answer or reference SQL.
        - Each hint must be more specific than the last.
        - Max 3 hints total.

User:   Give hint number {hint_number}.
```

### 4.5 Routing Logic

```python
def route_after_grade(state: TutorState) -> str:
    if state.last_outcome == "correct":
        return "correct"
    if state.attempts >= state.max_attempts:
        return "wrong_no_hint"
    if state.last_outcome in ("wrong", "sql_error"):
        return "wrong_hint"
    return "error"

def route_after_level(state: TutorState) -> str:
    return "complete" if state.level > 7 else "next_level"
```

### 4.6 Scoring System

| Outcome | Points |
|---|---|
| Correct on attempt 1 | 3 |
| Correct on attempt 2 | 2 |
| Correct on attempt 3 | 1 |
| Max attempts reached | 0 |
| Level 7 completion bonus | +5 |

### 4.7 LangSmith Integration

```python
import os
from langsmith.run_helpers import traceable

os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"]    = "sql-tutor"

@traceable(name="grade_answer", tags=["grading"])
def grade_answer_node(state: TutorState) -> TutorState:
    ...

# Capture trace URL for UI
trace_url = f"https://smith.langchain.com/runs/{run_id}"
```

#### What LangSmith Captures

| Event | Logged Fields |
|---|---|
| Question generation | level, prompt, response, latency |
| Grading | user_sql, reference_sql, outcome, diff |
| Hint generation | hint_number, prompt, response |
| Level transition | from_level, to_level, score_delta |
| Session complete | total_score, levels_completed, duration |

### 4.8 Real-Time Update Strategy

**Strategy: Polling**

```
UI polls GET /session/{id} every 2s while status = "processing"
FastAPI responds immediately when LangGraph node completes
Average LLM latency: ~1-2s → polling is sufficient
```

| Approach | Now | Production |
|---|---|---|
| Polling | ✅ Simple | ❌ Wasteful |
| WebSocket | ❌ Overkill | ✅ Real-time streaming |
| SSE | ⚠️ Optional upgrade | ✅ LLM token streaming |

---

## 5. Implementation Roadmap

### Phases

| Phase | Scope | Duration |
|---|---|---|
| 1 — Foundation | SQLite DB + seed data, FastAPI skeleton, session store | 1 day |
| 2 — Agent Core | LangGraph graph, all nodes, grader, prompt templates | 2 days |
| 3 — API | All endpoints, Pydantic models, error handling | 1 day |
| 4 — Frontend | React shell, ChatPanel, SQLEditor, StateSidebar | 2 days |
| 5 — LangSmith | Tracing, trace URL in responses, TraceLink component | 0.5 day |
| 6 — Polish | Diff feedback, scoring, level progression, UX | 1 day |

**Total: ~7-8 days solo**

### Critical Path

```
DB schema + seed data
  → LangGraph nodes
    → Grader
      → FastAPI endpoints
        → React UI
          → LangSmith tracing
```

### Dependencies

| Step | Depends On |
|---|---|
| LangGraph nodes | State schema, DB |
| FastAPI endpoints | LangGraph agent, session store |
| React UI | FastAPI endpoints (contract) |
| LangSmith | LangGraph nodes |

### Team Requirements

| Role | Time |
|---|---|
| Full-stack dev | 1 person, ~8 days |
| Optional: UX review | 2 hours at end |

---

## 6. Component Block Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          React UI                                 │
│                                                                   │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
│  │  ChatPanel    │  │   SQLEditor    │  │    StateSidebar     │ │
│  │               │  │                │  │                     │ │
│  │ - Question    │  │ - Textarea     │  │ - Level badge       │ │
│  │ - Feedback    │  │ - Run button   │  │ - Score counter     │ │
│  │ - Hints list  │  │ - Result table │  │ - Attempts dots     │ │
│  │               │  │                │  │ - TraceLink         │ │
│  └───────────────┘  └────────────────┘  └─────────────────────┘ │
│                            │                                      │
│                       src/api.ts                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │ fetch()
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                       FastAPI (api/)                              │
│                                                                   │
│  main.py ── sessions.py ── routers/                              │
│                              ├── session.py                       │
│                              ├── answer.py                        │
│                              └── hint.py                          │
└───────────────┬──────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LangGraph Agent (agent/)                       │
│                                                                   │
│  graph.py                                                         │
│    ├── state.py          (TutorState TypedDict)                   │
│    ├── nodes.py          (generate_q, grade, hint, level_up)      │
│    ├── chains.py         (LangChain prompt templates)             │
│    └── grader.py         (SQL execution + diff)                   │
└──────────┬───────────────────────────┬───────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐    ┌──────────────────────┐
│   Anthropic API     │    │    SQLite (data/)     │
│   claude-sonnet-4   │    │    sample.db          │
│   via LangChain     │    │    templates.json     │
└─────────────────────┘    └──────────────────────┘
           │
           ▼
┌─────────────────────┐
│     LangSmith       │
│   (cloud SaaS)      │
│   auto-traced via   │
│   LANGCHAIN_TRACING │
└─────────────────────┘
```

### Service Interaction Matrix

| From → To | Protocol | Data |
|---|---|---|
| React → FastAPI | HTTP REST | JSON |
| FastAPI → LangGraph | Python call | TutorState dict |
| LangGraph → LangChain | Python call | Prompt strings |
| LangChain → Claude API | HTTPS | Messages API |
| LangGraph → SQLite | sqlite3 | SQL strings |
| LangGraph → LangSmith | HTTPS (auto) | Trace events |
| FastAPI → React | JSON response | State + trace URL |

### File Structure

```
sql-tutor/
├── api/
│   ├── main.py
│   ├── sessions.py
│   └── routers/
│       ├── session.py
│       ├── answer.py
│       └── hint.py
├── agent/
│   ├── graph.py
│   ├── state.py
│   ├── nodes.py
│   ├── chains.py
│   └── grader.py
├── data/
│   ├── sample.db
│   ├── seed.sql
│   └── templates.json
├── ui/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── SQLEditor.tsx
│   │   ├── StateSidebar.tsx
│   │   ├── TraceLink.tsx
│   │   └── api.ts
│   ├── index.html
│   └── vite.config.ts
├── .env.example
├── requirements.txt
├── package.json
└── README.md
```

---

## 7. Service Limits & Cost Analysis

### Free Tier Limits

| Service | Free Tier | Limit Hit When |
|---|---|---|
| LangSmith | 5,000 traces/month | ~5,000 tutor sessions |
| Anthropic API | $5 credit (new accounts) | ~500-1000 questions |
| Railway (backend) | 500 hrs/month | 1 always-on service |
| Vercel (frontend) | 100GB bandwidth | Negligible |
| SQLite | Unlimited | N/A (file-based) |

### LLM Cost Breakdown

| Operation | Tokens (est.) | Calls/Session | Cost/Session |
|---|---|---|---|
| Question generation | ~300 in + 150 out | 7 (one per level) | ~$0.003 |
| Hint generation | ~400 in + 100 out | ~5 (avg) | ~$0.002 |
| Feedback generation | ~350 in + 150 out | ~5 (avg) | ~$0.002 |
| **Total per session** | | | **~$0.007** |

### Usage Projections

| Scale | Sessions/Month | LLM Cost | LangSmith |
|---|---|---|---|
| Solo (1 user) | 50 | ~$0.35 | Free |
| Small (10 users) | 500 | ~$3.50 | Free |
| Medium (100 users) | 5,000 | ~$35 | Paid (~$40/mo) |
| Large (1,000 users) | 50,000 | ~$350 | Paid (~$200/mo) |

### Optimization Strategies

| Strategy | Saves | When to Apply |
|---|---|---|
| Cache question templates | ~30% LLM calls | From day 1 |
| Reuse reference SQL (no LLM) | ~20% LLM calls | From day 1 |
| Prompt compression | ~15% token cost | At medium scale |
| Claude Haiku for hints | ~80% hint cost | At medium scale |
| Self-hosted LangSmith | $200/mo SaaS cost | At large scale |

---

## Out of Scope

- No auth / user accounts
- No persistent sessions (in-memory only)
- No DB schema customization
- No multi-user concurrency
- No WebSocket / streaming
- No user progress history across sessions
- No admin dashboard
- No mobile optimization

---

## LLM Providers

Switch providers via `LLM_PROVIDER` in `.env`. Only one key needed at a time.

| Provider | `LLM_PROVIDER` | Default Model | Free Tier | Sign Up |
|---|---|---|---|---|
| **Groq** ⭐ default | `groq` | `llama3-70b-8192` | ✅ No credit card | console.groq.com |
| Anthropic | `anthropic` | `claude-sonnet-4-5` | $5 credit | console.anthropic.com |
| OpenAI | `openai` | `gpt-4o-mini` | $5 credit | platform.openai.com |
| Google Gemini | `gemini` | `gemini-1.5-flash` | ✅ Free tier | aistudio.google.com |
| Mistral | `mistral` | `mistral-large-latest` | ✅ Free tier | console.mistral.ai |
| Cohere | `cohere` | `command-r-plus` | ✅ Free tier | dashboard.cohere.com |
| Together AI | `together` | `Llama-3-70b-chat-hf` | $25 credit | api.together.xyz |
| Fireworks AI | `fireworks` | `llama-v3-70b-instruct` | ✅ Free tier | fireworks.ai |
| Ollama (local) | `ollama` | `llama3` | ✅ Free, local | ollama.com |

Override the model per provider:
```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o
```

---

## Environment Variables

```bash
# ── LLM Provider ──────────────────────────────
LLM_PROVIDER=groq          # default
# LLM_MODEL=llama3-70b-8192  # optional override

# ── Provider Keys (only fill in the one you use) ──
GROQ_API_KEY=              # groq
# ANTHROPIC_API_KEY=       # anthropic
# OPENAI_API_KEY=          # openai
# GOOGLE_API_KEY=          # gemini
# MISTRAL_API_KEY=         # mistral
# COHERE_API_KEY=          # cohere
# TOGETHER_API_KEY=        # together
# FIREWORKS_API_KEY=       # fireworks
# OLLAMA_BASE_URL=http://localhost:11434  # ollama (no key)

# ── LangSmith (optional) ──────────────────────
# LANGCHAIN_API_KEY=
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_PROJECT=sql-tutor

# ── Database ──────────────────────────────────
DATABASE_PATH=./data/sample.db
```

---

## Quick Start

```bash
# 1. Copy and fill env
cp .env.example .env
# Set GROQ_API_KEY (or your chosen provider key)

# 2. Backend
uv sync
uv run python run.py
# → http://localhost:8000

# 3. Frontend (new terminal)
cd ui
npm install
npm run dev
# → http://localhost:5173
```

> **Minimum to run:** only one provider key required. LangSmith is optional.
> Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`

---

## Deployment (Render)

Both frontend and backend deploy on Render. The same codebase works locally and in production — no changes needed.

### How it works

```
Local:   VITE_API_URL not set → Vite proxy → http://localhost:8000
Render:  VITE_API_URL=https://your-backend.onrender.com → direct URL
```

### Step 1 — Push to GitHub
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/you/sql-tutor
git push
```

### Step 2 — Backend (Web Service)

Render dashboard → **New Web Service** → connect repo

| Setting | Value |
|---|---|
| Root directory | `.` |
| Runtime | Python |
| Build command | `uv sync` |
| Start command | `uv run python run.py` |
| Instance type | Free |

Environment variables (from `.env.render.example`):

```
LLM_PROVIDER=groq
GROQ_API_KEY=your-key
FRONTEND_URL=https://your-frontend.onrender.com
DATABASE_PATH=./data/sample.db
```

### Step 3 — Frontend (Static Site)

Render dashboard → **New Static Site** → same repo

| Setting | Value |
|---|---|
| Root directory | `ui` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |

Environment variable:
```
VITE_API_URL=https://your-backend.onrender.com
```

### Free tier caveats

| Issue | Detail | Fix |
|---|---|---|
| Cold start | Backend sleeps after 15min, ~30s wake | Upgrade to $7/mo |
| SQLite resets | Ephemeral disk — recreates from seed.sql on redeploy | Fine for this project |
| 750 hrs/month | Free tier limit across all services | Fine for 1 app |

---

## FAQ

### How does the grader check if a SQL answer is correct?

It uses **result-set comparison** — not SQL comparison. Both the user's query and the reference query are executed against the same SQLite database, and their output rows are compared directly.

```
User submits SQL
       │
       ▼
exec_query(user_sql)      ← run on SQLite
exec_query(reference_sql) ← run on SQLite
       │
       ▼
normalize(user_rows)
normalize(ref_rows)
       │
       ▼
user_norm == ref_norm?
  ├─ Yes → correct ✅
  └─ No  → diff_feedback() → explain what's wrong
```

#### What `normalize()` does

Before comparing, both result sets are normalized:

```python
def normalize(rows):
    # 1. Lowercase all column names
    normalized = [{k.lower(): v for k, v in row.items()} for row in rows]
    # 2. Sort rows so row order doesn't matter
    return sorted(normalized, key=lambda r: str(sorted(r.items())))
```

This means `Name` vs `name` are treated the same, and rows in different orders still match.

#### What Python `==` checks on a list of dicts

The final check is a Python deep equality comparison:

| Check | Example | Result |
|---|---|---|
| Same number of rows | 3 vs 3 | ✅ |
| Same keys in each dict | `{name, dept}` vs `{name, dept}` | ✅ |
| Same values in each dict | `alice` vs `alice` | ✅ |
| Same order after sort | both sorted identically | ✅ |

All four must be true simultaneously.

#### Key design decision

Because only the result set matters, different SQL that produces the same output both pass:

```sql
-- Both pass for "list Engineering employees"
SELECT * FROM employees WHERE department_id = 1
SELECT id, name FROM employees WHERE department_id = 1 AND is_active != 0
```

The LLM is only used to explain *why* an answer is wrong — not to judge correctness.

#### Known gaps

| Scenario | Outcome |
|---|---|
| `100000` vs `100000.0` | ❌ Fail — int vs float mismatch |
| `"Alice"` vs `"alice"` | ❌ Fail — value case sensitive |
| `None` vs `"NULL"` | ❌ Fail — different types |
| Query timeout (>2s) | ⚠️ Not implemented |
| ORDER BY correctness | ⚠️ Normalize sorts rows, losing required order |

A production grader would normalize value types (cast numerics to float, lowercase string values) to handle these edge cases.

---

### Can I swap the LLM without changing the grading logic?

Yes. The grader (`agent/grader.py`) runs pure SQLite — no LLM involved. Only question generation, hints, and feedback use the LLM. Swapping `LLM_PROVIDER` in `.env` has no effect on grading correctness.

---

### What counts as one LangSmith trace?

One end-to-end invocation of the agent. A single SQL submission that triggers `grade_answer → give_hint` counts as one trace, even though it involves multiple LangChain calls internally.

---

### Does this work fully offline?

Partially. It depends on which component:

| Component | Offline? | Notes |
|---|---|---|
| LangChain | ✅ Yes | Pure Python library |
| LangGraph | ✅ Yes | Pure Python library |
| SQLite DB | ✅ Yes | File-based, no network |
| Ollama LLM | ✅ Yes | Runs locally after model download |
| LangSmith (cloud) | ❌ No | Sends traces to smith.langchain.com |
| LangSmith (self-hosted) | ✅ Yes | Requires Docker, see below |

**Full offline setup:**

```bash
# 1. Use Ollama as LLM
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3

# 2. Disable LangSmith tracing entirely
# Just omit LANGCHAIN_API_KEY and LANGCHAIN_TRACING_V2 from .env
```

**Self-hosted LangSmith (optional):**

LangSmith can be self-hosted via Docker for fully air-gapped environments. It requires a LangSmith Enterprise license.

```bash
# Pull and run LangSmith locally
docker pull langchain/langsmith
# See: https://docs.smith.langchain.com/self_hosting
```

The simplest offline approach is to skip LangSmith entirely — just leave `LANGCHAIN_API_KEY` unset and tracing is automatically disabled.

