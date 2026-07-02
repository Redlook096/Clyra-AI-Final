// Rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, TILE, COLORS } from './constants';
import { TILE_COLORS } from './level';
import type { GameState, Entity, Player, Camera } from './game';
import type { Particle } from './particles';

export function render(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  switch (state.screen) {
    case 'loading': renderLoading(ctx); break;
    case 'menu': renderMenu(ctx, state); break;
    case 'playing':
    case 'paused':
      renderGame(ctx, state);
      if (state.screen === 'paused') renderPauseOverlay(ctx);
      break;
    case 'levelComplete':
      renderGame(ctx, state);
      renderLevelComplete(ctx, state);
      break;
    case 'gameOver':
      renderGame(ctx, state);
      renderGameOver(ctx, state);
      break;
  }
}

function renderLoading(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.BG;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Loading...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

function renderMenu(ctx: CanvasRenderingContext2D, state: GameState): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.5, '#15153a');
  gradient.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  for (let i = 0; i < 60; i++) {
    const sx = (i * 137.5 + 42) % CANVAS_WIDTH;
    const sy = (i * 97.3 + 13) % CANVAS_HEIGHT;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 7) / 10) + ')';
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.fillStyle = COLORS.PLAYER_BODY;
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = COLORS.PLAYER_BODY;
  ctx.shadowBlur = 20;
  ctx.fillText('PLATFORMER', CANVAS_WIDTH / 2, 180);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.GROUND;
  ctx.font = '18px monospace';
  ctx.fillText('A 2D Precision Platformer', CANVAS_WIDTH / 2, 215);
  if (state.highScore > 0) {
    ctx.fillStyle = COLORS.COIN;
    ctx.font = '14px monospace';
    ctx.fillText('High Score: ' + state.highScore, CANVAS_WIDTH / 2, 245);
  }
  renderMenuButton(ctx, 'PLAY', 320, true);
  renderMenuButton(ctx, 'HOW TO PLAY', 375, false);
  renderMenuButton(ctx, 'SETTINGS', 430, false);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '12px monospace';
  ctx.fillText('Arrow Keys / WASD to move  |  Space / Up to jump  |  ESC to pause', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  ctx.textAlign = 'left';
  ctx.fillText('Touch: Left side = move L/R', 20, CANVAS_HEIGHT - 20);
  ctx.fillText('Right side = move R', 20, CANVAS_HEIGHT - 8);
}

function renderMenuButton(ctx: CanvasRenderingContext2D, text: string, y: number, highlight: boolean): void {
  const bw = 260, bh = 46;
  const bx = CANVAS_WIDTH / 2 - bw / 2;
  ctx.textAlign = 'center';
  if (highlight) {
    ctx.fillStyle = COLORS.PLAYER_BODY;
    ctx.shadowColor = COLORS.PLAYER_BODY;
    ctx.shadowBlur = 15;
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.shadowBlur = 0;
  }
  ctx.beginPath();
  ctx.roundRect(bx, y, bw, bh, 8);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = highlight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = highlight ? '#ffffff' : 'rgba(255,255,255,0.7)';
  ctx.font = highlight ? 'bold 20px monospace' : '18px monospace';
  ctx.fillText(text, CANVAS_WIDTH / 2, y + 30);
}

// ===== GAME RENDERING =====

function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(0.6, '#0f0f2a');
  gradient.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  // Parallax background stars
  renderParallax(ctx, state);

  // Tile grid
  renderTileGrid(ctx, state);

  // Moving platforms
  for (const e of state.entities) {
    if (e.type === 'movingPlatform' && !e.collected) {
      renderMovingPlatform(ctx, e);
    }
  }

  // Entities (coins, enemies, checkpoints, goal)
  for (const e of state.entities) {
    if (e.type === 'coin' && !e.collected) renderCoin(ctx, e, state);
    if (e.type === 'enemy' && !e.collected && e.alive) renderEnemy(ctx, e, state);
    if (e.type === 'checkpoint') renderCheckpoint(ctx, e, state);
  }

  // Goal
  const goal = state.levelData.goal;
  if (goal && !goal.collected) renderGoal(ctx, goal, state);

  // Player
  if (!state.player.dying || (state.player.dying && state.player.deathTimer < 0.8)) {
    renderPlayer(ctx, state.player, state);
  }

  // Particles
  for (const p of state.particles) {
    renderParticle(ctx, p);
  }

  ctx.restore();

  // HUD (screen space, not world space)
  renderHUD(ctx, state);

  // How to play / settings overlays
  if (state.screen === 'playing' && state._showHowToPlay) {
    renderHowToPlay(ctx);
  }
  if (state.screen === 'playing' && state._showSettings) {
    renderSettingsOverlay(ctx, state);
  }
}

