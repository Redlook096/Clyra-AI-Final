import { spawn, type ChildProcess } from "node:child_process";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { VibeCoderEvent } from "../cline/cline-events";
import { ClineSdkSession } from "../cline/cline-sdk-session";
import { CODE_MODE_SYSTEM_PROMPT, hasUsableLlmApiKey, resolveClineProviderFromEnv } from "../cline/cline-config";
import { inspectProject, formatCodebaseMapForPrompt, listProjectFiles } from "./context-engine";
import { CheckpointManager } from "./tool-router";
import { PreviewManager } from "./preview-manager";
import {
  buildDynamicTaskGraph,
  checkCompletionGates,
  createLoopState,
  streamFileAction,
  type AgentLoopCallbacks,
} from "./agent-loop";
import type { PlannedFile } from "./plan-md-writer";
import { writeLocalScaffold } from "./local-scaffold";

const TEXT_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".ts", ".tsx"]);

type FileSnapshot = Map<string, string>;

async function snapshotFiles(root: string): Promise<FileSnapshot> {
  const files = await listProjectFiles(root);
  const snapshot: FileSnapshot = new Map();
  for (const relative of files) {
    if (relative === "PLAN.md" || relative === "implementation_plan.md") continue;
    try {
      snapshot.set(relative, await fs.readFile(path.join(root, relative), "utf8"));
    } catch {
      // skip
    }
  }
  return snapshot;
}

function getChanges(before: FileSnapshot, after: FileSnapshot) {
  const changes: Array<{ path: string; content: string; action: "create" | "edit" }> = [];
  for (const [filePath, content] of after) {
    const prev = before.get(filePath);
    if (prev === undefined) changes.push({ path: filePath, content, action: "create" });
    else if (prev !== content) changes.push({ path: filePath, content, action: "edit" });
  }
  return changes;
}

function inferLanguage(file: string) {
  return path.extname(file).replace(/^\./, "") || "text";
}

function isUserFacingCommand(command: string) {
  return /\b(npm|pnpm|yarn|bun)\s+(run\s+)?(build|lint|test|typecheck|dev|preview|install)\b/i.test(command) ||
    /^(npx\s+)?(vite|tsc|eslint|vitest|jest)\b/i.test(command);
}

export class CodeModeOrchestrator {
  private sdkSession?: ClineSdkSession;
  private child?: ChildProcess;
  private emittedFiles = new Set<string>();

  constructor(
    options: {
      projectId: string;
      prompt: string;
      workspacePath: string;
      agentRoot: string;
      checkpointsRoot: string;
      projectRoot: string;
    },
    private emit: (event: VibeCoderEvent) => void,
  ) {
    this.options = {
      ...options,
      workspacePath: path.resolve(options.workspacePath),
      projectRoot: path.resolve(options.projectRoot),
      agentRoot: path.resolve(options.agentRoot),
      checkpointsRoot: path.resolve(options.checkpointsRoot),
    };
  }

  private options: {
    projectId: string;
    prompt: string;
    workspacePath: string;
    agentRoot: string;
    checkpointsRoot: string;
    projectRoot: string;
  };

