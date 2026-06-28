import { useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AiOrb, type OrbColorTheme } from "./AiOrb";
type HarnessMode = "plan" | "fast";
import {
  AlertTriangle,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileCode2,
  GitBranch,
  LoaderCircle,
  Paperclip,
  Rocket,
  Send,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { cn } from "../lib/utils";
import { buildVibePreviewSrcDoc } from "../lib/buildVibePreviewSrcDoc";

// --- New Imports for the Advanced Workspace ---
import { useVibeCoderWorkspace } from "../hooks/useVibeCoderWorkspace";
import { ThinkingStatus } from "./vibe-coder/thinking/ThinkingStatus";
import { MiniCodeBoxQueue } from "./vibe-coder/code/MiniCodeBoxQueue";
import { LivePreviewPanel } from "./vibe-coder/preview/LivePreviewPanel";

// Fallback/Mock Composer for the Welcome Page

// Relative time util
function relativeTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const isProjectPreviewFile = (path: string) =>
  path.endsWith("index.html") || path.endsWith(".css") || path.endsWith(".js") || path.endsWith(".tsx");

type AgentActivityStatus = "pending" | "active" | "success" | "warning" | "error" | "cancelled";
type AgentActivityType = "stage" | "plan" | "file" | "terminal" | "preview" | "checkpoint" | "error" | "complete";

type AgentActivityItem = {
  id: string;
  type: AgentActivityType;
  status: AgentActivityStatus;
  title: string;
  description?: string;
  timestamp: number;
  durationMs?: number;
  details?: string;
  filePath?: string;
  command?: string;
};

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function cleanActivityText(text: string) {
  return text.replace(/\s+/g, " ").replace(/\.{3,}$/g, "").trim();
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    "task-created": "Starting",
    "inspecting-existing-project": "Inspecting",
    "writing-plan-md": "Planning",
    "extracting-file-queue": "Queueing",
    planning: "Plan review",
    "creating-checkpoint": "Checkpointing",
    "generating-file": "Coding",
    "editing-file": "Editing",
    "running-command": "Checking",
    "starting-preview": "Previewing",
    "validating-preview": "Preview ready",
    complete: "Complete",
    failed: "Failed",
    cancelled: "Cancelled",
  };
  return labels[stage] ?? "Working";
}

