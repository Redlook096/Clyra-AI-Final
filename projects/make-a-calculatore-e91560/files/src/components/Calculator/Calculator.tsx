import { useState, useMemo } from 'react';
import { useCalculator } from '../../hooks/useCalculator';
import { useKeyboard } from '../../hooks/useKeyboard';
import { Display } from '../Display/Display';
import { Keypad } from '../Keypad/Keypad';
import { History } from '../History/History';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';
import './Calculator.css';

interface CalculatorProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Calculator({ theme, onToggleTheme }: CalculatorProps) {
  const {
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
  } = useCalculator();

  const [historyOpen, setHistoryOpen] = useState(false);

  const keyboardCallbacks = useMemo(
    () => ({
      onDigit: handleDigit,
      onOperator: handleOperator,
      onEquals: handleEquals,
      onClear: handleClear,
      onBackspace: handleBackspace,
      onNegate: handleNegate,
      onPercent: handlePercent,
    }),
    [handleDigit, handleOperator, handleEquals, handleClear, handleBackspace, handleNegate, handlePercent]
  );

  useKeyboard(keyboardCallbacks);

  return (
    <div className="calculator">
      <div className="calculator__header">
        <button
          className="calculator__history-btn"
          onClick={() => setHistoryOpen(true)}
          type="button"
          aria-label="Open history"
          title="History"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
        <h1 className="calculator__title">Calculator</h1>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <Display
        expression={data.expression}
        currentValue={data.currentValue}
        errorMessage={data.errorMessage}
        state={data.state}
      />

      <Keypad
        onDigit={handleDigit}
        onOperator={handleOperator}
        onEquals={handleEquals}
        onClear={handleClear}
        onBackspace={handleBackspace}
        onNegate={handleNegate}
        onPercent={handlePercent}
      />

      <History
        history={data.history}
        onRecall={handleRecallHistory}
        onClear={handleClearHistory}
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(false)}
      />
    </div>
  );
}
