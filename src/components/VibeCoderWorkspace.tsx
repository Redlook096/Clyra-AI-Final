import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  FileCode2,
  FolderKanban,
  Paperclip,
  Pencil,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AiOrb, type OrbColorTheme } from "./AiOrb";
import { ShiningBrainIcon, ShiningText } from "./ShiningText";
import { VibeMiniCodeBox } from "./vibe/VibeMiniCodeBox";
import { LivePreviewPanel } from "./vibe-coder/preview/LivePreviewPanel";
import { cn } from "../lib/utils";
import { buildVibePreviewSrcDoc } from "../lib/buildVibePreviewSrcDoc";
import {
  getVisibleThoughtPreview,
  type VisibleThoughtPhase,
} from "../../lib/vibe-coder/llm/visible-thought-preview";

type HarnessMode = "plan" | "fast";
type VibePhase = "idle" | "thinking" | "plan-ready" | "building" | "done";
type ThoughtPhase = VisibleThoughtPhase;

interface VibeProject {
  id: string;
  name: string;
  prompt: string;
  mode: HarnessMode;
  status: "Draft" | "Building" | "Ready" | "Failed";
  createdAt: string;
  updatedAt: string;
}

interface VibePlanResponse {
  title: string;
  summary: string;
  markdown: string;
  taskGraph: Array<{ id: string; name: string; description: string }>;
  starterFiles: Record<string, string>;
}

interface VibePatch {
  file: string;
  added: number;
  removed: number;
  code: string;
  reason: string;
}

interface PlanComment {
  id: string;
  quote: string;
  note: string;
}

type ProjectActionDialog =
  | { type: "rename"; project: VibeProject; draftName: string }
  | { type: "delete"; project: VibeProject };

const PLAN_PHASES: ThoughtPhase[] = [
  "request_reading",
  "project_scanning",
  "framework_detection",
  "package_detection",
  "ui_detection",
  "plan_generating",
  "file_tree_generating",
  "task_graph_generating",
  "plan_refining",
  "plan_ready",
];

const BUILD_PHASES: ThoughtPhase[] = [
  "plan_approved",
  "checkpointing",
  "task_starting",
  "file_editing",
  "file_generating",
  "validation",
  "error_fixing",
  "preview_refreshing",
  "final_review",
];

const isProjectPreviewFile = (path: string) => {
  const normalized = path.replace(/^\/+/, "");
  if (
    normalized.includes("node_modules/") ||
    normalized.includes(".vite/") ||
    normalized.includes("dist/") ||
    normalized.includes("build/") ||
    normalized.includes(".next/")
  ) {
    return false;
  }

  return (
    /(^|\/)(src|app|pages|components|lib)\//.test(normalized) ||
    /(^|\/)(App|main|index)\.(tsx|jsx|ts|js)$/.test(normalized)
  );
};

function formatTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function relativeTime(iso: string) {
  const delta = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.round(delta / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function countLines(source: string) {
  if (!source) return 0;
  return source.split("\n").length;
}

function featureChips(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("calculator")) {
    return ["Working keypad", "Live result", "Clear/delete", "Responsive shell"];
  }
  if (lower.includes("landing") || lower.includes("website")) {
    return ["Navbar", "Hero", "Feature grid", "CTA", "Responsive layout"];
  }
  return ["Plan.md", "Project files", "Preview-ready UI", "Validation notes"];
}

function planPreviewText(plan: VibePlanResponse | null) {
  if (!plan) return "";
  return plan.markdown
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("|"))
    .slice(0, 18)
    .join("\n");
}

