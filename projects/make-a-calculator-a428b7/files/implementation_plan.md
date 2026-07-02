# Implementation Plan

## 1. Task Classification

Frontend-only calculator app.

This classification fits because the latest request is: Make a calculator

---

## 2. Goal

Build a complete calculator app for: Make a calculator.

The result must be polished, responsive, previewable, and implemented as focused files rather than one large file.

---

## 3. User Requirements

- Explicit request: Make a calculator
- Interpret the request literally and do not assume it is for Clyra, Vibe Coder, or this AI assistant unless stated.
- Build a complete, polished result instead of a tiny demo.
- Use focused files, working interactions, responsive layout, hover/focus states, and validation.
- If this is a real company or public brand, use only researched/public facts and make an unofficial inspired concept.
- Do not hide failures, fake preview success, or skip build checks.

---

## 4. Research Summary

No external company, public product, website, or competitor research is required for this request.

---

## 5. Current Project Understanding

- Framework: unknown
- Language: JavaScript/TypeScript-compatible generated frontend files.
- Package manager: detected from workspace lockfiles where available; generated project scripts remain npm-compatible.
- Build tool: Vite-compatible preview/build scripts for generated projects.
- Main app entry: generated project workspace with previewable static/app files.
- Styling system: unknown
- Routes/pages: generated single-page preview unless the request requires more.
- Components: generated workspace files under the project folder.
- State management: lightweight local/demo state unless a real backend is available.
- API layer: no backend API is assumed unless requested.
- Assets: generated CSS/HTML/JS only; no protected external assets are copied.
- Existing design system: preserve the Clyra/Vibe Coder harness and build only inside the generated project workspace.
- Important files:
- index.html
- styles.css
- script.js
- Current weaknesses: Code Mode must avoid shallow output by grouping phases, revisiting files, validating, and previewing.
- Constraints: preserve the current app, do not edit unrelated files, and do not expose secrets.

---

## 6. Quality Target

The result must be complete, premium, responsive, maintainable, smooth, accessible, integrated into the generated project folder, and not a basic demo. It should include realistic content, working interactions, edge states where relevant, and a visual system that feels intentionally designed.

---

## 7. Proposed Architecture

- Component/page structure: split the experience into focused HTML, CSS, and JavaScript modules so layout, style, and behavior remain maintainable.
- Data/config structure: keep reusable content or demo data separate when useful.
- Hooks/utilities: use small local helper functions for interactions, validation, calculations, game loops, or UI state.
- Backend/API structure: only add backend/API behavior if requested and available.
- State management: use local state for menus, forms, controls, FAQ, modals, loading/error states, or demo workflows.
- Styling approach: use a premium custom CSS layer with clear typography, spacing, responsive rules, hover/focus states, and transform/opacity animations.
- Animation approach: keep motion lightweight, smooth, and respectful of reduced-motion preferences.
- Error/loading/empty states: add states that match the requested product type.
- Responsive strategy: verify tablet and mobile layouts with stable spacing and no overflow.

---

## 8. Proposed File Changes

### Files to Create

- Path: `index.html`
  - Purpose: Creates the calculator UI, display, keypad, history area, and previewable app shell.
  - Main contents: focused implementation for calculator app.
  - Why it should be separate: keeps structure, styling, and behavior easy to revisit during Code Mode.

- Path: `styles.css`
  - Purpose: Adds compact premium calculator layout, responsive spacing, button states, and motion.
  - Main contents: focused implementation for calculator app.
  - Why it should be separate: keeps structure, styling, and behavior easy to revisit during Code Mode.

- Path: `script.js`
  - Purpose: Implements expression handling, scientific functions, keyboard support, memory, and validation.
  - Main contents: focused implementation for calculator app.
  - Why it should be separate: keeps structure, styling, and behavior easy to revisit during Code Mode.

### Files to Modify

- Path: `PLAN.md`
  - Current purpose: source-of-truth plan for the current Vibe Coder run.
  - Planned changes: replace any previous plan with this fresh plan.
  - Risk level: Low.
  - How existing behavior will be preserved: product files are not edited until approval.

- Path: `implementation_plan.md`
  - Current purpose: readable implementation plan alias for the latest request.
  - Planned changes: mirror the approved plan scaffold.
  - Risk level: Low.
  - How existing behavior will be preserved: it is a planning artifact only.

### Files to Remove or Replace

- None unless Code Mode finds outdated generated files that conflict with this request.

### Files to Leave Untouched

- Clyra/Vibe Coder application source
  - Reason: this request is for a generated project unless the user explicitly asks to modify the current app.
- Environment files and secrets
  - Reason: generated projects must not expose or overwrite secrets.

---

## 9. Dynamically Generated Implementation Steps

### Step 1 — Define calculator behavior and edge cases

Purpose:
Confirm the current project shape, prior plan state, package scripts, styling constraints, and preview path before writing product files.

Files involved:
- index.html
- styles.css
- script.js

Actions:
- Read the fresh plan and generated workspace.
- Confirm required files and package/build commands.
- Confirm this request is being built literally as calculator app.
- Prepare grouped Code Mode actions instead of one-file-per-step execution.

Premium details:
This prevents outdated plans, shallow templates, or unrelated app edits from leaking into the build.

Expected result:
The execution queue is ready and the visible step divider matches this plan.

Verification:
Confirm the file queue and grouped steps exist before file streaming starts.

### Step 2 — Build the calculator shell and display

Purpose:
Create the main files and layout structure required for the requested product.

Files involved:
- index.html
- styles.css
- script.js

