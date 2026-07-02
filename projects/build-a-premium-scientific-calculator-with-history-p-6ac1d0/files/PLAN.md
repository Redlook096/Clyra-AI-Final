Now I have sufficient context. Let me produce the comprehensive PLAN.md.

---

# PLAN.md — Premium Scientific Calculator

## 1. Request Summary

Build a premium, browser-based scientific calculator featuring:
- Full scientific function set (trig, log, exponent, constants, memory)
- Collapsible history panel showing past calculations
- Keyboard shortcut support (physical keyboard entry)
- Dark theme with glass/neumorphic aesthetics
- Subtle micro-animations (button press, panel slide, result reveal)
- Responsive mobile layout with portrait-first design

---

## 2. Product Type & Target

**Type:** Single-page application (SPA) — pure frontend, no backend.

**Target User:** Students, engineers, developers, and power users who need a fast, beautiful, keyboard-driven calculator that feels premium on both desktop and mobile.

**Platform:** Browser (Chrome, Firefox, Safari, Edge).

---

## 3. Research Summary

| Source | Key Insight |
|---|---|
| Wikipedia: Scientific Calculator | Must support trig (sin/cos/tan + inverse), log (ln, log10), exponent (x², x³, xʸ, √, ∛), constants (π, e), factorial, degree/radian toggle, memory (M+, M-, MR, MC), and parentheses. |
| MDN: KeyboardEvent | Use `keydown` with `.key` and `.code` for mapping; `e.preventDefault()` on consumed keys; handle NumPad keys separately. |
| Dribbble / Behance (design trends) | Dark theme with subtle gradient backgrounds; glassmorphism panels; neumorphic or soft-UI buttons; monospace display; green/teal accent colours; history as a sliding side panel or bottom drawer. |

---

## 4. Design Direction

| Attribute | Decision |
|---|---|
| **Colour Mood** | Deep dark (`#0a0a0f` background) with cool teal/cyan accent (`#00d4aa`, `#0891b2`). Glassmorphism (`rgba(255,255,255,0.05)` backdrop-blur panels). |
| **Typography** | Monospace for display (`'JetBrains Mono'` or `'Fira Code'`), system sans for labels. |
| **Layout Pattern** | Vertical stack: display → button grid → history panel (toggle). Desktop: calculator left, history right (side-by-side at >768px). Mobile: full-width stack, history slides in as overlay. |
| **Interaction Style** | Soft press (scale 0.95 on `:active`), ripple on click, smooth spring transitions, panel slide with `translateX`. |
| **Iconography** | Minimal text labels + unicode symbols (×, ÷, √, π). No external icon library needed. |

---

## 5. User Flows

### Flow A — Basic Calculation
1. User types `/` or clicks display → focus is on calculator.
2. User inputs `45 + 12` via click or keyboard.
3. Display shows expression in real-time.
4. User presses `=` → result animates in (scale-up + fade).
5. Entry added to history panel.

### Flow B — Scientific Operation
1. User toggles `DEG` ↔ `RAD`.
2. User inputs `sin(30)` → result `0.5` (DEG mode).
3. History shows `sin(30) = 0.5`.

### Flow C — History Interaction
1. User clicks history icon → panel slides in from right (desktop) or bottom (mobile).
2. Each entry shows expression + result + timestamp.
3. User clicks a history entry → expression inserted back into current input.
4. User clicks `CLEAR HISTORY` → panel empties with fade-out.

### Flow D — Memory
1. User calculates `10 * 5` → gets `50`.
2. Presses `M+` → memory stores 50, indicator lights up.
3. Presses `MR` → 50 inserted into display.
4. Presses `MC` → memory cleared.

---

## 6. Pages / Sections

Single page, one view with these sections:

| Section | Description |
|---|---|
| **Header** | Logo/brand, mode indicator (DEG/RAD), memory indicator, history toggle button |
| **Expression Display** | Multi-line: top line shows expression, bottom line shows result (large, glowing) |
| **Button Grid** | 6×6 grid (scientific) + 4×4 grid (basic collapse). See button map below. |
| **History Panel** | Slide-in sidebar/drawer. Scrollable list of past calculations. "Clear" button. |
| **Memory Bar** | Thin bar showing "M = 50" when memory is active. Collapsible. |

### Button Map (Scientific Mode — 6 columns × 6 rows)

```
Row 0: [2nd]  [π]    [e]    [C]   [⌫]   [÷]
Row 1: [x²]   [√]    [x³]   [∛]   [×]   [%]
Row 2: [xʸ]   [10ˣ]  [log]  [ln]   [−]   [±]
Row 3: [sin]  [cos]  [tan]  [x!]   [+]   [=]
Row 4: [sin⁻¹][cos⁻¹][tan⁻¹][(]    [)]   [EXP]
Row 5: [MC]   [MR]   [M+]   [M−]   [DEG] [RAD]
```