function buildPatches(files: Record<string, string>): VibePatch[] {
  return Object.entries(files).map(([file, code]) => ({
    file,
    code,
    added: countLines(code),
    removed: 0,
    reason:
      file === "plan.md"
        ? "Saved the approved build plan."
        : file.endsWith(".css")
          ? "Added the visual system and responsive styling."
          : file.endsWith("App.tsx")
            ? "Created the main functional product surface."
            : "Added project support file.",
  }));
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
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

function ThinkingStep({
  active,
  thoughtText,
  thoughtPhase,
  startedAt,
  finishedMs,
}: {
  active: boolean;
  thoughtText: string;
  thoughtPhase: ThoughtPhase;
  startedAt: number;
  finishedMs?: number;
}) {
  const [now, setNow] = useState(Date.now());
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);

  const elapsed = active ? now - startedAt : (finishedMs ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[720px] self-start text-left"
    >
      <button
        type="button"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2.5 rounded-full text-[13px] font-semibold text-slate-400 outline-none transition-colors hover:text-slate-600"
      >
        {active ? (
          <ShiningBrainIcon />
        ) : hovered ? (
          <span className="grid h-[15px] w-[15px] place-items-center font-mono text-[15px] leading-none text-slate-500">
            &gt;
          </span>
        ) : (
          <span className="grid h-[15px] w-[15px] place-items-center text-slate-400">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
        {active ? (
          <ShiningText
            text="thinking"
            preset="thinkingChat"
            className="text-[13px] font-semibold"
          />
        ) : (
          <span>thought</span>
        )}
        <span className="font-mono text-[12px] tabular-nums">
          {formatTime(elapsed)}
        </span>
      </button>
      <ThinkingUnderText
        text={thoughtText}
        phase={thoughtPhase}
        isActive={active}
      />
    </motion.div>
  );
}

function ThinkingUnderText({
  text,
  phase,
  isActive,
}: {
  text: string;
  phase: ThoughtPhase;
  isActive: boolean;
}) {
  return (
    <div className="mt-2 ml-[25px] h-[40px] overflow-hidden">
      <AnimatePresence mode="wait">
        {isActive && text ? (
          <motion.p
            key={`${phase}-${text}`}
            initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="m-0 max-w-[620px] text-[12.5px] font-medium leading-relaxed text-slate-500/80"
          >
            {text}
          </motion.p>
        ) : null}
      </AnimatePresence>
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

function PlanCard({
  plan,
  prompt,
  expanded,
  setExpanded,
  comments,
  onAddComment,
  onApprove,
  approving,
}: {
  plan: VibePlanResponse;
  prompt: string;
  expanded: boolean;
  setExpanded: (value: boolean) => void;
  comments: PlanComment[];
  onAddComment: (quote: string, note: string) => void;
  onApprove: () => void;
  approving: boolean;
}) {
  const [commentMenu, setCommentMenu] = useState<{
    x: number;
    y: number;
    quote: string;
  } | null>(null);
  const [commentText, setCommentText] = useState("");

  const preview = planPreviewText(plan);
  const latestQuote = comments[comments.length - 1]?.quote;

  const planBody = latestQuote && plan.markdown.includes(latestQuote) ? (
    <>
      {plan.markdown.split(latestQuote)[0]}
      <button
        type="button"
        title={comments[comments.length - 1]?.note}
        className="rounded-sm border-b-2 border-amber-300 bg-amber-50/70 px-0.5 text-left"
      >
        {latestQuote}
      </button>
      {plan.markdown.split(latestQuote).slice(1).join(latestQuote)}
    </>
  ) : (
    plan.markdown
  );

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[900px] rounded-[34px] border border-slate-200/80 bg-white/88 p-5 shadow-[0_26px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-[12px] font-bold text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Plan ready
          </div>
          <h2 className="text-2xl font-bold tracking-[-0.04em] text-slate-950">
            {plan.title}
          </h2>
          <p className="mt-3 max-w-[680px] text-[14px] font-semibold leading-relaxed text-slate-500">
            {plan.summary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm"
          >
            <RefreshCw className="inline h-3.5 w-3.5" /> Regenerate
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={approving}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)] transition-all hover:bg-slate-800 disabled:opacity-60"
          >
            <Play className="h-3.5 w-3.5" />
            Approve
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {featureChips(prompt).map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] font-bold text-slate-600"
          >
            {chip}
          </span>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {plan.taskGraph.map((task) => (
                <div
                  key={task.id}
                  className="rounded-[24px] border border-slate-200/75 bg-white/70 p-4"
                >
                  <p className="text-[12px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {task.id}
                  </p>
                  <p className="mt-2 text-[15px] font-bold text-slate-900">
                    {task.name}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold leading-relaxed text-slate-500">
                    {task.description}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="clyra-visible-scrollbar relative mt-5 max-h-[420px] overflow-auto rounded-[26px] border border-slate-200/75 bg-slate-50/65 p-5 font-mono text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap"
              onContextMenu={(event) => {
                const selected = window.getSelection()?.toString().trim();
                if (!selected) return;
                event.preventDefault();
                setCommentMenu({
                  x: event.clientX,
                  y: event.clientY,
                  quote: selected.slice(0, 260),
                });
              }}
            >
              {planBody}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 max-w-[760px] text-[13px] font-medium leading-relaxed text-slate-500"
          >
            {preview}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {commentMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="fixed z-[120] flex w-[330px] items-center gap-2 rounded-full border border-slate-200 bg-white/94 p-2 shadow-[0_22px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl"
            style={{ left: Math.min(commentMenu.x, window.innerWidth - 350), top: commentMenu.y }}
          >
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Describe changes"
              className="min-w-0 flex-1 bg-transparent px-3 text-[13px] font-semibold outline-none placeholder:text-slate-400"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                if (commentText.trim()) {
                  onAddComment(commentMenu.quote, commentText.trim());
                  setCommentText("");
                  setCommentMenu(null);
                }
              }}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white"
            >
              <Send className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCommentMenu(null)}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default function VibeCoderWorkspace({
  orbColorTheme = "default",
}: {
  orbColorTheme?: OrbColorTheme;
}) {
  const [mode, setMode] = useState<HarnessMode>("plan");
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<VibePhase>("idle");
  const [projects, setProjects] = useState<VibeProject[]>([]);
  const [plan, setPlan] = useState<VibePlanResponse | null>(null);
  const [planExpanded, setPlanExpanded] = useState(false);
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [thinkingStartedAt, setThinkingStartedAt] = useState(Date.now());
  const [thinkingFinishedMs, setThinkingFinishedMs] = useState(0);
  const [thoughtPhase, setThoughtPhase] =
    useState<ThoughtPhase>("request_reading");
  const [thoughtText, setThoughtText] = useState("");
  const [project, setProject] = useState<VibeProject | null>(null);
  const [patches, setPatches] = useState<VibePatch[]>([]);
  const [visiblePatchCount, setVisiblePatchCount] = useState(0);
  const [statusLine, setStatusLine] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [projectPreviews, setProjectPreviews] = useState<Record<string, string>>(
    {},
  );
  const [projectAction, setProjectAction] =
    useState<ProjectActionDialog | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchJson<{ projects: VibeProject[] }>(
        "/api/vibe/projects",
      );
      setProjects(data.projects ?? []);
    } catch (error) {
      console.warn("Failed to load Vibe projects", error);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const recent = projects.slice(0, 3).filter((item) => !projectPreviews[item.id]);
    if (recent.length === 0) return;

    let cancelled = false;
    Promise.all(
      recent.map(async (item) => {
        try {
          const data = await fetchJson<{
            files: Array<{ path: string; content: string }>;
          }>(`/api/vibe/projects/${item.id}`);
          const filesByPath = Object.fromEntries(
            data.files
              .filter((file) => isProjectPreviewFile(file.path))
              .map((file) => [file.path, file.content]),
          );
          return [item.id, buildVibePreviewSrcDoc(filesByPath)] as const;
        } catch {
          return [item.id, ""] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setProjectPreviews((current) => {
        const next = { ...current };
        for (const [id, srcDoc] of entries) {
          next[id] = srcDoc;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [projectPreviews, projects]);

  const runThinking = useCallback(
    async (
      phases: ThoughtPhase[],
      minMs: number,
      context?: { prompt?: string; projectName?: string },
    ) => {
      const start = Date.now();
      setThinkingStartedAt(start);
      setThinkingFinishedMs(0);
      setPhase("thinking");
      const stepMs = Math.max(1100, minMs / Math.max(1, phases.length));
      for (const phase of phases) {
        setThoughtPhase(phase);
        setThoughtText(getVisibleThoughtPreview(phase, context).text);
        await new Promise((resolve) => window.setTimeout(resolve, stepMs));
      }
      const elapsed = Date.now() - start;
      if (elapsed < minMs) {
        await new Promise((resolve) =>
          window.setTimeout(resolve, minMs - elapsed),
        );
      }
      setThinkingFinishedMs(Date.now() - start);
    },
    [],
  );

  const handleSubmit = async () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    setPlan(null);
    setComments([]);
    setPatches([]);
    setProject(null);
    setVisiblePatchCount(0);
    setStatusLine("");
    setPrompt("");

    try {
      const scanPromise = fetchJson<Record<string, unknown>>("/api/vibe/scan", {
        method: "POST",
        body: JSON.stringify({}),
      });
      await runThinking(
        mode === "plan" ? PLAN_PHASES : PLAN_PHASES.slice(0, 3),
        mode === "plan" ? 15500 : 4600,
        { prompt: cleanPrompt },
      );
      const scan = await scanPromise;
      const nextPlan = await fetchJson<VibePlanResponse>("/api/vibe/plan", {
        method: "POST",
        body: JSON.stringify({ prompt: cleanPrompt, mode, scan }),
      });
      setPlan(nextPlan);
      setPhase("plan-ready");
      if (mode === "fast") {
        await approvePlan(nextPlan, cleanPrompt, true);
      }
    } catch (error) {
      console.error(error);
      setThoughtPhase("error_fixing");
      setThoughtText("I could not create the plan cleanly, so I’m leaving the workspace unchanged for another try.");
      setPhase("idle");
    }
  };

  const approvePlan = async (
    approvedPlan = plan,
    approvedPrompt = plan?.title ?? "",
    fromFastMode = false,
  ) => {
    if (!approvedPlan) return;
    setPhase("building");
    setStatusLine("I’ll build from the approved plan.md now, save the project, and validate the preview-ready files.");
    await runThinking(BUILD_PHASES, fromFastMode ? 4200 : 6800, {
      projectName: approvedPlan.title,
    });
    setPhase("building");

    const created = await fetchJson<{ project: VibeProject }>("/api/vibe/projects", {
      method: "POST",
      body: JSON.stringify({
        prompt: approvedPrompt || approvedPlan.title,
        name: approvedPlan.title,
        mode,
      }),
    });
    const files = {
      "plan.md": approvedPlan.markdown,
      ...approvedPlan.starterFiles,
    };
    const saved = await fetchJson<{ project: VibeProject }>("/api/vibe/write-plan", {
      method: "POST",
      body: JSON.stringify({
        projectId: created.project.id,
        plan: approvedPlan.markdown,
        taskGraph: approvedPlan.taskGraph,
        files,
      }),
    });
    setProject(saved.project);
    setPatches(buildPatches(files));
    setVisiblePatchCount(1);
    await loadProjects();
  };

  const openProject = async (id: string) => {
    const data = await fetchJson<{
      project: VibeProject;
      files: Array<{ path: string; content: string }>;
      plan: string;
    }>(`/api/vibe/projects/${id}`);
    const displayFiles = data.files.filter((file) =>
      isProjectPreviewFile(file.path),
    );
    setProject(data.project);
    setPlan({
      title: data.project.name,
      summary: `Loaded saved project "${data.project.name}" without replaying the original generation.`,
      markdown: data.plan || "# Plan\n\nSaved plan was not found.",
      taskGraph: [],
      starterFiles: Object.fromEntries(
        displayFiles.map((file) => [file.path, file.content]),
      ),
    });
    setPhase("done");
    setPatches(
      displayFiles.map((file) => ({
        file: file.path,
        code: file.content,
        added: countLines(file.content),
        removed: 0,
        reason: "Loaded saved project file.",
      })),
    );
    setVisiblePatchCount(displayFiles.length);
  };

  const renameProject = async (item: VibeProject, nextNameRaw: string) => {
    const nextName = nextNameRaw.trim();
    if (!nextName || nextName === item.name) return;

    const data = await fetchJson<{ project: VibeProject }>(
      `/api/vibe/projects/${item.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name: nextName }),
      },
    );
    setProjects((current) =>
      current.map((project) =>
        project.id === item.id ? data.project : project,
      ),
    );
    setProject((current) =>
      current?.id === item.id ? data.project : current,
    );
  };

  const deleteProject = async (item: VibeProject) => {
    await fetchJson<{ ok: boolean; projectId: string }>(
      `/api/vibe/projects/${item.id}`,
      { method: "DELETE" },
    );
    setProjects((current) =>
      current.filter((project) => project.id !== item.id),
    );
    if (project?.id === item.id) {
      setProject(null);
      setPlan(null);
      setPatches([]);
      setPhase("idle");
    }
  };

  const visiblePatches = patches.slice(0, visiblePatchCount);
  const isWorking = phase === "thinking";
  const hasLivePreview = Boolean(project) && (phase === "building" || phase === "done");

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <div
        className={cn(
          "clyra-visible-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 sm:px-8",
          hasLivePreview ? "pt-3" : "pt-16",
        )}
      >
        <AnimatePresence mode="wait">
          {phase === "idle" ? (
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

              <Composer
                className="mt-16"
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                mode={mode}
                onModeChange={setMode}
                onAttach={() => fileRef.current?.click()}
                disabled={!prompt.trim()}
              />

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
                        <button
                          type="button"
                          onClick={() => openProject(item.id)}
                          className="flex h-full w-full flex-col p-1.5 text-left"
                        >
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
                                item.status === "Building"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-white/88 text-slate-400",
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
                        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/92 p-0.5 opacity-0 shadow-[0_10px_24px_rgba(15,23,42,0.055)] backdrop-blur-md transition-[opacity,transform] duration-150 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setProjectAction({
                                type: "rename",
                                project: item,
                                draftName: item.name,
                              });
                            }}
                            aria-label={`Rename ${item.name}`}
                            title="Rename"
                            className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition-[background-color,color] duration-150 hover:bg-slate-100/80 hover:text-slate-900"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setProjectAction({
                                type: "delete",
                                project: item,
                              });
                            }}
                            aria-label={`Delete ${item.name}`}
                            title="Delete"
                            className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition-[background-color,color] duration-150 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="chat"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "mx-auto w-full flex-1 pb-32",
                hasLivePreview
                  ? "grid max-w-[1420px] grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,0.38fr)_minmax(0,0.62fr)]"
                  : "flex max-w-[980px] flex-col gap-5",
              )}
            >
              <motion.div
                layout
                initial={
                  hasLivePreview
                    ? { opacity: 0, x: -18, scale: 0.972 }
                    : false
                }
                animate={{ opacity: 1, x: 0, scale: hasLivePreview ? 0.985 : 1 }}
                transition={{ duration: 0.56, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex min-w-0 origin-center flex-col gap-5",
                  hasLivePreview ? "lg:order-1" : "",
                )}
              >
                {plan?.title ? (
                  <div className="flex justify-end">
                    <div className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-3 text-[15px] font-bold text-slate-900 shadow-[0_18px_54px_rgba(15,23,42,0.06)]">
                      {plan.title}
                    </div>
                  </div>
                ) : null}

                {(phase === "thinking" || thinkingFinishedMs > 0) && (
                  <ThinkingStep
                    active={isWorking}
                    startedAt={thinkingStartedAt}
                    finishedMs={thinkingFinishedMs}
                    thoughtText={thoughtText}
                    thoughtPhase={thoughtPhase}
                  />
                )}

                {phase === "plan-ready" && plan && (
                  <PlanCard
                    plan={plan}
                    prompt={plan.title}
                    expanded={planExpanded}
                    setExpanded={setPlanExpanded}
                    comments={comments}
                    onAddComment={(quote, note) =>
                      setComments((prev) => [
                        ...prev,
                        { id: `${Date.now()}`, quote, note },
                      ])
                    }
                    onApprove={() => approvePlan()}
                    approving={false}
                  />
                )}

                {(phase === "building" || phase === "done") && (
                  <div className="w-full max-w-[760px] space-y-4 self-start">
                    {statusLine && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[14px] font-semibold leading-relaxed text-slate-600"
                      >
                        {statusLine}
                      </motion.p>
                    )}
                    <AnimatePresence>
                      {visiblePatches.map((patch, index) => (
                        <motion.div
                          key={`${patch.file}-${index}`}
                          className="space-y-2"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <p className="text-[12px] font-bold text-slate-400">
                            {patch.reason}
                          </p>
                          <VibeMiniCodeBox
                            file={patch.file}
                            code={patch.code}
                            added={patch.added}
                            removed={patch.removed}
                            active={index === visiblePatchCount - 1}
                            segmentComplete
                            archived={phase === "done"}
                            onCollapsed={() => {
                              if (visiblePatchCount < patches.length) {
                                window.setTimeout(
                                  () => setVisiblePatchCount((value) => value + 1),
                                  1000,
                                );
                              } else {
                                setPhase("done");
                                setStatusLine("Build complete. The project is saved, validated locally, and ready to reopen without replaying generation.");
                                void loadProjects();
                              }
                            }}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {project && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <ActionButton icon={Code2}>Open in Code</ActionButton>
                        <ActionButton icon={Copy}>Duplicate</ActionButton>
                        <ActionButton icon={FolderKanban}>Projects</ActionButton>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {hasLivePreview && (
                <LivePreviewPanel project={project} className="lg:order-2" />
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {phase !== "idle" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white via-white/92 to-transparent px-5 pb-5 pt-14 sm:px-8">
          <div
            className={cn(
              "mx-auto w-full",
              hasLivePreview
                ? "grid max-w-[1420px] grid-cols-1 gap-5 lg:grid-cols-[minmax(300px,0.38fr)_minmax(0,0.62fr)]"
                : "max-w-[980px]",
            )}
          >
            <Composer
              className={cn(
                "pointer-events-auto mb-1",
                hasLivePreview
                  ? "max-w-[420px] justify-self-center lg:col-start-1"
                  : "mx-auto",
              )}
              compact
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              mode={mode}
              onModeChange={setMode}
              onAttach={() => fileRef.current?.click()}
              disabled={!prompt.trim() || phase === "thinking"}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {projectAction && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-white/45 px-4 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onMouseDown={() => setProjectAction(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={
                projectAction.type === "rename"
                  ? "Rename project"
                  : "Delete project"
              }
              className="w-full max-w-[340px] rounded-[26px] border border-white/80 bg-white/78 p-4 text-left shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
                    Project
                  </p>
                  <h3 className="mt-1 text-[17px] font-bold tracking-[-0.035em] text-slate-950">
                    {projectAction.type === "rename"
                      ? "Rename project"
                      : "Delete project"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setProjectAction(null)}
                  className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-700"
                  aria-label="Close project menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {projectAction.type === "rename" ? (
                <form
                  className="mt-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const current = projectAction;
                    void renameProject(
                      current.project,
                      current.draftName,
                    ).then(() => setProjectAction(null));
                  }}
                >
                  <label className="block text-[12px] font-bold text-slate-500">
                    Project name
                  </label>
                  <input
                    autoFocus
                    value={projectAction.draftName}
                    onChange={(event) =>
                      setProjectAction({
                        ...projectAction,
                        draftName: event.target.value,
                      })
                    }
                    className="mt-2 h-11 w-full rounded-[16px] border border-slate-200/75 bg-white/82 px-4 text-[14px] font-semibold text-slate-900 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-slate-300 focus:border-slate-300 focus:shadow-[0_0_0_4px_rgba(148,163,184,0.12)]"
                  />
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setProjectAction(null)}
                      className="h-10 rounded-full px-4 text-[13px] font-bold text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="h-10 rounded-full bg-slate-950 px-4 text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4">
                  <p className="text-[13px] font-semibold leading-relaxed text-slate-500">
                    Delete{" "}
                    <span className="font-bold text-slate-900">
                      {projectAction.project.name}
                    </span>
                    ? This removes it from your recent Vibe projects.
                  </p>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setProjectAction(null)}
                    className="h-10 rounded-full px-4 text-[13px] font-bold text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-800"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const current = projectAction;
                        void deleteProject(current.project).then(() =>
                          setProjectAction(null),
                        );
                      }}
                      className="h-10 rounded-full bg-slate-950 px-4 text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSubmit,
  mode,
  onModeChange,
  onAttach,
  disabled,
  className,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  mode: HarnessMode;
  onModeChange: (mode: HarnessMode) => void;
  onAttach: () => void;
  disabled: boolean;
  className?: string;
  compact?: boolean;
}) {
  const { textareaRef, resize } = useVibeAutoResizeTextarea({
    value,
    minHeight: compact ? 66 : 92,
    maxHeight: compact ? 98 : 124,
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
        placeholder="Ask Clyra to build a feature, app, page, or fix..."
        className={cn(
          "clyra-visible-scrollbar w-full resize-none bg-transparent px-0 pb-1 pt-2 text-[15px] font-medium leading-relaxed text-slate-800 outline-none transition-[height,padding,opacity] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-slate-400 sm:text-lg",
          compact ? "max-h-[98px] min-h-[66px]" : "max-h-[124px] min-h-[92px]",
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
          <ModeDropdown mode={mode} onChange={onModeChange} />
          <button
            type="button"
            disabled={disabled}
            onClick={onSubmit}
            aria-label="Send Vibe request"
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color] duration-[120ms] ease-out",
              disabled
                ? "border-transparent bg-transparent text-slate-300"
                : "border-transparent bg-transparent text-slate-700 hover:border-slate-200/70 hover:bg-white/72 hover:text-slate-950",
            )}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
}: {
  icon: typeof Code2;
  children: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[12px] font-bold text-slate-600 transition-all hover:border-slate-300 hover:text-slate-900 hover:shadow-sm"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}
