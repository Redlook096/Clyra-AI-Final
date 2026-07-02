import React from 'react';
import './CalculatorDisplay.css';

interface CalculatorDisplayProps {
  expression: string;
  display: string;
  result: string;
  error: string | null;
  justEvaluated: boolean;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = React.memo(({ expression, display, result, error, justEvaluated }) => {
  const formattedExpression = expression
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−');

  return (
    <div className="calc-display">
      <div className="calc-display__expression" aria-label="Expression">
        {formattedExpression || '\u00A0'}
      </div>
      <div className={`calc-display__result ${error ? 'calc-display__result--error' : ''} ${justEvaluated ? 'calc-display__result--pop' : ''}`} aria-label={error || 'Result'}>
        {error || result || display || '0'}
      </div>
    </div>
  );
});

CalculatorDisplay.displayName = 'CalculatorDisplay';
export default CalculatorDisplay;
