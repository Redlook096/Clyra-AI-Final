# Snake Game - Premium Minimal Build

## Goal
Build a fully functional Snake game with a premium minimal UI featuring glassy effects, smooth animations, and polished layouts.

## Requirements
- Playable Snake game with arrow key controls
- Grid-based board with glassmorphism styling
- Score tracking and display
- Game over detection (wall collision, self-collision)
- Restart functionality
- Responsive and centered layout
- Modern aesthetics (blur, transparency, subtle gradients)

## Execution Gates
1. **Gate 1: Core Logic** - Implement grid, snake state, direction changes, movement, collision detection, score.
2. **Gate 2: UI & Styling** - Create glassy board, score panel, controls overlay, restart button.
3. **Gate 3: Polish** - Add animations, fixed timestep, keyboard handling, game over screen.
4. **Gate 4: Testing** - Ensure all edge cases (e.g., wrapping? no wrapping), responsive design, keyboard support.

## Task Graph
- T1: Set up React project with TypeScript
- T2: Create Snake game logic (grid, snake, food, movement, collision)
- T3: Build UI components (Board, Score, GameOver, Restart)
- T4: Apply glassmorphism CSS styles
- T5: Add keyboard controls and game loop
- T6: Test and polish

## Final Deliverables
- `src/App.tsx` - Main component containing game logic and UI
- `src/styles.css` - All CSS for glassy effects and layout