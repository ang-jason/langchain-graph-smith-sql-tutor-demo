import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LangSmithRun } from '@/lib/obs'

interface Props {
  runs: LangSmithRun[]
  summary: string
}

export function LangSmithAccordion({ runs, summary }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-[var(--border)] bg-[#141c1a] shrink-0">
      <div
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[#e8a020] text-xs">◈</span>
        <span className="font-display font-bold text-[10px] uppercase tracking-widest text-[#e8a020]">
          LangSmith
        </span>
        <span className="font-mono text-[10px] text-[var(--muted)]/40 ml-1.5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {summary}
        </span>
        <ChevronDown
          size={12}
          className={cn('text-[var(--muted)]/30 transition-transform duration-200 shrink-0', open && 'rotate-180')}
        />
      </div>

      {open && (
        <div className="border-t border-[var(--border)] px-4 py-2 max-h-48 overflow-y-auto">
          {runs.length === 0 ? (
            <p className="font-mono text-[10px] text-[var(--muted)]/30">No runs yet. Submit SQL to populate.</p>
          ) : (
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-2 pb-1 mb-1 border-b border-[var(--border)]">
                <span className="font-mono text-[9px] text-[var(--muted)]/30 w-2"></span>
                <span className="font-mono text-[9px] text-[var(--muted)]/30 flex-1">run name</span>
                <span className="font-mono text-[9px] text-[var(--muted)]/30 w-12">type</span>
                <span className="font-mono text-[9px] text-[var(--muted)]/30 w-16 text-right">tokens</span>
                <span className="font-mono text-[9px] text-[var(--muted)]/30 w-12 text-right">latency</span>
              </div>
              {runs.map(r => (
                <div key={r.id} className="flex items-center gap-2 py-1 border-b border-[var(--border)]/40 last:border-0">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    r.status === 'ok' ? 'bg-[var(--acid)]' :
                    r.status === 'pending' ? 'bg-[#e8a020] animate-pulse' : 'bg-[var(--ember)]'
                  )} />
                  <span className="font-mono text-[10px] text-[var(--text)] flex-1">{r.name}</span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                    r.type === 'llm'
                      ? 'bg-[#e8a020]/10 text-[#e8a020] border-[#e8a020]/25'
                      : 'bg-[var(--acid)]/8 text-[var(--acid)] border-[var(--acid)]/20'
                  )}>
                    {r.type}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)] w-16 text-right shrink-0">
                    {r.tokens > 0 ? `${r.tokens} tok` : '—'}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)] w-12 text-right shrink-0">
                    {r.ms}ms
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
