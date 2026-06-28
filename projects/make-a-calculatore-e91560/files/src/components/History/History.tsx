import type { HistoryEntry } from '../../types';
import './History.css';

interface HistoryProps {
  history: HistoryEntry[];
  onRecall: (result: string) => void;
  onClear: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function History({ history, onRecall, onClear, isOpen, onToggle }: HistoryProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="history-overlay" onClick={onToggle} />}

      <aside className={`history ${isOpen ? 'history--open' : ''}`}>
        <div className="history__header">
          <h2 className="history__title">History</h2>
          <div className="history__actions">
            {history.length > 0 && (
              <button
                className="history__clear-btn"
                onClick={onClear}
                type="button"
                aria-label="Clear history"
              >
                Clear
              </button>
            )}
            <button
              className="history__close-btn"
              onClick={onToggle}
              type="button"
              aria-label="Close history"
            >
              ×
            </button>
          </div>
        </div>

        <div className="history__list">
          {history.length === 0 ? (
            <p className="history__empty">No calculations yet</p>
          ) : (
            history.map((entry, index) => (
              <button
                key={`${entry.expression}-${index}`}
                className="history__item"
                onClick={() => onRecall(entry.result)}
                type="button"
              >
                <span className="history__expression">{entry.expression}</span>
                <span className="history__result">= {entry.result}</span>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
