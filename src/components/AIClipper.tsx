import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AIClipperProps {
  onClose: () => void;
}

interface SubtitleConfig {
  fontSize: '36' | '52' | '68';
  font: 'Impact' | 'Arial' | 'Helvetica' | 'Montserrat';
  textColor: string;
  strokeColor: string;
  position: 'bottom' | 'center' | 'top';
}

interface PipelineStep {
  id: number;
  label: string;
  activeLabel: string;
  doneLabel: string;
  detail?: string;
  status: 'idle' | 'active' | 'done';
}

interface ClipResult {
  videoTitle: string;
  originalDuration: string;
  clipDuration: string;
  aiReasoning: string;
  thumbnailUrl: string;
  subtitleStyle: string;
  outputPath: string;
}

type AppStep = 0 | 1 | 2 | 3;

const FONT_SIZE_PILLS: { label: string; value: SubtitleConfig['fontSize'] }[] = [
  { label: 'Small', value: '36' },
  { label: 'Medium', value: '52' },
  { label: 'Large', value: '68' },
];

const FONT_OPTIONS: SubtitleConfig['font'][] = [
  'Impact',
  'Arial',
  'Helvetica',
  'Montserrat',
];

const POSITION_PILLS: { label: string; value: SubtitleConfig['position'] }[] = [
  { label: 'Bottom', value: 'bottom' },
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
];

const DEFAULT_CONFIG: SubtitleConfig = {
  fontSize: '52',
  font: 'Impact',
  textColor: '#FFFFFF',
  strokeColor: '#000000',
  position: 'bottom',
};

