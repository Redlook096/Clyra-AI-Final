import { useCallback, useMemo, useState } from "react";
import Display from "./components/Display";
import HistoryPanel from "./components/HistoryPanel";
import Keypad from "./components/Keypad";
import { useHistory } from "./hooks/useHistory";
import { useKeyboard } from "./hooks/useKeyboard";
import { calculate, formatNumber } from "./utils/calculate";
import { isValidNumberStart } from "./utils/format";
import "./styles.css";

export default function App() {
  const [expression, setExpression] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const { entries, isOpen: historyOpen, addEntry, clearHistory, togglePanel, closePanel } = useHistory();

  // Compute current result preview
  const result = useMemo(() => {
    if (!expression) return "0";
    const sanitized = expression.replace(/\s/g, "");
    if (/[+\-*/]$/.test(sanitized)) {
      const beforeOp = sanitized.slice(0, -1);
      if (!beforeOp) return "0";
      const r = calculate(beforeOp);
      return r.success && r.value !== null ? formatNumber(r.value) : "0";
    }
    const r = calculate(sanitized);
    if (r.success && r.value !== null) return formatNumber(r.value);
    return r.error ?? "0";
  }, [expression]);

  const error = useMemo(() => {
    if (!expression) return null;
    const sanitized = expression.replace(/\s/g, "");
    if (/[+\-*/]$/.test(sanitized)) return null;
    const r = calculate(sanitized);
    return r.success ? null : r.error;
  }, [expression]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (error) {
        // Clear error state first on any new keypress
        setExpression("");
        setJustEvaluated(false);
        return;
      }

      setExpression((prev) => {
        // If we just evaluated, start fresh for numbers, continue for operators
        if (justEvaluated) {
          if (/[+\-*/]/.test(key)) {
            setJustEvaluated(false);
            return (lastResult ?? prev) + key;
          }
          setJustEvaluated(false);
          setLastResult(null);
          return key;
        }

        // Handle consecutive operators: replace last operator
        if (/[+\-*/]/.test(key)) {
          const trimmed = prev.replace(/\s/g, "");
          if (/[+\-*/]$/.test(trimmed)) {
            // Replace the last operator
            return trimmed.slice(0, -1) + key;
          }
          // If empty or just a result, start fresh
          if (!trimmed) {
            return "0" + key;
          }
        }

        // Handle decimal: prevent multiple decimals in the same number
        if (key === ".") {
          if (!isValidNumberStart(".", prev)) return prev;
        }

        return prev + key;
      });
    },
    [error, justEvaluated, lastResult]
  );

  const handleEvaluate = useCallback(() => {
    if (!expression) return;
    const sanitized = expression.replace(/\s/g, "");
    if (/[+\-*/]$/.test(sanitized)) return; // Don't evaluate if ends with operator

    const r = calculate(sanitized);
    if (r.success && r.value !== null) {
      const formatted = formatNumber(r.value);
      addEntry(expression.replace(/\*/g, "×").replace(/\//g, "÷"), formatted);
      setExpression(formatted);
      setLastResult(formatted);
      setJustEvaluated(true);
    }
  }, [expression, addEntry]);

  const handleClear = useCallback(() => {
    setExpression("");
    setLastResult(null);
    setJustEvaluated(false);
  }, []);

  const handleDelete = useCallback(() => {
    if (justEvaluated) {
      handleClear();
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  }, [justEvaluated, handleClear]);

  const handleRecall = useCallback(
    (entry: { expression: string; result: string }) => {
      setExpression(entry.result);
      setLastResult(entry.result);
      setJustEvaluated(true);
      closePanel();
    },
    [closePanel]
  );

  // Bind keyboard
  useKeyboard({
    onKey: handleKeyPress,
    onEvaluate: handleEvaluate,
    onClear: handleClear,
    onDelete: handleDelete,
  });

  return (
    <main className="app">
      <HistoryPanel
        entries={entries}
        isOpen={historyOpen}
        onRecall={handleRecall}
        onClear={clearHistory}
        onClose={closePanel}
      />

      <div className="calculator-wrapper">
        <section className="calculator" aria-label="Calculator">
          <div className="calculator-header">
            <span className="calculator-brand">Calculator</span>
            <button
              className="history-toggle"
              onClick={togglePanel}
              aria-label={historyOpen ? "Close history" : `Open history (${entries.length})`}
              title="History"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {entries.length > 0 && <span className="history-badge">{entries.length}</span>}
            </button>
          </div>

          <Display expression={expression} result={result} error={error} />

          <Keypad
            onKeyPress={handleKeyPress}
            onClear={handleClear}
            onDelete={handleDelete}
            onEvaluate={handleEvaluate}
            disabled={false}
          />
        </section>
      </div>
    </main>
  );
}
