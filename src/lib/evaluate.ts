import { evaluate as mathEvaluate } from "mathjs";

export function safeEvaluate(expr: string, angleMode: "deg" | "rad"): { value: number | null; error: string | null } {
  try {
    // Replace × and ÷ with * and /
    let sanitized = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/π/g, "pi")
      .replace(/e(?![xp])/g, "2.718281828459045")
      .replace(/sin\(/g, angleMode === "deg" ? "sin(deg " : "sin(")
      .replace(/cos\(/g, angleMode === "deg" ? "cos(deg " : "cos(")
      .replace(/tan\(/g, angleMode === "deg" ? "tan(deg " : "tan(");

    const result = mathEvaluate(sanitized);

    if (typeof result !== "number") {
      return { value: null, error: "Invalid expression" };
    }

    if (!isFinite(result)) {
      return { value: result, error: null };
    }

    return { value: result, error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return { value: null, error: message };
  }
}

export function evaluateSingleFn(fn: string, operand: number, angleMode: "deg" | "rad"): { value: number | null; error: string | null } {
  try {
    let result: number;

    switch (fn) {
      case "sin": {
        const rad = angleMode === "deg" ? (operand * Math.PI) / 180 : operand;
        result = Math.sin(rad);
        break;
      }
      case "cos": {
        const rad = angleMode === "deg" ? (operand * Math.PI) / 180 : operand;
        result = Math.cos(rad);
        break;
      }
      case "tan": {
        const rad = angleMode === "deg" ? (operand * Math.PI) / 180 : operand;
        result = Math.tan(rad);
        break;
      }
      case "log":
        result = Math.log10(operand);
        break;
      case "ln":
        result = Math.log(operand);
        break;
      case "sqrt":
        result = Math.sqrt(operand);
        break;
      case "square":
        result = operand * operand;
        break;
      case "cube":
        result = operand * operand * operand;
        break;
      case "reciprocal":
        result = 1 / operand;
        break;
      case "factorial": {
        if (operand < 0 || !Number.isInteger(operand)) {
          return { value: null, error: "Factorial requires non-negative integer" };
        }
        result = factorial(Math.floor(operand));
        break;
      }
      case "percent":
        result = operand / 100;
        break;
      default:
        return { value: null, error: `Unknown function: ${fn}` };
    }

    if (!isFinite(result)) {
      return { value: result, error: null };
    }

    return { value: result, error: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error";
    return { value: null, error: message };
  }
}

export function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
