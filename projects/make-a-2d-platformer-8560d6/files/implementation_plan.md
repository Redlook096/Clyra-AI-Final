# Implementation Plan

## Request Summary
make a 2d platformer

## Product Type
product

## Target Product
Custom product — Custom product — product with polished UI and realistic content

## Research Summary
No brand-specific web research required for this request.

## Website Style Analysis
No external website style clone requested. Use the project fingerprint for visual direction.

## Design Direction
- Colour mood: midnight premium
- Layout pattern: centered storytelling
- Interaction style: touch-friendly mobile gestures
- Content angle: Focused on product value props for Custom product

## User Flows
Discover → interact with core feature → complete primary task → review result

## Pages / Sections
Primary screen, supporting sections, empty/loading/error states

## Features
Complete product features with realistic content and working UI interactions

## Interactions
- Working navigation, CTAs, forms, modals, tabs, and filters where relevant
- Keyboard and touch support
- Empty, loading, error, and success states

## Animations
- Section reveal on scroll
- Hover/focus micro-interactions on buttons, cards, and nav
- Smooth mobile menu transitions

## Responsive Behaviour
- Mobile-first layout with collapsible navigation
- Tablet and desktop grid refinements
- Readable typography scale across breakpoints

## State / Data Needs
- Local/demo state with realistic seed content
- Form validation state
- UI state for modals, drawers, tabs, and filters

## Auth / Forms / Settings / Search / Filters
Include where relevant for product: auth UI shells, validated forms, settings panels, search, and list filters.

## File Plan
- [create] `package.json` — project scripts and dependencies
- [create] `index.html` — app shell
- [create] `src/main.tsx` — React entry
- [create] `src/App.tsx` — root layout and routing shell
- [create] `src/index.css` — design tokens and base styles
- [create] `src/components/` — feature components per scope
- [create] `src/hooks/` — state and interaction hooks

## Tool Strategy
1. Inspect workspace (read, search, list)
2. Read PLAN.md before each major edit group
3. Create foundation files (package.json, index.html, entry)
4. Build pages/sections with connected multi-file edits
5. Wire interactions and revisit files for polish
6. Run build/lint via terminal
7. Fix errors and refresh preview

## Validation Checklist
- [ ] All planned files created or updated
- [ ] Interactions wired (not static-only UI)
- [ ] Responsive layout verified
- [ ] Build/lint passes
- [ ] Preview matches request

## Acceptance Test
The live preview shows a complete product for Custom product with navigation, core features, polished UI, working interactions, and mobile layout — not a 3-file demo.


---
## Cline Draft Notes
Now I have a solid research foundation. Let me produce the comprehensive PLAN.md.

---

# PLAN.md — 2D Platformer Game

## 1. Request Summary

The user asked: **"make a 2d platformer"**. This is a game development request for a classic side-scrolling 2D platformer built with web technologies (HTML5 Canvas + JavaScript), playable in the browser.

---

## 2. Product Identity

| Attribute | Value |
|---|---|
| **Product Type** | Single-player 2D side-scrolling platformer |
| **Target Platform** | Desktop web browser (Chrome, Firefox, Safari, Edge) |
| **Rendering** | HTML5 Canvas 2D with double-buffered game loop |
| **Input** | Keyboard (Arrow keys / WASD + Space) |
| **Genre** | Precision platformer — inspired by Celeste, Super Mario, and Doodle Jump |
| **Tone** | Whimsical, retro-pixel aesthetic with smooth modern physics |
| **Colour Mood** | Vibrant neon on dark background; high-contrast for readability |
| **Art Style** | Hand-drawn pixel-art sprites (created via code-generated shapes) |

---

## 3. Research Summary

Research into MDN game development guides and 2D collision detection techniques provided the following foundational decisions:

- **Rendering**: Use `<canvas>` 2D context — best balance of performance and simplicity for a 2D tile-based platformer.
- **Game Loop**: Use `requestAnimationFrame` with delta-time accumulation for fixed-timestep physics (60 Hz tick) and variable framerate rendering.
- **Collision Detection**: AABB (axis-aligned bounding box) for player↔tile and player↔enemy collision; simple overlap checks for collectibles.
- **Physics**: Simple Euler integration for gravity, velocity, and jumping. No external physics engine — hand-rolled for precise feel.
- **Level Design**: Tilemap-based with a 2D array representing the world. Camera follows the player with smooth lerp.
- **Performance**: Broad-phase spatial check via tilemap indexing (only check tiles near player); narrow-phase AABB per tile.

---

## 4. Design Direction

