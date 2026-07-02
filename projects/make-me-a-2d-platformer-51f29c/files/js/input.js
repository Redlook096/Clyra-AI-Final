/**
 * Input Manager
 * Tracks keyboard state with support for keydown/keyup.
 * Provides a clean API for checking held keys and just-pressed keys.
 */
class InputManager {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this._pressedThisFrame = {};

    this._onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key)) {
        e.preventDefault();
      }
      const key = this._normalizeKey(e.key);
      if (!this.keys[key]) {
        this.justPressed[key] = true;
      }
      this.keys[key] = true;
      this._pressedThisFrame[key] = true;
    };

    this._onKeyUp = (e) => {
      const key = this._normalizeKey(e.key);
      this.keys[key] = false;
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  _normalizeKey(key) {
    if (key === ' ') return 'Space';
    if (key === 'ArrowUp') return 'ArrowUp';
    if (key === 'ArrowDown') return 'ArrowDown';
    if (key === 'ArrowLeft') return 'ArrowLeft';
    if (key === 'ArrowRight') return 'ArrowRight';
    return key;
  }

  /** Check if a key is currently held down */
  isDown(key) {
    return !!this.keys[key];
  }

  /** Check if a key was just pressed this frame (consumed on read) */
  wasPressed(key) {
    if (this.justPressed[key]) {
      this.justPressed[key] = false;
      return true;
    }
    return false;
  }

  /** Call at end of each frame to reset per-frame state */
  endFrame() {
    this.justPressed = {};
    for (const k in this._pressedThisFrame) {
      this.justPressed[k] = false;
    }
    this._pressedThisFrame = {};
  }

  /** Clean up event listeners */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
