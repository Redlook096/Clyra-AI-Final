class UI {
  constructor(calculator, app) {
    this.calculator = calculator;
    this.app = app;
    this.cacheDOM();
    this.setupSliderSyncing();
    this.setupScrollAnimations();
    this.setupMobileMenu();
    this.setupFaqAccordion();
    this.setupNavbarScroll();
  }

  cacheDOM() {
    this.ageSlider = document.getElementById('age');
    this.ageNum = document.getElementById('ageNum');
    this.ageDisplay = document.getElementById('ageDisplay');
    this.ageHelp = document.getElementById('ageHelp');

    this.coverageSlider = document.getElementById('coverage');
    this.coverageNum = document.getElementById('coverageNum');
    this.coverageDisplay = document.getElementById('coverageDisplay');
    this.coverageHelp = document.getElementById('coverageHelp');

    this.termSlider = document.getElementById('term');
    this.termNum = document.getElementById('termNum');
    this.termDisplay = document.getElementById('termDisplay');
    this.termHelp = document.getElementById('termHelp');

    this.monthlyPremium = document.getElementById('monthlyPremium');
    this.annualPremium = document.getElementById('annualPremium');
    this.resultCoverage = document.getElementById('resultCoverage');
    this.resultRatio = document.getElementById('resultRatio');
    this.resultTerm = document.getElementById('resultTerm');
    this.resultPanel = document.getElementById('resultPanel');

    this.getStartedBtn = document.getElementById('getStartedBtn');

    // Apply styled class to range sliders
    [this.ageSlider, this.coverageSlider, this.termSlider].forEach(sl => {
      if (sl) sl.classList.add('styled');
    });
  }

  /**
   * Sync range sliders with number inputs and vice versa.
   */
  setupSliderSyncing() {
    // Age sync
    this.syncInputs(this.ageSlider, this.ageNum, (val) => {
      this.ageDisplay.textContent = val;
      this.clearError(this.ageNum);
      this.app.updateResults();
    });

    // Coverage sync
    this.syncInputs(this.coverageSlider, this.coverageNum, (val) => {
      this.coverageDisplay.textContent = this.formatCurrency(Number(val));
      this.clearError(this.coverageNum);
      this.app.updateResults();
    });

    // Term sync
    this.syncInputs(this.termSlider, this.termNum, (val) => {
      this.termDisplay.textContent = `${val} years`;
      this.clearError(this.termNum);
      this.app.updateResults();
    });
  }

  /**
   * Two-way binding between range slider and number input.
   */
  syncInputs(slider, numInput, onChange) {
    if (!slider || !numInput) return;

    slider.addEventListener('input', () => {
      const val = Number(slider.value);
      numInput.value = val;
      onChange(val);
    });

    numInput.addEventListener('input', () => {
      let val = Number(numInput.value);
      const min = Number(numInput.min);
      const max = Number(numInput.max);

      if (isNaN(val) || val < min) {
        val = min;
      } else if (val > max) {
        val = max;
      }

      numInput.value = val;
      slider.value = val;
      onChange(val);
    });

    numInput.addEventListener('blur', () => {
      let val = Number(numInput.value);
      const min = Number(numInput.min);
      const max = Number(numInput.max);

      if (isNaN(val) || val < min) {
        val = min;
        numInput.value = val;
        slider.value = val;
        onChange(val);
      } else if (val > max) {
        val = max;
        numInput.value = val;
        slider.value = val;
        onChange(val);
      }
    });
  }

  /**
   * Display premium results in the result panel with animation.
   */
  displayResults(result) {
    if (!result.valid) {
      this.monthlyPremium.textContent = '$0.00';
      this.annualPremium.textContent = '$0.00';
      this.resultRatio.textContent = '—';
      return;
    }

    const prevMonthly = this.monthlyPremium.textContent;
    const prevAnnual = this.annualPremium.textContent;

    this.monthlyPremium.textContent = this.formatCurrency(result.monthly);
    this.annualPremium.textContent = this.formatCurrency(result.annual);
    this.resultCoverage.textContent = this.formatCurrency(result.breakdown.coverage);
    this.resultTerm.textContent = `${result.breakdown.term} years`;

    // Calculate coverage-to-premium ratio
    if (result.annual > 0) {
      const ratio = (result.breakdown.coverage / result.annual).toFixed(0);
      this.resultRatio.textContent = `${this.formatNumber(parseInt(ratio))}x`;
    } else {
      this.resultRatio.textContent = '—';
    }

    // Animate update
    if (prevMonthly !== this.monthlyPremium.textContent) {
      this.monthlyPremium.classList.remove('pulse');
      void this.monthlyPremium.offsetWidth; // Reflow
      this.monthlyPremium.classList.add('pulse');
    }

    if (prevAnnual !== this.annualPremium.textContent) {
      this.annualPremium.classList.remove('pulse');
      void this.annualPremium.offsetWidth;
      this.annualPremium.classList.add('pulse');
    }
  }

  /**
   * Show validation error on an input.
   */
  showError(input, helpEl, message) {
    if (input) input.classList.add('has-error');
    if (helpEl) {
      helpEl.textContent = message;
      helpEl.style.color = 'var(--error)';
    }
  }

  clearError(input) {
    if (input) input.classList.remove('has-error');
  }

  clearAllErrors() {
    [this.ageNum, this.coverageNum, this.termNum].forEach(el => this.clearError(el));
    // Reset help text colors
    [this.ageHelp, this.coverageHelp, this.termHelp].forEach(el => {
      if (el) el.style.color = '';
    });
  }

  /**
   * Scroll-triggered fade-in animations.
   */
  setupScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    document.querySelectorAll('.stagger-children').forEach(el => observer.observe(el));
  }

  /**
   * Mobile hamburger menu toggle.
   */
  setupMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const navInner = document.querySelector('.nav-inner');

    if (!btn || !navInner) return;

    btn.addEventListener('click', () => {
      const isOpen = navInner.classList.toggle('mobile-open');
      btn.classList.toggle('active');
      btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close on link click
    navInner.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navInner.classList.remove('mobile-open');
        btn.classList.remove('active');
        btn.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /**
   * FAQ accordion with smooth animation.
   */
  setupFaqAccordion() {
    document.querySelectorAll('.faq-question').forEach(question => {
      question.addEventListener('click', () => {
        const item = question.closest('.faq-item');
        if (!item) return;

        const isOpen = item.classList.contains('open');

        // Close all other items
        document.querySelectorAll('.faq-item.open').forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle this item
        if (isOpen) {
          item.classList.remove('open');
          question.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('open');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /**
   * Glass navbar on scroll.
   */
  setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial check
  }

  /**
   * Utility: Format number as currency.
   */
  formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '$0.00';
    return '$' + amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Utility: Format large numbers with commas.
   */
  formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return num.toLocaleString('en-US');
  }

  /**
   * Get current form values as an object.
   */
  getFormValues() {
    return {
      age: Number(this.ageSlider?.value || 30),
      coverage: Number(this.coverageSlider?.value || 500000),
      term: Number(this.termSlider?.value || 20),
    };
  }
}
