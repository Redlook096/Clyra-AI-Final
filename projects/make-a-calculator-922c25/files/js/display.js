/**
 * Display manager - updates the calculator display.
 */
class DisplayManager {
  constructor(expressionEl, resultEl) {
    this.expressionEl = expressionEl;
    this.resultEl = resultEl;
  }

  /**
   * Update display from calculator state.
   */
  update(calculator) {
    // Update result
    const displayValue = calculator.getDisplayValue();
    if (this.resultEl.textContent !== displayValue) {
      this.resultEl.textContent = displayValue;
      this.resultEl.classList.remove('animate-pop');
      // Force reflow
      void this.resultEl.offsetWidth;
      this.resultEl.classList.add('animate-pop');
    }

    // Update expression
    this.expressionEl.textContent = calculator.getExpression();

    // Error state styling
    if (calculator.errorState) {
      this.resultEl.classList.add('error');
    } else {
      this.resultEl.classList.remove('error');
    }

    // Update clear button label
    this._updateClearButton(calculator);

    // Update operator active state
    this._updateOperatorHighlight(calculator);
  }

  /**
   * Update the clear button text between C and AC.
   */
  _updateClearButton(calculator) {
    const clearBtn = document.querySelector('[data-action="clear"]');
    if (!clearBtn) return;

    if (calculator.errorState || calculator.isAllClear()) {
      clearBtn.textContent = 'AC';
    } else {
      clearBtn.textContent = 'C';
    }
  }

  /**
   * Highlight the active operator button.
   */
  _updateOperatorHighlight(calculator) {
    document.querySelectorAll('.key-operator').forEach(btn => {
      btn.classList.remove('active');
    });

    if (calculator.currentOperator && !calculator.justEvaluated) {
      const opMap = {
        '+': 'key-add',
        '-': 'key-subtract',
        '×': 'key-multiply',
        '÷': 'key-divide'
      };
      const className = opMap[calculator.currentOperator];
      if (className) {
        const btn = document.querySelector(`.${className}`);
        if (btn) btn.classList.add('active');
      }
    }
  }

  /**
   * Static method to update just the clear button label.
   */
  static updateClearButton(calculator) {
    const clearBtn = document.querySelector('[data-action="clear"]');
    if (!clearBtn) return;

    if (calculator.errorState || calculator.isAllClear()) {
      clearBtn.textContent = 'AC';
    } else {
      clearBtn.textContent = 'C';
    }
  }
}
