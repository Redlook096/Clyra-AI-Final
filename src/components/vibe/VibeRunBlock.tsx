"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Terminal } from "lucide-react";
import { ShiningText } from "@/components/ShiningText";

const HOLD_MS = 2000;

/**
 * Single-row "Run Command" card. Same shape/look as a collapsed VibeMiniCodeBox so the
 * timeline reads consistently. No expandable body.
 *
 * - While active: shimmer the command text.
 * - After 2s while active and the segment is complete, signals onCollapsed so the next step starts.
 */
export function VibeRunBlock({
  body,
  active,
  segmentComplete,
  onCollapsed,
  archived = false,
}: {
  body: string;
  active: boolean;
  segmentComplete?: boolean;
  onCollapsed?: () => void;
  archived?: boolean;
}) {
  const [done, setDone] = useState(() => !!archived);
  const notifiedRef = useRef(false);

  // Pull the actual command line out of the body (model emits "$ npm run lint\nPurpose: ...").
  const command = useMemo(() => {
    const line = body.split("\n").find((l) => l.trim().startsWith("$"));
    if (line) return line.replace(/^\s*\$\s*/, "").trim();
    return body.split("\n")[0]?.trim() || "command";
  }, [body]);

  useEffect(() => {
    if (archived) {
      setDone(true);
      return;
    }
    if (!active || done) return;
    if (segmentComplete === false) return;
    const id = window.setTimeout(() => setDone(true), HOLD_MS);
    return () => window.clearTimeout(id);
  }, [archived, active, done, segmentComplete]);

  useEffect(() => {
    if (archived) return;
    if (!done || notifiedRef.current) return;
    notifiedRef.current = true;
    onCollapsed?.();
  }, [done, onCollapsed]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: active ? 1 : 0.7, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[560px] rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] overflow-hidden"
      data-invert-ignore
      style={{ contain: "layout paint" }}
    >
      <div className="flex items-center gap-2 px-4 py-2 text-[13px]">
        <Terminal className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        <span className="shrink-0 text-slate-500 font-medium">Run Command</span>
        {active && !done ? (
          <ShiningText
            text={command}
            preset="thinkingChat"
            play
            className="font-mono text-[12.5px] truncate max-w-[360px]"
          />
        ) : (
          <span className="font-mono text-[12.5px] text-slate-700 truncate">{command}</span>
        )}
      </div>
    </motion.div>
  );
}
