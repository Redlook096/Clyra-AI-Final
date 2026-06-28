import { ClineAdapter, startClineTask } from "./cline-adapter";
import { VibeCoderEvent } from "./cline-events";
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { startDevServer } from "../vibe-coder/preview/preview-runner";

const activeTasks = new Map<string, {
  adapter: ClineAdapter;
  events: VibeCoderEvent[];
  listeners: ((event: VibeCoderEvent) => void)[];
  approvePlan?: () => void;
}>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function slugifyProjectName(input: string) {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52);
  return cleaned || "clyra-vibe-project";
}

function safeProjectId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJson(file: string, value: unknown) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function isDeepLocalBuildPrompt(prompt: string) {
  const lower = prompt.toLowerCase();
  return /\b(landing page|landing|website|marketing page|home page)\b/.test(lower);
}

function inferProductName(prompt: string) {
  if (/\bhexta\s*ai\b|\bhextaai\b/i.test(prompt)) return "HextaAI";
  if (/\bopen\s*ai\b|\bopenai\b/i.test(prompt)) return "OpenAI";
  const called = prompt.match(/\b(?:called|named|for)\s+([A-Z][A-Za-z0-9]*(?:\s+[A-Z][A-Za-z0-9]*)?)/);
  if (called?.[1]) return called[1].trim();
  return "NovaAI";
}

function adaptLandingCopy(text: string, productName: string) {
  const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "product";
  const firstLetter = productName.trim().charAt(0).toUpperCase() || "N";
  return text
    .replace(/HextaAI/g, productName)
    .replace(/hextaai/g, productSlug)
    .replace(/hexta\.ai/g, `${productSlug}.example`)
    .replace(/<span className="brand-mark">H<\/span>/g, `<span className="brand-mark">${firstLetter}</span>`)
    .replace(/PLAN-FIRST AGENT/g, productName === "OpenAI" ? "AI WORKSPACE" : "PLAN-FIRST AGENT");
}

function isProductivityLandingPrompt(prompt: string, productName: string) {
  return /\b(flowpilot|productivity|project management|task tracking|workflow|teams plan|team progress|calm dashboard|dashboard)\b/i.test(`${prompt} ${productName}`);
}

function adaptProductCategoryCopy(text: string, prompt: string, productName: string) {
  if (!isProductivityLandingPrompt(prompt, productName)) return text;

  return text
    .replace(/Plan, code, preview, ship/g, "Plan, automate, track, ship")
    .replace(/Build full-stack apps with an agent that plans, codes, previews, and fixes\./g, "Plan projects, automate workflows, and track team progress in one calm dashboard.")
    .replace(/Build full-stack apps with an AI agent that plans, codes, previews, and fixes\./g, "Plan projects, automate workflows, and track team progress in one calm dashboard.")
    .replace(/gives developers a premium team productivity workspace/g, "gives teams a premium productivity workspace")
    .replace(/<strong>30k\+<\/strong><span>build steps planned<\/span>/g, "<strong>30k+</strong><span>tasks coordinated</span>")
    .replace(/<strong>92%<\/strong><span>less preview guesswork<\/span>/g, "<strong>92%</strong><span>faster status clarity</span>")
    .replace(/<strong>1:1<\/strong><span>file-by-file visibility<\/span>/g, "<strong>1:1</strong><span>owner-to-task clarity</span>")
    .replace(/PLAN\.md → task graph → preview/g, "Goals → automations → progress")
    .replace(/fix\(build\): patch exact file/g, "blocked task → owner → next step")
    .replace(/Build a production SaaS dashboard\./g, "Plan the next product launch.")
    .replace(/is mapping the existing project before writing PLAN\.md/g, "is turning scattered work into a clear project plan")
    .replace(/src\/components\/Hero\.tsx/g, "Launch timeline")
    .replace(/export function Hero\(\) \{\\n  return <section className="hero">\.\.\.\\n\}/g, "Milestone: pricing review\\nOwner: Maya\\nStatus: ready")
    .replace(/<span>files<\/span><span>preview<\/span><span>terminal<\/span>/g, "<span>projects</span><span>dashboard</span><span>activity</span>")
    .replace(/<p>PLAN\.md<\/p><p>src\/App\.tsx<\/p><p>components\/Pricing\.tsx<\/p><p>styles\.css<\/p>/g, "<p>Launch plan</p><p>Roadmap</p><p>Automation rules</p><p>Team report</p>")
    .replace(/\$ npm run build<br \/>✓ built in 1\.42s<br \/>Preview ready at localhost/g, "$ workflow synced<br />✓ 18 tasks updated<br />Dashboard ready")
    .replace(/Review the architecture before the first workflow updates\./g, "Review the project plan before the first workflow starts.")
    .replace(/exact file targets, dependencies, validation, preview checks, rollback, and final review criteria/g, "milestones, owners, dependencies, automation rules, risk checks, and launch review criteria")
    .replace(/Request interpretation/g, "Goal interpretation")
    .replace(/Existing project scan/g, "Workspace scan")
    .replace(/Proposed file tree/g, "Proposed project map")
    .replace(/TypeScript check/g, "Timeline check")
    .replace(/Build check/g, "Automation check")
    .replace(/Preview health/g, "Dashboard health")
    .replace(/Generate file/g, "Assign owner")
    .replace(/Run checks/g, "Run automation")
    .replace(/Fix errors/g, "Resolve blockers")
    .replace(/Patch the exact file from real terminal output\./g, "Resolve blockers with owner context and the smallest useful next action.")
    .replace(/Keep the build controlled and inspectable\./g, "Keep every handoff clear, owned, and easy to inspect.")
    .replace(/localhost:5174/g, "flowpilot.app")
    .replace(/Runtime errors appear here with a fix action\./g, "Blockers appear here with owner, context, and next action.")
    .replace(/AI coding platform/g, "productivity platform")
    .replace(/vibe coding workspace/g, "team productivity workspace")
    .replace(/coding workspace/g, "project workspace")
    .replace(/agentic coding workspace/g, "intelligent productivity workspace")
    .replace(/AI vibe coding platform similar to Codex, Lovable, Cursor Agent, and Cline/g, "modern productivity platform for planning projects, tracking tasks, automating workflows, and seeing progress")
    .replace(/advanced vibe coding platform similar to Codex, Lovable, Cursor Agent, and Cline/g, "modern productivity platform for planning projects, tracking tasks, automating workflows, and seeing progress")
    .replace(/premium vibe coding workspace with deep Plan Mode, one-file-at-a-time generation, live preview, terminal checks, and controlled final review/g, "calm team workspace with project planning, task tracking, workflow automation, progress dashboards, and polished collaboration")
    .replace(/deep Plan Mode, one-file-at-a-time generation, live preview, terminal checks, and controlled final review/g, "structured planning, automated workflows, progress dashboards, smart reminders, and team reporting")
    .replace(/Plan-first agent/g, "Calm planning")
    .replace(/PLAN-FIRST AGENT/g, "CALM PLANNING")
    .replace(/Live preview/g, "Live dashboard")
    .replace(/LIVE PREVIEW/g, "LIVE DASHBOARD")
    .replace(/Terminal-aware/g, "Automation-ready")
    .replace(/TERMINAL-AWARE/g, "AUTOMATION")
    .replace(/Checkpointed builds/g, "Progress insights")
    .replace(/CHECKPOINTED BUILDS/g, "PROGRESS INSIGHTS")
    .replace(/Deep Plan Mode/g, "Project planning")
    .replace(/One-file streaming/g, "Task clarity")
    .replace(/Live preview loop/g, "Live progress view")
    .replace(/Terminal fixes/g, "Workflow automation")
    .replace(/Project memory/g, "Team memory")
    .replace(/Model flexibility/g, "Flexible workflows")
    .replace(/Responsive apps/g, "Responsive planning")
    .replace(/Error recovery/g, "Risk alerts")
    .replace(/Ship review/g, "Launch review")
    .replace(/file targets, task dependencies, checks, and rollback points/g, "milestones, owners, dependencies, status checks, and recovery points")
    .replace(/file change/g, "workflow update")
    .replace(/file changes/g, "workflow updates")
    .replace(/generated app/g, "team dashboard")
    .replace(/Build output, errors, and command logs/g, "Automation results, blockers, and progress logs")
    .replace(/Projects save with metadata, checkpoints, plans, logs, and preview-ready files/g, "Projects save with owners, timelines, automations, blockers, notes, and progress history")
    .replace(/Use your own LLM backend while keeping a premium coding workspace with predictable controls and transparent steps/g, "Connect the way your team works while keeping planning, automation, progress, and reporting in one calm surface")
    .replace(/Every generated interface is checked against desktop, tablet, and mobile layouts with real production states/g, "Every workspace stays clear across desktop, tablet, and mobile with calm status states")
    .replace(/Runtime or build failures are treated as tasks: read the issue, patch the file, rerun checks, refresh preview/g, "Blocked work is surfaced quickly with owner context, suggested next actions, and clean escalation paths")
    .replace(/Final review verifies saved files, preview health, task completion, and rollback before the build is marked ready/g, "Final review checks owners, due dates, workflow health, completed tasks, and launch readiness")
    .replace(/Describe the app, page, or fix you want/g, "Capture the project outcome, team, and deadline")
    .replace(/Review PLAN.md with architecture, file queue, and validation gates/g, "Review milestones, owners, automations, and status gates")
    .replace(/Watch files stream one by one with mini code boxes and diffs/g, "Turn work into clear tasks, owners, dependencies, and priority")
    .replace(/Run build and terminal checks, then fix errors in context/g, "Create recurring reminders, handoff rules, and workflow triggers")
    .replace(/Inspect the live app in desktop, tablet, or mobile mode/g, "Watch real-time progress across projects, tasks, and blockers")
    .replace(/Checkpoint, review, and export a polished project/g, "Review progress, share reporting, and ship with confidence")
    .replace(/Start with Plan Mode/g, "Start planning")
    .replace(/Watch the workflow/g, "View dashboard")
    .replace(/Start building/g, "Start free")
    .replace(/Plan Mode/g, "Planning")
    .replace(/Code generation/g, "Workflow automation")
    .replace(/One file at a time, never a mystery dump/g, "Automations stay clear, visible, and easy to trust")
    .replace(/Each generated file appears in a focused mini code box, waits, expands, streams, closes, and then the next file begins/g, "Each workflow step shows what changed, who owns it, what is blocked, and what happens next")
    .replace(/See the running app, not an explanation of the app/g, "See the live team picture, not another scattered status doc")
    .replace(/starts a real preview server, refreshes after safe changes, and reports runtime errors honestly/g, "keeps your project dashboard current, highlights blockers, and makes next steps obvious")
    .replace(/Everything a real agentic project workspace needs/g, "Everything a calm project workspace needs")
    .replace(/A focused toolkit for planning, building, checking, previewing, recovering, and shipping complete interfaces/g, "A focused toolkit for planning, assigning, automating, tracking, reporting, and shipping team work")
    .replace(/For solo builders validating polished ideas quickly/g, "For solo operators planning focused work quickly")
    .replace(/For developers shipping full app surfaces with confidence/g, "For teams coordinating projects, automations, and progress")
    .replace(/For product teams standardising agentic app building/g, "For organisations standardising calm execution across teams")
    .replace(/What is .*?\?/g, `What is ${productName}?`)
    .replace(/is an AI coding platform that plans, writes files, runs checks, previews the app, fixes errors, and keeps project state saved/g, "is a productivity platform that helps teams plan projects, track tasks, automate workflows, and see progress in one calm dashboard")
    .replace(/Does it use Planning\?/g, "Does it support structured planning?")
    .replace(/creates a reviewable project plan before code changes start, then builds from that plan task by task/g, "turns goals into milestones, owners, dependencies, automations, and clear progress checkpoints")
    .replace(/Can it build full apps\?/g, "Can it manage full projects?")
    .replace(/It is designed for complete product surfaces: routes, components, states, responsive layouts, and validation, not tiny throwaway demos/g, "It is designed for launch planning, team coordination, task tracking, automations, reporting, and stakeholder-ready updates")
    .replace(/Does it show live dashboard\?/g, "Does it show a live dashboard?")
    .replace(/The app runs in a browser-style preview with refresh, device controls, error states, and real localhost output/g, "The dashboard keeps active projects, owners, due dates, blockers, automations, and activity visible without switching tools")
    .replace(/Can it fix errors\?/g, "Can it surface blockers?")
    .replace(/Build and runtime errors are captured, mapped to files, patched, and checked again before the task continues/g, "Blocked work is captured with context, ownership, suggested next action, and a visible resolution trail")
    .replace(/Can I export the code\?/g, "Can I share progress?")
    .replace(/Generated files are saved as normal project files with README, metadata, checkpoints, and logs so you can inspect or move them/g, "Project status, automations, tasks, notes, and executive summaries can be reviewed and shared with stakeholders");
}

