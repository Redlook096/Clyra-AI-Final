import { useEffect, useRef } from 'react'
import type { HistoryEntry } from '../types'
import './History.css'

interface HistoryProps {
  history: HistoryEntry[]
  onClose: () => void
  onClear: () => void
}

export default function History({ history, onClose, onClear }: HistoryProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = 0
  }, [history])

  return (
    <div className="history-overlay" onClick={onClose} role="dialog" aria-label="Calculation history">
      <div
        className="history-panel"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="history-panel__header">
          <span className="history-panel__title">History</span>
          <div className="history-panel__actions">
            {history.length > 0 && (
              <button className="history-panel__btn" onClick={onClear}>
                Clear All
              </button>
            )}
            <button className="history-panel__btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="history-panel__list" ref={listRef}>
          {history.length === 0 ? (
            <div className="history-panel__empty">No calculations yet</div>
          ) : (
            history.map((entry, i) => (
              <div key={`${entry.expression}-${i}`} className="history-item">
                <span className="history-item__expression">{entry.expression}</span>
                <span className="history-item__result">= {entry.result}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
