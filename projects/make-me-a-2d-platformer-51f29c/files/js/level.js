/**
 * Level Data & Rendering
 * Defines tile types, level definitions, procedural generation,
 * and the Level class for drawing and collision queries.
 */

// ── Tile Constants ──
const TILE = {
  AIR: 0,
  GROUND: 1,
  BRICK: 2,
  PLATFORM: 3,
  SPIKE: 4,
  COIN: 5,
  ENEMY_SPAWN: 6,
  PLAYER_SPAWN: 7,
  EXIT: 8,
  DECOR: 9
};

const TILE_SIZE = 32;

// ── Seeded Random (mulberry32) ──
function seededRandom(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Level Definitions ──
const LEVEL_1_DEF = {
  name: 'Green Meadows',
  width: 80,
  height: 18,
  spawn: { x: 3, y: 14 },
  exit: { x: 75, y: 14 },
  groundColor: '#4a7c3f',
  brickColor: '#8B5E3C',
  platformColor: '#6B8E23',
  spikeColor: '#e74c3c',
  skyColor1: '#0f0f23',
  skyColor2: '#1a1a3e',
  seed: 42
};

const LEVEL_2_DEF = {
  name: 'Cave Depths',
  width: 90,
  height: 20,
  spawn: { x: 3, y: 16 },
  exit: { x: 85, y: 16 },
  groundColor: '#5a4a3a',
  brickColor: '#7a5a3a',
  platformColor: '#6a5a4a',
  spikeColor: '#ff4444',
  skyColor1: '#050505',
  skyColor2: '#1a1a1a',
  seed: 137
};


/**
 * Build a complete level data structure from a level definition.
 */
function buildLevelData(levelDef) {
  const W = levelDef.width;
  const H = levelDef.height;
  const rand = seededRandom(levelDef.seed);

  // Empty grid of AIR
  const grid = [];
  for (let y = 0; y < H; y++) {
    grid[y] = [];
    for (let x = 0; x < W; x++) {
      grid[y][x] = TILE.AIR;
    }
  }

  // Ground on last 2 rows
  for (let x = 0; x < W; x++) {
    grid[H - 2][x] = TILE.GROUND;
    grid[H - 1][x] = TILE.GROUND;
  }

  // Helper: place a rectangle of tiles
  function fillTileRect(tile, left, top, w, h) {
    for (let row = top; row < top + h && row < H; row++) {
      for (let col = left; col < left + w && col < W; col++) {
        grid[row][col] = tile;
      }
    }
  }

  // Helper: check if a grid cell is AIR (safe to place)
  function isAir(col, row) {
    if (col < 0 || col >= W || row < 0 || row >= H) return false;
    return grid[row][col] === TILE.AIR;
  }

  // ── 8 platform clusters (BRICK or PLATFORM) ──
  for (let i = 0; i < 8; i++) {
    const clusterWidth = 3 + Math.floor(rand() * 4);
    const clusterHeight = 1 + Math.floor(rand() * 3);
    const cx = 5 + Math.floor(rand() * (W - 10 - clusterWidth));
    const cy = 3 + Math.floor(rand() * (H - 7 - clusterHeight));
    const tileType = rand() < 0.5 ? TILE.BRICK : TILE.PLATFORM;

    // Base row
    fillTileRect(tileType, cx, cy, clusterWidth, 1);

    // Sometimes add extra rows (stairs)
    if (clusterHeight > 1) {
      const stairsUp = rand() < 0.5;
      for (let row = 1; row < clusterHeight; row++) {
        const stairWidth = clusterWidth - row;
        if (stairWidth > 0) {
          if (stairsUp) {
            fillTileRect(tileType, cx, cy + row, stairWidth, 1);
          } else {
            fillTileRect(tileType, cx + row, cy + row, stairWidth, 1);
          }
        }
      }
    }
  }

  // ── 6 floating single platforms ──
  for (let i = 0; i < 6; i++) {
    const px = 3 + Math.floor(rand() * (W - 6));
    const py = 3 + Math.floor(rand() * (H - 8));
    if (isAir(px, py) || isAir(px + 1, py)) {
      grid[py][px] = TILE.PLATFORM;
      if (px + 1 < W && isAir(px + 1, py)) {
        grid[py][px + 1] = TILE.PLATFORM;
      }
    }
  }

  // ── Coins on top of platforms and extra coins in air ──
  const coins = [];

  // Place coins on top of solid tiles (BRICK, PLATFORM, GROUND)
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H - 1; y++) {
      const tile = grid[y][x];
      if ((tile === TILE.BRICK || tile === TILE.PLATFORM) && y > 0 && grid[y - 1][x] === TILE.AIR) {
        if (rand() < 0.4) {
          coins.push({ x: x * TILE_SIZE, y: (y - 1) * TILE_SIZE });
        }
      }
    }
  }

  // Extra coins floating in air in open areas
  for (let i = 0; i < 15; i++) {
    const cx = 2 + Math.floor(rand() * (W - 4));
    const cy = 3 + Math.floor(rand() * (H - 6));
    if (isAir(cx, cy)) {
      coins.push({ x: cx * TILE_SIZE, y: cy * TILE_SIZE });
    }
  }

  // ── Spikes in gaps ──
  for (let x = 1; x < W - 1; x++) {
    const aboveGround = H - 3;
    if (grid[aboveGround][x] === TILE.AIR &&
        grid[aboveGround + 1][x] === TILE.GROUND) {
      if (rand() < 0.35) {
        grid[aboveGround][x] = TILE.SPIKE;
      }
    }
  }

  // Also place some spikes on ledges
  for (let i = 0; i < 5; i++) {
    const sx = 4 + Math.floor(rand() * (W - 8));
    const sy = 5 + Math.floor(rand() * (H - 8));
    if (grid[sy][sx] === TILE.AIR && sy > 0 && grid[sy - 1][sx] !== TILE.AIR) {
      for (let row = sy; row < H - 2; row++) {
        if (grid[row][sx] !== TILE.AIR) {
          if (row > 0 && isAir(row - 1, sx)) {
            grid[row - 1][sx] = TILE.SPIKE;
          }
          break;
        }
      }
    }
  }

  // ── Enemy spawns (5 on ground level) ──
  const enemySpawns = [];
  let enemyCount = 0;
  let attempts = 0;
  while (enemyCount < 5 && attempts < 50) {
    attempts++;
    const ex = 5 + Math.floor(rand() * (W - 10));
    const ey = H - 3;
    if (grid[ey][ex] === TILE.AIR && grid[ey + 1][ex] === TILE.GROUND) {
      const distFromSpawn = Math.abs(ex - levelDef.spawn.x);
      if (distFromSpawn > 5) {
        enemySpawns.push({ x: ex * TILE_SIZE, y: ey * TILE_SIZE });
        grid[ey][ex] = TILE.ENEMY_SPAWN;
        enemyCount++;
      }
    }
  }

  // ── Player spawn ──
  const spawnX = levelDef.spawn.x;
  const spawnY = levelDef.spawn.y;
  grid[spawnY][spawnX] = TILE.PLAYER_SPAWN;
  const playerSpawn = { x: spawnX * TILE_SIZE, y: spawnY * TILE_SIZE };

  // Make sure the ground is solid where player spawns
  if (spawnY + 1 < H) {
    grid[spawnY + 1][spawnX] = TILE.GROUND;
    if (spawnX + 1 < W) grid[spawnY + 1][spawnX + 1] = TILE.GROUND;
  }

  // ── Exit ──
  const exitX = levelDef.exit.x;
  const exitY = levelDef.exit.y;
  grid[exitY][exitX] = TILE.EXIT;
  const exitPos = {
    x: exitX * TILE_SIZE,
    y: exitY * TILE_SIZE,
    width: TILE_SIZE,
    height: TILE_SIZE * 2
  };

  // Ensure ground under exit
  if (exitY + 1 < H) {
    if (grid[exitY + 1][exitX] === TILE.AIR) {
      grid[exitY + 1][exitX] = TILE.GROUND;
    }
  }

  // ── Build solids array (for collision) ──
  const solids = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const tile = grid[y][x];
      if (tile === TILE.GROUND || tile === TILE.BRICK || tile === TILE.PLATFORM) {
        solids.push({
          x: x * TILE_SIZE,
          y: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE
        });
      }
    }
  }

  return {
    grid,
    solids,
    coins,
    enemySpawns,
    playerSpawn,
    exitPos,
    width: W * TILE_SIZE,
    height: H * TILE_SIZE,
    name: levelDef.name,
    groundColor: levelDef.groundColor,
    brickColor: levelDef.brickColor,
    platformColor: levelDef.platformColor,
    spikeColor: levelDef.spikeColor,
    skyColor1: levelDef.skyColor1,
    skyColor2: levelDef.skyColor2
  };
}

