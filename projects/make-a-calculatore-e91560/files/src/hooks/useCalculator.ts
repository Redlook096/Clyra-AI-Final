import { useState, useCallback } from 'react';
import type { CalculatorData, CalculatorState, Operator, HistoryEntry } from '../types';
import { evaluateExpression, roundResult, cleanNumberInput, parseDisplayValue } from '../utils/math';
import { MAX_DIGITS } from '../constants';

const initialState: CalculatorData = {
  currentValue: '0',
  previousValue: '',
  operator: null,
  expression: '',
  state: 'inputting',
  history: [],
  errorMessage: null,
};

export function useCalculator() {
  const [data, setData] = useState<CalculatorData>(initialState);

  const handleDigit = useCallback((digit: string) => {
    setData((prev) => {
      if (prev.state === 'error') {
        return {
          ...initialState,
          history: prev.history,
          currentValue: digit === '.' ? '0.' : digit,
          state: 'inputting',
        };
      }

      if (prev.state === 'result') {
        // Start fresh calculation
        return {
          ...initialState,
          history: prev.history,
          currentValue: digit === '.' ? '0.' : digit,
          state: 'inputting',
        };
      }

      if (prev.state === 'operator') {
        return {
          ...prev,
          currentValue: digit === '.' ? '0.' : digit,
          state: 'inputting',
        };
      }

      // inputting state - append digit
      let current = cleanNumberInput(prev.currentValue);

      if (digit === '.') {
        if (current.includes('.')) {
          return prev; // Already has a decimal
        }
        if (current === '' || current === '-') {
          return { ...prev, currentValue: current + '0.' };
        }
        return { ...prev, currentValue: current + '.' };
      }

      // Don't allow leading zeros
      if (current === '0' && digit === '0') {
        return prev;
      }
      if (current === '0' && digit !== '.') {
        current = '';
      }
      if (current === '-0') {
        current = '-';
      }

      // Limit digit length
      if (current.replace('-', '').replace('.', '').length >= MAX_DIGITS) {
        return prev;
      }

      return {
        ...prev,
        currentValue: current + digit,
        state: 'inputting',
      };
    });
  }, []);

  const handleOperator = useCallback((operator: Operator) => {
    setData((prev) => {
      if (prev.state === 'error') {
        return { ...initialState, history: prev.history };
      }

      const current = parseDisplayValue(prev.currentValue);

      if (prev.state === 'operator' || prev.state === 'inputting' && prev.previousValue !== '') {
        // Chain operation - evaluate first
        if (prev.previousValue !== '' && prev.operator) {
          try {
            const previous = parseDisplayValue(prev.previousValue);
            const result = roundResult(evaluateExpression(previous, current, prev.operator));
            return {
              ...prev,
              previousValue: String(result),
              currentValue: String(result),
              operator,
              expression: `${String(result)} ${operator}`,
              state: 'operator' as CalculatorState,
            };
          } catch {
            return {
              ...prev,
              state: 'error' as CalculatorState,
              errorMessage: 'Error',
              currentValue: 'Error',
            };
          }
        }
      }

      return {
        ...prev,
        previousValue: prev.currentValue,
        operator,
        expression: `${prev.currentValue} ${operator}`,
        state: 'operator' as CalculatorState,
      };
    });
  }, []);

  const handleEquals = useCallback(() => {
    setData((prev) => {
      if (prev.state === 'error' || prev.state === 'result') {
        return prev;
      }

      if (!prev.operator || prev.previousValue === '') {
        return prev;
      }

      try {
        const a = parseDisplayValue(prev.previousValue);
        const b = parseDisplayValue(prev.currentValue);
        const result = roundResult(evaluateExpression(a, b, prev.operator));

        const expression = `${prev.previousValue} ${prev.operator} ${prev.currentValue}`;
        const resultStr = String(result);

        const entry: HistoryEntry = {
          expression,
          result: resultStr,
        };

        return {
          ...prev,
          currentValue: resultStr,
          previousValue: '',
          operator: null,
          expression: `${expression} =`,
          state: 'result',
          history: [entry, ...prev.history].slice(0, 50),
          errorMessage: null,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error';
        return {
          ...prev,
          state: 'error',
          errorMessage: message,
          currentValue: 'Error',
        };
      }
    });
  }, []);

  const handleClear = useCallback(() => {
    setData((prev) => ({
      ...initialState,
      history: prev.history,
    }));
  }, []);

  const handleBackspace = useCallback(() => {
    setData((prev) => {
      if (prev.state === 'error' || prev.state === 'result') {
        return { ...initialState, history: prev.history };
      }

      let current = cleanNumberInput(prev.currentValue);
      if (current.length <= 1 || (current.length === 2 && current.startsWith('-'))) {
        return { ...prev, currentValue: '0' };
      }

      return { ...prev, currentValue: current.slice(0, -1) };
    });
  }, []);

  const handleNegate = useCallback(() => {
    setData((prev) => {
      if (prev.state === 'error') {
        return { ...initialState, history: prev.history };
      }

      if (prev.currentValue === '0') {
        return prev;
      }

      const current = cleanNumberInput(prev.currentValue);
      if (current.startsWith('-')) {
        return { ...prev, currentValue: current.slice(1) };
      }
      return { ...prev, currentValue: '-' + current };
    });
  }, []);

  const handlePercent = useCallback(() => {
    setData((prev) => {
      if (prev.state === 'error') {
        return { ...initialState, history: prev.history };
      }

      const current = parseDisplayValue(prev.currentValue);
      const result = current / 100;
      return { ...prev, currentValue: String(result) };
    });
  }, []);

  const handleClearHistory = useCallback(() => {
    setData((prev) => ({ ...prev, history: [] }));
  }, []);

  const handleRecallHistory = useCallback((result: string) => {
    setData((prev) => ({
      ...prev,
      currentValue: result,
      state: 'result',
      expression: result,
    }));
  }, []);

  return {
    data,
    handleDigit,
    handleOperator,
    handleEquals,
    handleClear,
    handleBackspace,
    handleNegate,
    handlePercent,
    handleClearHistory,
    handleRecallHistory,
  };
}
