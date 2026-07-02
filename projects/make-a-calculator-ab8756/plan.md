files/index.html   (create)
```

---

### 8. Validation Plan

- Open `index.html` in browser
- Test all buttons: digits, decimal, operators, equals, C, AC, +/-, %
- Test keyboard: `0-9`, `+`, `-`, `*`, `/`, `.`, `Enter`, `Backspace`, `Escape`
- Test chained operations, division by zero, consecutive operators, empty state
- Resize browser to mobile width — layout stays usable
- No console errors

---

### 9. Preview

After building, run:
```
open files/index.html
```

---

### 10. Checkpoints

| # | Milestone | Verification |
|---|-----------|-------------|
| 1 | HTML structure | Inspect DOM skeleton |
| 2 | CSS renders layout | Visual check in browser |
| 3 | Core JS logic | All math operations pass |
| 4 | Keyboard support | Keys produce correct output |
| 5 | Responsive + polish | Mobile view, hover states, animations |

---

### 11. Follow-Up Strategy

After building:
- **Enhancements:** history panel, scientific functions, themes, React component
- **Bug fixes:** floating-point rounding, operator precedence, edge cases
- **Styling tweaks:** colors, spacing, font sizing

---

Would you like me to proceed to Act Mode and build this? If so, please confirm the plan and I'll switch mode.
I'm in Plan Mode — I cannot create files. Let me output the PLAN.md content directly so you can review and create it once we're aligned.

---

## PLAN.md — Calculator

### 1. Request Classification

**Type:** Interactive Tool / Mini-App  
**Description:** Build a fully functional calculator application.

---

### 2. Previous Work Summary

This is a brand-new project. The workspace at `files/` is empty. No previous build, code, or plan exists.

---

### 3. Files Inspected

| File | Contents |
|------|----------|
| `metadata.json` | Project metadata — mode: `plan`, status: `Planning`, harness: `cline` |
| `files/` | Empty directory |
| `.agent/project-analysis.txt` | Confirmed no framework, no package file, no inspectable files |

---

### 4. Files to Create

| File | Purpose |
|------|---------|
| `files/index.html` | Single HTML file containing the complete calculator (HTML + CSS + JS) |

**Rationale:** A calculator is a self-contained UI component. A single HTML file keeps deployment trivial (just open in browser) while delivering a polished, interactive product.

---

### 5. Features & Behaviours

**Core Math:**
- Addition (`+`), subtraction (`-`), multiplication (`×`), division (`÷`)
- Decimal numbers (`.`)
- Clear entry (`C`) and clear all (`AC`)
- Equals (`=`) to evaluate
- Sign toggle (`+/-`)
- Percentage (`%`)

**UI/UX:**
- Clean, modern calculator layout (CSS Grid)
- Large, readable display showing expression and result
- Operator highlighting on active state
- Full keyboard support (numbers, operators, Enter, Backspace, Escape)
- Responsive: works on mobile and desktop
- Hover/active feedback on buttons
- Dark theme with card-style calculator body

**Stretch:** History of recent calculations (optional).

---

### 6. Implementation Plan

1. **HTML structure** — display area + button grid with rows for digits, operators, utilities
2. **CSS** — full-viewport centering, grid layout, color-coded buttons (orange operators, dark numbers, grey utilities), responsive sizing, smooth press animations, dark background
3. **JavaScript** — state machine (current input, previous operand, operator, result, reset flag), functions for `inputDigit`, `inputDecimal`, `handleOperator`, `calculate`, `clear`, `toggleSign`, `percentage`, keyboard event mapping, display update on every change

---

### 7. File Queue