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

/** Smooth letter-by-letter blur reveal. Lightweight, no lag. */
export function BlurredStaggerStream({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming?: boolean;
  className?: string;
}) {
  const container = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.012 },
    },
  };

  const letter = {
    hidden: { opacity: 0, filter: "blur(6px)" },
    show: {
      opacity: 1,
      filter: "blur(0px)",
      transition: { duration: 0.25 },
    },
  };

  if (!text) return null;

  return (
    <div
      className={cn(
        "whitespace-pre-wrap font-medium leading-relaxed",
        className,
      )}
    >
      <motion.span
        variants={container}
        initial={isStreaming ? "hidden" : "show"}
        animate="show"
        className="inline"
      >
        {text.split("").map((char, i) => (
          <motion.span
            key={`${i}-${char}`}
            variants={letter}
            className="inline"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    </div>
  );
}