Actions:
- Create the main entry file.
- Create the style layer.
- Create the interaction/state file.
- Wire files together so the preview can run.

Premium details:
The structure should be modular, readable, and easy to revisit for polish.

Expected result:
The product has a complete first working version rather than a placeholder shell.

Verification:
Open the generated files and confirm imports/scripts/styles connect correctly.

### Step 3 — Implement keypad, expression logic, and keyboard input

Purpose:
Make the product feel premium, modern, responsive, and visually complete.

Files involved:
- index.html
- styles.css
- script.js

Actions:
- Apply spacing, typography, color, cards, controls, and layout hierarchy.
- Add desktop, tablet, and mobile rules.
- Add hover, focus, active, loading, empty, and error states where relevant.
- Prevent overflow and layout jumping.

Premium details:
Use smooth transform/opacity transitions, restrained effects, and polished hierarchy instead of generic blocks.

Expected result:
The UI looks finished on desktop and remains usable on smaller screens.

Verification:
Inspect the preview at multiple widths and check text, controls, and layout fit.

### Step 4 — Add history, memory, errors, and interaction states

Purpose:
Make important UI elements actually work with local/demo state.

Files involved:
- index.html
- styles.css
- script.js

Actions:
- Wire buttons, forms, menus, controls, FAQ/tabs/modals/calculator/game interactions as required.
- Add validation and feedback.
- Add lightweight entrance and hover motion.
- Respect reduced-motion preferences.

Premium details:
No major button should look clickable and do nothing.

Expected result:
The product behaves like a real usable experience, not a static screenshot.

Verification:
Click through the main interactions in preview.

### Step 5 — Polish compact responsive calculator UI

Purpose:
Add realistic content, demo data, local persistence, or API integration only when the task requires it.

Files involved:
- index.html
- styles.css
- script.js

Actions:
- Add realistic demo data where no backend exists.
- Add fallback states for missing data.
- Add input guards and error messages.
- Keep secrets out of frontend code.

Premium details:
The product should feel filled out without pretending backend services exist.

Expected result:
The UI has believable content and handles common edge cases.

Verification:
Check empty/error/invalid states manually where applicable.

### Step 6 — Validate calculations and preview

Purpose:
Run real checks, fix errors, start preview, and perform final review.

Files involved:
- index.html
- styles.css
- script.js

Actions:
- Run the available build or validation command.
- Fix any blocking errors.
- Start or refresh live preview.
- Review final UI quality and summarize the result.

Premium details:
Do not mark complete unless checks and preview state are reported honestly.

Expected result:
The final project is previewable and any blockers are clear.

Verification:
Build passes or exact blocker is shown; preview loads or exact preview blocker is shown.

---

## 10. UI/UX Design Plan

- Visual direction: premium, minimal, modern, and specific to the requested product type.
- Layout: strong first viewport, clear information hierarchy, stable sections or app panels, and balanced whitespace.
- Navigation: include useful navigation only when relevant; keep controls predictable.
- Section/component hierarchy: split major UI regions into understandable groups.
- Spacing: use consistent vertical rhythm and avoid cramped panels.
- Typography: clear headings, readable body copy, and restrained label styling.
- Colours: derive from research when applicable; otherwise use an intentional palette for the product type.
- Background treatment: subtle surfaces and depth without heavy visual noise.
- Cards: polished borders, restrained shadows, and clear content density.
- Buttons/inputs: visible hover, focus, active, disabled, loading, and validation states.
- Motion: lightweight entrance, hover, modal/menu, and state transitions.
- Mobile/tablet/desktop: no overlap, horizontal overflow, or unusable controls.
- Accessibility: semantic controls, labels, focus states, and readable contrast.

---

## 11. Feature Completeness Plan

- Add sensible implied features for the requested type without drifting into unrelated scope.
- Use realistic content instead of lorem ipsum.
- Keep reusable content/config separate when useful.
- Include states and edge-case handling rather than only the happy path.
- Revisit files for responsive polish and interaction wiring after initial creation.
- Run validation and preview before completion.

---

## 12. Edge Cases

- Empty data or missing content.
- Invalid input or duplicate submissions.
- Long labels, long section text, and small screens.
- Missing images or unavailable external assets.
- Slow loading or failed preview/build.
- Existing style conflicts or route conflicts.
- Accessibility issues around keyboard and focus.
- Performance risks from heavy animation or excessive DOM work.

---

## 13. Verification Checklist

- [ ] Project files inspected.
- [ ] Research completed if needed.
- [ ] Plan matches the actual user request.
- [ ] No outdated plan assumptions remain.
- [ ] New files are placed correctly.
- [ ] Existing code is preserved.
- [ ] Code is split logically.
- [ ] No giant single-file implementation.
- [ ] UI is not basic.
- [ ] UI is responsive.
- [ ] Loading states exist where needed.
- [ ] Empty states exist where needed.
- [ ] Error states exist where needed.
- [ ] Hover/focus states exist.
- [ ] Accessibility basics are handled.
- [ ] No broken imports.
- [ ] TypeScript passes if used.
- [ ] Lint passes if available.
- [ ] Build passes.
- [ ] Final result manually reviewed.

---

## 14. Risks and Assumptions

- Assumption: the build should be independent unless the user explicitly says it targets the current app.
- Assumption: local/demo state is acceptable where no backend is available.
- Risk: full visual accuracy for real companies is limited without connected screenshot/style extraction tools.
- Risk: generated project preview can fail if package installation or dev server startup fails.
- Risk: protected brand assets cannot be copied without permission.

---

## 15. Approval Gate

Wait for user approval before implementation.

Do not write or modify code until the user approves this plan.
