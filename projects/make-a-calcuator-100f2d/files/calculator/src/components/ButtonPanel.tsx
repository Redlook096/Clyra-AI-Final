import CalcButton from './CalcButton'
import type { Operator } from '../types'

interface ButtonPanelProps {
  onDigit: (d: string) => void
  onOperator: (op: Operator) => void
  onEvaluate: () => void
  onClear: () => void
  onBackspace: () => void
  onPercent: () => void
  onNegate: () => void
}

export default function ButtonPanel({
  onDigit,
  onOperator,
  onEvaluate,
  onClear,
  onBackspace,
  onPercent,
  onNegate,
}: ButtonPanelProps) {
  return (
    <div className="button-panel">
      {/* Row 1 */}
      <CalcButton label="AC" variant="clear" onClick={onClear} ariaLabel="Clear all" />
      <CalcButton label="⌫" variant="function" onClick={onBackspace} ariaLabel="Backspace" />
      <CalcButton label="%" variant="function" onClick={onPercent} ariaLabel="Percent" />
      <CalcButton label="÷" variant="operator" onClick={() => onOperator('÷')} ariaLabel="Divide" />

      {/* Row 2 */}
      <CalcButton label="7" variant="number" onClick={() => onDigit('7')} />
      <CalcButton label="8" variant="number" onClick={() => onDigit('8')} />
      <CalcButton label="9" variant="number" onClick={() => onDigit('9')} />
      <CalcButton label="×" variant="operator" onClick={() => onOperator('×')} ariaLabel="Multiply" />

      {/* Row 3 */}
      <CalcButton label="4" variant="number" onClick={() => onDigit('4')} />
      <CalcButton label="5" variant="number" onClick={() => onDigit('5')} />
      <CalcButton label="6" variant="number" onClick={() => onDigit('6')} />
      <CalcButton label="-" variant="operator" onClick={() => onOperator('-')} ariaLabel="Subtract" />

      {/* Row 4 */}
      <CalcButton label="1" variant="number" onClick={() => onDigit('1')} />
      <CalcButton label="2" variant="number" onClick={() => onDigit('2')} />
      <CalcButton label="3" variant="number" onClick={() => onDigit('3')} />
      <CalcButton label="+" variant="operator" onClick={() => onOperator('+')} ariaLabel="Add" />

      {/* Row 5 */}
      <CalcButton
        label="+/−"
        variant="function"
        onClick={onNegate}
        ariaLabel="Negate"
      />
      <CalcButton label="0" variant="number" onClick={() => onDigit('0')} />
      <CalcButton label="." variant="number" onClick={() => onDigit('.')} ariaLabel="Decimal point" />
      <CalcButton label="=" variant="equals" onClick={onEvaluate} ariaLabel="Equals" />
    </div>
  )
}
