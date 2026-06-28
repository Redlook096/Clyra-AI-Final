import { spawn, ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import * as path from "node:path";
import { VibeCoderEvent } from "./cline-events";

export interface ClineRunnerOptions {
  projectId: string;
  prompt: string;
  planMode: boolean;
  workspacePath: string;
  provider: string;
  model: string;
  apiKey?: string;
}

export class ClineRunner extends EventEmitter {
  private child?: ChildProcess;
  private isCancelled = false;

  constructor(private options: ClineRunnerOptions) {
    super();
  }

  public start() {
    this.isCancelled = false;

    // Construct the advanced vibe coder system prompt
    const enhancedPrompt = `You are working inside an existing web app project. Your task is to act as an advanced vibe coder system.

CRITICAL INSTRUCTIONS:
${this.options.planMode ? `1. Plan Mode is ENABLED. You MUST start by creating a highly detailed \`PLAN.md\` file in the root of the workspace.
2. The PLAN.md must detail the file execution queue.
3. After creating PLAN.md, you must execute the plan by creating/editing files one by one.
` : `1. Fast Mode is ENABLED. Proceed directly to implementation.`}
4. Do not mock or fake implementations. Write complete, robust, production-ready code.
5. Create focused files and modules. Do NOT artificially limit yourself to 3 files. If a task requires 10 files, write 10 files.
6. When running terminal commands, ensure you only run scripts that exist (e.g. \`npm run build\`).
7. Do not stop until the implementation is complete and verified.

GLOBAL GENERATION BEHAVIOUR:
- Interpret the user request literally. Build an independent product/app/page/component unless the prompt explicitly says it is for this AI assistant, this Clyra app, or the current Vibe Coder.
- Classify the request before coding: request type, target product, brand/niche, required pages, components, interactions, data/state, auth needs, animations, responsiveness, and expected depth.
- Do not make shallow demos. A landing page needs navbar, hero, preview, features, benefits, workflow, pricing or CTA, FAQ, footer, sign in/sign up/forgot password UI, responsive mobile behavior, and working local interactions.
- Apps and dashboards need navigation, real demo state, empty/loading/error states, forms where expected, filters/search where useful, responsive layout, and working buttons/tabs/modals/drawers.
- Include auth UI by default for SaaS, dashboards, productivity tools, ecommerce, chat apps, AI tools, admin panels, social apps, and marketplaces. Use demo/local state if no backend exists.
- Use multiple focused files for non-trivial work: screens, layout, sections, forms, cards, data, types, hooks/state, and utilities. Do not cram a full product into one huge file.
- Every visible interactive element must work with real or demo state. No dead buttons, fake menus, unfinished placeholders, or lorem ipsum.
- Keep UI premium, minimal, polished, responsive, and smooth. Use lightweight transform/opacity animations, hover/focus/active states, mobile layouts, and accessible labels where useful.
- Plan Mode must create product-scope PLAN.md content before implementation, then build from that plan with validation and preview.

User Request:
${this.options.prompt}`;

    const args = [
      "cline",
      enhancedPrompt,
      "--json",
      "--cwd",
      this.options.workspacePath,
    ];

    if (this.options.planMode) {
      args.push("--plan");
    }

    // Auto-approve tools for headless mode
    args.push("--auto-approve", "true");

    console.log("[ClineRunner] Spawning:", "npx", args.join(" "));

    this.child = spawn("npx", args, {
      cwd: this.options.workspacePath,
      env: {
        ...process.env,
        FORCE_COLOR: "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdoutBuffer = "";

    this.child.stdout?.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString("utf8");
      this.processBuffer(stdoutBuffer, (newBuf) => (stdoutBuffer = newBuf));
    });

    this.child.stderr?.on("data", (chunk: Buffer) => {
      const str = chunk.toString("utf8");
      console.warn("[Cline CLI Warning]:", str);
    });

    this.child.on("close", (code) => {
      if (stdoutBuffer.trim()) {
        this.processBuffer(stdoutBuffer, () => {}, true);
      }
      
      if (this.isCancelled) return;

      if (code === 0) {
        this.emitEvent({
          type: "complete",
          summary: "Cline coding task completed successfully.",
        });
      } else {
        this.emitEvent({
          type: "error",
          message: `Cline CLI exited with code ${code}`,
          recoverable: false,
        });
      }
    });

    this.child.on("error", (err) => {
      this.emitEvent({
        type: "error",
        message: `Failed to start Cline CLI: ${err.message}`,
        recoverable: false,
      });
    });
  }

  public cancel() {
    this.isCancelled = true;
    if (this.child) {
      this.child.kill("SIGTERM");
    }
  }

  private processBuffer(
    buffer: string,
    setBuffer: (b: string) => void,
    forceAll = false
  ) {
    let currentBuffer = buffer;
    while (true) {
      const newlineIdx = currentBuffer.indexOf("\n");
      if (newlineIdx === -1) {
        if (forceAll && currentBuffer.trim()) {
          this.parseAndEmit(currentBuffer.trim());
          setBuffer("");
        }
        break;
      }
      
      const line = currentBuffer.slice(0, newlineIdx).trim();
      currentBuffer = currentBuffer.slice(newlineIdx + 1);
      
      if (line) {
        this.parseAndEmit(line);
      }
      setBuffer(currentBuffer);
    }
  }

  private parseAndEmit(line: string) {
    try {
      const parsed = JSON.parse(line);
      
      if (parsed.type === "agent_event" && parsed.event) {
        const ev = parsed.event;
        if (ev.type === "content_start" || ev.type === "content_end") {
          if (ev.contentType === "text" && ev.text) {
            this.emitEvent({ type: "thinking", text: ev.text });
          } else if (ev.contentType === "tool") {
            const toolName = ev.toolName || ev.tool;
            if (toolName === "editor" || toolName === "write_file") {
              const filepath = ev.input?.path;
              if (filepath) {
                // Determine action type based on file path ending in PLAN.md vs regular file
                const isPlan = filepath.endsWith("PLAN.md") || filepath.endsWith("plan.md");
                
                if (ev.type === "content_start") {
                  if (isPlan) {
                    this.emitEvent({ type: "plan_started" });
                  } else {
                    this.emitEvent({
                      type: "file_started",
                      path: filepath,
                      language: filepath.split('.').pop() || "text",
                      action: "edit"
                    });
                  }
                }

                if (isPlan) {
                  this.emitEvent({
                    type: "plan_delta",
                    delta: ev.input?.new_text || ev.input?.content || "",
                  });
                } else {
                  this.emitEvent({
                    type: "file_delta",
                    path: filepath,
                    delta: ev.input?.new_text || ev.input?.content || "",
                  });
                }
                
                if (ev.type === "content_end") {
                  if (isPlan) {
                    this.emitEvent({
                      type: "plan_completed",
                      path: "PLAN.md",
                      content: ev.input?.new_text || ev.input?.content || "",
                    });
                  } else {
                    this.emitEvent({
                      type: "file_completed",
                      path: filepath,
                      content: ev.input?.new_text || ev.input?.content || "",
                    });
                  }
                }
              }
            } else if (toolName === "execute_command") {
              const cmd = ev.input?.command;
              if (cmd) {
                this.emitEvent({ type: "stage", stage: "running-command", message: `Running ${cmd}` });
                this.emitEvent({ type: "terminal_started", command: cmd });
                if (ev.type === "content_end" && ev.output?.result) {
                  this.emitEvent({ type: "terminal_output", command: cmd, output: ev.output.result });
                }
              }
            }
          }
        } else if (ev.type === "done") {
           this.emitEvent({ type: "complete", summary: ev.text || "Task complete" });
        }
      } else if (parsed.type === "run_result") {
         if (parsed.finishReason === "completed") {
           this.emitEvent({ type: "complete", summary: parsed.text || "Task complete" });
         } else {
           this.emitEvent({ type: "error", message: `Task finished with reason: ${parsed.finishReason}`, recoverable: false });
         }
      } else if (parsed.type === "error") {
        this.emitEvent({
          type: "error",
          message: parsed.message || "Unknown error",
          recoverable: true,
        });
      }
    } catch (e) {
      // ignore
    }
  }

  private emitEvent(event: VibeCoderEvent) {
    this.emit("event", event);
  }
}
