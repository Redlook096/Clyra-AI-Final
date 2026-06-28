import type { ButtonConfig } from '../../types';
import type { Operator } from '../../types';
import { BUTTONS } from '../../constants';
import { Button } from '../Button/Button';
import './Keypad.css';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onOperator: (op: Operator) => void;
  onEquals: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onNegate: () => void;
  onPercent: () => void;
}

export function Keypad({
  onDigit,
  onOperator,
  onEquals,
  onClear,
  onNegate,
  onPercent,
}: KeypadProps) {
  const handleButtonClick = (value: string, type: ButtonConfig['type']) => {
    switch (type) {
      case 'digit':
        onDigit(value);
        break;
      case 'operator':
        onOperator(value as Operator);
        break;
      case 'equals':
        onEquals();
        break;
      case 'clear':
        onClear();
        break;
      case 'function':
        if (value === 'negate') {
          onNegate();
        } else if (value === 'percent') {
          onPercent();
        }
        break;
    }
  };

  return (
    <div className="keypad">
      {BUTTONS.map((row, rowIndex) => (
        <div className="keypad__row" key={rowIndex}>
          {row.map((btn, btnIndex) => (
            <Button
              key={`${rowIndex}-${btnIndex}`}
              label={btn.label}
              value={btn.value}
              type={btn.type}
              span={btn.span}
              onClick={handleButtonClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
