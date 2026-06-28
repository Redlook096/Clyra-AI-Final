# Snake Game - Premium React Implementation

## Goal
Build a fully functional Snake game with a premium glassmorphism UI, responsive layout, smooth animations, and robust game logic.

## Requirements
- 20x20 grid playing field
- Snake moves continuously in a direction (up, down, left, right)
- Arrow keys control direction; swiping on mobile
- Random food spawns; eating increases length and score
- Collision with walls or self ends game
- Score display, restart button, game over overlay
- Premium minimalist design with glassy effects, subtle gradients, and shadows
- Responsive: works on desktop and mobile

## Execution Gates
1. **Core Game Logic** – Snake movement, direction change, food eating, collision detection
2. **State Management** – React hooks for snake, direction, food, score, game over
3. **Game Loop** – `useEffect` with `setInterval` to update snake position
4. **Input Handling** – Keyboard event listener + touch/swipe support
5. **Rendering** – Grid component with colored cells for snake and food
6. **UI Polish** – Glassmorphism cards, consistent spacing, font choice, restart overlay
7. **Testing** – Manual play test for edge cases (rapid key presses, wall hits, self hits)

## Task Graph
| ID | Name | Description |
|----|------|-------------|
| T1 | Initialize Game State | Create state for snake, direction, food, score, game over, and grid size |
| T2 | Create Game Board Component | Render a 2D grid of cells; snake and food cells have distinct colors |
| T3 | Handle Keyboard Input | Listen for arrow keys and update direction (prevent reverse) |
| T4 | Implement Game Loop | Use setInterval to move snake, check collision, spawn food, update score |
| T5 | Collision Detection | Detect wall hits and self-collision → set game over |
| T6 | Food Spawning Logic | Random empty cell generation after eating |
| T7 | Score & Restart Overlay | Show score; on game over show overlay with score and restart button |
| T8 | Mobile Swipe Support | Add touch event listeners for swipe detection |
| T9 | Style with Glassmorphism | Apply backdrop-filter, glassy backgrounds, smooth transitions |
| T10 | Responsive Layout | Ensure grid scales on mobile; board fits screen |