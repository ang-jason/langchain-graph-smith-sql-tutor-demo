const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api/v1'

export interface SessionState {
  session_id: string
  user_name: string
  level: number
  score: number
  status: 'awaiting_answer' | 'complete'
  current_question: string
  schema_hint: string
  attempts: number
  max_attempts: number
  hints_shown: string[]
  last_outcome: 'correct' | 'wrong' | 'sql_error' | null
  last_result: Record<string, unknown>[]
  last_feedback: string | null
  history: HistoryEntry[]
  langsmith_run_id: string | null
}

export interface HistoryEntry {
  level: number
  question: string
  user_sql: string
  correct: boolean
  attempts: number
  points: number
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || res.statusText)
  }
  return res.json()
}

export const api = {
  startSession: (userName: string, startLevel = 1) =>
    request<SessionState>('/session/start', {
      method: 'POST',
      body: JSON.stringify({ user_name: userName, start_level: startLevel }),
    }),

  getSession: (sessionId: string) =>
    request<SessionState>(`/session/${sessionId}`),

  submitAnswer: (sessionId: string, userSql: string) =>
    request<SessionState>('/answer/submit', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, user_sql: userSql }),
    }),

  getHint: (sessionId: string) =>
    request<{ hint: string | null; hints_remaining: number; session?: SessionState }>(
      `/hint/${sessionId}`
    ),

  resetSession: (sessionId: string) =>
    request<SessionState>('/session/reset', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),

  health: () => request<{ status: string; db: string; langsmith: string; claude_api: string }>('/health'),
}
