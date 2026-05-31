"use client";

import * as React from "react";
import { useMemo } from "react";
import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

/** Smooth letter-by-letter blur reveal. New chars animate in, existing ones stay visible. */
export function BlurredStaggerStream({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming?: boolean;
  className?: string;
}) {
  const prevLen = React.useRef(0);
  const container = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: 0.015 } },
  };
  const letterAnimation = {
    hidden: { opacity: 0, filter: "blur(10px)" },
    show: { opacity: 1, filter: "blur(0px)" },
  };

  React.useEffect(() => {
    prevLen.current = text.length;
  }, [text]);

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
        initial="show"
        animate="show"
        className="inline text-base"
      >
        {text.split("").map((char, i) => (
          <motion.span
            key={`${i}-${char}`}
            variants={i >= prevLen.current ? letterAnimation : {}}
            initial={i >= prevLen.current ? "hidden" : "show"}
            animate="show"
            transition={{ duration: 0.3 }}
            className="inline"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.span>
    </div>
  );
}
