import React from 'react';
import { ButtonDef, ButtonAction } from '../types/calculator';
import { BUTTONS } from '../utils/constants';
import CalculatorButton from './CalculatorButton';
import './ButtonGrid.css';

interface ButtonGridProps {
  isSecondFn: boolean;
  angleMode: string;
  onAction: (action: ButtonAction) => void;
}

const ButtonGrid: React.FC<ButtonGridProps> = React.memo(({ isSecondFn, angleMode, onAction }) => {
  // Filter out buttons based on second function state for row 4
  // Row 0-3 always shown, row 4 shows based on 2nd mode, row 5 always shown
  
  return (
    <div className="btn-grid">
      {BUTTONS.map((btn, index) => (
        <CalculatorButton
          key={index}
          button={btn}
          isSecondFn={isSecondFn}
          angleMode={angleMode}
          onAction={onAction}
        />
      ))}
    </div>
  );
});

ButtonGrid.displayName = 'ButtonGrid';
export default ButtonGrid;