function buildActivityItems({
  state,
  planApproved,
}: {
  state: ReturnType<typeof useVibeCoderWorkspace>["state"];
  planApproved: boolean;
}) {
  const items: AgentActivityItem[] = [];
  const startedAt = state.startedAt ?? Date.now();
  const seenThoughts = new Set<string>();
  const latestLineId = state.thinkingLines[state.thinkingLines.length - 1]?.id;

  for (const line of state.thinkingLines) {
    const text = cleanActivityText(line.text);
    if (!text || seenThoughts.has(text)) continue;
    seenThoughts.add(text);
    items.push({
      id: `thought-${line.id}`,
      type: "stage",
      status: line.id === latestLineId && state.stage !== "complete" && state.stage !== "failed" ? "active" : "success",
      title: text,
      description: line.id === latestLineId ? "Current agent focus." : "Completed agent step.",
      timestamp: line.timestamp,
    });
  }

  if (state.planMd) {
    items.push({
      id: "plan-md",
      type: "plan",
      status: planApproved ? "success" : "active",
      title: planApproved ? "PLAN.md approved" : "PLAN.md ready for review",
      description: planApproved
        ? "The approved plan is now the source of truth for file generation."
        : "Review the plan before implementation starts.",
      timestamp: startedAt + 1200,
      filePath: "PLAN.md",
    });
  }

  if (state.fileQueue.length > 0) {
    items.push({
      id: "file-queue",
      type: "file",
      status: planApproved ? "success" : "pending",
      title: "File queue prepared",
      description: `${state.fileQueue.length} files queued from PLAN.md.`,
      timestamp: startedAt + 1600,
    });
  }

  for (const file of Object.values(state.files)) {
    items.push({
      id: `file-${file.path}`,
      type: "file",
      status: file.status === "error" ? "error" : file.status === "complete" ? "success" : "active",
      title: `${file.status === "complete" ? file.action === "edit" ? "Edited" : "Created" : file.action === "edit" ? "Editing" : "Generating"} ${file.path}`,
      description: file.status === "complete"
        ? `${file.added ?? 0} additions, ${file.removed ?? 0} removals.`
        : "Streaming through the existing mini code box.",
      timestamp: startedAt + 2200 + items.length * 70,
      filePath: file.path,
    });
  }

  const commandLogs = state.terminalLogs.filter((log) => log.command || log.output.includes("Command exited"));
  commandLogs.forEach((log, index) => {
    const failed = /Command exited with code (?!0\b)/.test(log.output);
    const passed = log.output.includes("Command exited with code 0");
    items.push({
      id: `terminal-${log.id}`,
      type: "terminal",
      status: failed ? "error" : passed ? "success" : "active",
      title: log.command ? log.output.replace(/^>\s*/, "") : passed ? "Build check passed" : failed ? "Build check failed" : "Terminal output",
      description: passed ? "Command completed successfully." : failed ? "The harness will pause or patch before continuing." : "Running real terminal command.",
      timestamp: log.timestamp,
      command: log.command,
      details: log.output,
    });
  });

  for (const checkpoint of state.checkpoints) {
    items.push({
      id: `checkpoint-${checkpoint.id}`,
      type: "checkpoint",
      status: "success",
      title: "Checkpoint created",
      description: checkpoint.label,
      timestamp: checkpoint.createdAt,
    });
  }

  if (state.preview.status === "starting") {
    items.push({
      id: "preview-starting",
      type: "preview",
      status: "active",
      title: "Starting live preview",
      description: "Detecting the project dev server and preview URL.",
      timestamp: Date.now(),
    });
  }

  if (state.preview.status === "ready") {
    items.push({
      id: "preview-ready",
      type: "preview",
      status: "success",
      title: "Preview ready",
      description: state.preview.url ? `Loaded ${state.preview.url}.` : "The project is running in live preview.",
      timestamp: Date.now(),
    });
  }

  if (state.error) {
    items.push({
      id: "task-error",
      type: "error",
      status: "error",
      title: "Build paused",
      description: state.error,
      timestamp: state.completedAt ?? Date.now(),
    });
  }

  if (state.stage === "complete") {
    items.push({
      id: "task-complete",
      type: "complete",
      status: "success",
      title: "Build complete",
      description: `${Object.keys(state.files).length} files streamed, ${state.terminalLogs.length} terminal events recorded, preview ${state.preview.status}.`,
      timestamp: state.completedAt ?? Date.now(),
    });
  }

  return items;
}

