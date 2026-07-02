import type { Player, Rect } from "./types";

export const GRAVITY = 0.78;
export const MOVE_SPEED = 4.1;
export const JUMP_FORCE = -13.2;

export function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function resolvePlatforms(player: Player, platforms: Rect[]) {
  const next = { ...player, grounded: false };
  for (const platform of platforms) {
    if (!intersects(next, platform)) continue;
    const previousBottom = player.y + player.height - player.vy;
    if (previousBottom <= platform.y && next.vy >= 0) {
      next.y = platform.y - next.height;
      next.vy = 0;
      next.grounded = true;
    }
  }
  return next;
}

export function clampPlayer(player: Player, width: number, height: number) {
  return {
    ...player,
    x: Math.max(0, Math.min(width - player.width, player.x)),
    y: Math.min(height - player.height, player.y),
  };
}
