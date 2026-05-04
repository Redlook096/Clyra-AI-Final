import * as React from "react"
import { motion } from "motion/react";

export function ShiningText({text, className}: {text: string, className?: string}) {
  return (
    <motion.h1
      className={`inline-block bg-[linear-gradient(110deg,#000,48.5%,#fff,50%,#000,51.5%)] bg-[length:200%_100%] bg-clip-text text-transparent ${className || ""}`}
      initial={{ backgroundPosition: "100% 0" }}
      animate={{ backgroundPosition: "0% 0" }}
      transition={{
        repeat: Infinity,
        duration: 3.5,
        ease: "linear",
      }}
    >
      {text}
    </motion.h1>
  );
}
