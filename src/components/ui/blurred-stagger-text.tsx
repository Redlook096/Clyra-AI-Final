"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Smooth character-by-character reveal. Prints one char at a time with fade-in. */
export function BlurredStaggerStream({
  text,
  isStreaming,
  className,
}: {
  text: string;
  isStreaming?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = React.useState(0);

  React.useEffect(() => {
    if (!isStreaming) { setVisible(text.length); return; }
    if (visible >= text.length) return;
    const charsPerTick = Math.max(1, Math.ceil((text.length - visible) / 20));
    const id = setTimeout(() => setVisible(v => Math.min(v + charsPerTick, text.length)), 25);
    return () => clearTimeout(id);
  }, [text, visible, isStreaming]);


  if (!text) return null;

  if (!isStreaming) {
    return (
      <div className={cn("whitespace-pre-wrap font-medium leading-relaxed", className)}>
        {text}
      </div>
    );
  }

  return (

    <div className={cn("whitespace-pre-wrap font-medium leading-relaxed", className)}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={i < visible ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.2 }}
          className="inline"
        >
          {char === " " ? "\u00A0" : char === "\n" ? "\n" : char}
        </motion.span>
      ))}
    </div>
  );
}
