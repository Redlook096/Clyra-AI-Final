# Tiny Premium Calculator — Plan

## Overview
A polished, responsive insurance premium calculator single-page application built with vanilla HTML, CSS, and JavaScript (no frameworks). Users input their age, coverage amount, and term length to receive an instant premium estimate. The design is premium, minimal, and fully interactive.

## File Structure

```
/files/
├── index.html          # Main HTML entry point
├── css/
│   ├── reset.css       # CSS reset / normalize
│   ├── style.css       # Main styles (layout, components, responsive)
│   └── animations.css  # Keyframes & transitions
├── js/
│   ├── calculator.js   # Premium calculation engine
│   ├── ui.js           # DOM manipulation & event handling
│   └── app.js          # App entry / init
└── PLAN.md             # This file
```

## Component Architecture

### 1. index.html
- Semantic HTML5 structure
- Meta viewport, title, Open Graph tags
- Links to all CSS and JS files
- Sections: Navbar, Hero, Calculator Form, Features Grid, FAQ, Footer

### 2. CSS Files
- **reset.css**: Box-sizing, margin/padding reset, base font
- **style.css**: 
  - Navbar (sticky, glass-morphism)
  - Hero section (gradient background, headline, subtitle)
  - Calculator section (card layout, form inputs, range sliders, result display)
  - Features grid (3-column responsive cards)
  - FAQ (accordion pattern)
  - Footer (simple links)
  - Form states (focus, invalid, valid)
  - Responsive breakpoints (mobile-first)
- **animations.css**: 
  - Fade-in up on scroll
  - Hover lifts
  - Input focus glow
  - Result counter animation
  - Smooth transitions everywhere

### 3. JavaScript Files
- **calculator.js**:
  - `PremiumCalculator` class
  - Core formula: base rate × age factor × term factor × coverage factor
  - Age factor: increases with age (risk-based)
  - Term factor: longer term = slightly higher annual premium
  - Coverage factor: tiered pricing (larger coverage gets modest bulk discount)
  - Method: `calculate({ age, coverage, term })` → returns `{ monthly, annual, breakdown }`
- **ui.js**:
  - `UI` class
  - DOM references caching
  - Form input syncing (range ↔ number inputs)
  - Real-time result updates
  - Accordion toggle for FAQ
  - Scroll animations via IntersectionObserver
  - Formatting helpers (currency, percentages)
  - Error/empty state handling
- **app.js**:
  - `App` class
  - Initializes Calculator and UI
  - Binds events
  - Handles initial state

## Data Flow

1. User adjusts Age (18-70), Coverage ($10k-$10M), Term (1-30 years)
2. `ui.js` captures input changes → calls `calculator.calculate(params)`
3. Calculator returns premium breakdown → `ui.js` updates display
4. Result shows: monthly premium, annual premium, coverage-to-premium ratio
5. All live, no button needed — updates on input change

## Premium Calculation Formula

```
baseRate = 0.0025  (0.25% of coverage as base annual rate)
ageMultiplier = 1 + (age - 25) * 0.015  (minimum 0.7 for young, capped at 2.5)
termMultiplier = 1 + (term - 1) * 0.008  (slight increase for longer terms)
coverageMultiplier = 0.6 + (coverage / 1000000) * 0.3  (bulk discount at higher coverage)
annualPremium = coverage * baseRate * ageMultiplier * termMultiplier * coverageMultiplier
monthlyPremium = annualPremium / 12
```

## Responsive Design
- Mobile: single column, stacked cards, full-width form
- Tablet: 2-column feature grid, side-by-side calculator layout
- Desktop: 3-column feature grid, centered max-width container, sticky result panel

## Interactive Features
- Linked range sliders + number inputs (update each other)
- Real-time premium calculation on any input change
- Animated result counter (transitions between values)
- FAQ accordion with smooth open/close
- Scroll-triggered fade-in animations
- Glass-morphism navbar on scroll
- Hover states on all interactive elements
- Touch-friendly mobile controls

## States Covered
- **Initial/Empty**: Default values pre-filled, result shown immediately
- **Loading**: Brief transition when values change (CSS animation)
- **Edge cases**:
  - Age < 18 or > 70 → warning message
  - Coverage < $10k → minimum enforced
  - Term < 1 → minimum enforced
- **Error**: Invalid input styling with red border + helper text
- **Success**: Premium displayed with green highlight

## Implementation Order
1. `index.html` — Full semantic HTML structure
2. `css/reset.css` — Base reset
3. `css/style.css` — All layout and component styling
4. `css/animations.css` — Animation keyframes
5. `js/calculator.js` — Calculation engine
6. `js/ui.js` — DOM manipulation
7. `js/app.js` — Entry point and initialization
8. Final verification — Open in browser and test all interactions
