import { ClineRunner, ClineRunnerOptions } from "./cline-runner";
import { VibeCoderEvent } from "./cline-events";
import { EventEmitter } from "node:events";

export interface ClineTaskOptions {
  projectId: string;
  prompt: string;
  planMode: boolean;
  workspacePath: string;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export class ClineAdapter extends EventEmitter {
  private runner?: ClineRunner;

  public startClineTask(options: ClineTaskOptions) {
    this.runner = new ClineRunner({
      projectId: options.projectId,
      prompt: options.prompt,
      planMode: options.planMode,
      workspacePath: options.workspacePath,
      provider: options.provider || "cline",
      model: options.model || "default",
      apiKey: options.apiKey,
    });

    this.runner.on("event", (event: VibeCoderEvent) => {
      this.emit("event", event);
    });

    this.emit("event", {
      type: "stage",
      stage: "task-created",
      message: "Starting Cline coding agent...",
    } as VibeCoderEvent);

    this.runner.start();
  }

  public cancel() {
    if (this.runner) {
      this.runner.cancel();
      this.emit("event", {
        type: "error",
        message: "Task cancelled by user.",
        recoverable: false,
      } as VibeCoderEvent);
    }
  }

  public approvePlan() {
    this.runner?.approvePlan();
  }
}

export const clineAdapter = new ClineAdapter();

export function startClineTask(options: ClineTaskOptions, onEvent: (evt: VibeCoderEvent) => void) {
  const adapter = new ClineAdapter();
  adapter.on("event", onEvent);
  adapter.startClineTask(options);
  return adapter;
}

export type { ClineRunnerOptions };
