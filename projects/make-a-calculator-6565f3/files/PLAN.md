# Plan: make a calculator

## 1. Goal

Build a complete, production-ready calculator web application with:
- A polished, premium UI matching Clyra's visual language
- Full arithmetic operations (+, -, *, /)
- Keyboard input support
- Calculation history panel
- Responsive design (desktop + mobile)
- Smooth animations and interactions
- Error handling for edge cases

## 2. Architecture

### Stack
- **Framework:** React 19 + TypeScript
- **Build:** Vite 6
- **Styling:** CSS with modern features (CSS custom properties, clamp, grid)
- **No runtime dependencies** beyond React — keeps it lightweight

### File Structure

```
files/
  index.html              — Entry HTML
  package.json            — Dependencies and scripts
  tsconfig.json           — TypeScript configuration
  vite.config.ts          — Vite configuration
  README.md               — Project documentation
  src/
    main.tsx              — React DOM entry
    App.tsx               — Main calculator component
    styles.css            — All styles
    hooks/
      useKeyboard.ts      — Keyboard input hook
      useHistory.ts       — Calculation history hook
    utils/
      calculate.ts        — Safe math evaluation
      format.ts           — Number formatting utilities
    components/
      Display.tsx         — Calculator display (expression + result)
      Keypad.tsx          — Button grid
      HistoryPanel.tsx    — Scrollable history sidebar/modal
```

## 3. Component Tree

```
App
├── HistoryPanel (toggleable sidebar)
└── Calculator
    ├── Display (expression + result)
    └── Keypad
        └── KeyButton (×N)
```

## 4. Data Flow

- `App` holds global state: `expression`, `result`, `history[]`
- `Keypad` fires `onKeyPress(key)` to parent
- `Display` is purely presentational
- `HistoryPanel` reads `history`, fires `onRecall(index)`
- `useKeyboard` hook binds global keydown events → `onKeyPress`
- `calculate()` safely evaluates using `Function()` with validation
- `useHistory` manages the history stack in localStorage

## 5. UI Design

- Premium glass-morphism card with subtle gradients
- Large, clear display with expression on top, result on bottom
- Number buttons: light gray with hover lift
- Operator buttons: dark slate with white text
- Equals button: accent blue/purple
- AC/DEL: utility buttons at the top
- Keyboard support: all keys mapped, visual feedback on press
- History: slide-out panel with past calculations
- Responsive: full-width on mobile < 480px, centered card on desktop

## 6. Keyboard Mapping

| Key | Action |
|-----|--------|
| 0-9 | Append digit |
| . | Append decimal |
| + - * / | Append operator |
| Enter / = | Evaluate |
| Backspace | Delete last char |
| Escape | Clear all (AC) |
| Delete | Clear all (AC) |

## 7. File Execution Queue

| # | File Path | Change Type | Description |
|---|-----------|-------------|-------------|
| 1 | `package.json` | CREATE | Project dependencies and scripts |
| 2 | `tsconfig.json` | CREATE | TypeScript config for React/ESNext |
| 3 | `vite.config.ts` | CREATE | Vite with React plugin |
| 4 | `index.html` | CREATE | Entry HTML file |
| 5 | `src/utils/calculate.ts` | CREATE | Safe math evaluation |
| 6 | `src/utils/format.ts` | CREATE | Number formatting |
| 7 | `src/hooks/useKeyboard.ts` | CREATE | Keyboard input binding |
| 8 | `src/hooks/useHistory.ts` | CREATE | History state management |
| 9 | `src/components/Display.tsx` | CREATE | Calculator display component |
| 10 | `src/components/Keypad.tsx` | CREATE | Button grid component |
| 11 | `src/components/HistoryPanel.tsx` | CREATE | History slide-out panel |
| 12 | `src/App.tsx` | CREATE | Main app component |
| 13 | `src/main.tsx` | CREATE | React DOM entry |
| 14 | `src/styles.css` | CREATE | All styles |
| 15 | `README.md` | CREATE | Documentation |

## 8. Validation

- `npm install` must succeed
- `npm run build` must succeed (vite build)
- UI renders without errors
- All arithmetic operations produce correct results
- Keyboard input works for all mapped keys
- History persists across page refresh (localStorage)
- Responsive layout works on mobile viewport

## 9. Edge Cases Handled

- Division by zero → "Error"
- Multiple decimal points → ignore second decimal
- Trailing operators → disable equals or show preview
- Empty expression → show "0"
- Very large numbers → use clamp for font size
- Consecutive operators → replace last operator
- Starting with operator → prepend "0"
