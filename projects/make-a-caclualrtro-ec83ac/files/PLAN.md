# Calculator Web App — Implementation Plan

## Overview
Build a premium, polished, fully interactive calculator web application using vanilla HTML, CSS, and JavaScript (no frameworks needed). The app will handle basic arithmetic, keyboard input, history, theme toggle, and responsive design.

## Architecture
- **Single Page App** — one `index.html` entry point
- **Modular JS** — separate files for calculator logic, UI rendering, state management, and keyboard handling
- **CSS** — modern glassmorphism design with light/dark theme support

## File Execution Queue

### 1. `index.html`
Main HTML entry point. Structure:
- DOCTYPE + semantic head with meta tags, fonts (Inter via Google Fonts), and preload
- Calculator container: display (expression + result), button grid (0-9, operators, clear, equals, backspace, decimal, sign toggle, percentage, history toggle)
- History panel (slide-out drawer)
- Responsive viewport meta, accessible labels

### 2. `styles.css`
Complete styling:
- CSS custom properties for theming (light + dark)
- Glassmorphism card design with backdrop blur
- Button grid using CSS Grid (4 columns)
- Button variants: number, operator, utility, equals
- Smooth hover/active transitions with scale & opacity
- Display area with scrolling overflow
- History drawer animation (slide from right)
- Responsive: mobile-first, tablet, desktop breakpoints
- Focus-visible outlines for accessibility

### 3. `state.js`
Central state management (module):
- Calculator state object: `{ expression, result, memory, history[], theme, showHistory, error }`
- Getter/setter functions with change listeners
- `resetState()`, `pushToHistory(entry)`, `toggleTheme()`, `toggleHistory()`, `setError(msg)`, `clearError()`

### 4. `calculator.js`
Pure calculation logic (no DOM):
- `evaluateExpression(expr)` — parse and compute using safe eval-like approach (Function constructor with sanitization)
- `formatNumber(num)` — locale-aware formatting with max decimal places
- `isValidExpression(expr)` — regex validation to prevent injection
- `calculatePercent(value)`, `toggleSign(value)`
- Error handling: division by zero, overflow, malformed expressions -> return error string

### 5. `ui.js`
DOM rendering and event binding:
- `renderDisplay(state)` — update expression and result elements
- `renderHistory(state)` — rebuild history list
- `toggleThemeClass(theme)` — swap data-theme attribute on root
- `toggleHistoryPanel(show)` — slide history in/out
- `showError(message)` — animate error state on display
- `clearError()` — remove error state
- All button click handlers wired to state mutations then re-render

### 6. `keyboard.js`
Keyboard input handling:
- Map keyboard events (`keydown`) to calculator actions
- Keys: digits (0-9), operators (+-*/.), Enter/=, Escape/Clear, Backspace, Delete
- Modifier-aware: Shift+= for plus, etc.
- Prevent default for handled keys

### 7. `app.js`
Application bootstrap:
- Import/initialize state, UI, calculator, keyboard
- Register all event listeners
- Initial render
- Export single init function or IIFE

## Features
| Feature | Details |
|---------|--------|
| Basic arithmetic | +, -, x, / |
| Floating point | Decimal button, . handling |
| Sign toggle | +/- button |
| Percentage | % button |
| Clear | AC button clears all, C clears entry |
| Backspace | Delete last character |
| History | Side drawer of past calculations |
| Keyboard input | Full keyboard support |
| Themes | Light/Dark toggle |
| Error handling | Division by zero, invalid expressions |
| Responsive | Mobile -> Desktop |
| Accessibility | ARIA labels, focus management |

## Data Flow
```
User Input (click/keyboard)
  -> keyboard.js / ui.js (event capture)
    -> state.js (mutate state)
      -> ui.js (re-render display/history)
        -> DOM update
```

## Design Decisions
- **Vanilla JS** — no framework overhead for a calculator
- **CSS Custom Properties** — easy theming without JS style manipulation
- **Module pattern** — each file has a single responsibility
- **Function constructor with sanitization** — safe expression evaluation (only digits, decimals, operators, parens allowed)
- **History stored in memory** — not persisted; could be extended with localStorage

## Post-Implementation
- Verify all buttons work
- Test keyboard input
- Test error states
- Test theme toggle
- Test history panel
- Validate responsive layout at 320px, 768px, 1024px+
