import { ClineCore } from "@cline/sdk";
import type { AgentMode, CoreSessionEvent } from "@cline/core";
import { buildSessionConfig, type ClineProviderConfig } from "./cline-config";
import { mapClineSessionEventToVibeEvents } from "./cline-tools";
import type { VibeCoderEvent } from "./cline-events";

export type ClineSessionOptions = {
  workspacePath: string;
  mode: AgentMode;
  systemPrompt: string;
  prompt: string;
  provider?: ClineProviderConfig;
  onEvent: (event: VibeCoderEvent) => void;
  timeoutMs?: number;
};

export class ClineSdkSession {
  private core?: ClineCore;
  private sessionId?: string;
  private unsubscribe?: () => void;
  private cancelled = false;
  private resolveWait?: () => void;

  async run(options: ClineSessionOptions): Promise<{ text: string; sessionId?: string }> {
    this.cancelled = false;
    const provider = options.provider;
    if (!provider?.apiKey) {
      throw new Error("No LLM API key configured. Set DEEPSEEK_API_KEY, ANTHROPIC_API_KEY, or MY_LLM_API_KEY.");
    }

    this.core = await ClineCore.create({
      clientName: "clyra-vibe-coder",
      backendMode: "local",
    });

    const config = buildSessionConfig({
      workspacePath: options.workspacePath,
      mode: options.mode,
      systemPrompt: options.systemPrompt,
      provider,
      yolo: options.mode === "act",
    });

    const collected: string[] = [];
    let lastText = "";

    this.unsubscribe = this.core.subscribe((event: CoreSessionEvent) => {
      if (this.cancelled) return;

      if (event.type === "agent_event") {
        const ae = event.payload.event;
        if (ae?.type === "content_end" && (ae.contentType === "text" || ae.contentType === "reasoning")) {
          const text = String(ae.text || ae.reasoning || "").trim();
          if (text) {
            collected.push(text);
            lastText = text;
          }
        }
        if (ae?.type === "done") {
          this.resolveWait?.();
        }
        if (ae?.type === "error" && !ae.recoverable) {
          this.resolveWait?.();
        }
      }

      const mapped = mapClineSessionEventToVibeEvents(event, options.workspacePath);
      for (const vibeEvent of mapped) {
        options.onEvent(vibeEvent);
      }
      if (event.type === "ended") {
        this.resolveWait?.();
      }
    });

    const result = await this.core.start({
      config,
      prompt: options.prompt,
      interactive: false,
    });

    this.sessionId = result.sessionId;

    const timeoutMs = options.timeoutMs ?? (options.mode === "plan" ? 90_000 : 600_000);
    await this.waitForSessionEnd(timeoutMs);

    return {
      text: lastText || collected.join("\n"),
      sessionId: this.sessionId,
    };
  }

  private waitForSessionEnd(timeoutMs: number): Promise<void> {
    if (!this.core || !this.sessionId) return Promise.resolve();

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.resolveWait = undefined;
        clearTimeout(timer);
        resolve();
      };
      this.resolveWait = finish;

      const timer = setTimeout(() => {
        void this.core?.stop(this.sessionId!).catch(() => {});
        finish();
      }, timeoutMs);
    });
  }

  async cancel() {
    this.cancelled = true;
    this.resolveWait?.();
    if (this.core && this.sessionId) {
      await this.core.stop(this.sessionId).catch(() => {});
    }
    this.unsubscribe?.();
    await this.core?.dispose().catch(() => {});
  }

  async dispose() {
    this.resolveWait?.();
    this.unsubscribe?.();
    await this.core?.dispose().catch(() => {});
  }
}
