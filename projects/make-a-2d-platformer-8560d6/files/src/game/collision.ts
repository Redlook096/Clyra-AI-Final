// Collision detection utilities
import { TILE_SIZE, TILE } from './constants';
import type { Entity, Level } from './game';

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export interface TileCollisionResult {
  x: number;
  y: number;
  collidesLeft: boolean;
  collidesRight: boolean;
  collidesTop: boolean;
  collidesBottom: boolean;
  grounded: boolean;
}

export function resolveTileCollisions(
  entity: AABB,
  velocityX: number,
  velocityY: number,
  level: Level,
  isPlayer: boolean
): TileCollisionResult {
  const result: TileCollisionResult = {
    x: entity.x,
    y: entity.y,
    collidesLeft: false,
    collidesRight: false,
    collidesTop: false,
    collidesBottom: false,
    grounded: false,
  };

  const tilesX = Math.ceil(entity.width / TILE_SIZE);
  const tilesY = Math.ceil(entity.height / TILE_SIZE);

  // Find tile range to check
  const startTileX = Math.floor(entity.x / TILE_SIZE) - 1;
  const endTileX = Math.floor((entity.x + entity.width) / TILE_SIZE) + 1;
  const startTileY = Math.floor(entity.y / TILE_SIZE) - 1;
  const endTileY = Math.floor((entity.y + entity.height) / TILE_SIZE) + 1;

  // Resolve X first
  result.x = entity.x + velocityX;
  
  // Check X collision
  const xCheckStart = Math.max(0, Math.floor(result.x / TILE_SIZE));
  const xCheckEnd = Math.min(level.width - 1, Math.floor((result.x + entity.width) / TILE_SIZE));
  const yCheckStart = Math.max(0, Math.floor(entity.y / TILE_SIZE));
  const yCheckEnd = Math.min(level.height - 1, Math.floor((entity.y + entity.height - 1) / TILE_SIZE));

  for (let ty = yCheckStart; ty <= yCheckEnd; ty++) {
    for (let tx = xCheckStart; tx <= xCheckEnd; tx++) {
      const tile = level.grid[ty]?.[tx];
      if (tile === TILE.EMPTY || tile === TILE.ONE_WAY || tile === TILE.SECRET) continue;
      
      const tileLeft = tx * TILE_SIZE;
      const tileRight = tileLeft + TILE_SIZE;
      const tileTop = ty * TILE_SIZE;
      const tileBottom = tileTop + TILE_SIZE;

      if (
        result.x < tileRight &&
        result.x + entity.width > tileLeft &&
        entity.y < tileBottom &&
        entity.y + entity.height > tileTop
      ) {
        if (velocityX > 0) {
          result.x = tileLeft - entity.width;
          result.collidesRight = true;
        } else if (velocityX < 0) {
          result.x = tileRight;
          result.collidesLeft = true;
        }
      }
    }
  }

  // Resolve Y
  result.y = entity.y + velocityY;

  const yCheckStart2 = Math.max(0, Math.floor(result.y / TILE_SIZE));
  const yCheckEnd2 = Math.min(level.height - 1, Math.floor((result.y + entity.height) / TILE_SIZE));
  const xCheckStart2 = Math.max(0, Math.floor(result.x / TILE_SIZE));
  const xCheckEnd2 = Math.min(level.width - 1, Math.floor((result.x + entity.width) / TILE_SIZE));

  for (let ty = yCheckStart2; ty <= yCheckEnd2; ty++) {
    for (let tx = xCheckStart2; tx <= xCheckEnd2; tx++) {
      const tile = level.grid[ty]?.[tx];
      if (tile === TILE.EMPTY || tile === TILE.SECRET) continue;

      // One-way platforms: only collide when falling and player's head is above the platform
      if (tile === TILE.ONE_WAY) {
        if (!isPlayer) continue;
        const tileTop = ty * TILE_SIZE;
        // Only collide if player is falling and their feet are at or below the platform top
        // and their previous position was above the platform
        if (velocityY <= 0 || (entity.y + entity.height) > tileTop + 4) continue;
      }

      const tileLeft = tx * TILE_SIZE;
      const tileRight = tileLeft + TILE_SIZE;
      const tileTop = ty * TILE_SIZE;
      const tileBottom = tileTop + TILE_SIZE;

      if (
        result.x < tileRight &&
        result.x + entity.width > tileLeft &&
        result.y < tileBottom &&
        result.y + entity.height > tileTop
      ) {
        if (velocityY > 0) {
          result.y = tileTop - entity.height;
          result.collidesBottom = true;
          result.grounded = true;
        } else if (velocityY < 0) {
          result.y = tileBottom;
          result.collidesTop = true;
        }
      }
    }
  }

  return result;
}

export function checkEntityCollisions(player: AABB, entities: Entity[]): Entity[] {
  const collisions: Entity[] = [];
  for (const entity of entities) {
    if (entity.collected) continue;
    if (aabbOverlap(player, entity)) {
      collisions.push(entity);
    }
  }
  return collisions;
}
