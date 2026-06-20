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
import { cn } from "../lib/utils";

interface Props {
  onClose: () => void;
  initialUrl?: string;
  embedded?: boolean;
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
  {
    id: "viral",
    icon: Flame,
    label: "Best viral moment",
    tone: "Highest retention",
  },
  { id: "funny", icon: Laugh, label: "Funny", tone: "Clean punchline" },
  { id: "sad", icon: Star, label: "Sad", tone: "Quiet emotional beat" },
  { id: "angry", icon: Zap, label: "Angry / drama", tone: "Conflict spike" },
  {
    id: "shocking",
    icon: AlertCircle,
    label: "Shocking",
    tone: "Reveal moment",
  },
  {
    id: "inspirational",
    icon: Sparkles,
    label: "Inspirational",
    tone: "Lift beat",
  },
  { id: "action", icon: Target, label: "Action", tone: "Fastest section" },
  {
    id: "reaction",
    icon: Youtube,
    label: "Emotional reaction",
    tone: "Face-led response",
  },
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
const CLIP_LENGTH_SECONDS = 30;

const outputUrl = (path?: string) =>
  path ? path.replace("./output/", "/output/") : "";
const fileSize = (bytes?: number) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "";

export default function AIClipper({
  onClose,
  initialUrl = "",
  embedded = false,
}: Props) {
  const [step, setStep] = useState<Step>(0);
  const [url, setUrl] = useState(initialUrl);
  const [moment, setMoment] = useState<string>("viral");
  const [custom, setCustom] = useState("");
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);
  const [name, setName] = useState("");
  const [result, setResult] = useState<ClipResult | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const mainRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
            clip_duration: CLIP_LENGTH_SECONDS,
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
            setStatus(event.message || "720x1280 30fps MP4 ready");
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
  }, [cfg, custom, moment, name, url]);

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
      className={cn(
        "flex flex-col overflow-hidden bg-white text-slate-900",
        embedded ? "relative h-full w-full" : "fixed inset-0 z-[9999]",
      )}
    >
      {/* Header */}
      <header
        className={cn(
          "flex h-11 shrink-0 items-center justify-between border-b border-slate-200/75 bg-white/[0.88] px-3 shadow-[inset_0_-1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl",
          embedded && "hidden",
        )}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="hidden rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-100/80 hover:text-slate-800 hover:shadow-sm lg:inline-flex"
            aria-label="Close AI clipper"
          >
            <ArrowLeft className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/75 bg-white text-slate-500 transition-all hover:border-slate-300 hover:text-slate-800 hover:shadow-sm lg:hidden"
            aria-label="Close AI clipper"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-900/10 ring-1 ring-white/10">
              <Scissors className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-tight">AI Clipper</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  30s · vertical 720p
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-1 rounded-full border border-slate-200/75 bg-white/90 p-[2px] shadow-[0_8px_20px_rgba(15,23,42,0.055)] sm:flex">
          {FLOW.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(Math.max(0, Math.min(index, 3)) as Step)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-semibold transition-all duration-200",
                index === activeStage
                  ? "bg-slate-900 text-white shadow-sm"
                  : index < activeStage
                    ? "text-emerald-600 hover:bg-slate-100"
                    : "text-slate-500 hover:text-slate-700",
              )}
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7.5px] font-bold",
                  index <= activeStage
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-500",
                )}
              >
                {index < activeStage ? (
                  <Check className="h-2 w-2" />
                ) : (
                  index + 1
                )}
              </span>
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden flex-col items-end sm:flex">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
              Processing
            </span>
            <span className="text-[12px] font-bold text-slate-900">
              {progress}%
            </span>
          </div>
          <div className="relative h-9 w-9 rounded-full border-2 border-slate-200 flex items-center justify-center">
            <svg className="w-9 h-9 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="100.5"
                strokeDashoffset={100.5 - (100.5 * progress) / 100}
                className="text-slate-900 transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        ref={mainRef}
        className="clyra-visible-scrollbar min-h-0 flex-1 overflow-y-auto bg-white"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[820px] flex-col items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="clip-hero"
                initial={{ opacity: 0, y: 12, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="mb-5 flex w-full max-w-[680px] flex-col items-center text-center"
              >
                <div className="relative mb-3 grid h-12 w-12 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_20%,#8b5cf6,transparent_36%),radial-gradient(circle_at_58%_64%,#38bdf8,transparent_42%),linear-gradient(135deg,#5eead4,#3b82f6_48%,#8b5cf6)] text-white shadow-[0_18px_52px_rgba(59,130,246,0.16)]">
                  <Scissors className="h-5 w-5" />
                  <span className="absolute inset-[-14px] -z-10 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_66%)]" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Clip Studio
                </p>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Make one sharp vertical moment.
                </h1>
                <p className="mt-1.5 max-w-[520px] text-[13px] font-medium leading-relaxed text-slate-500">
                  Paste a YouTube link, choose the moment, tune subtitles, then
                  render a 30 second 720p clip.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <ClipFlowRail
            activeStage={activeStage}
            onJump={(index) => setStep(Math.max(0, Math.min(index, 3)) as Step)}
          />

          <AnimatePresence mode="wait">
            {/* Step 0: Source */}
            {step === 0 && (
              <Scene key="source">
                <div className="mx-auto w-full max-w-[680px]">
                  <div className="mx-auto max-w-[620px] text-center">
                    <Intro
                      eyebrow="Source"
                      title="Paste the link"
                      copy="Clyra reads the video context first, then finds a short moment that can stand on its own."
                      center
                      compact
                    />
                    <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                      <div className="flex items-center gap-2 rounded-full border border-slate-200/75 bg-white/80 px-3 py-1.5 backdrop-blur-md shadow-sm">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[11px] font-medium text-slate-600">
                          Retention spike detection
                        </span>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-slate-200/75 bg-white/80 px-3 py-1.5 backdrop-blur-md shadow-sm">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-[11px] font-medium text-slate-600">
                          Auto-reframing
                        </span>
                      </div>
                    </div>
                  </div>
                  <Panel className="relative mx-auto mt-5 max-w-[680px] overflow-hidden">
                    <div className="absolute top-0 right-0 p-5 opacity-[0.025]">
                      <Youtube className="h-28 w-28" />
                    </div>
                    <div className="relative">
                      <div className="mb-5 flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-500/10">
                          <Youtube className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[14px] font-bold tracking-tight">
                            YouTube Source
                          </p>
                          <p className="text-[12px] font-medium text-slate-500">
                            Shorts or Full Videos
                          </p>
                        </div>
                      </div>

                      <div className="group relative flex flex-col gap-2 rounded-[24px] border border-slate-200/75 bg-white/[0.72] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all hover:border-slate-300 focus-within:border-slate-400 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-slate-200/50 sm:flex-row">
                        <input
                          value={url}
                          onChange={(event) => setUrl(event.target.value)}
                          placeholder="https://youtu.be/..."
                          className="h-12 min-w-0 flex-1 bg-transparent px-4 text-[14px] font-semibold outline-none placeholder:text-slate-400"
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
                          className="h-11 w-full rounded-[18px] sm:w-auto"
                        >
                          Continue
                          <ChevronRight className="h-4 w-4" />
                        </PrimaryButton>
                      </div>

                      {error ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/70 p-3.5 text-[12px] font-medium text-red-700"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </motion.div>
                      ) : (
                        <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
                          Public videos work best. Restricted videos may need
                          upload or cookies.
                        </p>
                      )}
                    </div>
                  </Panel>
                </div>
              </Scene>
            )}

            {/* Step 1: Moment */}
            {step === 1 && (
              <Scene key="moment">
                <div className="mx-auto w-full max-w-[680px]">
                  <Intro
                    eyebrow="Moment"
                    title="Choose the feeling"
                    copy="Pick a known retention pattern, or describe the exact moment you want Clyra to find."
                    compact
                    center
                  />
                  <div className="mt-8 grid gap-2.5">
                    {MOMENTS.map((item, index) => {
                      const Icon = item.icon;
                      const selected = moment === item.id && !custom.trim();
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.45 }}
                          onClick={() => {
                            setMoment(item.id);
                            setCustom("");
                          }}
                          className={cn(
                            "group relative flex items-center gap-4 rounded-[24px] border p-3.5 text-left transition-all duration-300",
                            selected
                              ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/[0.16]"
                              : "border-slate-200/75 bg-white/[0.78] text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl hover:border-slate-300 hover:bg-white hover:shadow-[0_20px_50px_rgba(15,23,42,0.07)]",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
                              selected
                                ? "bg-white/10 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-800",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block text-[14px] font-bold tracking-tight">
                              {item.label}
                            </span>
                            <span
                              className={cn(
                                "mt-1 block text-[12px] font-medium",
                                selected ? "text-white/60" : "text-slate-500",
                              )}
                            >
                              {item.tone}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] font-bold transition-all",
                              selected
                                ? "border-white/20 bg-white text-slate-900"
                                : "border-slate-200 bg-white text-slate-300",
                            )}
                          >
                            {selected ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          {selected && (
                            <motion.div
                              layoutId="selection-glow"
                              className="absolute inset-0 -z-10 rounded-xl bg-slate-900 blur-2xl opacity-10"
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <Panel className="mt-5 border-slate-200/75 bg-white/[0.78]">
                    <div className="mb-2.5 flex items-center gap-2.5 px-0.5 text-slate-400">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                        Custom Direction
                      </span>
                    </div>
                    <textarea
                      value={custom}
                      onChange={(event) => {
                        setCustom(event.target.value);
                        if (event.target.value.trim()) setMoment("");
                      }}
                      placeholder='e.g., "find the moment where the host explains the paradox"'
                      rows={3}
                      className="clyra-visible-scrollbar w-full resize-none rounded-[22px] border border-slate-100 bg-white/70 px-4 py-3 text-[14px] font-semibold leading-relaxed outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
                    />
                    <div className="mt-3 grid gap-2 text-[11px] font-semibold text-slate-500 sm:grid-cols-2">
                      {[
                        "When Alex starts laughing",
                        "When the villain dies",
                        "When the host gets shocked",
                        "When the person in the red hoodie falls",
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => {
                            setCustom(example);
                            setMoment("");
                          }}
                          className="rounded-lg border border-white/80 bg-white/65 px-3 py-2 text-left transition-all hover:border-slate-200 hover:bg-white hover:text-slate-800"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </Panel>

                  <NavActions className="justify-between">
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

            {/* Step 2: Subtitles */}
            {step === 2 && (
              <Scene key="style">
                <div className="mx-auto flex w-full max-w-[680px] flex-col items-center gap-7">
                  <div className="flex w-full flex-col items-center space-y-5">
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Type className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                        Visual Preview
                      </span>
                    </div>
                    <div className="relative mx-auto aspect-[9/16] w-[min(240px,64vw)] max-h-[360px] overflow-hidden rounded-[30px] border border-slate-200/75 bg-[#050505] shadow-xl shadow-slate-900/[0.16] ring-4 ring-slate-900/5">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#050505_100%)]" />
                      <div className="absolute inset-x-7 bottom-7 top-7 rounded-lg border border-white/[0.03] bg-white/[0.01]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20">
                          <Play className="h-5 w-5 text-white translate-x-0.5" />
                        </div>
                      </div>
                      <div
                        className={cn(
                          "absolute left-1/2 w-full max-w-[85%] -translate-x-1/2 text-center transition-all duration-400",
                          cfg.position === "top"
                            ? "top-14"
                            : cfg.position === "centre"
                              ? "top-1/2 -translate-y-1/2"
                              : "bottom-14",
                        )}
                      >
                        <span style={subtitleStyle}>DYNAMIC TEXT</span>
                      </div>
                    </div>
                  </div>

                  <Panel className="w-full space-y-7">
                    <div className="space-y-2 text-center">
                      <h2 className="text-2xl font-bold tracking-tight">
                        Design your output.
                      </h2>
                      <p className="text-[14px] font-medium text-slate-500">
                        Customize the visual signature of your clip.
                      </p>
                    </div>

                    <div className="space-y-5">
                      <Control label="Duration">
                        <div className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-[12px] font-bold text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                          <span>30 seconds locked</span>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">
                            720x1280
                          </span>
                        </div>
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

                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Color Palette
                        </span>
                        <div className="flex gap-2.5">
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
                              className={cn(
                                "h-9 w-9 rounded-full transition-all duration-200",
                                cfg.colour === colour
                                  ? "ring-4 ring-slate-200 scale-110 shadow-md"
                                  : "hover:scale-105 hover:ring-2 hover:ring-slate-200",
                              )}
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

                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          Clip Metadata
                        </span>
                        <input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Untitled Clip"
                          className="h-11 w-full rounded-lg border border-slate-200/75 bg-slate-50/60 px-4 text-[14px] font-semibold outline-none transition-all placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <NavActions className="justify-between">
                        <SecondaryButton onClick={() => setStep(1)}>
                          Back
                        </SecondaryButton>
                        <PrimaryButton
                          onClick={run}
                          className="flex-1 sm:flex-none shadow-lg shadow-slate-900/10"
                        >
                          Generate Clip
                        </PrimaryButton>
                      </NavActions>
                    </div>
                  </Panel>
                </div>
              </Scene>
            )}

            {/* Step 3: Render */}
            {step === 3 && (
              <Scene key="render">
                <div className="mx-auto w-full max-w-lg text-center">
                  <div className="mx-auto mb-8 relative">
                    <div className="absolute inset-0 bg-slate-900/5 blur-3xl rounded-full" />
                    <div className="relative mx-auto grid h-36 w-36 place-items-center rounded-full border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                      <div className="relative grid h-24 w-24 place-items-center rounded-full bg-slate-900 text-white">
                        <motion.div
                          className="absolute inset-0 rounded-full border border-slate-900"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.25, 0, 0.25],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        {progress >= 100 ? (
                          <Check className="h-9 w-9" />
                        ) : (
                          <div className="relative">
                            <Loader2 className="h-9 w-9 animate-spin opacity-20" />
                            <Scissors className="absolute inset-0 m-auto h-4.5 w-4.5 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600">
                      {selectedMomentLabel}
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight">
                      Processing Assets
                    </h2>
                    <p className="text-[14px] font-medium text-slate-500 h-5">
                      {status}
                    </p>
                  </div>

                  <div className="mt-10 space-y-5">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-slate-900"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[12px] font-semibold text-slate-400">
                      <span>{progress}% Optimized</span>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{elapsed}s elapsed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Scene>
            )}

            {/* Step 4: Done */}
            {step === 4 && result && (
              <Scene key="done">
                <div className="mx-auto flex w-full max-w-[680px] flex-col items-center gap-7">
                  <div className="group relative mx-auto aspect-[9/16] w-[min(260px,72vw)] max-h-[440px] overflow-hidden rounded-[30px] border border-slate-200/75 bg-black shadow-xl shadow-slate-900/24 ring-1 ring-white/10">
                    <video
                      controls
                      playsInline
                      src={outputUrl(result.output)}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <Panel className="w-full space-y-7">
                    <div className="flex flex-col items-center space-y-2.5 text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/10">
                        <Check className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">
                        Clip Synthesized.
                      </h2>
                      <p className="line-clamp-2 text-[14px] font-medium text-slate-500">
                        {result.title}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <Stat
                        label="Duration"
                        value={`${result.clip_duration ?? "00:30"}`}
                      />
                      <Stat label="Export" value="720x1280 MP4" />
                      <Stat
                        label="Words"
                        value={`${result.word_count ?? "0"} words`}
                      />
                      <Stat
                        label="Payload"
                        value={fileSize(result.file_size) || "MP4"}
                      />
                    </div>

                    {(result.reason || result.caption) && (
                      <div className="rounded-xl border border-slate-200/75 bg-slate-50/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-slate-400">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
                            Picked because
                          </span>
                        </div>
                        <p className="text-[13px] font-medium leading-relaxed text-slate-600">
                          {result.reason ?? result.caption}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2.5 pt-1.5">
                      <a
                        href={outputUrl(result.output)}
                        download
                        className="group flex h-12 items-center justify-center gap-2.5 rounded-xl bg-slate-900 px-7 text-[14px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-lg shadow-slate-900/10"
                      >
                        <Download className="h-4.5 w-4.5 transition-transform group-hover:translate-y-0.5" />
                        Download High-Res
                      </a>
                      <SecondaryButton
                        onClick={() => {
                          setStep(0);
                          setResult(null);
                          setUrl("");
                          setError("");
                        }}
                        className="h-12 rounded-xl"
                      >
                        Create Another
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

  return embedded ? content : createPortal(content, document.body);
}

/* --- Subcomponents --- */

function ClipFlowRail({
  activeStage,
  onJump,
}: {
  activeStage: number;
  onJump: (index: number) => void;
}) {
  return (
    <div className="mb-5 w-full max-w-[680px] rounded-[26px] border border-slate-200/75 bg-white/[0.82] p-1.5 shadow-[0_14px_44px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-1">
        {FLOW.map((item, index) => {
          const complete = index < activeStage;
          const active = index === activeStage;
          return (
            <motion.button
              key={item}
              type="button"
              onClick={() => onJump(index)}
              className={cn(
                "group flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-1.5 py-2 text-center transition-all duration-300 sm:flex-row sm:gap-2 sm:px-3 sm:text-left",
                active
                  ? "bg-slate-950 text-white shadow-[0_16px_38px_rgba(15,23,42,0.13)]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              )}
              animate={{
                y: active ? 0 : 0,
                opacity: index > activeStage + 1 ? 0.58 : 1,
              }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-all",
                  active
                    ? "bg-white text-slate-950"
                    : complete
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-400",
                )}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-bold tracking-tight">
                  {item}
                </span>
                <span
                  className={cn(
                    "hidden text-[10px] font-medium sm:block",
                    active ? "text-white/60" : "text-slate-400",
                  )}
                >
                  {active ? "Current step" : complete ? "Complete" : "Ready"}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function Scene({ children }: { children: ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
  center = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  compact?: boolean;
  center?: boolean;
}) {
  return (
    <div
      className={cn(compact ? "" : "max-w-md", center && "mx-auto text-center")}
    >
      <motion.p
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.18 }}
        className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600"
      >
        {eyebrow}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
        className={cn(
          "mt-3 font-bold tracking-tight text-slate-900",
          compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
        )}
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.34 }}
        className="mt-5 text-[15px] font-medium leading-relaxed text-slate-500"
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
      className={cn(
        "rounded-xl border border-slate-200/75 bg-white/85 p-6 sm:p-7 shadow-[0_24px_60px_-16px_rgba(15,23,42,0.12)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Control({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-[100px_1fr] sm:items-center">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </span>
      <div className="grid grid-flow-col gap-1.25 rounded-lg border border-slate-200/75 bg-slate-50/70 p-1.25">
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
      className={cn(
        "h-9 rounded-md px-3.5 text-[12px] font-semibold transition-all duration-200",
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
          : "text-slate-500 hover:bg-white/70 hover:text-slate-800",
      )}
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
    <div className={cn("mt-8 flex justify-end gap-3", className)}>
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
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-6 text-[14px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-20",
        className,
      )}
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
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg border border-slate-200/75 bg-white/80 px-6 text-[13px] font-semibold text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:text-slate-800 active:scale-[0.98] backdrop-blur-md shadow-sm",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200/75 bg-white/75 px-4 py-3.5 backdrop-blur-md">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-[14px] font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
