import { useState, useRef } from 'react'
import { Play, Lightbulb, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSubmit: (sql: string) => void
  onHint: () => void
  onReset: () => void
  disabled: boolean
  hintsRemaining: number
  sessionComplete: boolean
}

export function SQLEditor({ onSubmit, onHint, onReset, disabled, hintsRemaining, sessionComplete }: Props) {
  const [sql, setSql] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    const trimmed = sql.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = sql.substring(0, start) + '  ' + sql.substring(end)
      setSql(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  return (
    <div className="flex flex-col border-t border-[var(--border)] bg-[var(--surface)]">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
        <span className="text-xs font-display font-bold text-[var(--muted)] uppercase tracking-widest">
          SQL Editor
        </span>
        <span className="text-xs text-[var(--muted)] font-mono">⌘↵ to run</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={sql}
        onChange={e => setSql(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sessionComplete}
        placeholder={sessionComplete ? 'Session complete.' : 'Write your SQL here...'}
        spellCheck={false}
        rows={5}
        className={cn(
          'w-full resize-none bg-transparent px-4 py-3',
          'font-mono text-sm text-[var(--text)] leading-relaxed',
          'placeholder:text-[var(--muted)]/40',
          'outline-none border-none',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      />

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)]">
        <button
          onClick={handleSubmit}
          disabled={disabled || !sql.trim() || sessionComplete}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-bold',
            'bg-[var(--acid)] text-[var(--bg)] transition-all',
            'hover:bg-[var(--acid)]/90 active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100'
          )}
        >
          <Play size={14} />
          Run
        </button>

        <button
          onClick={onHint}
          disabled={disabled || hintsRemaining === 0 || sessionComplete}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'border border-[var(--border)] text-[var(--muted)]',
            'hover:text-[var(--text)] hover:border-[var(--text)]/30 transition-all',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          <Lightbulb size={14} />
          Hint ({hintsRemaining})
        </button>

        <button
          onClick={onReset}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm ml-auto',
            'border border-[var(--border)] text-[var(--muted)]',
            'hover:text-[var(--ember)] hover:border-[var(--ember)]/30 transition-all'
          )}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  )
}
