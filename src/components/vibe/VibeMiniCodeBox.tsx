"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { ShiningText } from "@/components/ShiningText";

const LINE_PX = 20;
const VISIBLE_LINES_TYPING = 4;
const VISIBLE_LINES_REOPENED = 4;
const MAX_CODE_H_TYPING = LINE_PX * VISIBLE_LINES_TYPING;
const MAX_CODE_H_REOPENED = LINE_PX * VISIBLE_LINES_REOPENED;
const CHAR_MS = 3;
const COLLAPSE_HOLD_MS = 2000;

function lineCountFromSource(src: string): number {
  if (src.length === 0) return 0;
  return src.split("\n").length;
}

/**
 * Cursor-style mini code card.
 *
 * Lifecycle:
 *  - Mounted with `revealed = 0`.
 *  - Reveals 1 char per tick; tiny burst on huge files so the UI stays responsive.
 *  - Once typing finishes AND the segment is complete, holds 2s and auto-collapses to a
 *    single-row header. Fires `onCollapsed` so the parent timeline can advance.
 *  - The header is always clickable. Clicking after auto-collapse re-expands the box
 *    showing up to 4 lines of code with line numbers. Click again to collapse smoothly.
 */
export function VibeMiniCodeBox({
  file,
  added,
  removed,
  code,
  segmentComplete,
  active,
  onCollapsed,
  archived = false,
}: {
  file: string;
  added: number;
  removed: number;
  code: string;
  segmentComplete: boolean;
  active: boolean;
  onCollapsed?: () => void;
  archived?: boolean;
}) {
  const [revealed, setRevealed] = useState(() => (archived ? code.length : 0));
  const [collapsed, setCollapsed] = useState(() => !!archived);
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const collapsedNotifiedRef = useRef(!!archived);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (archived) {
      setRevealed(code.length);
      setCollapsed(true);
      collapsedNotifiedRef.current = true;
      return;
    }
    if (!active || collapsed) return;
    if (revealed < code.length) {
      const left = code.length - revealed;
      const step = left > 1500 ? 3 : left > 600 ? 2 : 1;
      const id = window.setTimeout(
        () => setRevealed((r) => Math.min(r + step, code.length)),
        CHAR_MS,
      );
      return () => window.clearTimeout(id);
    }
    if (!segmentComplete) return;
    const id = window.setTimeout(() => setCollapsed(true), COLLAPSE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [archived, active, collapsed, revealed, code.length, segmentComplete]);

  useEffect(() => {
    if (archived) return;
    if (!collapsed || collapsedNotifiedRef.current) return;
    collapsedNotifiedRef.current = true;
    onCollapsed?.();
  }, [archived, collapsed, onCollapsed]);

  useLayoutEffect(() => {
    if (archived) return;
    const el = scrollRef.current;
    if (!el || collapsed || !active) return;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow <= 4) return;
    const targetTop = el.scrollHeight - el.clientHeight;
    if (Math.abs(el.scrollTop - targetTop) < 2) return;
    el.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [archived, revealed, collapsed, active]);

  const shown = code.slice(0, revealed);
  const isOpen = !collapsed || manuallyOpen;
  const headerInteractive = collapsed;
  const maxBodyPx = collapsed ? MAX_CODE_H_REOPENED : MAX_CODE_H_TYPING;

  const lines = useMemo(() => {
    if (shown.length === 0) return [] as string[];
    return shown.split("\n");
  }, [shown]);

  /** Header "+" matches gutter line count (lines in `shown`), not the model's `added` attribute. */
  const targetPlus = lines.length;
  const targetMinus =
    archived || (segmentComplete && revealed >= code.length) ? removed : 0;

  const plusAnimRef = useRef(archived ? lineCountFromSource(code) : 0);
  const minusAnimRef = useRef(archived ? removed : 0);
  const [displayAdded, setDisplayAdded] = useState(() =>
    archived ? lineCountFromSource(code) : 0,
  );
  const [displayRemoved, setDisplayRemoved] = useState(() => (archived ? removed : 0));

  useEffect(() => {
    if (!archived) return;
    const n = lineCountFromSource(code);
    plusAnimRef.current = n;
    minusAnimRef.current = removed;
    setDisplayAdded(n);
    setDisplayRemoved(removed);
  }, [archived, code, removed]);

  useEffect(() => {
    if (archived) return;
    let cancelled = false;
    let raf = 0;
    const tick = () => {
      if (cancelled) return;
      const tgtA = targetPlus;
      const tgtR = targetMinus;
      const curA = plusAnimRef.current;
      const curR = minusAnimRef.current;
      const nextA = curA + (tgtA - curA) * 0.32;
      const nextR = curR + (tgtR - curR) * 0.35;
      plusAnimRef.current = nextA;
      minusAnimRef.current = nextR;
      const rA = Math.round(nextA);
      const rR = Math.round(nextR);
      setDisplayAdded((p) => (p === rA ? p : rA));
      setDisplayRemoved((p) => (p === rR ? p : rR));
      if (Math.abs(tgtA - nextA) > 0.04 || Math.abs(tgtR - nextR) > 0.04) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [targetPlus, targetMinus, archived]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: active ? 1 : 0.7, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[560px]"
    >
      <motion.div
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
        style={{ contain: "layout paint" }}
      >
        <div
          role={headerInteractive ? "button" : undefined}
          tabIndex={headerInteractive ? 0 : -1}
          aria-expanded={headerInteractive ? isOpen : undefined}
          onClick={headerInteractive ? () => setManuallyOpen((o) => !o) : undefined}
          onKeyDown={
            headerInteractive
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setManuallyOpen((o) => !o);
                  }
                }
              : undefined
          }
          className={
            "flex items-center justify-between gap-2 px-4 py-2 text-[13px] bg-white text-left transition-colors select-none " +
            (headerInteractive
              ? "cursor-pointer hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              : "")
          }
        >
          <span className="flex min-w-0 flex-1 items-baseline gap-2 truncate">
            {!collapsed ? (
              <ShiningText
                text={file}
                preset="thinkingChat"
                play
                className="text-[13px] font-medium truncate max-w-[180px] sm:max-w-[280px]"
              />
            ) : (
              <span className="truncate text-[13px] font-medium text-slate-700">{file}</span>
            )}
            <span className="shrink-0 text-[12px] font-medium tabular-nums text-emerald-600">
              +{displayAdded}
            </span>
            <span className="shrink-0 text-[12px] font-medium tabular-nums text-rose-500">
              -{displayRemoved}
            </span>
          </span>
          {headerInteractive ? (
            <motion.span
              animate={{ rotate: isOpen ? 0 : -90 }}
              transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.32 }}
              className="shrink-0 text-slate-400"
              aria-hidden
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
          ) : null}
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="code"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.2 },
              }}
              className="overflow-hidden border-t border-slate-100/90"
            >
              <div
                ref={scrollRef}
                className="scrollbar-none overflow-x-hidden overflow-y-auto px-2 pb-2.5 pt-1.5"
                style={{
                  maxHeight: maxBodyPx,
                  contain: "layout style paint",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, #000 10px, #000 calc(100% - 10px), transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, #000 10px, #000 calc(100% - 10px), transparent 100%)",
                }}
              >
                {lines.length === 0 ? (
                  <div className="min-h-[20px]" aria-hidden />
                ) : (
                  lines.map((line, i) => (
                    <div key={`${i}-${revealed}`} className="flex min-h-[20px] gap-2">
                      <span className="w-8 shrink-0 select-none text-right font-mono text-[10px] tabular-nums leading-[20px] text-slate-400">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 break-words font-mono text-[12px] leading-[20px] text-slate-700 whitespace-pre-wrap">
                        {line}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
