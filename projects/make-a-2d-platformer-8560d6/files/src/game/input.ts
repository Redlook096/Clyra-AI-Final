// Input manager - keyboard input tracking
import type { GameState } from './game';

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpJustPressed: boolean;
  down: boolean;
  pause: boolean;
  pauseJustPressed: boolean;
  enter: boolean;
  enterJustPressed: boolean;
}

export function createInputState(): InputState {
  return {
    left: false,
    right: false,
    jump: false,
    jumpJustPressed: false,
    down: false,
    pause: false,
    pauseJustPressed: false,
    enter: false,
    enterJustPressed: false,
  };
}

// Track keys that were just pressed this frame
let justPressedKeys: Set<string> = new Set();
let currentKeys: Set<string> = new Set();

export function setupInput(canvas: HTMLCanvasElement, gameState: () => GameState) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!currentKeys.has(e.key)) {
      justPressedKeys.add(e.key);
    }
    currentKeys.add(e.key);
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    currentKeys.delete(e.key);
  };

  // Touch input for mobile
  const handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      const x = (touch.clientX - rect.left) / rect.width;
      const y = (touch.clientY - rect.top) / rect.height;

      if (y < 0.5) {
        // Top half - jump
        if (!currentKeys.has('touch_jump')) {
          justPressedKeys.add('touch_jump');
        }
        currentKeys.add('touch_jump');
      } else if (x < 0.3) {
        currentKeys.add('touch_left');
      } else if (x > 0.7) {
        currentKeys.add('touch_right');
      } else {
        currentKeys.add('touch_jump');
        if (!currentKeys.has('touch_jump')) {
          justPressedKeys.add('touch_jump');
        }
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    currentKeys.delete('touch_left');
    currentKeys.delete('touch_right');
    currentKeys.delete('touch_jump');
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('touchstart', handleTouchStart);
    canvas.removeEventListener('touchend', handleTouchEnd);
    canvas.removeEventListener('touchcancel', handleTouchEnd);
  };
}

export function updateInput(input: InputState): void {
  const mapKey = (key: string): boolean => currentKeys.has(key);
  const mapJustPressed = (key: string): boolean => justPressedKeys.has(key);

  input.left = mapKey('ArrowLeft') || mapKey('a') || mapKey('A') || currentKeys.has('touch_left');
  input.right = mapKey('ArrowRight') || mapKey('d') || mapKey('D') || currentKeys.has('touch_right');
  input.jump = mapKey('ArrowUp') || mapKey('w') || mapKey('W') || mapKey(' ') || currentKeys.has('touch_jump');
  input.jumpJustPressed = mapJustPressed('ArrowUp') || mapJustPressed('w') || mapJustPressed('W') || mapJustPressed(' ') || mapJustPressed('touch_jump');
  input.down = mapKey('ArrowDown') || mapKey('s') || mapKey('S');
  input.pause = mapKey('Escape') || mapKey('p') || mapKey('P');
  input.pauseJustPressed = mapJustPressed('Escape') || mapJustPressed('p') || mapJustPressed('P');
  input.enter = mapKey('Enter');
  input.enterJustPressed = mapJustPressed('Enter');

  // Clear just-pressed keys for next frame
  justPressedKeys.clear();
}