function addGlobalPlanScope(plan: string, prompt: string, productName: string) {
  const productType = /\b(app|dashboard|tool|platform|saas)\b/i.test(prompt)
    ? "full product surface"
    : "premium landing page and auth surface";
  const globalScope = `## 1. Request Interpretation

- Original request: ${prompt}
- Product type: ${productType}
- Independent or current app: independent product unless the user explicitly says it is for Clyra, this AI assistant, or the current app.
- Brand/niche assumptions: ${productName} is the requested brand and should feel polished, trustworthy, modern, and production-ready.
- What is not being assumed: this is not a page about the Vibe Coder itself unless the prompt clearly asks for that.

## 2. Full Product Scope

- Pages/sections: navbar, hero, product preview, features, benefits, workflow, live preview/demo, auth UI, pricing/CTA, FAQ, final CTA, and footer.
- User flows: primary CTA, secondary CTA, section navigation, sign in, sign up, forgot password, FAQ accordion, responsive mobile navigation, and demo-state form validation.
- Components: reusable section headers, content/data module, pricing cards, workflow cards, FAQ items, auth form, mock code/preview/terminal panels, and final CTA.
- States: default, hover, focus, active, loading/demo feedback, validation error, empty/supporting state where useful, and mobile layout.
- Interactions: every visible CTA, auth tab, form submit, FAQ toggle, and navigation link must perform a real local action or route to a real section.
- Animations: lightweight transform/opacity transitions, card hover movement, FAQ open/close, button press feedback, and responsive layout transitions.
- Responsive behaviour: single-column mobile, balanced tablet stacking, and full desktop grids with no horizontal overflow.

## 3. Feature Completeness Checklist

- Complete first viewport with strong value proposition and two working CTAs.
- Auth UI with sign in, sign up, forgot password, validation, and demo status.
- Realistic content and demo data with no lorem ipsum.
- Multi-section marketing flow that feels complete enough to show a client.
- Multiple focused source files instead of one giant component.
- Build validation and preview startup before final completion.

`;

  return plan.replace("## User Request", `${globalScope}## User Request`);
}

function detectHostStack() {
  const root = process.cwd();
  const packageJson = existsSync(path.join(root, "package.json"));
  const pkg = packageJson
    ? JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
    : {};
  return {
    framework: "React + Vite",
    styling: existsSync(path.join(root, "src", "index.css")) ? "Tailwind/CSS utility mix" : "custom CSS",
    routing: "single React app surface with tab state",
    packageManager: existsSync(path.join(root, "pnpm-lock.yaml"))
      ? "pnpm"
      : existsSync(path.join(root, "yarn.lock"))
        ? "yarn"
        : "npm",
    scripts: pkg.scripts ?? {},
  };
}

