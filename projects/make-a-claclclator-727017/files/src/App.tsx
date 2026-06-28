import React, { useState, useCallback } from 'react';
import './styles.css';

export default function App() {
  const [currentValue, setCurrentValue] = useState('0');
  const [previousValue, setPreviousValue] = useState('');
  const [operator, setOperator] = useState('');

  const handleNumber = useCallback((num: string) => {
    setCurrentValue(prev => {
      if (prev === '0' && num !== '.') return num;
      if (num === '.' && prev.includes('.')) return prev;
      return prev + num;
    });
  }, []);

  const handleOperator = useCallback((op: string) => {
    if (operator) {
      const result = calculate(previousValue, currentValue, operator);
      setPreviousValue(result);
      setCurrentValue('0');
      setOperator(op);
    } else {
      setPreviousValue(currentValue);
      setCurrentValue('0');
      setOperator(op);
    }
  }, [currentValue, operator, previousValue]);

  const calculate = (a: string, b: string, op: string): string => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return '0';
    let result = 0;
    switch (op) {
      case '+': result = numA + numB; break;
      case '-': result = numA - numB; break;
      case '×': result = numA * numB; break;
      case '÷': result = numB === 0 ? Infinity : numA / numB; break;
      default: return '0';
    }
    return result.toString();
  };

  const handleEquals = useCallback(() => {
    if (!operator) return;
    const result = calculate(previousValue, currentValue, operator);
    setCurrentValue(result);
    setPreviousValue('');
    setOperator('');
  }, [currentValue, operator, previousValue]);

  const handleClear = useCallback(() => {
    setCurrentValue('0');
    setPreviousValue('');
    setOperator('');
  }, []);

  const formatDisplay = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '0';
    if (!Number.isInteger(num)) return val; // Keep decimal as is
    return val; // Could add commas but simple
  };

  return (
    <div className="calculator">
      <div className="display">
        <div className="previous">{previousValue} {operator}</div>
        <div className="current">{formatDisplay(currentValue)}</div>
      </div>
      <div className="buttons">
        <button onClick={() => handleNumber('7')}>7</button>
        <button onClick={() => handleNumber('8')}>8</button>
        <button onClick={() => handleNumber('9')}>9</button>
        <button className="operator" onClick={() => handleOperator('÷')}>÷</button>
        <button onClick={() => handleNumber('4')}>4</button>
        <button onClick={() => handleNumber('5')}>5</button>
        <button onClick={() => handleNumber('6')}>6</button>
        <button className="operator" onClick={() => handleOperator('×')}>×</button>
        <button onClick={() => handleNumber('1')}>1</button>
        <button onClick={() => handleNumber('2')}>2</button>
        <button onClick={() => handleNumber('3')}>3</button>
        <button className="operator" onClick={() => handleOperator('-')}>-</button>
        <button onClick={() => handleNumber('0')}>0</button>
        <button onClick={() => handleNumber('.')}>.</button>
        <button className="clear" onClick={handleClear}>C</button>
        <button className="operator equals" onClick={handleEquals}>=</button>
      </div>
    </div>
  );
}