"use client";

import * as React from "react";
import { motion } from "motion/react";

type ShiningTextProps = {
  text: string;
  className?: string;
};

export function ShiningText({ text, className }: ShiningTextProps) {
  return (
    <motion.span
      className={[
        "bg-[linear-gradient(110deg,#0f172a,28%,#94a3b8,43%,#ffffff,50%,#94a3b8,57%,#0f172a,72%,#0f172a)]",
        "bg-[length:260%_100%]",
        "bg-clip-text",
        "inline-block whitespace-nowrap py-[1px]",
        "text-base",
        "font-medium",
        "text-transparent",
        className ?? "",
      ].join(" ")}
      initial={{ backgroundPosition: "220% 0" }}
      animate={{ backgroundPosition: "-220% 0" }}
      transition={{
        repeat: Infinity,
        duration: 4.2,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
}