Note: `[2nd]` toggles to inverse trig (`sin⁻¹` etc.) — UI swaps labels.

### Basic Mode Toggle (collapsed — 4 columns × 5 rows)
Shown when "BASIC" mode is active; hides rows 3–5 scientific. Toggled via a mode switch in header.

---

## 7. Features

### Core
1. **Arithmetic** — `+`, `−`, `×`, `÷`, `%`, `±`
2. **Scientific** — `sin`, `cos`, `tan` (+ inverses), `log`, `ln`, `x²`, `x³`, `√`, `∛`, `xʸ`, `10ˣ`, `x!`, `EXP` (scientific notation)
3. **Constants** — `π`, `e` (inserted as values)
4. **Parentheses** — balanced auto-close, nesting
5. **Angle Mode** — DEG ↔ RAD toggle with visual indicator
6. **Memory** — `MC`, `MR`, `M+`, `M−` with stored value indicator
7. **History Panel** — last N calculations (persisted in sessionStorage), clickable re-entry, clearable
8. **Error Handling** — division by zero → "Infinity", invalid syntax → "Error", overflow → "Overflow"

### UX
9. **Keyboard Support** — full numeric keypad, operators, Enter/=, Backspace, Escape (clear), parentheses, `s` (sin), `c` (cos), `t` (tan), `l` (log), `n` (ln), `p` (π), `e` (constant)
10. **Animations** — button press scale, result reveal spring, history slide, memory flash
11. **Responsive** — portrait mobile (<480px), tablet (480–768px), desktop (>768px) with side-by-side history
12. **Dark Theme** — system preference detection (`prefers-color-scheme: dark`) with manual toggle

---

## 8. Interactions & Animations

| Element | Animation | CSS technique |
|---|---|---|
| Button press | Scale 0.93 → 1.0, 100ms | `transform: scale()` + `transition` |
| Button ripple | Radial gradient pulse on `::after` | `keyframes` + `animation` |
| Result reveal | Scale 1.1 → 1.0 + opacity fade-in | `@keyframes resultPop` |
| History panel slide | `translateX(-100%)` → `translateX(0)` desktop; `translateY(100%)` → `0` mobile | `transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)` |
| History entry add | Slide-down + fade-in on new item | `@keyframes slideIn` |
| Memory indicator | Pulsing glow when memory stored | `animation: pulse 2s infinite` |
| Mode switch | Rotate icon + colour shift | `transition: all 0.3s` |
| Clear flash | Brief red tint on display | `keyframes flashRed` |

---

## 9. Responsive Behaviour

| Breakpoint | Layout |
|---|---|
| `<480px` (mobile) | Single column. Button grid uses smaller font (14px). History is bottom drawer (overlay). Memory bar hidden behind icon. |
| `480–768px` (tablet) | Button grid fills width. History still drawer but wider. Display uses 24px/18px. |
| `>768px` (desktop) | Max-width 800px centered. Calculator left (60%), history right (40%) always visible. Button grid 6 cols, 48px min button size. |

---

## 10. State & Data Needs

### Application State (React hooks / vanilla state)

```typescript
interface CalculatorState {
  display: string;          // current expression shown
  result: string;           // computed result or "Error"
  memory: number | null;    // stored memory value
  angleMode: 'DEG' | 'RAD';
  isHistoryOpen: boolean;
  history: HistoryEntry[];
  isScientificMode: boolean;
  isSecondFn: boolean;      // inverse trig toggle
  hasMemory: boolean;
  error: string | null;
}

interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}
```

### Persistence
- **History** → `sessionStorage` (survives refresh, cleared on tab close)
- **Memory** → in-memory only (reset on page reload)
- **Angle mode + theme preference** → `localStorage`

---

## 11. File Plan

```
/
├── index.html            # Entry point, mounts React app
├── package.json          # Dependencies (React 18, Vite)
├── vite.config.js        # Vite configuration
├── public/
│   └── favicon.svg       # Calculator icon
├── src/
│   ├── main.tsx          # React root mount
│   ├── App.tsx           # Top-level layout + state management
│   ├── App.css           # Global styles, CSS variables, animations
│   │
│   ├── components/
│   │   ├── CalculatorDisplay.tsx   # Expression + result display
│   │   ├── CalculatorDisplay.css
│   │   ├── ButtonGrid.tsx          # Renders all buttons in grid
│   │   ├── ButtonGrid.css
│   │   ├── CalculatorButton.tsx    # Single button with ripple + scale
│   │   ├── CalculatorButton.css
│   │   ├── HistoryPanel.tsx        # Slide-in history list
│   │   ├── HistoryPanel.css
│   │   ├── MemoryBar.tsx           # Thin memory indicator bar
│   │   ├── MemoryBar.css
│   │   ├── Header.tsx              # Mode toggles, indicators
│   │   └── Header.css
│   │
│   ├── hooks/
│   │   ├── useCalculator.ts        # Core calculation logic (pure functions)
│   │   ├── useKeyboard.ts          # Keyboard event bindings
│   │   └── useHistory.ts           # History CRUD + sessionStorage
│   │
│   ├── utils/
│   │   ├── evaluate.ts             # Safe math evaluation (math.js or custom parser)
│   │   ├── formatters.ts           # Number formatting, sci notation
│   │   └── constants.ts            # Key mappings, button definitions
│   │
│   └── types/
│       └── calculator.ts           # TypeScript interfaces
```