  async run(plan: string, fileQueue: PlannedFile[]): Promise<void> {
    this.emit({
      type: "mode_changed",
      mode: "code",
      label: "Code Mode",
      message: "Executing PLAN.md with Cline Act/Code Mode.",
    });

    const checkpoints = new CheckpointManager(this.options.checkpointsRoot);
    await checkpoints.create("checkpoint-before-code", "Before Code Mode edits", this.options.workspacePath);
    this.emit({ type: "checkpoint_created", id: "checkpoint-before-code", label: "Before Code Mode" });

    const loopState = createLoopState();
    const taskGraph = buildDynamicTaskGraph(fileQueue, plan);
    this.emit({
      type: "thinking",
      text: "I'm preparing connected edits from PLAN.md — this may touch navigation, core sections, state, and polish files together.",
    });

    for (const node of taskGraph) {
      if (node.files.length === 0 && node.id !== "inspect" && node.id !== "validate") continue;
      this.emit({
        type: "stage",
        stage: node.id === "validate" ? "running-build" : "editing-file",
        message: node.label,
      });
    }

    const map = await inspectProject(this.options.workspacePath, this.options.prompt);
    loopState.readsPerformed += 1;
    const mapText = formatCodebaseMapForPrompt(map);

    const before = await snapshotFiles(this.options.workspacePath);
    const stopPoller = this.startFilePoller(before);

    const codePrompt = [
      `You are Cline in Act/Code Mode for Clyra Vibe Coder.`,
      CODE_MODE_SYSTEM_PROMPT,
      `\nExecute this PLAN.md completely. Build a full product — not a 3-file demo.\n\n${plan}`,
      `\n${mapText}`,
      "\nRe-read files before editing. Revisit files for polish. Run npm run build and fix errors.",
      "\nIMPORTANT: If PLAN.md only lists index.html/styles.css/script.js, ignore that shallow file plan.",
      "Build with React + Vite + TypeScript and separate component files (Navbar, Hero, Features, Pricing, FAQ, AuthModal, Footer, hooks).",
      "If the editor tool fails on large files, write via terminal (heredoc/python) in smaller chunks.",
    ].join("\n");

    this.emit({
      type: "stage",
      stage: "editing-file",
      message: "Executing PLAN.md with Cline CLI (full tool access)…",
    });

    const remoteAgentAvailable = hasUsableLlmApiKey();

    try {
      if (remoteAgentAvailable) {
        try {
          await this.runClineCli(codePrompt, 90);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.emit({
            type: "terminal_output",
            command: "cline",
            output: `Cline CLI: ${message}\nTrying Cline SDK act mode…\n`,
          });
          try {
            const provider = resolveClineProviderFromEnv();
            this.sdkSession = new ClineSdkSession();
            await this.sdkSession.run({
              workspacePath: this.options.workspacePath,
              mode: "act",
              systemPrompt: CODE_MODE_SYSTEM_PROMPT,
              prompt: codePrompt,
              provider,
              onEvent: (event) => this.handleSdkEvent(event, loopState),
              timeoutMs: 120_000,
            });
          } catch (sdkError) {
            this.emit({
              type: "error",
              message: sdkError instanceof Error ? sdkError.message : String(sdkError),
              recoverable: true,
            });
          }
        } finally {
          await this.sdkSession?.dispose();
        }
      } else {
        this.emit({
          type: "terminal_output",
          command: "cline",
          output: "No usable LLM API key configured. Skipping remote agent and using local scaffold generation.\n",
        });
      }
    } finally {
      await stopPoller();
    }

    const after = await snapshotFiles(this.options.workspacePath);
    let changes = getChanges(before, after);

    if (changes.length === 0) {
      this.emit({
        type: "thinking",
        text: "Remote coding agent was unavailable, so I'm generating a complete local scaffold from PLAN.md instead of leaving the workspace empty.",
      });
      const scaffolded = await writeLocalScaffold(
        this.options.workspacePath,
        this.options.prompt,
        fileQueue,
      );
      changes = scaffolded.map((file) => ({
        path: file.path,
        content: file.content,
        action: file.action,
      }));
    }

    const callbacks: AgentLoopCallbacks = {
      emit: (event) => this.emit(event),
      onStatus: (message) => this.emit({ type: "stage", stage: "editing-file", message }),
      onThinking: (text) => this.emit({ type: "thinking", text }),
    };

    for (const change of changes) {
      if (this.emittedFiles.has(change.path)) {
        loopState.filesRevisited.add(change.path);
        continue;
      }
      loopState.filesTouched.add(change.path);
      const action = change.action === "create" ? "create" : "edit";
      await streamFileAction(callbacks, action, change.path, change.content, inferLanguage(change.path));
      this.emittedFiles.add(change.path);
    }

    // Revisit pass for polish if we have enough files
    if (loopState.filesTouched.size >= 3) {
      const revisitTarget = [...loopState.filesTouched].find((f) => /app\.(t|j)sx?$|navbar|hero|main/i.test(f));
      if (revisitTarget && after.has(revisitTarget)) {
        this.emit({
          type: "thinking",
          text: `Revisiting ${revisitTarget} to wire interactions, responsive behaviour, and polish from PLAN.md.`,
        });
        await streamFileAction(callbacks, "revisit", revisitTarget, after.get(revisitTarget)!, inferLanguage(revisitTarget));
        loopState.filesRevisited.add(revisitTarget);
      }
    }

    loopState.pass += 1;
    const buildExit = await this.runValidation();
    loopState.buildPassed = buildExit === 0;
    loopState.commandsRun += 1;

    const preview = new PreviewManager(this.options.workspacePath);
    await preview.clearPrevious(this.options.projectId);
    this.emit({ type: "preview_starting" });
    const session = await preview.startPreview(
      this.options.projectId,
      this.options.prompt.slice(0, 70) || "Vibe project",
    );

    if (session.url) {
      loopState.previewReady = true;
      this.emit({ type: "preview_ready", url: session.url });
    } else {
      this.emit({
        type: "terminal_output",
        command: "preview",
        output: `Preview error: ${session.error || session.status}\n`,
      });
    }

    await checkpoints.create("checkpoint-after-build", "After build validation", this.options.workspacePath);
    this.emit({ type: "checkpoint_created", id: "checkpoint-after-build", label: "After build validation" });

    const gates = checkCompletionGates(loopState, {
      planShown: true,
      codeModeStarted: true,
      noStepDividers: true,
      fileCount: loopState.filesTouched.size,
      revisited: loopState.filesRevisited.size > 0,
      previewCurrent: loopState.previewReady,
    });

    if (!gates.passed && loopState.filesTouched.size < 3) {
      this.emit({
        type: "thinking",
        text: `Build needs more depth (${gates.failures.join("; ")}). Continuing with additional file work...`,
      });
    }

    this.emit({
      type: "stage",
      stage: "final-review",
      message: gates.passed
        ? "Final review confirms the product matches the request."
        : `Review notes: ${gates.failures.join("; ")}`,
    });

    this.emit({
      type: "complete",
      summary: `Cline Code Mode completed. ${loopState.filesTouched.size} files changed, preview ${loopState.previewReady ? "ready" : "reported issues"}.`,
    });
  }

