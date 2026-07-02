import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { CodebaseMap } from "./context-engine";
import type { ResearchContext } from "./research-tools";

export type PlannedFile = {
  path: string;
  action: "create" | "edit" | "delete";
  reason: string;
};

const PLAN_SECTIONS = [
  "Request Summary",
  "Product Type",
  "Target Product",
  "Research Summary",
  "Website Style Analysis",
  "Design Direction",
  "User Flows",
  "Pages / Sections",
  "Features",
  "Interactions",
  "Animations",
  "Responsive Behaviour",
  "State / Data Needs",
  "Auth / Forms / Settings / Search / Filters",
  "File Plan",
  "Tool Strategy",
  "Validation Checklist",
  "Acceptance Test",
];

function parseFilesFromPlan(plan: string): PlannedFile[] {
  const candidates = new Set<string>();
  const pattern = /(?:^|[\s|`])((?:src|app|components|lib|styles|public|pages|types|hooks|data|utils|assets)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+|(?:[A-Za-z0-9._-]+\.(?:html|css|js|ts|tsx|md|json)|package\.json|index\.html))/gim;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(plan))) {
    const file = match[1].replace(/`/g, "").trim();
    if (!file || file.includes("..") || /^plan\.md$/i.test(file)) continue;
    candidates.add(file);
  }
  return Array.from(candidates).map((file) => ({
    path: file,
    action: "create" as const,
    reason: "Listed in PLAN.md file plan",
  }));
}

