"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileCode2 } from "lucide-react";

export type ExportItem = {
  name: string;
  kind: "component" | "function" | "const" | "type" | "interface" | "default";
  doc?: string;
};

export type SummaryFile = {
  path: string;
  added: number;
  removed: number;
  exports: ExportItem[];
};

const KIND_LABEL: Record<ExportItem["kind"], string> = {
  component: "component",
  function: "function",
  const: "const",
  type: "type",
  interface: "interface",
  default: "default",
};

function plainSummaryLine(files: SummaryFile[]): string {
  if (files.length === 0) return "";
  const basenames = files.map((f) => f.path.split("/").filter(Boolean).pop() ?? f.path);
  const exportTotal = files.reduce((n, f) => n + f.exports.length, 0);
  const list =
    basenames.length <= 4
      ? basenames.join(", ")
      : `${basenames.slice(0, 3).join(", ")} and ${basenames.length - 3} more`;

  if (files.length === 1) {
    const exportPhrase =
      exportTotal === 0
        ? "Surface area is in the file list below."
        : `${exportTotal} top-level export${exportTotal === 1 ? "" : "s"} are outlined below.`;
    return `This pass focused on "${basenames[0]}" — ${exportPhrase} Together it covers the types, hooks, and UI glue for what you asked for.`;
  }
  const exportPhrase =
    exportTotal === 0
      ? "See paths below for what changed."
      : `${exportTotal} top-level export${exportTotal === 1 ? "" : "s"} are listed under each path.`;
  return `This pass shipped ${files.length} files (${list}): types, logic, UI, and app wiring. ${exportPhrase}`;
}

function buildTypingBuffer(files: SummaryFile[]): string {
  const totalAdded = files.reduce((s, f) => s + f.added, 0);
  const totalRemoved = files.reduce((s, f) => s + f.removed, 0);
  const fileNoun = files.length === 1 ? "file" : "files";
  const prose = plainSummaryLine(files);
  const stats = `${files.length} ${fileNoun} touched · +${totalAdded} / −${totalRemoved} lines`;
  return `Summary\n\n${prose}\n\n${stats}`;
}

const CHARS_PER_FRAME = 2;

/**
 * Text-first session wrap-up. Title is "Summary". Top section types out; file outline appears
 * when typing finishes, then `onFullyPrinted` runs so the parent can reveal the live preview.
 */
export function VibeFinalSummary({
  files,
  onFullyPrinted,
  skipTyping = false,
}: {
  files: SummaryFile[];
  onFullyPrinted?: () => void;
  /** When true, show the full summary immediately (reopened / saved chats). */
  skipTyping?: boolean;
}) {
  const buffer = useMemo(() => buildTypingBuffer(files), [files]);
  const [phase, setPhase] = useState<"typing" | "body">(() => (skipTyping ? "body" : "typing"));
  const [revealed, setRevealed] = useState(() => (skipTyping ? buffer.length : 0));
  const notified = useRef(false);

  useEffect(() => {
    notified.current = false;
    if (skipTyping) {
      setPhase("body");
      setRevealed(buffer.length);
    } else {
      setPhase("typing");
      setRevealed(0);
    }
  }, [buffer, skipTyping]);

  useEffect(() => {
    if (skipTyping || phase !== "typing") return;
    if (revealed >= buffer.length) {
      setPhase("body");
      return;
    }
    const id = requestAnimationFrame(() => {
      setRevealed((r) => Math.min(r + CHARS_PER_FRAME, buffer.length));
    });
    return () => cancelAnimationFrame(id);
  }, [skipTyping, phase, revealed, buffer.length]);

  useEffect(() => {
    if (phase !== "body" || !onFullyPrinted || notified.current) return;
    notified.current = true;
    const t = window.setTimeout(() => onFullyPrinted(), skipTyping ? 0 : 120);
    return () => window.clearTimeout(t);
  }, [phase, onFullyPrinted, skipTyping]);

  if (files.length === 0) return null;

  const totalAdded = files.reduce((s, f) => s + f.added, 0);
  const totalRemoved = files.reduce((s, f) => s + f.removed, 0);
  const fileNoun = files.length === 1 ? "file" : "files";
  const summary = plainSummaryLine(files);

  const typed = buffer.slice(0, revealed);
  const typingLines = typed.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[560px] pt-5 mt-1 border-t border-slate-200/80"
      data-invert-ignore
    >
      {phase === "typing" ? (
        <div className="text-[12.5px] leading-relaxed text-slate-700">
          {typingLines.map((line, i) => (
            <span key={i} className="block min-h-[1.25em]">
              <span className={i === 0 ? "text-[13px] font-semibold tracking-tight text-slate-800" : ""}>
                {line || " "}
              </span>
            </span>
          ))}
        </div>
      ) : (
        <>
          <h3 className="text-[13px] font-semibold tracking-tight text-slate-800">Summary</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600">{summary}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-slate-500">
            {files.length} {fileNoun} touched ·{" "}
            <span className="font-medium tabular-nums text-emerald-600">+{totalAdded}</span>
            <span className="text-slate-400"> / </span>
            <span className="font-medium tabular-nums text-rose-500">−{totalRemoved}</span>{" "}
            <span className="text-slate-400">lines</span>
          </p>

          <ol className="mt-4 list-none space-y-4 pl-0 m-0">
            {files.map((f, idx) => (
              <li key={f.path} className="text-[13px] leading-snug">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="inline-flex items-baseline gap-1.5 text-slate-400 tabular-nums text-[11px] font-medium select-none">
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <FileCode2 className="h-3.5 w-3.5 shrink-0 text-slate-400 translate-y-px" aria-hidden />
                  <code className="font-mono text-[12.5px] font-medium text-slate-800 bg-slate-100/90 px-1.5 py-px rounded">
                    {f.path}
                  </code>
                  <span className="tabular-nums text-[11.5px] text-emerald-600 font-medium">+{f.added}</span>
                  <span className="tabular-nums text-[11.5px] text-rose-500 font-medium">−{f.removed}</span>
                </div>

                {f.exports.length > 0 ? (
                  <ul className="mt-2 ml-0 pl-[2.25rem] space-y-1.5 border-l border-slate-200/70">
                    {f.exports.map((e, i) => (
                      <li key={`${f.path}-${e.name}-${i}`} className="text-[12px] leading-relaxed text-slate-600">
                        <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {KIND_LABEL[e.kind]}
                          </span>
                          <code className="font-mono text-[12px] text-slate-800">{e.name}</code>
                          {e.doc ? (
                            <span className="text-slate-500 min-w-0">— {e.doc}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 pl-[2.25rem] text-[12px] italic text-slate-400">
                    No top-level exports detected.
                  </p>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </motion.div>
  );
}
