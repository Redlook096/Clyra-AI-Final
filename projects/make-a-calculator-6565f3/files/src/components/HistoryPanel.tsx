import type { HistoryEntry } from "../hooks/useHistory";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  isOpen: boolean;
  onRecall: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function HistoryPanel({
  entries,
  isOpen,
  onRecall,
  onClear,
  onClose,
}: HistoryPanelProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="history-overlay" onClick={onClose} aria-hidden="true" />}

      {/* Panel */}
      <aside
        className={`history-panel${isOpen ? " history-panel--open" : ""}`}
        aria-label="Calculation history"
        role="complementary"
        aria-hidden={!isOpen}
      >
        <div className="history-header">
          <h2 className="history-title">History</h2>
          <div className="history-actions">
            {entries.length > 0 && (
              <button className="history-clear-btn" onClick={onClear} aria-label="Clear history">
                Clear
              </button>
            )}
            <button className="history-close-btn" onClick={onClose} aria-label="Close history panel">
              ✕
            </button>
          </div>
        </div>

        <div className="history-list">
          {entries.length === 0 ? (
            <div className="history-empty">
              <span className="history-empty-icon">📋</span>
              <p>No calculations yet</p>
              <p className="history-empty-hint">Results will appear here</p>
            </div>
          ) : (
            entries.map((entry) => (
              <button
                key={entry.id}
                className="history-item"
                onClick={() => onRecall(entry)}
                title="Click to reuse this result"
              >
                <span className="history-item-expression">
                  {entry.expression.replace(/\*/g, "×").replace(/\//g, "÷")}
                </span>
                <span className="history-item-result">= {entry.result}</span>
                <span className="history-item-time">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