function renderParallax(ctx: CanvasRenderingContext2D, state: GameState): void {
  const cx = state.camera.x;
  const cy = state.camera.y;
  // Layer 1 - distant stars
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 30; i++) {
    const sx = (i * 137.5 + 42) % (CANVAS_WIDTH * 3) - cx * 0.1;
    const sy = (i * 97.3 + 13) % CANVAS_HEIGHT;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }
  // Layer 2 - mountains
  ctx.fillStyle = 'rgba(15,15,42,0.5)';
  ctx.beginPath();
  ctx.moveTo(0 - cx * 0.2, CANVAS_HEIGHT);
  for (let x = 0; x < CANVAS_WIDTH * 2; x += 20) {
    const my = CANVAS_HEIGHT - 80 - Math.sin((x + cx * 0.2) * 0.01) * 60 - Math.sin((x + cx * 0.2) * 0.025) * 30;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(CANVAS_WIDTH * 2, CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fill();
}

function renderTileGrid(ctx: CanvasRenderingContext2D, state: GameState): void {
  const level = state.level;
  const startX = Math.max(0, Math.floor(state.camera.x / TILE_SIZE) - 1);
  const endX = Math.min(level.width, Math.ceil((state.camera.x + CANVAS_WIDTH) / TILE_SIZE) + 1);
  const startY = Math.max(0, Math.floor(state.camera.y / TILE_SIZE) - 1);
  const endY = Math.min(level.height, Math.ceil((state.camera.y + CANVAS_HEIGHT) / TILE_SIZE) + 1);

  for (let ty = startY; ty < endY; ty++) {
    for (let tx = startX; tx < endX; tx++) {
      const tile = level.grid[ty]?.[tx];
      if (!tile || tile === TILE.EMPTY) continue;
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      
      if (tile === TILE.GROUND) {
        ctx.fillStyle = COLORS.GROUND;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = COLORS.GROUND_SHADOW;
        ctx.fillRect(x, y + TILE_SIZE - 3, TILE_SIZE, 3);
        // Top edge highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x, y, TILE_SIZE, 1);
      } else if (tile === TILE.PLATFORM) {
        ctx.fillStyle = COLORS.PLATFORM;
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x, y, TILE_SIZE, 2);
      } else if (tile === TILE.ONE_WAY) {
        ctx.fillStyle = COLORS.ONE_WAY;
        ctx.fillRect(x, y + TILE_SIZE - 6, TILE_SIZE, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x + 4 + i * 8, y + TILE_SIZE - 5, 4, 3);
        }
      } else if (tile === TILE.SPIKE) {
        ctx.fillStyle = COLORS.SPIKE;
        ctx.beginPath();
        const cx = x + TILE_SIZE / 2;
        ctx.moveTo(cx, y + 4);
        ctx.lineTo(x + 4, y + TILE_SIZE - 2);
        ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - 8, y + 4);
        ctx.lineTo(x, y + TILE_SIZE - 2);
        ctx.lineTo(x + 8, y + TILE_SIZE - 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 8, y + 4);
        ctx.lineTo(x + TILE_SIZE - 8, y + TILE_SIZE - 2);
        ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE - 2);
        ctx.closePath();
        ctx.fill();
      } else if (tile === TILE.WALL) {
        ctx.fillStyle = '#5555aa';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#444499';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
      } else if (tile === TILE.BRICK) {
        ctx.fillStyle = '#aa6644';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#885533';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE / 2, TILE_SIZE / 2);
        ctx.strokeRect(x + TILE_SIZE / 2, y, TILE_SIZE / 2, TILE_SIZE / 2);
        ctx.strokeRect(x + TILE_SIZE / 4, y + TILE_SIZE / 2, TILE_SIZE / 2, TILE_SIZE / 2);
      }
    }
  }
}

// ===== ENTITY RENDERING =====

