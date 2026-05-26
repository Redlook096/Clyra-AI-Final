import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Flame,
  Laugh,
  Loader2,
  Play,
  Scissors,
  Sparkles,
  Star,
  Target,
  Type,
  Youtube,
  Zap,
} from "lucide-react";

interface Props {
  onClose: () => void;
  initialUrl?: string;
}

type Step = 0 | 1 | 2 | 3 | 4;
type CaptionPosition = "bottom" | "centre" | "top";

interface ClipResult {
  output?: string;
  title?: string;
  original_duration?: string;
  clip_duration?: string;
  reason?: string;
  caption?: string;
  timing_source?: string;
  word_count?: number;
  total_seconds?: number;
  file_size?: number;
  output_quality?: string;
}

const MOMENTS = [
  { id: "viral", icon: Flame, label: "Viral", tone: "Retention spike" },
  { id: "funny", icon: Laugh, label: "Funny", tone: "Clean punchline" },
  { id: "dramatic", icon: Star, label: "Dramatic", tone: "Story peak" },
  { id: "inspiring", icon: Sparkles, label: "Inspiring", tone: "Lift beat" },
  { id: "surprising", icon: Zap, label: "Surprising", tone: "Reveal moment" },
  { id: "action", icon: Target, label: "Action", tone: "Fastest section" },
] as const;

const FLOW = ["Source", "Moment", "Subtitles", "Render"] as const;
const PIPELINE_STEPS = ["captions", "analyze", "clip", "transcribe", "subtitles", "render", "complete"];
const DEFAULT_CONFIG = {
  font: "Impact",
  fontSize: "86",
  colour: "#FFFFFF",
  position: "bottom" as CaptionPosition,
};

const outputUrl = (path?: string) => (path ? path.replace("./output/", "/output/") : "");
const fileSize = (bytes?: number) => (bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "");

