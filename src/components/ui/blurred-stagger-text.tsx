"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import {
  TEXT_EFFECT_BLUR_CHAR_STAGGER,
  textEffectBlurCharItemVariants,
} from "@/components/ui/text-effect";

/** One-shot reveal: full string uses same blur-per-char preset as TextEffect. */
const oneShotBlurContainer: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: TEXT_EFFECT_BLUR_CHAR_STAGGER,
      delayChildren: 0.016,
    },
  },
};

export function BlurredStagger({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const chars = useMemo(() => text.split(""), [text]);

  return (
    <div className={cn("inline-block max-w-full", className)}>
      <motion.span
        variants={oneShotBlurContainer}
        initial="hidden"
        animate="show"
        className="inline whitespace-pre-wrap font-medium text-inherit"
      >
        {chars.map((char, index) => (
          <motion.span
            key={`b-${index}`}
            variants={textEffectBlurCharItemVariants}
            className="inline"
          >
            {char === " " ? "\u00A0" : char === "\n" ? "\n" : char}
          </motion.span>
        ))}
      </motion.span>
    </div>
  );
}

/**
 * Smooth streaming reveal: keeps one stable text layer, types toward the latest
 * target text, and lets CSS run a single premium wave across the revealed copy.
 */
export function BlurredStaggerStream({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming?: boolean;
  className?: string;
}) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      return;
    }

    if (!text.startsWith(displayedText)) {
      setDisplayedText(text);
      return;
    }

    if (displayedText.length >= text.length) return;

    const remaining = text.length - displayedText.length;
    const charsPerTick = isStreaming ? Math.min(5, Math.max(1, Math.ceil(remaining / 34))) : 8;
    const id = window.setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + charsPerTick));
    }, isStreaming ? 18 : 12);

    return () => window.clearTimeout(id);
  }, [displayedText, isStreaming, text]);

  if (!text) return null;

  return (
    <div
      className={cn(
        "clyra-assistant-stream-line whitespace-pre-wrap font-medium leading-relaxed",
        className,
      )}
      data-streaming={isStreaming ? "true" : "false"}
    >
      {displayedText}
    </div>
  );
}
