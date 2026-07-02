# Implementation Plan

## Goal

Build a compact, premium standalone calculator as a self-contained web app. The calculator must look polished ("premium"), fit in a small UI footprint, and support all basic arithmetic operations with a clean, glass-morphism or modern design language.

## Current Project Understanding

- The project folder `make-a-compact-premium-calculator-123bb3` exists under the Clyra AI Final projects directory.
- The `files/` directory is completely empty — no previous code exists.
- The `checkpoints/` directory is also empty.
- The metadata shows status: "Planning", mode: "plan", harness: "cline".
- The broader parent project (`Clyra-AI-Final/`) uses Node.js, TypeScript, and Vite (seen in root `package.json` and `vite.config.ts`). There is an existing Vite/React build pipeline available.
- Previous similar calculator projects used: **React + Vite**, **npm**, **Tailwind/CSS hybrid styling**.
- No existing PLAN.md was found in either the `files/` directory or the workspace root.

## Requirements

1. **Calculator Operations**: addition, subtraction, multiplication, division, percentage, sign toggle (±), clear (C), backspace (⌫), decimal point, equals (=).
2. **Compact Layout**: single-column, mobile-first, centered card — small enough for a widget area but usable on desktop.
3. **Premium Visual Style**: glass-morphism or frosted-glass aesthetic with subtle shadows, rounded corners, smooth transitions, and a dark/light theme toggle.
4. **Input Methods**: both click/tap buttons and full keyboard support (digits `0-9`, operators `+-*/`, `Enter`/`=` for equals, `Escape`/`c` for clear, `Backspace` for backspace).
5. **History Panel**: a collapsible or side-stacked recent calculation history within the compact card.
6. **Error Handling**: divide-by-zero shows "Error", overflow/NaN results handled gracefully.
7. **Responsive**: works on mobile (320px+) and desktop without horizontal scroll.
8. **Build & Preview**: must build cleanly via `vite build` and launch a dev server with live preview.

## Non-Negotiable Constraints

- Must use React + Vite (project-wide standard).
- Must use npm for package management.
- Must not introduce any runtime backend — fully client-side.
- All files go into `files/` directory (no files placed outside it).
- No external API calls or dependencies beyond what's needed for the frontend.
- Must pass a clean `vite build` with no errors.
- Must include keyboard event listeners for all calculator actions.

## Proposed Changes

**New files to create** (in `files/`):

| File | Purpose |
|------|---------|
| `package.json` | Vite + React + dev dependencies |
| `index.html` | HTML entry point with meta viewport |
| `vite.config.ts` | Minimal Vite config (or use root config if compatible) |
| `src/main.tsx` | React DOM bootstrap |
| `src/App.tsx` | Main calculator component — UI + logic + keyboard |
| `src/styles.css` | All styling: premium glass-morphism, responsive, themes |
| `src/hooks/useCalculator.ts` | Custom hook encapsulating calculator state machine |
| `README.md` | How to run and use |

**Files to remove**: None.

**Files to edit**: None (empty workspace).

## Implementation Steps

### Step 1 — Analyse Existing Structure

- Verify the `files/` directory is empty and writable.
- Confirm Vite/React patterns from the parent project (e.g., `vite.config.ts`, `tsconfig.json`) for reference compatibility.

### Step 2 — Create Project Skeleton

- Write `package.json` with `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, and `typescript` as dependencies.
- Write `index.html` with `<div id="root">` and a `<script type="module" src="/src/main.tsx">.
- Write `vite.config.ts` with the React plugin.

### Step 3 — Write the Calculator Logic Hook (`src/hooks/useCalculator.ts`)

- State: `display` (current input string), `accumulator` (stored value), `operator` (pending operator), `resetNext` (boolean), `history` (array of `{ expression, result }`), `theme` ("dark" | "light").
- Actions: `inputDigit`, `inputDecimal`, `inputOperator`, `calculate`, `clear`, `backspace`, `toggleSign`, `percent`, `toggleTheme`.
- Edge cases: prevent multiple decimals in one number, replace operator on rapid operator presses, handle divide-by-zero with "Error" state, format large/small numbers to avoid overflow.
- Keyboard handler: map `event.key` to the appropriate action.

### Step 4 — Build the UI Component (`src/App.tsx`)

- Display area: shows current input or result, secondary line for history/expression.
- Button grid: rows for C/⌫/%/÷, 7/8/9/×, 4/5/6/−, 1/2/3/+, ±/0/./=.
- History toggle: small expandable bar at top or bottom of the card.
- Theme toggle: sun/moon icon button in the header.
- Wire up `useCalculator` hook and attach `onKeyDown` to the root div.

