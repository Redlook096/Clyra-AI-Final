export function formatNumber(value: number): string {
  if (!isFinite(value)) {
    return 'Error';
  }

  // Handle very large/small numbers with scientific notation
  if (Math.abs(value) > 999999999999 || (Math.abs(value) < 0.000000001 && value !== 0)) {
    return value.toExponential(6);
  }

  // Format with appropriate decimal places
  const str = String(value);
  const parts = str.split('.');

  if (parts.length === 1) {
    // Integer - add commas
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Has decimal part
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Limit decimal places to avoid overflow in display
  const decimalPart = parts[1].slice(0, 10);
  
  return `${intPart}.${decimalPart}`;
}

export function roundResult(value: number): number {
  // Avoid floating point issues by rounding to 10 decimal places
  return Math.round(value * 1e10) / 1e10;
}

export function evaluateExpression(a: number, b: number, operator: string): number {
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      if (b === 0) {
        throw new Error('Cannot divide by zero');
      }
      return a / b;
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

export function parseDisplayValue(value: string): number {
  if (value === '' || value === '-') {
    return 0;
  }
  // Remove commas for parsing
  const clean = value.replace(/,/g, '');
  return parseFloat(clean);
}

export function cleanNumberInput(value: string): string {
  // Remove commas for internal representation
  return value.replace(/,/g, '');
}
