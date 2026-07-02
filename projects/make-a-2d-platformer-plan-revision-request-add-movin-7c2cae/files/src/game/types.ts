export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Player = Rect & {
  vx: number;
  vy: number;
  grounded: boolean;
};

export type Coin = Rect & {
  id: string;
  collected: boolean;
};

export type Level = {
  width: number;
  height: number;
  start: { x: number; y: number };
  platforms: Rect[];
  hazards: Rect[];
  coins: Coin[];
  goal: Rect;
};
