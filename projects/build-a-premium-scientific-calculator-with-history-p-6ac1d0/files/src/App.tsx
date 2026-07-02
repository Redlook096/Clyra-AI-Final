import React, { useEffect, useCallback } from 'react';
import { useCalculator } from './hooks/useCalculator';
import { useHistory } from './hooks/useHistory';
import { useKeyboard } from './hooks/useKeyboard';
import Header from './components/Header';
import CalculatorDisplay from './components/CalculatorDisplay';
import MemoryBar from './components/MemoryBar';
import ButtonGrid from './components/ButtonGrid';
import HistoryPanel from './components/HistoryPanel';
import { HistoryEntry } from './types/calculator';
import './App.css';

const App: React.FC = () => {
  const {
    state,
    handleAction,
    inputDigit,
    inputOperator,
    inputFunction,
    inputControl,
    inputMemory,
    toggleAngleMode,
    toggleSecondFn,
    toggleHistory,
    closeHistory,
    recallHistory,
  } = useCalculator();

  const { history, addEntry, clearHistory } = useHistory();

  // Hook up keyboard
  useKeyboard({
    onDigit: (d: string) => handleAction({ type: 'digit', value: d }),
    onOperator: (o: string) => handleAction({ type: 'operator', value: o }),
    onFunction: (f: string) => handleAction({ type: 'function', value: f }),
    onControl: (a: string) => handleAction({ type: 'control', value: a }),
    onMemory: (a: string) => handleAction({ type: 'memory', value: a }),
    onAngleToggle: toggleAngleMode,
    onSecondToggle: toggleSecondFn,
  });

  // Add to history when evaluation happens
  const prevJustEvaluated = React.useRef(false);
  useEffect(() => {
    if (state.justEvaluated && !prevJustEvaluated.current && state.result) {
      // Wait a tick for the expression to settle
      const timer = setTimeout(() => {
        const expr = state.expression;
        const res = state.result;
        if (expr && res && res !== 'Error' && res !== 'Infinity' && res !== '-Infinity') {
          addEntry(expr, res);
        }
      }, 50);
      prevJustEvaluated.current = true;
      return () => clearTimeout(timer);
    } else if (!state.justEvaluated) {
      prevJustEvaluated.current = false;
    }
  }, [state.justEvaluated, state.expression, state.result, addEntry]);

  const handleHistoryRecall = useCallback((entry: HistoryEntry) => {
    recallHistory(entry);
  }, [recallHistory]);

  const handleHistoryClear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return (
    <div className="app">
      <div className="app__container">
        <div className="calculator">
          <Header
            angleMode={state.angleMode}
            hasMemory={state.hasMemory}
            isHistoryOpen={state.isHistoryOpen}
            onToggleHistory={toggleHistory}
            onToggleAngle={toggleAngleMode}
          />

          <MemoryBar hasMemory={state.hasMemory} memory={state.memory} />

          <CalculatorDisplay
            expression={state.expression}
            display={state.display}
            result={state.result}
            error={state.error}
            justEvaluated={state.justEvaluated}
          />

          <ButtonGrid
            isSecondFn={state.isSecondFn}
            angleMode={state.angleMode}
            onAction={handleAction}
          />
        </div>

        <HistoryPanel
          isOpen={state.isHistoryOpen}
          history={history}
          onRecall={handleHistoryRecall}
          onClear={handleHistoryClear}
          onClose={closeHistory}
        />
      </div>
    </div>
  );
};

export default App;
