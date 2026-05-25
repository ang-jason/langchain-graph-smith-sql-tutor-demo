import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TraceRow } from '@/lib/obs'

interface Props {
  rows: TraceRow[]
  summary: string
}

export function LangChainAccordion({ rows, summary }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-[var(--border)] bg-[#141c1a] shrink-0">
      <div
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[var(--acid)] text-xs">⬢</span>
        <span className="font-display font-bold text-[10px] uppercase tracking-widest text-[var(--acid)]">
          LangChain
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
          {rows.length === 0 ? (
            <p className="font-mono text-[10px] text-[var(--muted)]/30">No runs yet. Submit SQL to trace.</p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {rows.map(row => (
                <div key={row.id} className="flex items-center gap-2 py-0.5">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    row.status === 'ok' ? 'bg-[var(--acid)]' :
                    row.status === 'pending' ? 'bg-[#5b3f9e] animate-pulse' : 'bg-[var(--ember)]'
                  )} />
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded border shrink-0',
                    'bg-[var(--acid)]/8 text-[var(--acid)] border-[var(--acid)]/20'
                  )}>
                    LangChain
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text)] flex-1">{row.node}</span>
                  <span className={cn(
                    'font-mono text-[10px] shrink-0',
                    row.status === 'pending' ? 'text-[var(--muted)]/30' : 'text-[var(--muted)]'
                  )}>
                    {row.status === 'pending' ? '...' : `${row.ms}ms`}
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
