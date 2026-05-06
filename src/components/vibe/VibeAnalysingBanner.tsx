"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileSearch } from "lucide-react";
import { ShiningText } from "@/components/ShiningText";

const ANALYSE_HOLD_MS = 1100;

export function VibeAnalysingBanner({
  path,
  active = true,
  onCompleted,
  archived = false,
}: {
  path: string;
  active?: boolean;
  onCompleted?: () => void;
  archived?: boolean;
}) {
  const [done, setDone] = useState(() => !!archived);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (archived) {
      setDone(true);
      return;
    }
    if (!active || done) return;
    const id = window.setTimeout(() => setDone(true), ANALYSE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [archived, active, done]);

  useEffect(() => {
    if (archived) return;
    if (!done || notifiedRef.current) return;
    notifiedRef.current = true;
    onCompleted?.();
  }, [done, onCompleted]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-fit items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
    >
      <FileSearch className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      {done ? (
        <span className="text-[12.5px] font-medium text-slate-700">
          Analysed <span className="font-mono text-slate-500">{path}</span>
        </span>
      ) : (
        <ShiningText
          text={`Analysing ${path}`}
          preset="thinkingChat"
          play
          className="text-[12.5px] font-medium"
        />
      )}
    </motion.div>
  );
}
