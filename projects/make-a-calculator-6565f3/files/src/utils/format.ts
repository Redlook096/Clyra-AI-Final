/**
 * Format a number for display with locale-aware separators.
 */
export function formatDisplayNumber(num: number): string {
  if (!Number.isFinite(num)) return "Error";

  // For very large or very small numbers, use exponential notation
  if (Math.abs(num) > 999999999999 || (Math.abs(num) < 0.0000001 && num !== 0)) {
    return num.toExponential(6);
  }

  // Format with up to 10 significant digits, trimming trailing zeros
  const fixed = num.toPrecision(12);
  const parsed = parseFloat(fixed);

  // Use Intl for locale-aware thousands separators
  try {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 10,
      minimumFractionDigits: 0,
      useGrouping: true,
    }).format(parsed);
  } catch {
    return String(parsed);
  }
}

/**
 * Format the raw input expression for display.
 * Adds spaces around operators for readability.
 */
export function formatExpression(expr: string): string {
  return expr
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ")
    .replace(/\+/g, " + ")
    .replace(/-/g, " − ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Check if a string ends with an operator.
 */
export function endsWithOperator(str: string): boolean {
  return /[+\-*/.]$/.test(str.replace(/\s/g, ""));
}

/**
 * Check if a string is a valid number start.
 */
export function isValidNumberStart(key: string, current: string): boolean {
  if (key === ".") {
    // Find the current number being typed
    const parts = current.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    return !lastPart.includes(".");
  }
  return true;
}
