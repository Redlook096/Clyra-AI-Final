import { useState, useCallback } from 'react'
import type { CalcState, Operator, HistoryEntry } from '../types'
import { formatInput, compute, formatResult, computePercent } from '../utils/arithmetic'

const initialState: CalcState = {
  currentValue: '0',
  previousValue: null,
  operator: null,
  expression: '',
  history: [],
  overwrite: false,
}

export function useCalculator() {
  const [state, setState] = useState<CalcState>(initialState)

  const pushHistory = useCallback((entry: HistoryEntry) => {
    setState(prev => ({
      ...prev,
      history: [entry, ...prev.history].slice(0, 20),
    }))
  }, [])

  const inputDigit = useCallback((digit: string) => {
    setState(prev => {
      if (prev.overwrite) {
        return {
          ...prev,
          currentValue: digit === '.' ? '0.' : digit,
          expression: '',
          overwrite: false,
        }
      }
      let next = prev.currentValue
      if (digit === '.') {
        if (next.includes('.')) return prev
        next += '.'
      } else {
        if (next === '0' && digit !== '.') {
          next = digit
        } else {
          next += digit
        }
      }
      return { ...prev, currentValue: formatInput(next) }
    })
  }, [])

  const chooseOperator = useCallback((op: Operator) => {
    setState(prev => {
      const cur = parseFloat(prev.currentValue)
      if (isNaN(cur)) return prev
      if (prev.previousValue !== null && prev.operator && !prev.overwrite) {
        const prevNum = parseFloat(prev.previousValue)
        const result = compute(prevNum, prev.operator, cur)
        const resultStr = formatResult(result)
        const expr = `${prev.previousValue} ${prev.operator} ${prev.currentValue}`
        pushHistory({ expression: expr, result: resultStr })
        return {
          ...prev,
          currentValue: resultStr,
          previousValue: resultStr,
          operator: op,
          expression: `${resultStr} ${op}`,
          overwrite: true,
        }
      }
      return {
        ...prev,
        previousValue: prev.currentValue,
        operator: op,
        expression: `${prev.currentValue} ${op}`,
        overwrite: true,
      }
    })
  }, [pushHistory])

  const evaluate = useCallback(() => {
    setState(prev => {
      if (prev.previousValue === null || prev.operator === null) return prev
      const a = parseFloat(prev.previousValue)
      const b = parseFloat(prev.currentValue)
      const result = compute(a, prev.operator, b)
      const resultStr = formatResult(result)
      const expr = `${prev.previousValue} ${prev.operator} ${prev.currentValue}`
      pushHistory({ expression: expr, result: resultStr })
      return {
        ...prev,
        currentValue: resultStr,
        previousValue: null,
        operator: null,
        expression: `${expr} =`,
        overwrite: true,
      }
    })
  }, [pushHistory])

  const clearAll = useCallback(() => {
    setState(initialState)
  }, [])

  const backspace = useCallback(() => {
    setState(prev => {
      if (prev.overwrite) {
        return { ...prev, currentValue: '0', overwrite: false }
      }
      let next = prev.currentValue
      if (next.length <= 1 || (next.length === 2 && next.startsWith('-'))) {
        next = '0'
      } else {
        next = next.slice(0, -1)
      }
      return { ...prev, currentValue: next }
    })
  }, [])

  const percent = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentValue: formatInput(computePercent(prev.currentValue)),
      overwrite: true,
    }))
  }, [])

  const negate = useCallback(() => {
    setState(prev => {
      if (prev.currentValue === '0') return prev
      const next = prev.currentValue.startsWith('-') ? prev.currentValue.slice(1) : '-' + prev.currentValue
      return { ...prev, currentValue: next }
    })
  }, [])

  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, history: [] }))
  }, [])

  const handleKeyDown = useCallback((key: string) => {
    if (/^[0-9.]$/.test(key)) {
      inputDigit(key)
    } else if (key === '+') {
      chooseOperator('+')
    } else if (key === '-') {
      chooseOperator('-')
    } else if (key === '*') {
      chooseOperator('×')
    } else if (key === '/') {
      chooseOperator('÷')
    } else if (key === 'Enter' || key === '=') {
      evaluate()
    } else if (key === 'Backspace') {
      backspace()
    } else if (key === 'Delete' || key === 'Escape') {
      clearAll()
    } else if (key === '%') {
      percent()
    }
  }, [inputDigit, chooseOperator, evaluate, backspace, clearAll, percent])

  return {
    ...state,
    inputDigit,
    chooseOperator,
    evaluate,
    clearAll,
    backspace,
    percent,
    negate,
    clearHistory,
    handleKeyDown,
  }
}
