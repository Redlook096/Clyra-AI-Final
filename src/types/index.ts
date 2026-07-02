export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface CalculatorState {
  display: string;
  expression: string;
  operand: string;
  operator: string | null;
  previousOperand: string;
  memory: number;
  angleMode: "deg" | "rad";
  history: HistoryEntry[];
  isResult: boolean;
  error: string | null;
  historyOpen: boolean;
}

export type CalculatorAction =
  | { type: "INPUT_NUMBER"; payload: string }
  | { type: "INPUT_DECIMAL" }
  | { type: "SET_OPERATOR"; payload: string }
  | { type: "COMPUTE" }
  | { type: "CLEAR" }
  | { type: "CLEAR_ALL" }
  | { type: "DELETE" }
  | { type: "TOGGLE_SIGN" }
  | { type: "PERCENT" }
  | { type: "SCIENCE_FN"; payload: string }
  | { type: "POWER" }
  | { type: "SQUARE" }
  | { type: "CUBE" }
  | { type: "RECIPROCAL" }
  | { type: "SQRT" }
  | { type: "FACTORIAL" }
  | { type: "PI" }
  | { type: "EULER" }
  | { type: "EXPT" }
  | { type: "OPEN_PAREN" }
  | { type: "CLOSE_PAREN" }
  | { type: "MEMORY_CLEAR" }
  | { type: "MEMORY_RECALL" }
  | { type: "MEMORY_PLUS" }
  | { type: "MEMORY_MINUS" }
  | { type: "TOGGLE_ANGLE_MODE" }
  | { type: "TOGGLE_HISTORY" }
  | { type: "RESTORE_HISTORY"; payload: HistoryEntry }
  | { type: "CLEAR_HISTORY" }
  | { type: "SET_ERROR"; payload: string | null };

export type KeyType = "number" | "operator" | "scientific" | "memory" | "utility" | "equals";

export interface KeyDef {
  label: string;
  action: CalculatorAction;
  type: KeyType;
  keyboard?: string;
  span?: number;
}
