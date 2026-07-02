# PLAN — 2D Platformer Game

## 1. Classification

| Field | Value |
|-------|-------|
| Request type | Complete interactive game |
| Scope | Multiple files, game loop, physics, level design, assets |
| Platform | Web browser (HTML5 Canvas / JavaScript) |
| State | Fresh project — no previous code exists |

## 2. Previous Work Summary

- **No previous PLAN.md found.**
- The `files/` directory is empty.
- No build system, package manager, or framework detected.
- `metadata.json` shows `mode: "plan"`, `status: "Planning"`.

This is a first-ever request for this project.

## 3. Files Inspected

| File | Purpose | Findings |
|------|---------|----------|
| `metadata.json` | Project metadata | Created 2026-06-29, mode=plan, fresh |
| `.agent/project-analysis.txt` | Auto-analysis | No framework, no packages, no files |
| `files/` (directory) | Source code output | Empty |
| `logs/` | Build logs | Empty |
| `checkpoints/` | Build checkpoints | Empty |

## 4. Technology & Architecture Decisions

- **Engine**: Vanilla JavaScript with HTML5 Canvas (no external game engine)
- **Rendering**: 2D canvas, requestAnimationFrame game loop
- **Physics**: Simple AABB collision detection, gravity, velocity
- **Assets**: Programmatic pixel-art drawing (canvas-generated sprites — no external images needed)
- **Level format**: JSON-based tile maps
- **No build system / bundler required** — plain `.html` + `.js` + `.css`

### Why no engine/library?
- The request is "make me a 2d platformer" and the workspace has no package manager.
- Vanilla JS keeps it self-contained and zero-dependency.
- A single HTML file can be opened in any browser.

## 5. Directory Structure (to be created)

```
files/
├── index.html          ← Entry point, loads canvas + UI
├── style.css           ← Page styling, canvas sizing
├── js/
│   ├── main.js         ← Game loop, init, input handling
│   ├── engine.js       ← Canvas rendering, camera, utilities
│   ├── physics.js      ← Gravity, collision detection, movement
│   ├── player.js       ← Player entity: drawing, state, animation
│   ├── level.js        ← Level loader, tile map, platforms
│   ├── enemies.js      ← Enemy entities, patrol, collision
│   ├── items.js        ← Collectibles (coins, powerups)
│   ├── hud.js          ← Score, health, UI overlay
│   └── input.js        ← Keyboard input manager
```

## 6. Features (File Queue)

### Phase 1 — Core Gameplay (MVP)

| # | File | Purpose | Key Details |
|---|------|---------|-------------|
| 1 | `index.html` | HTML shell | Canvas element, script tags, HUD overlay |
| 2 | `style.css` | Visual styling | Full-viewport canvas, dark background, pixel-art crisp rendering |
| 3 | `js/input.js` | Input manager | Track key states (arrows, space), support keydown/keyup |
| 4 | `js/engine.js` | Rendering engine | Canvas context, camera object with follow-player logic, draw utilities |
| 5 | `js/physics.js` | Physics system | Gravity (constant downward acceleration), AABB collision resolution, ground detection |
| 6 | `js/player.js` | Player object | Position, velocity, jump (variable height), double-jump, run animation frames, hitbox |
| 7 | `js/level.js` | Level system | Tile grid (2D array), tileset colors, platform/collision maps, spawn points |
| 8 | `js/enemies.js` | Enemies | Patrol movement (left/right), edge detection, stomp detection, respawn |
| 9 | `js/items.js` | Collectibles | Coins with rotation animation, score pickup, optional powerups |
| 10 | `js/hud.js` | HUD overlay | Score counter, lives/health display, coin count |
| 11 | `js/main.js` | Game orchestrator | requestAnimationFrame loop, state machine (menu/playing/paused/gameover), entity updates |

### Phase 2 — Polish & Extras (to be added after MVP validation)

- Level transitions (door/flag at end of level)
- Parallax background layers
- Particle effects (dust on landing, coin sparkle, death puff)
- Sound effects (Web Audio API — simple beeps)
- Mobile touch controls overlay
- Level editor (simple JSON export from canvas)

## 7. Validation Plan

| Check | Method | Criteria |
|-------|--------|---------|
| Game loads | Open `index.html` in browser | No console errors, canvas renders |
| Player moves | Press arrow keys | Player sprite moves left/right |
| Gravity works | Let player fall | Player falls and stops on platforms |
| Jump | Press space/up | Player jumps and lands |
| Collision | Walk into wall | Player stops at wall edge |
| Enemies | Player encounters enemy | Enemy patrols, player can stomp |
| Coins | Walk into coin | Coin disappears, score increments |
| HUD updates | Play game | Score/coins/lives update in real-time |
| Game over | Lose all lives | "Game Over" screen appears |
| Win condition | Reach level end | Victory screen or level transition |

## 8. Preview & Checkpoints

- **Checkpoint 1**: `index.html` renders a blank canvas of correct size
- **Checkpoint 2**: Player sprite appears on canvas, moves with arrow keys
- **Checkpoint 3**: Gravity and platform collision working — player can stand on ground
- **Checkpoint 4**: Jump mechanic functional (variable height)
- **Checkpoint 5**: First level playable with platforms, coins, enemies
- **Checkpoint 6**: HUD displays score and lives
- **Checkpoint 7**: Game over / restart loop works
- **Checkpoint 8**: Full polish pass — animations, particles, sound, level 2

Each checkpoint should be tested by opening `index.html` in a browser.

## 9. Follow-Up Strategy

- After the MVP (Phase 1) is built and validated, ask the user:
  - "What kind of theme do you want? (forest, cave, ice, space)"
  - "Add more levels, enemies, or powerups?"
  - "Mobile touch controls?"
  - "Sound effects / music?"
- Iterate based on feedback; never redesign from scratch.
- All changes track back to this plan via checkpoint log entries.

## 10. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Collision detection jitter | Use resolution-based AABB with position correction |
| Variable-height jump feels bad | Implement "release = cut velocity" mechanic |
| Canvas performance | Limit particle count, use requestAnimationFrame, dirty-rect only if needed |
| No package manager | All vanilla — no build step required |
| User wants different tech | Offer tradeoffs: "We can add a bundler later" — keep plan modular |
