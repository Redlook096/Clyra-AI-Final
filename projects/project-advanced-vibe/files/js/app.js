/**
 * app.js - Main application controller for the Calculator.
 * Initializes the model and view, wires them together, and handles keyboard input.
 */

(function () {
  "use strict";

  /**
   * CalcController orchestrates the Calculator application.
   */
  class CalcController {
    constructor() {
      this.model = new ExpressionBuilder();
      this.view = new CalcView();

      // Bind view events
      this.view.bindDigit((value) => this.handleDigit(value));
      this.view.bindOperator((op) => this.handleOperator(op));
      this.view.bindCalculate(() => this.handleCalculate());
      this.view.bindClear(() => this.handleClear());
      this.view.bindBackspace(() => this.handleBackspace());
      this.view.bindUnary((action) => this.handleUnary(action));
      this.view.bindHistoryToggle(() => this.handleHistoryToggle());
      this.view.bindHistoryClear(() => this.handleHistoryClear());
      this.view.bindHistorySelect((entry) => this.handleHistorySelect(entry));

      // Bind button events
      this.view.bindButtonEvents();

      // Bind keyboard events
      this.bindKeyboard();

      // Initial render
      this.render();

      // Load and render history
      this.history = loadHistory();
      this.view.renderHistory(this.history);
    }

    /**
     * Render the current state to the view.
     */
    render() {
      const expression = this.model.getExpression();
      const display = this.model.getDisplay();
      this.view.updateDisplay(expression, display);

      // Update clear button text
      const hasInput = this.model.currentInput !== "0" || this.model.expression !== "";
      this.view.updateClearButton(hasInput);
    }

    /**
     * Handle a digit or decimal point input.
     * @param {string} value
     */
    handleDigit(value) {
      this.model.inputDigit(value);
      this.view.closeHistory();
      this.render();
    }

    /**
     * Handle an operator input.
     * @param {string} op
     */
    handleOperator(op) {
      this.model.inputOperator(op);
      this.view.closeHistory();
      this.render();
    }

    /**
     * Handle the calculate (=) action.
     */
    handleCalculate() {
      try {
        const result = this.model.calculate();
        this.render();

        // Save to history
        const expression = this.model.getExpression();
        saveHistoryEntry(expression, String(result));

        // Refresh history display
        this.history = loadHistory();
        this.view.renderHistory(this.history);
      } catch (error) {
        this.view.showError(error.message);
      }
    }

    /**
     * Handle clear action.
     */
    handleClear() {
      this.model.reset();
      this.render();
    }

    /**
     * Handle backspace.
     */
    handleBackspace() {
      this.model.backspace();
      this.render();
    }

    /**
     * Handle unary operations.
     * @param {string} action
     */
    handleUnary(action) {
      try {
        this.model.applyUnary(action);
        this.render();

        // Save to history for unary operations that produce a result
        const expression = this.model.getExpression();
        const result = this.model.currentInput;
        saveHistoryEntry(expression, result);

        // Refresh history display
        this.history = loadHistory();
        this.view.renderHistory(this.history);
      } catch (error) {
        this.view.showError(error.message);
      }
    }

    /**
     * Handle history panel toggle.
     */
    handleHistoryToggle() {
      this.view.toggleHistory();
    }

    /**
     * Handle clear history action.
     */
    handleHistoryClear() {
      clearHistory();
      this.history = [];
      this.view.renderHistory(this.history);
    }

    /**
     * Handle selecting a history entry.
     * @param {Object} entry
     */
    handleHistorySelect(entry) {
      this.model.reset();
      this.model.currentInput = entry.result;
      this.model.result = parseFloat(entry.result);
      this.view.closeHistory();
      this.render();
    }

    /* ===== Keyboard Support ===== */

    bindKeyboard() {
      document.addEventListener("keydown", (e) => {
        // Prevent default for calculator keys
        const key = e.key;

        // Digits
        if (/^[0-9]$/.test(key)) {
          e.preventDefault();
          this.handleDigit(key);
          return;
        }

        // Decimal point
        if (key === ".") {
          e.preventDefault();
          this.handleDigit(".");
          return;
        }

        // Operators
        switch (key) {
          case "+":
            e.preventDefault();
            this.handleOperator("+");
            return;
          case "-":
            e.preventDefault();
            this.handleOperator("-");
            return;
          case "*":
            e.preventDefault();
            this.handleOperator("*");
            return;
          case "/":
            e.preventDefault();
            this.handleOperator("/");
            return;
        }

        // Calculate
        if (key === "Enter" || key === "=") {
          e.preventDefault();
          this.handleCalculate();
          return;
        }

        // Clear
        if (key === "Escape") {
          e.preventDefault();
          this.handleClear();
          return;
        }

        // Backspace
        if (key === "Backspace") {
          e.preventDefault();
          this.handleBackspace();
          return;
        }

        // Percent
        if (key === "%") {
          e.preventDefault();
          this.handleUnary("percent");
          return;
        }
      });
    }
  }

  // Boot the app when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new CalcController();
    });
  } else {
    new CalcController();
  }
})();
