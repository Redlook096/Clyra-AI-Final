export function formatNumber(num: number): string {
  if (!isFinite(num)) {
    return String(num);
  }

  if (Math.abs(num) > 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(10).replace(/\.?0+e/, "e");
  }

  const str = num.toPrecision(12);
  const formatted = parseFloat(str).toString();

  if (Number.isInteger(num)) {
    return formatted;
  }

  return formatted;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getDisplayFontSize(display: string): string {
  const len = display.length;
  if (len <= 8) return "text-4xl";
  if (len <= 12) return "text-3xl";
  if (len <= 16) return "text-2xl";
  if (len <= 20) return "text-xl";
  return "text-lg";
}
