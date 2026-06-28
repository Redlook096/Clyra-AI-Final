import { useEffect, useRef } from 'react';
import './Display.css';

interface DisplayProps {
  expression: string;
  currentValue: string;
  errorMessage: string | null;
  state: 'inputting' | 'result' | 'operator' | 'error';
}

export function Display({ expression, currentValue, errorMessage, state }: DisplayProps) {
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state === 'result' && resultRef.current) {
      resultRef.current.classList.remove('display__result--animate');
      // Trigger reflow
      void resultRef.current.offsetWidth;
      resultRef.current.classList.add('display__result--animate');
    }
  }, [currentValue, state]);

  const displayValue = state === 'error' && errorMessage ? errorMessage : currentValue;
  const isError = state === 'error';

  return (
    <div className="display">
      <div className="display__expression" title={expression}>
        {expression || '\u00A0'}
      </div>
      <div
        ref={resultRef}
        className={`display__result ${isError ? 'display__result--error' : ''} ${
          state === 'result' ? 'display__result--animate' : ''
        }`}
      >
        {displayValue}
      </div>
    </div>
  );
}