export default function AIClipper({ onClose, initialUrl = "" }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [url, setUrl] = useState(initialUrl);
  const [moment, setMoment] = useState<string>("viral");
  const [custom, setCustom] = useState("");
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [name, setName] = useState("");
  const [len, setLen] = useState("40");
  const [result, setResult] = useState<ClipResult | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const seenSteps = useRef<Set<string>>(new Set());
  const runSummary = useRef<Partial<ClipResult>>({});

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  useEffect(() => {
    if (step !== 3) return;
    const interval = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [step]);

  const activeStage = step === 4 ? 3 : Math.min(step, 3);
  const selectedMomentLabel = useMemo(() => {
    if (custom.trim()) return custom.trim();
    return MOMENTS.find((item) => item.id === moment)?.label ?? "Viral";
  }, [custom, moment]);

  const updateProgress = (pipelineStep: string, message?: string) => {
    seenSteps.current.add(pipelineStep);
    const index = PIPELINE_STEPS.indexOf(pipelineStep);
    const nextProgress =
      pipelineStep === "complete"
        ? 100
        : Math.max(8, Math.round(((index >= 0 ? index + 0.7 : seenSteps.current.size) / PIPELINE_STEPS.length) * 100));
    setProgress(Math.min(98, nextProgress));
    if (message) setStatus(message);
  };

  const run = useCallback(async () => {
    setStep(3);
    setError("");
    setResult(null);
    setElapsed(0);
    setProgress(4);
    setStatus("Opening the source...");
    seenSteps.current = new Set();
    runSummary.current = {};

    try {
      const response = await fetch("/api/clipper/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          config: {
            font: cfg.font,
            font_size: Number.parseInt(cfg.fontSize, 10),
            text_colour: cfg.colour,
            position: cfg.position,
            moment_type: custom.trim() || moment || "viral",
            clip_duration: Number.parseInt(len, 10),
            clip_name: name.trim() || `clip-${Date.now()}`,
          },
        }),
      });

      if (!response.ok) throw new Error(`Server ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream returned from clipper");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === "error") throw new Error(event.message || "Clipper failed");
          if (event.step) {
            updateProgress(event.step, event.message);
            if (event.step === "transcribe") runSummary.current.timing_source = event.timing_source;
            if (event.step === "subtitles" && event.word_count) runSummary.current.word_count = event.word_count;
          }

          if (event.type === "complete" || event.step === "complete") {
            setResult({ ...runSummary.current, ...event, word_count: event.word_count ?? runSummary.current.word_count });
            setProgress(100);
            setStatus(event.message || "720p 30fps MP4 ready");
            setStep(4);
            return;
          }
        }
      }

      throw new Error("Clipper finished without returning an MP4");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clipper failed");
      setStep(0);
      setProgress(0);
    }
  }, [cfg, custom, len, moment, name, url]);

  const subtitleStyle = {
    fontFamily: cfg.font,
    fontSize: `${Math.min(Number.parseInt(cfg.fontSize, 10) * 0.34, 46)}px`,
    color: cfg.colour,
    textShadow: "0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 12px 24px rgba(0,0,0,.5)",
    fontWeight: 900,
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-[#fbfbfa] text-[#141414]"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/5 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-white text-slate-500 transition hover:border-black/20 hover:bg-slate-50 hover:text-black"
          aria-label="Close AI clipper"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
            <Scissors className="h-4 w-4" />
          </span>
          <div className="leading-none">
            <p className="text-sm font-semibold tracking-tight">AI Clip</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">720p 30fps</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {FLOW.map((item, index) => (
            <span
              key={item}
              className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                index <= activeStage ? "bg-black text-white" : "border border-black/10 bg-white text-slate-400"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7">
        <div className="mx-auto flex min-h-full w-full max-w-5xl items-center justify-center">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Scene key="source">
                <div className="grid w-full gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  <Intro eyebrow="Create a clip" title="Paste the source." copy="Bring in a YouTube video and Clyra will find a short-ready moment with word-timed burned-in subtitles." />
                  <Panel>
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                          <Youtube className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold">YouTube source</p>
                          <p className="mt-1 text-xs text-slate-500">Full link or short URL</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">MP4</span>
                    </div>

                    <div className="flex flex-col gap-2 rounded-lg border border-black/10 bg-slate-50 p-1.5 sm:flex-row">
                      <input
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://youtu.be/..."
                        className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm font-medium outline-none placeholder:text-slate-400"
                        autoFocus
                        onKeyDown={(event) => event.key === "Enter" && url.includes("youtu") && setStep(1)}
                      />
                      <PrimaryButton onClick={() => setStep(1)} disabled={!url.includes("youtu")}>
                        Continue <ChevronRight className="h-4 w-4" />
                      </PrimaryButton>
                    </div>

                    {error ? (
                      <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    ) : null}
                  </Panel>
                </div>
              </Scene>
            )}

            {step === 1 && (
              <Scene key="moment">
                <div className="w-full">
                  <Intro eyebrow="Find the perfect moment" title="Choose the cut direction." copy="Pick the signal you want the selector to optimize for, or write the exact beat yourself." compact />
                  <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {MOMENTS.map((item, index) => {
                      const Icon = item.icon;
                      const selected = moment === item.id && !custom.trim();
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.035, duration: 0.3 }}
                          onClick={() => {
                            setMoment(item.id);
                            setCustom("");
                          }}
                          className={`group flex min-h-[112px] flex-col justify-between rounded-lg border p-4 text-left transition ${
                            selected ? "border-black bg-black text-white shadow-[0_18px_50px_rgba(0,0,0,0.14)]" : "border-black/10 bg-white text-black hover:border-black/25"
                          }`}
                        >
                          <div className={`grid h-10 w-10 place-items-center rounded-full ${selected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500 group-hover:text-black"}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span>
                            <span className="block text-base font-semibold tracking-tight">{item.label}</span>
                            <span className={`mt-1 block text-xs ${selected ? "text-white/55" : "text-slate-500"}`}>{item.tone}</span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <Panel className="mt-4">
                    <textarea
                      value={custom}
                      onChange={(event) => {
                        setCustom(event.target.value);
                        if (event.target.value.trim()) setMoment("");
                      }}
                      placeholder='Custom direction, e.g. "the strongest reveal" or "the cleanest reaction"...'
                      rows={3}
                      className="w-full resize-none bg-transparent text-sm font-medium leading-6 outline-none placeholder:text-slate-400"
                    />
                  </Panel>

                  <NavActions>
                    <SecondaryButton onClick={() => setStep(0)}>Back</SecondaryButton>
                    <PrimaryButton onClick={() => setStep(2)} disabled={!moment && !custom.trim()}>
                      Subtitle style <ChevronRight className="h-4 w-4" />
                    </PrimaryButton>
                  </NavActions>
                </div>
              </Scene>
            )}

            {step === 2 && (
              <Scene key="style">
                <div className="grid w-full gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-slate-500">
                      <Type className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.22em]">Subtitle style</span>
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-black/10 bg-[#101010] shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,#202020_0%,#080808_52%,#27332f_100%)]" />
                      <div className="absolute inset-x-10 bottom-10 top-10 rounded-lg border border-white/10 bg-black/10" />
                      <Play className="absolute inset-0 m-auto h-14 w-14 text-white/15" />
                      <div
                        className={`absolute left-1/2 max-w-[86%] -translate-x-1/2 text-center ${
                          cfg.position === "top" ? "top-14" : cfg.position === "centre" ? "top-1/2 -translate-y-1/2" : "bottom-14"
                        }`}
                      >
                        <span style={subtitleStyle}>WORD TIMED</span>
                      </div>
                    </div>
                  </div>

                  <Panel>
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">Output setup</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Clean controls. Sharp export.</h2>
                    </div>

                    <div className="space-y-5">
                      <Control label="Length">
                        {["30", "40", "60"].map((value) => (
                          <SegmentButton key={value} active={len === value} onClick={() => setLen(value)}>
                            {value}s
                          </SegmentButton>
                        ))}
                      </Control>
                      <Control label="Caption">
                        {[
                          ["64", "Small"],
                          ["86", "Medium"],
                          ["108", "Large"],
                        ].map(([value, label]) => (
                          <SegmentButton key={value} active={cfg.fontSize === value} onClick={() => setCfg({ ...cfg, fontSize: value })}>
                            {label}
                          </SegmentButton>
                        ))}
                      </Control>
                      <Control label="Position">
                        {[
                          ["bottom", "Bottom"],
                          ["centre", "Center"],
                          ["top", "Top"],
                        ].map(([value, label]) => (
                          <SegmentButton key={value} active={cfg.position === value} onClick={() => setCfg({ ...cfg, position: value as CaptionPosition })}>
                            {label}
                          </SegmentButton>
                        ))}
                      </Control>

                      <div className="grid gap-3 sm:grid-cols-[112px_1fr] sm:items-center">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Colour</span>
                        <div className="flex gap-2">
                          {["#FFFFFF", "#F5C84C", "#56C7D9", "#F06752"].map((colour) => (
                            <button
                              key={colour}
                              type="button"
                              onClick={() => setCfg({ ...cfg, colour })}
                              className={`h-10 w-10 rounded-full border transition ${cfg.colour === colour ? "border-black ring-4 ring-black/10" : "border-black/15"}`}
                              style={{ background: colour }}
                              aria-label={`Use ${colour}`}
                            />
                          ))}
                        </div>
                      </div>

                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Clip name (optional)"
                        className="h-11 w-full rounded-lg border border-black/10 bg-white px-4 text-sm font-medium outline-none transition placeholder:text-slate-400 focus:border-black/30"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <MiniSpec label="Video" value="720p 30fps H.264" />
                        <MiniSpec label="Audio" value="AAC 256k" />
                      </div>
                    </div>

                    <NavActions className="mt-6">
                      <SecondaryButton onClick={() => setStep(1)}>Back</SecondaryButton>
                      <PrimaryButton onClick={run}>Render clip</PrimaryButton>
                    </NavActions>
                  </Panel>
                </div>
              </Scene>
            )}

            {step === 3 && (
              <Scene key="render">
                <div className="w-full max-w-lg text-center">
                  <div className="mx-auto mb-8 grid h-32 w-32 place-items-center rounded-full border border-black/10 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
                    <div className="relative grid h-24 w-24 place-items-center rounded-full bg-black text-white">
                      <motion.span
                        className="absolute inset-0 rounded-full border border-black"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0, 0.45] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {progress >= 100 ? <Check className="h-8 w-8" /> : <Loader2 className="h-8 w-8 animate-spin" />}
                    </div>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">{selectedMomentLabel}</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight">Rendering the clip.</h2>
                  <p className="mt-3 min-h-6 text-sm text-slate-500">{status}</p>
                  <div className="mt-8 overflow-hidden rounded-full bg-black/10 p-1">
                    <motion.div className="h-2 rounded-full bg-black" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
                  </div>
                  <p className="mt-4 text-xs font-medium text-slate-400">{progress}% complete · {elapsed}s elapsed · 720p 30fps export</p>
                </div>
              </Scene>
            )}

            {step === 4 && result && (
              <Scene key="done">
                <div className="grid w-full gap-7 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
                  <video
                    controls
                    playsInline
                    src={outputUrl(result.output)}
                    className="aspect-video w-full rounded-lg border border-black/10 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.12)]"
                  />

                  <Panel>
                    <div className="mb-6 flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                        <Check className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-semibold tracking-tight">Clip ready</p>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">{result.title}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Stat label="Duration" value={`${result.original_duration ?? "-"} -> ${result.clip_duration ?? "-"}`} />
                      <Stat label="Quality" value={result.output_quality ?? "720p 30fps AAC"} />
                      <Stat label="Words" value={String(result.word_count ?? "burned in")} />
                      <Stat label="Size" value={fileSize(result.file_size) || "MP4"} />
                    </div>

                    {result.caption ? <p className="mt-4 rounded-lg border border-black/10 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{result.caption}</p> : null}

                    <div className="mt-5 flex gap-3">
                      <a href={outputUrl(result.output)} download className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800">
                        <Download className="h-4 w-4" /> Download MP4
                      </a>
                      <SecondaryButton
                        onClick={() => {
                          setStep(0);
                          setResult(null);
                          setUrl("");
                          setError("");
                        }}
                      >
                        New
                      </SecondaryButton>
                    </div>
                  </Panel>
                </div>
              </Scene>
            )}
          </AnimatePresence>
        </div>
      </main>
    </motion.div>
  );

  return createPortal(content, document.body);
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      {children}
    </motion.section>
  );
}

function Intro({ eyebrow, title, copy, compact = false }: { eyebrow: string; title: string; copy: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "max-w-lg"}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">{eyebrow}</p>
      <h1 className={`${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} mt-3 font-semibold tracking-tight`}>{title}</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">{copy}</p>
    </div>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-black/10 bg-white p-4 shadow-[0_14px_40px_rgba(0,0,0,0.055)] sm:p-5 ${className}`}>{children}</div>;
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[112px_1fr] sm:items-center">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="grid grid-flow-col gap-1 rounded-lg border border-black/10 bg-slate-50 p-1">{children}</div>
    </div>
  );
}

function SegmentButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl px-3 text-xs font-semibold transition ${active ? "bg-black text-white" : "text-slate-500 hover:bg-white hover:text-black"}`}
    >
      {children}
    </button>
  );
}

function NavActions({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mt-5 flex justify-end gap-3 ${className}`}>{children}</div>;
}

function PrimaryButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 items-center justify-center rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-black/20 hover:bg-slate-50 hover:text-black"
    >
      {children}
    </button>
  );
}

function MiniSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
