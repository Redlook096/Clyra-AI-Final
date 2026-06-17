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
const PIPELINE_STEPS = [
  "captions",
  "analyze",
  "clip",
  "transcribe",
  "subtitles",
  "render",
  "complete",
];
const DEFAULT_CONFIG = {
  font: "Impact",
  fontSize: "86",
  colour: "#FFFFFF",
  position: "bottom" as CaptionPosition,
};

const outputUrl = (path?: string) =>
  path ? path.replace("./output/", "/output/") : "";
const fileSize = (bytes?: number) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "";

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
    const interval = window.setInterval(
      () => setElapsed((value) => value + 1),
      1000,
    );
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
        : Math.max(
            8,
            Math.round(
              ((index >= 0 ? index + 0.7 : seenSteps.current.size) /
                PIPELINE_STEPS.length) *
                100,
            ),
          );
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

          if (event.type === "error")
            throw new Error(event.message || "Clipper failed");
          if (event.step) {
            updateProgress(event.step, event.message);
            if (event.step === "transcribe")
              runSummary.current.timing_source = event.timing_source;
            if (event.step === "subtitles" && event.word_count)
              runSummary.current.word_count = event.word_count;
          }

          if (event.type === "complete" || event.step === "complete") {
            setResult({
              ...runSummary.current,
              ...event,
              word_count: event.word_count ?? runSummary.current.word_count,
            });
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
    textShadow:
      "0 3px 0 #000, 0 -3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 12px 24px rgba(0,0,0,.5)",
    fontWeight: 900,
  };

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-slate-50/60 text-[#141414] backdrop-blur-[32px] backdrop-saturate-150"
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.04] bg-white/40 px-4 backdrop-blur-2xl sm:px-8">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onClose}
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-black/5 bg-white/50 text-slate-500 transition-all hover:border-black/10 hover:bg-white hover:text-black active:scale-95"
            aria-label="Close AI clipper"
          >
            <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <div className="h-4 w-px bg-black/5" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/10 ring-1 ring-white/10">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[14px] font-bold tracking-tight">AI Clipper</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Ready for export
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-1.5 rounded-full border border-black/[0.04] bg-black/[0.02] p-1 sm:flex">
          {FLOW.map((item, index) => (
            <div
              key={item}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold transition-all duration-300 ${
                index === activeStage
                  ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                  : index < activeStage
                    ? "text-emerald-600"
                    : "text-slate-400"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                  index <= activeStage
                    ? "bg-black text-white"
                    : "bg-black/5 text-slate-400"
                }`}
              >
                {index < activeStage ? (
                  <Check className="h-2.5 w-2.5" />
                ) : (
                  index + 1
                )}
              </span>
              {item}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Processing
            </span>
            <span className="text-[13px] font-bold text-slate-900">
              {progress}%
            </span>
          </div>
          <div className="h-10 w-10 rounded-full border-2 border-slate-100 flex items-center justify-center relative">
            <svg className="w-10 h-10 -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray="113.1"
                strokeDashoffset={113.1 - (113.1 * progress) / 100}
                className="text-black transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-slate-300" />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-6xl items-center justify-center p-6 sm:p-12">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Scene key="source">
                <div className="grid w-full gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
                  <div>
                    <Intro
                      eyebrow="Intelligence at the source"
                      title="Paste the link."
                      copy="Clyra uses deep reasoning to find retention-optimized moments and burns in word-timed subtitles automatically."
                    />
                    <div className="mt-8 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white/50 px-3 py-1.5 backdrop-blur-md">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[12px] font-medium text-slate-600">
                          Retention spike detection
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-black/5 bg-white/50 px-3 py-1.5 backdrop-blur-md">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[12px] font-medium text-slate-600">
                          Auto-reframing
                        </span>
                      </div>
                    </div>
                  </div>
                  <Panel className="relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                      <Youtube className="h-32 w-32" />
                    </div>
                    <div className="relative">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-500/10">
                          <Youtube className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold tracking-tight">
                            YouTube Source
                          </p>
                          <p className="text-[13px] font-medium text-slate-500">
                            Shorts or Full Videos
                          </p>
                        </div>
                      </div>

                      <div className="group relative flex flex-col gap-2 rounded-2xl border border-black/[0.06] bg-slate-50/50 p-2 transition-all hover:border-black/10 focus-within:border-black/20 focus-within:bg-white focus-within:shadow-xl focus-within:shadow-black/5">
                        <input
                          value={url}
                          onChange={(event) => setUrl(event.target.value)}
                          placeholder="https://youtu.be/..."
                          className="h-14 min-w-0 flex-1 bg-transparent px-4 text-[15px] font-semibold outline-none placeholder:text-slate-400"
                          autoFocus
                          onKeyDown={(event) =>
                            event.key === "Enter" &&
                            url.includes("youtu") &&
                            setStep(1)
                          }
                        />
                        <PrimaryButton
                          onClick={() => setStep(1)}
                          disabled={!url.includes("youtu")}
                          className="h-12 w-full sm:w-auto"
                        >
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </PrimaryButton>
                      </div>

                      {error ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-[13px] font-medium text-red-700"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      ) : (
                        <p className="mt-5 text-center text-[12px] font-medium text-slate-400">
                          Clyra analyzes content patterns to ensure high-hook
                          potential.
                        </p>
                      )}
                    </div>
                  </Panel>
                </div>
              </Scene>
            )}

            {step === 1 && (
              <Scene key="moment">
                <div className="w-full max-w-4xl">
                  <Intro
                    eyebrow="Semantic moment selection"
                    title="Define the vibe."
                    copy="Select a pre-optimized pattern or tell Clyra exactly what kind of moment to extract."
                    compact
                  />
                  <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {MOMENTS.map((item, index) => {
                      const Icon = item.icon;
                      const selected = moment === item.id && !custom.trim();
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.5 }}
                          onClick={() => {
                            setMoment(item.id);
                            setCustom("");
                          }}
                          className={`group relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-500 ${
                            selected
                              ? "border-black bg-black text-white shadow-2xl shadow-black/20"
                              : "border-black/[0.06] bg-white/40 text-black hover:border-black/15 hover:bg-white"
                          }`}
                        >
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 ${
                              selected
                                ? "bg-white/10 text-white"
                                : "bg-black/[0.03] text-slate-400 group-hover:bg-black/5 group-hover:text-black"
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="mt-6">
                            <span className="block text-[15px] font-bold tracking-tight">
                              {item.label}
                            </span>
                            <span
                              className={`mt-1 block text-[13px] font-medium ${
                                selected ? "text-white/60" : "text-slate-500"
                              }`}
                            >
                              {item.tone}
                            </span>
                          </div>
                          {selected && (
                            <motion.div
                              layoutId="selection-glow"
                              className="absolute inset-0 -z-10 rounded-2xl bg-black blur-2xl opacity-10"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <Panel className="mt-6 border-black/[0.04] bg-black/[0.02]">
                    <div className="flex items-center gap-3 px-1 mb-3 text-slate-400">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        Custom Direction
                      </span>
                    </div>
                    <textarea
                      value={custom}
                      onChange={(event) => {
                        setCustom(event.target.value);
                        if (event.target.value.trim()) setMoment("");
                      }}
                      placeholder='e.g. "find the moment where the host explains the paradox"'
                      rows={2}
                      className="w-full resize-none bg-transparent px-1 text-[15px] font-semibold leading-relaxed outline-none placeholder:text-slate-300"
                    />
                  </Panel>

                  <NavActions>
                    <SecondaryButton onClick={() => setStep(0)}>
                      Back
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={() => setStep(2)}
                      disabled={!moment && !custom.trim()}
                    >
                      Style Subtitles
                      <ChevronRight className="h-4 w-4" />
                    </PrimaryButton>
                  </NavActions>
                </div>
              </Scene>
            )}

            {step === 2 && (
              <Scene key="style">
                <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Type className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        Visual Preview
                      </span>
                    </div>
                    <div className="relative aspect-[9/16] max-h-[520px] mx-auto overflow-hidden rounded-[32px] border border-black/5 bg-[#050505] shadow-2xl shadow-black/20 ring-8 ring-black/5">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#050505_100%)]" />
                      <div className="absolute inset-x-8 bottom-8 top-8 rounded-2xl border border-white/[0.03] bg-white/[0.01]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                          <Play className="h-6 w-6 text-white translate-x-0.5" />
                        </div>
                      </div>
                      <div
                        className={`absolute left-1/2 w-full max-w-[85%] -translate-x-1/2 text-center transition-all duration-500 ${
                          cfg.position === "top"
                            ? "top-16"
                            : cfg.position === "centre"
                              ? "top-1/2 -translate-y-1/2"
                              : "bottom-16"
                        }`}
                      >
                        <span style={subtitleStyle}>DYNAMIC TEXT</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold tracking-tight">
                        Design your output.
                      </h2>
                      <p className="text-[15px] font-medium text-slate-500">
                        Customize the visual signature of your clip.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <Control label="Duration">
                        {["30", "40", "60"].map((value) => (
                          <SegmentButton
                            key={value}
                            active={len === value}
                            onClick={() => setLen(value)}
                          >
                            {value}s
                          </SegmentButton>
                        ))}
                      </Control>

                      <Control label="Size">
                        {[
                          ["64", "S"],
                          ["86", "M"],
                          ["108", "L"],
                        ].map(([value, label]) => (
                          <SegmentButton
                            key={value}
                            active={cfg.fontSize === value}
                            onClick={() => setCfg({ ...cfg, fontSize: value })}
                          >
                            {label}
                          </SegmentButton>
                        ))}
                      </Control>

                      <Control label="Position">
                        {[
                          ["bottom", "Bottom"],
                          ["centre", "Mid"],
                          ["top", "Top"],
                        ].map(([value, label]) => (
                          <SegmentButton
                            key={value}
                            active={cfg.position === value}
                            onClick={() =>
                              setCfg({
                                ...cfg,
                                position: value as CaptionPosition,
                              })
                            }
                          >
                            {label}
                          </SegmentButton>
                        ))}
                      </Control>

                      <div className="space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          Color Palette
                        </span>
                        <div className="flex gap-3">
                          {[
                            "#FFFFFF",
                            "#F5C84C",
                            "#56C7D9",
                            "#F06752",
                            "#A5F3FC",
                          ].map((colour) => (
                            <button
                              key={colour}
                              type="button"
                              onClick={() => setCfg({ ...cfg, colour })}
                              className={`h-10 w-10 rounded-full transition-all duration-300 ${
                                cfg.colour === colour
                                  ? "ring-4 ring-black/10 scale-110"
                                  : "hover:scale-105"
                              }`}
                              style={{
                                background: colour,
                                border:
                                  colour === "#FFFFFF"
                                    ? "1px solid rgba(0,0,0,0.1)"
                                    : "none",
                              }}
                              aria-label={`Use ${colour}`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          Clip Metadata
                        </span>
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Untitled Clip"
                          className="h-14 w-full rounded-2xl border border-black/[0.06] bg-slate-50/50 px-5 text-[15px] font-semibold outline-none transition-all placeholder:text-slate-300 focus:border-black/15 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <NavActions>
                        <SecondaryButton onClick={() => setStep(1)}>
                          Back
                        </SecondaryButton>
                        <PrimaryButton
                          onClick={run}
                          className="flex-1 sm:flex-none shadow-xl shadow-black/10"
                        >
                          Generate Clip
                        </PrimaryButton>
                      </NavActions>
                    </div>
                  </div>
                </div>
              </Scene>
            )}

            {step === 3 && (
              <Scene key="render">
                <div className="w-full max-w-lg text-center">
                  <div className="mx-auto mb-10 relative">
                    <div className="absolute inset-0 bg-black/5 blur-3xl rounded-full" />
                    <div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full border border-black/5 bg-white shadow-2xl shadow-black/5">
                      <div className="relative grid h-28 w-28 place-items-center rounded-full bg-black text-white">
                        <motion.div
                          className="absolute inset-0 rounded-full border border-black"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        {progress >= 100 ? (
                          <Check className="h-10 w-10" />
                        ) : (
                          <div className="relative">
                            <Loader2 className="h-10 w-10 animate-spin opacity-20" />
                            <Scissors className="absolute inset-0 m-auto h-5 w-5 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-600">
                      {selectedMomentLabel}
                    </p>
                    <h2 className="text-4xl font-bold tracking-tight">
                      Processing Assets
                    </h2>
                    <p className="text-[15px] font-medium text-slate-500 h-6">
                      {status}
                    </p>
                  </div>

                  <div className="mt-12 space-y-6">
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/[0.04]">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-black"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[13px] font-bold text-slate-400">
                      <span>{progress}% Optimized</span>
                      <div className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{elapsed}s elapsed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Scene>
            )}

            {step === 4 && result && (
              <Scene key="done">
                <div className="grid w-full gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                  <div className="group relative aspect-[9/16] max-h-[640px] mx-auto overflow-hidden rounded-[32px] border border-black/5 bg-black shadow-2xl shadow-black/30 ring-1 ring-white/10">
                    <video
                      controls
                      playsInline
                      src={outputUrl(result.output)}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10">
                        <Check className="h-6 w-6" />
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">
                        Clip Synthesized.
                      </h2>
                      <p className="line-clamp-2 text-[15px] font-medium text-slate-500">
                        {result.title}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Stat
                        label="Segment"
                        value={`${result.clip_duration ?? "00:00"}`}
                      />
                      <Stat label="Export" value="720p 30fps" />
                      <Stat
                        label="Tokens"
                        value={`${result.word_count ?? "0"} words`}
                      />
                      <Stat
                        label="Payload"
                        value={fileSize(result.file_size) || "MP4"}
                      />
                    </div>

                    {result.caption && (
                      <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-5">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            AI Context
                          </span>
                        </div>
                        <p className="text-[14px] font-medium leading-relaxed text-slate-600">
                          {result.caption}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      <a
                        href={outputUrl(result.output)}
                        download
                        className="group flex h-14 items-center justify-center gap-3 rounded-2xl bg-black px-8 text-[15px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-xl shadow-black/10"
                      >
                        <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                        Download High-Res
                      </a>
                      <SecondaryButton
                        onClick={() => {
                          setStep(0);
                          setResult(null);
                          setUrl("");
                          setError("");
                        }}
                        className="h-14 rounded-2xl"
                      >
                        Create Another
                      </SecondaryButton>
                    </div>
                  </div>
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
      initial={{ opacity: 0, y: 30, scale: 0.98, filter: "blur(20px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(20px)" }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="w-full"
    >
      {children}
    </motion.section>
  );
}

function Intro({
  eyebrow,
  title,
  copy,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "max-w-xl"}>
      <motion.p
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-600"
      >
        {eyebrow}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`${compact ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl"} mt-4 font-bold tracking-tight text-slate-900`}
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 text-[16px] font-medium leading-relaxed text-slate-500"
      >
        {copy}
      </motion.p>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[32px] border border-black/[0.04] bg-white/70 p-8 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </span>
      <div className="grid grid-flow-col gap-1.5 rounded-2xl border border-black/[0.04] bg-black/[0.02] p-1.5">
        {children}
      </div>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-xl px-4 text-[13px] font-bold transition-all duration-300 ${
        active
          ? "bg-white text-black shadow-sm ring-1 ring-black/5"
          : "text-slate-400 hover:bg-white/50 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function NavActions({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-10 flex justify-end gap-4 ${className}`}>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-black px-7 text-[15px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-20 ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-12 items-center justify-center rounded-xl border border-black/[0.06] bg-white/50 px-7 text-[14px] font-bold text-slate-600 transition-all hover:border-black/15 hover:bg-white hover:text-black active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/[0.04] bg-white/40 px-5 py-4 backdrop-blur-md">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[15px] font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

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
