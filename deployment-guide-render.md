# Render Deployment Guide

> Deploy `langchain-graph-smith-sql-tutor-demo` on Render — frontend + backend on a single platform.

---

## Prerequisites

- GitHub account
- Render account — [render.com](https://render.com) (free)
- LLM API key — Groq recommended (free, no credit card) → [console.groq.com](https://console.groq.com)

---

## Repository Structure

Render uses the **Root Directory** setting to know which part of the repo belongs to which service.

```
langchain-graph-smith-sql-tutor-demo/  ← repo root
├── agent/
├── api/
├── data/
├── run.py
├── pyproject.toml          ← backend lives HERE (root)
└── ui/
    ├── package.json        ← frontend lives HERE (ui/)
    ├── vite.config.ts
    └── src/
```

| Service | Root Directory | What Render sees |
|---|---|---|
| Backend (Web Service) | *(empty)* | Repo root — finds `pyproject.toml`, runs `uv sync` |
| Frontend (Static Site) | `ui` | Only `ui/` folder — finds `package.json`, runs npm build |

---

## Step 1 — Push to GitHub

```bash
cd sql-tutor
git init
git add .
git commit -m "initial commit"
```

Go to [github.com](https://github.com) → **New repository** → name it:
```
langchain-graph-smith-sql-tutor-demo
```

Then push:

```bash
git remote add origin https://github.com/ang-jason/langchain-graph-smith-sql-tutor-demo.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy Backend (Web Service)

1. Go to render.com → **New** → **Web Service**
2. Connect your GitHub account → select the repo
3. Fill in settings:

| Field | Value |
|---|---|
| Name | `sql-tutor-backend` |
| Region | Singapore (Southeast Asia) |
| Branch | `main` |
| Root Directory | *(leave empty)* |
| Runtime | `Python` |
| Build Command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start Command | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| Start Command | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

4. Scroll to **Environment Variables** → Add:

| Key | Value | Required |
|---|---|---|
| `LLM_PROVIDER` | `groq` | ✅ |
| `GROQ_API_KEY` | `your-groq-key` | ✅ |
| `DATABASE_PATH` | `./data/sample.db` | ✅ |
| `FRONTEND_URL` | *(leave blank — fill after Step 3)* | ✅ |
| `LANGCHAIN_API_KEY` | `your-langsmith-key` | Optional |
| `LANGCHAIN_TRACING_V2` | `true` | Optional |
| `LANGCHAIN_PROJECT` | `sql-tutor` | Optional |

5. Click **Create Web Service**
6. Wait for deploy → note your backend URL:
```
https://sql-tutor-backend.onrender.com
```

---

## Step 3 — Deploy Frontend (Static Site)

1. Go to render.com → **New** → **Static Site**
2. Connect same repo
3. Fill in settings:

| Field | Value |
|---|---|
| Name | `sql-tutor-frontend` |
| Branch | `main` |
| Root Directory | `ui` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. Scroll to **Environment Variables** → Add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://sql-tutor-backend.onrender.com` |

5. Click **Create Static Site**
6. Wait for deploy → note your frontend URL:
```
https://sql-tutor-frontend.onrender.com
```

---

## Step 4 — Wire Backend CORS

1. Go back to **sql-tutor-backend** → **Environment**
2. Add the frontend URL now that you have it:

| Key | Value |
|---|---|
| `FRONTEND_URL` | `https://sql-tutor-frontend.onrender.com` |

3. Click **Save** → backend auto-redeploys

---

## Step 5 — Verify

Open frontend in browser:
```
https://sql-tutor-frontend.onrender.com
```

Check backend health endpoint:
```
https://sql-tutor-backend.onrender.com/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "connected",
  "langsmith": "not configured",
  "claude_api": "missing key"
}
```

---

## Environment Variables Reference

### Backend (Web Service)

| Key | Description | Required |
|---|---|---|
| `LLM_PROVIDER` | LLM provider — `groq`, `anthropic`, `openai`, etc. | ✅ |
| `GROQ_API_KEY` | Groq API key (if using Groq) | ✅ |
| `FRONTEND_URL` | Full URL of Render frontend static site | ✅ |
| `DATABASE_PATH` | SQLite file path | ✅ |
| `LANGCHAIN_API_KEY` | LangSmith API key | Optional |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing | Optional |
| `LANGCHAIN_PROJECT` | LangSmith project name | Optional |

### Frontend (Static Site)

| Key | Description | Required |
|---|---|---|
| `VITE_API_URL` | Full URL of Render backend web service | ✅ |

---

## How the URL Routing Works

```
Local development:
  VITE_API_URL not set → '' + '/api/v1' → Vite proxy → localhost:8000

Render production:
  VITE_API_URL=https://sql-tutor-backend.onrender.com
  → https://sql-tutor-backend.onrender.com/api/v1
```

No code changes needed between environments — purely driven by env vars.

---

## Free Tier Caveats

| Issue | Detail | Fix |
|---|---|---|
| Cold start | Backend sleeps after 15min inactivity, ~30s wake time | Upgrade to $7/mo paid instance |
| SQLite resets | Ephemeral disk — DB auto-recreates from `seed.sql` on redeploy | Fine for demo |
| 750 hrs/month | Free tier limit across all Render services | Fine for 1 app |

---

## Troubleshooting

### Build Errors

| Error | Cause | Fix |
|---|---|---|
| `uv: command not found` | Render doesn't have uv pre-installed | Build command: `pip install --upgrade pip && pip install -r requirements.txt` |
| `Preparing metadata (pyproject.toml): error` | pip trying to build a package from source (needs Rust/Cargo) | Remove `pyproject.toml` from repo root; keep only `requirements.txt` |
| `failed to create directory /usr/local/cargo/registry` | A dependency has no pre-built wheel, triggers Rust source build | Remove version-pinned providers from `requirements.txt`; keep only `langchain-groq` |
| `ResolutionImpossible` | Version pins conflict with each other | Remove all version pins — let pip resolve freely |
| `Could not find a version that satisfies pydantic-core==x.x.x` | pip version too old to find newer wheels | Add `pip install --upgrade pip` before `pip install -r requirements.txt` |
| `Failed to build pydantic-core` | Render free tier has read-only Rust cache | Upgrade pip first; remove explicit `pydantic` pin from `requirements.txt` |

### Deploy / Runtime Errors

| Error | Cause | Fix |
|---|---|---|
| `Exited with status 1` (no logs) | `reload=True` in uvicorn causes silent crash on Render | Use start command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |
| `ImportError: cannot import name 'sessions' from 'agent'` | Wrong import path in `api/routers/session.py` | Change `from agent import sessions` → `from api import sessions` |
| Backend returns 502 | Cold start (free tier sleeping) | Wait 30s and refresh; upgrade to $7/mo to avoid |
| CORS error in browser | `FRONTEND_URL` not set on backend | Add `FRONTEND_URL=https://your-frontend.onrender.com` to backend env vars |
| DB not found | Wrong path | Ensure `DATABASE_PATH=./data/sample.db` in env vars |
| Blank frontend | `VITE_API_URL` missing | Add `VITE_API_URL=https://your-backend.onrender.com` to static site env vars |
| Health shows `missing key` | LLM key not set | Add `GROQ_API_KEY` to backend env vars |

### Correct Final Settings

| Field | Value |
|---|---|
| Build command | `pip install --upgrade pip && pip install -r requirements.txt` |
| Start command | `uvicorn api.main:app --host 0.0.0.0 --port $PORT` |

---

## Redeploy

Any push to `main` triggers automatic redeploy of both services.

```bash
git add .
git commit -m "your change"
git push
```

Render picks up changes within ~2 minutes.