// ── Pre-build level data ──
const LEVEL_1 = buildLevelData(LEVEL_1_DEF);
const LEVEL_2 = buildLevelData(LEVEL_2_DEF);

// ── Level Class ──
class Level {
  constructor(levelDef) {
    if (levelDef.grid) {
      Object.assign(this, levelDef);
    } else {
      const data = buildLevelData(levelDef);
      Object.assign(this, data);
    }
  }

  draw(engine) {
    const ctx = engine.ctx;
    const cam = engine.camera;

    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, engine.height);
    gradient.addColorStop(0, this.skyColor1);
    gradient.addColorStop(1, this.skyColor2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, engine.width, engine.height);

    // Visible tile range
    const startCol = Math.max(0, Math.floor(cam.x / TILE_SIZE));
    const endCol = Math.min(this.grid[0].length - 1, Math.ceil((cam.x + engine.width) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(cam.y / TILE_SIZE));
    const endRow = Math.min(this.grid.length - 1, Math.ceil((cam.y + engine.height) / TILE_SIZE));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = this.grid[row][col];
        if (tile === TILE.AIR) continue;

        const px = col * TILE_SIZE;
        const py = row * TILE_SIZE;
        const screenX = Math.round(px - cam.x);
        const screenY = Math.round(py - cam.y);

        switch (tile) {
          case TILE.GROUND: {
            ctx.fillStyle = this.groundColor;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            if (row > 0 && this.grid[row - 1][col] !== TILE.GROUND) {
              ctx.fillStyle = '#5a9e4f';
              ctx.fillRect(screenX, screenY, TILE_SIZE, 4);
              ctx.fillStyle = '#3d7a33';
              ctx.fillRect(screenX + 4, screenY + 1, 2, 2);
              ctx.fillRect(screenX + 12, screenY + 2, 2, 2);
              ctx.fillRect(screenX + 22, screenY + 1, 2, 2);
              ctx.fillRect(screenX + 8, screenY + 3, 2, 1);
              ctx.fillRect(screenX + 18, screenY + 3, 2, 1);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(screenX + 6, screenY + 10, 4, 4);
            ctx.fillRect(screenX + 20, screenY + 18, 3, 3);
            ctx.fillRect(screenX + 2, screenY + 24, 5, 2);
            break;
          }

          case TILE.BRICK: {
            ctx.fillStyle = this.brickColor;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#5a3a1a';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#6a4a2a';
            ctx.fillRect(screenX + 2, screenY + 2, 13, 12);
            ctx.fillRect(screenX + 17, screenY + 2, 13, 12);
            ctx.fillRect(screenX + 9, screenY + 16, 13, 12);
            ctx.fillRect(screenX + 2, screenY + 16, 6, 12);
            ctx.fillRect(screenX + 23, screenY + 16, 7, 12);
            break;
          }

          case TILE.PLATFORM: {
            ctx.fillStyle = this.platformColor;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#a0c040';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255,255,200,0.15)';
            ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 4);
            ctx.fillStyle = '#8aaa30';
            ctx.fillRect(screenX + 6, screenY + 6, 3, 3);
            ctx.fillRect(screenX + 22, screenY + 6, 3, 3);
            ctx.fillRect(screenX + 6, screenY + 22, 3, 3);
            ctx.fillRect(screenX + 22, screenY + 22, 3, 3);
            break;
          }
          case TILE.SPIKE: {
            ctx.fillStyle = this.spikeColor;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY + TILE_SIZE);
            ctx.lineTo(screenX + TILE_SIZE / 2, screenY);
            ctx.lineTo(screenX + TILE_SIZE, screenY + TILE_SIZE);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(screenX + TILE_SIZE / 2 - 4, screenY + 4);
            ctx.lineTo(screenX + TILE_SIZE / 2, screenY + 1);
            ctx.lineTo(screenX + TILE_SIZE / 2 + 4, screenY + 4);
            ctx.closePath();
            ctx.fill();
            break;
          }

          case TILE.EXIT: {
            const doorHeight = TILE_SIZE * 2;
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, screenY, TILE_SIZE, doorHeight);
            ctx.fillStyle = '#DAA520';
            ctx.fillRect(screenX + 3, screenY + 3, TILE_SIZE - 6, doorHeight - 6);
            ctx.fillStyle = '#B8860B';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + 8, TILE_SIZE / 2 - 4, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE * 0.7, screenY + doorHeight / 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
            ctx.fillRect(screenX - 4, screenY - 4, TILE_SIZE + 8, doorHeight + 8);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
            ctx.fillRect(screenX - 8, screenY - 8, TILE_SIZE + 16, doorHeight + 16);
            break;
          }

          case TILE.COIN: {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case TILE.DECOR: {
            ctx.fillStyle = this.brickColor;
            ctx.globalAlpha = 0.4;
            ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1;
            break;
          }
        }
      }
    }
  }

  getSolids() {
    return this.solids;
  }

  isSpike(x, y, w, h) {
    const startCol = Math.max(0, Math.floor(x / TILE_SIZE));
    const endCol = Math.min(this.grid[0].length - 1, Math.floor((x + w) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(y / TILE_SIZE));
    const endRow = Math.min(this.grid.length - 1, Math.floor((y + h) / TILE_SIZE));

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (this.grid[row][col] === TILE.SPIKE) {
          const spikeRect = {
            x: col * TILE_SIZE,
            y: row * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE
          };
          if (aabbOverlap({ x, y, width: w, height: h }, spikeRect)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkExit(x, y, w, h) {
    return aabbOverlap(
      { x, y, width: w, height: h },
      this.exitPos
    );
  }
}


