import dotenv from "dotenv";
import express from "express";
import path from "path";
import { startVibeServer } from "./vibe-server";

const _envRoot = process.cwd();
dotenv.config({ path: path.join(_envRoot, ".env") });
dotenv.config({ path: path.join(_envRoot, ".env.local"), override: true });
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import {
  getPreviewLogs,
  getPreviewSession,
  refreshPreview,
  restartDevServer,
  startDevServer,
  stopDevServer,
} from "./lib/vibe-coder/preview/preview-runner";

type VibeProjectStatus = "Draft" | "Building" | "Ready" | "Failed";

interface VibeProjectMetadata {
  id: string;
  name: string;
  prompt: string;
  mode: "plan" | "fast";
  status: VibeProjectStatus;
  createdAt: string;
  updatedAt: string;
}

const projectsRoot = () => path.join(process.cwd(), "projects");
const safeProjectId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");
const projectRoot = (id: string) => path.join(projectsRoot(), safeProjectId(id));

function slugifyProjectName(input: string) {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52);
  return cleaned || "clyra-vibe-project";
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readProjectMetadata(id: string) {
  return readJson<VibeProjectMetadata | null>(
    path.join(projectRoot(id), "metadata.json"),
    null,
  );
}

async function listProjectFiles(id: string) {
  const root = path.join(projectRoot(id), "files");
  const files: Array<{ path: string; content: string }> = [];

  async function walk(dir: string) {
    let entries: Array<import("node:fs").Dirent>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(root, full).replaceAll(path.sep, "/");
        files.push({ path: rel, content: await fs.readFile(full, "utf8") });
      }
    }
  }

  await walk(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function buildStarterFiles(prompt: string, projectName: string) {
  const isCalculator = /calculator|calc/i.test(prompt);
  const isLanding = /landing|saas|website|homepage|hero/i.test(prompt);

  if (isCalculator) {
    return {
      "src/App.tsx": `import { useMemo, useState } from "react";
import "./styles.css";

const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "=", "+"];

export default function App() {
  const [expression, setExpression] = useState("");
  const preview = useMemo(() => {
    try {
      if (!expression || /[+\\-*/.]$/.test(expression)) return "0";
      const result = Function(\`"use strict"; return (\${expression})\`)();
      return Number.isFinite(result) ? String(result) : "0";
    } catch {
      return "0";
    }
  }, [expression]);

  const press = (key: string) => {
    if (key === "=") return setExpression(preview);
    setExpression((value) => value + key);
  };

  return (
    <main className="page">
      <section className="calculator" aria-label="Calculator">
        <p className="eyebrow">Clyra Vibe</p>
        <div className="display">
          <span>{expression || "0"}</span>
          <strong>{preview}</strong>
        </div>
        <div className="keys">
          <button onClick={() => setExpression("")}>AC</button>
          <button onClick={() => setExpression((value) => value.slice(0, -1))}>DEL</button>
          {keys.map((key) => (
            <button key={key} onClick={() => press(key)} className={/[/*+\\-=]/.test(key) ? "accent" : ""}>
              {key}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
`,
      "src/styles.css": `:root { color: #0f172a; background: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; }
.page { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: radial-gradient(circle at 30% 20%, rgba(59,130,246,.12), transparent 32%), #fff; }
.calculator { width: min(420px, 100%); border: 1px solid rgba(148,163,184,.28); border-radius: 34px; padding: 22px; background: rgba(255,255,255,.86); box-shadow: 0 28px 90px rgba(15,23,42,.10); }
.eyebrow { margin: 0 0 14px; color: #64748b; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; font-size: 11px; }
.display { min-height: 126px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; border-radius: 26px; padding: 18px; background: #f8fafc; overflow: hidden; }
.display span { min-height: 24px; color: #64748b; font-size: 20px; text-align: right; word-break: break-all; }
.display strong { color: #020617; font-size: clamp(36px, 10vw, 58px); line-height: 1; text-align: right; }
.keys { margin-top: 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
button { min-height: 56px; border: 0; border-radius: 20px; background: #f1f5f9; color: #0f172a; font-weight: 800; font-size: 18px; cursor: pointer; transition: transform .18s ease, background .18s ease; }
button:hover { transform: translateY(-1px); background: #e2e8f0; }
button:active { transform: translateY(1px) scale(.98); }
.accent { background: #0f172a; color: white; }
`,
      "README.md": `# ${projectName}

A polished calculator generated by Clyra Vibe.
`,
      "src/main.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      "package.json": `${JSON.stringify(
        {
          name: slugifyProjectName(projectName),
          version: "0.0.0",
          private: true,
          type: "module",
          scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
          dependencies: {
            "@vitejs/plugin-react": "^5.0.4",
            vite: "^6.2.0",
            typescript: "~5.8.2",
            react: "^19.0.0",
            "react-dom": "^19.0.0",
            "lucide-react": "^0.546.0",
            "framer-motion": "^12.38.0",
          },
        },
        null,
        2,
      )}\n`,
    };
  }

  return {
    "src/App.tsx": `import "./styles.css";

const features = ${JSON.stringify(
      isLanding
        ? ["Conversion-focused hero", "Feature grid", "Pricing preview", "FAQ", "Responsive navigation"]
        : ["Polished layout", "Responsive sections", "Reusable cards", "Clear calls to action"],
      null,
      2,
    )};

export default function App() {
  return (
    <main>
      <nav className="nav">
        <strong>${projectName}</strong>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <button>Get started</button>
      </nav>
      <section className="hero">
        <p className="eyebrow">Built with Clyra Vibe</p>
        <h1>${projectName}</h1>
        <p className="lead">A complete, presentable starter that is ready to expand into a production-quality product.</p>
        <div className="actions">
          <button>Start free</button>
          <button className="secondary">View demo</button>
        </div>
      </section>
      <section id="features" className="grid">
        {features.map((feature) => (
          <article key={feature}>
            <span />
            <h2>{feature}</h2>
            <p>Designed with responsive structure, clean spacing, and functional interaction states.</p>
          </article>
        ))}
      </section>
      <section id="pricing" className="cta">
        <h2>Ready to ship the next version?</h2>
        <p>Use the file tree, preview, and validation workflow to keep building.</p>
        <button>Continue building</button>
      </section>
    </main>
  );
}
`,
    "src/styles.css": `:root { color: #0f172a; background: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; }
main { min-height: 100vh; background: radial-gradient(circle at 28% 18%, rgba(59,130,246,.10), transparent 30%), #fff; }
.nav { height: 76px; display: flex; align-items: center; gap: 26px; padding: 0 max(24px, 6vw); }
.nav strong { margin-right: auto; }
a { color: #64748b; text-decoration: none; font-weight: 700; }
button { border: 0; border-radius: 999px; padding: 13px 18px; background: #0f172a; color: white; font-weight: 800; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
button:hover { transform: translateY(-1px); box-shadow: 0 14px 36px rgba(15,23,42,.14); }
.hero { max-width: 920px; margin: 0 auto; padding: 86px 24px 56px; text-align: center; }
.eyebrow { color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .2em; }
h1 { margin: 12px 0; font-size: clamp(48px, 8vw, 96px); line-height: .94; letter-spacing: -.07em; }
.lead { max-width: 660px; margin: 0 auto; color: #64748b; font-size: 20px; line-height: 1.55; font-weight: 600; }
.actions { display: flex; justify-content: center; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
.secondary { background: #f1f5f9; color: #0f172a; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; max-width: 1120px; margin: 0 auto; padding: 24px; }
article, .cta { border: 1px solid rgba(148,163,184,.22); border-radius: 30px; background: rgba(255,255,255,.82); box-shadow: 0 24px 70px rgba(15,23,42,.06); }
article { padding: 24px; }
article span { display: block; width: 38px; height: 38px; border-radius: 16px; background: linear-gradient(135deg,#38bdf8,#8b5cf6); }
article h2 { font-size: 20px; letter-spacing: -.03em; }
article p, .cta p { color: #64748b; font-weight: 600; line-height: 1.6; }
.cta { max-width: 1120px; margin: 16px auto 0; padding: 36px 24px; text-align: center; }
@media (max-width: 820px) { .nav a { display: none; } .grid { grid-template-columns: 1fr; } }
`,
    "README.md": `# ${projectName}

A production-minded starter generated by Clyra Vibe.
`,
    "src/main.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "package.json": `${JSON.stringify(
      {
        name: slugifyProjectName(projectName),
        version: "0.0.0",
        private: true,
        type: "module",
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: {
          "@vitejs/plugin-react": "^5.0.4",
          vite: "^6.2.0",
          typescript: "~5.8.2",
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          "lucide-react": "^0.546.0",
          "framer-motion": "^12.38.0",
        },
      },
      null,
      2,
    )}\n`,
  };
}

function buildPlanMarkdown(prompt: string, scan: Record<string, unknown>) {
  const title = prompt.trim().replace(/\s+/g, " ").slice(0, 80) || "Clyra Vibe Build";
  const framework = String(scan.framework ?? "React + Vite");
  const packageManager = String(scan.packageManager ?? "npm");
  const relevantFiles = Array.isArray(scan.relevantFiles)
    ? (scan.relevantFiles as string[])
    : ["src/App.tsx", "src/index.css", "package.json"];
  const currentTree = relevantFiles
    .slice(0, 18)
    .map((file) => `- ${file}`)
    .join("\n");

  return `# Plan: ${title}

## 1. Goal

Build a complete, presentable implementation for **${title}**.

Done means the saved project has real files, a coherent UI, responsive layout, working interactions, validation notes, a live preview route, project metadata, checkpoint data, and a final review summary.

## 2. User Request Interpretation

- Direct request: ${prompt}
- Preserve the existing Clyra visual language: minimal, white, rounded, premium, smooth.
- Avoid unrelated product changes.
- Build the obvious supporting states and structure a real user would expect.
- Assume the user wants a production-feeling result, not a placeholder.
- Do not replace the existing Clyra LLM integration or app shell.

## 3. Current Project Scan

Framework:

- ${framework}

Package manager:

- ${packageManager}

Relevant files found:

${relevantFiles.map((file) => `- ${file} — relevant to the app shell, styling, or generated project output`).join("\n")}

Existing design system:

- Typography: heavy rounded sans-serif with tight tracking.
- Spacing: centered premium panels, generous breathing room.
- Border radius: large rounded controls and cards.
- Glass effects: subtle white transparency and soft borders.
- Animation style: restrained transform/opacity transitions.
- Existing Vibe files: VibeCoderWorkspace, mini code boxes, live preview panel, preview runner, project storage.
- Existing preview systems: local project files under projects/{projectId}/files and a managed localhost preview session.

## 4. Existing File Tree Summary

Relevant current files:

${currentTree}

## 5. Proposed File Tree

Adapted target tree for this project:

\`\`\`
projects/{projectId}/
  plan.md
  metadata.json
  files/
    index.html
    package.json
    README.md
    src/
      main.tsx
      App.tsx
      styles.css
  checkpoints/
    checkpoint-initial.json
  logs/
    validation.log
    preview.log
  preview/
  .agent/
    task-graph.json
    agent-state.json
    pending-patches.json
    applied-patches.json
    build-summary.json
\`\`\`

## 6. Requirements

### 6.1 User-Requested Requirements

- Build the requested project in real files.
- Keep UI premium, minimal, and functional.
- Save project state so it can be reopened.
- Show each important file operation through mini code boxes.
- Keep the live preview honest and synced with saved files.

### 6.2 Inferred Production Requirements

- Empty states, loading states, and error-safe flows.
- Responsive desktop/tablet/mobile layout.
- Preview-ready files and clear validation route.
- Checkpoint metadata and rollback structure.
- Accessible labels for interactive controls.
- Fast reopen without replaying generation.
- Smooth transitions and stable layout.
- Final review before marking Ready.

## 7. Out of Scope

- Do not replace the existing LLM integration.
- Do not redesign unrelated Chat or Clip pages.
- Do not add heavy dependencies unless the project truly needs them.
- Do not run destructive commands or delete user files.

## 8. UX Flow

1. User opens Vibe Coder.
2. User selects Plan Mode or Fast Mode.
3. User sends a request.
4. Shimmer thinking appears with one safe visible focus sentence.
5. Agent scans project, framework, package manager, UI patterns, Vibe files, LLM adapter, and preview storage.
6. Agent creates detailed plan.md, proposed file tree, and task graph.
7. Collapsed plan card appears.
8. User expands, comments, regenerates, or approves.
9. Approved plan.md is saved as the source of truth.
10. Project folder, metadata, checkpoint, logs, and .agent state are created.
11. Agent reads plan.md before each task.
12. Mini code boxes show file changes one at a time.
13. Validation runs.
14. Preview refreshes.
15. Final review checks saved files, preview status, task graph, and rollback readiness.

## 9. UI Layout Plan

### Component: PlanCard

Purpose: show collapsed summary, expandable full plan, comments, and approval.

States:

- Collapsed
- Expanded
- Commenting
- Approved

### Component: MiniCodeBox

Purpose: show each file change in a compact Cursor-like stream.

States:

- Revealing
- Collapsed
- Reopened

### Component: LivePreviewPanel

Purpose: run the saved project in a real browser-like preview.

States:

- Starting
- Compiling
- Ready
- Refreshing
- Runtime error
- Full screen

### Component: RecentProjectCard

Purpose: show saved project preview, name, status, rename/delete actions, and open project flow.

## 10. Architecture Plan

### Frontend

- VibeCoderWorkspace — main workspace surface.
- ThinkingStep — reusable thinking/thought state.
- ThinkingUnderText — one safe Cursor-style focus sentence.
- PlanCard — review and approval UI.
- RecentProjectCard — saved project entry point.
- LivePreviewPanel — managed local preview.
- VibeMiniCodeBox — file change stream.

### Backend / Controller

- /api/vibe/projects — list and create projects.
- /api/vibe/plan — create the structured plan.
- /api/vibe/write-plan — save approved plan.md.
- /api/vibe/validate — run safe validation metadata.
- /api/vibe/preview/start — start preview session.
- /api/vibe/preview/status/:id — report preview state.
- /api/vibe/preview/refresh — refresh preview.

### Storage

Project folder structure:

projects/
project-id/
plan.md
metadata.json
files/
checkpoints/
logs/
preview/
.agent/

## 11. File Change Plan

| File Path | Change Type | Purpose | Owner Agent | Risk |
| --- | --- | --- | --- | --- |
| plan.md | Create | Save approved source-of-truth plan | Planner Agent | Low |
| metadata.json | Create/Edit | Persist project status and reopen behavior | Harness Agent | Low |
| .agent/task-graph.json | Create/Edit | Track executable task graph | Harness Agent | Medium |
| .agent/agent-state.json | Create/Edit | Persist active task and gates | Harness Agent | Medium |
| files/package.json | Create/Edit | Provide dev/build scripts for preview | Backend Agent | Medium |
| files/src/App.tsx | Create/Edit | Main functional product surface | Frontend Agent | Medium |
| files/src/styles.css | Create/Edit | Visual system and responsiveness | Design Agent | Low |
| logs/validation.log | Create/Edit | Store validation result | Terminal Agent | Low |

## 12. Detailed Task Graph

### Task 1: Scan Project

ID: T1

Depends on: None

Assigned agent: Architect Agent

Files affected: None

Purpose:

- Understand the current app before planning.

Work:

- Read package metadata.
- Detect framework and package manager.
- Detect relevant source files.
- Detect existing Vibe coder files, preview runner, mini code boxes, and styling.

Expected output:

- Project scan summary.
- Relevant current file tree.

Validation:

- Confirm source folders exist or report missing files.

Rollback point:

- Not needed.

Done criteria:

- Scan results are reflected in plan.md.

### Task 2: Generate plan.md and proposed file tree

ID: T2

Depends on: T1

Assigned agent: Planner Agent

Files affected:

- plan.md

Work:

- Create detailed plan.md.
- Create proposed file tree.
- Create execution gates and validation plan.

Expected output:

- Reviewable plan card.

Validation:

- Confirm plan.md has all required sections.

Rollback point:

- Restore checkpoint before T2.

Done criteria:

- User can expand, comment, and approve the plan.

### Task 3: Create project shell and checkpoint

ID: T3

Depends on: T2

Assigned agent: Harness Agent

Files affected:

- metadata.json
- checkpoints/checkpoint-initial.json
- .agent/task-graph.json
- .agent/agent-state.json

Work:

- Create persistent project folder.
- Save approved plan and metadata.
- Create checkpoint before file edits.

Expected output:

- Project can be reopened without replaying generation.

Validation:

- Confirm folder structure exists.

Rollback point:

- Initial checkpoint.

Done criteria:

- Gate 4 and Gate 5 pass.

### Task 4: Generate product files

ID: T4

Depends on: T3

Assigned agent: Frontend Agent

Files affected:

- files/package.json
- files/index.html
- files/src/main.tsx
- files/src/App.tsx
- files/src/styles.css
- files/README.md

Work:

- Generate complete UI.
- Keep responsive layout.
- Ensure controls have behavior.

Expected output:

- Preview-ready source files.

Validation:

- Typecheck/build if available.

Rollback point:

- Restore checkpoint before T4.

Done criteria:

- Mini code boxes emitted for each created/edited file.

### Task 5: Validate and fix

ID: T5

Depends on: T4

Assigned agent: Terminal Agent + Error Agent + Fixer Agent

Files affected:

- logs/validation.log

Work:

- Run available validation commands or local structural checks.
- Parse errors.
- Patch targeted files if needed.
- Repeat up to 5 times.

Expected output:

- Passing or clearly reported validation.

Validation:

- No missing core files.

Rollback point:

- Restore checkpoint before T5.

Done criteria:

- Validation gate passes or build is paused with a clear reason.

### Task 6: Refresh live preview and final review

ID: T6

Depends on: T5

Assigned agent: Reviewer Agent

Files affected:

- preview/
- logs/preview.log
- .agent/build-summary.json

Work:

- Start or refresh live preview.
- Check preview state honestly.
- Confirm saved files, metadata, task graph, and rollback data.

Expected output:

- Ready project summary with preview status.

Validation:

- Preview URL responds or failure is reported.

Rollback point:

- Restore checkpoint before T6.

Done criteria:

- Final review checklist passes.

## 13. Execution Gates

Gate 1: Project Scanned — cannot create plan until scan is complete.

Gate 2: plan.md Generated — cannot show plan card until plan.md exists.

Gate 3: Plan Approved — cannot edit files until approval.

Gate 4: Project Folder Created — cannot build until metadata and folders exist.

Gate 5: Checkpoint Created — cannot edit files until checkpoint exists.

Gate 6: Task Read From plan.md — cannot execute a task until the current task is read from plan.md.

Gate 7: Mini Code Box Emitted — cannot hide important file changes.

Gate 8: Validation Passed — cannot mark task done until validation passes or failure is reported.

Gate 9: Preview Checked — cannot mark UI task done until preview is refreshed or failure is reported.

Gate 10: Final Review Passed — cannot show Build Complete until final review passes.

## 14. Validation Plan

- Detect package manager: ${packageManager}
- Use package.json scripts when available.
- Run typecheck, lint, test, and build when defined.
- For generated project files, confirm package.json, index.html, src/main.tsx, src/App.tsx, and src/styles.css exist.
- Never fake command output.

## 15. Error Fixing Plan

1. Capture the error.
2. Map the error to the task from plan.md.
3. Map the error to file and line when possible.
4. Show thinking with a safe visible focus sentence.
5. Apply the smallest targeted patch.
6. Emit mini code box.
7. Re-run validation.
8. Repeat up to 5 times.
9. Pause with Build Paused if still broken.

## 16. Live Preview Plan

- Start the dev server for the saved project.
- Detect localhost URL.
- Load the project in the live preview.
- Show starting, compiling, ready, refreshing, and error states honestly.
- Refresh after successful file changes.
- Capture runtime errors and route them to the Error/Fixer loop.
- Do not mark preview ready if broken.

## 17. Checkpoint and Rollback Plan

- Create checkpoint before file edits.
- Store task graph and agent state under .agent/.
- Store applied patches under .agent/applied-patches.json.
- Roll back to the latest checkpoint only after user confirmation.

## 18. Performance Plan

- Keep animation to opacity and transform.
- Keep panel heights stable.
- Debounce preview refresh.
- Lazy load heavy code/preview panels.
- Avoid global state churn for timers and visible thought text.
- Keep mini code boxes sequential and collapsed after reveal.

## 19. Safety Plan

Never delete files, reset git, overwrite .env files, expose secrets, replace the LLM integration, or run destructive commands without approval.

Commands needing approval:

- rm -rf
- git reset --hard
- git clean
- npm uninstall
- deleting folders
- overwriting .env files

## 20. Final Review Checklist

- plan.md exists.
- Proposed file tree matches saved output or differences are explained.
- metadata.json exists.
- .agent state exists.
- Mini code boxes were emitted for file changes.
- Validation status is recorded.
- Live preview starts or reports a clear failure.
- Checkpoint exists.
- Rollback path is available.
- UI matches the Clyra style.
- No unrelated files changed.

## Build Execution Rules

- Create checkpoint before editing.
- Apply one task at a time.
- Show ThinkingStep before each task.
- Show mini code boxes for file edits.
- Validate after each major task.
- Do not mark task done until validation passes or is clearly reported.

## Final User Summary

Build Complete:

- What was built.
- Files changed.
- plan.md saved.
- Commands run.
- Preview status.
- Checkpoint created.
- Rollback available.
`;
}

async function scanProject() {
  const packageJson = await readJson<Record<string, unknown>>(
    path.join(process.cwd(), "package.json"),
    {},
  );
  const deps = {
    ...((packageJson.dependencies as Record<string, string>) ?? {}),
    ...((packageJson.devDependencies as Record<string, string>) ?? {}),
  };
  const packageManager = existsSync(path.join(process.cwd(), "pnpm-lock.yaml"))
    ? "pnpm"
    : existsSync(path.join(process.cwd(), "yarn.lock"))
      ? "yarn"
      : "npm";
  const framework = deps["@vitejs/plugin-react"]
    ? "React + Vite"
    : deps.next
      ? "Next.js"
      : "React";
  const relevantFiles = [
    "package.json",
    "src/App.tsx",
    "src/index.css",
    "server.ts",
  ].filter((file) => existsSync(path.join(process.cwd(), file)));

  return { framework, packageManager, relevantFiles };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const VIBE_PORT = Number(process.env.VIBE_PORT) || 5174;

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const handleClyraChat = async (
    req: express.Request,
    res: express.Response,
  ) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error:
          "Clyra API is not configured. Add DEEPSEEK_API_KEY to .env or .env.local (server reads this file on startup).",
      });
      return;
    }
    try {
      const upstream = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(req.body),
        },
      );

      const contentType = upstream.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      res.status(upstream.status);

      if (!upstream.ok) {
        res.send(await upstream.text());
        return;
      }

      if (!upstream.body) {
        res.end();
        return;
      }

      Readable.fromWeb(
        upstream.body as import("stream/web").ReadableStream,
      ).pipe(res);
    } catch (err) {
      console.error("Clyra chat proxy error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to reach Clyra chat API" });
      } else {
        res.end();
      }
    }
  };

  app.post("/api/clyra/chat", handleClyraChat);
  app.post("/api/deepseek/chat", handleClyraChat);

  app.get("/api/vibe/scan", async (_req, res) => {
    res.json(await scanProject());
  });

  app.post("/api/vibe/scan", async (_req, res) => {
    res.json(await scanProject());
  });

  app.post("/api/vibe/plan", async (req, res) => {
    const prompt = String(req.body?.prompt ?? "").trim();
    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }
    const scan = req.body?.scan ?? (await scanProject());
    const markdown = buildPlanMarkdown(prompt, scan);
    const taskGraph = [
      {
        id: "T1",
        name: "Scan project and existing Vibe systems",
        description: "Inspect framework, package manager, current UI, mini code boxes, preview runner, storage, and relevant source files.",
      },
      {
        id: "T2",
        name: "Generate plan.md, file tree, and task graph",
        description: "Create the detailed source-of-truth plan with proposed files, gates, validation, preview, checkpointing, and rollback.",
      },
      {
        id: "T3",
        name: "Create project shell and checkpoint",
        description: "Create the saved project folder, metadata, checkpoint, .agent state, logs, and approved plan.md.",
      },
      {
        id: "T4",
        name: "Generate and patch files task by task",
        description: "Read plan.md, apply targeted file changes, and emit mini code boxes for every important file operation.",
      },
      {
        id: "T5",
        name: "Validate and fix errors",
        description: "Run available checks, map failures to plan tasks, patch targeted files, and record validation results.",
      },
      {
        id: "T6",
        name: "Refresh preview and final review",
        description: "Start or refresh live preview, verify saved output, checkpoint status, rollback path, and final readiness.",
      },
    ];
    res.json({
      title: prompt.replace(/\s+/g, " ").slice(0, 80),
      summary: `Clyra will build ${prompt.replace(/\s+/g, " ")} as a saved, preview-ready project with real files, a plan.md, checkpoints, validation notes, and a polished UI.`,
      markdown,
      taskGraph,
      scan,
      starterFiles: buildStarterFiles(prompt, prompt.replace(/\s+/g, " ").slice(0, 48) || "Clyra Vibe Project"),
    });
  });

  app.get("/api/vibe/projects", async (_req, res) => {
    await ensureDir(projectsRoot());
    const entries = await fs.readdir(projectsRoot(), { withFileTypes: true });
    const projects = (
      await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map((entry) => readProjectMetadata(entry.name)),
      )
    )
      .filter(Boolean)
      .sort((a, b) => {
        const left = new Date(a!.updatedAt).getTime();
        const right = new Date(b!.updatedAt).getTime();
        return right - left;
      });
    res.json({ projects });
  });

  app.post("/api/vibe/projects", async (req, res) => {
    const prompt = String(req.body?.prompt ?? "New Vibe project").trim();
    const mode = req.body?.mode === "fast" ? "fast" : "plan";
    const name =
      String(req.body?.name ?? "").trim() ||
      prompt.replace(/\s+/g, " ").slice(0, 72) ||
      "New Vibe project";
    const id = `${slugifyProjectName(name)}-${crypto.randomBytes(3).toString("hex")}`;
    const now = new Date().toISOString();
    const root = projectRoot(id);
    const metadata: VibeProjectMetadata = {
      id,
      name,
      prompt,
      mode,
      status: "Building",
      createdAt: now,
      updatedAt: now,
    };
    await ensureDir(path.join(root, "files"));
    await ensureDir(path.join(root, "checkpoints"));
    await ensureDir(path.join(root, "logs"));
    await ensureDir(path.join(root, "preview"));
    await ensureDir(path.join(root, ".agent"));
    await writeJson(path.join(root, "metadata.json"), metadata);
    await writeJson(path.join(root, ".agent", "state.json"), {
      status: "created",
      taskCursor: 0,
      updatedAt: now,
    });
    res.json({ project: metadata });
  });

  app.get("/api/vibe/projects/:id", async (req, res) => {
    const metadata = await readProjectMetadata(req.params.id);
    if (!metadata) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const root = projectRoot(metadata.id);
    const files = await listProjectFiles(metadata.id);
    let plan = "";
    try {
      plan = await fs.readFile(path.join(root, "plan.md"), "utf8");
    } catch {
      plan = "";
    }
    res.json({ project: metadata, files, plan });
  });

  app.patch("/api/vibe/projects/:id", async (req, res) => {
    const projectId = safeProjectId(String(req.params.id ?? ""));
    const metadata = await readProjectMetadata(projectId);
    if (!metadata) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      res.status(400).json({ error: "Project name is required" });
      return;
    }

    const updated = {
      ...metadata,
      name: name.slice(0, 96),
      updatedAt: new Date().toISOString(),
    };
    await writeJson(path.join(projectRoot(projectId), "metadata.json"), updated);
    res.json({ project: updated });
  });

  app.delete("/api/vibe/projects/:id", async (req, res) => {
    const projectId = safeProjectId(String(req.params.id ?? ""));
    const metadata = await readProjectMetadata(projectId);
    if (!metadata) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await fs.rm(projectRoot(projectId), { recursive: true, force: true });
    res.json({ ok: true, projectId });
  });

  app.post("/api/vibe/write-plan", async (req, res) => {
    const projectId = safeProjectId(String(req.body?.projectId ?? ""));
    const plan = String(req.body?.plan ?? "");
    const files = (req.body?.files ?? {}) as Record<string, string>;
    const taskGraph = req.body?.taskGraph ?? [];
    const metadata = await readProjectMetadata(projectId);
    if (!metadata) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const root = projectRoot(projectId);
    await fs.writeFile(path.join(root, "plan.md"), plan, "utf8");
    const now = new Date().toISOString();
    await writeJson(path.join(root, "checkpoints", "checkpoint-initial.json"), {
      id: "checkpoint-initial",
      createdAt: now,
      reason: "Initial checkpoint before generated files were written.",
      files: [],
    });
    await writeJson(path.join(root, ".agent", "task-graph.json"), taskGraph);
    await writeJson(path.join(root, ".agent", "agent-state.json"), {
      status: "building",
      activeTask: "T4",
      gates: {
        projectScanned: true,
        planGenerated: true,
        planApproved: true,
        projectFolderCreated: true,
        checkpointCreated: true,
      },
      updatedAt: now,
    });
    await writeJson(path.join(root, ".agent", "pending-patches.json"), []);
    await writeJson(
      path.join(root, ".agent", "applied-patches.json"),
      Object.keys(files).map((file) => ({
        file,
        type: file === "plan.md" ? "plan" : "create",
        appliedAt: now,
      })),
    );
    for (const [relative, content] of Object.entries(files)) {
      const cleanRelative = relative.replace(/^\/+/, "").replace(/\.\./g, "");
      const target = path.join(root, "files", cleanRelative);
      await ensureDir(path.dirname(target));
      await fs.writeFile(target, content, "utf8");
    }
    const updated = { ...metadata, status: "Ready" as const, updatedAt: now };
    await writeJson(path.join(root, "metadata.json"), updated);
    await writeJson(path.join(root, ".agent", "build-summary.json"), {
      status: "Ready",
      completedAt: now,
      filesChanged: Object.keys(files),
      validation: "Core files saved; app-level validation runs in Clyra before delivery.",
      preview: "Preview runner will start this project on open.",
      rollback: "checkpoint-initial",
    });
    await fs.writeFile(
      path.join(root, "logs", "validation.log"),
      `[${now}] Validation queued locally. Core files saved.\n`,
      "utf8",
    );
    res.json({ project: updated, files: await listProjectFiles(projectId) });
  });

  app.post("/api/vibe/validate", async (req, res) => {
    const projectId = safeProjectId(String(req.body?.projectId ?? ""));
    const files = await listProjectFiles(projectId);
    const hasApp = files.some((file) => file.path === "src/App.tsx");
    const hasStyles = files.some((file) => file.path === "src/styles.css");
    res.json({
      status: hasApp && hasStyles ? "ready" : "needs-work",
      checks: [
        { label: "src/App.tsx", ok: hasApp },
        { label: "src/styles.css", ok: hasStyles },
        { label: "preview files", ok: files.length > 0 },
      ],
    });
  });

  const getPreviewProjectArgs = async (rawProjectId: string) => {
    const projectId = safeProjectId(rawProjectId);
    const metadata = await readProjectMetadata(projectId);
    if (!metadata) return null;
    return {
      projectId: metadata.id,
      projectPath: path.join(projectRoot(metadata.id), "files"),
      projectName: metadata.name,
    };
  };

  app.post("/api/vibe/preview/start", async (req, res) => {
    const args = await getPreviewProjectArgs(String(req.body?.projectId ?? ""));
    if (!args) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    try {
      const session = await startDevServer(args);
      res.json({ session });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Preview start failed",
      });
    }
  });

  app.post("/api/vibe/preview/restart", async (req, res) => {
    const args = await getPreviewProjectArgs(String(req.body?.projectId ?? ""));
    if (!args) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    try {
      const session = await restartDevServer(args);
      res.json({ session });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Preview restart failed",
      });
    }
  });

  app.post("/api/vibe/preview/stop", async (req, res) => {
    const projectId = safeProjectId(String(req.body?.projectId ?? ""));
    const session = await stopDevServer(projectId);
    res.json({ session });
  });

  app.post("/api/vibe/preview/refresh", async (req, res) => {
    const projectId = safeProjectId(String(req.body?.projectId ?? ""));
    const session = await refreshPreview(projectId);
    res.json({ session });
  });

  app.get("/api/vibe/preview/status/:id", async (req, res) => {
    const projectId = safeProjectId(req.params.id);
    const session = getPreviewSession(projectId);
    res.json({ session });
  });

  app.get("/api/vibe/preview/logs/:id", async (req, res) => {
    const projectId = safeProjectId(req.params.id);
    res.json({ logs: getPreviewLogs(projectId) });
  });

  // AI Clipper
  app.post("/api/clipper/start", async (req, res) => {
    const { url, config: cfg } = req.body || {};
    if (!url) { res.status(400).json({ error: "YouTube URL required" }); return; }
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    const send = (type, data) => { res.write(`data: ${JSON.stringify({ type, ...data })}

`); };
    const scriptPath = path.join(process.cwd(), "clipper-pipeline.py");
    const homeBin = path.join(homedir(), "bin");
    send("progress", { step: "captions", status: "running", message: "Starting..." });
    const proc = spawn("python3", [scriptPath, url, JSON.stringify(cfg || {})], {
      env: { ...process.env, PYTHONUNBUFFERED: "1", PATH: `${process.env.PATH || ""}:${homeBin}` },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let buf = "";
    proc.stdout.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const line of lines) {
        const t = line.trim(); if (!t) continue;
        try { const d = JSON.parse(t); send(d.type || "progress", d); }
        catch { send("log", { message: t }); }
      }
    });
    proc.stderr.on("data", (chunk) => { send("log", { message: chunk.toString().trim() }); });
    proc.on("close", (code) => {
      if (code !== 0) send("error", { message: `Pipeline failed code ${code}` });
      res.end();
    });
    proc.on("error", (err) => { send("error", { message: err.message }); res.end(); });
  });
  app.use("/output", express.static(path.join(process.cwd(), "output"), {
    setHeaders: (res) => { res.setHeader("Content-Type", "video/mp4"); res.setHeader("Accept-Ranges", "bytes"); },
    fallthrough: false
  }));

  app.get("/api/clipper/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename || "");
    if (!/^[\w.-]+\.mp4$/i.test(filename)) {
      res.status(400).json({ error: "Invalid clip filename" });
      return;
    }

    const filePath = path.join(process.cwd(), "output", filename);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "Clip not found" });
      return;
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.sendFile(filePath);
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const hmrPort = Number(process.env.HMR_PORT) || 24678;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          host: "localhost",
          port: hmrPort,
          clientPort: hmrPort,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  if (process.env.DISABLE_VIBE_SERVER !== "true") {
    startVibeServer(VIBE_PORT).catch((error) => {
      console.error("Failed to start Vibe sandbox server:", error);
    });
  }
}

startServer();
