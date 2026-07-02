/**
 * Calculator class - core logic and state management.
 */
class Calculator {
  constructor() {
    this.reset();
  }

  /**
   * Reset the calculator to its initial state.
   */
  reset() {
    this.currentInput = '0';
    this.expression = '';
    this.previousResult = null;
    this.lastOperator = null;
    this.lastOperand = null;
    this.newInput = true;        // Next digit starts fresh
    this.justEvaluated = false;  // Was = just pressed?
    this.errorState = false;
    this.currentOperator = null; // The last operator button pressed for highlighting
  }

  /**
   * Get the current display value.
   */
  getDisplayValue() {
    if (this.errorState) {
      return 'Error';
    }
    return this._formatNumber(this.currentInput);
  }

  /**
   * Get the expression display.
   */
  getExpression() {
    if (this.errorState) {
      return '';
    }
    return this.expression;
  }

  /**
   * Input a digit.
   */
  inputDigit(digit) {
    if (this.errorState) return;

    if (this.justEvaluated) {
      // Start fresh after evaluation
      if (digit === '0') {
        // Keep zero, but don't add leading zeros
        this.currentInput = '0';
        this.expression = '';
        this.newInput = true;
        this.justEvaluated = false;
        return;
      }
      this.currentInput = '';
      this.expression = '';
      this.previousResult = null;
      this.lastOperator = null;
      this.lastOperand = null;
      this.justEvaluated = false;
      this.newInput = false;
    }

    if (this.newInput) {
      this.currentInput = digit === '0' ? '0' : digit;
      this.newInput = false;
    } else {
      // Limit input length
      if (this.currentInput.replace('-', '').replace('.', '').length >= 15) {
        return;
      }
      if (this.currentInput === '0' && digit !== '.') {
        this.currentInput = digit;
      } else {
        this.currentInput += digit;
      }
    }

    this.currentOperator = null;
    this._notifyListeners();
  }

  /**
   * Input a decimal point.
   */
  inputDecimal() {
    if (this.errorState) return;

    if (this.justEvaluated) {
      this.currentInput = '0.';
      this.expression = '';
      this.previousResult = null;
      this.lastOperator = null;
      this.lastOperand = null;
      this.justEvaluated = false;
      this.newInput = false;
      this.currentOperator = null;
      this._notifyListeners();
      return;
    }

    if (this.newInput) {
      this.currentInput = '0.';
      this.newInput = false;
      this.currentOperator = null;
      this._notifyListeners();
      return;
    }

    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
    }

