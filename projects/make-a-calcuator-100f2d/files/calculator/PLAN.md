# Calculator App — Build Plan

## Overview
A polished, interactive calculator web app built with React + TypeScript + Vite.

## File Execution Queue

1. `package.json` — project metadata & dependencies
2. `tsconfig.json` — TypeScript config
3. `tsconfig.node.json` — Node TypeScript config
4. `vite.config.ts` — Vite config
5. `index.html` — entry HTML
6. `src/types.ts` — shared types
7. `src/utils/arithmetic.ts` — math utilities
8. `src/hooks/useCalculator.ts` — core calculator state machine
9. `src/index.css` — global / reset styles
10. `src/components/CalcButton.css` — button styles
11. `src/components/CalcButton.tsx` — re-usable calc button
12. `src/components/Display.css` — display styles
13. `src/components/Display.tsx` — display screen
14. `src/components/ButtonPanel.css` — button panel grid styles
15. `src/components/ButtonPanel.tsx` — button layout
16. `src/components/History.css` — history panel styles
17. `src/components/History.tsx` — calculation history
18. `src/components/Calculator.css` — main wrapper styles
19. `src/components/Calculator.tsx` — main calculator component
20. `src/App.css` — app-level styles
21. `src/App.tsx` — root React component
22. `src/main.tsx` — React entry point
23. `npm install && npm run build` — verify it compiles

## Features
- Addition, subtraction, multiplication, division
- Decimal input
- Percentage (% → divide by 100)
- Clear (AC) and backspace (⌫)
- Keyboard support (0-9, +, -, *, /, ., Enter, Backspace, Delete, %)
- Live expression preview / result
- History sidebar/panel of past calculations
- Dark theme, premium minimal UI
- Smooth hover/press/result animations
- Responsive — works on mobile and desktop

## State Machine
- States: `start`, `input`, `operator-chosen`, `result`
- Track: current input, previous operand, operator, expression string, history list
- On equals: compute, push to history, show result

## Data Types
- `Operator`: '+' | '-' | '×' | '÷'
- `HistoryEntry`: { expression: string, result: string }
- `CalcState`: { currentValue, previousValue, operator, expression, history, overwrite }
