"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  type TargetAndTransition,
  type Variants,
} from "motion/react";
import React from "react";

type PresetType = "blur" | "shake" | "scale" | "fade" | "slide";

export type TextEffectProps = {
  children: string;
  per?: "word" | "char" | "line";
  as?: keyof React.JSX.IntrinsicElements;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  className?: string;
  preset?: PresetType;
  delay?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  segmentWrapperClassName?: string;
};

/** Per-char blur stagger (seconds). Slightly snappier than 0.03, smoother than 0.006. */
export const TEXT_EFFECT_BLUR_CHAR_STAGGER = 0.013;

const blurCharRevealEase = [0.22, 0.08, 0.2, 1] as const;

const blurCharShown: TargetAndTransition = {
  opacity: 1,
  filter: "blur(0px)",
  y: 0,
  transition: { duration: 0.1, ease: blurCharRevealEase },
};

/** Blur preset item: tween-based (lighter than springs) for char/word streaming. */
export const textEffectBlurCharItemVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)", y: 0.35 },
  visible: blurCharShown,
  show: blurCharShown,
  exit: { opacity: 0, filter: "blur(3px)", transition: { duration: 0.06 } },
};

/** Streaming tail container: opacity stays 1; only children stagger. */
export const textEffectBlurStreamContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: TEXT_EFFECT_BLUR_CHAR_STAGGER,
      delayChildren: 0,
    },
  },
};

const defaultStaggerTimes: Record<"char" | "word" | "line", number> = {
  char: TEXT_EFFECT_BLUR_CHAR_STAGGER,
  word: 0.04,
  line: 0.08,
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
  exit: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
  },
  exit: { opacity: 0 },
};

const presetVariants: Record<PresetType, { container: Variants; item: Variants }> = {
  blur: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: TEXT_EFFECT_BLUR_CHAR_STAGGER,
          delayChildren: 0,
        },
      },
      exit: {
        transition: { staggerChildren: 0.009, staggerDirection: -1 },
      },
    },
    item: textEffectBlurCharItemVariants,
  },
  shake: {
    container: defaultContainerVariants,
    item: {
      hidden: { x: 0 },
      visible: { x: [-4, 4, -4, 4, 0], transition: { duration: 0.4 } },
      exit: { x: 0 },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0.96 },
      visible: { opacity: 1, scale: 1, transition: { duration: 0.14 } },
      exit: { opacity: 0, scale: 0.96 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.12 } },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 8 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } },
      exit: { opacity: 0, y: 6 },
    },
  },
};

const AnimationComponent: React.FC<{
  segment: string;
  variants: Variants;
  per: "line" | "word" | "char";
  segmentWrapperClassName?: string;
  segmentIndex: number;
}> = React.memo(({ segment, variants, per, segmentWrapperClassName, segmentIndex }) => {
  const content =
    per === "line" ? (
      <motion.span variants={variants} className="block">
        {segment}
      </motion.span>
    ) : per === "word" ? (
      <motion.span aria-hidden="true" variants={variants} className="inline-block whitespace-pre">
        {segment}
      </motion.span>
    ) : (
      <motion.span className="inline-block whitespace-pre">
        {segment.split("").map((char, charIndex) => (
          <motion.span
            key={`c-${segmentIndex}-${charIndex}`}
            aria-hidden="true"
            variants={variants}
            className="inline-block whitespace-pre"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    );

  if (!segmentWrapperClassName) {
    return content;
  }

  const defaultWrapperClassName = per === "line" ? "block" : "inline-block";

  return <span className={cn(defaultWrapperClassName, segmentWrapperClassName)}>{content}</span>;
});

AnimationComponent.displayName = "AnimationComponent";

export function TextEffect({
  children,
  per = "word",
  as = "p",
  variants,
  className,
  preset,
  delay = 0,
  trigger = true,
  onAnimationComplete,
  segmentWrapperClassName,
}: TextEffectProps) {
  let segments: string[];

  if (per === "line") {
    segments = children.split("\n");
  } else if (per === "word") {
    segments = children.split(/(\s+)/);
  } else {
    segments = children.split("");
  }

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  const selectedVariants = preset
    ? presetVariants[preset]
    : { container: defaultContainerVariants, item: defaultItemVariants };
  const containerVariants = variants?.container || selectedVariants.container;
  const itemVariants = variants?.item || selectedVariants.item;
  const ariaLabel = per === "line" ? undefined : children;

  const stagger = defaultStaggerTimes[per];

  const delayedContainerVariants: Variants = {
    hidden: containerVariants.hidden,
    visible: {
      ...containerVariants.visible,
      transition: {
        ...(containerVariants.visible as TargetAndTransition)?.transition,
        staggerChildren:
          (containerVariants.visible as TargetAndTransition)?.transition?.staggerChildren ||
          stagger,
        delayChildren: delay,
      },
    },
    exit: containerVariants.exit,
  };

  return (
    <AnimatePresence mode="sync">
      {trigger && (
        <MotionTag
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-label={ariaLabel}
          variants={delayedContainerVariants}
          className={cn("whitespace-pre-wrap", className)}
          onAnimationComplete={onAnimationComplete}
        >
          {segments.map((segment, index) => (
            <AnimationComponent
              key={`${per}-${index}`}
              segment={segment}
              variants={itemVariants}
              per={per}
              segmentWrapperClassName={segmentWrapperClassName}
              segmentIndex={index}
            />
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}