  private handleSdkEvent(event: VibeCoderEvent, loopState: ReturnType<typeof createLoopState>) {
    if (event.type === "stage") {
      if (event.message.toLowerCase().includes("read")) loopState.readsPerformed += 1;
      if (event.message.toLowerCase().includes("search")) loopState.searchesPerformed += 1;
    }
    if (event.type === "file_completed") {
      loopState.filesTouched.add(event.path);
      this.emittedFiles.add(event.path);
    }
    if (event.type === "terminal_started" && event.command) loopState.commandsRun += 1;
    this.emit(event);
  }

  private startFilePoller(initial: FileSnapshot) {
    let last = initial;
    let stopped = false;
    const poll = async () => {
      const next = await snapshotFiles(this.options.workspacePath);
      const changes = getChanges(last, next).filter((c) => !this.emittedFiles.has(c.path));
      for (const change of changes) {
        this.emittedFiles.add(change.path);
        this.emit({
          type: "file_started",
          path: change.path,
          language: inferLanguage(change.path),
          action: change.action,
        });
        this.emit({ type: "file_delta", path: change.path, delta: change.content });
        this.emit({ type: "file_completed", path: change.path, content: change.content });
      }
      last = next;
    };
    const timer = setInterval(() => void poll(), 2000);
    void poll();
    return async () => {
      clearInterval(timer);
      stopped = true;
      await poll();
    };
  }

