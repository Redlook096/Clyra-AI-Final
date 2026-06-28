import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Brain } from "lucide-react";
import { TextEffect } from "@/components/ui/text-effect";
import { ShiningText, ShiningBrainIcon } from "../../ShiningText";
import { cn } from "../../../lib/utils";

function formatTime(ms: number) {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${seconds}s`;
}

export function ThinkingStep({
  active,
  thoughtText,
  thoughtPhase,
  startedAt,
  finishedMs,
}: {
  active: boolean;
  thoughtText: string;
  thoughtPhase: string;
  startedAt: number;
  finishedMs?: number;
}) {
  const [now, setNow] = useState(Date.now());
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [active]);

  // Auto-expand while thinking, auto-collapse when complete
  useEffect(() => {
    setIsExpanded(active);
  }, [active]);

  const elapsed = active ? now - startedAt : (finishedMs ?? 0);
  const isComplete = !active && finishedMs != null && finishedMs > 0;
  const showArrow = !active && isHovered;

  const blurSlideVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.02 } },
    },
    item: {
      hidden: { opacity: 0, y: 8 },
      visible: {
        opacity: 1, y: 0,
        transition: { type: "spring" as const, stiffness: 180, damping: 20, mass: 0.6 },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[720px] self-start"
    >
      <div className="group flex flex-col transition-all duration-500 ease-out">
        {/* Header Row */}
        <div
          className={cn(
            "flex items-center gap-3 py-1 select-none",
            isComplete ? "cursor-pointer" : "",
          )}
          onMouseEnter={() => !active && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => isComplete && setIsExpanded((v) => !v)}
        >
          {/* Icon: brain ↔ chevron */}
          <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
            {/* Chevron (fades in on hover when complete) */}
            <motion.div
              initial={false}
              animate={{ opacity: showArrow ? 1 : 0, scale: showArrow ? 1 : 0.85 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ChevronRight
                className={cn(
                  "h-5 w-5 text-slate-500 transition-transform duration-300",
                  isExpanded ? "rotate-90" : "",
                )}
                strokeWidth={2.5}
              />
            </motion.div>

            {/* Brain (visible when not hovering or while thinking) */}
            <motion.div
              initial={false}
              animate={{ opacity: showArrow ? 0 : 1, scale: showArrow ? 0.85 : 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {active ? (
                <ShiningBrainIcon className="h-5 w-5" />
              ) : (
                <Brain className="h-5 w-5 text-slate-400" strokeWidth={1.5} />
              )}
            </motion.div>
          </div>

          {/* Label + timer */}
          <div className="flex flex-1 items-center gap-2">
            <div className="mt-[-2px]">
              {active ? (
                <ShiningText text="Thinking" preset="thinkingChat" />
              ) : (
                <span className="text-[14px] sm:text-[15px] font-medium text-slate-400 transition-colors group-hover:text-slate-500">
                  Thought
                </span>
              )}
            </div>
            <span className="font-mono text-[13px] text-slate-400 opacity-80 mt-[1px]">
              {formatTime(elapsed)}
            </span>
          </div>
        </div>

        {/* Expanded Content */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded && thoughtText ? "auto" : 0, opacity: isExpanded && thoughtText ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-0 pb-2 pl-[2rem] pr-2">
            <div className="relative py-1">
              {thoughtText && (
                <TextEffect
                  per="word"
                  variants={blurSlideVariants}
                  className="text-[14px] sm:text-[15px] text-slate-500 opacity-70 font-normal tracking-tight leading-relaxed"
                >
                  {thoughtText}
                </TextEffect>
              )}
              {active && (
                <span
                  className="ml-[2px] inline-block h-[12px] w-[1.5px] translate-y-[1px] animate-pulse bg-slate-300"
                  aria-hidden
                />
              )}
              <div className="h-2" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
