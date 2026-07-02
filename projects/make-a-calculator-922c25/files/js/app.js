/**
 * Application entry point.
 * Initializes all components and wires them together.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const expressionEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');

  // Create shared history entry click handler
  const historyClickHandler = (entry) => {
    // When clicking a history entry, set the current input to its result
    calculator.currentInput = String(entry.result);
    calculator.expression = '';
    calculator.justEvaluated = false;
    calculator.newInput = true;
    calculator.errorState = false;
    display.update(calculator);
  };

  // Create instances
  const calculator = new Calculator();
  const display = new DisplayManager(expressionEl, resultEl);
  const history = new HistoryManager(historyPanel, historyList, historyClickHandler);
  const input = new InputHandler(calculator, display, history);

  // Initial display update
  display.update(calculator);

  // Keyboard shortcut hint on page load
  console.log('Calculator ready! Keyboard input supported: 0-9, +, -, *, /, ., %, Enter, Backspace, Esc');
});
