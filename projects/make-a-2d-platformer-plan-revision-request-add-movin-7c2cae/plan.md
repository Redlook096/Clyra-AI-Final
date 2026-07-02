# PLAN.md

## 1. Request Interpretation

- Original request: make a 2d platformer

Plan revision request: add moving platforms and a pause state
- Product type: independent 2D platformer game.
- This is not assumed to be for the AI assistant or Vibe Coder.
- Brand/niche assumptions: a polished browser platformer called Skybound Runner with keyboard controls, collectibles, hazards, and a compact HUD.
- What is not being assumed: no multiplayer backend, no paid assets, no external game engine, and no unrelated current-app changes.

## 2. Full Product Scope

- A playable responsive 2D platformer with a canvas game area, start/restart flow, HUD, level data, player physics, collision detection, coins, hazards, and win/fail states.
- Main interactions: move left/right, jump, restart, pause/resume, collect coins, avoid spikes, reach the portal.
- States: welcome, playing, paused, won, lost, keyboard focus, mobile fallback instructions, and reduced-motion friendly UI transitions.
- Responsive behaviour: centered game shell on desktop, scaled canvas on smaller screens, controls/help visible without scrolling.

## 3. Feature Completeness Checklist

- Playable character movement and gravity.
- Platform collision and jump grounding.
- Collectibles and score tracking.
- Hazards and fail/restart state.
- Goal portal and win state.
- Keyboard controls and accessible control hints.
- Polished UI with no dead buttons.
- Vite build and live preview.

## 4. Existing Project Analysis

- Framework: React + Vite
- Package manager: npm
- Styling system: Tailwind/CSS utility mix
- Routing: generated project runs as an independent Vite app inside the Vibe preview.
- Existing reusable components: current Vibe Coder mini code boxes, thinking animation, terminal logs, and live preview are reused by the harness.

## 5. Architecture

- Use React for shell state and requestAnimationFrame canvas rendering.
- Keep level geometry and game constants in src/game/levels.ts.
- Keep physics and collision helpers in src/game/physics.ts.
- Keep shared types in src/game/types.ts.
- Keep visual polish in src/styles.css.

## 6. File Plan

| File Path | Change Type | Purpose | Owner Agent | Risk |
| --- | --- | --- | --- | --- |
| package.json | Create | Vite scripts and dependencies | Harness Agent | Low |
| index.html | Create | HTML entry point | Frontend Agent | Low |
| src/main.tsx | Create | React bootstrap | Frontend Agent | Low |
| src/game/types.ts | Create | Shared game types | Frontend Agent | Low |
| src/game/levels.ts | Create | Platforms, coins, hazards, and goal data | Design Agent | Medium |
| src/game/physics.ts | Create | Movement and collision helpers | Frontend Agent | Medium |
| src/App.tsx | Create | Game loop, canvas rendering, HUD, controls | Frontend Agent | High |
| src/styles.css | Create | Premium responsive game UI | Design Agent | Low |
| README.md | Create | Run and controls notes | Reviewer Agent | Low |

## 7. Build Steps

1. Save PLAN.md before implementation.
2. Create package.json and index.html.
3. Create React bootstrap and game type modules.
4. Generate level geometry and physics helpers.
5. Build the playable canvas game loop and UI states.
6. Add responsive premium styling.
7. Add README controls and validation notes.
8. Run Vite build.
9. Start live preview and report the URL.

## 8. Quality Gates

- Player can move and jump.
- Platforms collide correctly.
- Coins can be collected.
- Spikes trigger fail state.
- Portal triggers win state.
- Restart and pause controls work.
- Layout works on mobile and desktop.
- Build passes.
- Live preview loads or reports an exact blocker.
