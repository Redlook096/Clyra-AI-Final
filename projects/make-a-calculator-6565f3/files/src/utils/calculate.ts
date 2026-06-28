export type CalculationResult = {
  success: boolean;
  value: number | null;
  error: string | null;
};

/**
 * Safely evaluates a mathematical expression string.
 * Only allows digits, operators, decimals, parentheses, and whitespace.
 */
export function calculate(expression: string): CalculationResult {
  if (!expression || expression.trim() === "") {
    return { success: true, value: 0, error: null };
  }

  // Only allow safe characters
  const sanitized = expression.replace(/\s/g, "");
  if (!/^[0-9+\-*/.()]+$/.test(sanitized)) {
    return { success: false, value: null, error: "Invalid characters" };
  }

  // Prevent division by zero in the expression
  if (/\/\s*0(?:\s*[+\-*/)]|\s*$)/.test(sanitized)) {
    return { success: false, value: null, error: "Cannot divide by zero" };
  }

  // Prevent empty parentheses or dangling operators
  if (
    /[+\-*/.]$/.test(sanitized) ||
    /\(\s*\)/.test(sanitized) ||
    /[+\-*/]{2,}/.test(sanitized)
  ) {
    return { success: false, value: null, error: "Incomplete expression" };
  }

  try {
    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== "number" || !Number.isFinite(result)) {
      return { success: false, value: null, error: "Error" };
    }
    return { success: true, value: result, error: null };
  } catch {
    return { success: false, value: null, error: "Error" };
  }
}

/**
 * Gets a live preview of the current expression result.
 * Returns the formatted result or the expression itself if incomplete.
 */
export function getPreview(expression: string): string {
  if (!expression) return "0";
  const sanitized = expression.replace(/\s/g, "");
  // If ends with operator, try evaluating what's before it
  if (/[+\-*/]$/.test(sanitized)) {
    const beforeOp = sanitized.slice(0, -1);
    if (!beforeOp) return "0";
    const result = calculate(beforeOp);
    return result.success ? formatNumber(result.value!) : "0";
  }
  const result = calculate(sanitized);
  if (result.success && result.value !== null) {
    return formatNumber(result.value);
  }
  return "0";
}

/**
 * Format a number for display: avoid floating point artifacts, limit decimals.
 */
export function formatNumber(num: number): string {
  if (!Number.isFinite(num)) return "Error";
  // Handle very large/small numbers
  if (Math.abs(num) > 999999999999) {
    return num.toExponential(6);
  }
  // Fix floating point precision
  const fixed = parseFloat(num.toPrecision(12));
  return String(fixed);
}
