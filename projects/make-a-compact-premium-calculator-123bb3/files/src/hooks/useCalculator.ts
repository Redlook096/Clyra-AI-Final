import { useState, useCallback, useEffect, useRef } from 'react';

interface HistoryEntry {
  expression: string;
  result: string;
}

type CalculatorState = 'idle' | 'input' | 'op_pending' | 'result' | 'error';

interface CalculatorHook {
  display: string;
  expression: string;
  history: HistoryEntry[];
  theme: 'dark' | 'light';
  historyOpen: boolean;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  inputOperator: (op: string) => void;
  calculate: () => void;
  clear: () => void;
  backspace: () => void;
  toggleSign: () => void;
  percent: () => void;
  toggleTheme: () => void;
  toggleHistory: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

function formatNumber(num: number): string {
  if (!isFinite(num)) return 'Error';
  if (Number.isInteger(num) && Math.abs(num) < Number.MAX_SAFE_INTEGER) {
    return num.toString();
  }
  return parseFloat(num.toPrecision(12)).toString();
}

function operate(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷':
      if (b === 0) throw new Error('Division by zero');
      return a / b;
    default: return b;
  }
}

export function useCalculator(): CalculatorHook {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [accumulator, setAccumulator] = useState<number>(0);
  const [operator, setOperator] = useState<string | null>(null);
  const [state, setState] = useState<CalculatorState>('idle');
  const [resetNext, setResetNext] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [historyOpen, setHistoryOpen] = useState(false);
  const displayRef = useRef(display);
  const accumulatorRef = useRef(accumulator);
  const operatorRef = useRef(operator);
  const resetNextRef = useRef(resetNext);

  useEffect(() => { displayRef.current = display; }, [display]);
  useEffect(() => { accumulatorRef.current = accumulator; }, [accumulator]);
  useEffect(() => { operatorRef.current = operator; }, [operator]);
  useEffect(() => { resetNextRef.current = resetNext; }, [resetNext]);

  const pushHistory = useCallback((expr: string, res: string) => {
    setHistory(prev => {
      const updated = [...prev, { expression: expr, result: res }];
      return updated.length > 20 ? updated.slice(updated.length - 20) : updated;
    });
  }, []);

  const inputDigit = useCallback((digit: string) => {
    if (state === 'error') return;
    if (state === 'result' || resetNext) {
      setDisplay(digit);
      setState('input');
      if (state === 'result') setExpression('');
  }, [state, resetNext]);

  const inputOperator = useCallback((op: string) => {
    if (state === 'error') return;
    const currentVal = parseFloat(displayRef.current);
    if (state === 'result') {
      setAccumulator(currentVal);
      setOperator(op);
      setExpression(formatNumber(currentVal) + ' ' + op + ' ');
      setResetNext(true);
      setState('op_pending');
      return;
    }
    if (state === 'op_pending' && operatorRef.current) {
      try {
        const result = operate(accumulatorRef.current, operatorRef.current, currentVal);
        const formatted = formatNumber(result);
        setAccumulator(result);
        setOperator(op);
        setExpression(formatted + ' ' + op + ' ');
        setDisplay(formatted);
        setResetNext(true);
        setState('op_pending');
      } catch {
        setDisplay('Error');
        setExpression('');
        setState('error');
      }
      return;
    }
    setAccumulator(currentVal);
    setOperator(op);
    setExpression(currentVal + ' ' + op + ' ');
    setResetNext(true);
    setState('op_pending');
  }, [state]);

  const calculate = useCallback(() => {
    if (state !== 'op_pending' || !operatorRef.current) return;
    const currentVal = parseFloat(displayRef.current);
    const acc = accumulatorRef.current;
    const op = operatorRef.current;
    try {
      const result = operate(acc, op, currentVal);
      const formattedResult = formatNumber(result);
      const expr = formatNumber(acc) + ' ' + op + ' ' + formatNumber(currentVal);
      setExpression(expr + ' =');
      setDisplay(formattedResult);
      setState('result');
      setResetNext(true);
      setOperator(null);
      pushHistory(expr + ' =', formattedResult);
    } catch {
      setDisplay('Error');
      setExpression('');
      setState('error');
      pushHistory(formatNumber(acc) + ' ' + op + ' ' + formatNumber(currentVal) + ' =', 'Error');
    }
  }, [state, pushHistory]);

  const clear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setAccumulator(0);
    setOperator(null);
    setState('idle');
    setResetNext(false);
  }, []);

  const backspace = useCallback(() => {
    if (state === 'error' || state === 'result') { clear(); return; }
    if (resetNext) { setDisplay('0'); setResetNext(false); return; }
    setDisplay(prev => prev.length <= 1 ? '0' : prev.slice(0, -1));
  }, [state, resetNext, clear]);

  const toggleSign = useCallback(() => {
    if (state === 'error' || display === '0') return;
    setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  }, [state, display]);

  const percent = useCallback(() => {
    if (state === 'error') return;
    const val = parseFloat(display);
    setDisplay(formatNumber(val / 100));
    if (state === 'result') setExpression(formatNumber(val) + ' %');
  }, [state, display]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const toggleHistory = useCallback(() => {
    setHistoryOpen(prev => !prev);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { key } = e;
    if (key >= '0' && key <= '9') { inputDigit(key); e.preventDefault(); }
    else if (key === '.') { inputDecimal(); e.preventDefault(); }
    else if (key === '+') { inputOperator('+'); e.preventDefault(); }
    else if (key === '-') { inputOperator('−'); e.preventDefault(); }
    else if (key === '*') { inputOperator('×'); e.preventDefault(); }
    else if (key === '/') { inputOperator('÷'); e.preventDefault(); }
    else if (key === 'Enter' || key === '=') { calculate(); e.preventDefault(); }
    else if (key === 'Backspace') { backspace(); e.preventDefault(); }
    else if (key === 'Escape' || key === 'c' || key === 'C') { clear(); e.preventDefault(); }
    else if (key === '%') { percent(); e.preventDefault(); }
  }, [inputDigit, inputDecimal, inputOperator, calculate, backspace, clear, percent]);

  return {
    display, expression, history, theme, historyOpen,
    inputDigit, inputDecimal, inputOperator, calculate,
    clear, backspace, toggleSign, percent, toggleTheme, toggleHistory, handleKeyDown,
  };
}
      setResetNext(false);
      return;
    }
    setDisplay(prev => {
      if (prev === '0') return digit;
      if (prev.length >= 16) return prev;
      return prev + digit;
    });
    setState('input');
  }, [state, resetNext]);

  const inputDecimal = useCallback(() => {
    if (state === 'error') return;
    if (state === 'result' || resetNext) {
      setDisplay('0.');
      setState('input');
      if (state === 'result') setExpression('');
      setResetNext(false);
      return;
    }
    setDisplay(prev => prev.includes('.') ? prev : prev + '.');
  }, [state, resetNext]);
