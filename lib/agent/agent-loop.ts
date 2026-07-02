import type { VibeCoderEvent } from "../cline/cline-events";
import type { PlannedFile } from "./plan-md-writer";

export type TaskGraphNode = {
  id: string;
  label: string;
  files: string[];
  status: "pending" | "active" | "complete" | "error";
  dependsOn: string[];
};

export type AgentLoopState = {
  pass: number;
  filesTouched: Set<string>;
  filesRevisited: Set<string>;
  readsPerformed: number;
  searchesPerformed: number;
  commandsRun: number;
  buildPassed: boolean;
  previewReady: boolean;
};

export type AgentLoopCallbacks = {
  emit: (event: VibeCoderEvent) => void;
  onStatus: (message: string) => void;
  onThinking: (text: string) => void;
};

export function buildDynamicTaskGraph(fileQueue: PlannedFile[], plan: string): TaskGraphNode[] {
  const nodes: TaskGraphNode[] = [
    { id: "inspect", label: "Inspect project context", files: [], status: "pending", dependsOn: [] },
    { id: "foundation", label: "Foundation and entry files", files: [], status: "pending", dependsOn: ["inspect"] },
    { id: "core", label: "Core pages and sections", files: [], status: "pending", dependsOn: ["foundation"] },
    { id: "interactions", label: "Interactions and state wiring", files: [], status: "pending", dependsOn: ["core"] },
    { id: "polish", label: "Polish, responsive, and revisits", files: [], status: "pending", dependsOn: ["interactions"] },
    { id: "validate", label: "Terminal validation and preview", files: [], status: "pending", dependsOn: ["polish"] },
  ];

  for (const item of fileQueue) {
    const lower = item.path.toLowerCase();
    let target = "core";
    if (/package\.json|index\.html|main\.(t|j)sx?$|vite\.config/.test(lower)) target = "foundation";
    else if (/auth|modal|form|nav|menu|button|state|hook|use[a-z]/i.test(lower)) target = "interactions";
    else if (/style|css|animation|theme|responsive/i.test(lower)) target = "polish";
    const node = nodes.find((n) => n.id === target);
    node?.files.push(item.path);
  }

  return nodes;
}

export function createLoopState(): AgentLoopState {
  return {
    pass: 0,
    filesTouched: new Set(),
    filesRevisited: new Set(),
    readsPerformed: 0,
    searchesPerformed: 0,
    commandsRun: 0,
    buildPassed: false,
    previewReady: false,
  };
}

export type CompletionGateResult = {
  passed: boolean;
  failures: string[];
};

export function checkCompletionGates(state: AgentLoopState, options: {
  planShown: boolean;
  codeModeStarted: boolean;
  noStepDividers: boolean;
  fileCount: number;
  revisited: boolean;
  previewCurrent: boolean;
}): CompletionGateResult {
  const failures: string[] = [];
  if (!options.planShown) failures.push("PLAN.md was not shown");
  if (!options.codeModeStarted) failures.push("Code mode did not start");
  if (!options.noStepDividers) failures.push("Step divider system still active");
  if (state.readsPerformed < 1) failures.push("Project was not inspected deeply");
  if (options.fileCount < 1) failures.push("No files were created or edited");
  if (options.fileCount >= 3 && !options.revisited) failures.push("No files were revisited for polish");
  if (!options.previewCurrent) failures.push("Preview is not current");
  return { passed: failures.length === 0, failures };
}

export async function streamFileAction(
  callbacks: AgentLoopCallbacks,
  action: "create" | "edit" | "revisit" | "fix" | "polish",
  filePath: string,
  content: string,
  language: string,
) {
  const verb =
    action === "create" ? "Creating" :
    action === "edit" ? "Editing" :
    action === "revisit" ? "Revisiting" :
    action === "fix" ? "Fixing" : "Polishing";

  callbacks.onStatus(`${verb} ${filePath}`);
  callbacks.emit({ type: "file_started", path: filePath, language, action: action === "create" ? "create" : "edit" });

  await sleep(1000);

  // Stream in chunks for mini code box effect
  const chunkSize = Math.max(200, Math.floor(content.length / 8));
  for (let i = 0; i < content.length; i += chunkSize) {
    callbacks.emit({ type: "file_delta", path: filePath, delta: content.slice(i, i + chunkSize) });
    await sleep(80);
  }

  callbacks.emit({ type: "file_completed", path: filePath, content });
  await sleep(1000);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
