import { useEffect, useState, useCallback } from 'react'
import { useCalculator } from '../hooks/useCalculator'
import Display from './Display'
import ButtonPanel from './ButtonPanel'
import History from './History'
import './Calculator.css'

export default function Calculator() {
  const {
    currentValue,
    expression,
    history,
    inputDigit,
    chooseOperator,
    evaluate,
    clearAll,
    backspace,
    percent,
    negate,
    clearHistory,
    handleKeyDown,
  } = useCalculator()

  const [showHistory, setShowHistory] = useState(false)

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (showHistory && e.key === 'Escape') {
        setShowHistory(false)
        return
      }
      handleKeyDown(e.key)
      e.preventDefault()
    },
    [showHistory, handleKeyDown]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <div className="calculator" role="application" aria-label="Calculator">
      <div className="calculator__header">
        <span className="calculator__brand">Calculator</span>
        <button
          className="calculator__history-toggle"
          onClick={() => setShowHistory(true)}
          aria-label="View history"
        >
          History ({history.length})
        </button>
      </div>
      <Display value={currentValue} expression={expression} />
      <ButtonPanel
        onDigit={inputDigit}
        onOperator={chooseOperator}
        onEvaluate={evaluate}
        onClear={clearAll}
        onBackspace={backspace}
        onPercent={percent}
        onNegate={negate}
      />
      {showHistory && (
        <History
          history={history}
          onClose={() => setShowHistory(false)}
          onClear={clearHistory}
        />
      )}
    </div>
  )
}
