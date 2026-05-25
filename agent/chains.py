"""LangChain chains — question generation, hint, and feedback.

LLM provider is selected via LLM_PROVIDER env var (default: groq).
Supported: groq | anthropic | openai | gemini | mistral | cohere | together | fireworks | ollama
"""
import json
import os
import re
from pathlib import Path
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate

TEMPLATES_PATH = Path(__file__).parent.parent / "data" / "templates.json"


def _build_llm() -> BaseChatModel:
    provider = os.getenv("LLM_PROVIDER", "groq").lower().strip()

    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model=os.getenv("LLM_MODEL", "llama3-70b-8192"),
            api_key=os.getenv("GROQ_API_KEY"),
        )

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=os.getenv("LLM_MODEL", "claude-sonnet-4-5"),
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            max_tokens=1024,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=os.getenv("LLM_MODEL", "gpt-4o-mini"),
            api_key=os.getenv("OPENAI_API_KEY"),
        )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=os.getenv("LLM_MODEL", "gemini-1.5-flash"),
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

    if provider == "mistral":
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model=os.getenv("LLM_MODEL", "mistral-large-latest"),
            api_key=os.getenv("MISTRAL_API_KEY"),
        )

    if provider == "cohere":
        from langchain_cohere import ChatCohere
        return ChatCohere(
            model=os.getenv("LLM_MODEL", "command-r-plus"),
            cohere_api_key=os.getenv("COHERE_API_KEY"),
        )

    if provider == "together":
        from langchain_together import ChatTogether
        return ChatTogether(
            model=os.getenv("LLM_MODEL", "meta-llama/Llama-3-70b-chat-hf"),
            api_key=os.getenv("TOGETHER_API_KEY"),
        )

    if provider == "fireworks":
        from langchain_fireworks import ChatFireworks
        return ChatFireworks(
            model=os.getenv("LLM_MODEL", "accounts/fireworks/models/llama-v3-70b-instruct"),
            api_key=os.getenv("FIREWORKS_API_KEY"),
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=os.getenv("LLM_MODEL", "llama3"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )

    raise ValueError(
        f"Unknown LLM_PROVIDER '{provider}'. "
        "Choose: groq | anthropic | openai | gemini | mistral | cohere | together | fireworks | ollama"
    )


_llm = _build_llm()

with open(TEMPLATES_PATH) as f:
    LEVEL_TEMPLATES: list[dict] = json.load(f)


def get_template(level: int) -> dict:
    for t in LEVEL_TEMPLATES:
        if t["level"] == level:
            return t
    return LEVEL_TEMPLATES[-1]


# ── Question generation ──────────────────────────────────────────────────────

QUESTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a SQL tutor generating practice questions for SQLite.
Level {level} concept: {concept}
Available tables: {schema_hint}
Table hint: {template}

Rules:
- Generate exactly ONE question. No hints or answers in the question text.
- Must be solvable with standard SQLite syntax.
- Do not repeat any of these prior questions: {prior_questions}
- Return ONLY valid JSON, no markdown, no explanation.
- JSON format: {{"question": "...", "reference_sql": "SELECT ..."}}"""),
    ("human", "Generate a fresh level {level} SQL question."),
])

question_chain = QUESTION_PROMPT | _llm


def generate_question(level: int, history: list[dict]) -> dict:
    tmpl = get_template(level)
    prior = [h["question"] for h in history[-5:]] if history else []
    response = question_chain.invoke({
        "level": level,
        "concept": tmpl["concept"],
        "schema_hint": tmpl["schema_hint"],
        "template": tmpl["template"],
        "prior_questions": prior or "None",
    })
    text = response.content.strip()
    # Strip markdown fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    parsed = json.loads(text)
    parsed["schema_hint"] = tmpl["schema_hint"]
    return parsed


# ── Hint generation ──────────────────────────────────────────────────────────

HINT_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a SQL tutor giving progressive hints. Never reveal the answer.
Question: {question}
Level {level} concept: {concept}
Hints already given: {hints_shown}
User's last SQL attempt: {user_sql}

Rules:
- Each hint must be more specific than the previous.
- Do NOT include the reference SQL or the full answer.
- Be encouraging. One sentence only."""),
    ("human", "Give hint number {hint_number}."),
])

hint_chain = HINT_PROMPT | _llm


def generate_hint(state: dict) -> str:
    tmpl = get_template(state["level"])
    response = hint_chain.invoke({
        "question": state["current_question"],
        "level": state["level"],
        "concept": tmpl["concept"],
        "hints_shown": state["hints_shown"] or "None yet",
        "user_sql": state["user_sql"] or "Not submitted yet",
        "hint_number": len(state["hints_shown"]) + 1,
    })
    return response.content.strip()


# ── Feedback generation ──────────────────────────────────────────────────────

FEEDBACK_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a SQL tutor explaining a wrong answer. Be concise and encouraging.
Question: {question}
User's SQL: {user_sql}
What went wrong: {diff_feedback}

Rules:
- Point to the exact mistake. One paragraph max. No code blocks."""),
    ("human", "Explain what went wrong and how to fix it."),
])

feedback_chain = FEEDBACK_PROMPT | _llm


def generate_feedback(question: str, user_sql: str, diff_feedback: str) -> str:
    response = feedback_chain.invoke({
        "question": question,
        "user_sql": user_sql,
        "diff_feedback": diff_feedback,
    })
    return response.content.strip()
