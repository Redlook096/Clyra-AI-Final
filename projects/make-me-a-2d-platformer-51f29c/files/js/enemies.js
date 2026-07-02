/**
 * Enemy Entities
 * Patrolling enemies with edge detection, stomp detection, respawn.
 */
class Enemy {
  constructor(x, y, type = 'slime') {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 24;
    this.vx = -1.2;
    this.vy = 0;
    this.type = type;
    this.alive = true;
    this.facing = -1;

    // Patrol
    this.patrolRange = 80; // pixels from start
    this.direction = -1;

    // Animation
    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 15;
    this.squishTimer = 0; // after stomp, squish animation
  }

  /** Update enemy state */
  update(solids) {
    if (!this.alive) {
      if (this.squishTimer > 0) {
        this.squishTimer--;
        if (this.squishTimer <= 0) {
          // Respawn after delay
          this.respawn();
        }
      }
      return;
    }

    // Apply gravity
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

    // Move horizontally
    this.x += this.vx;

    // Check for edge - if no ground below in front, turn around
    const aheadX = this.vx > 0 ? this.x + this.width + 2 : this.x - 2;
    const belowCheck = {
      x: aheadX,
      y: this.y + this.height,
      width: 4,
      height: 4
    };
    let hasGround = false;
    for (const solid of solids) {
      if (aabbOverlap(belowCheck, solid)) {
        hasGround = true;
        break;
      }
    }
    if (!hasGround) {
      this.vx = -this.vx;
      this.facing = -this.facing;
    }

    // Hit wall? (Check while moving)
    const horizCheck = {
      x: this.vx > 0 ? this.x + this.width : this.x,
      y: this.y + 2,
      width: this.vx > 0 ? 2 : 2,
      height: this.height - 4
    };
    for (const solid of solids) {
      if (aabbOverlap(horizCheck, solid)) {
        this.vx = -this.vx;
        this.facing = -this.facing;
        break;
      }
    }

    // Apply vertical movement and collide
    this.y += this.vy;
    for (const solid of solids) {
      resolveCollision(this, solid);
    }

    // Animation
    this.frameTimer++;
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.frame = (this.frame + 1) % 2;
    }
  }

  /** Draw the enemy */
  draw(engine) {
    const px = this.x - engine.camera.x;
    const py = this.y - engine.camera.y;

    if (this.squishTimer > 0) {
      // Draw squished
      const ctx = engine.ctx;
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(Math.round(px), Math.round(py + 16), this.width, 8);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(Math.round(px + 4), Math.round(py + 18), 4, 4);
      ctx.fillRect(Math.round(px + 18), Math.round(py + 18), 4, 4);
      return;
    }

    if (!this.alive) return;

    const ctx = engine.ctx;
    const drawX = Math.round(px);
    const drawY = Math.round(py);

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.scale(this.facing, 1);
    ctx.translate(-this.width / 2, -this.height / 2);

    // Body
    const squish = Math.sin(this.frame * Math.PI) * 2;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.ellipse(14, 14 - squish, 14, 10 + squish, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(6, 8 - squish, 6, 6);
    ctx.fillRect(16, 8 - squish, 6, 6);

    // Pupils (follow player a bit)
    ctx.fillStyle = '#000';
    ctx.fillRect(8, 10 - squish, 3, 4);
    ctx.fillRect(18, 10 - squish, 3, 4);

    ctx.restore();
  }

  /** Check if player stomps this enemy */
  checkStomp(player) {
    if (!this.alive) return false;

    const playerBottom = player.y + player.height;
    const stompZone = this.y + 4; // top part of enemy

    // Player must be falling and above enemy
    if (player.vy > 0 && playerBottom >= this.y && player.y < this.y + this.height / 2) {
      if (aabbOverlap(player.getHitbox(), this)) {
        this.stomped();
        return true;
      }
    }
    return false;
  }

  /** Handle being stomped */
  stomped() {
    this.alive = false;
    this.squishTimer = 40; // ~0.67 seconds before respawn
    this.y += 4;
  }

  /** Deal damage to player on contact */
  checkDamage(player) {
    if (!this.alive || this.squishTimer > 0) return false;
    if (player.invincible > 0) return false;

    if (aabbOverlap(player.getHitbox(), this)) {
      return true;
    }
    return false;
  }

  /** Respawn at start position */
  respawn() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = -1.2;
    this.vy = 0;
    this.alive = true;
    this.squishTimer = 0;
  }
}