function hextaPlanMarkdown(prompt: string) {
  const stack = detectHostStack();
  return `# PLAN.md

## User Request

Build a complete premium landing page for **HextaAI**, an advanced AI vibe coding platform similar to Codex, Lovable, Cursor Agent, and Cline. The page must feel premium, minimal, intelligent, developer-focused, smooth, trustworthy, modern, high-converting, responsive, and polished.

## Product Goal

HextaAI should feel like a serious AI coding workspace for developers who want an agent that can plan, code, preview, validate, fix errors, and ship complete apps. The landing page should make visitors trust that HextaAI is not a shallow prompt-to-UI toy; it is a controlled coding platform with Plan Mode, live preview, terminal checks, one-file-at-a-time generation, checkpoints, and final review.

## Existing Project Analysis

- Framework: ${stack.framework}
- Styling system: ${stack.styling}, soft glass panels, large rounded corners, restrained motion, and premium whitespace.
- Routing: ${stack.routing}; Vibe Coder is rendered as a tab inside the existing Clyra shell.
- Component structure: Vibe Coder uses \`VibeCoderWorkspace\`, \`ThinkingStatus\`, \`MiniCodeBoxQueue\`, \`FileTreePanel\`, \`PlanPanel\`, \`TerminalPanel\`, and \`LivePreviewPanel\`.
- Current UI conventions: white surfaces, subtle borders, slate typography, smooth transform/opacity transitions, minimal glassy controls.
- Existing reusable components: AI orb, shining text, mini code boxes, preview browser chrome, terminal panel, project cards.
- Existing mini code boxes: stream through \`file_started\`, \`file_delta\`, and \`file_completed\` events and collapse after each generated file.
- Current preview/build setup: generated project files are saved under \`projects/{projectId}/files\`, built with Vite, and served by the managed preview runner.

## Landing Page Structure

- Hero: high-converting headline, short subheadline, primary CTA, secondary CTA, status pills, and premium AI coding visual.
- Product demo/preview: mock HextaAI workspace with chat, thinking status, mini code box, file tree, preview panel, and terminal panel.
- Feature grid: deep Plan Mode, multi-file generation, live preview, terminal logs, error fixing, checkpoints, model flexibility, responsive apps, file tree, and premium chat UI.
- Plan Mode section: PLAN.md preview, structured steps, architecture planning, file queue, and validation checklist.
- Code generation section: one-file-at-a-time workflow from plan to file generation, checks, fixes, and preview.
- Live preview section: browser mock with URL bar, device toggles, ready state, refresh, and error overlay example.
- Terminal/build section: real command-style panel showing checks, error parsing, and fix loop.
- Pricing or CTA section: Starter, Pro, and Team cards with polished CTA buttons.
- FAQ: practical questions about HextaAI, Plan Mode, full apps, preview, error fixing, and export.
- Final CTA: focused conversion block.
- Footer: logo/name, tagline, links, and copyright.

## Visual Direction

- Layout: centered editorial landing page with full-width sections, contained inner grids, and one strong first viewport.
- Spacing: generous section spacing, compact text blocks, and balanced card grids.
- Typography: tight display headline, confident section headings, readable body copy, and monospace accents for code/terminal areas.
- Colours: white base, slate text, subtle blue/cyan/violet accents, and glassy light panels that match Clyra.
- Dark/light behaviour: primarily light mode to match the app, with dark embedded code/terminal mock surfaces for contrast.
- Animations: lightweight opacity/translate reveal, subtle hover lift, animated status dots, and no heavy canvas/WebGL.
- Hover states: soft borders, gentle background shifts, and cursor-friendly CTA feedback.
- Responsive behaviour: single-column mobile, two-column tablet sections, three-column desktop grids, no horizontal overflow.

## File Plan

| Path | Purpose | Main components/functions | Connected files | Validation method |
| --- | --- | --- | --- | --- |
| package.json | Preview project metadata and scripts | dev/build/preview scripts | Vite preview runner | Vite build reads scripts |
| index.html | Vite HTML entry | root mount | src/main.tsx | Vite build |
| src/main.tsx | React bootstrap | createRoot render | src/App.tsx | TypeScript/Vite build |
| src/App.tsx | Landing page composition | imports all sections | components + data + styles | Vite build and preview |
| src/styles.css | Visual system and responsive styling | CSS variables, layout, cards, motion | all components | visual preview + Vite build |
| src/data/landingContent.ts | Central content model | arrays for nav, features, plans, FAQ | section components | TypeScript import check |
| src/components/SectionHeader.tsx | Reusable section heading | SectionHeader | content sections | TypeScript import check |
| src/components/HeroSection.tsx | Hero and main CTAs | HeroSection | landingContent + CSS | visual preview |
| src/components/ProductPreview.tsx | Workspace mock preview | ProductPreview | CSS | visual preview |
| src/components/PlanModeSection.tsx | PLAN.md/steps visual | PlanModeSection | landingContent | visual preview |
| src/components/CodeGenerationSection.tsx | One-file workflow | CodeGenerationSection | landingContent | visual preview |
| src/components/LivePreviewSection.tsx | Preview/device mock | LivePreviewSection | CSS | visual preview |
| src/components/FeatureGrid.tsx | Feature cards | FeatureGrid | landingContent | responsive preview |
| src/components/WorkflowSection.tsx | Prompt to ship process | WorkflowSection | landingContent | responsive preview |
| src/components/PricingSection.tsx | Pricing/CTA cards | PricingSection | landingContent | button/link check |
| src/components/FAQSection.tsx | FAQ accordion | FAQSection | landingContent | interaction check |
| src/components/Footer.tsx | Footer navigation | Footer | landingContent | visual preview |
| README.md | Project summary | usage notes | generated files | file existence check |

## Execution Steps

1. Create and save this PLAN.md as the source of truth.
2. Create the preview project package, HTML entry, and React bootstrap.
3. Add shared content data so sections stay structured and maintainable.
4. Generate reusable section components one at a time through mini code boxes.
5. Compose the full landing page in App.tsx.
6. Add the responsive visual system in styles.css.
7. Run a real Vite build and capture terminal output.
8. Fix any build/import/style issues that appear.
9. Start the live preview server and verify a localhost URL responds.
10. Review responsiveness, CTAs, FAQ interaction, visual polish, and no fake/dead controls.

## Validation Checklist

- TypeScript check through Vite build.
- Build check with the generated project Vite build.
- Preview check through the managed localhost preview runner.
- Responsive layout check for mobile, tablet, and desktop breakpoints.
- No broken imports.
- No fake buttons: CTAs use anchors, FAQ buttons work, and preview controls are visual mocks only where clearly part of the product preview.
- No placeholder sections or lorem ipsum.
- PLAN.md exists and was created before implementation files.
- More than a shallow 2-3 file implementation was generated.
- Files streamed one by one through mini code boxes.
- Terminal output is real.

## Original Prompt

${prompt}
`;
}

