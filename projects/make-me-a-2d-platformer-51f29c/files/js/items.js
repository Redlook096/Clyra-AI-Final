/**
 * Collectible Items
 * Coins with bobbing animation, score pickup.
 */
class Item {
  constructor(x, y, type = 'coin') {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.type = type;
    this.collected = false;
    this.collectTimer = 0;

    // Animation
    this.bobPhase = Math.random() * Math.PI * 2;
    this.baseY = y;
  }

  /** Update item animation */
  update() {
    this.bobPhase += 0.05;
    this.y = this.baseY + Math.sin(this.bobPhase) * 3;
  }

  /** Draw the item */
  draw(engine) {
    if (this.collected) return;

    const px = Math.round(this.x - engine.camera.x);
    const py = Math.round(this.y - engine.camera.y);

    const ctx = engine.ctx;

    // Coin: golden circle with shine
    if (this.type === 'coin') {
      // Outer glow
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 10, 0, Math.PI * 2);
      ctx.fill();

      // Coin body
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 7, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(px + 8, py + 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Shine
      ctx.fillStyle = 'rgba(255, 255, 200, 0.7)';
      ctx.beginPath();
      ctx.arc(px + 5, py + 5, 2, 0, Math.PI * 2);
      ctx.fill();

      // $ symbol
      ctx.fillStyle = '#e67e22';
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', px + 8, py + 9);
    }

    // Powerup star
    if (this.type === 'powerup') {
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      // Simple 5-point star approximation
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const sx = px + 8 + Math.cos(angle) * 8;
        const sy = py + 8 + Math.sin(angle) * 8;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /** Check if player collects this item */
  checkPickup(playerHitbox) {
    if (this.collected) return false;
    const itemBox = { x: this.x, y: this.y, width: this.width, height: this.height };
    if (aabbOverlap(playerHitbox, itemBox)) {
      this.collected = true;
      return true;
    }
    return false;
  }
}
