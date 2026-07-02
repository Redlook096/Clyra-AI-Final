/**
 * Rendering Engine
 * Manages canvas, camera, and drawing utilities.
 */
class Engine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.camera = { x: 0, y: 0 };

    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
    this.resize();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  /** Follow a target entity (player) with optional smoothing */
  follow(target, levelWidth, levelHeight, smoothing = 0.1) {
    const targetX = target.x + target.width / 2 - this.width / 2;
    const targetY = target.y + target.height / 2 - this.height / 2;

    this.camera.x += (targetX - this.camera.x) * smoothing;
    this.camera.y += (targetY - this.camera.y) * smoothing;

    // Clamp camera to level bounds
    this.camera.x = Math.max(0, Math.min(this.camera.x, levelWidth - this.width));
    this.camera.y = Math.max(0, Math.min(this.camera.y, levelHeight - this.height));
  }

  /** Clear the canvas */
  clear(bgColor = '#1a1a2e') {
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Draw a filled rectangle in world coordinates (auto camera offset) */
  fillRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x - this.camera.x),
      Math.round(y - this.camera.y),
      w,
      h
    );
  }

  /** Draw a stroked rectangle in world coordinates */
  strokeRect(x, y, w, h, color, lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(
      Math.round(x - this.camera.x),
      Math.round(y - this.camera.y),
      w,
      h
    );
  }

  /** Draw text in world coordinates */
  fillText(text, x, y, color, size = 16, align = 'left') {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px 'Courier New', monospace`;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, Math.round(x - this.camera.x), Math.round(y - this.camera.y));
  }

  /** Draw text in screen space (for HUD) */
  fillTextScreen(text, x, y, color, size = 16, align = 'left') {
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${size}px 'Courier New', monospace`;
    this.ctx.textAlign = align;
    this.ctx.fillText(text, x, y);
  }

  /** Draw a tile from a spritesheet (for programmatic tiles) */
  fillTile(x, y, tileSize, color) {
    this.fillRect(x * tileSize, y * tileSize, tileSize, tileSize, color);
    // Subtle border for tile definition
    this.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize, 'rgba(0,0,0,0.2)', 1);
  }

  /** Draw a simple pixel-art circle */
  fillCircle(x, y, radius, color) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(
      Math.round(x - this.camera.x),
      Math.round(y - this.camera.y),
      radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  /** Draw a scaled sprite image */
  drawSprite(image, sx, sy, sw, sh, dx, dy, dw, dh) {
    this.ctx.drawImage(
      image,
      sx, sy, sw, sh,
      Math.round(dx - this.camera.x),
      Math.round(dy - this.camera.y),
      dw, dh
    );
  }
}