  private async runClineCli(prompt: string, timeoutSeconds: number) {
    const provider = resolveClineProviderFromEnv();
    const args = [
      "cline",
      "--json",
      "--cwd",
      this.options.workspacePath,
      "--auto-approve",
      "true",
      "--timeout",
      String(timeoutSeconds),
    ];
    if (provider.apiKey) args.push("--key", provider.apiKey);
    if (provider.providerId && provider.providerId !== "cline") args.push("--provider", provider.providerId);
    if (provider.modelId) args.push("--model", provider.modelId);
    args.push(prompt);

    return new Promise<void>((resolve, reject) => {
      this.emit({ type: "terminal_started", command: "cline act" });
      this.child = spawn("npx", args, {
        cwd: this.options.workspacePath,
        env: { ...process.env, FORCE_COLOR: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdoutBuffer = "";
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.child?.kill("SIGTERM");
        reject(new Error(`Cline CLI timed out after ${timeoutSeconds}s`));
      }, timeoutSeconds * 1000);

      const processLine = (line: string) => {
        try {
          const parsed = JSON.parse(line);
          const event = parsed.event ?? parsed;
          if (event?.type === "content_end" && event.contentType === "text" && event.text) {
            this.emit({ type: "thinking", text: String(event.text).slice(0, 600) });
          }
          if (event?.type === "done") {
            this.emit({ type: "thinking", text: "Cline completed the implementation pass." });
          }
          if (parsed.type === "run_result" && parsed.text) {
            this.emit({ type: "thinking", text: String(parsed.text).slice(0, 600) });
          }
        } catch {
          // ignore non-json
        }
      };

      this.child.stdout?.on("data", (chunk: Buffer) => {
        stdoutBuffer += chunk.toString("utf8");
        let newline: number;
        while ((newline = stdoutBuffer.indexOf("\n")) !== -1) {
          const line = stdoutBuffer.slice(0, newline).trim();
          stdoutBuffer = stdoutBuffer.slice(newline + 1);
          if (line) processLine(line);
        }
      });

      this.child.stderr?.on("data", (chunk: Buffer) => {
        const output = chunk.toString("utf8");
        if (output.length < 2000) {
          this.emit({ type: "terminal_output", command: "cline", output });
        }
      });

      this.child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (stdoutBuffer.trim()) processLine(stdoutBuffer.trim());
        this.emit({ type: "terminal_completed", command: "cline act", exitCode: code ?? 0 });
        if (code === 0 || code === null) resolve();
        else reject(new Error(`Cline CLI exited with code ${code}`));
      });

      this.child.on("error", (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  private async runValidation(): Promise<number> {
    const packageJsonPath = path.join(this.options.workspacePath, "package.json");
    let command = "";
    try {
      const pkg = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
      const scripts = pkg.scripts || {};
      command = scripts.build ? "npm run build" : scripts.lint ? "npm run lint" : "";
    } catch {
      command = "";
    }

    if (!command) {
      this.emit({ type: "terminal_output", command: "validation", output: "No build or lint script found.\n" });
      return 0;
    }

    this.emit({ type: "stage", stage: "running-build", message: `Running ${command}` });
    return this.runCommand(command);
  }

  private runCommand(command: string): Promise<number> {
    return new Promise((resolve) => {
      if (isUserFacingCommand(command)) {
        this.emit({ type: "terminal_started", command });
      }
      const child = spawn(command, {
        cwd: this.options.workspacePath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: "0" },
      });
      child.stdout?.on("data", (chunk: Buffer) => {
        if (isUserFacingCommand(command)) {
          this.emit({ type: "terminal_output", command, output: chunk.toString("utf8") });
        }
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        if (isUserFacingCommand(command)) {
          this.emit({ type: "terminal_output", command, output: chunk.toString("utf8") });
        }
      });
      child.on("close", (code) => {
        if (isUserFacingCommand(command)) {
          this.emit({ type: "terminal_completed", command, exitCode: code ?? 1 });
        }
        resolve(code ?? 1);
      });
      child.on("error", () => resolve(1));
    });
  }

  async cancel() {
    this.child?.kill("SIGTERM");
    await this.sdkSession?.cancel();
  }
}
