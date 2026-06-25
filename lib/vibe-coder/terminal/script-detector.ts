import { promises as fs } from "node:fs";
import path from "node:path";

export type DevScriptResult = {
  scriptName: "dev" | "start" | "preview";
  command: string;
};

export async function detectDevScript(
  projectPath: string,
): Promise<DevScriptResult | null> {
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    const scripts = packageJson.scripts ?? {};
    for (const scriptName of ["dev", "start", "preview"] as const) {
      if (scripts[scriptName]) {
        return { scriptName, command: scripts[scriptName] };
      }
    }
    return null;
  } catch {
    return null;
  }
}
