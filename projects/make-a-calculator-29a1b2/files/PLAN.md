# Calculator App — Build Plan

## Overview
A premium, polished, fully functional calculator web application built with vanilla HTML, CSS, and JavaScript. No frameworks — lightweight, fast, and dependency-free.

## File Execution Queue

### 1. `PLAN.md` (this file first)
### 2. `index.html`
- Single-page application container
- Loads CSS and JS
- Meta viewport for responsiveness
- Semantic structure: app shell with display area, button grid, theme toggle

### 3. `styles.css`
- CSS custom properties (design tokens) for theming
- Dark/light theme support (via data-theme attribute on html)
- Minimal, premium aesthetic: smooth corners, subtle shadows, consistent spacing
- Responsive grid layout for calculator buttons
- Hover/focus/active states for every button
- Smooth transitions on theme toggle and button press
- Mobile-first with max-width constraint centered on desktop
- Animations: button press scale, result pop-in, theme flip

### 4. `calculator.js`
- Core calculator state machine (no eval — safe arithmetic)
- Operations: +, -, ×, ÷, %, ±, C/AC, backspace, decimal point, equals
- History/log of previous calculations (displayed in secondary display)
- Keyboard support (number keys, operators, Enter, Backspace, Escape)
- Theme toggle handler with localStorage persistence
- Error handling (division by zero, overflow, malformed expressions)

## UI Layout (top to bottom)
1. History strip — shows prior result/expression (smaller, dimmer)
2. Main display — current input/result (large, monospaced digits)
3. Button grid — 4x5 layout:
   - Row 1: C, ±, %, ÷
   - Row 2: 7, 8, 9, ×
   - Row 3: 4, 5, 6, -
   - Row 4: 1, 2, 3, +
   - Row 5: 0 (span 2 cols), ., =

## States Covered
- Default (0 displayed)
- Input (user typing digits/operator)
- Result (after equals — shows answer, resets on next digit)
- Error (division by zero or overflow — shows "Error", requires clear)
- Empty (after AC — back to 0)
- Theme toggle (light/dark persisted in localStorage)

## Data Flow
- currentValue (string): what the user is typing / the accumulated value
- previousValue (string): left operand before operator
- operation (string|null): the pending operator
- resetNextInput (boolean): after result or operator, next digit starts fresh
- history (string): display of the previous calculation for context

## Edge Cases
- Prevent multiple decimal points in one number
- Prevent leading zeros (except "0.")
- Handle negative numbers via ± toggle
- Handle percentage as divide by 100
- Chain operations: 5 + 3 - 2 = 6
- Repeated equals: 5 + 3 = = repeats last operation

## Verification
1. Open index.html in browser
2. Click buttons to verify every operation works
3. Test keyboard input
4. Toggle theme, refresh — theme persists
5. Test error case: 1 / 0 → "Error"
6. Test chain operations
7. Responsive: test mobile viewport
