import { ButtonDef } from '../types/calculator';

export const BUTTONS: ButtonDef[] = [
  // Row 0
  { label: '2nd',  action: { type: 'second' }, variant: 'function' },
  { label: 'π',    action: { type: 'constant', value: 'π' }, variant: 'function' },
  { label: 'e',    action: { type: 'constant', value: 'e' }, variant: 'function' },
  { label: 'C',    action: { type: 'control', value: 'clear' }, variant: 'clear' },
  { label: '⌫',   action: { type: 'control', value: 'backspace' }, variant: 'clear' },
  { label: '÷',    action: { type: 'operator', value: '/' }, variant: 'operator' },
  // Row 1
  { label: 'x²',   action: { type: 'function', value: 'square' }, variant: 'function' },
  { label: '√',    action: { type: 'function', value: 'sqrt' }, variant: 'function' },
  { label: 'x³',   action: { type: 'function', value: 'cube' }, variant: 'function' },
  { label: '∛',    action: { type: 'function', value: 'cbrt' }, variant: 'function' },
  { label: '×',    action: { type: 'operator', value: '*' }, variant: 'operator' },
  { label: '%',    action: { type: 'function', value: '%' }, variant: 'function' },
  // Row 2
  { label: 'xʸ',   action: { type: 'function', value: 'pow' }, variant: 'function' },
  { label: '10ˣ',  action: { type: 'function', value: 'tenpow' }, variant: 'function' },
  { label: 'log',  action: { type: 'function', value: 'log' }, variant: 'function' },
  { label: 'ln',   action: { type: 'function', value: 'ln' }, variant: 'function' },
  { label: '−',    action: { type: 'operator', value: '-' }, variant: 'operator' },
  { label: '±',    action: { type: 'function', value: 'negate' }, variant: 'function' },
  // Row 3 — toggle labels via isSecondFn
  { label: 'sin',   label2: 'sin⁻¹', action: { type: 'function', value: 'sin' }, variant: 'function' },
  { label: 'cos',   label2: 'cos⁻¹', action: { type: 'function', value: 'cos' }, variant: 'function' },
  { label: 'tan',   label2: 'tan⁻¹', action: { type: 'function', value: 'tan' }, variant: 'function' },
  { label: 'x!',    action: { type: 'function', value: 'factorial' }, variant: 'function' },
  { label: '+',     action: { type: 'operator', value: '+' }, variant: 'operator' },
  { label: '=',     action: { type: 'control', value: 'evaluate' }, variant: 'equals' },
  // Row 4 — when secondFn shows asin/acos/atan; normally shows sin/cos/tan
  { label: 'sin⁻¹', label2: 'sin', action: { type: 'function', value: 'asin' }, variant: 'function' },
  { label: 'cos⁻¹', label2: 'cos', action: { type: 'function', value: 'acos' }, variant: 'function' },
  { label: 'tan⁻¹', label2: 'tan', action: { type: 'function', value: 'atan' }, variant: 'function' },
  { label: '(',     action: { type: 'control', value: '(' }, variant: 'function' },
  { label: ')',     action: { type: 'control', value: ')' }, variant: 'function' },
  { label: 'EXP',   action: { type: 'function', value: 'exp' }, variant: 'function' },
  // Row 5
  { label: 'MC', action: { type: 'memory', value: 'MC' }, variant: 'memory' },
  { label: 'MR', action: { type: 'memory', value: 'MR' }, variant: 'memory' },
  { label: 'M+', action: { type: 'memory', value: 'M+' }, variant: 'memory' },
  { label: 'M−', action: { type: 'memory', value: 'M-' }, variant: 'memory' },
  { label: 'DEG', action: { type: 'angle' }, variant: 'function' },
  { label: 'RAD', action: { type: 'angle' }, variant: 'function' },
];

// Digit buttons for number pad
export const DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.'];

export const KEYBOARD_MAP: Record<string, string> = {
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '.': '.',
  '+': '+', '-': '-', '*': '*', '/': '/',
  'Enter': '=',
  '=': '=',
  'Backspace': '⌫',
  'Delete': 'C',
  'Escape': 'C',
  '(': '(', ')': ')',
  'p': 'π',
  'e': 'e',
  's': 'sin',
  'c': 'cos',
  't': 'tan',
  'l': 'log',
  'n': 'ln',
  '%': '%',
  '^': 'xʸ',
  '!': 'x!',
};
