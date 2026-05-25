export interface TraceRow {
  id: string
  tag: 'LangChain' | 'LangGraph'
  node: string
  ms: number | null
  status: 'pending' | 'ok' | 'err'
}

export interface LangSmithRun {
  id: string
  name: string
  type: 'llm' | 'chain' | 'tool'
  tokens: number
  ms: number
  status: 'ok' | 'pending' | 'err'
}

export interface ObsState {
  langsmithRuns: LangSmithRun[]
  langchainRows: TraceRow[]
  activeNode: string | null
  doneNodes: string[]
  lsSummary: string
  lgSummary: string
  lcSummary: string
}

export const GRAPH_NODES = [
  { id: 'gen_q',    box: 'gen_q',   lbl: 'generate question' },
  { id: 'await',    box: 'await',   lbl: 'await answer' },
  { id: 'grade',    box: 'grade',   lbl: 'grade answer' },
  { id: 'branch',   box: 'route',   lbl: 'route logic' },
  { id: 'hint',     box: 'hint',    lbl: 'give hint' },
  { id: 'level_up', box: 'lvl_up',  lbl: 'level up' },
  { id: 'complete', box: 'done',    lbl: 'complete' },
]