export function looksLikePlanMarkdown(text: string): boolean {
  if (!text.trim()) return false;
  // Reject raw agent event JSON streams
  if (/"\{\\\"type\\\":\\\"content_start\\\""/.test(text) || /"type":"content_start"/.test(text)) return false;
  if (/^\s*\{/.test(text.trim()) && text.includes("contentType")) return false;
  const hits = PLAN_SECTIONS.filter((section) => text.toLowerCase().includes(section.toLowerCase()));
  return (hits.length >= 4 || /#\s*implementation plan/i.test(text)) && text.includes("##");
}

export function extractPlanFromClineOutput(text: string): string {
  if (!text.trim()) return "";
  if (looksLikePlanMarkdown(text)) return text;

  const implMatch = text.match(/#\s*Implementation Plan[\s\S]*/i);
  if (implMatch && looksLikePlanMarkdown(implMatch[0])) return implMatch[0].trim();

  const mdFence = text.match(/```(?:markdown|md)?\s*([\s\S]*?)```/i);
  if (mdFence?.[1] && looksLikePlanMarkdown(mdFence[1])) return mdFence[1].trim();

  return "";
}

export function buildDeepPlanTemplate({
  prompt,
  map,
  research,
  styleAnalysis,
  clineDraft,
}: {
  prompt: string;
  map: CodebaseMap;
  research?: ResearchContext | null;
  styleAnalysis?: string;
  clineDraft?: string;
}): string {
  const fp = map.fingerprint;
  const existingFiles = map.files.filter((f) => f !== "PLAN.md");

  const filePlan = existingFiles.length
    ? [
        ...existingFiles.map((f) => `- [edit] \`${f}\` — update for follow-up requirements`),
        "- [create] additional files as needed from PLAN.md scope",
      ]
    : getDefaultFilePlan(fp.requestType);

  return `# Implementation Plan

## Request Summary
${prompt}

## Product Type
${fp.requestType.replace(/-/g, " ")}

## Target Product
${fp.brandName} — ${fp.designDirection}

## Research Summary
${research
    ? `Sources: ${research.sources.join(", ") || "none fetched"}\n\n${research.facts}\n\nSafety: ${research.safetyNotes}`
    : "No brand-specific web research required for this request."}

## Website Style Analysis
${styleAnalysis || "No external website style clone requested. Use the project fingerprint for visual direction."}

## Design Direction
- Colour mood: ${fp.colourMood}
- Layout pattern: ${fp.layoutPattern}
- Interaction style: ${fp.interactionStyle}
- Content angle: ${fp.contentAngle}

## User Flows
${getUserFlows(fp.requestType)}

## Pages / Sections
${getPagesSections(fp.requestType)}

## Features
${getFeatures(fp.requestType)}

## Interactions
- Working navigation, CTAs, forms, modals, tabs, and filters where relevant
- Keyboard and touch support
- Empty, loading, error, and success states

## Animations
- Section reveal on scroll
- Hover/focus micro-interactions on buttons, cards, and nav
- Smooth mobile menu transitions

## Responsive Behaviour
- Mobile-first layout with collapsible navigation
- Tablet and desktop grid refinements
- Readable typography scale across breakpoints

## State / Data Needs
- Local/demo state with realistic seed content
- Form validation state
- UI state for modals, drawers, tabs, and filters

## Auth / Forms / Settings / Search / Filters
Include where relevant for ${fp.requestType}: auth UI shells, validated forms, settings panels, search, and list filters.

## File Plan
${filePlan.join("\n")}

## Tool Strategy
1. Inspect workspace (read, search, list)
2. Read PLAN.md before each major edit group
3. Create foundation files (package.json, index.html, entry)
4. Build pages/sections with connected multi-file edits
5. Wire interactions and revisit files for polish
6. Run build/lint via terminal
7. Fix errors and refresh preview

## Validation Checklist
- [ ] All planned files created or updated
- [ ] Interactions wired (not static-only UI)
- [ ] Responsive layout verified
- [ ] Build/lint passes
- [ ] Preview matches request

## Acceptance Test
The live preview shows a complete ${fp.requestType.replace(/-/g, " ")} for ${fp.brandName} with navigation, core features, polished UI, working interactions, and mobile layout — not a 3-file demo.

${clineDraft?.trim() ? `\n---\n## Cline Draft Notes\n${clineDraft.trim()}\n` : ""}

## Approval Gate
Wait for user approval before writing application code. Plan Mode output only.
`;
}

function getDefaultFilePlan(requestType: string): string[] {
  const common = [
    "- [create] `package.json` — project scripts and dependencies",
    "- [create] `index.html` — app shell",
    "- [create] `src/main.tsx` — React entry",
    "- [create] `src/App.tsx` — root layout and routing shell",
    "- [create] `src/index.css` — design tokens and base styles",
  ];

  const byType: Record<string, string[]> = {
    "landing-page": [
      "- [create] `src/components/Navbar.tsx`",
      "- [create] `src/components/Hero.tsx`",
      "- [create] `src/components/Features.tsx`",
      "- [create] `src/components/Pricing.tsx`",
      "- [create] `src/components/FAQ.tsx`",
      "- [create] `src/components/Footer.tsx`",
      "- [create] `src/components/AuthModal.tsx`",
      "- [create] `src/hooks/useAuthDemo.ts`",
    ],
    dashboard: [
      "- [create] `src/components/Sidebar.tsx`",
      "- [create] `src/components/Topbar.tsx`",
      "- [create] `src/components/StatsGrid.tsx`",
      "- [create] `src/components/ChartsPanel.tsx`",
      "- [create] `src/components/DataTable.tsx`",
      "- [create] `src/components/SettingsPanel.tsx`",
    ],
    calculator: [
      "- [create] `src/components/Calculator.tsx`",
      "- [create] `src/hooks/useCalculator.ts`",
      "- [create] `src/utils/math.ts`",
      "- [create] `src/components/HistoryPanel.tsx`",
    ],
    "chat-app": [
      "- [create] `src/components/ConversationList.tsx`",
      "- [create] `src/components/ChatWindow.tsx`",
      "- [create] `src/components/MessageInput.tsx`",
      "- [create] `src/hooks/useChat.ts`",
    ],
    store: [
      "- [create] `src/components/ProductGrid.tsx`",
      "- [create] `src/components/ProductDetail.tsx`",
      "- [create] `src/components/CartDrawer.tsx`",
      "- [create] `src/hooks/useCart.ts`",
    ],
  };

  return [...common, ...(byType[requestType] || [
    "- [create] `src/components/` — feature components per scope",
    "- [create] `src/hooks/` — state and interaction hooks",
  ])];
}

function getUserFlows(requestType: string): string {
  const flows: Record<string, string> = {
    "landing-page": "Land → explore features → view pricing → open auth modal → CTA conversion",
    dashboard: "Login shell → overview stats → filter table → open settings → notifications",
    calculator: "Enter expression → calculate → view history → clear/backspace → keyboard input",
    "chat-app": "Pick conversation → read messages → type reply → search chats → new chat",
    store: "Browse grid → filter → open product → add to cart → checkout UI",
  };
  return flows[requestType] || "Discover → interact with core feature → complete primary task → review result";
}

function getPagesSections(requestType: string): string {
  const sections: Record<string, string> = {
    "landing-page": "Navbar, hero, product preview, features, benefits, pricing, FAQ, footer, auth modal, mobile menu",
    dashboard: "Sidebar, topbar, stats, charts, tables, filters, notifications, settings",
    calculator: "Display, keypad, scientific toggles, history panel, keyboard hints",
    "chat-app": "Conversation list, active chat, message thread, typing indicator, composer, mobile layout",
    store: "Product grid, filters, product detail, cart drawer, checkout UI, account shell",
  };
  return sections[requestType] || "Primary screen, supporting sections, empty/loading/error states";
}

function getFeatures(requestType: string): string {
  const features: Record<string, string> = {
    "landing-page": "Responsive nav, animated hero, feature cards, pricing toggle, FAQ accordion, auth UI, mobile menu",
    dashboard: "Sidebar nav, KPI cards, charts, sortable table, search/filter, settings form, toast notifications",
    calculator: "Basic + scientific ops, keyboard support, history, clear/backspace, error handling, responsive keypad",
    "chat-app": "Conversations, messages, typing state, search, new chat, mobile split view",
    store: "Product cards, filters, detail modal/page, cart state, checkout steps, responsive grid",
  };
  return features[requestType] || "Complete product features with realistic content and working UI interactions";
}

export async function writePlanMd(workspacePath: string, content: string): Promise<string> {
  const planPath = path.join(workspacePath, "PLAN.md");
  await fs.mkdir(workspacePath, { recursive: true });
  await fs.writeFile(planPath, content, "utf8");
  await fs.writeFile(path.join(workspacePath, "implementation_plan.md"), content, "utf8");
  return content;
}

export function extractFileQueueFromPlan(plan: string): PlannedFile[] {
  const parsed = parseFilesFromPlan(plan);
  if (parsed.length > 0) return parsed;
  return [];
}

export function mergePlanWithClineOutput(
  template: string,
  clineOutput: string,
): string {
  const extracted = extractPlanFromClineOutput(clineOutput);
  if (extracted) return extracted;
  return template;
}