export default function VibeCoderWorkspace({ orbColorTheme = "default" }: { orbColorTheme?: OrbColorTheme }) {
  // New Workspace State
  const { state, startTask, cancelTask, approvePlan } = useVibeCoderWorkspace("project-advanced-vibe");
  
  // Existing Welcome Page State
  const [mode, setMode] = useState<"plan" | "fast">("plan");
  const [promptInput, setPromptInput] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [projectPreviews, setProjectPreviews] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [planApproved, setPlanApproved] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const activeScrollRef = useRef<HTMLDivElement | null>(null);
  const [elapsedNow, setElapsedNow] = useState(Date.now());
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, init);
    if (!response.ok) throw new Error("Fetch failed");
    return response.json();
  };

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchJson<{ projects: any[] }>("/api/vibe/projects");
      setProjects(data.projects ?? []);
    } catch (error) {
      console.warn("Failed to load Vibe projects", error);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (state.stage === "idle") return;
    const timer = window.setInterval(() => setElapsedNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.stage]);

  const handleActiveScroll = useCallback(() => {
    const element = activeScrollRef.current;
    if (!element) return;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 140;
    setShowJumpToLatest(!nearBottom);
  }, []);

  const jumpToLatest = useCallback(() => {
    const element = activeScrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    setShowJumpToLatest(false);
  }, []);

  const activeActivityItems = buildActivityItems({ state, planApproved });
  const activeScrollSignal = [
    state.stage,
    state.thinkingLines.length,
    activeActivityItems.length,
    Object.keys(state.files).length,
    state.terminalLogs.length,
    state.planMd.length,
    state.preview.status,
    planApproved ? "approved" : "reviewing",
  ].join(":");

  useEffect(() => {
    if (state.stage === "idle") return;
    const element = activeScrollRef.current;
    if (!element) return;
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 170;
    if (!nearBottom) {
      setShowJumpToLatest(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeScrollSignal, state.stage]);

  useEffect(() => {
    const recent = projects.slice(0, 3).filter((item) => !projectPreviews[item.id]);
    if (recent.length === 0) return;
    let cancelled = false;
    Promise.all(
      recent.map(async (item) => {
        try {
          const data = await fetchJson<{ files: Array<{ path: string; content: string }> }>(`/api/vibe/projects/${item.id}`);
          const filesByPath = Object.fromEntries(
            data.files.filter((file) => isProjectPreviewFile(file.path)).map((file) => [file.path, file.content])
          );
          return [item.id, buildVibePreviewSrcDoc(filesByPath)] as const;
        } catch {
          return [item.id, ""] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setProjectPreviews((current) => {
        const next = { ...current };
        for (const [id, srcDoc] of entries) { next[id] = srcDoc; }
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [projectPreviews, projects]);

  const handleSubmit = async (overridePrompt?: string) => {
    const cleanPrompt = (typeof overridePrompt === "string" ? overridePrompt : promptInput).trim();
    if (!cleanPrompt) return;
    setPlanExpanded(false);
    setPlanApproved(!mode || mode === "fast");
    await startTask(cleanPrompt, mode === "plan");
    setPromptInput("");
  };

  if (state.stage !== "idle") {
    const hasSuccessfulBuild = state.terminalLogs.some((log) =>
      log.output.includes("Command exited with code 0"),
    );
    const shouldShowPreview =
      state.preview.status === "ready" ||
      state.stage === "complete" ||
      hasSuccessfulBuild;

    const generatedFiles = Object.values(state.files);
    const canReviewPlan = Boolean(state.planMd) && state.planMode;
    const showBuildStream = !state.planMode || planApproved;
    const activityItems = activeActivityItems;
    const checksRun = state.terminalLogs.filter((log) => log.command || log.output.includes("Command exited")).length;
    const elapsedMs = state.startedAt ? (state.completedAt ?? elapsedNow) - state.startedAt : 0;
    const thinkingIsResting =
      state.stage === "complete" ||
      (state.planMode && !planApproved && canReviewPlan);
    const activeSummary =
      state.stage === "complete"
        ? "Finished with a passing build and live preview."
        : state.stage === "failed"
          ? state.error || "The build paused because an error was found."
          : state.planMode && !planApproved && state.planMd
            ? "Review the plan, expand it if needed, then approve to continue the build."
            : "Building from the approved plan with file-by-file generation.";

    return (
      <div className="relative flex h-full min-h-0 w-full overflow-hidden bg-white text-slate-950">
        <motion.section
          layout
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex min-h-0 flex-col transition-[width,max-width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            shouldShowPreview
              ? "w-[38%] min-w-[410px] max-w-[520px] border-r border-slate-200/70"
              : "mx-auto w-full max-w-[920px]",
          )}
        >
          <div
            ref={activeScrollRef}
            onScroll={handleActiveScroll}
            className="clyra-visible-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-52 pt-20 sm:px-8"
          >
            <AgentStatusHeader
              prompt={state.prompt}
              stage={state.stage}
              elapsedMs={elapsedMs}
              filesQueued={state.fileQueue.length}
              filesChanged={generatedFiles.length}
              checksRun={checksRun}
              previewStatus={state.preview.status}
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="ml-auto max-w-[78%] rounded-[26px] border border-slate-200/75 bg-white/92 px-5 py-3 text-left text-[15px] font-semibold leading-relaxed text-slate-900 shadow-[0_18px_52px_rgba(15,23,42,0.055)]"
            >
              {state.prompt}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8"
            >
              <ThinkingStatus
                lines={state.thinkingLines}
                stage={state.stage}
                isComplete={thinkingIsResting}
                hasError={state.stage === "failed"}
              />
              <p className="ml-6 max-w-[640px] text-[13px] font-medium leading-relaxed text-slate-700">
                {activeSummary}
              </p>
            </motion.div>

            <AgentActivityFeed items={activityItems} />

            {canReviewPlan ? (
              <PlanReviewCard
                markdown={state.planMd}
                expanded={planExpanded}
                approved={planApproved}
                onToggle={() => setPlanExpanded((value) => !value)}
                onApprove={() => {
                  setPlanApproved(true);
                  setPlanExpanded(false);
                  void approvePlan();
                }}
              />
            ) : null}

            {showBuildStream ? (
              <div className="mt-5">
                <MiniCodeBoxQueue files={generatedFiles} queueList={state.fileQueue} />
              </div>
            ) : null}

            {showBuildStream && generatedFiles.length > 0 ? (
              <GeneratedFilesSummary files={generatedFiles.map((file) => file.path)} />
            ) : null}

            {state.terminalLogs.length > 0 ? (
              <TerminalTranscript logs={state.terminalLogs} />
            ) : null}

            {state.stage === "complete" ? (
              <CompletionSummary
                filesChanged={generatedFiles.length}
                checksRun={checksRun}
                previewUrl={state.preview.url}
              />
            ) : null}
          </div>

          <AnimatePresence>
            {showJumpToLatest ? (
              <motion.button
                type="button"
                onClick={jumpToLatest}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute bottom-28 left-1/2 z-30 -translate-x-1/2 rounded-full border border-slate-200/80 bg-white/92 px-3.5 py-2 text-[12px] font-bold text-slate-600 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors hover:bg-slate-50 hover:text-slate-950"
              >
                Jump to latest
              </motion.button>
            ) : null}
          </AnimatePresence>

          <motion.div
            layout
            className="pointer-events-auto absolute bottom-6 left-1/2 z-20 w-full max-w-[760px] -translate-x-1/2 px-5 sm:px-8"
          >
            <Composer
              compact
              placeholder="Add a follow-up or ask for a change..."
              value={promptInput}
              onChange={setPromptInput}
              onSubmit={handleSubmit}
              mode={mode}
              onModeChange={setMode}
              onAttach={() => fileRef?.current?.click()}
              disabled={!promptInput.trim()}
              isGenerating={state.stage !== "complete" && state.stage !== "failed" && state.stage !== "cancelled"}
            />
          </motion.div>
        </motion.section>

        <AnimatePresence>
          {shouldShowPreview ? (
            <motion.aside
              key="live-preview"
              initial={{ opacity: 0, x: 80, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.985 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0 flex-1 bg-white p-5"
            >
              <LivePreviewPanel
                project={{ id: state.projectId, name: state.prompt.slice(0, 60) || "Vibe project", status: state.stage }}
                onFixError={() => {}}
              />
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  // IDLE WELCOME PAGE
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div className={cn("clyra-visible-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 sm:px-8", "pt-16")}>
        <AnimatePresence mode="wait">
          {state.stage === "idle" && (
            <motion.section
              key="welcome"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex min-h-full w-full max-w-[900px] translate-y-16 flex-col items-center justify-center pb-10 text-center"
            >
              <div className="mb-4 flex justify-center">
                <AiOrb colorTheme={orbColorTheme} />
              </div>
              <h1 className="text-4xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-5xl">
                What should we build?
              </h1>
              <p className="mt-3 text-[15px] font-semibold text-slate-500 sm:text-base">
                Plan, generate, validate, preview, save and reopen real Vibe projects.
              </p>

              <motion.div layoutId="composer-bar" className="mt-8 mb-6 w-full max-w-[900px] px-5 sm:px-8">
                <Composer
                  compact={false}
                  placeholder="Tell the coding agent what to build..."
                  value={promptInput}
                  onChange={setPromptInput}
                  onSubmit={handleSubmit}
                  mode={mode}
                  onModeChange={setMode}
                  onAttach={() => fileRef?.current?.click()}
                  disabled={!promptInput.trim()}
                  isGenerating={false}
                />
              </motion.div>

              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  setAttachedFiles(Array.from(event.target.files ?? []).map((file) => file.name));
                  event.target.value = "";
                }}
              />

              {attachedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {attachedFiles.map((file) => (
                    <span
                      key={file}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500"
                    >
                      {file}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 w-full max-w-[700px]">
                <p className="mb-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                  Recent projects
                </p>
                {projects.length === 0 ? (
                  <div className="rounded-[26px] border border-dashed border-slate-200 bg-white/75 px-5 py-5 text-center text-[13px] font-semibold text-slate-400">
                    Your recent projects will appear here.
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {projects.slice(0, 3).map((item) => (
                      <article
                        key={item.id}
                        className="group relative aspect-square overflow-hidden rounded-[20px] border border-slate-200/70 bg-white/88 text-left shadow-[0_10px_28px_rgba(15,23,42,0.03)] transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-[0_16px_38px_rgba(15,23,42,0.05)]"
                      >
                        <button type="button" className="flex h-full w-full flex-col p-1.5 text-left">
                          <div className="relative h-[76%] shrink-0 overflow-hidden rounded-[16px] border border-slate-200/70 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#eef2f7_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                            {projectPreviews[item.id] ? (
                              <iframe
                                title={`${item.name} preview`}
                                srcDoc={projectPreviews[item.id]}
                                sandbox="allow-scripts"
                                loading="lazy"
                                tabIndex={-1}
                                className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[430px] origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.47] border-0 bg-white"
                              />
                            ) : (
                              <>
                                <div className="absolute inset-x-3 top-3 h-2 rounded-full bg-white/90 shadow-sm" />
                                <div className="absolute left-3 right-12 top-8 h-3 rounded-full bg-slate-200/65" />
                                <div className="absolute left-3 top-14 h-12 w-[46%] rounded-[14px] bg-white/92 shadow-[0_10px_24px_rgba(15,23,42,0.045)]" />
                                <div className="absolute right-3 top-14 h-12 w-[38%] rounded-[14px] bg-slate-100/90" />
                                <div className="absolute bottom-3 left-3 right-3 h-7 rounded-[13px] bg-white/86 shadow-[0_8px_18px_rgba(15,23,42,0.035)]" />
                              </>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_58%,rgba(255,255,255,0.7)_100%)]" />
                            <span className="absolute left-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-[12px] border border-slate-200/70 bg-white/96 text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] opacity-90 transition-opacity group-hover:opacity-0">
                              <FileCode2 className="h-3.5 w-3.5" />
                            </span>
                            <span
                              className={cn(
                                "absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[9.5px] font-bold opacity-90 transition-opacity group-hover:opacity-0",
                                item.status === "Building" ? "bg-emerald-50 text-emerald-600" : "bg-white/88 text-slate-400"
                              )}
                            >
                              {item.status === "Building" ? "Running" : item.status}
                            </span>
                          </div>
                          <div className="flex min-h-0 flex-1 items-center justify-between gap-2 px-1.5 pb-1 pt-1.5">
                            <div className="min-w-0">
                              <p className="truncate text-[12.5px] font-bold leading-snug tracking-[-0.02em] text-slate-950">
                                {item.name}
                              </p>
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                                {relativeTime(item.updatedAt)}
                              </p>
                            </div>
                            <span className="shrink-0 text-[9.5px] font-bold text-slate-300">
                              {item.mode === "plan" ? "Plan" : "Fast"}
                            </span>
                          </div>
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentStatusHeader({
  prompt,
  stage,
  elapsedMs,
  filesQueued,
  filesChanged,
  checksRun,
  previewStatus,
}: {
  prompt: string;
  stage: string;
  elapsedMs: number;
  filesQueued: number;
  filesChanged: number;
  checksRun: number;
  previewStatus: string;
}) {
  const active = !["complete", "failed", "cancelled"].includes(stage);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="mb-6 rounded-[24px] border border-slate-200/75 bg-white/82 p-3 shadow-[0_16px_48px_rgba(15,23,42,0.045)] backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[15px] border border-slate-200/75 bg-white text-slate-500">
            {stage === "complete" ? <Rocket className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold tracking-[-0.01em] text-slate-950">
              {prompt ? `Building ${prompt.slice(0, 52)}${prompt.length > 52 ? "..." : ""}` : "Vibe coder"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
              <span>{formatElapsed(elapsedMs)}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{filesQueued} queued</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{filesChanged} changed</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>{checksRun} checks</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>preview {previewStatus}</span>
            </div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]",
            active
              ? "agent-soft-shimmer border-slate-200 bg-slate-50/70 text-slate-600"
              : stage === "failed"
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-600",
          )}
        >
          {active ? <LoaderCircle className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          {stageLabel(stage)}
        </span>
      </div>
    </motion.div>
  );
}

function AgentActivityFeed({ items }: { items: AgentActivityItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="ml-6 mt-5 max-w-[720px]">
      <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
        <Sparkles className="h-3.5 w-3.5" />
        Activity
      </div>
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <AgentActivityRow key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentActivityRow({ item }: { item: AgentActivityItem }) {
  const Icon =
    item.type === "file" ? FileCode2 :
    item.type === "terminal" ? TerminalSquare :
    item.type === "preview" ? Eye :
    item.type === "checkpoint" ? GitBranch :
    item.type === "error" ? AlertTriangle :
    item.type === "complete" ? Rocket :
    item.type === "plan" ? FileCode2 :
    Brain;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.99 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-[20px] border bg-white/78 px-3.5 py-3 text-left shadow-[0_10px_30px_rgba(15,23,42,0.03)]",
        item.status === "active" && "agent-soft-shimmer border-slate-200/90",
        item.status === "success" && "border-slate-200/65",
        item.status === "pending" && "border-slate-200/55 opacity-75",
        item.status === "error" && "border-rose-200/90 bg-rose-50/45",
      )}
      style={{ contain: "layout paint" }}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[14px] border bg-white text-slate-400",
            item.status === "active" && "border-slate-200 text-slate-600",
            item.status === "success" && "border-emerald-100 text-emerald-600",
            item.status === "error" && "border-rose-100 text-rose-500",
          )}
        >
          {item.status === "active" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 truncate text-[13px] font-bold tracking-[-0.01em] text-slate-800">
              {item.title}
            </p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9.5px] font-black uppercase tracking-[0.1em]",
                item.status === "active" && "bg-slate-100 text-slate-500",
                item.status === "success" && "bg-emerald-50 text-emerald-600",
                item.status === "pending" && "bg-slate-50 text-slate-400",
                item.status === "error" && "bg-rose-100 text-rose-600",
              )}
            >
              {item.status === "active" ? "active" : item.status}
            </span>
          </div>
          {item.description ? (
            <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">
              {item.description}
            </p>
          ) : null}
          {item.filePath ? (
            <p className="mt-1 truncate font-mono text-[10.5px] font-semibold text-slate-400">
              {item.filePath}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] font-bold text-slate-300">
          {relativeTime(new Date(item.timestamp).toISOString())}
        </span>
      </div>
    </motion.div>
  );
}

function CompletionSummary({
  filesChanged,
  checksRun,
  previewUrl,
}: {
  filesChanged: number;
  checksRun: number;
  previewUrl?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="ml-6 mt-5 max-w-[720px] rounded-[26px] border border-emerald-200/70 bg-emerald-50/45 p-4 text-left shadow-[0_18px_46px_rgba(16,185,129,0.07)]"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-[15px] border border-emerald-200 bg-white text-emerald-600">
          <Rocket className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[14px] font-black text-slate-950">Build complete</p>
          <p className="mt-1 text-[12px] font-semibold text-slate-500">
            {filesChanged} files streamed, {checksRun} checks recorded, preview {previewUrl ? "ready" : "reported"}.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PlanReviewCard({
  markdown,
  expanded,
  approved,
  onToggle,
  onApprove,
}: {
  markdown: string;
  expanded: boolean;
  approved: boolean;
  onToggle: () => void;
  onApprove: () => void;
}) {
  const summary = markdown
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#") && !line.startsWith("|"))
    .slice(0, 3)
    .join(" ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="ml-6 mt-5 max-w-[720px] overflow-hidden rounded-[28px] border border-slate-200/75 bg-white/90 p-4 text-left shadow-[0_20px_60px_rgba(15,23,42,0.055)] backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-700">
              {approved ? <Check className="h-3.5 w-3.5" /> : <FileCode2 className="h-3.5 w-3.5" />}
            </span>
            <p className="text-[13px] font-bold text-slate-950">
              {approved ? "Plan approved" : "Plan ready"}
            </p>
          </div>
          <p className="mt-3 line-clamp-3 max-w-[560px] text-[13px] font-medium leading-relaxed text-slate-500">
            {summary || "The build plan is ready to review before implementation continues."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-slate-200/80 bg-white px-3.5 py-2 text-[12px] font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
          {!approved ? (
            <button
              type="button"
              onClick={onApprove}
              className="rounded-full bg-slate-950 px-4 py-2 text-[12px] font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.14)] transition-transform hover:-translate-y-0.5"
            >
              Approve
            </button>
          ) : null}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="plan-markdown"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <pre className="clyra-visible-scrollbar mt-4 max-h-[380px] overflow-auto rounded-[22px] border border-slate-200/70 bg-slate-50/75 p-4 whitespace-pre-wrap text-[12px] font-medium leading-relaxed text-slate-700">
              {markdown}
            </pre>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function GeneratedFilesSummary({ files }: { files: string[] }) {
  if (files.length === 0) return null;

  return (
    <div className="ml-6 mt-4 max-w-[720px] rounded-[24px] border border-slate-200/70 bg-white/74 p-3 shadow-[0_14px_38px_rgba(15,23,42,0.035)]">
      <p className="px-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
        Generated files
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {files.slice(0, 18).map((file) => (
          <span
            key={file}
            className="rounded-full border border-slate-200/75 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500"
          >
            {file}
          </span>
        ))}
      </div>
    </div>
  );
}

function TerminalTranscript({ logs }: { logs: Array<{ id: string; output: string; command?: string }> }) {
  const [expanded, setExpanded] = useState(false);
  if (logs.length === 0) return null;
  const latestCommand = [...logs].reverse().find((log) => log.command)?.command;
  const passed = logs.some((log) => log.output.includes("Command exited with code 0"));
  const failed = logs.some((log) => /Command exited with code (?!0\b)/.test(log.output));
  const status = failed ? "Needs fix" : passed ? "Passed" : "Running";

  return (
    <div className="ml-6 mt-4 max-w-[720px] overflow-hidden rounded-[24px] border border-slate-200/75 bg-white/82 text-left shadow-[0_16px_42px_rgba(15,23,42,0.045)]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/70"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[14px] border border-slate-200 bg-white text-slate-500">
            <TerminalSquare className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-black text-slate-900">
              {latestCommand || "Terminal"}
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
              {logs.length} log events · {expanded ? "hide output" : "expand output"}
            </span>
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em]",
            failed ? "bg-rose-50 text-rose-600" : passed ? "bg-emerald-50 text-emerald-600" : "agent-soft-shimmer bg-slate-100 text-slate-500",
          )}
        >
          {status}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="clyra-visible-scrollbar max-h-44 overflow-auto border-t border-slate-200/70 bg-slate-950 px-4 py-3 font-mono text-[11.5px] leading-relaxed text-slate-300">
              {logs.map((log) => (
                <p key={log.id} className={cn("whitespace-pre-wrap break-words", log.command && "text-sky-300")}>
                  {log.output}
                </p>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// --- COMPOSER ---

export function Composer({
  value,
  onChange,
  onSubmit,
  mode,
  onModeChange,
  onAttach,
  disabled,
  className,
  compact = false,
  isGenerating = false,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  mode: "plan" | "fast";
  onModeChange: (mode: "plan" | "fast") => void;
  onAttach: () => void;
  disabled: boolean;
  className?: string;
  compact?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
}) {
  const { textareaRef, resize } = useVibeAutoResizeTextarea({
    value,
    minHeight: compact ? 42 : 92,
    maxHeight: compact ? 74 : 124,
  });

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col rounded-[24px] border border-slate-200/80 bg-white/86 p-3 shadow-[0_22px_72px_rgba(15,23,42,0.065)] backdrop-blur-xl transition-[height,box-shadow,border-color] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          resize();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!disabled) onSubmit();
          }
        }}
        rows={1}
        placeholder={placeholder || "Ask Clyra to build a feature, app, page, or fix..."}
        className={cn(
          "clyra-visible-scrollbar w-full resize-none bg-transparent px-0 pb-1 pt-2 text-[15px] font-medium leading-relaxed text-slate-800 outline-none transition-[height,padding,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-slate-400 sm:text-lg",
          compact ? "max-h-[74px] min-h-[42px]" : "max-h-[124px] min-h-[92px]",
        )}
      />
      <div className="mt-1 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAttach}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-transparent text-slate-500 transition-[background-color,border-color,color] duration-[120ms] ease-out hover:border-slate-200/70 hover:bg-white/72 hover:text-slate-900"
          aria-label="Attach files"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <ModeDropdown mode={mode as any} onChange={onModeChange as any} />
          <button
            type="button"
            disabled={disabled}
            onClick={onSubmit}
            aria-label="Send Vibe request"
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color] duration-[120ms] ease-out",
              disabled && !isGenerating
                ? "border-transparent bg-transparent text-slate-300"
                : "border-transparent bg-transparent text-slate-700 hover:border-slate-200/70 hover:bg-white/72 hover:text-slate-950",
            )}
          >
            {isGenerating ? <div className="h-3 w-3 rounded-[2px] bg-slate-700" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
function ModeDropdown({
  mode,
  onChange,
}: {
  mode: HarnessMode;
  onChange: (mode: HarnessMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const options: Array<{ id: HarnessMode; title: string; copy: string }> = [
    {
      id: "plan",
      title: "Plan Mode",
      copy: "Think first, review the plan, then build.",
    },
    {
      id: "fast",
      title: "Fast Mode",
      copy: "Short plan, save project, build immediately.",
    },
  ];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-bold text-slate-700 outline-none transition-[background-color,border-color,color] duration-150 ease-out",
          open
            ? "border-slate-200/80 bg-white/88 text-slate-900 shadow-[0_10px_26px_rgba(15,23,42,0.045)]"
            : "border-transparent bg-transparent shadow-none hover:border-slate-200/70 hover:bg-white/72 hover:text-slate-900",
        )}
      >
        {mode === "plan" ? "Plan Mode" : "Fast Mode"}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="grid h-4 w-4 place-items-center"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 bottom-[calc(100%+10px)] z-30 w-[270px] origin-bottom-right overflow-hidden rounded-[24px] border border-slate-200/75 bg-white/98 p-1 shadow-[0_14px_36px_rgba(15,23,42,0.06)] will-change-transform"
            style={{ contain: "layout paint" }}
          >
            {options.map((option) => {
              const selected = option.id === mode;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "group relative flex w-full items-start gap-3 rounded-[20px] px-3.5 py-3 text-left transition-[background-color,color] duration-150 ease-out",
                    selected
                      ? "bg-slate-50/76 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50/64 hover:text-slate-950",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-[border-color,background-color,color,transform] duration-150",
                      selected
                        ? "border-slate-300 bg-white text-slate-800"
                        : "border-slate-200/80 bg-white text-transparent group-hover:border-slate-300",
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold leading-snug tracking-[-0.01em]">
                      {option.title}
                    </span>
                    <span className="mt-1 block text-[11.5px] font-semibold leading-relaxed text-slate-500/78">
                      {option.copy}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function useVibeAutoResizeTextarea({
  value,
  minHeight = 92,
  maxHeight = 124,
}: {
  value: string;
  minHeight?: number;
  maxHeight?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    window.requestAnimationFrame(() => {
      textarea.style.height = "auto";
      if (textarea.value.length === 0) {
        textarea.style.height = `${minHeight}px`;
        textarea.style.overflowY = "hidden";
        return;
      }
      const nextHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight),
      );
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    });
  }, [maxHeight, minHeight]);

  useEffect(() => {
    resize();
  }, [resize, value]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return { textareaRef, resize };
}