    this.currentOperator = null;
    this._notifyListeners();
  }

  /**
   * Input an operator (+, -, ×, ÷).
   */
  inputOperator(op) {
    if (this.errorState) return;

    this.justEvaluated = false;

    if (this.newInput && this.expression === '') {
      // Can't start with operator (except minus, handled as sign)
      return;
    }

    // If we have a previous operator and new input, replace it
    if (this.newInput && this.expression !== '') {
      // Replace the last operator in expression
      this.expression = this.expression.replace(/\s*[+\-×÷]\s*$/, '') + ` ${op} `;
      this.currentOperator = op;
      this._notifyListeners();
      return;
    }

    // If we already have an expression, evaluate the current chain
    if (this.expression !== '' && !this.newInput) {
      const result = this._evaluateCurrent();
      if (result === null) {
        this.errorState = true;
        this._notifyListeners();
        return;
      }
      this.currentInput = result;
      this.expression = `${result} ${op} `;
    } else {
      // Start new expression
      this.expression = `${this.currentInput} ${op} `;
    }

    this.newInput = true;
    this.currentOperator = op;
    this._notifyListeners();
  }

  /**
   * Evaluate the current expression.
   */
  evaluate() {
    if (this.errorState) return;
    if (this.expression === '' && this.currentInput === '0') return;

    this.justEvaluated = true;
    this.currentOperator = null;

    let fullExpr;
    if (this.expression !== '') {
      fullExpr = this.expression + this.currentInput;
    } else {
      fullExpr = this.currentInput;
    }

    const { result, error } = ExpressionEvaluator.evaluate(fullExpr);

    if (error !== null || result === null) {
      this.errorState = true;
      this._notifyListeners();
      return;
    }

    // Store result and expression for history
    this.lastExpression = fullExpr;
    this.lastResult = result;

    this.expression = `${fullExpr} =`;
    this.currentInput = String(result);
    this.previousResult = result;
    this.newInput = true;

    this._notifyListeners();
    return result;
  }

  /**
   * Toggle positive/negative sign.
   */
  toggleSign() {
    if (this.errorState) return;

    if (this.justEvaluated) {
      this.expression = '';
      this.justEvaluated = false;
    }

    if (this.currentInput !== '0') {
      if (this.currentInput.startsWith('-')) {
        this.currentInput = this.currentInput.slice(1);
      } else {
        this.currentInput = '-' + this.currentInput;
      }
    }

    this.currentOperator = null;
    this._notifyListeners();
  }

  /**
   * Apply percentage (divide by 100).
   */
  percent() {
    if (this.errorState) return;

    const num = parseFloat(this.currentInput);
    if (isNaN(num)) return;

    this.currentInput = String(num / 100);
    this.currentOperator = null;
    this._notifyListeners();
  }

  /**
   * Backspace - remove last character.
   */
  backspace() {
    if (this.errorState) {
      this.clear();
      return;
    }

    if (this.justEvaluated) {
      this.expression = '';
      this.justEvaluated = false;
      this.currentOperator = null;
      this._notifyListeners();
      return;
    }

    if (this.newInput) return;

    if (this.currentInput.length <= 1 || (this.currentInput.length === 2 && this.currentInput.startsWith('-'))) {
      this.currentInput = '0';
      this.newInput = true;
    } else {
      this.currentInput = this.currentInput.slice(0, -1);
    }

    this.currentOperator = null;
    this._notifyListeners();
  }

  /**
   * Clear (C) or All Clear (AC).
   */
  clear() {
    if (this.currentInput !== '0' || this.newInput === false) {
      // First press: clear current input (C)
      this.currentInput = '0';
      this.newInput = true;
      this.errorState = false;
      this.currentOperator = null;
      this._notifyListeners();
    } else {
      // Second press: full reset (AC)
      this.reset();
      this._notifyListeners();
    }
  }

  /**
   * Get the clear button label.
   */
  getClearLabel() {
    if (this.currentInput !== '0' || this.newInput === false) {
      return 'C';
    }
    return 'AC';
  }

  /**
   * Evaluate the partial expression.
   */
  _evaluateCurrent() {
    const expr = this.expression + this.currentInput;
    const { result, error } = ExpressionEvaluator.evaluate(expr);
    if (error !== null || result === null) return null;
    return String(result);
  }

  /**
   * Format number for display.
   */
  _formatNumber(numStr) {
    const num = parseFloat(numStr);
    if (isNaN(num)) return '0';

    // If it's a whole number, show without decimals
    if (Number.isInteger(num) && !numStr.includes('.') && numStr.length < 16) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }

    // For decimal numbers, format nicely
    const parts = numStr.split('.');
    const intPart = parseInt(parts[0]);
    const isNeg = numStr.startsWith('-');
    const absIntStr = isNeg ? parts[0].slice(1) : parts[0];

    let formatted = '';
    if (intPart === 0 && numStr !== '0' && !isNeg) {
      // Handle numbers like 0.xxx
      if (absIntStr.length <= 15) {
        formatted = num.toLocaleString('en-US', { maximumFractionDigits: 10 });
      } else {
        // Scientific notation for very long numbers
        formatted = num.toExponential(6);
      }
    } else if (absIntStr.length <= 15) {
      if (parts.length === 1) {
        formatted = parseInt(parts[0]).toLocaleString('en-US');
      } else {
        const intFormatted = parseInt(parts[0]).toLocaleString('en-US');
        const decPart = parts[1] || '';
        formatted = `${intFormatted}${decPart ? '.' + decPart : ''}`;
      }
    } else {
      formatted = num.toExponential(6);
    }

    return formatted;
  }

  /**
   * Observer pattern for state changes.
   */
  _listeners = [];

  onChange(callback) {
    this._listeners.push(callback);
  }

  _notifyListeners() {
    for (const cb of this._listeners) {
      cb(this);
    }
  }

  /**
   * Check if the display should show AC (all clear) or just C.
   */
  isAllClear() {
    return this.currentInput === '0' && this.newInput === true && this.expression === '';
  }
}