### Visual style
- **Canvas size**: 800×600 logical pixels, scaled via CSS to fill viewport while maintaining aspect ratio.
- **Tile size**: 32×32 pixels.
- **Palette**: Midnight background (#0a0a1a), platform tiles in cyan/teal gradients (#00f0ff → #0066cc), player in bright pink (#ff2d78), collectibles in gold (#ffd700), enemies in red (#ff4444).
- **Parallax background**: 2–3 layers of starfields/mountains at different scroll speeds.

### Audio
- **Sound effects**: Generated via `Web Audio API` — short synthesized beeps for jump, coin collect, hit, death, level complete.
- **Music**: No streaming music in MVP; optional procedural chiptune via oscillator later.

### Layout
- **Game screen**: Full-viewport canvas with optional HUD overlay.
- **HUD**: Top-left — score and lives. Top-right — level timer. Bottom when paused — pause menu overlay.

---

## 5. User Flows

```
[Load Screen] → [Main Menu]
                      ├── Play → [Level 1 Start]
                      ├── How to Play → [Controls overlay, back to menu]
                      └── Settings → [Audio toggle, back to menu]

[Level Play] ←→ [Pause Menu] (ESC / P)
       │
       ├── [Player Death] → Respawn at checkpoint or level start
       ├── [Level Complete] → Score tally → Next level
       └── [Game Over] (lives depleted) → Game Over screen → Main Menu
```

---

## 6. Pages / Screens

| Screen | Description |
|---|---|
| **Boot / Loading** | Brief splash with game title, asset generation indicator |
| **Main Menu** | Title, Play / How to Play / Settings buttons with hover glow |
| **In-Game** | Full canvas gameplay with HUD |
| **Pause Overlay** | Semi-transparent overlay with Resume / Restart / Quit |
| **Level Complete** | Score summary, star rating, Next Level / Replay buttons |
| **Game Over** | Final score, Retry / Main Menu buttons |

---

## 7. Features

### Core Gameplay
- **Player character** with 3-state sprite (idle, run, jump) — drawn programmatically on canvas.
- **Smooth movement**: Horizontal acceleration + friction (not instant velocity) for juicy feel.
- **Jumping**: Variable-height jump (hold jump button = higher arc). Coyote time (brief grace period after leaving ledge). Jump buffering.
- **Gravity**: Tuned to feel responsive — ~1200 px/s².
- **Platforms**: Static terrain tiles, moving platforms (horizontal/vertical oscillating), one-way platforms (can jump up through).
- **Enemies**: Simple AI — walk back and forth on platforms. Killable by stomping (player bounces up on stomp). Player dies on side/bottom contact.
- **Collectibles**: Coins scattered through levels. Gems in harder-to-reach places.
- **Checkpoints**: Flag-style checkpoints that save respawn position.
- **Level goal**: A flag/door that triggers level completion when touched.
- **Lives**: 3 lives per game. Lose life = respawn at checkpoint. 0 lives = game over.

### Advanced Features
- **Camera**: Smooth follow camera with dead zone. Vertical scrolling allowed.
- **Particles**: Dust particles on landing, coin sparkle, death explosion.
- **Score multiplier**: Collect coins consecutively without touching ground for combo multiplier.
- **Secret areas**: Hidden rooms behind breakable walls or disguised passages.

---

## 8. Interactions

| Input | Action |
|---|---|
| Arrow Left / A | Move left |
| Arrow Right / D | Move right |
| Arrow Up / W / Space | Jump |
| Arrow Down / S | Drop through one-way platform |
| ESC / P | Pause / Resume |
| R (when paused) | Restart level |
| Enter | Confirm menu selection |

### Touch (future mobile support)
- Left half screen tap → Move left
- Right half screen tap → Move right
- Tap top half → Jump
- Swipe down → Drop through

---

## 9. Animations

| Animation | Implementation |
|---|---|
| Idle | Slight bobbing (sin wave on y-offset) |
| Run | Alternating leg frames, 2-frame cycle timed to speed |
| Jump | Arms up, legs tucked — single frame |
| Fall | Arms down, legs spread — single frame |
| Death | Player spins upward and fades out, particles burst |
| Coin collect | Coin flips and shrinks (scale + rotation tween) |
| Platform | Smooth lerp position for moving platforms |
| Stomp enemy | Enemy compresses, then disappears with puff |
| Checkpoint activate | Flag unfurls, glow pulse |

All animations are code-driven (no sprite sheets required), using `requestAnimationFrame` delta-time for frame-independent playback.

---

## 10. Responsive Behaviour

| Viewport | Behaviour |
|---|---|
| ≥800×600 | Full game canvas 1:1, centered with dark letterbox border |
| <800 wide | Scale canvas proportionally, maintain aspect ratio, fit width |
| <600 tall | Scale canvas proportionally, ensure HUD text remains legible |
| Mobile (touch) | Add touch controls overlay, scale canvas to full device width |

Uses CSS `object-fit: contain` on the canvas element + `resize` event listener to recalculate scale.

---

## 11. State / Data Needs

### Game State Store (plain JS object / singleton)

```js
{
  screen: 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver',
  level: { grid: number[][], width: number, height: number, tileSize: 32 },
  player: { x, y, vx, vy, width, height, lives, score, coins, grounded, jumpBufferTimer, coyoteTimer, facing },
  camera: { x, y, target },
  entities: [ { type: 'enemy'|'coin'|'gem'|'checkpoint'|'goal'|'movingPlatform', x, y, w, h, ...props } ],
  particles: [],
  input: { left, right, jump, down, pause },
  timer: 0,
  combo: 0,
  settings: { audioEnabled: true }
}
```

### Persistence
- `localStorage` for high scores and unlocked levels.
- No backend required.

---

## 12. File Plan

```
/
├── index.html              # Entry point, semantic HTML shell
├── style.css               # Page layout, canvas centering, HUD font styling
├── plan.md                 # This file
├── js/
│   ├── main.js             # Entry: boot, game loop orchestration, screen routing
│   ├── game.js             # Game state object, constants, init/reset
│   ├── input.js            # Keyboard & touch input manager
│   ├── render.js           # Canvas draw calls, camera transform, layering
│   ├── physics.js          # Gravity, movement integration, collision resolution
│   ├── collision.js        # AABB overlap tests, tile collision detection
│   ├── entities.js         # Player, enemy, coin, checkpoint, goal, moving platform
│   ├── level.js            # Level data (tilemaps as 2D arrays), loader, generator
│   ├── camera.js           # Smooth follow camera logic
│   ├── particles.js        # Particle system (dust, sparkle, death burst)
│   ├── audio.js            # Web Audio API sound synthesis
│   ├── hud.js              # Score, lives, timer rendering
│   ├── menu.js             # Main menu, pause overlay, level complete screens
│   └── sprite.js           # Procedural sprite drawing functions (player, enemies)
```

14 files total. All vanilla JavaScript — no framework or bundler needed. Game runs by opening `index.html` in any modern browser.

---

## 13. Tool / Build Strategy

| Tool | Use |
|---|---|
| None | Zero build step. Pure HTML + CSS + JS. |
| `npx serve` | Optional local dev server for live reload during development. |
| Code generation | Programmatic sprite drawing (no external assets). |
| Testing | Manual playtesting + `console.assert` for physics invariants. |

No npm dependencies. No bundler. No TypeScript. The game is a single-page application that works directly from the filesystem.

---

## 14. Validation Checklist

| Check | Description |
|---|---|
| [ ] | Game boots on double-click of `index.html` |
| [ ] | Main menu displays with all buttons functional |
| [ ] | Player moves left/right with smooth acceleration |
| [ ] | Jump is variable-height (hold = higher) |
| [ ] | Coyote time works (brief grace when walking off ledge) |
| [ ] | Jump buffer works (press jump slightly before landing) |
| [ ] | Collision is pixel-accurate with tiles (no wall sticking) |
| [ ] | Player lands on platforms, falls through one-way tiles |
| [ ] | Enemies patrol and are stompable |
| [ ] | Coins are collectible and increment score |
| [ ] | Checkpoints save respawn position |
| [ ] | Death respawns at checkpoint with lives decremented |
| [ ] | 0 lives shows Game Over screen |
| [ ] | Reaching level goal shows Level Complete |
| [ ] | Pause overlay works (ESC) and blocks gameplay |
| [ ] | Camera follows player smoothly |
| [ ] | Particles spawn on landings and coin pickups |
| [ ] | Audio plays on jump/coin/death/stomp |
| [ ] | Canvas scales to different window sizes |
| [ ] | No console errors during gameplay |
| [ ] | High score persists across page refreshes |

---

## 15. Acceptance Test

The game passes when:

1. A user can open `index.html` in Chrome or Firefox and immediately see a main menu.
2. Clicking "Play" starts a level with a player character on visible platforms.
3. Arrow keys/WASD move the character; Space/Up jumps with variable height.
4. The camera scrolls with the player as they traverse left/right/up/down.
5. Coins can be collected (score increments, coin disappears, sound plays).
6. Enemies patrol; stomping them kills them and bounces the player; touching them from the side kills the player.
7. Reaching a checkpoint flag saves progress.
8. Falling into a pit or enemy contact from the side causes death — respawn at last checkpoint; after 3 deaths, Game Over screen appears.
9. Reaching the level goal flag triggers Level Complete with score display.
10. Game feels responsive and fun — no input lag, no jittery collisions, solid 60fps on modern hardware.

---

## Implementation Priority

1. **Phase 1** — Shell: `index.html`, `style.css`, `main.js`, `game.js`, `input.js`, `render.js` → Boot to black canvas, game loop running.
2. **Phase 2** — Core: `physics.js`, `collision.js`, `entities.js` (player only) → Player moves, jumps, and collides with a single test platform.
3. **Phase 3** — Level: `level.js`, `camera.js` → Tilemap loads, camera follows player through a scrolling level.
4. **Phase 4** — Content: `entities.js` (enemies, coins, checkpoints, goal), `particles.js`, `audio.js` → Full gameplay loop.
5. **Phase 5** — UI: `hud.js`, `menu.js` → Screens and HUD.
6. **Phase 6** — Polish: Animations, particles, touch input, responsive scaling, level design (3 levels).


## Approval Gate
Wait for user approval before writing application code. Plan Mode output only.
