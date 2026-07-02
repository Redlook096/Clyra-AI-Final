import type { Level } from "./types";

export const level: Level = {
  width: 960,
  height: 540,
  start: { x: 70, y: 390 },
  platforms: [
    { x: 0, y: 500, width: 960, height: 40 },
    { x: 110, y: 420, width: 170, height: 20 },
    { x: 330, y: 360, width: 170, height: 20 },
    { x: 555, y: 300, width: 160, height: 20 },
    { x: 760, y: 240, width: 150, height: 20 },
    { x: 210, y: 255, width: 110, height: 18 },
    { x: 470, y: 190, width: 110, height: 18 },
  ],
  hazards: [
    { x: 300, y: 474, width: 55, height: 26 },
    { x: 620, y: 474, width: 70, height: 26 },
    { x: 728, y: 474, width: 52, height: 26 },
  ],
  coins: [
    { id: "c1", x: 170, y: 382, width: 18, height: 18, collected: false },
    { id: "c2", x: 392, y: 322, width: 18, height: 18, collected: false },
    { id: "c3", x: 615, y: 262, width: 18, height: 18, collected: false },
    { id: "c4", x: 804, y: 202, width: 18, height: 18, collected: false },
    { id: "c5", x: 505, y: 152, width: 18, height: 18, collected: false },
  ],
  goal: { x: 880, y: 178, width: 42, height: 62 },
};
