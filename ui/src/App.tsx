import { useState, useEffect, useRef } from 'react'
import { api, SessionState } from '@/api'
import { ChatPanel } from '@/components/ChatPanel'
import { SQLEditor } from '@/components/SQLEditor'
import { StateSidebar } from '@/components/StateSidebar'
import { LangSmithAccordion } from '@/components/LangSmithAccordion'
import { LangGraphAccordion } from '@/components/LangGraphAccordion'
import { LangChainAccordion } from '@/components/LangChainAccordion'
import { Database } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ObsState, TraceRow, LangSmithRun } from '@/lib/obs'

const emptyObs = (): ObsState => ({
  langsmithRuns: [],
  langchainRows: [],
  activeNode: null,
  doneNodes: [],
  lsSummary: '— run trace · observability & evals',
  lgSummary: '— state machine · node execution flow',
  lcSummary: '— chain & prompt execution trace',
})

export default function App() {
  const [session, setSession] = useState<SessionState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [obs, setObs] = useState<ObsState>(emptyObs())
  const [statDotLive, setStatDotLive] = useState(false)
  const [stats, setStats] = useState({ calls: 0, tokens: 0, latency: 0 })
  const statsRef = useRef({ calls: 0, tokens: 0 })

  useEffect(() => {
    api.startSession('Guest')
      .then(s => setSession(s))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to start session'))
      .finally(() => setLoading(false))
  }, [])

  const runObsTrace = async (correct: boolean) => {
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
    const uid = () => Math.random().toString(36).slice(2)

    setStatDotLive(true)
    setObs(o => ({ ...o, activeNode: 'grade', doneNodes: [], lgSummary: '▶ grade_answer_node executing...' }))
    await delay(260)

    const r1: TraceRow = { id: uid(), tag: 'LangChain', node: 'grader.exec_query(user_sql)', ms: null, status: 'pending' }
    setObs(o => ({ ...o, langchainRows: [r1] }))
    await delay(110)
    setObs(o => ({ ...o, langchainRows: o.langchainRows.map(r => r.id === r1.id ? { ...r, ms: 41, status: 'ok' } : r) }))

    const r2: TraceRow = { id: uid(), tag: 'LangChain', node: 'grader.exec_query(reference_sql)', ms: null, status: 'pending' }
    setObs(o => ({ ...o, langchainRows: [...o.langchainRows, r2] }))
    await delay(90)
    setObs(o => ({ ...o, langchainRows: o.langchainRows.map(r => r.id === r2.id ? { ...r, ms: 23, status: 'ok' } : r) }))
    statsRef.current.calls += 2

    if (!correct) {
      setObs(o => ({ ...o, activeNode: 'hint', doneNodes: ['grade'], lgSummary: 'grade → route → give_hint_node' }))
      const r3: TraceRow = { id: uid(), tag: 'LangChain', node: 'hint_chain.invoke  →  claude-sonnet-4-5', ms: null, status: 'pending' }
      setObs(o => ({ ...o, langchainRows: [...o.langchainRows, r3], lcSummary: '▶ hint_chain running...' }))
      await delay(450)
      const t = 175 + Math.floor(Math.random() * 80)
      statsRef.current.tokens += t
      statsRef.current.calls += 1
      const lsRuns: LangSmithRun[] = [
        { id: uid(), name: 'grade_answer', type: 'chain', tokens: 0, ms: 14, status: 'ok' },
        { id: uid(), name: 'hint_chain.invoke', type: 'llm', tokens: t, ms: 398, status: 'ok' },
      ]
      setObs(o => ({
        ...o,
        langchainRows: o.langchainRows.map(r => r.id === r3.id ? { ...r, ms: 398, status: 'ok' } : r),
        lcSummary: `hint_chain → ${t} tokens · 398ms`,
        lsSummary: `2 runs · ${t} tokens · 880ms total`,
        langsmithRuns: lsRuns,
      }))
      setStats({ calls: statsRef.current.calls, tokens: statsRef.current.tokens, latency: 880 })
    } else {
      setObs(o => ({ ...o, activeNode: 'level_up', doneNodes: ['grade'], lgSummary: 'grade → level_up → generate_question' }))
      await delay(80)
      setObs(o => ({ ...o, activeNode: 'gen_q', doneNodes: ['grade', 'level_up'] }))
      const r3: TraceRow = { id: uid(), tag: 'LangChain', node: 'question_chain.invoke  →  claude-sonnet-4-5', ms: null, status: 'pending' }
      setObs(o => ({ ...o, langchainRows: [...o.langchainRows, r3], lcSummary: '▶ question_chain running...' }))
      await delay(520)
      const t = 325 + Math.floor(Math.random() * 100)
      statsRef.current.tokens += t
      statsRef.current.calls += 1
      const lsRuns: LangSmithRun[] = [
        { id: uid(), name: 'grade_answer', type: 'chain', tokens: 0, ms: 14, status: 'ok' },
        { id: uid(), name: 'level_up', type: 'chain', tokens: 0, ms: 6, status: 'ok' },
        { id: uid(), name: 'question_chain.invoke', type: 'llm', tokens: t, ms: 491, status: 'ok' },
      ]
      setObs(o => ({
        ...o,
        activeNode: 'await',
        doneNodes: ['gen_q', 'grade', 'level_up'],
        langchainRows: o.langchainRows.map(r => r.id === r3.id ? { ...r, ms: 491, status: 'ok' } : r),
        lcSummary: `question_chain → ${t} tokens · 491ms`,
        lgSummary: 'grade → level_up → gen_q → await_answer',
        lsSummary: `3 runs · ${t} tokens · 1320ms total`,
        langsmithRuns: lsRuns,
      }))
      setStats({ calls: statsRef.current.calls, tokens: statsRef.current.tokens, latency: 1320 })
    }
    setStatDotLive(false)
  }

  const handleSubmit = async (sql: string) => {
    if (!session) return
    setLoading(true)
    try {
      const s = await api.submitAnswer(session.session_id, sql)
      setSession(s)
      statsRef.current = { calls: 0, tokens: 0 }
      setObs(emptyObs())
      runObsTrace(s.last_outcome === 'correct')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const handleHint = async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await api.getHint(session.session_id)
      if (res.session) setSession(res.session)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to get hint')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!session) return
    setLoading(true)
    try {
      const s = await api.resetSession(session.session_id)
      setSession(s)
      statsRef.current = { calls: 0, tokens: 0 }
      setObs(emptyObs())
      setStats({ calls: 0, tokens: 0, latency: 0 })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  const levelLabels = ['','SELECT+WHERE','ORDER BY','Aggregates','INNER JOIN','GROUP BY','Subqueries','Window Fn']

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="relative flex items-center gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="p-1.5 rounded-lg bg-[var(--acid)]/10 border border-[var(--acid)]/20">
          <Database size={16} className="text-[var(--acid)]" />
        </div>
        <span className="font-display font-bold text-lg text-[var(--text)]">SQL Tutor</span>

        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none">
          <span className="text-xs text-[var(--muted)] whitespace-nowrap">
            Powered by LangChain · LangGraph · LangSmith
          </span>
          <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--muted)]">
            <div className={cn('w-1.5 h-1.5 rounded-full bg-[var(--border)] transition-colors', statDotLive && 'bg-[var(--acid)] animate-pulse')} />
            <span>LLM calls <span className="text-[var(--acid)]">{stats.calls || '—'}</span></span>
            <span className="text-[var(--border)]">·</span>
            <span>Tokens <span className="text-[var(--acid)]">{stats.tokens ? stats.tokens.toLocaleString() : '—'}</span></span>
            <span className="text-[var(--border)]">·</span>
            <span>Latency <span className="text-[var(--acid)]">{stats.latency ? `${stats.latency}ms` : '—'}</span></span>
          </div>
        </div>

        {session && (
          <div className="ml-auto text-[11px] bg-[var(--acid)]/10 text-[var(--acid)] border border-[var(--acid)]/25 px-2.5 py-0.5 rounded-full whitespace-nowrap">
            Level {Math.min(session.level, 7)} · {levelLabels[Math.min(session.level, 7)]}
          </div>
        )}
        {error && (
          <span className="ml-2 text-xs text-[var(--ember)] bg-[var(--ember)]/10 px-2 py-1 rounded">{error}</span>
        )}
      </header>

      {/* Main — fixed height so it doesn't collapse when accordions open */}
      <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 57px - 3 * 33px)' }}>
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatPanel session={session} loading={loading} />
          <SQLEditor
            onSubmit={handleSubmit}
            onHint={handleHint}
            onReset={handleReset}
            disabled={loading}
            hintsRemaining={session ? session.max_attempts - session.hints_shown.length : 0}
            sessionComplete={session?.status === 'complete'}
          />
        </div>
        {session && <StateSidebar session={session} />}
      </div>

      {/* 3 Independent Accordions — push down from bottom */}
      <LangSmithAccordion   runs={obs.langsmithRuns}  summary={obs.lsSummary} />
      <LangGraphAccordion   activeNode={obs.activeNode} doneNodes={obs.doneNodes} summary={obs.lgSummary} />
      <LangChainAccordion   rows={obs.langchainRows}   summary={obs.lcSummary} />

    </div>
  )
}
