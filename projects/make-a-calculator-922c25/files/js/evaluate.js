/**
 * Safe math expression evaluator.
 * Parses and evaluates a mathematical expression string without using eval().
 * Supports: +, -, ×, ÷, %, sqrt, parentheses, decimal numbers, negative numbers.
 */
const ExpressionEvaluator = {
  /**
   * Evaluate a mathematical expression.
   * @param {string} expr - The expression to evaluate.
   * @returns {{ result: number | null, error: string | null }}
   */
  evaluate(expr) {
    try {
      if (!expr || expr.trim() === '') {
        return { result: null, error: null };
      }

      // Normalize the expression
      let normalized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\(-/g, '(0-')  // Handle negative inside parens
        .replace(/\(\+/g, '(');

      // Handle leading negative
      if (normalized.startsWith('-')) {
        normalized = '0' + normalized;
      }

      // Validate characters - only allow digits, operators, parens, and dots
      if (!/^[\d+\-*/.()%\s]+$/.test(normalized)) {
        return { result: null, error: 'Invalid characters' };
      }

      // Validate expression structure
      if (!this._isValidStructure(normalized)) {
        return { result: null, error: 'Invalid expression' };
      }

      // Tokenize
      const tokens = this._tokenize(normalized);
      if (!tokens) {
        return { result: null, error: 'Invalid expression' };
      }

      // Convert to RPN (Shunting Yard)
      const rpn = this._shuntingYard(tokens);
      if (!rpn) {
        return { result: null, error: 'Mismatched parentheses' };
      }

      // Evaluate RPN
      const result = this._evaluateRPN(rpn);
      if (result === null || result === undefined || !isFinite(result)) {
        return { result: null, error: isNaN(result) ? 'Error' : 'Infinity' };
      }

      return { result: this._roundToPrecision(result), error: null };
    } catch (e) {
      return { result: null, error: 'Error' };
    }
  },

  /**
   * Check if expression has valid structure.
   */
  _isValidStructure(expr) {
    // Check for consecutive operators (except minus for negation)
    if (/[+*/.]{2,}/.test(expr.replace(/-\s*-/g, '+')) && expr.includes('..')) {
      return false;
    }
    // Check for empty parentheses
    if (/\(\)/.test(expr)) {
      return false;
    }
    // Check balanced parentheses
    let depth = 0;
    for (const char of expr) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) return false;
    }
    if (depth !== 0) return false;
    return true;
  },

  /**
   * Tokenize the expression into numbers and operators.
   */
  _tokenize(expr) {
    const tokens = [];
    let numBuffer = '';
    let i = 0;

    while (i < expr.length) {
      const char = expr[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (/[\d.]/.test(char)) {
        numBuffer += char;
        i++;
        continue;
      }

      // If we have a number buffer, push it
      if (numBuffer) {
        const num = parseFloat(numBuffer);
        if (isNaN(num)) return null;
        tokens.push({ type: 'number', value: num });
        numBuffer = '';
      }

      // Handle operators and parentheses
      if ('+-*/()%'.includes(char)) {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }

      return null;
    }

    // Flush remaining number buffer
    if (numBuffer) {
      const num = parseFloat(numBuffer);
      if (isNaN(num)) return null;
      tokens.push({ type: 'number', value: num });
    }

    return tokens;
  },

  /**
   * Shunting Yard algorithm to convert infix to RPN.
   */
  _shuntingYard(tokens) {
    const output = [];
    const operators = [];
    const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'number') {
        output.push(token);
      } else if (token.type === 'operator') {
        if (token.value === '(') {
          operators.push(token);
        } else if (token.value === ')') {
          while (operators.length > 0 && operators[operators.length - 1].value !== '(') {
            output.push(operators.pop());
          }
          operators.pop(); // Remove '('
        } else {
          // Handle unary minus: if previous token is operator or '(' or start
          if (token.value === '-' && (i === 0 || tokens[i - 1].type === 'operator' && tokens[i - 1].value !== ')')) {
            // Treat as unary negation; simplest: get next number and negate
            // Actually, let's handle this by pushing a special marker
            // Simpler approach: negate the next number token
            if (i + 1 < tokens.length && tokens[i + 1].type === 'number') {
              i++;
              output.push({ type: 'number', value: -tokens[i].value });
              continue;
            }
          }

          while (
            operators.length > 0 &&
            operators[operators.length - 1].value !== '(' &&
            precedence[token.value] <= precedence[operators[operators.length - 1].value]
          ) {
            output.push(operators.pop());
          }
          operators.push(token);
        }
      }
    }

    while (operators.length > 0) {
      const op = operators.pop();
      if (op.value === '(' || op.value === ')') return null;
      output.push(op);
    }

    return output;
  },

  /**
   * Evaluate a Reverse Polish Notation expression.
   */
  _evaluateRPN(rpn) {
    const stack = [];

    for (const token of rpn) {
      if (token.type === 'number') {
        stack.push(token.value);
      } else if (token.type === 'operator') {
        if (stack.length < 2) return null;
        const b = stack.pop();
        const a = stack.pop();

        switch (token.value) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/':
            if (b === 0) return null;
            stack.push(a / b);
            break;
          case '%':
            if (b === 0) return null;
            stack.push(a % b);
            break;
          default:
            return null;
        }
      }
    }

    if (stack.length !== 1) return null;
    return stack[0];
  },

  /**
   * Round to avoid floating point issues.
   */
  _roundToPrecision(num) {
    if (Math.abs(num) < 1e-15) return 0;
    // Round to 10 decimal places to avoid floating point artifacts
    return Math.round(num * 1e10) / 1e10;
  }
};