### Step 5 — Create Premium Styling (`src/styles.css`)

- Dark theme: dark background (#0a0a0f or similar), glass buttons with subtle borders, backdrop blur on the card.
- Light theme: light background (#f5f5fa), frosted card with soft shadows.
- Button states: `:hover`, `:active` (scale down slightly), operator buttons distinct color (amber/blue accent).
- Display area: large monospace font, truncation on overflow.
- Animations: button press, result appearance, history slide-in.
- Responsive: `max-width: 360px` centered, font sizes scale with `clamp()`.
- Histories: scrollable list with fade-in.

### Step 6 — Create Entry Point (`src/main.tsx`)

- Simple `ReactDOM.createRoot(document.getElementById("root"))` render of `<App />`.

### Step 7 — Add README

- Brief description, setup instructions (`npm install`, `npm run dev`), keyboard shortcuts, theme toggle note.

### Step 8 — Run `npm install` and `vite build` for Validation

- Install dependencies and run a production build. Fix any errors.

### Step 9 — Start Dev Server and Live Preview

- Start `npm run dev` and confirm the calculator loads and operates correctly.

## Technical Design

```
files/
├── package.json
├── index.html
├── vite.config.ts
├── README.md
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles.css
    └── hooks/
        └── useCalculator.ts
```

**State Machine (simplified)**:
- `IDLE` → digit → `INPUT` (append digit, resetNext false)
- `INPUT` → operator → `OP_PENDING` (store accumulator + op, resetNext true)
- `OP_PENDING` → digit → `INPUT` (new number, resetNext false)
- `INPUT` → equals → `RESULT` (compute, push to history)
- `RESULT` → digit → `INPUT` (reset)
- `RESULT` → operator → `OP_PENDING` (use result as accumulator)
- Any state → clear → `IDLE` (reset everything)
- Any state → error detected → `ERROR` (display "Error")

**Theme Storage**: CSS custom properties on `:root` toggled via a class on `<body>` or the app container.

## Security / Edge Cases

- **Divide by zero**: Detection before evaluation → display "Error" and reset state to error mode. User must press C to recover.
- **Overflow / precision**: Numbers beyond `Number.MAX_SAFE_INTEGER` or very long decimals are capped and displayed with `toPrecision(10)` or similar. No `eval()` — use explicit arithmetic function.
- **Keyboard injection**: Only numeric keys, operators, and control keys are handled; no arbitrary input allowed.
- **History limit**: Cap at 20 entries to avoid memory bloat.
- **Rapid pressing**: Debounce not needed but state transitions must be atomic (use `useReducer` or functional setState updates).

## Verification Checklist

- [ ] All digit buttons input correctly.
- [ ] Decimal button inserts only one decimal per number.
- [ ] `C` clears everything, `⌫` removes last character.
- [ ] `±` toggles sign of current number.
- [ ] `%` divides current number by 100.
- [ ] `+`, `−`, `×`, `÷` chain operations correctly.
- [ ] `=` computes and shows result, adds to history.
- [ ] Divide by zero shows "Error".
- [ ] Keyboard: 0-9, `+`, `-`, `*`, `/`, `Enter`, `Escape`, `Backspace`, `.` all work.
- [ ] Theme toggle switches between dark and light.
- [ ] History panel opens/closes, shows at most 20 entries.
- [ ] Responsive: works on 320px width without overflow.
- [ ] `npm run build` exits cleanly with no errors.
- [ ] Dev server starts and calculator is fully interactive.

## Expected Final Output

A fully functional, visually polished compact calculator web app running at a local Vite dev URL. The calculator features:
- Glass-morphism card with dark/light theme toggle
- Large readable display with expression preview
- All basic arithmetic operations
- Keyboard support
- Built-in calculation history
- Error handling for edge cases
- Responsive to all screen sizes

## Risks / Assumptions

1. **Assumption**: The parent project's Vite/React setup is compatible with a standalone Vite app in the `files/` subdirectory. If the root `node_modules` or Vite config interferes, we may need to adjust paths or use an isolated Vite instance.
2. **Assumption**: The user wants a general "premium calculator" — no specific brand, logo, or company context. The visual design will be original glass-morphism without any real-world branding.
3. **Risk**: If `npm install` encounters peer dependency conflicts with the root project's versions, we may need to pin dependency versions.
4. **Risk**: `vite build` from the `files/` subdirectory might conflict with the workspace root's `vite.config.ts`. We'll create a self-contained `vite.config.ts` inside `files/`.
5. **Assumption**: The preview system can serve the dev URL from the subdirectory.

## Approval Gate

**Wait for user approval before implementing.** No code will be written or modified until the user explicitly approves this plan. Once approved, implementation will begin with Step 1.