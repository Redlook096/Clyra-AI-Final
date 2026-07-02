export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type AngleMode = 'DEG' | 'RAD';

export interface CalculatorState {
  display: string;
  expression: string;
  result: string;
  memory: number | null;
  angleMode: AngleMode;
  isHistoryOpen: boolean;
  history: HistoryEntry[];
  isScientificMode: boolean;
  isSecondFn: boolean;
  hasMemory: boolean;
  error: string | null;
  justEvaluated: boolean;
}

export type ButtonAction =
  | { type: 'digit'; value: string }
  | { type: 'operator'; value: string }
  | { type: 'function'; value: string }
  | { type: 'constant'; value: string }
  | { type: 'memory'; value: string }
  | { type: 'control'; value: string }
  | { type: 'angle' }
  | { type: 'second' };

export interface ButtonDef {
  label: string;
  label2?: string; // second function label
  action: ButtonAction;
  span?: number;
  variant?: 'number' | 'operator' | 'function' | 'memory' | 'equals' | 'clear';
}
