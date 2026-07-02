import { useEffect, useMemo, useRef, useState } from "react";
import { ProjectFile } from "../../../hooks/useVibeCoderWorkspace";
import { VibeMiniCodeBox } from "../../vibe/VibeMiniCodeBox";

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

function placeholderCodeFor(
  path: string,
  action: "create" | "edit" | "delete",
  reason: string,
) {
  const lower = path.toLowerCase();
  const detail = reason.trim() || "Preparing this file from the current step.";
  if (lower.endsWith(".css")) {
    return `/* ${action.toUpperCase()}: ${detail} */`;
  }
  if (lower.endsWith(".html")) {
    return `<!-- ${action.toUpperCase()}: ${detail} -->`;
  }
  return `// ${action.toUpperCase()}: ${detail}`;
}

export function MiniCodeBoxQueue({
  files = [],
  queueList = [],
  boxes,
  isStreamDone,
  onQueueComplete,
}: MiniCodeBoxQueueProps) {
  const normalisedFiles = useMemo(
    () => {
      if (boxes) {
        return boxes.map((box): ProjectFile => {
          const code = box.fullContent || box.contentDiff || "";
          return {
            path: box.filePath,
            action: box.action ?? "edit",
            status: isStreamDone ? "complete" : "streaming",
            language: box.filePath.split(".").pop() || "text",
            code,
            added: Math.max(1, code.split("\n").filter(Boolean).length),
            removed: 0,
          };
        });
      }

      const merged = new Map<string, ProjectFile>();
      for (const item of queueList) {
        const code = placeholderCodeFor(item.path, item.action, item.reason);
        merged.set(item.path, {
          path: item.path,
          action: item.action,
          status: "idle",
          language: item.path.split(".").pop() || "text",
          code,
          added: Math.max(1, code.split("\n").filter(Boolean).length),
          removed: 0,
        });
      }
      for (const file of files) {
        merged.set(file.path, file);
      }
      return Array.from(merged.values());
    },
    [boxes, files, isStreamDone, queueList],
  );

  const filesByPath = useMemo(
    () => new Map(normalisedFiles.map((file) => [file.path, file])),
    [normalisedFiles],
  );

  const orderedPaths = useMemo(() => {
    const fromQueue = queueList.map((item) => item.path);
    const fromFiles = normalisedFiles.map((file) => file.path);
    const combined = [...fromQueue, ...fromFiles];
    return Array.from(new Set(combined)).filter((path) => path !== "PLAN.md" && path !== "implementation_plan.md");
  }, [normalisedFiles, queueList]);

  const [visibleCount, setVisibleCount] = useState(1);
  const signatureRef = useRef("");
  const signature = orderedPaths.join("|");
  const availableFiles = orderedPaths
    .map((path, index) => ({ file: filesByPath.get(path), index }))
    .filter((item): item is { file: ProjectFile; index: number } => Boolean(item.file));

  useEffect(() => {
    if (!signature) {
      signatureRef.current = "";
      setVisibleCount(1);
      return;
    }
    if (!signatureRef.current || !signature.startsWith(signatureRef.current)) {
      setVisibleCount(1);
    }
    signatureRef.current = signature;
  }, [signature]);

  useEffect(() => {
    if (orderedPaths.length > 0 && visibleCount >= orderedPaths.length) {
      onQueueComplete?.();
    }
  }, [onQueueComplete, orderedPaths.length, visibleCount]);

  useEffect(() => {
    if (visibleCount >= availableFiles.length) return;
    const timeout = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, availableFiles.length));
    }, 4300);
    return () => window.clearTimeout(timeout);
  }, [availableFiles.length, visibleCount]);

  const visibleFiles = availableFiles.slice(0, visibleCount);
  const activeVisibleIndex = visibleFiles.findIndex(({ file }) => file.status !== "complete");

  if (visibleFiles.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-2xl flex-col gap-3">
      {visibleFiles.map(({ file }, index) => {
        const isActive = index === activeVisibleIndex;
        return (
          <div key={file.path} className="flex flex-col">
            <VibeMiniCodeBox
              file={file.path}
              added={file.added ?? 0}
              removed={file.removed ?? 0}
              code={file.code}
              segmentComplete={file.status === "complete"}
              active={isActive}
              archived={!isActive}
            />
          </div>
        );
      })}
    </div>
  );
}
