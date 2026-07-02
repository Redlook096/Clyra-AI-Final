/**
 * Input handler - manages keyboard and button click input.
 */
class InputHandler {
  constructor(calculator, displayManager, historyManager) {
    this.calculator = calculator;
    this.display = displayManager;
    this.history = historyManager;
    this._bindEvents();
  }

  /**
   * Bind all input events.
   */
  _bindEvents() {
    // Button clicks
    document.querySelector('.keypad').addEventListener('click', (e) => {
      const key = e.target.closest('.key');
      if (!key) return;
      this._handleButton(key);
    });

    // Keyboard input
    document.addEventListener('keydown', (e) => this._handleKeyboard(e));

    // History toggle
    document.querySelector('.history-toggle').addEventListener('click', () => {
      this.history.toggle();
    });

    // History clear
    document.getElementById('historyClear').addEventListener('click', () => {
      this.history.clear();
    });

    // Listen for calculator state changes
    this.calculator.onChange((calc) => {
      this.display.update(calc);
    });
  }

  /**
   * Handle button click.
   */
  _handleButton(key) {
    const action = key.dataset.action;
    const value = key.dataset.value;

    // Create ripple effect
    this._createRipple(key, key.dataset.action !== 'backspace');

    switch (action) {
      case 'number':
        this.calculator.inputDigit(value);
        break;
      case 'decimal':
        this.calculator.inputDecimal();
        break;
      case 'operator':
        this.calculator.inputOperator(value);
        break;
      case 'equals':
        this._handleEquals();
        break;
      case 'clear':
        this.calculator.clear();
        break;
      case 'backspace':
        this.calculator.backspace();
        break;
      case 'sign':
        this.calculator.toggleSign();
        break;
      case 'percent':
        this.calculator.percent();
        break;
    }
  }

  /**
   * Handle equals press.
   */
  _handleEquals() {
    const result = this.calculator.evaluate();
    if (result !== undefined && this.calculator.lastExpression && !this.calculator.errorState) {
      this.history.addEntry(
        this.calculator.lastExpression,
        this.calculator.lastResult
      );
    }
  }

  /**
   * Handle keyboard input.
   */
  _handleKeyboard(e) {
    const key = e.key;

    // Prevent default for calculator keys
    if (this._isCalculatorKey(key)) {
      e.preventDefault();
    }

    let action = null;
    let buttonSelector = null;

    if (/^[0-9]$/.test(key)) {
      action = 'number';
      buttonSelector = `[data-action="number"][data-value="${key}"]`;
      this.calculator.inputDigit(key);
    } else if (key === '.') {
      buttonSelector = '[data-action="decimal"]';
      this.calculator.inputDecimal();
    } else if (key === '+') {
      buttonSelector = '[data-action="operator"][data-value="+"]';
      this.calculator.inputOperator('+');
    } else if (key === '-') {
      buttonSelector = '[data-action="operator"][data-value="-"]';
      this.calculator.inputOperator('-');
    } else if (key === '*') {
      buttonSelector = '[data-action="operator"][data-value="×"]';
      this.calculator.inputOperator('×');
    } else if (key === '/') {
      buttonSelector = '[data-action="operator"][data-value="÷"]';
      this.calculator.inputOperator('÷');
    } else if (key === 'Enter' || key === '=') {
      buttonSelector = '[data-action="equals"]';
      this._handleEquals();
    } else if (key === 'Backspace') {
      buttonSelector = '[data-action="backspace"]';
      this.calculator.backspace();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      buttonSelector = '[data-action="clear"]';
      this.calculator.clear();
    } else if (key === '%') {
      buttonSelector = '[data-action="percent"]';
      this.calculator.percent();
    } else {
      return; // Not a calculator key
    }

    // Visual feedback on the pressed key
    if (buttonSelector) {
      const btn = document.querySelector(buttonSelector);
      if (btn) {
        this._createRipple(btn, false);
        btn.classList.add('key-pressed');
        setTimeout(() => btn.classList.remove('key-pressed'), 120);
      }
    }
  }

  /**
   * Check if a key is a calculator key.
   */
  _isCalculatorKey(key) {
    return /^[0-9]$/.test(key) ||
      ['.', '+', '-', '*', '/', 'Enter', '=', 'Backspace', 'Escape', 'c', 'C', '%'].includes(key);
  }

  /**
   * Create a ripple effect on a button.
   */
  _createRipple(button, center = true) {
    const existing = button.querySelector('.ripple');
    if (existing) existing.remove();

    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    if (center) {
      // Center ripple
      const size = Math.max(button.offsetWidth, button.offsetHeight);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${(button.offsetWidth - size) / 2}px`;
      ripple.style.top = `${(button.offsetHeight - size) / 2}px`;
    } else {
      // Position at center anyway for key presses
      const size = Math.max(button.offsetWidth, button.offsetHeight);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${(button.offsetWidth - size) / 2}px`;
      ripple.style.top = `${(button.offsetHeight - size) / 2}px`;
    }

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }
}