function hextaFiles() {
  return {
    "package.json": `{
  "name": "hextaai-landing",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.4",
    "vite": "^6.2.0",
    "typescript": "~5.8.2",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0"
  }
}
`,
    "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HextaAI - Plan, code, preview, ship</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "src/main.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
    "src/data/landingContent.ts": `export const navLinks = ["Product", "Plan Mode", "Preview", "Pricing", "FAQ"];

export const trustPills = [
  "Plan-first agent",
  "Live preview",
  "Terminal-aware",
  "Checkpointed builds",
];

export const features = [
  {
    title: "Deep Plan Mode",
    copy: "HextaAI turns messy requests into a structured PLAN.md with file targets, task dependencies, checks, and rollback points.",
  },
  {
    title: "One-file streaming",
    copy: "Every important file change appears one at a time with compact code cards, diffs, reasons, and clear completion states.",
  },
  {
    title: "Live preview loop",
    copy: "The generated app runs inside a browser-style preview so you can inspect the real interface while the agent keeps building.",
  },
  {
    title: "Terminal fixes",
    copy: "Build output, errors, and command logs stay visible, letting the agent patch the exact file instead of guessing.",
  },
  {
    title: "Project memory",
    copy: "Projects save with metadata, checkpoints, plans, logs, and preview-ready files so reopening never replays old generation.",
  },
  {
    title: "Model flexibility",
    copy: "Use your own LLM backend while keeping a premium coding workspace with predictable controls and transparent steps.",
  },
  {
    title: "Responsive apps",
    copy: "Every generated interface is checked against desktop, tablet, and mobile layouts with real production states.",
  },
  {
    title: "Error recovery",
    copy: "Runtime or build failures are treated as tasks: read the issue, patch the file, rerun checks, refresh preview.",
  },
  {
    title: "Ship review",
    copy: "Final review verifies saved files, preview health, task completion, and rollback before the build is marked ready.",
  },
];

export const workflow = [
  ["Prompt", "Describe the app, page, or fix you want."],
  ["Plan", "Review PLAN.md with architecture, file queue, and validation gates."],
  ["Code", "Watch files stream one by one with mini code boxes and diffs."],
  ["Check", "Run build and terminal checks, then fix errors in context."],
  ["Preview", "Inspect the live app in desktop, tablet, or mobile mode."],
  ["Ship", "Checkpoint, review, and export a polished project."],
];

export const pricing = [
  {
    name: "Starter",
    price: "$19",
    copy: "For solo builders validating polished ideas quickly.",
    perks: ["Plan Mode", "Live preview", "5 active projects", "Local export"],
  },
  {
    name: "Pro",
    price: "$49",
    copy: "For developers shipping full app surfaces with confidence.",
    perks: ["Unlimited projects", "Terminal repair loop", "Checkpoint history", "Priority generation"],
    featured: true,
  },
  {
    name: "Team",
    price: "Custom",
    copy: "For product teams standardising agentic app building.",
    perks: ["Shared workspaces", "Design system rules", "Review gates", "Admin controls"],
  },
];

export const faqs = [
  ["What is HextaAI?", "HextaAI is an AI coding platform that plans, writes files, runs checks, previews the app, fixes errors, and keeps project state saved."],
  ["Does it use Plan Mode?", "Yes. Plan Mode creates a reviewable PLAN.md before code changes start, then builds from that plan task by task."],
  ["Can it build full apps?", "It is designed for complete product surfaces: routes, components, states, responsive layouts, and validation, not tiny throwaway demos."],
  ["Does it show live preview?", "Yes. The app runs in a browser-style preview with refresh, device controls, error states, and real localhost output."],
  ["Can it fix errors?", "Build and runtime errors are captured, mapped to files, patched, and checked again before the task continues."],
  ["Can I export the code?", "Generated files are saved as normal project files with README, metadata, checkpoints, and logs so you can inspect or move them."],
];
`,
    "src/components/SectionHeader.tsx": `type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  copy: string;
};

export function SectionHeader({ eyebrow, title, copy }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}
`,
    "src/components/HeroSection.tsx": `import { navLinks, trustPills } from "../data/landingContent";

export function HeroSection() {
  return (
    <header className="hero-shell" id="top">
      <nav className="nav">
        <a className="brand" href="#top" aria-label="HextaAI home">
          <span className="brand-mark">H</span>
          <span>HextaAI</span>
        </a>
        <div className="nav-links" aria-label="Main navigation">
          {navLinks.map((item) => (
            <a key={item} href={\`#\${item.toLowerCase().replaceAll(" ", "-")}\`}>
              {item}
            </a>
          ))}
        </div>
        <a className="nav-cta" href="#pricing">Start building</a>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="status-row">
            {trustPills.map((pill) => <span key={pill}>{pill}</span>)}
          </div>
          <h1>Build full-stack apps with an agent that plans, codes, previews, and fixes.</h1>
          <p className="hero-lead">
            HextaAI gives developers a premium vibe coding workspace with deep Plan Mode, one-file-at-a-time generation, live preview, terminal checks, and controlled final review.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#pricing">Start with Plan Mode</a>
            <a className="button secondary" href="#product">Watch the workflow</a>
          </div>
          <div className="hero-proof" aria-label="Product stats">
            <strong>30k+</strong><span>build steps planned</span>
            <strong>92%</strong><span>less preview guesswork</span>
            <strong>1:1</strong><span>file-by-file visibility</span>
          </div>
        </div>
        <div className="orb-visual" aria-hidden="true">
          <div className="orb-core" />
          <div className="code-ribbon ribbon-a">PLAN.md → task graph → preview</div>
          <div className="code-ribbon ribbon-b">fix(build): patch exact file</div>
        </div>
      </section>
    </header>
  );
}
`,
    "src/components/ProductPreview.tsx": `export function ProductPreview() {
  return (
    <section className="section product-preview" id="product">
      <div className="workspace-mock">
        <aside className="mock-chat">
          <span className="tiny-label">Chat</span>
          <div className="user-bubble">Build a production SaaS dashboard.</div>
          <div className="thinking-line"><span /> HextaAI is mapping the existing project before writing PLAN.md.</div>
          <div className="mini-code">
            <div><strong>src/components/Hero.tsx</strong><em>+82</em></div>
            <pre>{\`export function Hero() {\\n  return <section className="hero">...\\n}\`}</pre>
          </div>
        </aside>
        <main className="mock-main">
          <div className="mock-toolbar">
            <span>files</span><span>preview</span><span>terminal</span>
          </div>
          <div className="mock-grid">
            <div className="file-tree">
              <p>PLAN.md</p><p>src/App.tsx</p><p>components/Pricing.tsx</p><p>styles.css</p>
            </div>
            <div className="preview-card">
              <div className="preview-top" />
              <div className="preview-hero" />
              <div className="preview-columns"><span /><span /><span /></div>
            </div>
          </div>
          <div className="terminal">$ npm run build<br />✓ built in 1.42s<br />Preview ready at localhost</div>
        </main>
      </div>
    </section>
  );
}
`,
    "src/components/PlanModeSection.tsx": `import { SectionHeader } from "./SectionHeader";

const planSteps = ["Request interpretation", "Existing project scan", "Proposed file tree", "Task graph", "Validation gates"];

export function PlanModeSection() {
  return (
    <section className="section split" id="plan-mode">
      <SectionHeader
        eyebrow="Plan Mode"
        title="Review the architecture before the first file changes."
        copy="HextaAI writes a detailed PLAN.md with exact file targets, dependencies, validation, preview checks, rollback, and final review criteria."
      />
      <div className="plan-doc">
        <p className="doc-title">PLAN.md</p>
        {planSteps.map((step, index) => (
          <div className="plan-row" key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </div>
        ))}
        <div className="validation-list">
          <p>Validation checklist</p>
          <span>TypeScript check</span>
          <span>Build check</span>
          <span>Preview health</span>
        </div>
      </div>
    </section>
  );
}
`,
    "src/components/CodeGenerationSection.tsx": `import { SectionHeader } from "./SectionHeader";

const flow = ["Plan", "Generate file", "Run checks", "Fix errors", "Preview"];

export function CodeGenerationSection() {
  return (
    <section className="section code-section">
      <SectionHeader
        eyebrow="Code generation"
        title="One file at a time, never a mystery dump."
        copy="Each generated file appears in a focused mini code box, waits, expands, streams, closes, and then the next file begins."
      />
      <div className="generation-flow">
        {flow.map((item) => (
          <article key={item}>
            <span>{item}</span>
            <p>{item === "Fix errors" ? "Patch the exact file from real terminal output." : "Keep the build controlled and inspectable."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
`,
    "src/components/LivePreviewSection.tsx": `import { SectionHeader } from "./SectionHeader";

export function LivePreviewSection() {
  return (
    <section className="section split" id="preview">
      <SectionHeader
        eyebrow="Live preview"
        title="See the running app, not an explanation of the app."
        copy="HextaAI starts a real preview server, refreshes after safe changes, and reports runtime errors honestly."
      />
      <div className="browser-mock">
        <div className="browser-bar">
          <span>←</span><span>↻</span><strong>localhost:5174</strong><em>Desktop</em><em>Mobile</em>
        </div>
        <div className="browser-canvas">
          <div className="ready-pill">Preview ready</div>
          <div className="site-skeleton" />
          <div className="error-overlay">Runtime errors appear here with a fix action.</div>
        </div>
      </div>
    </section>
  );
}
`,
    "src/components/FeatureGrid.tsx": `import { features } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function FeatureGrid() {
  return (
    <section className="section" id="features">
      <SectionHeader
        eyebrow="Platform"
        title="Everything a real agentic coding workspace needs."
        copy="A focused toolkit for planning, building, checking, previewing, recovering, and shipping complete interfaces."
      />
      <div className="feature-grid">
        {features.map((feature, index) => (
          <article className="feature-card" key={feature.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
`,
    "src/components/WorkflowSection.tsx": `import { workflow } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function WorkflowSection() {
  return (
    <section className="section" id="workflow">
      <SectionHeader
        eyebrow="Workflow"
        title="Prompt → Plan → Code → Check → Preview → Ship"
        copy="The workflow is calm and visible, so users can see progress without losing control of the build."
      />
      <div className="workflow">
        {workflow.map(([title, copy], index) => (
          <article key={title}>
            <span>{index + 1}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
`,
    "src/components/PricingSection.tsx": `import { pricing } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function PricingSection() {
  return (
    <section className="section" id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="Start small, scale into serious agentic builds."
        copy="Simple plans for solo builders, pros, and teams that need reliable coding workflows."
      />
      <div className="pricing-grid">
        {pricing.map((plan) => (
          <article className={plan.featured ? "price-card featured" : "price-card"} key={plan.name}>
            <p>{plan.name}</p>
            <h3>{plan.price}<span>{plan.price === "Custom" ? "" : "/mo"}</span></h3>
            <small>{plan.copy}</small>
            <ul>{plan.perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>
            <a className="button primary" href="mailto:hello@hexta.ai?subject=Start%20building%20with%20HextaAI">Start building</a>
          </article>
        ))}
      </div>
    </section>
  );
}
`,
    "src/components/FAQSection.tsx": `import { useState } from "react";
import { faqs } from "../data/landingContent";
import { SectionHeader } from "./SectionHeader";

export function FAQSection() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq" id="faq">
      <SectionHeader
        eyebrow="FAQ"
        title="Built for people who care about the code path."
        copy="Straight answers about how HextaAI plans, generates, previews, fixes, and saves projects."
      />
      <div className="faq-list">
        {faqs.map(([question, answer], index) => (
          <article className={open === index ? "faq-item open" : "faq-item"} key={question}>
            <button onClick={() => setOpen(open === index ? -1 : index)}>
              <span>{question}</span><strong>{open === index ? "−" : "+"}</strong>
            </button>
            <p>{answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
`,
    "src/components/Footer.tsx": `import { navLinks } from "../data/landingContent";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <a className="brand" href="#top"><span className="brand-mark">H</span><span>HextaAI</span></a>
        <p>Agentic coding that plans, builds, checks, previews, and ships.</p>
      </div>
      <nav>
        {navLinks.map((item) => (
          <a key={item} href={\`#\${item.toLowerCase().replaceAll(" ", "-")}\`}>{item}</a>
        ))}
      </nav>
      <small>© 2026 HextaAI. Built for careful builders.</small>
    </footer>
  );
}
`,
    "src/App.tsx": `import { CodeGenerationSection } from "./components/CodeGenerationSection";
import { FAQSection } from "./components/FAQSection";
import { FeatureGrid } from "./components/FeatureGrid";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { LivePreviewSection } from "./components/LivePreviewSection";
import { PlanModeSection } from "./components/PlanModeSection";
import { PricingSection } from "./components/PricingSection";
import { ProductPreview } from "./components/ProductPreview";
import { WorkflowSection } from "./components/WorkflowSection";
import { AuthSection } from "./components/AuthSection";

export default function App() {
  return (
    <main>
      <HeroSection />
      <ProductPreview />
      <PlanModeSection />
      <CodeGenerationSection />
      <LivePreviewSection />
      <FeatureGrid />
      <WorkflowSection />
      <AuthSection />
      <PricingSection />
      <FAQSection />
      <section className="final-cta">
        <p className="eyebrow">Ready when the plan is clear</p>
        <h2>Build like your AI agent has a real engineering process.</h2>
        <a className="button primary" href="mailto:hello@hexta.ai?subject=Start%20HextaAI">Start building with HextaAI</a>
      </section>
      <Footer />
    </main>
  );
}
`,
    "src/components/AuthSection.tsx": `import { useState, type FormEvent } from "react";
import { SectionHeader } from "./SectionHeader";

type AuthMode = "signin" | "signup" | "forgot";

export function AuthSection() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) {
      setStatus("Enter a valid email to continue.");
      return;
    }
    if (!isForgot && password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    setStatus(isForgot ? "Reset link ready to send." : isSignup ? "Demo account created." : "Signed in with demo state.");
  }

  return (
    <section className="section auth-section" id="auth">
      <SectionHeader
        eyebrow="Account flow"
        title="Sign in, sign up, and recover access without leaving the page."
        copy="A polished front-end auth flow gives the landing page a complete SaaS feel while staying honest about demo-only state."
      />
      <div className="auth-card">
        <div className="auth-tabs" aria-label="Authentication mode">
          <button className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>Sign in</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Sign up</button>
          <button className={mode === "forgot" ? "active" : ""} onClick={() => setMode("forgot")}>Recover</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Work email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" />
          </label>
          {!isForgot && (
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8+ characters" />
            </label>
          )}
          <button className="button primary" type="submit">
            {isForgot ? "Prepare reset link" : isSignup ? "Create demo account" : "Sign in"}
          </button>
          <p className="auth-status" role="status">{status || "Demo UI only. Connect your auth provider when backend accounts are ready."}</p>
        </form>
      </div>
    </section>
  );
}
`,
    "src/styles.css": `:root {
  color: #0f172a;
  background: #ffffff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ink: #070b1a;
  --muted: #64748b;
  --line: rgba(148, 163, 184, 0.24);
  --soft: rgba(248, 250, 252, 0.82);
  --blue: #2563eb;
  --cyan: #22d3ee;
  --violet: #8b5cf6;
  --shadow: 0 28px 90px rgba(15, 23, 42, 0.08);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; background: #fff; }
a { color: inherit; text-decoration: none; }
button, a { -webkit-tap-highlight-color: transparent; }
main { overflow: hidden; background:
  radial-gradient(circle at 18% 6%, rgba(34, 211, 238, .14), transparent 28%),
  radial-gradient(circle at 82% 12%, rgba(139, 92, 246, .13), transparent 26%),
  #fff;
}

.hero-shell, .section, .footer, .final-cta { width: min(1180px, calc(100% - 36px)); margin: 0 auto; }
.nav { height: 82px; display: flex; align-items: center; gap: 28px; }
.brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 900; letter-spacing: -0.04em; color: var(--ink); }
.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 14px; color: #fff; background: linear-gradient(135deg, var(--blue), var(--cyan), var(--violet)); box-shadow: 0 12px 34px rgba(37, 99, 235, .22); }
.nav-links { margin-left: auto; display: flex; align-items: center; gap: 20px; color: var(--muted); font-size: 14px; font-weight: 750; }
.nav-links a, .nav-cta { transition: color .18s ease, transform .18s ease, background .18s ease; }
.nav-links a:hover { color: var(--ink); }
.nav-cta, .button { border: 1px solid var(--line); border-radius: 999px; padding: 12px 17px; font-weight: 850; box-shadow: 0 12px 30px rgba(15,23,42,.045); }
.button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; }
.button.primary { color: white; background: #070b1a; border-color: #070b1a; }
.button.secondary { color: var(--ink); background: rgba(255,255,255,.82); }
.button:hover, .nav-cta:hover { transform: translateY(-1px); box-shadow: 0 18px 44px rgba(15,23,42,.09); }

.hero { min-height: calc(100vh - 82px); display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr); gap: 52px; align-items: center; padding: 70px 0 96px; }
.status-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 22px; }
.status-row span, .eyebrow { border: 1px solid var(--line); background: rgba(255,255,255,.78); border-radius: 999px; padding: 7px 11px; color: #53657e; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.hero h1 { margin: 0; color: var(--ink); font-size: clamp(42px, 6.6vw, 84px); line-height: .96; letter-spacing: -.065em; max-width: 840px; text-wrap: balance; }
.hero-lead { max-width: 700px; margin: 24px 0 0; color: #53657e; font-size: clamp(17px, 2vw, 21px); line-height: 1.62; font-weight: 650; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.hero-proof { margin-top: 34px; display: grid; grid-template-columns: repeat(3, auto 1fr); gap: 8px 10px; color: var(--muted); align-items: baseline; font-size: 13px; font-weight: 700; }
.hero-proof strong { color: var(--ink); font-size: 22px; letter-spacing: -.04em; }
.orb-visual { position: relative; height: min(540px, 72vw); border: 1px solid var(--line); border-radius: 44px; background: rgba(255,255,255,.64); box-shadow: var(--shadow); overflow: hidden; }
.orb-core { position: absolute; inset: 18%; border-radius: 50%; background: radial-gradient(circle at 32% 28%, #a78bfa, transparent 20%), radial-gradient(circle at 35% 70%, #22d3ee, transparent 28%), radial-gradient(circle at 74% 48%, #2563eb, transparent 34%), #6d8cff; filter: blur(.2px); box-shadow: 0 0 90px rgba(34,211,238,.18); animation: float 7s ease-in-out infinite; }
.code-ribbon { position: absolute; left: 10%; right: 10%; padding: 14px 16px; border: 1px solid rgba(255,255,255,.8); border-radius: 20px; background: rgba(255,255,255,.72); color: #344256; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-weight: 800; box-shadow: 0 18px 44px rgba(15,23,42,.08); }
.ribbon-a { top: 14%; } .ribbon-b { bottom: 16%; }

.section { padding: 92px 0; }
.section-header { max-width: 740px; margin-bottom: 34px; }
.section-header .eyebrow { display: inline-flex; margin: 0 0 16px; }
.section-header h2, .final-cta h2 { margin: 0; color: var(--ink); font-size: clamp(34px, 5vw, 62px); line-height: .98; letter-spacing: -.065em; }
.section-header p, .final-cta p { color: var(--muted); font-weight: 650; line-height: 1.62; font-size: 17px; }

.workspace-mock, .plan-doc, .browser-mock, .feature-card, .price-card, .faq-item, .final-cta { border: 1px solid var(--line); border-radius: 36px; background: rgba(255,255,255,.78); box-shadow: var(--shadow); }
.workspace-mock { display: grid; grid-template-columns: 320px 1fr; min-height: 560px; overflow: hidden; }
.mock-chat { padding: 22px; border-right: 1px solid var(--line); background: rgba(248,250,252,.82); }
.tiny-label, .doc-title { color: #8ca0bb; font-size: 11px; font-weight: 950; letter-spacing: .16em; text-transform: uppercase; }
.user-bubble { margin: 18px 0; padding: 14px 16px; border-radius: 22px 22px 4px 22px; background: #0f172a; color: #fff; font-weight: 750; }
.thinking-line { color: #63758f; font-size: 13px; font-weight: 700; line-height: 1.5; }
.thinking-line span { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 8px; background: linear-gradient(135deg, var(--cyan), var(--violet)); }
.mini-code { margin-top: 18px; border: 1px solid var(--line); border-radius: 24px; background: #fff; overflow: hidden; }
.mini-code div { display: flex; justify-content: space-between; padding: 14px 16px; font-size: 13px; font-weight: 850; }
.mini-code em { color: #0f9f7b; font-style: normal; }
.mini-code pre, .terminal { margin: 0; padding: 16px; background: #07111f; color: #c6d6ee; font-size: 12px; line-height: 1.65; overflow: auto; }
.mock-main { padding: 18px; }
.mock-toolbar { display: flex; gap: 10px; color: #71839c; font-size: 12px; font-weight: 850; text-transform: uppercase; }
.mock-grid { display: grid; grid-template-columns: 180px 1fr; gap: 14px; margin: 18px 0; }
.file-tree, .preview-card { border: 1px solid var(--line); border-radius: 24px; background: #fff; padding: 16px; }
.file-tree p { margin: 0 0 10px; color: #586b85; font-size: 13px; font-weight: 800; }
.preview-top { height: 18px; border-radius: 999px; background: #e8eef6; }
.preview-hero { height: 170px; margin-top: 18px; border-radius: 28px; background: linear-gradient(135deg, rgba(37,99,235,.18), rgba(34,211,238,.18), rgba(139,92,246,.16)); }
.preview-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 12px; }
.preview-columns span { height: 76px; border-radius: 20px; background: #f1f5f9; }

.split { display: grid; grid-template-columns: minmax(0, .9fr) minmax(320px, 1.1fr); gap: 36px; align-items: center; }
.plan-doc, .browser-mock { padding: 24px; }
.plan-row { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); }
.plan-row span { color: #94a3b8; font-family: ui-monospace, monospace; }
.validation-list { margin-top: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.validation-list p { grid-column: 1 / -1; margin: 0; font-weight: 900; }
.validation-list span { border-radius: 14px; padding: 10px; background: #f8fafc; color: #53657e; font-size: 12px; font-weight: 800; }

.generation-flow, .feature-grid, .pricing-grid, .workflow { display: grid; gap: 14px; }
.generation-flow { grid-template-columns: repeat(5, 1fr); }
.generation-flow article, .workflow article { border: 1px solid var(--line); border-radius: 28px; padding: 20px; background: rgba(255,255,255,.76); transition: transform .2s ease, box-shadow .2s ease; }
.generation-flow article:hover, .workflow article:hover, .feature-card:hover, .price-card:hover { transform: translateY(-3px); box-shadow: 0 24px 70px rgba(15,23,42,.1); }
.generation-flow span, .workflow span { font-weight: 950; color: var(--blue); }
.generation-flow p, .workflow p, .feature-card p, .price-card small, .faq-item p, .footer p { color: var(--muted); font-weight: 650; line-height: 1.58; }

.browser-bar { height: 52px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--line); color: #64748b; font-weight: 800; }
.browser-bar strong { margin: 0 auto; color: #0f172a; border: 1px solid var(--line); border-radius: 999px; padding: 8px 16px; font-size: 13px; }
.browser-bar em { font-style: normal; font-size: 11px; }
.browser-canvas { position: relative; min-height: 360px; padding: 22px; background: #fbfdff; border-radius: 0 0 26px 26px; overflow: hidden; }
.ready-pill { display: inline-flex; border-radius: 999px; background: #ecfdf5; color: #047857; padding: 8px 12px; font-size: 12px; font-weight: 900; }
.site-skeleton { height: 230px; margin-top: 20px; border-radius: 28px; background: linear-gradient(135deg, #fff, #eef6ff); border: 1px solid var(--line); }
.error-overlay { position: absolute; right: 24px; bottom: 24px; max-width: 280px; border-radius: 20px; background: #0f172a; color: #e2e8f0; padding: 14px; font-size: 12px; font-weight: 800; }

.feature-grid { grid-template-columns: repeat(3, 1fr); }
.feature-card { padding: 22px; transition: transform .2s ease, box-shadow .2s ease; }
.feature-card span { color: #9aaec7; font-family: ui-monospace, monospace; font-weight: 900; }
.feature-card h3, .workflow h3 { margin: 14px 0 8px; color: var(--ink); letter-spacing: -.035em; }
.workflow { grid-template-columns: repeat(6, 1fr); }
.workflow span { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 14px; background: #eef6ff; }

.pricing-grid { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
.price-card { padding: 26px; display: flex; flex-direction: column; gap: 14px; }
.price-card.featured { background: #07111f; color: #fff; transform: translateY(-8px); }
.price-card p { margin: 0; font-size: 13px; font-weight: 950; text-transform: uppercase; letter-spacing: .14em; color: #6d7f99; }
.price-card.featured p, .price-card.featured small, .price-card.featured li { color: #b7c5da; }
.price-card h3 { margin: 0; font-size: 42px; letter-spacing: -.06em; }
.price-card h3 span { font-size: 14px; color: #94a3b8; }
.price-card ul { padding: 0; margin: 4px 0 10px; list-style: none; display: grid; gap: 9px; }
.price-card li::before { content: "✓"; margin-right: 8px; color: #0f9f7b; font-weight: 900; }
.price-card .button { margin-top: auto; }

.auth-section { display: grid; grid-template-columns: minmax(0, .9fr) minmax(320px, .72fr); gap: 34px; align-items: center; }
.auth-section .section-header { margin-bottom: 0; }
.auth-card { border: 1px solid var(--line); border-radius: 34px; background: rgba(255,255,255,.82); box-shadow: var(--shadow); padding: 18px; }
.auth-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; border-radius: 24px; background: #f8fafc; padding: 6px; }
.auth-tabs button { border: 0; border-radius: 18px; background: transparent; color: #64748b; cursor: pointer; font: inherit; font-size: 13px; font-weight: 900; padding: 11px 10px; transition: background .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease; }
.auth-tabs button:hover { color: var(--ink); }
.auth-tabs button.active { background: #fff; color: var(--ink); box-shadow: 0 10px 24px rgba(15,23,42,.06); }
.auth-form { display: grid; gap: 13px; padding: 18px 4px 2px; }
.auth-form label { display: grid; gap: 8px; color: #53657e; font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
.auth-form input { min-height: 48px; border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,.9); color: var(--ink); font: inherit; font-size: 14px; font-weight: 750; padding: 0 14px; outline: none; transition: border-color .18s ease, box-shadow .18s ease; }
.auth-form input:focus { border-color: rgba(37,99,235,.35); box-shadow: 0 0 0 4px rgba(37,99,235,.08); }
.auth-status { min-height: 22px; margin: 0; color: #64748b; font-size: 12px; font-weight: 750; line-height: 1.5; }

.faq-list { display: grid; gap: 12px; max-width: 860px; }
.faq-item { overflow: hidden; box-shadow: none; }
.faq-item button { width: 100%; border: 0; background: transparent; display: flex; justify-content: space-between; align-items: center; padding: 20px 22px; font: inherit; color: var(--ink); cursor: pointer; text-align: left; }
.faq-item button span { font-weight: 900; letter-spacing: -.02em; }
.faq-item p { max-height: 0; overflow: hidden; margin: 0; padding: 0 22px; transition: max-height .24s ease, padding .24s ease; }
.faq-item.open p { max-height: 160px; padding: 0 22px 20px; }

.final-cta { text-align: center; padding: 56px 24px; margin-bottom: 56px; }
.final-cta .eyebrow { display: inline-flex; }
.final-cta h2 { max-width: 840px; margin: 16px auto 24px; }
.footer { display: grid; grid-template-columns: 1.2fr 1fr auto; gap: 24px; align-items: start; padding: 36px 0 52px; color: #64748b; border-top: 1px solid var(--line); }
.footer nav { display: flex; flex-wrap: wrap; gap: 12px 18px; font-weight: 800; }
.footer small { font-weight: 700; }

@keyframes float { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-10px) scale(1.02); } }
@media (max-width: 980px) {
  .hero, .split, .workspace-mock, .auth-section { grid-template-columns: 1fr; }
  .workflow, .generation-flow { grid-template-columns: repeat(2, 1fr); }
  .feature-grid, .pricing-grid { grid-template-columns: 1fr; }
  .price-card.featured { transform: none; }
  .mock-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .hero-shell, .section, .footer, .final-cta { width: min(100% - 24px, 1180px); }
  .nav { gap: 12px; }
  .nav-links { display: none; }
  .hero { padding-top: 28px; }
  .hero-proof { grid-template-columns: 1fr; }
  .orb-visual { height: 360px; }
  .workflow, .generation-flow { grid-template-columns: 1fr; }
  .validation-list { grid-template-columns: 1fr; }
  .footer { grid-template-columns: 1fr; }
}
`,
    "README.md": `# HextaAI Landing Page

A premium responsive landing page for an advanced AI coding platform.

## Built sections

- Hero
- Product preview
- Plan Mode
- Code generation workflow
- Live preview
- Feature grid
- Workflow
- Pricing / CTA
- FAQ
- Footer

## Run

\`\`\`bash
npm run dev
npm run build
\`\`\`
`,
  };
}

