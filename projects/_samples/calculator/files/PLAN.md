# PLAN.md

## 1. Request Interpretation

- Original request: make a calculator
- Product type: independent calculator app.
- This is not assumed to be for the AI assistant or Vibe Coder.
- Brand/niche assumptions: a polished lightweight calculator called Calculator with a calm premium interface.
- What is not being assumed: no backend, accounts, payments, or unrelated current-app changes.

## 2. Full Product Scope

- A standalone responsive calculator app with a premium glassy visual system.
- Main interactions: number entry, decimal input, clear, backspace, sign toggle, percent, addition, subtraction, multiplication, division, equals, keyboard support, and calculation history.
- States: idle, active input, computed result, error-safe divide-by-zero handling, hover, focus, mobile layout, and saved local history during the session.
- Responsive behaviour: centered phone-like calculator on mobile and a wider information panel on desktop.

## 3. Feature Completeness Checklist

- Working calculator logic.
- Keyboard support for digits, operators, enter, escape, and backspace.
- History list with recent calculations.
- Clear and backspace actions.
- Polished UI with no dead buttons.
- Responsive layout and smooth button transitions.
- Vite build and live preview.

## 4. Existing Project Analysis

- Framework: React + Vite
- Package manager: npm
- Styling system: Tailwind/CSS utility mix
- Routing: generated project runs as an independent Vite app inside the Vibe preview.
- Existing reusable components: current Vibe Coder mini code boxes, thinking animation, terminal logs, and live preview are reused by the harness.

## 5. Architecture

- Use React state in App.tsx for display, accumulator, pending operator, reset-on-next-digit, and history.
- Keep styling in src/styles.css for a clean focused generated project.
- Keep package, HTML entry, and React bootstrap separate for normal preview/build behaviour.

## 6. File Plan

| File Path | Change Type | Purpose | Owner Agent | Risk |
| --- | --- | --- | --- | --- |
| package.json | Create | Vite scripts and dependencies | Harness Agent | Low |
| index.html | Create | HTML entry point | Frontend Agent | Low |
| src/main.tsx | Create | React bootstrap | Frontend Agent | Low |
| src/App.tsx | Create | Calculator UI and logic | Frontend Agent | Medium |
| src/styles.css | Create | Premium responsive styling | Design Agent | Low |
| README.md | Create | Run and feature notes | Reviewer Agent | Low |

## 7. Build Steps

1. Save PLAN.md before implementation.
2. Create package.json and index.html.
3. Create React bootstrap.
4. Generate calculator logic and UI.
5. Add responsive premium styling.
6. Add README.
7. Run Vite build.
8. Start live preview and report the URL.

## 8. Quality Gates

- Every calculator button works.
- Keyboard input works.
- Divide-by-zero and invalid inputs do not crash.
- Layout works on mobile and desktop.
- Build passes.
- Live preview loads or reports an exact blocker.
