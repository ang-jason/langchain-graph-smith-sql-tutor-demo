import { useState, useRef } from 'react'
import { Play, Lightbulb, RotateCcw, Code2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onSubmit: (sql: string) => void
  onHint: () => void
  onReset: () => void
  onClearRequest?: (cb: () => void) => void
  disabled: boolean
  hintsRemaining: number
  sessionComplete: boolean
  referenceSql?: string
}

const SYNTAX_GROUPS = [
  {
    title: 'SELECT + WHERE',
    items: [
      { label: 'Filter rows', code: 'SELECT * FROM employees WHERE is_active = 1' },
      { label: 'Select specific columns', code: 'SELECT name, email FROM employees WHERE department_id = 1' },
    ],
  },
  {
    title: 'ORDER BY + LIMIT',
    items: [
      { label: 'Top N rows', code: 'SELECT name FROM employees ORDER BY hire_date DESC LIMIT 5' },
    ],
  },
  {
    title: 'Aggregates',
    items: [
      { label: 'COUNT, AVG, SUM', code: 'SELECT COUNT(*), AVG(amount), SUM(amount)\nFROM salaries' },
    ],
  },
  {
    title: 'JOIN',
    items: [
      {
        label: 'INNER JOIN with alias',
        code: 'SELECT e.name, d.name AS department\nFROM employees e\nJOIN departments d ON e.department_id = d.id\nWHERE e.is_active = 1',
      },
    ],
  },
  {
    title: 'GROUP BY + HAVING',
    items: [
      {
        label: 'Group and filter groups',
        code: 'SELECT department_id, COUNT(*) AS total\nFROM employees\nGROUP BY department_id\nHAVING total > 3',
      },
    ],
  },
  {
    title: 'Subqueries',
    items: [
      {
        label: 'Filter using subquery',
        code: 'SELECT name FROM employees\nWHERE id IN (\n  SELECT employee_id FROM salaries WHERE amount > 100000\n)',
      },
    ],
  },
  {
    title: 'Window Functions',
    items: [
      {
        label: 'RANK() over partition',
        code: 'SELECT name, amount,\n  RANK() OVER (ORDER BY amount DESC) AS salary_rank\nFROM employees e\nJOIN salaries s ON e.id = s.employee_id',
      },
    ],
  },
]

export function SQLEditor({
  onSubmit, onHint, onReset, disabled,
  hintsRemaining, sessionComplete, referenceSql,
}: Props) {
  const [sql, setSql] = useState('')
  const [syntaxOpen, setSyntaxOpen] = useState(false)
  const [answerVisible, setAnswerVisible] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Expose clear method via imperative handle pattern
  const clearEditor = () => setSql('')

  const handleSubmit = () => {
    const trimmed = sql.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current!
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newVal = sql.substring(0, start) + '  ' + sql.substring(end)
      setSql(newVal)
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2 })
    }
    if (e.key === 'Escape') setSyntaxOpen(false)
  }

  const insertSnippet = (code: string) => {
    setSql(code)
    setSyntaxOpen(false)
    textareaRef.current?.focus()
  }

  return (
    <>
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

          {/* Run */}
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
            <Play size={14} /> Run
          </button>

          {/* Hint */}
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
            <Lightbulb size={14} /> Hint ({hintsRemaining})
          </button>

          {/* Syntax */}
          <button
            onClick={() => setSyntaxOpen(o => !o)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              'border transition-all',
              syntaxOpen
                ? 'border-[#5b3f9e] text-[#c8a8f0] bg-[#5b3f9e]/10'
                : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)]/30'
            )}
          >
            <Code2 size={14} /> Syntax
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
              'border border-[var(--border)] text-[var(--muted)]',
              'hover:text-[var(--ember)] hover:border-[var(--ember)]/30 transition-all'
            )}
          >
            <RotateCcw size={14} /> Reset
          </button>

          {/* Show Answer — far right */}
          <div className="relative ml-auto">
            <button
              onMouseEnter={() => setAnswerVisible(true)}
              onMouseLeave={() => setAnswerVisible(false)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                'border border-[var(--border)] text-[var(--muted)]/40',
                'hover:text-[#c8a8f0] hover:border-[#5b3f9e]/40 transition-all'
              )}
            >
              <Eye size={14} /> Answer
            </button>

            {/* Hover tooltip */}
            {answerVisible && (
              <div className="absolute bottom-[calc(100%+8px)] right-0 z-50 min-w-[280px] max-w-[360px] bg-[#1a2422] border border-[#5b3f9e] rounded-lg p-3 shadow-xl">
                <p className="text-[9px] font-display font-bold text-[#a58ad4] uppercase tracking-widest mb-2">
                  Reference SQL
                </p>
                <code className="font-mono text-[11px] text-[#c8a8f0] leading-relaxed whitespace-pre-wrap">
                  {referenceSql || 'Submit an answer first to reveal.'}
                </code>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Syntax Modal */}
      {syntaxOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setSyntaxOpen(false) }}
        >
          <div className="bg-[#1a2422] border border-[var(--border)] rounded-xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] shrink-0">
              <span className="font-display font-bold text-sm text-[var(--text)]">
                <Code2 size={14} className="inline mr-2 text-[var(--acid)]" />
                SQL Syntax Reference
              </span>
              <button
                onClick={() => setSyntaxOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--text)] text-lg leading-none px-1"
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-4 flex flex-col gap-4">
              {SYNTAX_GROUPS.map(group => (
                <div key={group.title}>
                  <p className="text-[10px] font-display font-bold text-[var(--acid)] uppercase tracking-widest mb-2">
                    {group.title}
                  </p>
                  <div className="flex flex-col gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.label}
                        onClick={() => insertSnippet(item.code)}
                        className="text-left bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 hover:border-[#5b3f9e] transition-colors group"
                      >
                        <p className="text-xs text-[var(--muted)] mb-1.5">{item.label}</p>
                        <code className="font-mono text-[11px] text-[#c8a8f0] leading-relaxed whitespace-pre">
                          {item.code}
                        </code>
                        <p className="text-[10px] text-[var(--muted)]/30 mt-1.5 group-hover:text-[var(--muted)] transition-colors">
                          Click to insert →
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  )
}
