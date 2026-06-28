/**
 * calcModel.js - Math engine for the Calculator app.
 * Handles tokenization, evaluation with operator precedence,
 * expression building, and history management.
 */

const HISTORY_KEY = "calc_history";

/* ===== Tokenizer & Parser ===== */

/**
 * Token types enum.
 */
const TokenType = {
  NUMBER: "NUMBER",
  OPERATOR: "OPERATOR",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  PERCENT: "PERCENT",
  SQRT: "SQRT",
  SQUARE: "SQUARE",
  RECIPROCAL: "RECIPROCAL",
  NEGATE: "NEGATE",
};

/**
 * Operator precedence (higher = evaluated first).
 */
const PRECEDENCE = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
};

/**
 * Tokenize an expression string into tokens.
 * @param {string} expr
 * @returns {Array} Array of token objects { type, value }
 */
function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    // Skip spaces
    if (ch === " ") {
      i++;
      continue;
    }

    // Numbers (including decimals)
    if (/\d/.test(ch) || (ch === "." && i + 1 < expr.length && /\d/.test(expr[i + 1]))) {
      let num = "";
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === ".")) {
        num += expr[i];
        i++;
      }
      // Avoid multiple decimals
      const parts = num.split(".");
      if (parts.length > 2) {
        num = parts[0] + "." + parts.slice(1).join("");
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Operators
    if ("+-*/".includes(ch)) {
      tokens.push({ type: TokenType.OPERATOR, value: ch });
      i++;
      continue;
    }

    // Percent
    if (ch === "%") {
      tokens.push({ type: TokenType.PERCENT });
      i++;
      continue;
    }

    // Skip unknown characters
    i++;
  }

  return tokens;
}

/**
 * Apply an operator to two operands.
 * @param {number} a
 * @param {number} b
 * @param {string} op
 * @returns {number}
 */
function applyOperator(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/":
      if (b === 0) throw new Error("Cannot divide by zero");
      return a / b;
    default:
      throw new Error(`Unknown operator: ${op}`);
  }
}

/**
 * Evaluate a tokenized expression using the shunting-yard algorithm.
 * @param {Array} tokens
 * @returns {number}
 */
function evaluateTokens(tokens) {
  if (tokens.length === 0) return 0;

  const output = [];
  const operators = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === TokenType.NUMBER) {
      output.push(token.value);
    } else if (token.type === TokenType.OPERATOR) {
      const op = token.value;
      while (
        operators.length > 0 &&
        operators[operators.length - 1].type === TokenType.OPERATOR &&
        PRECEDENCE[operators[operators.length - 1].value] >= PRECEDENCE[op]
      ) {
        const right = output.pop();
        const left = output.pop();
        const operator = operators.pop();
        output.push(applyOperator(left, right, operator.value));
      }
      operators.push(token);
    } else if (token.type === TokenType.PERCENT) {
      // Apply % to the last number in output (divide by 100)
      if (output.length > 0) {
        output[output.length - 1] = output[output.length - 1] / 100;
      }
    }
  }

  // Process remaining operators
  while (operators.length > 0) {
    const operator = operators.pop();
    if (output.length < 2) {
      throw new Error("Invalid expression");
    }
    const right = output.pop();
    const left = output.pop();
    output.push(applyOperator(left, right, operator.value));
  }

  if (output.length !== 1) {
    throw new Error("Invalid expression");
  }

  const result = output[0];
  if (!isFinite(result)) {
    throw new Error("Cannot divide by zero");
  }

  return result;
}

/**
 * Parse and evaluate a mathematical expression string.
 * Supports: +, -, *, /, %
 * @param {string} expression
 * @returns {number}
 */
function parseExpression(expression) {
  const tokens = tokenize(expression);
  return evaluateTokens(tokens);
}

/* ===== Expression Builder ===== */

/**
 * Calculator state machine for building expressions.
 */
class ExpressionBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentInput = "0";      // Current number being typed
    this.expression = "";          // Full expression string
    this.result = null;            // Last computed result
    this.lastOperator = null;      // Last operator (for chaining)
    this.justCalculated = false;   // Flag for after = press
  }

  /**
   * Get the full expression for display.
   * @returns {string}
   */
  getExpression() {
    return this.expression;
  }

  /**
   * Get the current display value.
   * @returns {string}
   */
  getDisplay() {
    if (this.expression === "" && this.currentInput === "0") {
      return "0";
    }
    return this.currentInput;
  }

  /**
   * Input a digit or decimal point.
   * @param {string} value - "0"-"9" or "."
   */
  inputDigit(value) {
    if (this.justCalculated) {
      // Start fresh after calculation
      this.reset();
      this.justCalculated = false;
    }

    if (value === ".") {
      // Prevent multiple decimals
      if (this.currentInput.includes(".")) return;
      this.currentInput += ".";
    } else {
      // Prevent leading zeros
      if (this.currentInput === "0" && value === "0") return;
      if (this.currentInput === "0") {
        this.currentInput = value;
      } else {
        this.currentInput += value;
      }
    }
  }

  /**
   * Input an operator (+, -, *, /).
   * @param {string} op
   */
  inputOperator(op) {
    // If we have a result from previous calculation, use it as base
    if (this.justCalculated && this.result !== null) {
      this.currentInput = String(this.result);
      this.expression = this.currentInput;
      this.justCalculated = false;
    }

    // Build expression string
    if (this.expression === "") {
      this.expression = this.currentInput;
    }

    this.expression += ` ${op} `;
    this.lastOperator = op;
    this.currentInput = "0";
  }

  /**
   * Calculate the current expression.
   * @returns {number}
   */
  calculate() {
    // Build complete expression
    let fullExpr;
    if (this.expression === "") {
      fullExpr = this.currentInput;
    } else {
      fullExpr = this.expression + this.currentInput;
    }

    const result = parseExpression(fullExpr);
    this.result = result;
    this.expression = fullExpr + " =";
    this.currentInput = String(result);
    this.justCalculated = true;
    return result;
  }

  /**
   * Apply unary operation.
   * @param {string} action - "sqrt", "square", "reciprocal", "negate", "percent"
   * @returns {number}
   */
  applyUnary(action) {
    if (this.justCalculated && this.result !== null) {
      this.currentInput = String(this.result);
      this.expression = "";
      this.justCalculated = false;
    }

    const value = parseFloat(this.currentInput);
    let result;
    let displayOp = "";

    switch (action) {
      case "sqrt":
        if (value < 0) throw new Error("Invalid input");
        result = Math.sqrt(value);
        displayOp = "√(" + this.currentInput + ")";
        break;
      case "square":
        result = value * value;
        displayOp = "sqr(" + this.currentInput + ")";
        break;
      case "reciprocal":
        if (value === 0) throw new Error("Cannot divide by zero");
        result = 1 / value;
        displayOp = "1/(" + this.currentInput + ")";
        break;
      case "negate":
        result = -value;
        displayOp = "neg(" + this.currentInput + ")";
        break;
      case "percent":
        result = value / 100;
        displayOp = this.currentInput + "%";
        break;
      default:
        throw new Error("Unknown operation");
    }

    this.expression = displayOp + " =";
    this.currentInput = String(result);
    this.result = result;
    this.justCalculated = true;
    return result;
  }

  /**
   * Remove the last character from current input.
   */
  backspace() {
    if (this.justCalculated) {
      this.reset();
      return;
    }

    if (this.currentInput.length > 1) {
      this.currentInput = this.currentInput.slice(0, -1);
    } else {
      this.currentInput = "0";
    }
  }
}

/* ===== History Management ===== */

/**
 * Load calculation history from localStorage.
 * @returns {Array}
 */
function loadHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save a calculation to history.
 * @param {string} expression
 * @param {string} result
 */
function saveHistoryEntry(expression, result) {
  try {
    const history = loadHistory();
    history.unshift({ expression, result, timestamp: Date.now() });

    // Keep max 50 entries
    if (history.length > 50) {
      history.length = 50;
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

/**
 * Clear all calculation history.
 */
function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear history:", error);
  }
}
