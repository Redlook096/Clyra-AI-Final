import React, { useCallback } from 'react';
import { ButtonDef, ButtonAction } from '../types/calculator';
import './CalculatorButton.css';

interface CalculatorButtonProps {
  button: ButtonDef;
  isSecondFn: boolean;
  angleMode: string;
  onAction: (action: ButtonAction) => void;
}

const CalculatorButton: React.FC<CalculatorButtonProps> = React.memo(({ button, isSecondFn, angleMode, onAction }) => {
  const handleClick = useCallback(() => {
    onAction(button.action);
  }, [button.action, onAction]);

  // Determine label
  let label = button.label;
  
  if (button.action.type === 'angle') {
    // Show current active angle mode
    label = angleMode;
  } else if (isSecondFn && button.label2) {
    // When 2nd is pressed, swap labels for sin/cos/tan rows
    if (['sin', 'cos', 'tan', 'sin⁻¹', 'cos⁻¹', 'tan⁻¹'].includes(button.label)) {
      label = button.label2;
    }
  }

  const variant = button.variant || 'number';
  const span = button.span || 1;

  return (
    <button
      className={`calc-btn calc-btn--${variant}${span > 1 ? ` calc-btn--span-${span}` : ''}`}
      onClick={handleClick}
      type="button"
      aria-label={label}
    >
      <span className="calc-btn__label">{label}</span>
      <span className="calc-btn__ripple" />
    </button>
  );
});

CalculatorButton.displayName = 'CalculatorButton';
export default CalculatorButton;
