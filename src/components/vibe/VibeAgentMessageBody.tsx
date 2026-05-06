"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { parseVibeAgentContent, type VibeParsedSegment } from "@/lib/parseVibeAgentContent";
import { extractCodeOutline } from "@/lib/extractCodeOutline";
import { MarkdownMessageContent } from "@/components/MarkdownMessageContent";
import { VibeThoughtPanel } from "./VibeThoughtPanel";
import { VibeAnalysingBanner } from "./VibeAnalysingBanner";
import { VibeMiniCodeBox } from "./VibeMiniCodeBox";
import { VibeRunBlock } from "./VibeRunBlock";
import { VibeTextLine } from "./VibeTextLine";
import { VibeFinalSummary, type SummaryFile } from "./VibeFinalSummary";
import { BlurredStaggerStream } from "@/components/ui/blurred-stagger-text";
import { cn } from "@/lib/utils";

/**
 * Orchestrates the visible Cursor-style agent stream.
 *
 * - Parses streamed content into ordered segments.
 * - Plays them strictly one-by-one.
 * - After the full timeline, shows the Summary (typed for the latest assistant reply), then
 *   notifies the parent so the live preview panel can open with the parsed file map.
 */
export function VibeAgentMessageBody({
  messageId,
  content,
  isStreaming,
  fontSizeClass,
  isLastAssistant,
  onVibePreviewReady,
}: {
  messageId?: string;
  content: string;
  isStreaming: boolean;
  fontSizeClass?: string;
  isLastAssistant?: boolean;
  onVibePreviewReady?: (messageId: string, filesByPath: Record<string, string>) => void;
}) {
  const hasDelims = content.includes("<<<VIBE_");
  const segments = useMemo(() => parseVibeAgentContent(content), [content]);
  const fallbackMarkdown = !hasDelims && content.length > 0;

  const blocks: VibeParsedSegment[] = useMemo(() => {
    const filtered = segments.filter((s) => {
      if (s.type === "text") return s.body.trim().length > 0;
      return true;
    });
    if (isStreaming || filtered.length === 0) return filtered;
    return filtered.map((seg, i) => {
      if (i !== filtered.length - 1) return seg;
      if (seg.type === "text") return seg;
      return { ...seg, complete: true } as VibeParsedSegment;
    });
  }, [segments, isStreaming]);

  const [activeStep, setActiveStep] = useState(0);
  const advanceTimeoutRef = useRef<number | null>(null);
  /** True once this message has ever streamed; false for history/hydrated bubbles → show full timeline instantly. */
  const streamStartedRef = useRef(false);

  useLayoutEffect(() => {
    if (isStreaming) streamStartedRef.current = true;
  }, [isStreaming]);

  useEffect(() => {
    setActiveStep(0);
    if (advanceTimeoutRef.current != null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, [messageId]);

  useEffect(
    () => () => {
      if (advanceTimeoutRef.current != null) {
        window.clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    },
    [],
  );

  const summaryFiles = useMemo<SummaryFile[]>(() => {
    if (isStreaming) return [];
    const byPath = new Map<string, SummaryFile>();
    for (const seg of blocks) {
      if (seg.type !== "code" || !seg.complete) continue;
      if (!seg.body.trim()) continue;
      byPath.set(seg.file, {
        path: seg.file,
        added: seg.added,
        removed: seg.removed,
        exports: extractCodeOutline(seg.body),
      });
    }
    return Array.from(byPath.values());
  }, [blocks, isStreaming]);

  const filesByPath = useMemo(() => {
    const m: Record<string, string> = {};
    for (const seg of blocks) {
      if (seg.type === "code" && seg.complete && seg.body.trim()) {
        m[seg.file] = seg.body;
      }
    }
    return m;
  }, [blocks]);

  const handleSummaryPrinted = useCallback(() => {
    if (!isLastAssistant || !onVibePreviewReady || !messageId) return;
    if (Object.keys(filesByPath).length === 0) return;
    onVibePreviewReady(messageId, filesByPath);
  }, [isLastAssistant, onVibePreviewReady, messageId, filesByPath]);

  if (fallbackMarkdown) {
    return (
      <div className={cn("space-y-3", fontSizeClass)}>
        {isStreaming ? (
          <BlurredStaggerStream
            text={content}
            isStreaming
            className={cn("text-inherit", fontSizeClass)}
          />
        ) : (
          <MarkdownMessageContent
            content={content}
            codeHighlighting
            codePresentation="soft"
            suppressCodeBlocks
          />
        )}
      </div>
    );
  }

  const allStepsDone = activeStep >= blocks.length;
  const isStaticHistory = !isStreaming && !streamStartedRef.current;
  const archived = isStaticHistory || allStepsDone;
  const showSummary =
    summaryFiles.length > 0 && ((!isStreaming && allStepsDone) || isStaticHistory);

  return (
    <div className={cn("flex flex-col gap-3 w-full", fontSizeClass)}>
      {blocks.map((seg, i) => {
        if (!archived && i > activeStep) return null;
        const isActive = !archived && i === activeStep;
        const isLastSegment = i === blocks.length - 1;

        const advance = () => {
          if (advanceTimeoutRef.current != null) {
            window.clearTimeout(advanceTimeoutRef.current);
            advanceTimeoutRef.current = null;
          }
          const next = i + 1;
          const prevType = blocks[i]?.type;
          const nextSeg = blocks[next];
          const pauseBeforeNarration =
            nextSeg?.type === "text" &&
            (prevType === "thinking" ||
              prevType === "code" ||
              prevType === "run" ||
              prevType === "analyze");

          const go = () => {
            setActiveStep((s) => (s === i ? next : s));
          };

          if (pauseBeforeNarration && next < blocks.length) {
            advanceTimeoutRef.current = window.setTimeout(() => {
              advanceTimeoutRef.current = null;
              go();
            }, 1000);
          } else {
            go();
          }
        };

        const key = `step-${i}-${seg.type}`;
        switch (seg.type) {
          case "thinking":
            return (
              <VibeThoughtPanel
                key={key}
                body={seg.body}
                complete={seg.complete}
                active={isActive}
                archived={archived}
                onCollapsed={archived ? undefined : advance}
              />
            );
          case "analyze":
            return (
              <VibeAnalysingBanner
                key={key}
                path={seg.path}
                active={isActive}
                archived={archived}
                onCompleted={archived ? undefined : advance}
              />
            );
          case "code":
            return (
              <VibeMiniCodeBox
                key={key}
                file={seg.file}
                added={seg.added}
                removed={seg.removed}
                code={seg.body}
                segmentComplete={seg.complete}
                active={isActive}
                archived={archived}
                onCollapsed={archived ? undefined : advance}
              />
            );
          case "run":
            return (
              <VibeRunBlock
                key={key}
                body={seg.body}
                segmentComplete={seg.complete}
                active={isActive}
                archived={archived}
                onCollapsed={archived ? undefined : advance}
              />
            );
          case "text": {
            const textComplete = !isLastSegment || !isStreaming;
            return (
              <VibeTextLine
                key={key}
                body={seg.body.trim()}
                complete={textComplete}
                active={isActive}
                archived={archived}
                onCompleted={archived ? undefined : advance}
              />
            );
          }
          default:
            return null;
        }
      })}

      {showSummary ? (
        <VibeFinalSummary
          files={summaryFiles}
          skipTyping={isStaticHistory}
          onFullyPrinted={isLastAssistant ? handleSummaryPrinted : undefined}
        />
      ) : null}
    </div>
  );
}
