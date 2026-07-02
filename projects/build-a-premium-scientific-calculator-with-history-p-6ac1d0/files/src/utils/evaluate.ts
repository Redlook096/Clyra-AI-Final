import { create, all, MathJsInstance } from 'mathjs';
import { AngleMode } from '../types/calculator';

const math: MathJsInstance = create(all, {});

function preprocess(expr: string, _angleMode: AngleMode): string {
  let e = expr.trim();

  // Replace displayed operators with mathjs operators
  e = e.replace(/×/g, '*');
  e = e.replace(/÷/g, '/');
  e = e.replace(/−/g, '-');

  // Handle implicit multiplication
  e = e.replace(/(\d)(\()/g, '$1*$2');
  e = e.replace(/(\d)([πe])/g, '$1*$2');
  e = e.replace(/([πe])(\d)/g, '$1*$2');
  e = e.replace(/(\))(\()/g, '$1*$2');
  e = e.replace(/(\))(\d)/g, '$1*$2');
  e = e.replace(/(\))([πe])/g, '$1*$2');

  // Replace π constant with its value
  e = e.replace(/π/g, `(${Math.PI})`);

  // Replace standalone 'e' constant - use a different approach since lookbehind may not work everywhere
  // Replace 'e' that's not part of a function name or after a decimal
  e = e.replace(/(^|[+\-*/()])e(?![a-zA-Z(])/g, '$1' + Math.E);

  // Replace factorial notation
  e = e.replace(/(\d+)!/g, 'factorial($1)');
  e = e.replace(/\)!/g, ')!');

  // Percentage
  e = e.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

  return e;
}

function countChar(str: string, ch: string): number {
  const escaped = ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (str.match(new RegExp(escaped, 'g')) || []).length;
}

export function evaluateExpression(expr: string, angleMode: AngleMode): { result: string; error: string | null } {
  try {
    if (!expr.trim()) return { result: '', error: null };

    const processed = preprocess(expr, angleMode);

    // Auto-close parentheses
    const openCount = countChar(processed, '(');
    const closeCount = countChar(processed, ')');
    const balanced = openCount > closeCount ? processed + ')'.repeat(openCount - closeCount) : processed;

    const customFunctions: Record<string, (...args: number[]) => number> = {
      deg2rad: (x: number) => x * (Math.PI / 180),
      factorial: (x: number) => {
        if (x < 0 || !Number.isInteger(x)) throw new Error('Factorial requires non-negative integer');
        if (x > 170) return Infinity;
        let r = 1;
        for (let i = 2; i <= x; i++) r *= i;
        return r;
      },
    };

    // For DEG mode, wrap sin/cos/tan arguments with deg2rad
    let evalStr = balanced;
    if (angleMode === 'DEG') {
      evalStr = evalStr.replace(/\bsin\(/g, 'sin(deg2rad(');
      evalStr = evalStr.replace(/\bcos\(/g, 'cos(deg2rad(');
      evalStr = evalStr.replace(/\btan\(/g, 'tan(deg2rad(');
      // Re-balance after adding deg2rad wrappers
      const newOpen = countChar(evalStr, '(');
      const newClose = countChar(evalStr, ')');
      if (newOpen > newClose) {
        evalStr = evalStr + ')'.repeat(newOpen - newClose);
      }
    }

    const result = math.evaluate(evalStr, customFunctions);

    if (result === undefined || result === null) {
      return { result: '', error: null };
    }

    const numResult = Number(result);
    if (!isFinite(numResult)) {
      return { result: numResult > 0 ? 'Infinity' : '-Infinity', error: null };
    }
    if (isNaN(numResult)) {
      return { result: 'Error', error: 'Invalid calculation' };
    }

    let formatted: string;
    if (Math.abs(numResult) > 1e15 || (Math.abs(numResult) < 1e-10 && numResult !== 0)) {
      formatted = numResult.toExponential(6);
    } else {
      formatted = parseFloat(numResult.toPrecision(12)).toString();
    }

    return { result: formatted, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error';
    if (message.includes('Infinity') || message.includes('Division by zero')) {
      return { result: 'Infinity', error: null };
    }
    return { result: 'Error', error: message };
  }
}

export function applyUnaryFunction(expression: string, fn: string, _angleMode: AngleMode): string {
  const trimmed = expression.trim();
  switch (fn) {
    case 'square': return trimmed ? `(${trimmed})^2` : '';
    case 'cube': return trimmed ? `(${trimmed})^3` : '';
    case 'sqrt': return `sqrt(${trimmed || '0'})`;
    case 'cbrt': return `cbrt(${trimmed || '0'})`;
    case 'sin': return `sin(${trimmed || '0'})`;
    case 'cos': return `cos(${trimmed || '0'})`;
    case 'tan': return `tan(${trimmed || '0'})`;
    case 'asin': return `asin(${trimmed || '0'})`;
    case 'acos': return `acos(${trimmed || '0'})`;
    case 'atan': return `atan(${trimmed || '0'})`;
    case 'log': return `log10(${trimmed || '0'})`;
    case 'ln': return `log(${trimmed || '0'})`;
    case 'tenpow': return `10^(${trimmed || '0'})`;
    case 'factorial': return `(${trimmed || '0'})!`;
    case 'pow': return `(${trimmed || '0'})^`;
    case 'exp': return trimmed ? `${trimmed}e` : '1e';
    case 'negate': return trimmed.startsWith('-') ? trimmed.slice(1) : `-${trimmed}`;
    default: return trimmed;
  }
}
