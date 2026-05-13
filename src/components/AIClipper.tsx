import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Youtube,
  Scissors,
  Wand2,
  Download,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Video,
  ChevronRight,
  ArrowLeft,
  Play,
  Flame,
  SmilePlus,
  Star,
  Zap,
  Target,
  CheckCircle2,
  Clock,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIClipperProps {
  onClose: () => void;
}

interface SubtitleConfig {
  fontSize: "36" | "52" | "68";
  font: "Impact" | "Arial" | "Helvetica" | "Montserrat";
  textColor: string;
  strokeColor: string;
  position: "bottom" | "center" | "top";
}

interface PipelineStep {
  id: number;
  label: string;
  activeLabel: string;
  doneLabel: string;
  detail?: string;
  status: "idle" | "active" | "done";
}

interface ClipResult {
  videoTitle: string;
  originalDuration: string;
  clipDuration: string;
  momentType: string;
  aiReasoning: string;
  thumbnailUrl: string;
  subtitleStyle: string;
  outputPath: string;
}

type MomentType =
  | "viral"
  | "funny"
  | "dramatic"
  | "inspiring"
  | "surprising"
  | "action";

// 0 = URL, 1 = Moment Type, 2 = Subtitle Config, 3 = Processing, 4 = Result
type AppStep = 0 | 1 | 2 | 3 | 4;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT_SIZE_PILLS: { label: string; value: SubtitleConfig["fontSize"] }[] =
  [
    { label: "S", value: "36" },
    { label: "M", value: "52" },
    { label: "L", value: "68" },
  ];

const FONT_OPTIONS: SubtitleConfig["font"][] = [
  "Impact",
  "Arial",
  "Helvetica",
  "Montserrat",
];

const POSITION_PILLS: { label: string; value: SubtitleConfig["position"] }[] = [
  { label: "Bottom", value: "bottom" },
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
];

const DEFAULT_CONFIG: SubtitleConfig = {
  fontSize: "52",
  font: "Impact",
  textColor: "#FFFFFF",
  strokeColor: "#000000",
  position: "bottom",
};

interface MomentOption {
  id: MomentType;
  icon: typeof Flame;
  label: string;
  description: string;
}

const MOMENT_OPTIONS: MomentOption[] = [
  {
    id: "viral",
    icon: Flame,
    label: "High Energy",
    description: "Most shareable, high-energy moment",
  },
  {
    id: "funny",
    icon: SmilePlus,
    label: "Humorous",
    description: "Biggest laugh of the video",
  },
  {
    id: "dramatic",
    icon: Star,
    label: "Dramatic",
    description: "Most intense, emotional peak",
  },
  {
    id: "inspiring",
    icon: Sparkles,
    label: "Inspirational",
    description: "Most uplifting moment",
  },
  {
    id: "surprising",
    icon: Zap,
    label: "Surprising",
    description: "Biggest twist or reveal",
  },
  {
    id: "action",
    icon: Target,
    label: "Action-Packed",
    description: "Most exciting action sequence",
  },
];

