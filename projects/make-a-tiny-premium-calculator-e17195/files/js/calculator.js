class PremiumCalculator {
  constructor() {
    this.BASE_RATE = 0.0025; // 0.25% of coverage as base annual rate
    this.MIN_AGE = 18;
    this.MAX_AGE = 70;
    this.MIN_COVERAGE = 10000;
    this.MAX_COVERAGE = 10000000;
    this.MIN_TERM = 1;
    this.MAX_TERM = 30;
  }

  /**
   * Validate input parameters
   */
  validate({ age, coverage, term }) {
    const errors = [];

    if (age == null || isNaN(age) || age < this.MIN_AGE || age > this.MAX_AGE) {
      errors.push(`Age must be between ${this.MIN_AGE} and ${this.MAX_AGE}.`);
    }

    if (coverage == null || isNaN(coverage) || coverage < this.MIN_COVERAGE || coverage > this.MAX_COVERAGE) {
      errors.push(`Coverage must be between $${this.MIN_COVERAGE.toLocaleString()} and $${this.MAX_COVERAGE.toLocaleString()}.`);
    }

    if (term == null || isNaN(term) || term < this.MIN_TERM || term > this.MAX_TERM) {
      errors.push(`Term must be between ${this.MIN_TERM} and ${this.MAX_TERM} years.`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate age multiplier.
   * Younger applicants (below 25) get a discount; older applicants pay more.
   * Capped at 2.5x for the oldest applicants.
   */
  getAgeMultiplier(age) {
    const base = 1 + (age - 25) * 0.015;
    return Math.max(0.7, Math.min(2.5, base));
  }

  /**
   * Calculate term multiplier.
   * Longer terms have slightly higher annual premiums due to extended risk.
   */
  getTermMultiplier(term) {
    return 1 + (term - 1) * 0.008;
  }

  /**
   * Calculate coverage multiplier.
   * Higher coverage amounts get a modest bulk discount.
   */
  getCoverageMultiplier(coverage) {
    const perMillion = coverage / 1000000;
    return Math.max(0.5, 0.6 + perMillion * 0.3);
  }

  /**
   * Calculate premium based on age, coverage, and term.
   * Returns detailed breakdown.
   */
  calculate({ age, coverage, term }) {
    const validation = this.validate({ age, coverage, term });
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors,
        monthly: 0,
        annual: 0,
        breakdown: null,
      };
    }

    const ageMultiplier = this.getAgeMultiplier(age);
    const termMultiplier = this.getTermMultiplier(term);
    const coverageMultiplier = this.getCoverageMultiplier(coverage);

    const annualPremium = coverage * this.BASE_RATE * ageMultiplier * termMultiplier * coverageMultiplier;
    const monthlyPremium = annualPremium / 12;

    return {
      valid: true,
      errors: [],
      monthly: Math.round(monthlyPremium * 100) / 100,
      annual: Math.round(annualPremium * 100) / 100,
      breakdown: {
        baseRate: this.BASE_RATE,
        ageMultiplier: Math.round(ageMultiplier * 1000) / 1000,
        termMultiplier: Math.round(termMultiplier * 1000) / 1000,
        coverageMultiplier: Math.round(coverageMultiplier * 1000) / 1000,
        age,
        coverage,
        term,
      },
    };
  }
}
