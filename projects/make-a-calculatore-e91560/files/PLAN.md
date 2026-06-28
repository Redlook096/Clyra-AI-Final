# Calculator Web App - Implementation Plan

## Overview
A premium, production-quality calculator web app built with Vite + React + TypeScript. Includes basic and advanced operations, calculation history, keyboard support, and dark/light themes.

## Tech Stack
- **Vite** - Build tool & dev server
- **React 19** - UI library
- **TypeScript** - Type safety
- **CSS Modules / Plain CSS** - Styling with BEM-like naming
- **No external UI libraries** - All custom, polished components

## File Structure

```
files/
├── PLAN.md                          # This file
├── index.html                       # HTML entry point
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── src/
│   ├── main.tsx                    # React entry point
│   ├── App.tsx                     # Root app component
│   ├── App.css                     # Global styles + CSS variables
│   ├── types.ts                    # TypeScript types/interfaces
│   ├── constants.ts                # Button definitions, constants
│   ├── hooks/
│   │   ├── useCalculator.ts        # Core calculator logic hook
│   │   ├── useTheme.ts             # Dark/light theme hook
│   │   └── useKeyboard.ts          # Keyboard input handling hook
│   ├── components/
│   │   ├── Calculator/
│   │   │   ├── Calculator.tsx      # Main calculator container
│   │   │   └── Calculator.css      # Calculator styles
│   │   ├── Display/
│   │   │   ├── Display.tsx         # Expression + result display
│   │   │   └── Display.css         # Display styles
│   │   ├── Keypad/
│   │   │   ├── Keypad.tsx          # Button grid layout
│   │   │   ├── Keypad.css          # Keypad styles
│   │   │   ├── Button.tsx          # Individual calculator button
│   │   │   └── Button.css          # Button styles
│   │   ├── History/
│   │   │   ├── History.tsx         # History panel
│   │   │   └── History.css         # History panel styles
│   │   ├── ThemeToggle/
│   │   │   ├── ThemeToggle.tsx     # Light/dark toggle
│   │   │   └── ThemeToggle.css     # Toggle styles
│   │   └── Layout/
│   │       ├── Layout.tsx          # App layout wrapper
│   │       └── Layout.css          # Layout styles
│   └── utils/
│       └── math.ts                 # Math utility functions
```

## Implementation Order (File Execution Queue)

### Phase 1: Project Scaffold
1. `package.json` - Dependencies and scripts
2. `tsconfig.json` - TypeScript configuration
3. `vite.config.ts` - Vite configuration
4. `index.html` - HTML entry point

### Phase 2: Core Types & Constants
5. `src/types.ts` - All TypeScript types
6. `src/constants.ts` - Button definitions, key mappings
7. `src/utils/math.ts` - Math utilities for rounding, formatting

### Phase 3: Hooks (Business Logic)
8. `src/hooks/useCalculator.ts` - Core calculator state machine
9. `src/hooks/useTheme.ts` - Theme persistence and toggle
10. `src/hooks/useKeyboard.ts` - Keyboard event mapping

### Phase 4: UI Components
11. `src/components/Button/Button.tsx` + `Button.css` - Button component
12. `src/components/Display/Display.tsx` + `Display.css` - Display component
13. `src/components/Keypad/Keypad.tsx` + `Keypad.css` - Keypad grid
14. `src/components/History/History.tsx` + `History.css` - History sidebar
15. `src/components/ThemeToggle/ThemeToggle.tsx` + `ThemeToggle.css` - Theme toggle
16. `src/components/Layout/Layout.tsx` + `Layout.css` - Layout wrapper
17. `src/components/Calculator/Calculator.tsx` + `Calculator.css` - Main calculator

### Phase 5: App Entry
18. `src/App.tsx` + `src/App.css` - Root app with global styles
19. `src/main.tsx` - React DOM entry

### Phase 6: Install & Verify
20. `npm install`
21. `npm run build` - Verify production build

## Component Tree

```
<App>
  <ThemeToggle />
  <Layout>
    <Calculator>
      <Display />          ← Shows expression + result
      <Keypad>
        <Button /> × 20   ← Grid of calculator buttons
      </Keypad>
    </Calculator>
    <History />            ← Slide-out history panel
  </Layout>
</App>
```

