import React, { useState, useEffect } from "react";
import { ProjectFile } from "../../../hooks/useVibeCoderWorkspace";
import { VibeMiniCodeBox } from "../../vibe/VibeMiniCodeBox";

export type MiniCodeBoxState =
  | "idle"
  | "fade-in"
  | "waiting-before-expand"
  | "expanding"
  | "streaming"
  | "complete"
  | "waiting-before-collapse"
  | "collapsing"
  | "waiting-before-next";

export const MINI_CODE_BOX_TIMING = {
  fadeInMs: 450,
  waitBeforeExpandMs: 1000,
  expandMs: 450,
  streamChunkMs: 10,
  waitBeforeCollapseMs: 1000,
  collapseMs: 450,
  waitBeforeNextMs: 1000,
};

interface MiniCodeBoxQueueProps {
  files?: ProjectFile[];
  queueList?: Array<{ path: string; action: "create" | "edit" | "delete"; reason: string }>;
  boxes?: Array<{
    id?: string;
    action?: "create" | "edit" | "delete";
    filePath: string;
    purpose?: string;
    fullContent?: string;
    contentDiff?: string;
  }>;
  isStreamDone?: boolean;
  onQueueComplete?: () => void;
}

export function MiniCodeBoxQueue({ files = [], queueList = [], boxes, isStreamDone, onQueueComplete }: MiniCodeBoxQueueProps) {
  const normalisedFiles = boxes
    ? boxes.map((box): ProjectFile => ({
        path: box.filePath,
        action: box.action ?? "edit",
        status: isStreamDone ? "complete" : "streaming",
        language: box.filePath.split(".").pop() || "text",
        code: box.fullContent || box.contentDiff || "",
      }))
    : files;
  // Find the currently active streaming file, or the latest completed one if none is streaming
  const streamingFile = normalisedFiles.find(f => f.status === "streaming") ?? normalisedFiles.find(f => f.status === "complete");
  
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [animationState, setAnimationState] = useState<MiniCodeBoxState>("idle");

  useEffect(() => {
    if (streamingFile && (!activeFile || activeFile.path !== streamingFile.path)) {
      // New file started
      setActiveFile(streamingFile);
      setAnimationState("fade-in");
      
      const fadeTimer = window.setTimeout(() => {
        setAnimationState("waiting-before-expand");
        const expandWaitTimer = window.setTimeout(() => {
          setAnimationState("expanding");
          const expandTimer = window.setTimeout(() => {
            setAnimationState("streaming");
          }, MINI_CODE_BOX_TIMING.expandMs);
          return () => window.clearTimeout(expandTimer);
        }, MINI_CODE_BOX_TIMING.waitBeforeExpandMs);
        return () => window.clearTimeout(expandWaitTimer);
      }, MINI_CODE_BOX_TIMING.fadeInMs);
      return () => window.clearTimeout(fadeTimer);
    }
  }, [streamingFile, activeFile]);

  // Handle completion
  useEffect(() => {
    if (activeFile && animationState === "streaming") {
      const currentFileState = normalisedFiles.find(f => f.path === activeFile.path);
      if (currentFileState && currentFileState.status === "complete") {
        setAnimationState("complete");
        
        const completeTimer = window.setTimeout(() => {
          setAnimationState("waiting-before-collapse");
          const collapseWaitTimer = window.setTimeout(() => {
            setAnimationState("collapsing");
            const collapseTimer = window.setTimeout(() => {
              setAnimationState("waiting-before-next");
              setActiveFile(null); // Clear for the next file
              onQueueComplete?.();
            }, MINI_CODE_BOX_TIMING.collapseMs);
            return () => window.clearTimeout(collapseTimer);
          }, MINI_CODE_BOX_TIMING.waitBeforeCollapseMs);
          return () => window.clearTimeout(collapseWaitTimer);
        }, 1000); // give it a sec on complete
        return () => window.clearTimeout(completeTimer);
      }
    }
  }, [normalisedFiles, activeFile, animationState, onQueueComplete]);

  if (!activeFile) {
    return null; // Empty queue state
  }

  // Find corresponding queue item for reason
  const queueItem = queueList.find(q => q.path === activeFile.path);

  // Map our new animation state to the old VibeMiniCodeBox states
  // We may need to adapt this depending on what VibeMiniCodeBox accepts.
  const isExpanded = ["expanding", "streaming", "complete", "waiting-before-collapse"].includes(animationState);
  const isFadingIn = animationState === "fade-in";
  
  return (
    <div className={`transition-opacity duration-500 w-full max-w-2xl mx-auto mb-4 ${isFadingIn ? 'opacity-0' : 'opacity-100'}`}>
      <VibeMiniCodeBox
        file={activeFile.path}
        added={0}
        removed={0}
        code={activeFile.code}
        segmentComplete={activeFile.status === "complete"}
        active={isExpanded}
        onCollapsed={() => setActiveFile(null)}
      />
    </div>
  );
}
