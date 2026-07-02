import { useState, useCallback } from 'react';
import { CalculatorState, AngleMode, HistoryEntry } from '../types/calculator';
import { evaluateExpression } from '../utils/evaluate';

const ANGLE_STORAGE_KEY = 'calc_angle_mode';

function loadAngleMode(): AngleMode {
  try {
    const stored = localStorage.getItem(ANGLE_STORAGE_KEY);
    if (stored === 'DEG' || stored === 'RAD') return stored;
  } catch {}
  return 'DEG';
}

function saveAngleMode(mode: AngleMode) {
  try { localStorage.setItem(ANGLE_STORAGE_KEY, mode); } catch {}
}

function createInitialState(): CalculatorState {
  return {
    display: '0', expression: '', result: '', memory: null,
    angleMode: loadAngleMode(), isHistoryOpen: false, history: [],
    isScientificMode: true, isSecondFn: false, hasMemory: false,
    error: null, justEvaluated: false,
  };
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(createInitialState);

  const inputDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.error) return { ...prev, display: digit, expression: digit, error: null, justEvaluated: false, result: '' };
      if (prev.justEvaluated) return { ...prev, display: digit, expression: digit, result: '', justEvaluated: false };
      const newDisplay = prev.display === '0' && digit !== '.' ? digit : prev.display + digit;
      return { ...prev, display: newDisplay, expression: prev.expression + digit, result: '', error: null };
    });
  }, []);

  const inputOperator = useCallback((op: string) => {
    setState(prev => {
      if (prev.error) return { ...prev, display: '0', expression: '', error: null, result: '', justEvaluated: false };
      let expr = prev.expression;
      if (prev.justEvaluated) expr = prev.result;
      if (!expr && op !== '-') return prev;
      const lastChar = expr.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) expr = expr.slice(0, -1);
      const displayOp = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : op;
      return {
        ...prev,
        display: prev.justEvaluated ? prev.result + displayOp : prev.display + displayOp,
        expression: expr + op, result: '', justEvaluated: false, error: null,
      };
    });
  }, []);

  const inputFunction = useCallback((fn: string) => {
    setState(prev => {
      if (prev.error) {
        const n = fn === 'negate' ? '-' : fn === 'π' ? 'π' : fn === 'e' ? 'e' : `${fn}(`;
        return { ...prev, display: n, expression: n, error: null, justEvaluated: false, result: '' };
      }
      if (fn === 'π') {
        const insert = 'π';
        const newDisplay = prev.justEvaluated || prev.display === '0' ? insert : prev.display + insert;
        return { ...prev, display: newDisplay, expression: prev.expression + insert, result: '', justEvaluated: false };
      }
      if (fn === 'e') return { ...prev, display: prev.display === '0' ? 'e' : prev.display + 'e', expression: prev.expression + 'e', result: '', justEvaluated: false };
      if (fn === 'negate') {
        const newExpr = prev.expression.startsWith('-') ? prev.expression.slice(1) : '-' + prev.expression;
        return { ...prev, display: newExpr || '0', expression: newExpr, result: '', justEvaluated: false };
      }
      const base = prev.expression || prev.result || '0';
      const baseDisp = prev.display || prev.result || '0';
      const actions: Record<string, { disp: string; expr: string }> = {
        square: { disp: `(${baseDisp})²`, expr: `(${base})^2` },
        cube: { disp: `(${baseDisp})³`, expr: `(${base})^3` },
        sqrt: { disp: `√(${baseDisp})`, expr: `sqrt(${base})` },
        cbrt: { disp: `∛(${baseDisp})`, expr: `cbrt(${base})` },
        tenpow: { disp: `10^(${baseDisp})`, expr: `10^(${base})` },
        exp: { disp: `${baseDisp}e`, expr: `${base}e` },
        factorial: { disp: `(${baseDisp})!`, expr: `(${base})!` },
        pow: { disp: `(${baseDisp})^`, expr: `(${base})^` },
        '%': { disp: `(${baseDisp})%`, expr: `(${base})/100` },
      };
      const a = actions[fn];
      if (a) return { ...prev, display: a.disp, expression: a.expr, result: '', justEvaluated: false };
      const fnDisp: Record<string, string> = { asin: 'sin⁻¹', acos: 'cos⁻¹', atan: 'tan⁻¹', log: 'log', ln: 'ln', sin: 'sin', cos: 'cos', tan: 'tan' };
      return { ...prev, display: `${fnDisp[fn] || fn}(${baseDisp})`, expression: `${fn}(${base})`, result: '', justEvaluated: false };
    });
  }, []);

  const inputControl = useCallback((action: string) => {
    setState(prev => {
      switch (action) {
        case 'clear': return { ...prev, display: '0', expression: '', result: '', error: null, justEvaluated: false };
        case 'backspace': {
          if (prev.error || prev.justEvaluated) return { ...prev, display: '0', expression: '', result: '', error: null, justEvaluated: false };
          return { ...prev, display: prev.display.length > 1 ? prev.display.slice(0, -1) : '0', expression: prev.expression.slice(0, -1) };
        }
        case '(': return { ...prev, display: prev.display === '0' ? '(' : prev.display + '(', expression: prev.expression + '(', result: '', justEvaluated: false };
        case ')': {
          const open = (prev.expression.match(/\(/g) || []).length;
          const close = (prev.expression.match(/\)/g) || []).length;
          if (close < open) return { ...prev, display: prev.display + ')', expression: prev.expression + ')', result: '', justEvaluated: false };
          return prev;
        }
        case 'evaluate': {
          const exprToEval = prev.expression || prev.result;
          if (!exprToEval) return prev;
          const { result, error } = evaluateExpression(exprToEval, prev.angleMode);
          let finalExpr = exprToEval;
          const oC = (finalExpr.match(/\(/g) || []).length;
          const cC = (finalExpr.match(/\)/g) || []).length;
          if (oC > cC) finalExpr = finalExpr + ')'.repeat(oC - cC);
          return { ...prev, display: result || prev.display, expression: finalExpr, result: result || '', error, justEvaluated: true };
        }
        default: return prev;
      }
    });
  }, []);

  const inputMemory = useCallback((action: string) => {
    setState(prev => {
      const currentVal = parseFloat(prev.result || prev.display || '0');
      if (isNaN(currentVal)) return prev;
      switch (action) {
        case 'MC': return { ...prev, memory: null, hasMemory: false };
        case 'MR':
          if (prev.memory !== null) {
            const memStr = String(prev.memory);
            return { ...prev, display: memStr, expression: prev.justEvaluated ? memStr : prev.expression + memStr, result: '', justEvaluated: false };
          }
          return prev;
        case 'M+': return { ...prev, memory: (prev.memory || 0) + currentVal, hasMemory: true };
        case 'M-': return { ...prev, memory: (prev.memory || 0) - currentVal, hasMemory: true };
        default: return prev;
      }
    });
  }, []);

  const toggleAngleMode = useCallback(() => {
    setState(prev => {
      const newMode: AngleMode = prev.angleMode === 'DEG' ? 'RAD' : 'DEG';
      saveAngleMode(newMode);
      return { ...prev, angleMode: newMode };
    });
  }, []);

  const toggleSecondFn = useCallback(() => setState(prev => ({ ...prev, isSecondFn: !prev.isSecondFn })), []);
  const toggleHistory = useCallback(() => setState(prev => ({ ...prev, isHistoryOpen: !prev.isHistoryOpen })), []);
  const closeHistory = useCallback(() => setState(prev => ({ ...prev, isHistoryOpen: false })), []);

  const recallHistory = useCallback((entry: HistoryEntry) => {
    setState(prev => ({
      ...prev, display: entry.expression, expression: entry.expression,
      result: '', justEvaluated: false, error: null, isHistoryOpen: false,
    }));
  }, []);

  const handleAction = useCallback((action: import('../types/calculator').ButtonAction) => {
    switch (action.type) {
      case 'digit': inputDigit(action.value); break; case 'constant': inputFunction(action.value); break;
      case 'operator': inputOperator(action.value); break;
      case 'function': inputFunction(action.value); break;
      case 'memory': inputMemory(action.value); break;
      case 'control': inputControl(action.value); break;
      case 'angle': toggleAngleMode(); break;
      case 'second': toggleSecondFn(); break;
    }
  }, [inputDigit, inputOperator, inputFunction, inputMemory, inputControl, toggleAngleMode, toggleSecondFn]);

  return {
    state, handleAction, inputDigit, inputOperator, inputFunction, inputControl,
    inputMemory, toggleAngleMode, toggleSecondFn, toggleHistory, closeHistory, recallHistory,
  };
}