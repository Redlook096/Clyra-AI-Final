import { existsSync } from "node:fs";
import path from "node:path";
import type { VibePackageManager } from "../../../types/vibe-preview";

export function detectPackageManager(projectPath: string): VibePackageManager {
  if (existsSync(path.join(projectPath, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(projectPath, "yarn.lock"))) return "yarn";
  if (
    existsSync(path.join(projectPath, "bun.lockb")) ||
    existsSync(path.join(projectPath, "bun.lock"))
  ) {
    return "bun";
  }
  return "npm";
}
