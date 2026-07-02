import type { Operator } from '../types'

function stripLeadingZeros(input: string): string {
  let trimmed = input.replace(/^0+(?!$)/, '')
  if (trimmed === '' || trimmed === '-') trimmed = '0'
  return trimmed
}

export function formatInput(raw: string): string {
  const parts = raw.split('.')
  if (parts.length > 2) return raw
  const intPart = stripLeadingZeros(parts[0] || '0')
  if (parts.length === 2) {
    return intPart + '.' + parts[1].slice(0, 15)
  }
  return intPart
}

export function compute(a: number, operator: Operator, b: number): number {
  switch (operator) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
      return a * b
    case '÷':
      if (b === 0) return NaN
      return a / b
  }
}

export function formatResult(n: number): string {
  if (isNaN(n) || !isFinite(n)) return 'Error'
  const str = n.toPrecision(12)
  const parsed = parseFloat(str)
  return parsed.toString()
}

export function computePercent(raw: string): string {
  const n = parseFloat(raw)
  if (isNaN(n)) return '0'
  return (n / 100).toString()
}
