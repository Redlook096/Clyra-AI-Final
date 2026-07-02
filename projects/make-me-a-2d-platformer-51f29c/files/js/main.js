/**
 * Main Game Orchestrator
 * requestAnimationFrame loop, state machine, entity updates.
 */

// ── DOM references ──
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const victoryScreen = document.getElementById('victoryScreen');

// ── Game state ──
const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameover',
  VICTORY: 'victory'
};

let gameState = STATE.MENU;
let engine, input, player, currentLevel, levelIndex;
let enemies = [];
let items = [];
let hud;
let animFrameId = null;

// ── Particles (Phase 2 placeholder) ──
let particles = [];

// ── Initialize ──
function init() {
  engine = new Engine('gameCanvas');
  input = new InputManager();
  hud = new HUD();

  levelIndex = 0;
  loadLevel(levelIndex);

  hud.showStart();
  gameState = STATE.MENU;

  gameLoop();
}

// ── Load a level by index ──
function loadLevel(index) {
  const defs = [LEVEL_1, LEVEL_2];
  if (index >= defs.length) {
    gameState = STATE.VICTORY;
    hud.showVictory(player ? player.score : 0);
    return;
  }

  currentLevel = new Level(defs[index]);

  if (!player) {
    player = new Player(currentLevel.playerSpawn.x, currentLevel.playerSpawn.y);
  } else {
    player.x = currentLevel.playerSpawn.x;
    player.y = currentLevel.playerSpawn.y;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    player.canDoubleJump = false;
    player.hasDoubleJumped = false;
    player.alive = true;
    player.invincible = 60;
  }

  enemies = currentLevel.enemySpawns.map(sp => new Enemy(sp.x, sp.y, 'slime'));
  items = currentLevel.coins.map(c => new Item(c.x, c.y, 'coin'));
  particles = [];

// ── Spawn particles (dust, sparkle, death puff) ──
function spawnParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      color,
      size: 2 + Math.random() * 3
    });
  }
}

// ── Update game logic ──
function update() {
  if (gameState === STATE.MENU) {
    if (input.wasPressed('Space') || input.wasPressed('Enter')) {
      startGame();
    }
    return;
  }

  if (gameState === STATE.GAME_OVER) {
    if (input.wasPressed('Space') || input.wasPressed('Enter')) {
      startGame();
    }
    return;
  }

  if (gameState === STATE.VICTORY) {
    if (input.wasPressed('Space') || input.wasPressed('Enter')) {
      startGame();
    }
    return;
  }

  if (gameState !== STATE.PLAYING) return;

  // Player input & physics
  player.handleInput(input);
  applyGravity(player);
  player.updateAnimation();
  player.updateInvincibility();

  // Horizontal movement
  player.x += player.vx;
  const solids = currentLevel.getSolids();
  for (const solid of solids) {
    resolveCollision(player, solid);
  }

  // Vertical movement
  player.y += player.vy;
  player.grounded = false;
  for (const solid of solids) {
    resolveCollision(player, solid);
  }

  // Spike check
  if (currentLevel.isSpike(player.x, player.y, player.width, player.height)) {
    if (player.takeDamage()) {
      spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#e74c3c');
      if (!player.alive) { gameOver(); return; }
      player.x = currentLevel.playerSpawn.x;
      player.y = currentLevel.playerSpawn.y;
      player.vx = 0; player.vy = 0;
    }
  }

  // Enemies

// ── Render ──
function render() {
  engine.clear();

  if (gameState === STATE.MENU) return;

  if (gameState === STATE.PLAYING || gameState === STATE.GAME_OVER || gameState === STATE.VICTORY) {
    engine.follow(player, currentLevel.width, currentLevel.height);
    currentLevel.draw(engine);

    for (const item of items) item.draw(engine);
    for (const enemy of enemies) enemy.draw(engine);
    player.draw(engine);

    const ctx = engine.ctx;
    for (const p of particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        Math.round(p.x - engine.camera.x),
        Math.round(p.y - engine.camera.y),
        p.size, p.size
      );
    }
    ctx.globalAlpha = 1;
  }
}

// ── Game Loop ──
function gameLoop() {
  update();
  render();
  input.endFrame();
  animFrameId = requestAnimationFrame(gameLoop);
}

// ── Start game from menu / restart ──
function startGame() {
  if (!player) player = new Player(0, 0);
  player.fullReset();
  levelIndex = 0;
  loadLevel(levelIndex);
  hud.hideAll();
  hud.update(player, currentLevel.name);
  gameState = STATE.PLAYING;
}

// ── Game Over ──
function gameOver() {
  gameState = STATE.GAME_OVER;
  hud.showGameOver(player.score);
}

// ── Start ──
window.addEventListener('DOMContentLoaded', init);

  for (const enemy of enemies) {
    enemy.update(solids);

    if (enemy.checkStomp(player)) {
      player.vy = -7;
      player.score += 100;
      spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f1c40f');
      hud.update(player, currentLevel.name);
      continue;
    }

    if (enemy.checkDamage(player)) {
      if (player.takeDamage()) {
        spawnParticles(player.x + player.width / 2, player.y + player.height / 2, '#e74c3c');
        if (!player.alive) { gameOver(); return; }
        player.vx = player.facing * -5;
        player.vy = -5;
      }
    }
  }

  // Items (coins)
  const playerHitbox = player.getHitbox();
  for (const item of items) {
    item.update();
    if (!item.collected && item.checkPickup(playerHitbox)) {
      player.score += 50;
      player.coins++;
      spawnParticles(item.x + 8, item.y + 8, '#f1c40f', 6);
      hud.update(player, currentLevel.name);
    }
  }

  // Exit check
  if (currentLevel.checkExit(player.x, player.y, player.width, player.height)) {
    levelIndex++;
    loadLevel(levelIndex);
    hud.update(player, currentLevel.name);
    if (gameState === STATE.VICTORY) return;
  }

  // Fall off world
  if (player.y > currentLevel.height + 100) {
    if (player.takeDamage()) {
      if (!player.alive) { gameOver(); return; }
      player.x = currentLevel.playerSpawn.x;
      player.y = currentLevel.playerSpawn.y;
      player.vx = 0; player.vy = 0;
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  hud.update(player, currentLevel.name);
}

  hud.update(player, currentLevel.name);
}
