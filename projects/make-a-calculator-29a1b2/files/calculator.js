/* ============================================
   Calculator App — Core Logic (State Machine)
   ============================================ */

const calculator = (() => {
  'use strict';

  // --- DOM References ---
  const mainDisplay = document.getElementById('mainDisplay');
  const historyDisplay = document.getElementById('historyDisplay');
  const themeToggle = document.getElementById('themeToggle');
  const buttonGrid = document.querySelector('.button-grid');

  // --- State ---
  let currentValue = '0';
  let previousValue = '';
  let operation = null;
  let resetNextInput = false;
  let history = '';
  let justEvaluated = false;
  let lastOperand = '';
  let lastOperation = null;
  let hasError = false;

  // --- Constants ---
  const MAX_DIGITS = 15;
  const ERROR_MESSAGE = 'Error';

  // --- Display Update ---
  function updateDisplay() {
    mainDisplay.textContent = currentValue;
    historyDisplay.innerHTML = history || '&nbsp;';

    // Pop-in animation on main display change
    mainDisplay.classList.remove('pop-in');
    // Force reflow for animation replay
    void mainDisplay.offsetWidth;
    mainDisplay.classList.add('pop-in');

    // Error state styling
    if (hasError) {
      mainDisplay.classList.add('error');
    } else {
      mainDisplay.classList.remove('error');
    }
  }

  // --- Helper: Format number for display ---
  function formatNumber(value) {
    if (value === ERROR_MESSAGE) return value;

    // Handle very small/large numbers with exponential notation
    const num = parseFloat(value);
    if (!isFinite(num)) return ERROR_MESSAGE;

    // If it's an integer, show without decimal
    if (Number.isInteger(num) && !value.includes('.')) {
      if (Math.abs(num) > 99999999999999) {
        return num.toExponential(6);
      }
      return value;
    }

    // For decimals, limit length
    if (value.length > MAX_DIGITS + 1) {
      if (Math.abs(num) > 99999999999999) {
        return num.toExponential(6);
      }
      return num.toPrecision(10);
    }

    return value;
  }

  // --- Core: Evaluate expression ---
  function evaluate(a, op, b) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (!isFinite(numA) || !isFinite(numB)) {
      return ERROR_MESSAGE;
    }

    let result;
    switch (op) {
      case 'add':
        result = numA + numB;
        break;
      case 'subtract':
        result = numA - numB;
        break;
      case 'multiply':
        result = numA * numB;
        break;
      case 'divide':
        if (numB === 0) {
          return ERROR_MESSAGE;
        }
        result = numA / numB;
        break;
      default:
        return ERROR_MESSAGE;
    }

    if (!isFinite(result)) {
      return ERROR_MESSAGE;
    }

    // Format result
    const resultStr = result.toString();
    if (resultStr.length > MAX_DIGITS + 1) {
      return result.toExponential(6);
    }
    return resultStr;
  }

  // --- Operation helpers ---
  function appendDigit(digit) {
    if (hasError) return;

    if (resetNextInput) {
      currentValue = digit === '.' ? '0.' : digit;
      resetNextInput = false;
      justEvaluated = false;
      updateDisplay();
      return;
    }

    if (digit === '.') {
      // Prevent multiple decimals
      if (currentValue.includes('.')) return;
      currentValue += '.';
      updateDisplay();
      return;
    }

    // Prevent leading zeros
    if (currentValue === '0' && digit === '0') return;
    if (currentValue === '0' && digit !== '.') {
      currentValue = digit;
      updateDisplay();
      return;
    }

    // Limit length
    if (currentValue.replace('-', '').replace('.', '').length >= MAX_DIGITS) return;

    currentValue += digit;
    updateDisplay();
  }

  function handleOperator(op) {
    if (hasError) return;

    if (operation && !resetNextInput) {
      // Chain operation — evaluate before applying new operator
      const result = evaluate(previousValue, operation, currentValue);
      if (result === ERROR_MESSAGE) {
        setError();
        return;
      }

      history = `${formatNumber(previousValue)} ${getOperatorSymbol(operation)} ${formatNumber(currentValue)} = ${formatNumber(result)}`;
      currentValue = result;
      previousValue = result;
    } else {
      previousValue = currentValue;
    }

    operation = op;
    lastOperation = op;
    lastOperand = currentValue;
    resetNextInput = true;
    justEvaluated = false;

    history = `${formatNumber(previousValue)} ${getOperatorSymbol(op)}`;
    updateDisplay();
  }

  function handleEquals() {
    if (hasError) return;

    if (operation === null) {
      // Repeated equals — repeat last operation
      if (lastOperation !== null && lastOperand !== '') {
        const result = evaluate(currentValue, lastOperation, lastOperand);
        if (result === ERROR_MESSAGE) {
          setError();
          return;
        }
        history = `${formatNumber(currentValue)} ${getOperatorSymbol(lastOperation)} ${formatNumber(lastOperand)} =`;
        currentValue = result;
        updateDisplay();
        justEvaluated = true;
        resetNextInput = true;
      }
      return;
    }

    if (previousValue === '' || resetNextInput) return;

    const result = evaluate(previousValue, operation, currentValue);
    if (result === ERROR_MESSAGE) {
      setError();
      return;
    }

    history = `${formatNumber(previousValue)} ${getOperatorSymbol(operation)} ${formatNumber(currentValue)} =`;
    lastOperation = operation;
    lastOperand = currentValue;
    currentValue = result;
    operation = null;
    resetNextInput = true;
    justEvaluated = true;
    updateDisplay();
  }

  function handleClear() {
    if (currentValue !== '0' && currentValue !== ERROR_MESSAGE && !resetNextInput) {
      // First press: clear current input (C)
      currentValue = '0';
      resetNextInput = false;
      hasError = false;
      updateDisplay();
      return;
    }

    // Second press or already at 0: full reset (AC)
    currentValue = '0';
    previousValue = '';
    operation = null;
    resetNextInput = false;
    history = '';
    justEvaluated = false;
    lastOperand = '';
    lastOperation = null;
    hasError = false;
    updateDisplay();
  }

  function handleNegate() {
    if (hasError) return;
    if (currentValue === '0') return;

    if (currentValue.startsWith('-')) {
      currentValue = currentValue.slice(1);
    } else {
      currentValue = '-' + currentValue;
    }
    updateDisplay();
  }

  function handlePercent() {
    if (hasError) return;
    if (currentValue === '0') return;

    const num = parseFloat(currentValue);
    if (!isFinite(num)) {
      setError();
      return;
    }

    const result = (num / 100).toString();
    currentValue = result;
    updateDisplay();
  }

  function handleBackspace() {
    if (hasError) {
      handleClear();
      return;
    }

    if (resetNextInput) {
      currentValue = '0';
      resetNextInput = false;
      updateDisplay();
      return;
    }

    if (currentValue.length === 1 || (currentValue.length === 2 && currentValue.startsWith('-'))) {
      currentValue = '0';
    } else {
      currentValue = currentValue.slice(0, -1);
    }
    updateDisplay();
  }

  function setError() {
    currentValue = ERROR_MESSAGE;
    previousValue = '';
    operation = null;
    resetNextInput = true;
    hasError = true;
    history = '';
    updateDisplay();
  }

  function getOperatorSymbol(op) {
    const symbols = {
      'add': '+',
      'subtract': '−',
      'multiply': '×',
      'divide': '÷'
    };
    return symbols[op] || op;
  }

  // --- Button Click Handler ---
  function handleButtonClick(e) {
    const button = e.target.closest('.btn');
    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value !== undefined) {
      appendDigit(value);
    } else if (action === 'clear') {
      handleClear();
    } else if (action === 'negate') {
      handleNegate();
    } else if (action === 'percent') {
      handlePercent();
    } else if (action === 'equals') {
      handleEquals();
    } else if (action === 'add' || action === 'subtract' || action === 'multiply' || action === 'divide') {
      handleOperator(action);
    }
  }

  // --- Keyboard Support ---
  function handleKeyboard(e) {
    const key = e.key;

    // Prevent default for calculator keys to avoid page scrolling, etc.
    const calculatorKeys = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.',
      '+', '-', '*', '/', '%',
      'Enter', '=', 'Backspace', 'Escape', 'Delete'
    ];

    if (!calculatorKeys.includes(key)) return;

    e.preventDefault();

    if (/^[0-9]$/.test(key)) {
      appendDigit(key);
    } else if (key === '.') {
      appendDigit('.');
    } else if (key === '+') {
      handleOperator('add');
    } else if (key === '-') {
      handleOperator('subtract');
    } else if (key === '*') {
      handleOperator('multiply');
    } else if (key === '/') {
      handleOperator('divide');
    } else if (key === '%') {
      handlePercent();
    } else if (key === 'Enter' || key === '=') {
      handleEquals();
    } else if (key === 'Backspace') {
      handleBackspace();
    } else if (key === 'Escape' || key === 'Delete') {
      handleClear();
    }
  }

  // --- Theme Toggle ---
  function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('calculator-theme', newTheme);

    // Animation
    themeToggle.classList.remove('theme-flip');
    void themeToggle.offsetWidth;
    themeToggle.classList.add('theme-flip');
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem('calculator-theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }

  // --- Init ---
  function init() {
    loadTheme();
    updateDisplay();

    // Event listeners
    buttonGrid.addEventListener('click', handleButtonClick);
    document.addEventListener('keydown', handleKeyboard);
    themeToggle.addEventListener('click', toggleTheme);
  }

  // --- Public API (for testing/debugging) ---
  return {
    init,
    // Testing hooks
    getState: () => ({
      currentValue,
      previousValue,
      operation,
      resetNextInput,
      history,
      justEvaluated,
      hasError
    }),
    appendDigit,
    handleOperator,
    handleEquals,
    handleClear,
    handleNegate,
    handlePercent,
    handleBackspace
  };
})();

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  calculator.init();
});