const PIPELINE_STEPS: Omit<PipelineStep, 'status' | 'detail'>[] = [
  {
    id: 1,
    label: 'Downloading video',
    activeLabel: 'Downloading video...',
    doneLabel: 'Downloaded',
  },
  {
    id: 2,
    label: 'Transcribing audio with Whisper',
    activeLabel: 'Transcribing audio with Whisper...',
    doneLabel: 'Transcribed',
  },
  {
    id: 3,
    label: 'AI analyzing for best clip',
    activeLabel: 'AI analyzing for best clip...',
    doneLabel: 'Found best moment',
  },
  {
    id: 4,
    label: 'Clipping video',
    activeLabel: 'Clipping video...',
    doneLabel: 'Clipped',
  },
  {
    id: 5,
    label: 'Generating subtitles',
    activeLabel: 'Generating subtitles...',
    doneLabel: 'Subtitles ready',
  },
  {
    id: 6,
    label: 'Burning subtitles into video',
    activeLabel: 'Burning subtitles into video...',
    doneLabel: 'Final clip ready',
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

/** A glowing, minimal progress bar at the top of the processing view. */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

/** Individual pipeline step row. */
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
      transition={{ duration: 0.4, delay: index * 0.15 }}
    >
      {/* Indicator column */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-500 ${
            step.status === 'done'
              ? 'bg-emerald-500/20 border-emerald-500'
              : step.status === 'active'
                ? 'bg-blue-500/20 border-blue-500'
                : 'bg-gray-800 border-gray-700'
          }`}
        >
          {step.status === 'done' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : step.status === 'active' ? (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-600" />
          )}
        </div>
        {!isLast && (
          <div
            className={`w-[2px] h-8 transition-colors duration-500 ${
              step.status === 'done' ? 'bg-emerald-500/30' : 'bg-gray-700'
            }`}
          />
        )}
      </div>

      {/* Label column */}
      <div className="flex-1 pt-1">
        <p
          className={`text-sm font-medium transition-colors duration-300 ${
            step.status === 'done'
              ? 'text-emerald-300'
              : step.status === 'active'
                ? 'text-blue-300'
                : 'text-gray-500'
          }`}
        >
          {step.status === 'active'
            ? step.activeLabel
            : step.status === 'done'
              ? `${step.doneLabel} ✓`
              : step.label}
        </p>
        {step.detail && step.status === 'done' && (
          <motion.p
            className="text-xs text-gray-500 mt-0.5"
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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [config, setConfig] = useState<SubtitleConfig>(DEFAULT_CONFIG);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map((s) => ({ ...s, status: 'idle' as const }))
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ClipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent scroll when processing is active
  const containerRef = useRef<HTMLDivElement>(null);

  // --- URL validation ---
  const urlValid = isValidYouTubeUrl(youtubeUrl.trim());

  // --- Simulate pipeline (replace with real SSE in production) ---
  const runPipeline = useCallback(async () => {
    setError(null);
    setResult(null);
    const freshSteps = PIPELINE_STEPS.map((s) => ({
      ...s,
      status: 'idle' as const,
    }));
    setPipelineSteps(freshSteps);
    setProgress(0);

    // Simulated details that would come from the backend
    const mockDetails = [
      'Video: "How AI Is Changing The World" (12:34)',
      '3,200 words transcribed in 2.1s',
      'Timestamp 4:22–5:07 — highest emotional peak',
      'Clip length: 45 seconds',
      '12 subtitle phrases generated',
      'Burned at 60fps with GPU encoding',
    ];

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      // Mark current step as active
      setPipelineSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: 'active' as const } : s
        )
      );

      // Simulate processing delay
      await new Promise((r) => setTimeout(r, 1400 + Math.random() * 800));

      // Mark current step as done
      setPipelineSteps((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? { ...s, status: 'done' as const, detail: mockDetails[i] }
            : s
        )
      );

      // Update progress
      setProgress(Math.round(((i + 1) / PIPELINE_STEPS.length) * 100));
    }

    // Simulated result
    setResult({
      videoTitle: 'How AI Is Changing The World',
      originalDuration: '12:34',
      clipDuration: '0:45',
      aiReasoning:
        'This 45-second segment at 4:22 had the highest emotional intensity score — combining a dramatic reveal, audience reaction spike, and a quotable one-liner that maximises shareability across social platforms.',
      thumbnailUrl: '',
      subtitleStyle: `${config.font} ${config.fontSize}px — ${config.position}`,
      outputPath: './output/final_clip.mp4',
    });

    setStep(3);
  }, [config]);

  // --- Handlers ---
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlValid) return;
    setStep(1);
  };

  const handleConfigContinue = () => {
    setStep(2);
    // Kick off the pipeline after transition
    setTimeout(() => runPipeline(), 300);
  };

  const handleUseDefaults = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleRestart = () => {
    setYoutubeUrl('');
    setConfig(DEFAULT_CONFIG);
    setPipelineSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'idle' as const })));
    setProgress(0);
    setResult(null);
    setError(null);
    setStep(0);
  };

  const handleNewVideo = () => {
    setYoutubeUrl('');
    setConfig(DEFAULT_CONFIG);
    setPipelineSteps(PIPELINE_STEPS.map((s) => ({ ...s, status: 'idle' as const })));
    setProgress(0);
    setResult(null);
    setError(null);
    setStep(0);
  };

  const handleTryAgain = () => {
    setError(null);
    runPipeline();
  };

  // --- Render helpers ---
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {(['URL', 'Style', 'Process', 'Result'] as const).map((label, i) => {
        const isActive = step === i;
        const isPast = step > i;
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                isActive
                  ? 'text-blue-400'
                  : isPast
                    ? 'text-emerald-400'
                    : 'text-gray-600'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors duration-300 ${
                  isActive
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : isPast
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-gray-800 border-gray-700 text-gray-600'
                }`}
              >
                {isPast ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              {label}
            </div>
            {i < 3 && <div className="w-6 h-px bg-gray-700" />}
          </div>
        );
      })}
    </div>
  );

  // =========================================================================
  // STEP 0 — URL Input
  // =========================================================================
  const renderUrlInput = () => (
    <motion.div
      key="step-url"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center flex-1 px-6"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
          <Scissors className="w-7 h-7 text-blue-400" />
        </div>
      </motion.div>

      {/* Title / Subtitle */}
      <motion.h1
        className="text-2xl font-semibold text-white tracking-tight mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
      >
        AI YouTube Clipper
      </motion.h1>
      <motion.p
        className="text-sm text-gray-400 mb-10 max-w-md text-center leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        Find and clip the most viral-worthy moment from any video — powered by
        AI analysis of pacing, emotion, and audience retention patterns.
      </motion.p>

      {/* Form */}
      <motion.form
        onSubmit={handleUrlSubmit}
        className="w-full max-w-lg flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
      >
        <div className="relative w-full">
          <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Paste YouTube URL..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!urlValid}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Start
        </button>
      </motion.form>
    </motion.div>
  );

  // =========================================================================
  // STEP 1 — Subtitle Configuration
  // =========================================================================
  const renderSubtitleConfig = () => (
    <motion.div
      key="step-config"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center flex-1 px-6 py-8"
    >
      <motion.h2
        className="text-xl font-semibold text-white mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Subtitle Style
      </motion.h2>
      <motion.p
        className="text-sm text-gray-400 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        Customise how subtitles will appear in your clip
      </motion.p>

      <motion.div
        className="w-full max-w-lg bg-gray-900/60 border border-gray-800 rounded-2xl p-6 space-y-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        {/* Font Size */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
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
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {pill.label}
                <span className="block text-[10px] opacity-60">
                  {pill.value}px
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Font
          </label>
          <select
            value={config.font}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                font: e.target.value as SubtitleConfig['font'],
              }))
            }
            className="w-full py-2.5 px-4 rounded-lg bg-gray-800/50 border border-gray-700 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 appearance-none cursor-pointer"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Colors row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Text Color */}
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={config.textColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, textColor: e.target.value }))
                  }
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {config.textColor.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Stroke Color */}
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Stroke Color
            </label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={config.strokeColor}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, strokeColor: e.target.value }))
                  }
                  className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent [&::-webkit-color-swatch-wrapper]:p-1 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {config.strokeColor.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Position */}
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
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
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                    : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview snippet */}
        <div className="rounded-xl bg-gray-950 border border-gray-800 p-4 text-center overflow-hidden">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
            Preview
          </p>
          <p
            style={{
              fontFamily: config.font,
              fontSize: `${Math.min(Number(config.fontSize), 68) * 0.45}px`,
              color: config.textColor,
              WebkitTextStroke:
                config.strokeColor !== '#000000'
                  ? `2px ${config.strokeColor}`
                  : undefined,
              textShadow:
                config.strokeColor === '#000000'
                  ? '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000'
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
          onClick={handleUseDefaults}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:text-gray-300 transition-all duration-200"
        >
          Use Defaults
        </button>
        <button
          onClick={handleConfigContinue}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          Continue
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  );

  // =========================================================================
  // STEP 2 — Processing Pipeline
  // =========================================================================
  const renderProcessing = () => (
    <motion.div
      key="step-processing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col flex-1 px-6 py-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          className="inline-flex items-center gap-2 mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Wand2 className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Processing Clip</h2>
        </motion.div>
        <motion.p
          className="text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
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
  // STEP 3 — Result
  // =========================================================================
  const renderResult = () =>
    result && (
      <motion.div
        key="step-result"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col items-center flex-1 px-6 py-8 overflow-y-auto"
      >
        {/* Success badge */}
        <motion.div
          className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        >
          <Check className="w-7 h-7 text-emerald-400" />
        </motion.div>

        <motion.h2
          className="text-xl font-semibold text-white mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Clip Ready!
        </motion.h2>
        <motion.p
          className="text-sm text-gray-400 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          Your AI-curated clip has been generated
        </motion.p>

        {/* Result Card */}
        <motion.div
          className="w-full max-w-lg bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          {/* Thumbnail area */}
          <div className="aspect-video bg-gray-950 flex items-center justify-center border-b border-gray-800 relative group cursor-pointer">
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
              <div className="bg-gray-800/40 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Source Video
                </p>
                <p className="text-xs text-gray-200 font-medium truncate">
                  {result.videoTitle}
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Original Duration
                </p>
                <p className="text-xs text-gray-200 font-medium">
                  {result.originalDuration}
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Clip Duration
                </p>
                <p className="text-xs text-gray-200 font-medium">
                  {result.clipDuration}
                </p>
              </div>
              <div className="bg-gray-800/40 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                  Subtitle Style
                </p>
                <p className="text-xs text-gray-200 font-medium truncate">
                  {result.subtitleStyle}
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-[10px] font-medium text-blue-400 uppercase tracking-wider">
                  Why This Moment
                </p>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
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
          transition={{ delay: 0.45 }}
        >
          <a
            href={result.outputPath}
            download
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Download Clip
          </a>
          <button
            onClick={handleRestart}
            className="px-5 py-3 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:text-white transition-all duration-200"
          >
            Clip Another
          </button>
          <button
            onClick={handleNewVideo}
            className="px-5 py-3 rounded-xl text-sm font-medium text-gray-400 bg-transparent border border-gray-700/50 hover:border-gray-600 hover:text-gray-300 transition-all duration-200"
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center flex-1 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Something Went Wrong
      </h2>
      <p className="text-sm text-gray-400 mb-8 text-center max-w-md leading-relaxed">
        {error ?? 'An unexpected error occurred while processing your clip. Please try again.'}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={handleTryAgain}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-medium bg-red-500/90 hover:bg-red-500 text-white transition-all duration-200"
        >
          Try Again
        </button>
        <button
          onClick={handleNewVideo}
          className="px-5 py-3 rounded-xl text-sm font-medium text-gray-400 bg-gray-800/50 border border-gray-700 hover:border-gray-600 hover:text-gray-300 transition-all duration-200"
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
      className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 0 ? onClose : step === 1 ? () => setStep(0) : undefined}
            className="w-8 h-8 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-all duration-200"
          >
            {step === 0 || step === 3 ? (
              <ArrowLeft className="w-4 h-4" />
            ) : undefined}
          </button>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold tracking-tight">
              AI Clipper
            </span>
          </div>
        </div>

        {/* Step indicator (only when not on result or error) */}
        {step !== 3 && error === null && (
          <div className="hidden sm:block">{renderStepIndicator()}</div>
        )}

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-600 transition-all duration-200 text-sm"
        >
          ✕
        </button>
      </header>

      {/* Body — full height minus header */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          {error !== null && step === 2 ? (
            renderError()
          ) : step === 0 ? (
            renderUrlInput()
          ) : step === 1 ? (
            renderSubtitleConfig()
          ) : step === 2 ? (
            renderProcessing()
          ) : step === 3 ? (
            renderResult()
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
