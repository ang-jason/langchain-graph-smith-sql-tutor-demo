import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GRAPH_NODES } from '@/lib/obs'

interface Props {
  activeNode: string | null
  doneNodes: string[]
  summary: string
}

export function LangGraphAccordion({ activeNode, doneNodes, summary }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-[var(--border)] bg-[#141c1a] shrink-0">
      <div
        className="flex items-center gap-2 px-4 py-1.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-[#a58ad4] text-xs">⬡</span>
        <span className="font-display font-bold text-[10px] uppercase tracking-widest text-[#a58ad4]">
          LangGraph
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
        <div className="border-t border-[var(--border)] px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {GRAPH_NODES.map((node, i) => {
              const isActive = node.id === activeNode
              const isDone = doneNodes.includes(node.id)
              return (
                <div key={node.id} className="flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      'px-2 py-1 rounded font-mono text-[9px] border whitespace-nowrap transition-all duration-300',
                      isActive
                        ? 'bg-[#5b3f9e]/35 border-[#7a5abf] text-[#c8a8f0] shadow-[0_0_10px_rgba(91,63,158,0.35)]'
                        : isDone
                        ? 'bg-[var(--acid)]/8 border-[var(--acid)]/30 text-[var(--acid)]'
                        : 'bg-[#1a2422] border-[var(--border)] text-[var(--muted)]/30'
                    )}>
                      {node.box}
                    </div>
                    <span className={cn(
                      'text-[8px] text-center leading-tight max-w-[56px]',
                      isActive ? 'text-[#a58ad4]' : isDone ? 'text-[#00b3b3]' : 'text-[var(--muted)]/20'
                    )}>
                      {node.lbl}
                    </span>
                  </div>
                  {i < GRAPH_NODES.length - 1 && (
                    <span className={cn(
                      'text-[10px] pb-3 shrink-0 transition-colors duration-300',
                      isDone ? 'text-[var(--acid)]' : isActive ? 'text-[#7a5abf]' : 'text-[var(--border)]'
                    )}>→</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