function renderPlayer(ctx: CanvasRenderingContext2D, p: Player, state: GameState): void {
  const t = state.timer;
  const wobble = Math.sin(t * 6) * 1.5;

  ctx.save();
  if (p.invincibleTimer > 0 && Math.floor(p.invincibleTimer * 10) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  const px = p.x;
  const py = p.y + (p.grounded ? wobble : 0);

  // Body
  ctx.fillStyle = COLORS.PLAYER_BODY;
  ctx.shadowColor = COLORS.PLAYER_BODY;
  ctx.shadowBlur = 8;

  if (!p.grounded && p.vy < 0) {
    // Jump pose
    ctx.fillRect(px + 2, py, p.width - 4, 8); // body
    ctx.fillRect(px + 4, py + 8, p.width - 8, 14); // torso
    // Arms up
    ctx.fillRect(px - 2, py + 2, 6, 4);
    ctx.fillRect(px + p.width - 4, py + 2, 6, 4);
    // Legs
    if (p.facingRight) {
      ctx.fillRect(px + 2, py + 22, 8, 6);
      ctx.fillRect(px + 14, py + 22, 8, 6);
    } else {
      ctx.fillRect(px + 2, py + 22, 8, 6);
      ctx.fillRect(px + 14, py + 22, 8, 6);
    }
  } else if (!p.grounded && p.vy >= 0) {
    // Fall pose
    ctx.fillRect(px + 2, py, p.width - 4, 8);
    ctx.fillRect(px + 4, py + 8, p.width - 8, 14);
    ctx.fillRect(px + 6, py + 22, 6, 6);
    ctx.fillRect(px + 12, py + 22, 6, 6);
  } else {
    // Idle / run
    ctx.fillRect(px + 2, py, p.width - 4, 8);
    ctx.fillRect(px + 4, py + 8, p.width - 8, 14);
    // Legs
    const legOffset = Math.abs(p.vx) > 10 ? Math.sin(t * 12) * 3 : 0;
    ctx.fillRect(px + 3 + legOffset, py + 22, 7, 6);
    ctx.fillRect(px + 14 - legOffset, py + 22, 7, 6);
  }

  ctx.shadowBlur = 0;

  // Eyes
  ctx.fillStyle = '#ffffff';
  if (p.facingRight) {
    ctx.fillRect(px + 14, py + 3, 5, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(px + 16, py + 4, 2, 2);
  } else {
    ctx.fillRect(px + 5, py + 3, 5, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(px + 6, py + 4, 2, 2);
  }

  // Hat
  ctx.fillStyle = COLORS.PLAYER_OUTLINE;
  ctx.fillRect(px + 1, py - 4, p.width - 2, 6);

  ctx.restore();
}

function renderEnemy(ctx: CanvasRenderingContext2D, e: Entity, state: GameState): void {
  const t = state.timer;
  const wobble = Math.sin(t * 4 + e.x) * 1.5;
  const ex = e.x;
  const ey = e.y + wobble;

  // Body - mushroom-like shape
  ctx.fillStyle = COLORS.ENEMY_BODY;
  ctx.fillRect(ex + 3, ey + 10, e.width - 6, e.height - 10);
  ctx.fillRect(ex, ey + 4, e.width, 10);

  ctx.fillStyle = COLORS.ENEMY_OUTLINE;
  ctx.fillRect(ex + 2, ey + 4, e.width - 4, 3);

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ex + 5, ey + 6, 6, 5);
  ctx.fillRect(ex + e.width - 11, ey + 6, 6, 5);
  ctx.fillStyle = '#000000';
  ctx.fillRect(ex + 7, ey + 7, 3, 3);
  ctx.fillRect(ex + e.width - 8, ey + 7, 3, 3);

  // Feet
  const walkPhase = Math.sin(t * 6) * 2;
  ctx.fillStyle = COLORS.ENEMY_BODY;
  ctx.fillRect(ex + 2 + walkPhase, ey + e.height - 4, 8, 4);
  ctx.fillRect(ex + e.width - 10 - walkPhase, ey + e.height - 4, 8, 4);
}

function renderCoin(ctx: CanvasRenderingContext2D, c: Entity, state: GameState): void {
  const t = state.timer;
  const scale = 0.8 + Math.sin(t * 3 + c.x) * 0.2;
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, 1);

  // Outer circle
  ctx.fillStyle = COLORS.COIN;
  ctx.shadowColor = COLORS.COIN;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner detail
  ctx.fillStyle = COLORS.COIN_SHINE;
  ctx.beginPath();
  ctx.arc(-2, -2, 4, 0, Math.PI * 2);
  ctx.fill();

  // $ symbol
  ctx.fillStyle = '#996600';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 0);

  ctx.restore();
}