const PIPELINE_STEPS: Omit<PipelineStep, "status" | "detail">[] = [
  {
    id: 1,
    label: "Getting video info",
    activeLabel: "Fetching video metadata...",
    doneLabel: "Video info retrieved",
  },
  {
    id: 2,
    label: "Downloading audio",
    activeLabel: "Downloading audio stream...",
    doneLabel: "Audio downloaded",
  },
  {
    id: 3,
    label: "Transcribing",
    activeLabel: "Transcribing with Whisper...",
    doneLabel: "Transcription complete",
  },
  {
    id: 4,
    label: "Capturing keyframes",
    activeLabel: "Extracting keyframes...",
    doneLabel: "Keyframes captured",
  },
  {
    id: 5,
    label: "AI analyzing",
    activeLabel: "AI finding the best moment...",
    doneLabel: "Best moment found",
  },
  {
    id: 6,
    label: "Downloading clip",
    activeLabel: "Downloading video segment...",
    doneLabel: "Clip downloaded",
  },
  {
    id: 7,
    label: "Adding subtitles",
    activeLabel: "Generating word-accurate subtitles...",
    doneLabel: "Subtitles ready",
  },
  {
    id: 8,
    label: "Finalizing",
    activeLabel: "Burning subtitles into video...",
    doneLabel: "Final clip ready",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11,}/i.test(url);
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Gradient progress bar from black to slate for the processing view. */
function GradientProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          background:
            "linear-gradient(90deg, #0f172a 0%, #334155 50%, #64748b 100%)",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

/** Individual pipeline step row — clean, no connecting lines. */
function PipelineRow({
  step,
  index,
  videoTitle,
  wordCount,
  clipDuration,
}: {
  step: PipelineStep;
  index: number;
  videoTitle?: string;
  wordCount?: number;
  clipDuration?: string;
}) {
  const isActive = step.status === "active";
  const isDone = step.status === "done";

  return (
    <motion.div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
        isActive
          ? "bg-slate-50 ring-1 ring-slate-200 shadow-sm"
          : isDone
            ? "bg-transparent"
            : "bg-transparent"
      }`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      {/* Status icon */}
      <div className="shrink-0 w-7 h-7 flex items-center justify-center">
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 text-black animate-spin" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-slate-200" />
        )}
      </div>

      {/* Label + detail */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium transition-colors duration-300 ${
            isDone
              ? "text-slate-500"
              : isActive
                ? "text-black"
                : "text-slate-400"
          }`}
        >
          {isActive ? step.activeLabel : isDone ? step.doneLabel : step.label}
        </p>
        {isDone && step.detail && (
          <motion.p
            className="text-xs text-slate-400 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {step.detail}
          </motion.p>
        )}
        {/* Show real data in context */}
        {isDone && step.id === 1 && videoTitle && (
          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">
            {videoTitle}
          </p>
        )}
        {isDone && step.id === 3 && wordCount && (
          <p className="text-xs text-slate-400 mt-0.5">
            {wordCount.toLocaleString()} words transcribed
          </p>
        )}
        {isDone && step.id === 5 && clipDuration && (
          <p className="text-xs text-slate-400 mt-0.5">
            Clip duration: {clipDuration}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AIClipper({ onClose }: AIClipperProps) {
  // --- State ---
  const [step, setStep] = useState<AppStep>(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [momentType, setMomentType] = useState<MomentType | null>(null);
  const [customMoment, setCustomMoment] = useState("");
  const [config, setConfig] = useState<SubtitleConfig>(DEFAULT_CONFIG);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" as const })),
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ClipResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [videoTitle, setVideoTitle] = useState<string | undefined>();
  const [wordCount, setWordCount] = useState<number | undefined>();
  const [clipDuration, setClipDuration] = useState<string | undefined>();

  const containerRef = useRef<HTMLDivElement>(null);
  const pipelineStepsRef = useRef(pipelineSteps);
  pipelineStepsRef.current = pipelineSteps;
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- URL validation ---
  const urlValid = isValidYouTubeUrl(youtubeUrl.trim());

  // --- Elapsed time tracker ---
  useEffect(() => {
    if (step === 3 && error === null) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    }
    return () => {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
    };
  }, [step, error]);

  // --- Real SSE pipeline via /api/clipper/start ---
  const runPipeline = useCallback(async () => {
    setError(null);
    setResult(null);
    setVideoTitle(undefined);
    setWordCount(undefined);
    setClipDuration(undefined);
    const freshSteps = PIPELINE_STEPS.map((s) => ({
      ...s,
      status: "idle" as const,
    }));
    setPipelineSteps(freshSteps);
    setProgress(0);

    // Effective moment type: custom text overrides presets
    const effectiveMomentType = customMoment.trim() || momentType || "viral";

    try {
      const backendConfig = {
        font_size: parseInt(config.fontSize),
        font: config.font,
        text_colour: config.textColor,
        stroke_colour: config.strokeColor,
        position:
          config.position === "bottom"
            ? "bottom-centre"
            : config.position === "center"
              ? "centre"
              : "top-centre",
        moment_type: effectiveMomentType,
      };

      const response = await fetch("/api/clipper/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl.trim(), config: backendConfig }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as any).error || `Server error: ${response.status}`,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const event = JSON.parse(trimmed.slice(6));

            if (event.type === "error") {
              throw new Error(event.message || "Pipeline error");
            }

            if (event.type === "progress") {
              const stepMap: Record<string, number> = {
                info: 0,
                audio: 1,
                transcribe: 2,
                keyframes: 3,
                analyze: 4,
                clip: 5,
                subtitles: 6,
                burn: 7,
              };
              const stepIdx = stepMap[event.step] ?? -1;

              // Capture real data from progress events
              if (event.step === "info" && (event as any).title) {
                setVideoTitle((event as any).title);
              }
              if (event.step === "transcribe" && (event as any).word_count) {
                setWordCount((event as any).word_count);
              }
              if (event.step === "clip" && (event as any).clip_duration) {
                setClipDuration((event as any).clip_duration);
              }

              if (event.status === "running" && stepIdx >= 0) {
                setPipelineSteps((prev) =>
                  prev.map((s, idx) =>
                    idx === stepIdx ? { ...s, status: "active" as const } : s,
                  ),
                );
              }

              if (event.status === "complete" && stepIdx >= 0) {
                const detail = event.message || event.reason || "";
                setPipelineSteps((prev) =>
                  prev.map((s, idx) =>
                    idx === stepIdx
                      ? { ...s, status: "done" as const, detail }
                      : s,
                  ),
                );
                setProgress(
                  Math.round(((stepIdx + 1) / PIPELINE_STEPS.length) * 100),
                );
              }
            }

            if (event.type === "complete") {
              setResult({
                videoTitle:
                  (event as any).title || videoTitle || "YouTube Video",
                originalDuration: (event as any).original_duration || "Unknown",
                clipDuration:
                  (event as any).clip_duration || clipDuration || "Unknown",
                momentType: (event as any).moment_type || effectiveMomentType,
                aiReasoning: (event as any).reason || "AI-selected moment",
                thumbnailUrl: "",
                subtitleStyle: `${config.font} ${config.fontSize}px — ${config.position}`,
                outputPath: (event as any).output || "./output/final_clip.mp4",
              });
              setProgress(100);
              setStep(4);
            }
          } catch (parseErr) {
            if (
              parseErr instanceof Error &&
              parseErr.message.includes("Pipeline")
            ) {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
    }
  }, [youtubeUrl, config, momentType, customMoment, videoTitle, clipDuration]);

  // --- Handlers ---
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlValid) return;
    setStep(1);
  };

  const handleMomentContinue = () => {
    if (!momentType && !customMoment.trim()) return;
    setStep(2);
  };

  const handleMomentBack = () => {
    setStep(0);
  };

  const handleConfigBack = () => {
    setStep(1);
  };

  const handleConfigContinue = () => {
    setStep(3);
    setTimeout(() => runPipeline(), 300);
  };

  const handleUseDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleRestart = () => {
    setYoutubeUrl("");
    setMomentType(null);
    setCustomMoment("");
    setConfig(DEFAULT_CONFIG);
    setPipelineSteps(
      PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" as const })),
    );
    setProgress(0);
    setResult(null);
    setError(null);
    setVideoTitle(undefined);
    setWordCount(undefined);
    setClipDuration(undefined);
    setStep(0);
  };

  const handleNewVideo = () => {
    setYoutubeUrl("");
    setMomentType(null);
    setCustomMoment("");
    setConfig(DEFAULT_CONFIG);
    setPipelineSteps(
      PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" as const })),
    );
    setProgress(0);
    setResult(null);
    setError(null);
    setVideoTitle(undefined);
    setWordCount(undefined);
    setClipDuration(undefined);
    setStep(0);
  };

  const handleTryAgain = () => {
    setError(null);
    setResult(null);
    const freshSteps = PIPELINE_STEPS.map((s) => ({
      ...s,
      status: "idle" as const,
    }));
    setPipelineSteps(freshSteps);
    setProgress(0);
    setTimeout(() => runPipeline(), 300);
  };

  // --- Step indicator ---
  const renderStepIndicator = () => {
    const labels = ["URL", "Moment", "Style", "Process", "Result"];
    return (
      <div className="flex items-center justify-center gap-2.5">
        {labels.map((label, i) => {
          const isActive = step === i;
          const isPast = step > i;
          return (
            <div key={label} className="flex items-center gap-2.5">
              <div
                className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-300 ${
                  isActive
                    ? "text-black"
                    : isPast
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                    isActive
                      ? "bg-slate-100 border-slate-400 text-black"
                      : isPast
                        ? "bg-emerald-50 border-emerald-500 text-emerald-600"
                        : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  {isPast ? <Check className="w-2.5 h-2.5" /> : i + 1}
                </span>
                {label}
              </div>
              {i < labels.length - 1 && (
                <div className="w-5 h-px bg-slate-200" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // STEP 0 — URL Input
  // =========================================================================
  const renderUrlInput = () => (
    <motion.div
      key="step-url"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center flex-1 px-6"
    >
      <motion.h1
        className="text-2xl font-semibold text-black tracking-tight mb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Create Clip
      </motion.h1>
      <motion.p
        className="text-sm text-slate-500 mb-10 max-w-md text-center leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        Extract the most engaging moment from any video
      </motion.p>

      <motion.form
        onSubmit={handleUrlSubmit}
        className="w-full max-w-lg flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <div className="relative w-full">
          <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200 shadow-sm"
            autoFocus
          />
        </div>
        <p className="text-[11px] text-slate-400 -mt-2">
          Paste any YouTube link
        </p>
        <button
          type="submit"
          disabled={!urlValid}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-black text-white shadow-sm hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.form>
    </motion.div>
  );

  // =========================================================================
  // STEP 1 — Moment Type Selection
  // =========================================================================
  const renderMomentType = () => (
    <motion.div
      key="step-moment"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center flex-1 px-6 py-8"
    >
      <motion.h2
        className="text-xl font-semibold text-black mb-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        What should we look for?
      </motion.h2>
      <motion.p
        className="text-sm text-slate-500 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Choose the energy you want to capture
      </motion.p>

      {/* Pill buttons */}
      <motion.div
        className="w-full max-w-lg flex flex-col gap-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {MOMENT_OPTIONS.map((mo, i) => {
          const isSelected = momentType === mo.id && !customMoment.trim();
          const Icon = mo.icon;
          return (
            <motion.button
              key={mo.id}
              onClick={() => {
                setMomentType(mo.id);
                setCustomMoment("");
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.99 }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition-all duration-200 text-left ${
                isSelected
                  ? "bg-black text-white border-black shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-500"}`}
              />
              <span className="text-sm font-medium">{mo.label}</span>
              <span
                className={`text-xs ml-auto ${isSelected ? "text-slate-300" : "text-slate-400"}`}
              >
                {mo.description}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Custom text input */}
      <motion.div
        className="w-full max-w-lg mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
      >
        <input
          type="text"
          value={customMoment}
          onChange={(e) => {
            setCustomMoment(e.target.value);
            if (e.target.value.trim()) setMomentType(null);
          }}
          placeholder="Or describe what you're looking for..."
          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200"
        />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex items-center gap-3 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={handleMomentBack}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
        >
          <span className="inline-flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </span>
        </button>
        <button
          onClick={handleMomentContinue}
          disabled={!momentType && !customMoment.trim()}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-black text-white shadow-sm hover:bg-slate-800 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );

  // =========================================================================
  // STEP 2 — Subtitle Configuration
  // =========================================================================
  const renderSubtitleConfig = () => {
    const previewFontSize =
      config.position === "center"
        ? Math.min(Number(config.fontSize), 68) * 0.55
        : Math.min(Number(config.fontSize), 68) * 0.45;

    const previewPositionClass =
      config.position === "bottom"
        ? "items-end pb-6"
        : config.position === "top"
          ? "items-start pt-6"
          : "items-center";

    return (
      <motion.div
        key="step-config"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center flex-1 px-6 py-8"
      >
        <motion.h2
          className="text-xl font-semibold text-black mb-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          Subtitle style
        </motion.h2>
        <motion.p
          className="text-sm text-slate-500 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Customise how subtitles will appear in your clip
        </motion.p>

        {/* Dummy video frame preview */}
        <motion.div
          className="w-full max-w-lg mb-7"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden relative">
            {/* Subtitles preview */}
            <div
              className={`absolute inset-0 flex ${previewPositionClass} justify-center px-4`}
            >
              <p
                style={{
                  fontFamily: config.font,
                  fontSize: `${previewFontSize}px`,
                  color: config.textColor,
                  WebkitTextStroke:
                    config.strokeColor !== "#000000"
                      ? `2px ${config.strokeColor}`
                      : undefined,
                  textShadow:
                    config.strokeColor === "#000000"
                      ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                      : undefined,
                }}
                className="font-bold leading-tight text-center"
              >
                SUBTITLES
              </p>
            </div>
            {/* Label */}
            <span className="absolute top-3 left-3 text-[10px] text-slate-500 uppercase tracking-wider">
              Preview
            </span>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          className="w-full max-w-lg space-y-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Font Size + Font in a row */}
          <div className="flex gap-4">
            {/* Font Size */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">
                Size
              </label>
              <div className="flex gap-2">
                {FONT_SIZE_PILLS.map((pill) => (
                  <button
                    key={pill.value}
                    onClick={() =>
                      setConfig((c) => ({ ...c, fontSize: pill.value }))
                    }
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      config.fontSize === pill.value
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="flex-[2]">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">
                Font
              </label>
              <select
                value={config.font}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    font: e.target.value as SubtitleConfig["font"],
                  }))
                }
                className="w-full py-2.5 px-3 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200 cursor-pointer"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Text Color + Outline Color + Position in a row */}
          <div className="flex gap-4 items-end">
            {/* Text Color */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">
                Text
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.textColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, textColor: e.target.value }))
                  }
                  className="w-8 h-8 rounded-full border border-slate-200 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                />
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  {config.textColor}
                </span>
              </div>
            </div>

            {/* Outline Color */}
            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">
                Outline
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.strokeColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, strokeColor: e.target.value }))
                  }
                  className="w-8 h-8 rounded-full border border-slate-200 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                />
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  {config.strokeColor}
                </span>
              </div>
            </div>

            {/* Position */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2.5">
                Position
              </label>
              <div className="flex gap-2">
                {POSITION_PILLS.map((pill) => (
                  <button
                    key={pill.value}
                    onClick={() =>
                      setConfig((c) => ({ ...c, position: pill.value }))
                    }
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      config.position === pill.value
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex items-center gap-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <button
            onClick={handleConfigBack}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </span>
          </button>
          <button
            onClick={handleUseDefaults}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition-all duration-200"
          >
            Use Defaults
          </button>
          <button
            onClick={handleConfigContinue}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-black text-white shadow-sm hover:bg-slate-800 hover:shadow-md active:scale-[0.98] transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            Start Clipping
          </button>
        </motion.div>
      </motion.div>
    );
  };

  // =========================================================================
  // STEP 3 — Processing Pipeline
  // =========================================================================
  const renderProcessing = () => (
    <motion.div
      key="step-processing"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col flex-1 px-6 py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          className="inline-flex items-center gap-2.5 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-black" />
          </span>
          <h2 className="text-lg font-semibold text-black">
            Processing your clip
          </h2>
        </motion.div>
        <motion.div
          className="flex items-center justify-center gap-3 text-xs text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatElapsed(elapsedSeconds)}
          </span>
          <span className="text-slate-300">·</span>
          <span>{progress}% complete</span>
        </motion.div>
      </div>

      {/* Gradient Progress Bar */}
      <div className="w-full max-w-md mx-auto mb-10">
        <GradientProgressBar progress={progress} />
      </div>

      {/* Pipeline Steps */}
      <div className="w-full max-w-md mx-auto space-y-1">
        {pipelineSteps.map((ps, idx) => (
          <PipelineRow
            key={ps.id}
            step={ps}
            index={idx}
            videoTitle={videoTitle}
            wordCount={wordCount}
            clipDuration={clipDuration}
          />
        ))}
      </div>
    </motion.div>
  );

  // =========================================================================
  // STEP 4 — Result
  // =========================================================================
  const renderResult = () =>
    result && (
      <motion.div
        key="step-result"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center flex-1 px-6 py-8 overflow-y-auto"
      >
        {/* Success badge */}
        <motion.div
          className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5 shadow-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 18,
            delay: 0.05,
          }}
        >
          <Check className="w-7 h-7 text-emerald-600" />
        </motion.div>

        <motion.h2
          className="text-xl font-semibold text-black mb-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Your clip is ready
        </motion.h2>
        <motion.p
          className="text-sm text-slate-500 mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Your AI-curated clip has been generated
        </motion.p>

        {/* Result Card */}
        <motion.div
          className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {/* Thumbnail area */}
          <div className="aspect-video bg-slate-900 flex items-center justify-center border-b border-slate-200 relative group cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Play className="w-7 h-7 text-white ml-0.5" />
            </div>
            <span className="absolute bottom-2 right-3 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-mono">
              {result.clipDuration}
            </span>
          </div>

          {/* Details */}
          <div className="p-5 space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                  Source Video
                </p>
                <p className="text-xs text-slate-700 font-medium truncate">
                  {result.videoTitle}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                  Duration
                </p>
                <p className="text-xs text-slate-700 font-medium">
                  {result.clipDuration}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                  Moment Type
                </p>
                <p className="text-xs text-slate-700 font-medium capitalize">
                  {result.momentType}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                  Subtitle Style
                </p>
                <p className="text-xs text-slate-700 font-medium">
                  {result.subtitleStyle}
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-3.5 h-3.5 text-slate-600" />
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Why This Moment
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {result.aiReasoning}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <a
            href={result.outputPath}
            download
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-black text-white shadow-sm hover:bg-slate-800 hover:shadow-md active:scale-[0.98] transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Download Clip
          </a>
          <button
            onClick={handleRestart}
            className="px-5 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition-all duration-200"
          >
            Create Another
          </button>
        </motion.div>
      </motion.div>
    );

  // =========================================================================
  // ERROR State
  // =========================================================================
  const renderError = () => (
    <motion.div
      key="step-error"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center flex-1 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-black mb-2">
        Something Went Wrong
      </h2>
      <p className="text-sm text-slate-500 mb-8 text-center max-w-md leading-relaxed">
        {error ??
          "An unexpected error occurred while processing your clip. Please try again."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleTryAgain}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-black hover:bg-slate-800 text-white shadow-sm transition-all duration-200"
        >
          Try Again
        </button>
        <button
          onClick={handleNewVideo}
          className="px-5 py-3 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
        >
          New Video
        </button>
      </div>
    </motion.div>
  );

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          {(step === 0 || step === 1 || step === 2) && (
            <button
              onClick={
                step === 0
                  ? onClose
                  : step === 1
                    ? handleMomentBack
                    : handleConfigBack
              }
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-slate-700" />
            </div>
            <span className="text-sm font-semibold text-black tracking-tight">
              AI Clipper
            </span>
          </div>
        </div>

        {step !== 4 && error === null && (
          <div className="hidden sm:block">{renderStepIndicator()}</div>
        )}

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all duration-200 text-sm"
        >
          ✕
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        <AnimatePresence mode="wait">
          {error !== null && step === 3
            ? renderError()
            : step === 0
              ? renderUrlInput()
              : step === 1
                ? renderMomentType()
                : step === 2
                  ? renderSubtitleConfig()
                  : step === 3
                    ? renderProcessing()
                    : step === 4
                      ? renderResult()
                      : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
