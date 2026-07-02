# PLAN.md — Callculator

## 1. Request Interpretation

- **Original request**: make a callculator (typo for "calculator")
- **Product type**: independent polished calculator app
- **Target**: a premium, iOS-inspired calculator with a sleek glass-morphism design
- **Not assumed**: no backend, no auth, no accounts, no unrelated app changes
- **Brand/niche**: clean, minimal, high-end aesthetic with subtle blur/glow effects

## 2. Full Product Scope

A premium standalone calculator web app with:

- **Core arithmetic**: addition, subtraction, multiplication, division
- **Utility operations**: clear (AC), backspace (⌫), sign toggle (±), percent (%)
- **Decimal support**: `.` button with guard against multiple decimals
- **Calculation preview**: shows pending operation and stored value
- **Session history**: last 5 calculations displayed inline
- **Keyboard support**: digits (0-9), operators (+, -, *, /), Enter/=, Escape, Backspace
- **Error handling**: divide-by-zero → "Error", graceful recovery
- **Responsive**: works on mobile (single-column) and desktop (centered card)
- **Animations**: smooth button press (scale), hover lift, subtle transitions

## 3. States Covered

| State | Behaviour |
|-------|-----------|
| Idle | Display shows "0", preview shows "Ready" |
| Input | User taps digits, display updates, preview shows stored op |
| Operator selected | Stored value held, display resets on next digit |
| Computed result | Result displayed, preview cleared, next digit starts fresh |
| Error | "Error" shown, any digit or clear recovers |
| Empty history | "No calculations yet" shown |
| Hover/Focus | Buttons lift with shadow, operator highlights |
| Mobile | Full-width card, larger tap targets, no horizontal overflow |

## 4. Architecture

- **Framework**: React 19 + Vite 6 + TypeScript
- **Styling**: CSS with custom properties, glass-morphism, responsive design
- **State management**: React `useState` + `useMemo` + `useEffect` in `App.tsx`
- **No routing**: single-page calculator, no navigation
- **No external dependencies**: only React, ReactDOM, Vite, TypeScript

## 5. File Plan (Execution Queue)

| # | File Path | Action | Purpose |
|---|-----------|--------|---------|
| 1 | `PLAN.md` | Create | This plan file |
| 2 | `package.json` | Create | Project manifest with Vite/React/TypeScript deps |
| 3 | `index.html` | Create | HTML entry point with root div and module script |
| 4 | `vite.config.ts` | Create | Vite configuration with React plugin |
| 5 | `tsconfig.json` | Create | TypeScript configuration |
| 6 | `tsconfig.app.json` | Create | App-specific TypeScript config |
| 7 | `src/vite-env.d.ts` | Create | Vite type declarations |
| 8 | `src/main.tsx` | Create | React bootstrap entry point |
| 9 | `src/App.tsx` | Create | Calculator UI, logic, keyboard handler, history |
| 10 | `src/styles.css` | Create | Premium responsive glass-morphism styling |
| 11 | `README.md` | Create | Run and feature notes |

## 6. Build & Verify Steps

1. Create all files per the execution queue
2. Run `npm install` in the files directory
3. Run `npm run build` to verify TypeScript compilation and Vite build
4. Run `npm run dev` for live preview

## 7. Quality Gates

- [ ] All calculator buttons functional
- [ ] Keyboard input fully supported
- [ ] Divide-by-zero handled gracefully
- [ ] No lorem ipsum or placeholders
- [ ] Layout responsive on mobile (≤480px) and desktop
- [ ] Smooth hover/active animations
- [ ] History section shows recent calculations
- [ ] Build passes without errors
- [ ] Preview loads correctly
