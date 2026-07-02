export function formatNumber(num: number): string {
  if (!isFinite(num)) {
    return num > 0 ? 'Infinity' : '-Infinity';
  }
  if (isNaN(num)) return 'Error';

  // Handle very large/small numbers with scientific notation
  if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(6);
  }

  // Format to avoid floating point noise
  const str = num.toPrecision(12);
  // Remove trailing zeros after decimal point
  const parsed = parseFloat(str);
  return parsed.toString();
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatDisplayExpression(expr: string): string {
  return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−');
}
