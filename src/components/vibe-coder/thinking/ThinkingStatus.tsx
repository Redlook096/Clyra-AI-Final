import React, { useState, useEffect, useMemo, useRef } from "react";
import { Brain, ChevronDown, Globe2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ShiningText } from "../../ui/shining-text";
import { ThinkingLine } from "../../../hooks/useVibeCoderWorkspace";

interface ThinkingStatusProps {
  lines: ThinkingLine[];
  stage: string;
  isComplete: boolean;
  hasError: boolean;
  thoughtText?: string;
  resetKey?: string | null;
}

function extractWebSources(lines: ThinkingLine[]) {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const line of lines) {
    const matches = Array.from(
      line.text.matchAll(/https?:\/\/(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})(?:[^\s]*)/gi),
    );
    for (const match of matches) {
      const host = match[1]?.toLowerCase();
      if (!host || seen.has(host)) continue;
      seen.add(host);
      results.push(host);
      if (results.length >= 4) return results;
    }
  }

  return results;
}

function domainBadge(domain: string) {
  const label = domain.replace(/^www\./, "").split(".")[0] || domain;
  const letters = label.slice(0, 2).toUpperCase();
  return letters;
}

export function ThinkingStatus({ lines, stage, isComplete, hasError, thoughtText, resetKey }: ThinkingStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [timer, setTimer] = useState(0);
  const manualOverrideRef = useRef(false);
  const collapseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setTimer(0);
    setExpanded(false);
    manualOverrideRef.current = false;
    if (collapseTimerRef.current) window.clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = null;
  }, [resetKey]);

  useEffect(() => {
    if (isComplete || hasError) return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete, hasError]);

  useEffect(() => {
    if (hasError) return;
    if (!isComplete) {
      if (!manualOverrideRef.current) {
        const t = window.setTimeout(() => setExpanded(true), 3000);
        return () => window.clearTimeout(t);
      }
      return;
    }
  }, [hasError, isComplete]);

  const isWebSearch = stage === "researching-web";
  const label = isComplete
    ? isWebSearch
      ? "Search complete"
      : "Thought"
    : hasError
      ? "Error"
      : isWebSearch
        ? "Searching web"
        : "Thinking";
  const timeLabel = `${Math.max(1, timer)}s`;
  const primaryThought = thoughtText
    ? {
        id: "visible-request-summary",
        text: thoughtText,
        timestamp: Date.now(),
      }
    : null;
  const recentLines = lines.slice(-2);
  const displayLines = primaryThought ? [primaryThought] : recentLines;
  const visibleLines = expanded ? displayLines : primaryThought ? [primaryThought] : [];
  const showThoughtText = displayLines.length > 0 && expanded && !hasError;
  const webSources = extractWebSources(lines);
  const webChips = webSources.length > 0 ? webSources : [];

  const canExpand = displayLines.length > 0 && !hasError;

  return (
    <div className="mb-4 flex w-full max-w-[720px] flex-col items-start">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full px-1 py-1 text-left outline-none transition-colors"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (!canExpand) return;
          manualOverrideRef.current = true;
          setExpanded((value) => !value);
        }}
      >
        <span className="relative grid h-4 w-4 place-items-center">
          <AnimatePresence initial={false} mode="popLayout">
            {isWebSearch && !isComplete && !hasError ? (
              <motion.span
                key="globe"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
              >
                <Globe2 className="h-4 w-4 animate-pulse text-slate-400" />
              </motion.span>
            ) : canExpand && isComplete && (isHovered || expanded) ? (
              <motion.span
                key="chevron"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
              >
                <motion.span
                  animate={{ rotate: expanded ? 0 : -90 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="grid h-4 w-4 place-items-center"
                >
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </motion.span>
              </motion.span>
            ) : (
              <motion.span
                key="brain"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
              >
                <Brain className="h-4 w-4 text-slate-400" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {isComplete || hasError ? (
          <span className="text-[13px] font-semibold text-slate-400">
            {label}
          </span>
        ) : (
          <ShiningText text={label} />
        )}
        {!isWebSearch ? (
          <span className={`text-[13px] font-semibold ${isComplete ? "text-slate-400" : "text-slate-500"}`}>
            {timeLabel}
          </span>
        ) : null}
        {isWebSearch ? (
          <span className="ml-1 flex items-center gap-1.5">
            {webChips.map((source) => (
              <span
                key={source}
                className="grid h-5 w-5 place-items-center rounded-full border border-slate-200/80 bg-white text-[10px] font-bold text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.04)] overflow-hidden"
                title={source}
              >
                <img src={`https://www.google.com/s2/favicons?domain=${source}&sz=64`} alt="" className="h-3.5 w-3.5 object-cover" />
              </span>
            ))}
            {!isComplete && !hasError ? (
              <span className="ml-0.5 flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-300" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-200 [animation-delay:200ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-200 [animation-delay:400ms]" />
              </span>
            ) : null}
          </span>
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {showThoughtText && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="ml-6 mt-1 w-full max-w-[640px] overflow-hidden pr-3 text-left"
          >
            <div className="flex flex-col gap-2 pb-2">
              {visibleLines.map((line) => (
                <p
                  key={line.id}
                  className="whitespace-pre-line text-[13px] font-medium leading-relaxed text-slate-600 opacity-70 transition-colors duration-300"
                >
                  {line.text}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