---

## 12. Tool & Package Strategy

| Tool | Purpose |
|---|---|
| **Vite** | Build tool — fast HMR, TypeScript out-of-box |
| **React 18** | UI library — component-based state management |
| **TypeScript** | Type safety for state/event handling |
| **math.js** (or `math-expression-evaluator`) | Safe expression evaluation with trig, log, factorial. `math.js` preferred for robustness. |
| **CSS** (vanilla modules) | No CSS framework — custom design system via CSS variables. Keeps bundle lean. |

No UI libraries, no icon libraries, no animation libraries. Everything handcrafted for zero-dependency premium feel.

---

## 13. Validation Checklist

- [ ] All 4 basic operations work correctly (+, −, ×, ÷)
- [ ] Scientific functions return correct values in DEG and RAD modes
- [ ] Inverse trig toggles correctly via `2nd` button
- [ ] Parentheses auto-close and maintain correct nesting
- [ ] Division by zero shows "Infinity" not crash
- [ ] History panel opens/closes with animation
- [ ] Clicking history entry re-inserts expression
- [ ] `clear history` removes all entries with animation
- [ ] Keyboard input works for all mapped keys
- [ ] NumPad and main keyboard both supported
- [ ] Mobile layout renders correctly at 375px, 414px, 768px widths
- [ ] History drawer slides up from bottom on mobile
- [ ] Memory (M+/M−/MR/MC) stores, recalls, clears correctly
- [ ] `±` (negate) toggles sign of current number
- [ ] `%` computes percentage correctly
- [ ] `EXP` enters scientific notation exponent mode
- [ ] Expression display updates in real-time as user types
- [ ] Result reveal animation plays on `=`
- [ ] Dark theme applies correctly (respects system preference)
- [ ] Error state clears on next valid input
- [ ] Long expressions scroll horizontally in display

---

## 14. Acceptance Test

### Test 1: Basic arithmetic via click
1. Click `4` `5` `+` `1` `2` `=`
2. **Expect:** Display shows `57`, history has `45 + 12 = 57`

### Test 2: Scientific function
1. Set mode to DEG. Click `sin` `3` `0` `)`
2. **Expect:** `sin(30) = 0.5`

### Test 3: Keyboard input
1. Press `5` `*` `5` `Enter`
2. **Expect:** Result `25`

### Test 4: History re-entry
1. Perform calculation from Test 1.
2. Open history, click `45 + 12 = 57`.
3. **Expect:** Display shows `45 + 12`, ready to modify or re-evaluate.

### Test 5: Memory
1. Calculate `10 * 5 = 50`. Press `M+`.
2. Press `C`, then `MR`.
3. **Expect:** `50` inserted into display.

### Test 6: Error handling
1. Type `1` `/` `0` `=`
2. **Expect:** Display shows `Infinity` or `Error`, not a crash.

### Test 7: Mobile layout
1. Resize browser to 375px width.
2. **Expect:** Calculator fills width, buttons are 14px, history opens as bottom drawer.

### Test 8: Dark theme
1. System prefers dark or manual toggle.
2. **Expect:** Background `#0a0a0f`, glass panels, light text, teal accents.

---

## 15. Implementation Order (Build Sequence)

| Step | What to build | Why this order |
|---|---|---|
| 1 | `package.json`, `vite.config.js`, `index.html`, `src/main.tsx` | Project scaffold |
| 2 | Types + utility functions (`types/`, `utils/`) | Foundation before UI |
| 3 | `useCalculator` hook (evaluation engine) | Core logic first |
| 4 | `CalculatorDisplay` + `CalculatorButton` | Visible UI to test logic |
| 5 | `ButtonGrid` with all 36 scientific buttons | Full input surface |
| 6 | `useKeyboard` hook | Keyboard support |
| 7 | `Header` (mode/angle/memory indicators) | Controls + context |
| 8 | `MemoryBar` | Memory feature |
| 9 | `useHistory` + `HistoryPanel` | History feature |
| 10 | Animations (CSS keyframes + transitions) | Polish pass |
| 11 | Responsive CSS (media queries) | Mobile final pass |
| 12 | localStorage persistence, error messages, edge cases | Hardening |

---