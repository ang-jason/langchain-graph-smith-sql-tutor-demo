import { useState } from 'react'
import { SessionState, HistoryEntry } from '@/api'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react'

interface Props {
  session: SessionState | null
  loading: boolean
}

function HistoryTab({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm">
        No questions completed yet.
      </div>
    )
  }

  const totalPts = history.reduce((sum, h) => sum + (h.points ?? 0), 0)
  const correct = history.filter(h => h.correct).length

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs text-[var(--muted)] pb-1 border-b border-[var(--border)]">
        <span>{history.length} question{history.length !== 1 ? 's' : ''} completed</span>
        <span>·</span>
        <span>{correct} correct</span>
        <span>·</span>
        <span className="text-[var(--acid)]">{totalPts} pts</span>
      </div>

      {/* History items — newest first */}
      {[...history].reverse().map((h, i) => (
        <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {h.correct
              ? <CheckCircle size={13} className="text-[var(--acid)] shrink-0" />
              : <XCircle size={13} className="text-[var(--ember)] shrink-0" />}
            <span className="text-[10px] font-display font-bold text-[var(--muted)] uppercase tracking-widest">
              Level {h.level}
            </span>
            <span className={cn(
              'ml-auto text-xs font-display font-bold',
              h.correct ? 'text-[var(--acid)]' : 'text-[var(--ember)]'
            )}>
              {h.correct ? `+${h.points ?? 0} pts` : '0 pts'}
            </span>
          </div>
          <p className="text-xs text-[var(--text)] mb-2 leading-relaxed">{h.question}</p>
          {h.user_sql && (
            <code className="block font-mono text-[10px] text-[var(--muted)] bg-[var(--surface-2)] px-2 py-1.5 rounded overflow-x-auto whitespace-nowrap">
              {h.user_sql}
            </code>
          )}
        </div>
      ))}
    </div>
  )
}

export function ChatPanel({ session, loading }: Props) {
  const [tab, setTab] = useState<'session' | 'history'>('session')

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--muted)]">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-[var(--text)] mb-2">SQL Tutor</p>
          <p className="text-sm">Starting session...</p>
        </div>
      </div>
    )
  }

  const outcome = session.last_outcome
  const feedback = session.last_feedback
  const historyCount = session.history.length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Tab bar */}
      <div className="flex bg-[var(--surface-2)] border-b border-[var(--border)] shrink-0">
        <button
          onClick={() => setTab('session')}
          className={cn(
            'px-4 py-2 text-xs font-display font-bold uppercase tracking-widest border-b-2 transition-colors',
            tab === 'session'
              ? 'text-[var(--acid)] border-[var(--acid)]'
              : 'text-[var(--muted)] border-transparent hover:text-[var(--text)]'
          )}
        >
          Session
        </button>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'px-4 py-2 text-xs font-display font-bold uppercase tracking-widest border-b-2 transition-colors',
            tab === 'history'
              ? 'text-[var(--acid)] border-[var(--acid)]'
              : 'text-[var(--muted)] border-transparent hover:text-[var(--text)]'
          )}
        >
          History {historyCount > 0 && `(${historyCount})`}
        </button>
      </div>

      {/* History tab */}
      {tab === 'history' && (
        <HistoryTab history={session.history} />
      )}

      {/* Session tab */}
      {tab === 'session' && (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-5">

          {/* Question */}
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-display font-bold text-[var(--acid)] uppercase tracking-widest">
                Level {Math.min(session.level, 7)} Question
              </span>
            </div>
            <p className="text-[var(--text)] leading-relaxed">{session.current_question}</p>
          </div>

          {/* Schema hint */}
          {session.schema_hint && (
            <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-1.5 font-display">Schema</p>
              <code className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                {session.schema_hint.split('\n').map((line, i) => {
                  const m = line.match(/^(\w+)(\(.+\))$/)
                  return m ? (
                    <span key={i}>
                      <span style={{ color: '#c8a8f0', fontWeight: 500 }}>{m[1]}</span>
                      <span className="text-[var(--acid)]/70">{m[2]}</span>
                      {'\n'}
                    </span>
                  ) : (
                    <span key={i} className="text-[var(--acid)]/70">{line}{'\n'}</span>
                  )
                })}
              </code>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div className={cn(
              'p-4 rounded-xl border flex gap-3',
              outcome === 'correct'
                ? 'bg-[var(--acid)]/5 border-[var(--acid)]/20'
                : 'bg-[var(--ember)]/5 border-[var(--ember)]/20'
            )}>
              {outcome === 'correct'
                ? <CheckCircle size={18} className="text-[var(--acid)] shrink-0 mt-0.5" />
                : <XCircle size={18} className="text-[var(--ember)] shrink-0 mt-0.5" />}
              <p className={cn(
                'text-sm leading-relaxed',
                outcome === 'correct' ? 'text-[var(--acid)]' : 'text-[var(--ember)]'
              )}>
                {feedback}
              </p>
            </div>
          )}

          {/* Hints */}
          {session.hints_shown.length > 0 && (
            <div className="flex flex-col gap-2">
              {session.hints_shown.map((hint, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <Lightbulb size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--text)]">
                    <span className="text-[var(--muted)] text-xs mr-2">Hint {i + 1}</span>
                    {hint}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Result preview */}
          {session.last_result.length > 0 && (
            <div>
              <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-display">
                Your Result ({session.last_result.length} row{session.last_result.length !== 1 ? 's' : ''})
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="text-xs font-mono w-full">
                  <thead>
                    <tr className="bg-[var(--surface-2)]">
                      {Object.keys(session.last_result[0]).map(col => (
                        <th key={col} className="px-3 py-2 text-left text-[var(--muted)] font-medium border-b border-[var(--border)]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {session.last_result.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/50">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-[var(--text)]">
                            {String(val ?? 'NULL')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-[var(--muted)] text-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-[var(--acid)] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              Thinking...
            </div>
          )}

          {/* Complete */}
          {session.status === 'complete' && (
            <div className="p-5 rounded-xl bg-[var(--acid)]/10 border border-[var(--acid)]/30 text-center">
              <p className="font-display text-2xl font-bold text-[var(--acid)] mb-1">🎉 Session Complete!</p>
              <p className="text-[var(--text)]">Final score: <strong className="text-[var(--acid)]">{session.score}</strong></p>
              <p className="text-sm text-[var(--muted)] mt-1">
                {session.history.filter(h => h.correct).length} / {session.history.length} correct
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