## Data Flow
- `useCalculator` hook manages all calculator state (current value, expression, operator, history)
- State flows down via props to Display, Keypad, History
- Keypad fires callbacks (onDigit, onOperator, onEquals, onClear, etc.)
- `useKeyboard` maps key events to the same callbacks
- `useTheme` manages a `data-theme` attribute on `<html>` and persists to localStorage
- History is an array of `{ expression, result }` objects stored in component state

## Calculator Logic (State Machine)

States:
- `inputting` - Entering digits
- `result` - Showing result after equals
- `operator` - Operator was just pressed, awaiting next operand
- `error` - Error state (division by zero, overflow)

Transitions:
- Digit press → append to current value (replace if in `result` or `error` state)
- Operator press → store operator, move current to previous (evaluate if chaining)
- Equals → evaluate expression, store in history
- Clear → reset all
- Backspace → remove last digit
- Percent → divide by 100
- Negate → multiply by -1
- Decimal → append decimal point if not already present

## Design Specs

### Colors (Light Theme)
- Background: #f5f5f5
- Calculator surface: #ffffff
- Display bg: #fafafa
- Primary text: #1a1a2e
- Secondary text: #666
- Accent: #4f46e5 (indigo)
- Operator buttons: #4f46e5
- Equals button: #4f46e5
- Clear button: #ef4444 (red)
- Function buttons (%, ±): #64748b (slate)
- Digit buttons: #f1f5f9 bg, #1e293b text
- Button shadow: 0 2px 8px rgba(0,0,0,0.08)

### Colors (Dark Theme)
- Background: #0f0f1a
- Calculator surface: #1a1a2e
- Display bg: #16213e
- Primary text: #e2e8f0
- Secondary text: #94a3b8
- Accent: #818cf8 (lighter indigo)
- Operator buttons: #818cf8
- Equals button: #818cf8
- Clear button: #f87171
- Function buttons: #475569
- Digit buttons: #1e293b bg, #e2e8f0 text
- Button shadow: 0 2px 8px rgba(0,0,0,0.3)

### Typography
- Display font: system-ui, -apple-system, sans-serif (premium feel)
- Result font-size: 2.5rem (mobile: 2rem)
- Expression font-size: 1rem
- Button font-size: 1.25rem

### Layout
- Max calculator width: 360px
- Centered on page (mobile-first)
- History panel slides from right (overlay on mobile, side-by-side on desktop)

### Interactions
- Button press: scale(0.93) + darken bg
- Result appears with subtle fade-in
- History items appear with slide-up animation
- Theme toggle: smooth rotation/icon swap
- Button ripple effect on click

## Files to Create

Total: 24 files

1. `/files/package.json`
2. `/files/tsconfig.json`
3. `/files/vite.config.ts`
4. `/files/index.html`
5. `/files/src/types.ts`
6. `/files/src/constants.ts`
7. `/files/src/utils/math.ts`
8. `/files/src/hooks/useCalculator.ts`
9. `/files/src/hooks/useTheme.ts`
10. `/files/src/hooks/useKeyboard.ts`
11. `/files/src/components/Button/Button.tsx`
12. `/files/src/components/Button/Button.css`
13. `/files/src/components/Display/Display.tsx`
14. `/files/src/components/Display/Display.css`
15. `/files/src/components/Keypad/Keypad.tsx`
16. `/files/src/components/Keypad/Keypad.css`
17. `/files/src/components/History/History.tsx`
18. `/files/src/components/History/History.css`
19. `/files/src/components/ThemeToggle/ThemeToggle.tsx`
20. `/files/src/components/ThemeToggle/ThemeToggle.css`
21. `/files/src/components/Layout/Layout.tsx`
22. `/files/src/components/Layout/Layout.css`
23. `/files/src/components/Calculator/Calculator.tsx`
24. `/files/src/components/Calculator/Calculator.css`
25. `/files/src/App.tsx`
26. `/files/src/App.css`
27. `/files/src/main.tsx`
28. `/files/src/vite-env.d.ts`

Now executing plan...