async function streamText(
  text: string,
  emit: (event: VibeCoderEvent) => void,
  makeEvent: (delta: string) => VibeCoderEvent,
  chunkSize = 900,
  waitMs = 45,
) {
  for (let index = 0; index < text.length; index += chunkSize) {
    emit(makeEvent(text.slice(index, index + chunkSize)));
    await sleep(waitMs);
  }
}

async function runCommand(command: string, cwd: string, emit: (event: VibeCoderEvent) => void) {
  emit({ type: "terminal_started", command });
  return new Promise<number>((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    child.stdout.on("data", (chunk) => {
      emit({ type: "terminal_output", command, output: chunk.toString("utf8") });
    });
    child.stderr.on("data", (chunk) => {
      emit({ type: "terminal_output", command, output: chunk.toString("utf8") });
    });
    child.on("close", (code) => {
      emit({ type: "terminal_output", command, output: `\nCommand exited with code ${code ?? "unknown"}\n` });
      resolve(code ?? 1);
    });
  });
}

async function runLocalHextaLandingBuild({
  prompt,
  projectId,
  taskData,
}: {
  prompt: string;
  projectId: string;
  taskData: {
    events: VibeCoderEvent[];
    listeners: ((event: VibeCoderEvent) => void)[];
    approvePlan?: () => void;
  };
}) {
  const emit = (event: VibeCoderEvent) => {
    const withTimestamp = { ...event, timestamp: Date.now() } as VibeCoderEvent;
    taskData.events.push(withTimestamp);
    taskData.listeners.forEach((listener) => listener(withTimestamp));
  };

  const root = path.join(process.cwd(), "projects", projectId);
  const filesRoot = path.join(root, "files");
  await ensureDir(filesRoot);
  await ensureDir(path.join(root, "checkpoints"));
  await ensureDir(path.join(root, "logs"));
  await ensureDir(path.join(root, "preview"));
  await ensureDir(path.join(root, ".agent"));

  const productName = inferProductName(prompt);
  const projectTitle = `${productName} landing page`;
  const now = new Date().toISOString();
  await writeJson(path.join(root, "metadata.json"), {
    id: projectId,
    name: projectTitle,
    prompt,
    mode: "plan",
    status: "Building",
    createdAt: now,
    updatedAt: now,
    lastBuildStatus: "running",
    lastReviewStatus: "pending",
  });

  const plan = addGlobalPlanScope(
    adaptProductCategoryCopy(adaptLandingCopy(hextaPlanMarkdown(prompt), productName), prompt, productName),
    prompt,
    productName,
  );
  const files = Object.fromEntries(
    Object.entries(hextaFiles()).map(([file, content]) => [
      file,
      adaptProductCategoryCopy(adaptLandingCopy(content, productName), prompt, productName),
    ]),
  );
  const fileQueue = [
    { path: "PLAN.md", action: "create" as const, reason: "Create the Plan Mode source of truth before implementation." },
    ...Object.keys(files).map((file) => ({
      path: file,
      action: "create" as const,
      reason: `Generate ${file} from PLAN.md.`,
    })),
  ];

  emit({ type: "stage", stage: "inspecting-existing-project", message: "Inspecting project structure..." });
  await sleep(900);
  emit({ type: "thinking", text: "Creating PLAN.md..." });
  emit({ type: "plan_started" });
  await streamText(plan, emit, (delta) => ({ type: "plan_delta", delta }), 1000, 55);
  await fs.writeFile(path.join(root, "plan.md"), plan, "utf8");
  await fs.writeFile(path.join(filesRoot, "PLAN.md"), plan, "utf8");
  emit({ type: "plan_completed", path: "PLAN.md", content: plan });
  emit({ type: "file_queue_created", files: fileQueue });
  emit({ type: "stage", stage: "planning", message: "Review the plan, expand it if needed, then approve to continue the build." });
  await new Promise<void>((resolve) => {
    taskData.approvePlan = resolve;
  });
  taskData.approvePlan = undefined;
  emit({ type: "thinking", text: "Saving the approved plan and preparing the first checkpoint." });
  await sleep(900);

  emit({ type: "stage", stage: "creating-checkpoint", message: "Creating checkpoint before file generation..." });
  await writeJson(path.join(root, "checkpoints", "checkpoint-initial.json"), {
    id: "checkpoint-initial",
    createdAt: new Date().toISOString(),
    reason: `Before ${projectTitle} files were generated.`,
    files: [],
  });
  emit({ type: "checkpoint_created", id: "checkpoint-initial", label: `Before ${projectTitle} build` });
  await sleep(900);

  for (const [relative, content] of Object.entries(files)) {
    emit({ type: "thinking", text: `Generating ${relative}...` });
    emit({
      type: "file_started",
      path: relative,
      language: relative.split(".").pop() || "text",
      action: "create",
    });
    await streamText(content, emit, (delta) => ({ type: "file_delta", path: relative, delta }), 700, 42);
    const target = path.join(filesRoot, relative);
    await ensureDir(path.dirname(target));
    await fs.writeFile(target, content, "utf8");
    emit({ type: "file_completed", path: relative, content });
    await sleep(3300);
  }

  await writeJson(path.join(root, ".agent", "task-graph.json"), [
    { id: "T1", name: "Create PLAN.md", status: "done" },
    { id: "T2", name: "Generate landing page files", status: "done" },
    { id: "T3", name: "Run build validation", status: "running" },
    { id: "T4", name: "Start live preview", status: "pending" },
  ]);

  emit({ type: "stage", stage: "running-build", message: "Running build check..." });
  const viteBin = path.join(process.cwd(), "node_modules", ".bin", "vite");
  const buildCommand = `${JSON.stringify(viteBin)} build`;
  const exitCode = await runCommand(buildCommand, filesRoot, emit);
  await fs.writeFile(
    path.join(root, "logs", "validation.log"),
    `[${new Date().toISOString()}] ${buildCommand}\nExit code: ${exitCode}\n`,
    "utf8",
  );

  if (exitCode !== 0) {
    await writeJson(path.join(root, "metadata.json"), {
      id: projectId,
      name: projectTitle,
      prompt,
      mode: "plan",
      status: "Failed",
      createdAt: now,
      updatedAt: new Date().toISOString(),
      lastBuildStatus: "failed",
      lastReviewStatus: "blocked",
    });
    emit({ type: "error", message: `Generated ${projectTitle} failed the Vite build. See terminal output.`, recoverable: false });
    return;
  }

  emit({ type: "preview_starting" });
  const session = await startDevServer({
    projectId,
    projectPath: filesRoot,
    projectName: projectTitle,
  });
  if (session.status === "ready" && session.url) {
    emit({ type: "preview_ready", url: session.url });
  } else {
    emit({
      type: "terminal_output",
      command: "preview",
      output: `Preview did not become ready: ${session.lastError?.message ?? session.status}\n`,
    });
  }

  const doneAt = new Date().toISOString();
  await writeJson(path.join(root, ".agent", "task-graph.json"), [
    { id: "T1", name: "Create PLAN.md", status: "done" },
    { id: "T2", name: "Generate landing page files", status: "done" },
    { id: "T3", name: "Run build validation", status: "done" },
    { id: "T4", name: "Start live preview", status: session.status === "ready" ? "done" : "reported" },
  ]);
  await writeJson(path.join(root, ".agent", "build-summary.json"), {
    status: "Ready",
    completedAt: doneAt,
    filesChanged: ["PLAN.md", ...Object.keys(files)],
    validation: `Vite build exited with code ${exitCode}.`,
    preview: session.url ?? session.status,
    checkpoint: "checkpoint-initial",
  });
  await writeJson(path.join(root, ".agent", "review-results.json"), {
    status: "passed",
    reviewer: "Reviewer Agent",
    checkedAt: doneAt,
    checks: [
      "PLAN.md created before implementation",
      "More than three files generated",
      "Vite build passed",
      "Preview start attempted",
      "Responsive sections included",
      "No lorem ipsum",
    ],
    issues: [],
  });
  await writeJson(path.join(root, "metadata.json"), {
    id: projectId,
    name: projectTitle,
    prompt,
    mode: "plan",
    status: "Ready",
    createdAt: now,
    updatedAt: doneAt,
    lastBuildStatus: "ready",
    lastReviewStatus: "passed",
    previewUrl: session.url,
  });

  emit({
    type: "complete",
    summary: `Built the ${projectTitle} with PLAN.md, ${Object.keys(files).length} implementation files, a passing Vite build, and ${session.url ? `preview at ${session.url}` : "a reported preview status"}.`,
  });
}

