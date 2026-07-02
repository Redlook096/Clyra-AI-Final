import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRAVITY, PLAYER_SPEED, PLAYER_ACCELERATION,
  PLAYER_FRICTION, JUMP_VELOCITY, JUMP_HOLD_VELOCITY, JUMP_HOLD_TIME, COYOTE_TIME,
  JUMP_BUFFER_TIME, MAX_FALL_SPEED, STOMP_BOUNCE, PLAYER_WIDTH, PLAYER_HEIGHT, MAX_LIVES, TILE
} from './constants';
import { resolveTileCollisions, aabbOverlap } from './collision';
import { getLevel, levelDataToGameLevel } from './level';
import type { LevelData } from './level';
import type { InputState } from './input';
import * as audio from './audio';
import type { Particle } from './particles';

export type EntityType = 'coin' | 'enemy' | 'checkpoint' | 'goal' | 'movingPlatform';

export interface Entity {
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  [key: string]: any;
}

export interface Level {
  grid: number[][];
  width: number;
  height: number;
  tileSize: number;
}

export interface Player {
  x: number; y: number; vx: number; vy: number;
  width: number; height: number;
  lives: number; score: number; coins: number;
  grounded: boolean;
  jumpBufferTimer: number; coyoteTimer: number; jumpHoldTimer: number;
  isJumping: boolean; facingRight: boolean;
  respawnX: number; respawnY: number;
  invincibleTimer: number;
  dying: boolean; deathTimer: number;
}

export type Screen = 'loading' | 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';

export interface Camera {
  x: number; y: number; targetX: number; targetY: number;
}

export interface GameState {
  screen: Screen;
  level: Level;
  levelData: LevelData;
  levelIndex: number;
  player: Player;
  camera: Camera;
  entities: Entity[];
  particles: Particle[];
  input: InputState;
  timer: number;
  combo: number;
  highScore: number;
  audioEnabled: boolean;
  loading: boolean;
  comboDisplayTimer: number;
  _showHowToPlay: boolean;
  _showSettings: boolean;
}

export function createPlayer(x: number, y: number): Player {
  return {
    x, y, vx: 0, vy: 0, width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
    lives: MAX_LIVES, score: 0, coins: 0,
    grounded: false, jumpBufferTimer: 0, coyoteTimer: 0, jumpHoldTimer: 0,
    isJumping: false, facingRight: true,
    respawnX: x, respawnY: y,
    invincibleTimer: 0, dying: false, deathTimer: 0,
  };
}

export function createInitialState(): GameState {
  const data = getLevel(0);
  const level = levelDataToGameLevel(data);
  const player = createPlayer(data.playerStart.x, data.playerStart.y);
  return {
    screen: 'menu', level, levelData: data, levelIndex: 0,
    player,
    camera: { x: 0, y: 0, targetX: 0, targetY: 0 },
    entities: [...data.coins, ...data.enemies, ...data.checkpoints, ...data.movingPlatforms],
    particles: [],
    input: { left: false, right: false, jump: false, jumpJustPressed: false, down: false, pause: false, pauseJustPressed: false, enter: false, enterJustPressed: false },
    timer: 0, combo: 0,
    highScore: parseInt(localStorage.getItem('platformerHighScore') || '0', 10),
    audioEnabled: true, loading: false, comboDisplayTimer: 0,
    _showHowToPlay: false, _showSettings: false,
  };
}

export function loadLevel(state: GameState, index: number): void {
  const data = getLevel(index);
  state.level = levelDataToGameLevel(data);
  state.levelData = data;
  state.levelIndex = index;
  state.player = createPlayer(data.playerStart.x, data.playerStart.y);
  state.entities = [
    ...data.coins.map((c: any) => ({ ...c })),
    ...data.enemies.map((e: any) => ({ ...e })),
    ...data.checkpoints.map((c: any) => ({ ...c })),
    ...data.movingPlatforms.map((m: any) => ({ ...m })),
  ];
  state.camera = { x: 0, y: 0, targetX: 0, targetY: 0 };
  state.timer = 0;
  state.particles = [];
  state.combo = 0;
  state.screen = 'playing';
}

export function respawnPlayer(state: GameState): void {
  const p = state.player;
  p.x = p.respawnX; p.y = p.respawnY;
  p.vx = 0; p.vy = 0;
  p.invincibleTimer = 1.5;
  p.dying = false; p.deathTimer = 0;
  p.grounded = false;
  for (const e of state.entities) {
    if (e.type === 'enemy' && !e.alive) {
      e.alive = true; e.collected = false;
      e.x = e.startX ?? e.x; e.y = e.startY ?? e.y;
    }
  }
}

export function killPlayer(state: GameState): void {
  const p = state.player;
  if (p.dying || p.invincibleTimer > 0) return;
  p.dying = true; p.deathTimer = 0; p.vy = -400;
  audio.playDeath();
}

