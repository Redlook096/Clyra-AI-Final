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
    { label: "Small", value: "36" },
    { label: "Medium", value: "52" },
    { label: "Large", value: "68" },
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

const MOMENT_TYPES: {
  id: MomentType;
  emoji: string;
  label: string;
  description: string;
}[] = [
  {
    id: "viral",
    emoji: "🔥",
    label: "Viral",
    description: "Most shareable, high-energy moment",
  },
  {
    id: "funny",
    emoji: "😂",
    label: "Funny",
    description: "Biggest laugh of the video",
  },
  {
    id: "dramatic",
    emoji: "🎭",
    label: "Dramatic",
    description: "Most intense, emotional peak",
  },
  {
    id: "inspiring",
    emoji: "✨",
    label: "Inspiring",
    description: "Most uplifting moment",
  },
  {
    id: "surprising",
    emoji: "😱",
    label: "Surprising",
    description: "Biggest twist or reveal",
  },
  {
    id: "action",
    emoji: "⚡",
    label: "Action",
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A clean progress bar for the processing view. */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-indigo-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

/** Individual pipeline step row with animated indicator. */
function PipelineRow({
  step,
  isLast,
  index,
}: {
  step: PipelineStep;
  isLast: boolean;
  index: number;
}) {
  return (
    <motion.div
      className="flex items-start gap-4"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.12 }}
    >
      {/* Indicator column */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
            step.status === "done"
              ? "bg-emerald-50 border-emerald-500"
              : step.status === "active"
                ? "bg-indigo-50 border-indigo-500"
                : "bg-white border-slate-200"
          }`}
        >
          {step.status === "done" ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : step.status === "active" ? (
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-0.5 h-8 transition-colors duration-500 ${
              step.status === "done" ? "bg-emerald-200" : "bg-slate-200"
            }`}
          />
        )}
      </div>

      {/* Label column */}
      <div className="flex-1 pt-1">
        <p
          className={`text-sm font-medium transition-colors duration-300 ${
            step.status === "done"
              ? "text-emerald-700"
              : step.status === "active"
                ? "text-indigo-700"
                : "text-slate-400"
          }`}
        >
          {step.status === "active"
            ? step.activeLabel
            : step.status === "done"
              ? `${step.doneLabel} ✓`
              : step.label}
        </p>
        {step.detail && step.status === "done" && (
          <motion.p
            className="text-xs text-slate-400 mt-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {step.detail}
          </motion.p>
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
  const [config, setConfig] = useState<SubtitleConfig>(DEFAULT_CONFIG);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" as const })),
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ClipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pipelineStepsRef = useRef(pipelineSteps);
  pipelineStepsRef.current = pipelineSteps;

  // --- URL validation ---
  const urlValid = isValidYouTubeUrl(youtubeUrl.trim());

  // --- Real SSE pipeline via /api/clipper/start ---
  const runPipeline = useCallback(async () => {
    setError(null);
    setResult(null);
    const freshSteps = PIPELINE_STEPS.map((s) => ({
      ...s,
      status: "idle" as const,
    }));
    setPipelineSteps(freshSteps);
    setProgress(0);

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
        moment_type: momentType,
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
              // Map backend step names to pipeline step indices (8 steps)
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
                videoTitle: (event as any).title || "YouTube Video",
                originalDuration: (event as any).original_duration || "Unknown",
                clipDuration: (event as any).clip_duration || "Unknown",
                momentType: (event as any).moment_type || momentType || "viral",
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
  }, [youtubeUrl, config, momentType]);

  // --- Handlers ---
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlValid) return;
    setStep(1);
  };

  const handleMomentContinue = () => {
    if (!momentType) return;
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
    setConfig(DEFAULT_CONFIG);
    setPipelineSteps(
      PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" as const })),
    );
    setProgress(0);
    setResult(null);
    setError(null);
    setStep(0);
  };

  const handleNewVideo = () => {
    setYoutubeUrl("");
    setMomentType(null);
    setConfig(DEFAULT_CONFIG);
    setPipelineSteps(
      PIPELINE_STEPS.map((s) => ({ ...s, status: "idle" as const })),
    );
    setProgress(0);
    setResult(null);
    setError(null);
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
                    ? "text-indigo-600"
                    : isPast
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                    isActive
                      ? "bg-indigo-50 border-indigo-500 text-indigo-600"
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
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="mb-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
          <Scissors className="w-6 h-6 text-indigo-600" />
        </div>
      </motion.div>

      {/* Title / Subtitle */}
      <motion.h1
        className="text-2xl font-semibold text-slate-900 tracking-tight mb-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        Create a Clip
      </motion.h1>
      <motion.p
        className="text-sm text-slate-500 mb-10 max-w-md text-center leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        AI finds the best moment and adds word-accurate subtitles
      </motion.p>

      {/* Form */}
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
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all duration-200 shadow-sm"
            autoFocus
          />
        </div>
        <p className="text-[11px] text-slate-400 -mt-2">
          Paste any YouTube link
        </p>
        <button
          type="submit"
          disabled={!urlValid}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.form>
    </motion.div>
  );

  // =========================================================================
  // STEP 1 — Moment Type Selection (NEW)
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
        className="text-xl font-semibold text-slate-900 mb-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        What kind of moment?
      </motion.h2>
      <motion.p
        className="text-sm text-slate-500 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        I'll find the best one for you
      </motion.p>

      {/* Grid of 2x3 cards */}
      <motion.div
        className="w-full max-w-lg grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {MOMENT_TYPES.map((mt, i) => {
          const isSelected = momentType === mt.id;
          return (
            <motion.button
              key={mt.id}
              onClick={() => setMomentType(mt.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200 ${
                isSelected
                  ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-600/20 shadow-sm"
                  : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
              }`}
            >
              <span className="text-3xl mb-2.5">{mt.emoji}</span>
              <span
                className={`text-sm font-semibold mb-1 transition-colors ${
                  isSelected ? "text-indigo-700" : "text-slate-800"
                }`}
              >
                {mt.label}
              </span>
              <span className="text-[11px] text-slate-400 leading-tight">
                {mt.description}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex items-center gap-3 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
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
          disabled={!momentType}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
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
  const renderSubtitleConfig = () => (
    <motion.div
      key="step-config"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center flex-1 px-6 py-8"
    >
      <motion.h2
        className="text-xl font-semibold text-slate-900 mb-1.5"
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

      <motion.div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-7 shadow-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Font Size
          </label>
          <div className="flex gap-2">
            {FONT_SIZE_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() =>
                  setConfig((c) => ({ ...c, fontSize: pill.value }))
                }
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  config.fontSize === pill.value
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {pill.label}
                <span
                  className={`block text-[10px] ${
                    config.fontSize === pill.value
                      ? "text-indigo-200"
                      : "text-slate-400"
                  }`}
                >
                  {pill.value}px
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Font
          </label>
          <div className="flex gap-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font}
                onClick={() => setConfig((c) => ({ ...c, font }))}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  config.font === font
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {font}
              </button>
            ))}
          </div>
        </div>

        {/* Colors row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Text Color */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Text
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={config.textColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, textColor: e.target.value }))
                  }
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {config.textColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stroke Color */}
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Outline
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={config.strokeColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, strokeColor: e.target.value }))
                  }
                  className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {config.strokeColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Position
          </label>
          <div className="flex gap-2">
            {POSITION_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() =>
                  setConfig((c) => ({ ...c, position: pill.value }))
                }
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  config.position === pill.value
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview snippet */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-center overflow-hidden">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
            Preview
          </p>
          <p
            style={{
              fontFamily: config.font,
              fontSize: `${Math.min(Number(config.fontSize), 68) * 0.45}px`,
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
            className="font-bold leading-tight"
          >
            THIS IS HOW YOUR SUBTITLES WILL LOOK
          </p>
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
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
        >
          Use Defaults
        </button>
        <button
          onClick={handleConfigContinue}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Start Clipping
        </button>
      </motion.div>
    </motion.div>
  );

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
          className="inline-flex items-center gap-2 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Wand2 className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Creating your clip...
          </h2>
        </motion.div>
        <motion.p
          className="text-xs text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
        >
          {progress}% complete
        </motion.p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto mb-10">
        <ProgressBar progress={progress} />
      </div>

      {/* Pipeline Steps */}
      <div className="w-full max-w-md mx-auto space-y-0">
        {pipelineSteps.map((ps, idx) => (
          <PipelineRow
            key={ps.id}
            step={ps}
            isLast={idx === pipelineSteps.length - 1}
            index={idx}
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
          className="text-xl font-semibold text-slate-900 mb-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          Your clip is ready!
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
                  Original Duration
                </p>
                <p className="text-xs text-slate-700 font-medium">
                  {result.originalDuration}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                  Clip Duration
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
            </div>

            {/* AI Reasoning */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <p className="text-[10px] font-medium text-indigo-600 uppercase tracking-wider">
                  Why This Moment
                </p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {result.aiReasoning}
              </p>
            </div>

            {/* Subtitle style summary */}
            <div className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Subtitle Style
              </p>
              <p className="text-xs text-slate-700 font-medium">
                {result.subtitleStyle}
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
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-[0.98] transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Download Clip
          </a>
          <button
            onClick={handleRestart}
            className="px-5 py-3 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
          >
            Clip Another
          </button>
          <button
            onClick={handleNewVideo}
            className="px-5 py-3 rounded-xl text-sm font-medium text-slate-500 bg-transparent border border-slate-200 hover:border-slate-300 hover:text-slate-700 transition-all duration-200"
          >
            New Video
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
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Something Went Wrong
      </h2>
      <p className="text-sm text-slate-500 mb-8 text-center max-w-md leading-relaxed">
        {error ??
          "An unexpected error occurred while processing your clip. Please try again."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleTryAgain}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all duration-200"
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
          {/* Back button - show for steps 0, 1, 2 */}
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
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <Video className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm font-semibold text-slate-900 tracking-tight">
              AI Clipper
            </span>
          </div>
        </div>

        {/* Step indicator (hide on result or error) */}
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