function renderCheckpoint(ctx: CanvasRenderingContext2D, cp: Entity, state: GameState): void {
  const active = cp.active;
  const t = state.timer;
  const glow = active ? Math.sin(t * 3) * 3 + 5 : 0;

  // Pole
  ctx.fillStyle = active ? '#00ff88' : '#666688';
  ctx.fillRect(cp.x + 6, cp.y, 4, cp.height);

  // Flag
  ctx.fillStyle = active ? '#00ff88' : '#555577';
  if (active) {
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = glow;
  }
  ctx.beginPath();
  ctx.moveTo(cp.x + 10, cp.y + 4);
  ctx.lineTo(cp.x + cp.width, cp.y + 12);
  ctx.lineTo(cp.x + 10, cp.y + 20);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // Base
  ctx.fillStyle = active ? '#00cc66' : '#555566';
  ctx.fillRect(cp.x + 2, cp.y + cp.height - 6, cp.width - 4, 6);
}

function renderGoal(ctx: CanvasRenderingContext2D, g: Entity, state: GameState): void {
  const t = state.timer;
  const pulse = Math.sin(t * 2) * 3 + 5;

  // Glow
  ctx.fillStyle = 'rgba(255,136,0,0.1)';
  ctx.shadowColor = COLORS.GOAL;
  ctx.shadowBlur = pulse;
  ctx.fillRect(g.x - 8, g.y - 8, g.width + 16, g.height + 16);
  ctx.shadowBlur = 0;

  // Pole
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(g.x + 10, g.y, 4, g.height);

  // Banner
  ctx.fillStyle = '#ffaa44';
  ctx.fillRect(g.x + 14, g.y + 4, g.width - 18, 18);
  ctx.fillStyle = '#ff8800';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GOAL', g.x + g.width / 2 + 2, g.y + 17);

  // Base
  ctx.fillStyle = '#cc6600';
  ctx.fillRect(g.x + 3, g.y + g.height - 6, g.width - 6, 6);
}

function renderMovingPlatform(ctx: CanvasRenderingContext2D, e: Entity): void {
  ctx.fillStyle = '#44ddff';
  ctx.fillRect(e.x, e.y, e.width, e.height);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(e.x + 4, e.y + 4, e.width - 8, 4);
  ctx.fillStyle = '#22aacc';
  ctx.fillRect(e.x + 2, e.y + e.height - 3, e.width - 4, 3);
}

function renderParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

// ===== HUD & OVERLAYS =====

function renderHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  const p = state.player;
  
  // Score
  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE: ' + p.score, 16, 28);
  
  // Coins
  ctx.fillStyle = COLORS.COIN;
  ctx.fillText('COINS: ' + p.coins, 16, 52);
  
  // Lives - drawn as hearts
  ctx.fillStyle = COLORS.PLAYER_BODY;
  for (let i = 0; i < p.lives; i++) {
    ctx.fillText('♥', 16 + i * 22, 76);
  }
  
  // Level timer
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.HUD_TEXT;
  ctx.font = '16px monospace';
  const mins = Math.floor(state.timer / 60);
  const secs = Math.floor(state.timer % 60);
  const timeStr = 'TIME: ' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  ctx.fillText(timeStr, CANVAS_WIDTH - 16, 28);
  
  // Level indicator
  ctx.fillText('LEVEL ' + (state.levelIndex + 1), CANVAS_WIDTH - 16, 52);
  
  // High score
  if (state.highScore > 0) {
    ctx.fillStyle = COLORS.COIN;
    ctx.font = '12px monospace';
    ctx.fillText('BEST: ' + state.highScore, CANVAS_WIDTH - 16, 72);
  }
  
  // Combo display
  if (state.comboDisplayTimer > 0 && state.combo > 1) {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.COIN;
    ctx.font = 'bold 28px monospace';
    ctx.shadowColor = COLORS.COIN;
    ctx.shadowBlur = 10;
    ctx.fillText(state.combo + 'x COMBO!', CANVAS_WIDTH / 2, 100);
    ctx.shadowBlur = 0;
  }
  
  ctx.textAlign = 'left';
}

