import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { VibeCoderEvent } from "../cline/cline-events";
import { ClineSdkSession } from "../cline/cline-sdk-session";
import {
  CODE_MODE_SYSTEM_PROMPT,
  PLAN_MODE_SYSTEM_PROMPT,
  resolveClineProviderFromEnv,
} from "../cline/cline-config";
import { inspectProject, formatCodebaseMapForPrompt } from "./context-engine";
import {
  buildDeepPlanTemplate,
  extractFileQueueFromPlan,
  extractPlanFromClineOutput,
  looksLikePlanMarkdown,
  writePlanMd,
} from "./plan-md-writer";
import { runBrandResearch } from "./research-tools";
import { analyseWebsiteStyle } from "./website-style-analyser";
import { CheckpointManager } from "./tool-router";

export type PlanModeResult = {
  plan: string;
  fileQueue: ReturnType<typeof extractFileQueueFromPlan>;
};

export class PlanModeOrchestrator {
  constructor(
    private workspacePath: string,
    private agentRoot: string,
    private checkpointsRoot: string,
    private emit: (event: VibeCoderEvent) => void,
  ) {}

  async run(prompt: string, previousPlan = ""): Promise<PlanModeResult> {
    this.emit({ type: "mode_changed", mode: "plan", label: "Plan Mode", message: "Cline Plan Mode is analysing the project." });
    this.emit({ type: "plan_started" });
    this.emit({ type: "stage", stage: "inspecting-existing-project", message: "Reading project files with Cline context..." });

    const map = await inspectProject(this.workspacePath, prompt);
    const mapText = formatCodebaseMapForPrompt(map);

    const checkpoints = new CheckpointManager(this.checkpointsRoot);
    await checkpoints.create("checkpoint-before-plan", "Before PLAN.md generation", this.workspacePath);

    const research = await runBrandResearch(prompt, this.agentRoot, (message) => {
      this.emit({ type: "stage", stage: "researching-web", message });
    });

    let styleAnalysis = "";
    if (research?.sources[0]) {
      this.emit({ type: "thinking", text: `Analysing visual style direction from ${research.sources[0]}.` });
      const style = await analyseWebsiteStyle({ url: research.sources[0] });
      styleAnalysis = [
        `Colours: ${style.colours.join(", ")}`,
        `Typography: ${style.typography}`,
        `Layout: ${style.layoutPatterns.join("; ")}`,
        `Theme: ${style.overallTheme}`,
      ].join("\n");
    }

    this.emit({ type: "stage", stage: "writing-plan-md", message: "Generating PLAN.md with Cline Plan Mode..." });

    const planPrompt = [
      `User request:\n${prompt}`,
      previousPlan ? `\nPrevious plan summary:\n${previousPlan.slice(0, 1500)}` : "",
      `\n${mapText}`,
      research ? `\nResearch:\n${research.facts}\n${research.designNotes}` : "",
      styleAnalysis ? `\nStyle analysis:\n${styleAnalysis}` : "",
      "\nOutput the complete PLAN.md as markdown in your response. Do not use write/edit tools — Plan Mode is read-only. The host app will save PLAN.md.",
    ].join("\n");

    let clineText = "";
    const provider = resolveClineProviderFromEnv();

    const session = new ClineSdkSession();
    try {
      const result = await session.run({
        workspacePath: this.workspacePath,
        mode: "plan",
        systemPrompt: PLAN_MODE_SYSTEM_PROMPT,
        prompt: planPrompt,
        provider,
        onEvent: (event) => this.emit(event),
        timeoutMs: 60_000,
      });
      clineText = result.text;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit({
        type: "terminal_output",
        command: "cline-sdk",
        output: `Cline Plan Mode: ${message}\nUsing local PLAN.md writer with project inspection.\n`,
      });
    } finally {
      await session.dispose();
    }

    // Read PLAN.md if Cline wrote it directly
    const planPath = path.join(this.workspacePath, "PLAN.md");
    let planOnDisk = "";
    try {
      planOnDisk = await fs.readFile(planPath, "utf8");
    } catch {
      // not written yet
    }

    const template = buildDeepPlanTemplate({
      prompt,
      map,
      research,
      styleAnalysis,
      clineDraft: clineText,
    });

    let plan = template;

    const clineExtracted = extractPlanFromClineOutput(clineText);
    const clineFileCount = extractFileQueueFromPlan(clineExtracted || clineText).length;
    const templateFileCount = extractFileQueueFromPlan(template).length;

    // Prefer the deep local template unless Cline produced an equally deep file plan.
    if (looksLikePlanMarkdown(planOnDisk) && extractFileQueueFromPlan(planOnDisk).length >= templateFileCount) {
      plan = planOnDisk;
    } else if (clineExtracted && clineFileCount >= templateFileCount) {
      plan = clineExtracted;
    }

    // Stream plan to UI
    const chunkSize = 400;
    for (let i = 0; i < plan.length; i += chunkSize) {
      this.emit({ type: "plan_delta", delta: plan.slice(i, i + chunkSize) });
    }

    await writePlanMd(this.workspacePath, plan);
    this.emit({ type: "plan_completed", path: "PLAN.md", content: plan });

    await checkpoints.create("checkpoint-after-plan", "After PLAN.md generation", this.workspacePath);
    this.emit({ type: "checkpoint_created", id: "checkpoint-after-plan", label: "After PLAN.md" });

    const fileQueue = extractFileQueueFromPlan(plan);
    this.emit({ type: "file_queue_created", files: fileQueue });

    return { plan, fileQueue };
  }
}
