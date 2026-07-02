import { TILE, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants';
import type { Level, Entity, EntityType } from './game';

// Tile type to color mapping
export const TILE_COLORS: Record<number, string> = {
  [TILE.GROUND]: COLORS.GROUND,
  [TILE.PLATFORM]: COLORS.PLATFORM,
  [TILE.ONE_WAY]: COLORS.ONE_WAY,
  [TILE.SPIKE]: COLORS.SPIKE,
  [TILE.WALL]: '#5555aa',
  [TILE.BRICK]: '#aa6644',
  [TILE.SECRET]: '#ff8800',
};

export interface LevelData {
  width: number;
  height: number;
  grid: number[][];
  coins: Entity[];
  enemies: Entity[];
  checkpoints: Entity[];
  goal: Entity | null;
  movingPlatforms: Entity[];
  playerStart: { x: number; y: number };
}

function ent(type: EntityType, x: number, y: number, w: number, h: number, props: Record<string, any> = {}): Entity {
  return { type, x, y, width: w, height: h, collected: false, ...props };
}

// ========== LEVEL 1 ===========
function buildLevel1(): LevelData {
  const w = 60;
  const h = 20;
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(TILE.EMPTY));
  const coins: Entity[] = [];
  const enemies: Entity[] = [];
  const checkpoints: Entity[] = [];
  let goal: Entity | null = null;
  const movingPlatforms: Entity[] = [];

  // Ground
  for (let x = 0; x < w; x++) {
    grid[h - 1][x] = TILE.GROUND;
    grid[h - 2][x] = TILE.GROUND;
  }

  // Starting platforms
  for (let x = 5; x <= 10; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 14; x <= 20; x++) grid[h - 5][x] = TILE.PLATFORM;
  for (let x = 22; x <= 26; x++) grid[h - 3][x] = TILE.PLATFORM;

  // Wall climb
  for (let y = h - 6; y < h; y++) grid[y][28] = TILE.WALL;
  grid[h - 3][29] = TILE.PLATFORM;
  grid[h - 6][30] = TILE.PLATFORM;

  // Gap
  for (let x = 32; x <= 34; x++) {
    grid[h - 1][x] = TILE.EMPTY;
    grid[h - 2][x] = TILE.EMPTY;
  }
  grid[h - 3][32] = TILE.PLATFORM;
  grid[h - 4][33] = TILE.PLATFORM;
  grid[h - 3][34] = TILE.PLATFORM;

  // Post-gap platforms
  for (let x = 37; x <= 44; x++) grid[h - 4][x] = TILE.PLATFORM;
  grid[h - 3][38] = TILE.PLATFORM;
  grid[h - 3][42] = TILE.PLATFORM;

  // One-way platforms
  for (let x = 40; x <= 45; x++) grid[h - 6][x] = TILE.ONE_WAY;

  // Staircase
  for (let i = 0; i < 5; i++) {
    for (let x = 48 + i; x <= 48 + i + 2; x++) {
      grid[h - 4 - i][x] = TILE.PLATFORM;
    }
  }

  // Final platform to goal
  for (let x = 55; x <= 58; x++) grid[h - 5][x] = TILE.PLATFORM;

  // Coins
  coins.push(
    ent('coin', 7 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 8 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 9 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 16 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16),
    ent('coin', 17 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16),
    ent('coin', 18 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16),
    ent('coin', 24 * TILE_SIZE, (h - 4) * TILE_SIZE - 16, 16, 16),
    ent('coin', 25 * TILE_SIZE, (h - 4) * TILE_SIZE - 16, 16, 16),
    ent('coin', 33 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 34 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 40 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
    ent('coin', 42 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
    ent('coin', 44 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
    ent('coin', 50 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 52 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16),
    ent('coin', 54 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
  );

  // Enemies
  enemies.push(
    ent('enemy', 10 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: 60, minX: 8 * TILE_SIZE, maxX: 12 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 18 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: -60, minX: 15 * TILE_SIZE, maxX: 20 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 38 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: 60, minX: 36 * TILE_SIZE, maxX: 42 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 43 * TILE_SIZE, (h - 5) * TILE_SIZE - 28, 28, 24, { vx: -40, minX: 40 * TILE_SIZE, maxX: 45 * TILE_SIZE, alive: true, patrolTimer: 0 }),
  );

  // Checkpoints
  checkpoints.push(
    ent('checkpoint', 15 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 36 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 48 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
  );

  // Goal
  goal = ent('goal', 57 * TILE_SIZE, (h - 6) * TILE_SIZE - 48, 24, 48);

  return { width: w, height: h, grid, coins, enemies, checkpoints, goal, movingPlatforms, playerStart: { x: 2 * TILE_SIZE, y: (h - 3) * TILE_SIZE - 32 } };
}

// ========== LEVEL 2 ===========
function buildLevel2(): LevelData {
  const w = 80;
  const h = 24;
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(TILE.EMPTY));
  const coins: Entity[] = [];
  const enemies: Entity[] = [];
  const checkpoints: Entity[] = [];
  let goal: Entity | null = null;
  const movingPlatforms: Entity[] = [];
  for (let x = 0; x < w; x++) { grid[h - 1][x] = TILE.GROUND; grid[h - 2][x] = TILE.GROUND; }
  for (let y = h - 6; y < h; y++) grid[y][6] = TILE.WALL;
  for (let x = 4; x <= 8; x++) grid[h - 6][x] = TILE.PLATFORM;
  for (let x = 12; x <= 18; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 14; x <= 20; x++) grid[h - 8][x] = TILE.ONE_WAY;
  for (let x = 20; x <= 23; x++) { grid[h - 1][x] = TILE.EMPTY; grid[h - 2][x] = TILE.EMPTY; }
  for (let x = 20; x <= 23; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 26; x <= 28; x++) { grid[h - 1][x] = TILE.SPIKE; grid[h - 2][x] = TILE.EMPTY; }
  for (let x = 29; x <= 33; x++) grid[h - 3][x] = TILE.PLATFORM;
  for (let y = h - 8; y < h; y++) grid[y][35] = TILE.WALL;
  for (let x = 34; x <= 36; x++) grid[h - 8][x] = TILE.PLATFORM;
  for (let x = 33; x <= 37; x++) grid[h - 12][x] = TILE.PLATFORM;
  for (let x = 40; x <= 55; x++) grid[h - 3][x] = TILE.PLATFORM;
  for (let x = 50; x <= 54; x++) grid[h - 6][x] = TILE.PLATFORM;
  for (let x = 48; x <= 52; x++) grid[h - 9][x] = TILE.PLATFORM;
  for (let x = 54; x <= 58; x++) grid[h - 11][x] = TILE.ONE_WAY;
  for (let i = 0; i < 6; i++) { for (let x = 60 + i; x <= 60 + i + 2; x++) grid[h - 4 - i][x] = TILE.PLATFORM; }
  for (let x = 70; x <= 78; x++) grid[h - 7][x] = TILE.PLATFORM;
  movingPlatforms.push(
    ent('movingPlatform', 40 * TILE_SIZE, (h - 6) * TILE_SIZE, 48, 16, { moveAxis: 'vertical', moveRange: 80, moveSpeed: 40, startX: 40 * TILE_SIZE, startY: (h - 6) * TILE_SIZE, phase: 0 }),
    ent('movingPlatform', 55 * TILE_SIZE, (h - 8) * TILE_SIZE, 48, 16, { moveAxis: 'vertical', moveRange: 64, moveSpeed: 50, startX: 55 * TILE_SIZE, startY: (h - 8) * TILE_SIZE, phase: Math.PI }),
  );
  coins.push(
    ent('coin', 14 * TILE_SIZE, (h - 9) * TILE_SIZE - 16, 16, 16), ent('coin', 16 * TILE_SIZE, (h - 9) * TILE_SIZE - 16, 16, 16),
    ent('coin', 18 * TILE_SIZE, (h - 9) * TILE_SIZE - 16, 16, 16), ent('coin', 21 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 22 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16), ent('coin', 30 * TILE_SIZE, (h - 4) * TILE_SIZE - 16, 16, 16),
    ent('coin', 34 * TILE_SIZE, (h - 9) * TILE_SIZE - 16, 16, 16), ent('coin', 36 * TILE_SIZE, (h - 9) * TILE_SIZE - 16, 16, 16),
    ent('coin', 44 * TILE_SIZE, (h - 4) * TILE_SIZE - 16, 16, 16), ent('coin', 52 * TILE_SIZE, (h - 10) * TILE_SIZE - 16, 16, 16),
    ent('coin', 56 * TILE_SIZE, (h - 12) * TILE_SIZE - 16, 16, 16), ent('coin', 62 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 66 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16), ent('coin', 72 * TILE_SIZE, (h - 8) * TILE_SIZE - 16, 16, 16),
    ent('coin', 75 * TILE_SIZE, (h - 8) * TILE_SIZE - 16, 16, 16),
  );
  enemies.push(
    ent('enemy', 8 * TILE_SIZE, (h - 3) * TILE_SIZE - 28, 28, 24, { vx: 50, minX: 4 * TILE_SIZE, maxX: 10 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 16 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: -50, minX: 13 * TILE_SIZE, maxX: 20 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 30 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: 60, minX: 27 * TILE_SIZE, maxX: 33 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 42 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: -55, minX: 38 * TILE_SIZE, maxX: 48 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 52 * TILE_SIZE, (h - 7) * TILE_SIZE - 28, 28, 24, { vx: 40, minX: 49 * TILE_SIZE, maxX: 55 * TILE_SIZE, alive: true, patrolTimer: 0 }),
  );
  checkpoints.push(
    ent('checkpoint', 12 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 30 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 44 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 60 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
  );
  goal = ent('goal', 76 * TILE_SIZE, (h - 8) * TILE_SIZE - 48, 24, 48);
  return { width: w, height: h, grid, coins, enemies, checkpoints, goal, movingPlatforms, playerStart: { x: 2 * TILE_SIZE, y: (h - 3) * TILE_SIZE - 32 } };
}

// ========== LEVEL 3 ===========
function buildLevel3(): LevelData {
  const w = 100;
  const h = 28;
  const grid: number[][] = Array.from({ length: h }, () => Array(w).fill(TILE.EMPTY));
  const coins: Entity[] = [];
  const enemies: Entity[] = [];
  const checkpoints: Entity[] = [];
  let goal: Entity | null = null;
  const movingPlatforms: Entity[] = [];
  for (let x = 0; x < w; x++) { grid[h - 1][x] = TILE.GROUND; grid[h - 2][x] = TILE.GROUND; }
  for (let x = 2; x <= 8; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 10; x <= 12; x++) { grid[h - 1][x] = TILE.EMPTY; grid[h - 2][x] = TILE.EMPTY; }
  for (let x = 10; x <= 12; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 15; x <= 17; x++) { grid[h - 1][x] = TILE.SPIKE; grid[h - 2][x] = TILE.EMPTY; }
  grid[h - 4][14] = TILE.PLATFORM; grid[h - 5][16] = TILE.PLATFORM; grid[h - 4][18] = TILE.PLATFORM;
  for (let y = h - 10; y < h; y++) grid[y][20] = TILE.WALL;
  for (let x = 18; x <= 22; x++) grid[h - 5][x] = TILE.PLATFORM;
  for (let x = 19; x <= 23; x++) grid[h - 10][x] = TILE.PLATFORM;
  for (let x = 25; x <= 35; x++) grid[h - 3][x] = TILE.PLATFORM;
  for (let x = 38; x <= 45; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 48; x <= 55; x++) grid[h - 5][x] = TILE.PLATFORM;
  for (let y = h - 14; y < h; y++) grid[y][50] = TILE.WALL;
  for (let x = 48; x <= 52; x++) grid[h - 14][x] = TILE.PLATFORM;
  for (let x = 55; x <= 62; x++) grid[h - 7][x] = TILE.ONE_WAY;
  for (let x = 58; x <= 65; x++) grid[h - 10][x] = TILE.ONE_WAY;
  for (let x = 62; x <= 68; x++) grid[h - 13][x] = TILE.ONE_WAY;
  for (let x = 70; x <= 73; x++) grid[h - 4][x] = TILE.PLATFORM;
  for (let x = 72; x <= 75; x++) grid[h - 6][x] = TILE.PLATFORM;
  for (let x = 74; x <= 77; x++) grid[h - 8][x] = TILE.PLATFORM;
  for (let x = 76; x <= 79; x++) grid[h - 10][x] = TILE.PLATFORM;
  for (let x = 78; x <= 81; x++) grid[h - 12][x] = TILE.PLATFORM;
  for (let x = 80; x <= 83; x++) grid[h - 14][x] = TILE.PLATFORM;
  for (let x = 85; x <= 98; x++) grid[h - 6][x] = TILE.PLATFORM;
  movingPlatforms.push(
    ent('movingPlatform', 26 * TILE_SIZE, (h - 6) * TILE_SIZE, 48, 16, { moveAxis: 'vertical', moveRange: 96, moveSpeed: 40, startX: 26 * TILE_SIZE, startY: (h - 6) * TILE_SIZE, phase: 0 }),
    ent('movingPlatform', 34 * TILE_SIZE, (h - 7) * TILE_SIZE, 48, 16, { moveAxis: 'horizontal', moveRange: 64, moveSpeed: 35, startX: 34 * TILE_SIZE, startY: (h - 7) * TILE_SIZE, phase: 0 }),
    ent('movingPlatform', 56 * TILE_SIZE, (h - 12) * TILE_SIZE, 48, 16, { moveAxis: 'vertical', moveRange: 80, moveSpeed: 45, startX: 56 * TILE_SIZE, startY: (h - 12) * TILE_SIZE, phase: Math.PI }),
  );
  coins.push(
    ent('coin', 4 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16), ent('coin', 6 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 11 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16), ent('coin', 16 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16),
    ent('coin', 21 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16), ent('coin', 22 * TILE_SIZE, (h - 6) * TILE_SIZE - 16, 16, 16),
    ent('coin', 28 * TILE_SIZE, (h - 4) * TILE_SIZE - 16, 16, 16), ent('coin', 30 * TILE_SIZE, (h - 4) * TILE_SIZE - 16, 16, 16),
    ent('coin', 40 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16), ent('coin', 42 * TILE_SIZE, (h - 5) * TILE_SIZE - 16, 16, 16),
    ent('coin', 50 * TILE_SIZE, (h - 15) * TILE_SIZE - 16, 16, 16), ent('coin', 52 * TILE_SIZE, (h - 15) * TILE_SIZE - 16, 16, 16),
    ent('coin', 60 * TILE_SIZE, (h - 8) * TILE_SIZE - 16, 16, 16), ent('coin', 64 * TILE_SIZE, (h - 11) * TILE_SIZE - 16, 16, 16),
    ent('coin', 68 * TILE_SIZE, (h - 14) * TILE_SIZE - 16, 16, 16), ent('coin', 72 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
    ent('coin', 76 * TILE_SIZE, (h - 11) * TILE_SIZE - 16, 16, 16), ent('coin', 78 * TILE_SIZE, (h - 13) * TILE_SIZE - 16, 16, 16),
    ent('coin', 82 * TILE_SIZE, (h - 15) * TILE_SIZE - 16, 16, 16), ent('coin', 90 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
    ent('coin', 95 * TILE_SIZE, (h - 7) * TILE_SIZE - 16, 16, 16),
  );
  enemies.push(
    ent('enemy', 6 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: 40, minX: 3 * TILE_SIZE, maxX: 9 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 28 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: -60, minX: 24 * TILE_SIZE, maxX: 32 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 32 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: 50, minX: 28 * TILE_SIZE, maxX: 36 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 42 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: -55, minX: 38 * TILE_SIZE, maxX: 46 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 50 * TILE_SIZE, (h - 3) * TILE_SIZE - 28, 28, 24, { vx: 45, minX: 47 * TILE_SIZE, maxX: 53 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 72 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: -50, minX: 68 * TILE_SIZE, maxX: 76 * TILE_SIZE, alive: true, patrolTimer: 0 }),
    ent('enemy', 88 * TILE_SIZE, (h - 2) * TILE_SIZE - 28, 28, 24, { vx: 60, minX: 85 * TILE_SIZE, maxX: 95 * TILE_SIZE, alive: true, patrolTimer: 0 }),
  );
  checkpoints.push(
    ent('checkpoint', 8 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 22 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 38 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 55 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 75 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
    ent('checkpoint', 88 * TILE_SIZE, (h - 2) * TILE_SIZE - 40, 16, 40, { active: false }),
  );
  goal = ent('goal', 96 * TILE_SIZE, (h - 7) * TILE_SIZE - 48, 24, 48);
  return { width: w, height: h, grid, coins, enemies, checkpoints, goal, movingPlatforms, playerStart: { x: 2 * TILE_SIZE, y: (h - 3) * TILE_SIZE - 32 } };
}



// Exports
export const LEVELS: LevelData[] = [buildLevel1(), buildLevel2(), buildLevel3()];

export function getLevel(index: number): LevelData {
  return LEVELS[Math.min(index, LEVELS.length - 1)];
}

export function levelDataToGameLevel(data: LevelData): Level {
  return { grid: data.grid, width: data.width, height: data.height, tileSize: TILE_SIZE };
}
