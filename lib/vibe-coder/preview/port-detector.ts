import net from "node:net";
import { checkPreviewHealth } from "./preview-health";

const COMMON_PORTS = [5630, 5631, 5632, 5173, 5174, 3000, 3001, 8080, 8000];

function canUsePort(port: number) {
  return new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export async function findPreviewPort(projectId: string) {
  const seed =
    5630 +
    [...projectId].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 200;
  const candidates = [
    seed,
    seed + 1,
    seed + 2,
    ...COMMON_PORTS,
    ...Array.from({ length: 20 }, (_, index) => 5700 + index),
  ];
  for (const port of [...new Set(candidates)]) {
    if (await canUsePort(port)) return port;
  }
  throw new Error("No preview port is available.");
}

export function parsePreviewUrl(logLine: string) {
  const match = logLine.match(/https?:\/\/(?:localhost|127\.0\.0\.1):(\d+)/i);
  if (!match) return null;
  const port = Number(match[1]);
  return Number.isFinite(port) ? `http://127.0.0.1:${port}` : null;
}

export async function probePreviewPort(port: number) {
  const url = `http://127.0.0.1:${port}`;
  const health = await checkPreviewHealth(url);
  return health.ok ? url : null;
}
