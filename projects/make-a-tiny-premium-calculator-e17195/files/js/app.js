class App {
  constructor() {
    this.calculator = new PremiumCalculator();
    this.ui = new UI(this.calculator, this);
    this.init();
  }

  init() {
    // Set initial help text for range inputs
    this.restoreHelpText();

    // Perform initial calculation
    this.updateResults();

    // Bind get started button
    this.ui.getStartedBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleGetStarted();
    });
  }

  /**
   * Set the initial help text for each input.
   */
  restoreHelpText() {
    if (this.ui.ageHelp) {
      this.ui.ageHelp.textContent = `Age 18–70`;
      this.ui.ageHelp.style.color = '';
    }
    if (this.ui.coverageHelp) {
      this.ui.coverageHelp.textContent = `$10,000 – $10,000,000`;
      this.ui.coverageHelp.style.color = '';
    }
    if (this.ui.termHelp) {
      this.ui.termHelp.textContent = `1 – 30 years`;
      this.ui.termHelp.style.color = '';
    }
  }

  /**
   * Read form values, calculate premium, and update UI.
   */
  updateResults() {
    const values = this.ui.getFormValues();
    const result = this.calculator.calculate(values);

    this.ui.clearAllErrors();

    if (!result.valid) {
      // Show validation errors on specific fields
      result.errors.forEach(err => {
        if (err.toLowerCase().includes('age')) {
          this.ui.showError(this.ui.ageNum, this.ui.ageHelp, err);
        } else if (err.toLowerCase().includes('coverage')) {
          this.ui.showError(this.ui.coverageNum, this.ui.coverageHelp, err);
        } else if (err.toLowerCase().includes('term')) {
          this.ui.showError(this.ui.termNum, this.ui.termHelp, err);
        }
      });
    }

    this.ui.displayResults(result);
  }

  /**
   * Handle the "Get This Quote" button click.
   */
  handleGetStarted() {
    const values = this.ui.getFormValues();
    const result = this.calculator.calculate(values);

    if (!result.valid) {
      // Scroll to the calculator section to show errors
      document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Demo: show a toast/snackbar notification
    this.showToast(
      `Great news! Your estimated monthly premium is ${this.ui.formatCurrency(result.monthly)}. A specialist will be in touch!`,
      'success'
    );
  }

  /**
   * Show a temporary toast notification.
   */
  showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="toast-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>
          <path d="M14 8l-4 4-2-2"/>
        </svg>
        <span>${message}</span>
      </div>
      <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    document.body.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // Close button
    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }
}

// Boot the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new App();
  });
} else {
  new App();
}
