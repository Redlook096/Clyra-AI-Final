# PLAN: Compact Scientific Calculator

## 1. Request Classification

**Type:** Full interactive application (single-page app / tool)

**User request:** "make a compact scientific calculator"

**Interpretation:** Build a fully functional scientific calculator as a single-page web application. It must be compact (small footprint, efficient layout), support basic arithmetic plus scientific functions (trigonometry, logarithms, exponentiation, constants, etc.), and provide a polished interactive experience.

---

## 2. Previous Work Summary

No previous work exists. This is a fresh project in an empty workspace.

The project metadata confirms status is "Planning" with no prior builds.

---

## 3. Files Inspected

| File | Status |
|------|--------|
| (workspace root) | Empty directory |
| `metadata.json` (parent) | Confirms new project, no prior code |

No existing source files, no framework config, no styling.

---

## 4. Technology Choices (Zero-Framework Workspace)

Since the workspace is empty with no framework detected, the plan uses a **vanilla HTML/CSS/JS multi-file approach** for simplicity and zero-dependency deployment.

| Concern | Decision |
|---------|----------|
| Language | HTML5 + CSS3 + Vanilla JavaScript (ES6+) |
| Bundler | None (static files) |
| Styling | Custom CSS with CSS Grid / Flexbox for compact layout |
| Hosting | Static file, no server needed |
| Testing | Manual visual/functional review |

---

## 5. Proposed Architecture & Features

### 5.1 Layout Design (Compact)

- **Single-column grid** fitting a small form factor (approx 320-400px wide).
- **Two display rows:** main expression/result display (larger font) and secondary history/memory indicator (smaller).
- **Button grid (8 rows x 4 columns):**
  - Row 1: `(`, `)`, `C`, `⌫`
  - Row 2: `sin`, `cos`, `tan`, `÷`
  - Row 3: `log`, `ln`, `√`, `×`
  - Row 4: `x²`, `xⁿ`, `π`, `−`
  - Row 5: `7`, `8`, `9`, `+`
  - Row 6: `4`, `5`, `6`, `=`
  - Row 7: `1`, `2`, `3`, `Ans`
  - Row 8: `0`, `.`, `(‑)`, `EXP`
- **Angle mode toggle:** DEG / RAD / GRAD indicator button.
- **Memory buttons:** MC, MR, MS, M+, M- in a secondary row or panel.

### 5.2 Core Functions

| Category | Functions |
|----------|-----------|
| Basic Arithmetic | `+`, `−`, `×`, `÷`, `%`, `±` |
| Trigonometry | `sin`, `cos`, `tan` (deg/rad toggle) |
| Inverse Trig | `asin`, `acos`, `atan` |
| Hyperbolic | `sinh`, `cosh`, `tanh` |
| Logarithms | `log` (base 10), `ln` (natural) |
| Power / Root | `x²`, `x³`, `xⁿ`, `√`, `∛` |
| Constants | `π` (pi), `e` |
| Memory | `MC`, `MR`, `MS`, `M+`, `M-` |
| Other | `Ans` (last answer), `EXP` (x10^), `(`, `)` |
| Angle mode | Switch between DEG / RAD / GRAD |

### 5.3 User Interaction States

| State | Behaviour |
|-------|-----------|
| Default | Calculator idle, display shows `0` |
| Input | Pressing digits builds the current operand |
| Operator pending | Visual highlight on active operator |
| Error | Displays "Error" or "Infinity" gracefully |
| Overflow | Graceful truncation / scientific notation |
| Memory | Indicator shows "M" when memory is non-zero |
| Deg/Rad | Clear indicator of current angle mode |

### 5.4 Responsive Behaviour

- **Desktop:** Centered compact card, ~380px wide, shadow/depth.
- **Mobile:** Full-width, touch-friendly button sizing (min 44px tap targets).
- **Hover/Active:** Button press feedback via CSS active state.
- **Keyboard support:** Map physical keyboard digits, operators, Enter, Backspace, Escape.

---

## 6. Files to Create / Edit / Remove

### 6.1 Create

| # | File Path | Purpose |
|---|-----------|--------|
| 1 | `index.html` | Main HTML shell - display, button grid, script/style includes |
| 2 | `style.css` | All styles - grid layout, compact sizing, theme, responsive |
| 3 | `script.js` | All logic - expression parsing, evaluation, memory, trig, keyboard |

### 6.2 Edit

None (no prior files).

### 6.3 Remove

None.

---

## 7. File Queue (Build Order)

1. **`index.html`** - Semantic skeleton with button groups, display, linked CSS/JS.
2. **`style.css`** - Complete styling: CSS Grid for buttons, display styling, color theme, hover/active states, media queries.
3. **`script.js`** - Calculator engine: state machine, safe evaluation (using Function() with sanitized input), memory, keyboard mapping, angle mode toggle.

---

## 8. Validation Plan

| Check | Method |
|-------|--------|
| Basic arithmetic | Input `2+3=` -> expect `5` |
| Scientific functions | Input `sin(30)` in DEG mode -> expect `0.5` |
| Parentheses | Input `(2+3)x4=` -> expect `20` |
| Memory | `123 MS`, `C`, `MR` -> expect `123` |
| Keyboard support | Type `45+67Enter` -> expect `112` |
| Error handling | Divide by zero -> display "Error" |
| Responsive | Resize browser to 320px wide -> buttons still tappable |
| Compactness | Entire calculator fits in ~380x550px |

---

## 9. Preview / Demo

After build, open `index.html` in a browser. The calculator should:
- Render a clean, compact card.
- Accept both click and keyboard input.
- Evaluate expressions correctly.
- Support scientific functions with DEG/RAD toggle.
- Show clear visual feedback on interactions.

---

## 10. Checkpoint Strategy

| Checkpoint | Trigger | Action |
|------------|---------|--------|
| After HTML creation | File saved | Verify buttons render in browser |
| After CSS | Styles applied | Verify layout, responsive, theme |
| After JS core | Basic eval works | Test `2+3=`, `sin(30)=` |
| After memory | Memory buttons | Test store/recall |
| After keyboard | Key events | Type digits and operators |
| Final | All files | Full validation pass |

---

## 11. Follow-Up Strategy

Post-build, the user may request:
- Theme toggle (dark mode / light mode)
- Unit conversion (length, mass, temperature)
- Graphing (simple 2D function plot on canvas)
- History panel (scrollable expression history)
- Fraction/decimal toggle
- Migrate to React
- PWA (service worker for offline)
- Copy result to clipboard

Each follow-up will be added as a sub-feature to the existing file set or as new files.

---

## 12. Out of Scope (v1)

- Graphing / plotting
- Complex numbers
- Matrix operations
- Statistical functions
- Unit conversions
- Dark/light theme persistence
- Fraction display

These can be layered in later iterations.
