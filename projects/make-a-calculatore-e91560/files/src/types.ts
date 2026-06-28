export type CalculatorState = 'inputting' | 'result' | 'operator' | 'error';

export type Operator = '+' | '-' | '×' | '÷';

export interface HistoryEntry {
  expression: string;
  result: string;
}

export interface CalculatorData {
  currentValue: string;
  previousValue: string;
  operator: Operator | null;
  expression: string;
  state: CalculatorState;
  history: HistoryEntry[];
  errorMessage: string | null;
}

export type Theme = 'light' | 'dark';

export interface ButtonConfig {
  label: string;
  value: string;
  type: 'digit' | 'operator' | 'function' | 'equals' | 'clear';
  span?: 1 | 2;
}
