import { useEffect } from 'react';
import { KEY_MAPPINGS } from '../constants';
import type { Operator } from '../types';

interface KeyboardCallbacks {
  onDigit: (digit: string) => void;
  onOperator: (op: Operator) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onNegate: () => void;
  onPercent: () => void;
}

export function useKeyboard(callbacks: KeyboardCallbacks) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for calculator keys
      const key = e.key;
      const mapped = KEY_MAPPINGS[key];

      if (!mapped && key !== 'n' && key !== 'N') {
        return;
      }

      e.preventDefault();

      if (mapped === 'backspace') {
        callbacks.onBackspace();
        return;
      }

      if (mapped === 'clear') {
        callbacks.onClear();
        return;
      }

      if (mapped === '=') {
        callbacks.onEquals();
        return;
      }

      if (mapped === 'percent') {
        callbacks.onPercent();
        return;
      }

      // Negate via 'n' key (unmapped)
      if (key === 'n' || key === 'N') {
        callbacks.onNegate();
        return;
      }

      // Check if it's an operator
      if (mapped === '+' || mapped === '-' || mapped === '×' || mapped === '÷') {
        callbacks.onOperator(mapped as Operator);
        return;
      }

      // It's a digit or decimal
      callbacks.onDigit(mapped);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}
