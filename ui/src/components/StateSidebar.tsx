import { SessionState } from '@/api'
import { Trophy, Target, Clock, ExternalLink, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  session: SessionState
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'SELECT + WHERE',
  2: 'ORDER BY + LIMIT',
  3: 'Aggregates',
  4: 'INNER JOIN',
  5: 'GROUP BY + HAVING',
  6: 'Subqueries',
  7: 'Window Functions',
}

export function StateSidebar({ session }: Props) {
  const progress = ((session.level - 1) / 7) * 100

  return (
    <aside className="flex flex-col gap-5 p-5 border-l border-[var(--border)] min-w-[220px] max-w-[240px]">
      {/* Level */}
      <div>
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-display">Level</p>
        <div className="flex items-end gap-2">
          <span className="font-display text-4xl font-bold text-[var(--acid)]">
            {Math.min(session.level, 7)}
          </span>
          <span className="text-[var(--muted)] text-sm mb-1">/ 7</span>
        </div>
        <p className="text-xs text-[var(--text)] mt-1">{LEVEL_LABELS[Math.min(session.level, 7)]}</p>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--acid)] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]">
        <Trophy size={18} className="text-[var(--acid)]" />
        <div>
          <p className="text-xs text-[var(--muted)]">Score</p>
          <p className="font-display font-bold text-xl text-[var(--text)]">{session.score}</p>
        </div>
      </div>

      {/* Attempts */}
      <div>
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-display">Attempts</p>
        <div className="flex gap-1.5">
          {Array.from({ length: session.max_attempts }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-3 h-3 rounded-full border',
                i < session.attempts
                  ? 'bg-[var(--ember)] border-[var(--ember)]'
                  : 'bg-transparent border-[var(--border)]'
              )}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--muted)] mt-1.5">
          {session.max_attempts - session.attempts} remaining
        </p>
      </div>

      {/* Hints */}
      {session.hints_shown.length > 0 && (
        <div>
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-display">Hints Used</p>
          <p className="text-sm text-[var(--acid)]">{session.hints_shown.length} / {session.max_attempts}</p>
        </div>
      )}

      {/* History */}
      {session.history.length > 0 && (
        <div className="flex-1 min-h-0">
          <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-display">History</p>
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-48">
            {[...session.history].reverse().map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {h.correct
                  ? <CheckCircle size={12} className="text-[var(--acid)] shrink-0" />
                  : <XCircle size={12} className="text-[var(--ember)] shrink-0" />}
                <span className="text-[var(--muted)]">L{h.level}</span>
                <span className="text-[var(--text)] truncate">{h.correct ? `+${h.points}pts` : '0pts'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LangSmith trace */}
      <a
        href={session.langsmith_run_id
          ? `https://smith.langchain.com/runs/${session.langsmith_run_id}`
          : 'https://smith.langchain.com'}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-xs text-[var(--muted)]/40 hover:text-[var(--acid)] transition-colors mt-auto"
      >
        <ExternalLink size={12} />
        {session.langsmith_run_id ? 'View LangSmith trace' : 'Open LangSmith'}
      </a>

      {/* Status badge */}
      {session.status === 'complete' && (
        <div className="p-3 rounded-lg bg-[var(--acid)]/10 border border-[var(--acid)]/30 text-center">
          <Trophy size={20} className="text-[var(--acid)] mx-auto mb-1" />
          <p className="text-xs font-display font-bold text-[var(--acid)]">Complete!</p>
          <p className="text-xs text-[var(--muted)]">Final score: {session.score}</p>
        </div>
      )}
    </aside>
  )
}
