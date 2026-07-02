import { useEffect, useCallback } from 'react';
import { KEYBOARD_MAP } from '../utils/constants';

interface KeyboardCallbacks {
  onDigit: (digit: string) => void;
  onOperator: (op: string) => void;
  onFunction: (fn: string) => void;
  onControl: (action: string) => void;
  onMemory: (action: string) => void;
  onAngleToggle: () => void;
  onSecondToggle: () => void;
}

export function useKeyboard(callbacks: KeyboardCallbacks) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key;
    const code = e.code;

    // Allow tab to move focus
    if (key === 'Tab') return;

    // Handle NumPad keys
    const numPadKey = code.startsWith('Numpad') ? code.replace('Numpad', '') : null;

    if (numPadKey === 'Enter' || key === 'Enter') {
      e.preventDefault();
      callbacks.onControl('evaluate');
      return;
    }

    if (key === 'Backspace') {
      e.preventDefault();
      callbacks.onControl('backspace');
      return;
    }

    if (key === 'Escape') {
      e.preventDefault();
      callbacks.onControl('clear');
      return;
    }

    if (key === 'Delete') {
      e.preventDefault();
      callbacks.onControl('clear');
      return;
    }

    // Map the key
    const mapped = KEYBOARD_MAP[key.toLowerCase()] || KEYBOARD_MAP[key];
    if (!mapped) return;

    e.preventDefault();

    // Categorize the mapped value
    if (/^[0-9.]$/.test(mapped)) {
      callbacks.onDigit(mapped);
    } else if (['+', '-', '*', '/'].includes(mapped)) {
      callbacks.onOperator(mapped);
    } else if (mapped === '=') {
      callbacks.onControl('evaluate');
    } else if (mapped === 'C') {
      callbacks.onControl('clear');
    } else if (mapped === '⌫') {
      callbacks.onControl('backspace');
    } else if (['(', ')'].includes(mapped)) {
      callbacks.onControl(mapped === '(' ? '(' : ')');
    } else if (['sin', 'cos', 'tan', 'log', 'ln', '%', 'x!', 'xʸ'].includes(mapped)) {
      callbacks.onFunction(mapped);
    } else if (mapped === 'π' || mapped === 'e') {
      callbacks.onFunction(mapped === 'π' ? 'π' : 'eConstant');
    }
  }, [callbacks]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
