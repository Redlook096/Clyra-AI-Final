// Game constants and configuration
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const TILE_SIZE = 32;
export const GRAVITY = 1400; // px/s²
export const PLAYER_SPEED = 280; // px/s horizontal speed
export const PLAYER_ACCELERATION = 1600; // px/s²
export const PLAYER_FRICTION = 800; // px/s² deceleration
export const JUMP_VELOCITY = -520; // initial jump velocity
export const JUMP_HOLD_VELOCITY = -900; // velocity when holding jump (higher)
export const JUMP_HOLD_TIME = 0.15; // seconds you can hold to extend jump
export const COYOTE_TIME = 0.08; // seconds after leaving ground to still jump
export const JUMP_BUFFER_TIME = 0.1; // seconds before landing to buffer jump
export const MAX_FALL_SPEED = 800;
export const STOMP_BOUNCE = -350;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 28;
export const ENEMY_SPEED = 60;
export const ENEMY_WIDTH = 28;
export const ENEMY_HEIGHT = 24;
export const COIN_SIZE = 16;
export const MAX_LIVES = 3;

// Tile types
export const TILE = {
  EMPTY: 0,
  GROUND: 1,
  PLATFORM: 2,
  ONE_WAY: 3,
  SPIKE: 4,
  WALL: 5,
  BRICK: 6,
  SECRET: 7,
};

// Colors
export const COLORS = {
  BG: '#0a0a1a',
  BG_LAYER2: '#0f0f2a',
  BG_LAYER3: '#15153a',
  GROUND: '#00f0ff',
  GROUND_SHADOW: '#0066cc',
  PLATFORM: '#8844ff',
  ONE_WAY: '#44ff88',
  PLAYER_BODY: '#ff2d78',
  PLAYER_OUTLINE: '#cc0055',
  ENEMY_BODY: '#ff4444',
  ENEMY_OUTLINE: '#aa0000',
  COIN: '#ffd700',
  COIN_SHINE: '#ffee88',
  CHECKPOINT_INACTIVE: '#666688',
  CHECKPOINT_ACTIVE: '#00ff88',
  GOAL: '#ff8800',
  SPIKE: '#ff2266',
  HUD_TEXT: '#ffffff',
  HUD_ACCENT: '#ff2d78',
  STAR: '#ffd700',
  STAR_DIM: '#444466',
  PARTICLE: ['#ff2d78', '#ffd700', '#00f0ff', '#ff4444', '#44ff88'],
};
