export class PackageDetector {
  /**
   * Detects package manager by looking for lock files.
   */
  static detectManager(files: string[]): "npm" | "pnpm" | "yarn" | "bun" | "unknown" {
    if (files.includes("pnpm-lock.yaml")) return "pnpm";
    if (files.includes("yarn.lock")) return "yarn";
    if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
    if (files.includes("package-lock.json")) return "npm";
    return "unknown";
  }
}
