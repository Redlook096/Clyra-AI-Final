import React from 'react';
import { HistoryEntry } from '../types/calculator';
import { formatTimestamp } from '../utils/formatters';
import './HistoryPanel.css';

interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryEntry[];
  onRecall: (entry: HistoryEntry) => void;
  onClear: () => void;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = React.memo(({ isOpen, history, onRecall, onClear, onClose }) => {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="history-overlay" onClick={onClose} />}
      
      <div className={`history-panel ${isOpen ? 'history-panel--open' : ''}`}>
        <div className="history-panel__header">
          <h2 className="history-panel__title">History</h2>
          <div className="history-panel__header-actions">
            {history.length > 0 && (
              <button className="history-panel__clear-btn" onClick={onClear} type="button">
                Clear All
              </button>
            )}
            <button className="history-panel__close-btn" onClick={onClose} type="button" aria-label="Close history">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="history-panel__list">
          {history.length === 0 ? (
            <div className="history-panel__empty">
              <div className="history-panel__empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <p className="history-panel__empty-text">No calculations yet</p>
              <p className="history-panel__empty-sub">Results will appear here</p>
            </div>
          ) : (
            history.map((entry, index) => (
              <button
                key={entry.id}
                className="history-panel__entry"
                onClick={() => onRecall(entry)}
                type="button"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="history-panel__entry-info">
                  <span className="history-panel__entry-expression">{entry.expression.replace(/\*/g, '×').replace(/\//g, '÷')}</span>
                  <span className="history-panel__entry-result">= {entry.result}</span>
                </div>
                <span className="history-panel__entry-time">{formatTimestamp(entry.timestamp)}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
});

HistoryPanel.displayName = 'HistoryPanel';
export default HistoryPanel;
