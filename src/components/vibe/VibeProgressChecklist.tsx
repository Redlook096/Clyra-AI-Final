"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import {
  Check,
  Circle,
  FileCode2,
  Loader2,
  Search,
  Terminal,
} from "lucide-react";
import type { VibeParsedSegment } from "@/lib/parseVibeAgentContent";
import { cn } from "@/lib/utils";

type ChecklistItem = {
  key: string;
  label: string;
  kind: VibeParsedSegment["type"];
  sourceIndex: number;
};

function basename(path: string) {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function cleanThinkingLabel(body: string) {
  const firstLine =
    body
      .split(/\n+/)
      .map((line) =>
        line
          .replace(/^\s*(?:step\s*\d+[:.)-]?|[-*]\s*)/i, "")
          .replace(/\*\*/g, "")
          .trim(),
      )
      .find(Boolean) ?? "Reason through next step";

  return firstLine.length > 58
    ? `${firstLine.slice(0, 55).trim()}...`
    : firstLine;
}

function labelForSegment(seg: VibeParsedSegment) {
  switch (seg.type) {
    case "thinking":
      return cleanThinkingLabel(seg.body);
    case "analyze":
      return `Inspect ${basename(seg.path)}`;
    case "code":
      return `Build ${basename(seg.file)}`;
    case "run":
      return "Verify the project";
    case "text":
      return (
        seg.body.trim().replace(/\s+/g, " ").slice(0, 58) || "Summarize work"
      );
    default:
      return "Continue implementation";
  }
}

function iconFor(kind: VibeParsedSegment["type"]) {
  if (kind === "analyze") return Search;
  if (kind === "code") return FileCode2;
  if (kind === "run") return Terminal;
  return Circle;
}

export function VibeProgressChecklist({
  segments,
  activeStep,
  archived,
  className,
}: {
  segments: VibeParsedSegment[];
  activeStep: number;
  archived: boolean;
  className?: string;
}) {
  const items = useMemo<ChecklistItem[]>(() => {
    const seen = new Set<string>();
    const next: ChecklistItem[] = [];

    segments.forEach((seg, sourceIndex) => {
      if (seg.type === "text") return;
      const label = labelForSegment(seg);
      const stableKey = `${seg.type}:${label.toLowerCase()}`;
      if (seen.has(stableKey)) return;
      seen.add(stableKey);
      next.push({
        key: `${sourceIndex}-${stableKey}`,
        label,
        kind: seg.type,
        sourceIndex,
      });
    });

    return next.slice(0, 8);
  }, [segments]);

  if (items.length < 2) return null;

  return (
    <motion.aside
      layout
      initial={{ opacity: 0, x: 18, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 14, scale: 0.985 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "hidden w-[250px] shrink-0 self-start rounded-[22px] border border-slate-200/70 bg-white/88 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:block",
        className,
      )}
      aria-label="Vibe build progress"
      style={{ contain: "layout paint" }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[14px] font-semibold tracking-[-0.01em] text-slate-700">
          Progress
        </p>
        <span className="rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
          {archived ? "Done" : "Live"}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const completed = archived || item.sourceIndex < activeStep;
          const active = !archived && item.sourceIndex === activeStep;
          const PendingIcon = iconFor(item.kind);

          return (
            <motion.div
              key={item.key}
              layout
              className={cn(
                "group flex items-start gap-2.5 rounded-2xl px-2.5 py-2 transition-colors",
                active && "bg-slate-50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors",
                  completed
                    ? "border-slate-900 bg-slate-900 text-white"
                    : active
                      ? "border-slate-300 bg-white text-slate-600"
                      : "border-slate-200 bg-white text-slate-300",
                )}
              >
                {completed ? (
                  <Check className="h-3 w-3" strokeWidth={2.2} />
                ) : active ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                ) : (
                  <PendingIcon className="h-3 w-3" strokeWidth={1.8} />
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 text-[13px] leading-[1.35] tracking-[-0.01em]",
                  completed
                    ? "font-medium text-slate-800"
                    : active
                      ? "font-semibold text-slate-700"
                      : "font-medium text-slate-400",
                )}
              >
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.aside>
  );
}
