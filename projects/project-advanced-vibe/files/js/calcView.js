/**
 * calcView.js - View layer for the Calculator app.
 * Manages DOM rendering, display updates, button events, and history panel.
 */

class CalcView {
  constructor() {
    // DOM references
    this.expressionDisplay = document.getElementById("display-expression");
    this.resultDisplay = document.getElementById("display-result");
    this.buttonGrid = document.querySelector(".button-grid");
    this.historyPanel = document.getElementById("history-panel");
    this.historyList = document.getElementById("history-list");
    this.historyEmpty = document.getElementById("history-empty");
    this.historyToggle = document.getElementById("history-toggle");
    this.clearHistoryBtn = document.getElementById("clear-history-btn");
    this.template = document.getElementById("history-entry-template");

    // State
    this.historyOpen = false;

    // Callback registries
    this._onDigit = null;
    this._onOperator = null;
    this._onCalculate = null;
    this._onClear = null;
    this._onBackspace = null;
    this._onUnary = null;
    this._onHistoryToggle = null;
    this._onHistoryClear = null;
    this._onHistorySelect = null;
  }

  /* ===== Event Binding ===== */

  bindDigit(handler) {
    this._onDigit = handler;
  }

  bindOperator(handler) {
    this._onOperator = handler;
  }

  bindCalculate(handler) {
    this._onCalculate = handler;
  }

  bindClear(handler) {
    this._onClear = handler;
  }

  bindBackspace(handler) {
    this._onBackspace = handler;
  }

  bindUnary(handler) {
    this._onUnary = handler;
  }

  bindHistoryToggle(handler) {
    this._onHistoryToggle = handler;
    this.historyToggle.addEventListener("click", () => {
      if (this._onHistoryToggle) this._onHistoryToggle();
    });
  }

  bindHistoryClear(handler) {
    this._onHistoryClear = handler;
    this.clearHistoryBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this._onHistoryClear) this._onHistoryClear();
    });
  }

  bindHistorySelect(handler) {
    this._onHistorySelect = handler;
  }

  /**
   * Bind all button click events.
   */
  bindButtonEvents() {
    this.buttonGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn");
      if (!btn) return;

      // Digit buttons
      if (btn.dataset.value !== undefined) {
        if (this._onDigit) this._onDigit(btn.dataset.value);
        return;
      }

      const action = btn.dataset.action;
      if (!action) return;

      switch (action) {
        case "add":
          if (this._onOperator) this._onOperator("+");
          break;
        case "subtract":
          if (this._onOperator) this._onOperator("-");
          break;
        case "multiply":
          if (this._onOperator) this._onOperator("*");
          break;
        case "divide":
          if (this._onOperator) this._onOperator("/");
          break;
        case "calculate":
          if (this._onCalculate) this._onCalculate();
          break;
        case "clear":
          if (this._onClear) this._onClear();
          break;
        case "backspace":
          if (this._onBackspace) this._onBackspace();
          break;
        case "sqrt":
        case "square":
        case "reciprocal":
        case "negate":
        case "percent":
          if (this._onUnary) this._onUnary(action);
          break;
        case "history":
          if (this._onHistoryToggle) this._onHistoryToggle();
          break;
      }
    });
  }

  /* ===== Display Updates ===== */

  /**
   * Update the display with current values.
   * @param {string} expression - The expression string
   * @param {string} result - The current value/result
   */
  updateDisplay(expression, result) {
    this.expressionDisplay.textContent = expression;
    this.resultDisplay.textContent = result;

    // Adjust font size for long numbers
    if (result.length > 10) {
      this.resultDisplay.classList.add("small");
    } else {
      this.resultDisplay.classList.remove("small");
    }

    // Remove error styling
    this.resultDisplay.classList.remove("error");

    // Auto-scroll to end
    this.resultDisplay.scrollLeft = this.resultDisplay.scrollWidth;
    this.expressionDisplay.scrollLeft = this.expressionDisplay.scrollWidth;
  }

  /**
   * Show an error message on the display.
   * @param {string} message
   */
  showError(message) {
    this.resultDisplay.textContent = message;
    this.resultDisplay.classList.add("error");
    this.resultDisplay.classList.remove("small");
  }

  /**
   * Update the clear button text (AC vs C).
   * @param {boolean} hasInput - Whether there is current input
   */
  updateClearButton(hasInput) {
    const clearBtn = this.buttonGrid.querySelector('[data-action="clear"]');
    if (clearBtn) {
      clearBtn.textContent = hasInput ? "C" : "AC";
    }
  }

  /* ===== History Panel ===== */

  /**
   * Toggle the history panel open/closed.
   * @param {boolean} [forceOpen] - Force open or closed state
   */
  toggleHistory(forceOpen) {
    const shouldOpen = forceOpen !== undefined ? forceOpen : !this.historyOpen;
    this.historyOpen = shouldOpen;
    this.historyPanel.toggleAttribute("hidden", !shouldOpen);
    this.historyPanel.classList.toggle("open", shouldOpen);
  }

  /**
   * Render the history list.
   * @param {Array} history - Array of { expression, result } objects
   */
  renderHistory(history) {
    this.historyList.innerHTML = "";

    if (history.length === 0) {
      this.historyEmpty.style.display = "block";
      return;
    }

    this.historyEmpty.style.display = "none";

    history.forEach((entry) => {
      const clone = this.template.content.cloneNode(true);
      const li = clone.querySelector(".history-entry");
      const exprSpan = clone.querySelector(".history-expression");
      const resultSpan = clone.querySelector(".history-result");

      li.dataset.expression = entry.expression;
      li.dataset.result = entry.result;
      exprSpan.textContent = entry.expression;
      resultSpan.textContent = "= " + entry.result;

      li.addEventListener("click", () => {
        if (this._onHistorySelect) {
          this._onHistorySelect(entry);
        }
      });

      this.historyList.appendChild(li);
    });
  }

  /**
   * Close the history panel.
   */
  closeHistory() {
    if (this.historyOpen) {
      this.toggleHistory(false);
    }
  }
}