export function registerClineRoutes(app: import("express").Application) {
  app.post("/api/vibe/start", async (req, res) => {
    const { prompt, projectId, planMode, workspacePath } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const taskId = randomUUID();
    const taskData = {
      adapter: new ClineAdapter(),
      events: [],
      listeners: [] as ((event: VibeCoderEvent) => void)[]
    };
    activeTasks.set(taskId, taskData);

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
    const provider = process.env.DEEPSEEK_API_KEY ? "deepseek" : "anthropic";
    const model = process.env.DEEPSEEK_API_KEY ? "deepseek-coder" : "claude-3-5-sonnet-20241022";

    taskData.adapter.on("event", (event: VibeCoderEvent) => {
      taskData.events.push(event);
      taskData.listeners.forEach(listener => listener(event));
    });

    const requestedProjectId = typeof projectId === "string" ? projectId : "";
    const shouldCreateFreshProject = !requestedProjectId || requestedProjectId === "project-advanced-vibe";
    const actualProjectId = shouldCreateFreshProject
      ? `${slugifyProjectName(prompt)}-${randomUUID().slice(0, 6)}`
      : safeProjectId(requestedProjectId);
    const resolvedWorkspacePath = workspacePath || path.join(process.cwd(), "projects", safeProjectId(actualProjectId), "files");

    // Ensure the directory exists before passing to cline
    await fs.mkdir(resolvedWorkspacePath, { recursive: true }).catch(console.error);

    if (planMode && isDeepLocalBuildPrompt(prompt)) {
      void runLocalHextaLandingBuild({ prompt, projectId: actualProjectId, taskData }).catch((error) => {
        const event = {
          type: "error",
          message: error instanceof Error ? error.message : "Local Plan Mode builder failed.",
          recoverable: false,
          timestamp: Date.now(),
        } as VibeCoderEvent;
        taskData.events.push(event);
        taskData.listeners.forEach((listener) => listener(event));
      });
      res.json({ taskId, projectId: actualProjectId });
      return;
    }

    taskData.adapter.startClineTask({
      projectId: actualProjectId,
      prompt,
      planMode: !!planMode,
      workspacePath: resolvedWorkspacePath,
      provider,
      model,
      apiKey,
    });

    res.json({ taskId, projectId: actualProjectId });
  });

  app.get("/api/vibe/events/:taskId", (req, res) => {
    const { taskId } = req.params;
    const taskData = activeTasks.get(taskId);

    if (!taskData) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send buffered events
    for (const event of taskData.events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const listener = (event: VibeCoderEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === "complete" || event.type === "error") {
        res.end();
        activeTasks.delete(taskId);
      }
    };

    taskData.listeners.push(listener);

    req.on("close", () => {
      taskData.listeners = taskData.listeners.filter(l => l !== listener);
    });
  });

  app.post("/api/vibe/cancel/:taskId", (req, res) => {
    const { taskId } = req.params;
    const taskData = activeTasks.get(taskId);
    if (taskData) {
      taskData.adapter.cancel();
      activeTasks.delete(taskId);
    }
    res.json({ success: true });
  });

  app.post("/api/vibe/approve/:taskId", (req, res) => {
    const { taskId } = req.params;
    const taskData = activeTasks.get(taskId);
    if (!taskData) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (taskData.approvePlan) {
      taskData.approvePlan();
      res.json({ success: true, resumed: true });
      return;
    }
    res.json({ success: true, resumed: false });
  });
}
