import { promises as fs } from "node:fs";
import * as path from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".ts", ".tsx", ".txt", ".yml", ".yaml",
]);

export type ProjectFingerprint = {
  requestType: string;
  productCategory: string;
  brandName: string;
  designDirection: string;
  layoutPattern: string;
  colourMood: string;
  contentAngle: string;
  interactionStyle: string;
};

export type CodebaseMap = {
  files: string[];
  routes: string[];
  components: string[];
  hooks: string[];
  styles: string[];
  dependencies: Record<string, string>;
  scripts: Record<string, string>;
  framework: string;
  packageManager: string;
  hasPlan: boolean;
  planSummary: string;
  fingerprint: ProjectFingerprint;
};

async function pathExists(file: string) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function listProjectFiles(root: string, dir = root): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (["node_modules", "dist", ".git", ".agent", "checkpoints"].includes(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listProjectFiles(root, absolute)));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    files.push(path.relative(root, absolute).replace(/\\/g, "/"));
  }
  return files.sort();
}

function inferRequestType(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\bdashboard\b/.test(lower)) return "dashboard";
  if (/\bchat\b/.test(lower)) return "chat-app";
  if (/\bstore|e-?commerce|shop\b/.test(lower)) return "store";
  if (/\bcalculator\b/.test(lower)) return "calculator";
  if (/\blanding|homepage|marketing\b/.test(lower)) return "landing-page";
  if (/\bgame\b/.test(lower)) return "game";
  if (/\bai tool|generator\b/.test(lower)) return "ai-tool";
  if (/\bsaas|app|platform\b/.test(lower)) return "saas-app";
  return "product";
}

function inferBrandName(prompt: string): string {
  const match = prompt.match(/\b(?:for|called|named|like)\s+([A-Z][A-Za-z0-9&.\-\s]{1,30})/);
  return match?.[1]?.replace(/\b(with|and|page|website)\b.*$/i, "").trim() || "Custom product";
}

export function buildProjectFingerprint(prompt: string): ProjectFingerprint {
  const requestType = inferRequestType(prompt);
  const brandName = inferBrandName(prompt);
  const hash = Array.from(prompt).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const moods = ["midnight premium", "warm editorial", "cool technical", "vibrant startup", "calm enterprise"];
  const layouts = ["split hero + product preview", "centered storytelling", "bento feature grid", "sidebar app shell", "full-bleed immersive"];
  const interactions = ["micro-interactions + hover depth", "keyboard-first productivity", "touch-friendly mobile gestures", "data-dense controls", "playful motion cues"];

  return {
    requestType,
    productCategory: requestType,
    brandName,
    designDirection: `${brandName} — ${requestType.replace(/-/g, " ")} with polished UI and realistic content`,
    layoutPattern: layouts[hash % layouts.length],
    colourMood: moods[(hash >> 3) % moods.length],
    contentAngle: `Focused on ${requestType.replace(/-/g, " ")} value props for ${brandName}`,
    interactionStyle: interactions[(hash >> 5) % interactions.length],
  };
}

export async function inspectProject(workspacePath: string, prompt: string): Promise<CodebaseMap> {
  const files = await listProjectFiles(workspacePath);
  const routes = files.filter((f) => /^(src\/)?(app|pages)\//.test(f) && /page\.(t|j)sx?$/.test(f));
  const components = files.filter((f) => /components?\//i.test(f) && /\.(t|j)sx$/.test(f));
  const hooks = files.filter((f) => /hooks?\//i.test(f));
  const styles = files.filter((f) => /\.(css|scss)$/.test(f));

  let dependencies: Record<string, string> = {};
  let scripts: Record<string, string> = {};
  let framework = "unknown";
  const packageJsonPath = path.join(workspacePath, "package.json");

  if (await pathExists(packageJsonPath)) {
    try {
      const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
      dependencies = pkg.dependencies || {};
      scripts = pkg.scripts || {};
      if (dependencies.next) framework = "next";
      else if (dependencies.vite || scripts.dev?.includes("vite")) framework = "vite-react";
      else if (dependencies.react) framework = "react";
    } catch {
      // ignore
    }
  }

  const planPath = path.join(workspacePath, "PLAN.md");
  const hasPlan = await pathExists(planPath);
  let planSummary = "";
  if (hasPlan) {
    const plan = await fs.readFile(planPath, "utf8");
    planSummary = plan.replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
  }

  return {
    files,
    routes,
    components,
    hooks,
    styles,
    dependencies,
    scripts,
    framework,
    packageManager: (await pathExists(path.join(workspacePath, "pnpm-lock.yaml"))) ? "pnpm"
      : (await pathExists(path.join(workspacePath, "yarn.lock"))) ? "yarn" : "npm",
    hasPlan,
    planSummary,
    fingerprint: buildProjectFingerprint(prompt),
  };
}

export function formatCodebaseMapForPrompt(map: CodebaseMap): string {
  return [
    "## Project inspection",
    `Framework: ${map.framework}`,
    `Package manager: ${map.packageManager}`,
    `Files (${map.files.length}): ${map.files.slice(0, 40).join(", ") || "empty workspace"}`,
    `Routes: ${map.routes.join(", ") || "none"}`,
    `Components: ${map.components.join(", ") || "none"}`,
    `Hooks: ${map.hooks.join(", ") || "none"}`,
    `Scripts: ${Object.keys(map.scripts).join(", ") || "none"}`,
    `Dependencies: ${Object.keys(map.dependencies).slice(0, 20).join(", ") || "none"}`,
    map.hasPlan ? `Existing PLAN.md summary: ${map.planSummary}` : "No PLAN.md yet.",
    "## Project fingerprint",
    JSON.stringify(map.fingerprint, null, 2),
  ].join("\n");
}
