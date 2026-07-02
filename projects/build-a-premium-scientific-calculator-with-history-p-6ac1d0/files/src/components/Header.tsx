import React from 'react';
import './Header.css';

interface HeaderProps {
  angleMode: string;
  hasMemory: boolean;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  onToggleAngle: () => void;
}

const Header: React.FC<HeaderProps> = React.memo(({ angleMode, hasMemory, isHistoryOpen, onToggleHistory, onToggleAngle }) => {
  return (
    <header className="calc-header">
      <div className="calc-header__brand">
        <span className="calc-header__logo">∑</span>
        <span className="calc-header__title">Calculator</span>
      </div>

      <div className="calc-header__controls">
        <div className={`calc-header__indicators ${hasMemory ? 'calc-header__indicators--active' : ''}`}>
          {hasMemory && <span className="calc-header__memory-indicator" title="Memory stored">M</span>}
        </div>

        <button
          className={`calc-header__angle-btn ${angleMode === 'RAD' ? 'calc-header__angle-btn--active' : ''}`}
          onClick={onToggleAngle}
          title={`Toggle angle mode (currently ${angleMode})`}
          type="button"
        >
          {angleMode}
        </button>

        <button
          className={`calc-header__history-btn ${isHistoryOpen ? 'calc-header__history-btn--active' : ''}`}
          onClick={onToggleHistory}
          title="Toggle history panel"
          type="button"
          aria-label="Toggle history"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
