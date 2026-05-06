"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import {
  TEXT_EFFECT_BLUR_CHAR_STAGGER,
  textEffectBlurCharItemVariants,
  textEffectBlurStreamContainerVariants,
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

function estimateTailSolidifyMs(tailLen: number, isStreaming: boolean): number {
  if (tailLen <= 0) return 0;
  const staggerMs = TEXT_EFFECT_BLUR_CHAR_STAGGER * 1000;
  const durationMs = 100;
  const base = 120 + Math.max(0, tailLen - 1) * staggerMs + durationMs;
  const buffer = isStreaming ? 90 : 70;
  return Math.min(3600, base + buffer);
}

/**
 * Append-only streaming: prefix stays solid; new suffix uses TextEffect-style
 * blur-per-char (tween, light) so tokens appear smoothly as the model streams.
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
  const [solidThrough, setSolidThrough] = useState(0);

  useEffect(() => {
    if (text.length < solidThrough) {
      setSolidThrough(0);
    }
  }, [text, solidThrough]);

  const tail = text.slice(solidThrough);

  useEffect(() => {
    if (text.length < solidThrough) return;
    const tailLen = text.length - solidThrough;
    if (tailLen === 0) return;
    const est = estimateTailSolidifyMs(tailLen, !!isStreaming);
    const id = window.setTimeout(() => setSolidThrough(text.length), est);
    return () => window.clearTimeout(id);
  }, [text, solidThrough, isStreaming]);

  if (!text) return null;

  const prefix = text.slice(0, solidThrough);

  return (
    <div
      className={cn(
        "whitespace-pre-wrap font-medium leading-relaxed text-inherit",
        className,
      )}
    >
      <span className="text-inherit">{prefix}</span>
      {tail.length > 0 ? (
        <motion.span
          key={solidThrough}
          variants={textEffectBlurStreamContainerVariants}
          initial="hidden"
          animate="show"
          className="inline"
        >
          {tail.split("").map((char, i) => (
            <motion.span
              key={`${solidThrough + i}-${char}`}
              variants={textEffectBlurCharItemVariants}
              className="inline"
            >
              {char === " " ? "\u00A0" : char === "\n" ? "\n" : char}
            </motion.span>
          ))}
        </motion.span>
      ) : null}
    </div>
  );
}
