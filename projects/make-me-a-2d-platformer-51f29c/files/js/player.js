/**
 * Player Entity
 * Position, velocity, jumping (variable height + double-jump), animation.
 */
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 36;
    this.vx = 0;
    this.vy = 0;
    this.speed = 4.5;
    this.jumpForce = -10;
    this.grounded = false;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.facing = 1; // 1 = right, -1 = left

    // Animation
    this.frame = 0;
    this.frameTimer = 0;
    this.frameDuration = 8;
    this.state = 'idle'; // idle, run, jump, fall

    // Hitbox (slightly smaller than visual for forgiveness)
    this.hitbox = { x: 2, y: 0, width: 24, height: 34 };

    // Stats
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.alive = true;
    this.invincible = 0; // invincibility frames
    this.startX = x;
    this.startY = y;
  }

  /** Get the actual hitbox in world coords */
  getHitbox() {
    return {
      x: this.x + this.hitbox.x,
      y: this.y + this.hitbox.y,
      width: this.hitbox.width,
      height: this.hitbox.height
    };
  }

  /** Handle input each frame */
  handleInput(input) {
    if (!this.alive) return;

    // Horizontal movement
    let moveX = 0;
    if (input.isDown('ArrowLeft') || input.isDown('a') || input.isDown('A')) moveX = -1;
    if (input.isDown('ArrowRight') || input.isDown('d') || input.isDown('D')) moveX = 1;

    this.vx = moveX * this.speed;

    if (moveX !== 0) this.facing = moveX;

    // Jump
    const jumpKey = input.wasPressed('Space') || input.wasPressed('ArrowUp') || input.wasPressed('w') || input.wasPressed('W');

    if (jumpKey) {
      if (this.grounded) {
        this.vy = this.jumpForce;
        this.grounded = false;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;
      } else if (this.canDoubleJump && !this.hasDoubleJumped) {
        this.vy = this.jumpForce * 0.85;
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
      }
    }

    // Variable-height jump: release key cuts upward velocity
    if (!input.isDown('Space') && !input.isDown('ArrowUp') && !input.isDown('w') && !input.isDown('W')) {
      if (this.vy < -3) {
        this.vy = -3;
      }
    }
  }

  /** Update animation state */
  updateAnimation() {
    if (!this.grounded) {
      if (this.vy < 0) this.state = 'jump';
      else this.state = 'fall';
    } else if (Math.abs(this.vx) > 0.5) {
      this.state = 'run';
      this.frameTimer++;
      if (this.frameTimer >= this.frameDuration) {
        this.frameTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    } else {
      this.state = 'idle';
      this.frame = 0;
      this.frameTimer = 0;
    }
  }

  /** Update invincibility timer */
  updateInvincibility() {
    if (this.invincible > 0) this.invincible--;
  }

  /** Draw the player using programmatic pixel art */
  draw(engine) {
    if (!this.alive) return;

    // Flashing effect when invincible
    if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2 === 0) return;

    const ctx = engine.ctx;
    const sx = this.x;
    const sy = this.y;

    ctx.save();

    // Translate to player position with camera offset
    const drawX = Math.round(sx - engine.camera.x);
    const drawY = Math.round(sy - engine.camera.y);

    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.scale(this.facing, 1);
    ctx.translate(-this.width / 2, -this.height / 2);

    // Body (depends on state)
    const bodyColor = '#4a9eff';
    const darkColor = '#2a6fbf';
    const skinColor = '#ffcc88';

    // Legs
    if (this.state === 'run') {
      const legOffset = Math.sin(this.frame * Math.PI / 2) * 3;
      ctx.fillStyle = darkColor;
      ctx.fillRect(4, 26, 8, 10 + legOffset);
      ctx.fillRect(16, 26, 8, 10 - legOffset);
    } else if (this.state === 'jump') {
      ctx.fillStyle = darkColor;
      ctx.fillRect(4, 24, 8, 10);
      ctx.fillRect(16, 24, 8, 10);
    } else if (this.state === 'fall') {
      ctx.fillStyle = darkColor;
      ctx.fillRect(4, 26, 8, 8);
      ctx.fillRect(16, 26, 8, 8);
    } else {
      // Idle legs
      ctx.fillStyle = darkColor;
      ctx.fillRect(6, 26, 7, 10);
      ctx.fillRect(15, 26, 7, 10);
    }

    // Body / torso
    ctx.fillStyle = bodyColor;
    ctx.fillRect(4, 10, 20, 18);

    // Belt
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(4, 22, 20, 4);

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(6, 0, 16, 14);

    // Cap
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(4, 0, 20, 6);

    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(14, 5, 3, 3);

    // Mouth
    if (this.state === 'jump' || this.state === 'fall') {
      ctx.fillStyle = '#000';
      ctx.fillRect(14, 10, 4, 2);
    }

    ctx.restore();

    // Debug: draw hitbox outline (uncomment to debug)
    // const hb = this.getHitbox();
    // engine.strokeRect(hb.x, hb.y, hb.width, hb.height, '#ff0', 1);
  }

  /** Take damage */
  takeDamage() {
    if (this.invincible > 0) return false;
    this.lives--;
    this.invincible = 60; // 1 second at 60fps
    if (this.lives <= 0) {
      this.alive = false;
    }
    return true;
  }

  /** Reset player to spawn */
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.alive = true;
    this.invincible = 60;
    this.coins = 0;
  }

  /** Full reset including lives */
  fullReset() {
    this.reset();
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
  }
}
