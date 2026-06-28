import React, { useState, useEffect } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { ShiningText } from "../../ui/shining-text";
import { ThinkingLine } from "../../../hooks/useVibeCoderWorkspace";

interface ThinkingStatusProps {
  lines: ThinkingLine[];
  stage: string;
  isComplete: boolean;
  hasError: boolean;
}

export function ThinkingStatus({ lines, isComplete, hasError }: ThinkingStatusProps) {
  const [expanded, setExpanded] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (isComplete || hasError) return;
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete, hasError]);

  const visibleLines = expanded ? lines : lines.slice(-3);
  const label = isComplete ? "Thought" : hasError ? "Error" : "Thinking";
  const timeLabel = `${Math.max(1, timer)}s`;

  return (
    <div className="mb-4 flex w-full max-w-[720px] flex-col items-start">
      <button
        type="button"
        className="group flex items-center gap-2 rounded-full px-1 py-1 text-left outline-none transition-colors hover:bg-slate-50/80"
        onClick={() => setExpanded(!expanded)}
      >
        <Brain
          className={`h-4 w-4 ${
            isComplete ? "text-slate-400" : hasError ? "text-red-500" : "text-blue-500"
          }`}
        />
        {isComplete || hasError ? (
          <span className={`text-[13px] font-semibold ${hasError ? "text-red-500" : "text-slate-400"}`}>
            {label}
          </span>
        ) : (
          <ShiningText text={label} />
        )}
        <span className={`text-[13px] font-semibold ${isComplete ? "text-slate-400" : "text-slate-500"}`}>
          {timeLabel}
        </span>
        {lines.length > 0 ? (
          <span className="ml-1 grid h-5 w-5 place-items-center text-slate-300 transition-colors group-hover:text-slate-500">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </span>
        ) : null}
      </button>

      {lines.length > 0 && (
        <div className="ml-6 mt-1 max-h-24 w-full max-w-[640px] overflow-y-auto pr-3 text-left">
          <div className="flex flex-col gap-1.5">
            {visibleLines.map((line, idx) => (
              <p
                key={line.id}
                className={`text-[13px] font-medium leading-relaxed ${
                  idx === visibleLines.length - 1 && !isComplete
                    ? "text-slate-700"
                    : "text-slate-500"
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {lines.length === 0 && !isComplete && !hasError ? (
        <p className="ml-6 mt-1 text-[13px] font-medium text-slate-500">
          Preparing the plan and checking the project shape.
        </p>
      ) : null}
    </div>
  );
}
