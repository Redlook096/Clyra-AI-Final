import { motion } from "motion/react";
import { Brain } from "lucide-react";
import { cn } from "../lib/utils";

type ShiningPreset = "default" | "thinkingChat";

/** Minimal brain stroke; same 2s linear cadence as `thinkingChat` text (aligned greys / highlight). */
export function ShiningBrainIcon({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn("inline-flex items-center justify-center text-[#404040]", className)}
      aria-hidden
      animate={{
        color: ["#404040", "#ffffff", "#404040"],
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
        times: [0, 0.5, 1],
      }}
    >
      <Brain className="h-[15px] w-[15px] shrink-0" strokeWidth={1.5} />
    </motion.span>
  );
}

export function ShiningText({
  text,
  className,
  preset = "default",
  /** When false, show static text (shine stops). */
  play = true,
}: {
  text: string;
  className?: string;
  preset?: ShiningPreset;
  play?: boolean;
}) {
  if (!play) {
    return (
      <span
        className={cn(
          "inline-block",
          preset === "thinkingChat"
            ? "text-[13px] font-normal text-slate-700"
            : "font-medium text-slate-800",
          className,
        )}
      >
        {text}
      </span>
    );
  }

  if (preset === "thinkingChat") {
    return (
      <motion.h1
        className={cn(
          "bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] bg-[length:200%_100%] bg-clip-text text-base font-regular text-transparent inline-block",
          className,
        )}
        initial={{ backgroundPosition: "200% 0" }}
        animate={{ backgroundPosition: "-200% 0" }}
        transition={{
          repeat: Infinity,
          duration: 2.5,
          ease: "linear",
        }}
      >
        {text}
      </motion.h1>
    );
  }

  return (
    <motion.span
      className={cn(
        "inline-block bg-[linear-gradient(110deg,#000,48.5%,#fff,50%,#000,51.5%)] bg-[length:200%_100%] bg-clip-text text-transparent",
        className,
      )}
      initial={{ backgroundPosition: "100% 0" }}
      animate={{ backgroundPosition: "0% 0" }}
      transition={{
        repeat: Infinity,
        duration: 3.5,
        ease: "linear",
      }}
    >
      {text}
    </motion.span>
  );
}