function renderPauseOverlay(ctx: CanvasRenderingContext2D): void {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 40px monospace';
  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  ctx.font = '18px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  ctx.fillText('Press R to restart level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  ctx.fillText('Press Q to quit to menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

function renderLevelComplete(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.textAlign = 'center';
  
  // Title
  ctx.fillStyle = COLORS.COIN;
  ctx.font = 'bold 44px monospace';
  ctx.shadowColor = COLORS.COIN;
  ctx.shadowBlur = 20;
  ctx.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  ctx.shadowBlur = 0;
  
  // Stars
  const stars = state.player.lives >= 3 ? 3 : state.player.lives >= 2 ? 2 : 1;
  ctx.font = '30px monospace';
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < stars ? COLORS.STAR : COLORS.STAR_DIM;
    ctx.fillText('★', CANVAS_WIDTH / 2 - 40 + i * 40, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Score breakdown
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText('Score: ' + state.player.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  ctx.fillText('Coins: ' + state.player.coins, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  ctx.fillText('Lives Bonus: ' + (state.player.lives * 500), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  if (state.highScore > 0) {
    ctx.fillStyle = COLORS.COIN;
    ctx.font = '14px monospace';
    ctx.fillText('High Score: ' + state.highScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 115);
  }
  
  // Buttons
  const canNext = state.levelIndex < 2;
  renderMenuButton(ctx, canNext ? 'NEXT LEVEL' : 'MAIN MENU', CANVAS_HEIGHT / 2 + 150, true);
  renderMenuButton(ctx, 'RETRY', CANVAS_HEIGHT / 2 + 205, false);
}

function renderGameOver(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.textAlign = 'center';
  
  // Title
  ctx.fillStyle = COLORS.PLAYER_BODY;
  ctx.font = 'bold 48px monospace';
  ctx.shadowColor = COLORS.PLAYER_BODY;
  ctx.shadowBlur = 25;
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 70);
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '22px monospace';
  ctx.fillText('Final Score: ' + state.player.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  ctx.fillText('Coins Collected: ' + state.player.coins, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
  
  if (state.highScore > 0) {
    ctx.fillStyle = COLORS.COIN;
    ctx.font = '16px monospace';
    ctx.fillText('High Score: ' + state.highScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  }
  
  renderMenuButton(ctx, 'RETRY', CANVAS_HEIGHT / 2 + 110, true);
  renderMenuButton(ctx, 'MAIN MENU', CANVAS_HEIGHT / 2 + 165, false);
}

function renderHowToPlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(80, 80, CANVAS_WIDTH - 160, CANVAS_HEIGHT - 160);
  
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('HOW TO PLAY', CANVAS_WIDTH / 2, 130);
  
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  const lines = [
    'Arrow Keys / WASD - Move left/right',
    'Space / Up Arrow   - Jump',
    'Down Arrow / S     - Drop through platforms',
    '',
    'Jump on enemies to stomp them!',
    'Collect coins for points.',
    'Reach the orange goal flag to finish.',
    '',
    'Hold jump button for higher jumps.',
    'You have 3 lives - do not fall!',
    '',
    'ESC - Pause / Resume',
  ];
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 || i === 8 ? 'rgba(255,255,255,0.5)' : '#ffffff';
    ctx.fillText(line, 130, 170 + i * 28);
  });
  
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '14px monospace';
  ctx.fillText('Press any key to close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 130);
}

function renderSettingsOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(100, 100, CANVAS_WIDTH - 200, 300);
  
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('SETTINGS', CANVAS_WIDTH / 2, 150);
  
  ctx.font = '18px monospace';
  ctx.fillStyle = state.audioEnabled ? COLORS.GROUND : '#666666';
  ctx.fillText('Audio: ' + (state.audioEnabled ? 'ON' : 'OFF'), CANVAS_WIDTH / 2, 200);
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('Press A to toggle audio', CANVAS_WIDTH / 2, 240);
  ctx.fillText('Press ESC to close', CANVAS_WIDTH / 2, 280);
}
