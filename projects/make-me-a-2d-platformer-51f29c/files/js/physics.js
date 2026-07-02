/**
 * Physics System
 * Gravity, AABB collision detection, and resolution.
 */

const GRAVITY = 0.6;
const MAX_FALL_SPEED = 12;
const FRICTION = 0.85;
const SLIDE_FRICTION = 0.3;

/** Test if two axis-aligned rectangles overlap */
function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/** Get the overlap depth and direction between two AABBs */
function getOverlap(a, b) {
  const overlapLeft = (a.x + a.width) - b.x;
  const overlapRight = (b.x + b.width) - a.x;
  const overlapTop = (a.y + a.height) - b.y;
  const overlapBottom = (b.y + b.height) - a.y;

  // Find smallest overlap
  const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  let direction;
  if (minOverlap === overlapLeft) direction = 'left';
  else if (minOverlap === overlapRight) direction = 'right';
  else if (minOverlap === overlapTop) direction = 'top';
  else direction = 'bottom';

  return { overlap: minOverlap, direction };
}

/** Resolve collision between entity and a solid tile/rect */
function resolveCollision(entity, obstacle) {
  if (!aabbOverlap(entity, obstacle)) return false;

  const { overlap, direction } = getOverlap(entity, obstacle);

  switch (direction) {
    case 'left':
      entity.x = obstacle.x - entity.width;
      entity.vx = 0;
      break;
    case 'right':
      entity.x = obstacle.x + obstacle.width;
      entity.vx = 0;
      break;
    case 'top':
      entity.y = obstacle.y - entity.height;
      entity.vy = 0;
      entity.grounded = true;
      break;
    case 'bottom':
      entity.y = obstacle.y + obstacle.height;
      entity.vy = 0;
      break;
  }

  return true;
}

/** Apply gravity to an entity */
function applyGravity(entity) {
  entity.vy += GRAVITY;
  if (entity.vy > MAX_FALL_SPEED) entity.vy = MAX_FALL_SPEED;
}

/** Check if entity is standing on solid ground (1px below check) */
function isOnGround(entity, solids) {
  const below = {
    x: entity.x + 1,
    y: entity.y + entity.height,
    width: entity.width - 2,
    height: 2
  };
  for (const solid of solids) {
    if (aabbOverlap(below, solid)) return true;
  }
  return false;
}
