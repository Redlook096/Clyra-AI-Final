"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { ShiningText } from "@/components/ShiningText";

const HOLD_MS = 2000;
const MAX_BODY_PX = 168;

/** Characters to reveal per animation frame for ultra-smooth, fast typing. */
const CHARS_PER_FRAME_FAST = 2;
const CHARS_PER_FRAME_BURST = 5;
const BURST_THRESHOLD = 180;

type Phase = "typing" | "dwell" | "folded";

/**
 * Inline Cursor-style Thought UI.
 * - Header: chevron + "Thinking" (shimmer) → typed body → 2s dwell → folds to "Thought" + chevron right.
 * - Body is the model's raw THINKING block (or a follow-up reflection beat).
 *
 * Typing uses requestAnimationFrame so the reveal stays buttery even when many segments are
 * mounted, with a small per-frame burst on long bodies so we don't take 30s to render a long thought.
 */
export function VibeThoughtPanel({
  body,
  complete,
  active,
  onCollapsed,
  archived = false,
}: {
  body: string;
  complete: boolean;
  active: boolean;
  onCollapsed?: () => void;
  /** Saved / reopened chat: show folded “Thought” with full body, no typing animation. */
  archived?: boolean;
}) {
  const [revealed, setRevealed] = useState(() => (archived ? body.length : 0));
  const [phase, setPhase] = useState<Phase>(() => (archived ? "folded" : "typing"));
  const [expanded, setExpanded] = useState(() => !archived);
  const notifiedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (archived) {
      setRevealed(body.length);
      setPhase("folded");
      setExpanded(false);
    }
  }, [archived, body.length]);

  // rAF-driven typing — runs only while active + still typing.
  useEffect(() => {
    if (archived) return;
    if (!active || phase !== "typing") return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      setRevealed((r) => {
        if (r >= body.length) return r;
        const left = body.length - r;
        const step = left > BURST_THRESHOLD ? CHARS_PER_FRAME_BURST : CHARS_PER_FRAME_FAST;
        return Math.min(r + step, body.length);
      });
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [archived, active, phase, body.length]);

  // Dwell only once typed AND the model has finished this thought.
  useEffect(() => {
    if (archived) return;
    if (!active || phase !== "typing") return;
    if (!complete) return;
    if (revealed >= body.length && body.length > 0) {
      setPhase("dwell");
    }
  }, [archived, active, phase, revealed, body.length, complete]);

  // Fold after dwell.
  useEffect(() => {
    if (archived) return;
    if (phase !== "dwell") return;
    const id = window.setTimeout(() => {
      setPhase("folded");
      setExpanded(false);
    }, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [archived, phase]);

  // Notify parent so the next step can begin.
  useEffect(() => {
    if (archived) return;
    if (phase !== "folded" || notifiedRef.current) return;
    notifiedRef.current = true;
    onCollapsed?.();
  }, [archived, phase, onCollapsed]);

  // Auto-scroll while typing — smooth scroll on each tick so the viewport glides
  // with the text instead of teleporting on each character.
  useLayoutEffect(() => {
    if (archived) return;
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow <= 4) return;
    const targetTop = el.scrollHeight - el.clientHeight;
    if (Math.abs(el.scrollTop - targetTop) < 2) return;
    el.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [archived, revealed]);

  const open = phase === "typing" || phase === "dwell" || expanded;
  const showLiveLabel = phase === "typing" || phase === "dwell";
  const slice = body.slice(0, revealed);

  const chevronSpring = { type: "spring" as const, stiffness: 380, damping: 36, mass: 0.32 };

  return (
    <div className="flex w-full max-w-full flex-col gap-1 text-[14px]">
      <div className="flex items-center gap-2 py-0.5" aria-live="polite">
        {showLiveLabel ? (
          <>
            <motion.span
              className="flex shrink-0 text-slate-400"
              animate={{ rotate: open ? 90 : 0 }}
              transition={chevronSpring}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </motion.span>
            <ShiningText text="Thinking" preset="thinkingChat" />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="group flex w-fit items-center gap-2 rounded-lg py-0.5 pl-0.5 pr-2 text-left transition-colors hover:bg-slate-100/70"
          >
            <motion.span
              className="flex shrink-0 text-slate-400 transition-colors group-hover:text-slate-500"
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={chevronSpring}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.span>
            <span className="text-[13px] font-medium text-slate-500">Thought</span>
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="thought-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              type: "spring",
              bounce: 0.04,
              stiffness: 220,
              damping: 42,
              opacity: { duration: 0.18 },
            }}
            className="overflow-hidden"
          >
            <div className="flex gap-3 py-2 pl-0.5 pr-1">
              <div
                aria-hidden
                className="mt-0.5 w-px shrink-0 self-stretch bg-gradient-to-b from-slate-200 via-slate-200/80 to-transparent"
              />
              <div
                ref={scrollRef}
                className="min-h-[1.25rem] min-w-0 flex-1 overflow-y-auto whitespace-pre-wrap text-[13.5px] font-normal leading-[1.6] tracking-[-0.012em] text-slate-600 [text-rendering:optimizeLegibility] scrollbar-none"
                style={{
                  maxHeight: MAX_BODY_PX,
                  contain: "layout style paint",
                  maskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0.55) 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 86%, rgba(0,0,0,0.55) 100%)",
                }}
              >
                {slice}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
