export type Operator = '+' | '-' | '×' | '÷'

export interface HistoryEntry {
  expression: string
  result: string
}

export interface CalcState {
  currentValue: string
  previousValue: string | null
  operator: Operator | null
  expression: string
  history: HistoryEntry[]
  overwrite: boolean
}