export function updateGameState(state: GameState, dt: number): void {
  if (state.screen === 'playing') {
    updatePlaying(state, dt);
  }
}

function updatePlaying(state: GameState, dt: number): void {
  const p = state.player;
  const input = state.input;
  const level = state.level;
  const clampedDt = Math.min(dt, 0.05);

  state.timer += clampedDt;

  if (p.dying) {
    p.deathTimer += clampedDt;
    p.y += p.vy * clampedDt;
    if (Math.random() < 0.3) {
      state.particles.push(createParticle(
        p.x + p.width / 2 + (Math.random() - 0.5) * 20,
        p.y + p.height / 2 + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 200 - 100,
        0.4, '#ff2d78', 4
      ));
    }
    if (p.deathTimer > 1.0) {
      p.lives--;
      if (p.lives <= 0) {
        state.screen = 'gameOver';
        if (p.score > state.highScore) {
          state.highScore = p.score;
          localStorage.setItem('platformerHighScore', String(p.score));
        }
      } else {
        respawnPlayer(state);
      }
    }
    return;
  }

  if (p.invincibleTimer > 0) p.invincibleTimer -= clampedDt;
  p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - clampedDt);
  p.coyoteTimer = p.grounded ? COYOTE_TIME : Math.max(0, p.coyoteTimer - clampedDt);

  if (input.left) {
    p.vx -= PLAYER_ACCELERATION * clampedDt;
    p.facingRight = false;
  } else if (input.right) {
    p.vx += PLAYER_ACCELERATION * clampedDt;
    p.facingRight = true;
  } else {
    if (p.grounded) {
      p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), PLAYER_FRICTION * clampedDt);
    } else {
      p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), PLAYER_FRICTION * 0.3 * clampedDt);
    }
  }
  p.vx = Math.max(-PLAYER_SPEED, Math.min(PLAYER_SPEED, p.vx));
  if (Math.abs(p.vx) < 5) p.vx = 0;

  if (input.jumpJustPressed) p.jumpBufferTimer = JUMP_BUFFER_TIME;

  if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
    p.vy = JUMP_VELOCITY;
    p.grounded = false;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.isJumping = true;
    p.jumpHoldTimer = 0;
    audio.playJump();
    for (let i = 0; i < 5; i++) {
      state.particles.push(createParticle(
        p.x + Math.random() * p.width, p.y + p.height,
        (Math.random() - 0.5) * 60, -Math.random() * 40 - 20,
        0.3, '#8888cc', 3
      ));
    }
  }

  if (input.jump && p.isJumping && p.jumpHoldTimer < JUMP_HOLD_TIME) {
    p.vy = JUMP_HOLD_VELOCITY;
    p.jumpHoldTimer += clampedDt;
  }
  if (!input.jump) p.isJumping = false;
  if (!input.jump && p.vy < JUMP_VELOCITY * 0.5) p.vy *= 0.85;

  p.vy += GRAVITY * clampedDt;
  p.vy = Math.min(p.vy, MAX_FALL_SPEED);

  // Moving platforms
  for (const ent of state.entities) {
    if (ent.type === 'movingPlatform' && !ent.collected) {
      const phase = ent.phase ?? 0;
      const t = state.timer;
      let dx = 0, dy = 0;
      if (ent.moveAxis === 'vertical') {
        const offset = Math.sin(t * ent.moveSpeed * 0.02 + phase) * ent.moveRange;
        dy = offset - (ent._prevOffset ?? 0);
        ent._prevOffset = offset;
      } else {
        const offset = Math.sin(t * ent.moveSpeed * 0.02 + phase) * ent.moveRange;
        dx = offset - (ent._prevOffset ?? 0);
        ent._prevOffset = offset;
      }
      ent.x += dx || 0;
      ent.y += dy || 0;
      if (!p.dying && aabbOverlap(
        { x: p.x, y: p.y + p.height - 2, width: p.width, height: 4 },
        { x: ent.x, y: ent.y, width: ent.width, height: ent.height }
      ) && p.vy >= 0) {
        p.x += dx || 0;
        p.y += dy || 0;
      }
    }
  }

  // Tile collision
  const colResult = resolveTileCollisions(
    { x: p.x, y: p.y, width: p.width, height: p.height },
    p.vx * clampedDt, p.vy * clampedDt, level, true
  );
  p.x = colResult.x;
  p.y = colResult.y;
  if (colResult.collidesLeft || colResult.collidesRight) p.vx = 0;
  if (colResult.collidesBottom) {
    p.vy = 0;
    if (!p.grounded && Math.abs(p.vy) > 100) {
      for (let i = 0; i < 4; i++) {
        state.particles.push(createParticle(
          p.x + Math.random() * p.width, p.y + p.height,
          (Math.random() - 0.5) * 50, -Math.random() * 30, 0.25, '#7777bb', 3
        ));
      }
    }
    p.grounded = true;
    p.isJumping = false;
  }
  if (colResult.collidesTop) p.vy = 0;

  // Spike check
  const spikeX = Math.floor(p.x / TILE_SIZE);
  const spikeY = Math.floor((p.y + p.height) / TILE_SIZE);
  if (spikeY < level.height && spikeX < level.width) {
    if (level.grid[spikeY]?.[spikeX] === TILE.SPIKE) killPlayer(state);
  }

  if (p.y > level.height * TILE_SIZE + 100) killPlayer(state);

  const playerBox = { x: p.x, y: p.y, width: p.width, height: p.height };

  // Coin collection
  for (const coin of state.entities) {
    if (coin.type !== 'coin' || coin.collected) continue;
    if (aabbOverlap(playerBox, { x: coin.x, y: coin.y, width: coin.width, height: coin.height })) {
      coin.collected = true;
      p.score += 100;
      p.coins++;
      audio.playCoin();
      for (let i = 0; i < 8; i++) {
        state.particles.push(createParticle(
          coin.x + coin.width / 2, coin.y + coin.height / 2,
          (Math.random() - 0.5) * 150, (Math.random() - 0.5) * 150 - 50,
          0.5, '#ffd700', 3
        ));
      }
    }
  }

  // Enemy collisions
  for (const enemy of state.entities) {
    if (enemy.type !== 'enemy' || enemy.collected || !enemy.alive) continue;
    enemy.x += enemy.vx * clampedDt;
    if (enemy.x <= enemy.minX) { enemy.x = enemy.minX; enemy.vx = Math.abs(enemy.vx); }
    if (enemy.x + enemy.width >= enemy.maxX) { enemy.x = enemy.maxX - enemy.width; enemy.vx = -Math.abs(enemy.vx); }
    const eCol = resolveTileCollisions(
      { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height },
      enemy.vx * clampedDt, 0, level, false
    );
    enemy.x = eCol.x;
    if (aabbOverlap(playerBox, { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height })) {
      if (p.vy > 0 && p.y + p.height - enemy.y < 20) {
        enemy.alive = false;
        enemy.collected = true;
        p.vy = STOMP_BOUNCE;
        p.score += 200;
        audio.playStomp();
        for (let i = 0; i < 10; i++) {
          state.particles.push(createParticle(
            enemy.x + enemy.width / 2, enemy.y + enemy.height / 2,
            (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200 - 100,
            0.5, '#ff4444', 4
          ));
        }
      } else if (p.invincibleTimer <= 0 && !p.dying) {
        killPlayer(state);
      }
    }
  }

  // Checkpoints
  for (const cp of state.entities) {
    if (cp.type !== 'checkpoint' || cp.collected) continue;
    if (aabbOverlap(playerBox, { x: cp.x, y: cp.y, width: cp.width, height: cp.height })) {
      if (!cp.active) {
        cp.active = true;
        p.respawnX = cp.x;
        p.respawnY = cp.y;
        audio.playCheckpoint();
        for (let i = 0; i < 12; i++) {
          state.particles.push(createParticle(
            cp.x + cp.width / 2, cp.y + cp.height / 2,
            (Math.random() - 0.5) * 100, -Math.random() * 120 - 20,
            0.6, '#00ff88', 3
          ));
        }
      }
    }
  }

  // Goal
  const goal = state.levelData.goal;
  if (goal && !goal.collected) {
    if (aabbOverlap(playerBox, { x: goal.x, y: goal.y, width: goal.width, height: goal.height })) {
      goal.collected = true;
      p.score += p.lives * 500;
      audio.playLevelComplete();
      state.screen = 'levelComplete';
      if (p.score > state.highScore) {
        state.highScore = p.score;
        localStorage.setItem('platformerHighScore', String(p.score));
      }
    }
  }

  // Camera
  state.camera.x += ((p.x - CANVAS_WIDTH / 2 + p.width / 2) - state.camera.x) * 0.1;
  state.camera.y += ((p.y - CANVAS_HEIGHT / 2 + p.height / 2) - state.camera.y) * 0.1;
  state.camera.x = Math.max(0, Math.min(state.camera.x, level.width * TILE_SIZE - CANVAS_WIDTH));
  state.camera.y = Math.max(0, Math.min(state.camera.y, level.height * TILE_SIZE - CANVAS_HEIGHT));

  // Particles
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p2 = state.particles[i];
    p2.x += p2.vx * clampedDt;
    p2.y += p2.vy * clampedDt;
    p2.vy += 200 * clampedDt;
    p2.life -= clampedDt;
    if (p2.life <= 0) state.particles.splice(i, 1);
  }

  if (state.comboDisplayTimer > 0) state.comboDisplayTimer -= clampedDt;
}

export function createParticle(
  x: number, y: number, vx: number, vy: number, life: number,
  color: string, size: number
): Particle {
  return { x, y, vx, vy, life, maxLife: life, color, size };
}
