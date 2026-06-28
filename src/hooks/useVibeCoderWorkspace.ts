import { useState, useCallback, useRef, useEffect } from "react";
import type { AgentStage, VibeCoderEvent } from "../../lib/cline/cline-events";

export type ProjectFile = {
  path: string;
  action: "create" | "edit" | "delete";
  status: "idle" | "streaming" | "complete" | "error";
  language: string;
  code: string;
  added?: number;
  removed?: number;
};

export type TerminalLog = {
  id: string;
  command?: string;
  output: string;
  timestamp: number;
};

export type ProjectCheckpoint = {
  id: string;
  label: string;
  createdAt: number;
  files: Record<string, string>;
  stage: AgentStage;
};

export type PreviewState = {
  status: "idle" | "starting" | "ready" | "error";
  url?: string;
  error?: string;
};

export type ThinkingLine = {
  id: string;
  text: string;
  timestamp: number;
};

export type WorkspaceState = {
  projectId: string;
  taskId: string | null;
  prompt: string;
  planMode: boolean;
  stage: AgentStage;
  thinkingLines: ThinkingLine[];
  files: Record<string, ProjectFile>;
  activeFilePath: string | null;
  fileQueue: Array<{
    path: string;
    action: "create" | "edit" | "delete";
    reason: string;
  }>;
  currentStreamingFile: string | null;
  terminalLogs: TerminalLog[];
  preview: PreviewState;
  checkpoints: ProjectCheckpoint[];
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  planMd: string;
};

export function useVibeCoderWorkspace(projectId: string) {
  const [state, setState] = useState<WorkspaceState>({
    projectId,
    taskId: null,
    prompt: "",
    planMode: true,
    stage: "idle",
    thinkingLines: [],
    files: {},
    activeFilePath: null,
    fileQueue: [],
    currentStreamingFile: null,
    terminalLogs: [],
    preview: { status: "idle" },
    checkpoints: [],
    startedAt: null,
    completedAt: null,
    error: null,
    planMd: ""
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const processEvent = useCallback((event: VibeCoderEvent) => {
    setState(prev => {
      const next = { ...prev };
      const ts = event.timestamp || Date.now();
      const eventId = `${ts}-${event.type}-${prev.thinkingLines.length}-${prev.terminalLogs.length}`;

      switch (event.type) {
        case "stage":
          next.stage = event.stage;
          next.thinkingLines = [...next.thinkingLines, { id: eventId, text: event.message, timestamp: ts }];
          break;
        case "thinking":
          next.thinkingLines = [...next.thinkingLines, { id: eventId, text: event.text, timestamp: ts }];
          break;
        case "plan_started":
          next.stage = "writing-plan-md";
          next.planMd = "";
          break;
        case "plan_delta":
          next.planMd = prev.planMd + event.delta;
          break;
        case "plan_completed":
          next.planMd = event.content;
          next.stage = "extracting-file-queue";
          break;
        case "file_queue_created":
          next.fileQueue = event.files;
          break;
        case "file_started":
          next.stage = event.action === "create" ? "generating-file" : "editing-file";
          next.currentStreamingFile = event.path;
          next.activeFilePath = event.path;
          next.files = {
            ...prev.files,
            [event.path]: {
              path: event.path,
              action: event.action,
              status: "streaming",
              language: event.language,
              code: "",
            }
          };
          break;
        case "file_delta":
          if (next.files[event.path]) {
            next.files[event.path].code += event.delta;
          }
          break;
        case "file_completed":
          if (next.files[event.path]) {
            next.files[event.path].status = "complete";
            next.files[event.path].code = event.content;
          }
          next.currentStreamingFile = null;
          break;
        case "terminal_started":
          next.stage = "running-command";
          next.terminalLogs = [...prev.terminalLogs, { id: eventId, command: event.command, output: `> ${event.command}`, timestamp: ts }];
          break;
        case "terminal_output":
          next.terminalLogs = [...prev.terminalLogs, { id: eventId, output: event.output, timestamp: ts }];
          break;
        case "preview_starting":
          next.stage = "starting-preview";
          next.preview = { status: "starting" };
          break;
        case "preview_ready":
          next.stage = "validating-preview";
          next.preview = { status: "ready", url: event.url };
          break;
        case "checkpoint_created":
          next.checkpoints = [...prev.checkpoints, {
            id: event.id,
            label: event.label,
            createdAt: ts,
            files: {},
            stage: next.stage
          }];
          break;
        case "error":
          next.stage = "failed";
          next.error = event.message;
          break;
        case "complete":
          next.stage = "complete";
          next.completedAt = ts;
          break;
      }
      return next;
    });
  }, []);

  const startTask = useCallback(async (prompt: string, planMode: boolean) => {
    setState(prev => ({
      ...prev,
      projectId,
      prompt,
      planMode,
      stage: "task-created",
      startedAt: Date.now(),
      completedAt: null,
      error: null,
      thinkingLines: [],
      files: {},
      fileQueue: [],
      terminalLogs: [],
      preview: { status: "idle" },
      planMd: ""
    }));

    try {
      const res = await fetch("/api/vibe/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, planMode, projectId })
      });
      const data = await res.json();
      
      setState(prev => ({
        ...prev,
        taskId: data.taskId,
        projectId: typeof data.projectId === "string" ? data.projectId : prev.projectId,
      }));

      const es = new EventSource(`/api/vibe/events/${data.taskId}`);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        const ev = JSON.parse(e.data) as VibeCoderEvent;
        processEvent(ev);
        if (ev.type === "complete" || (ev.type === "error" && !ev.recoverable)) {
          es.close();
        }
      };
    } catch (e: any) {
      setState(prev => ({ ...prev, stage: "failed", error: e.message }));
    }
  }, [projectId, processEvent]);

  const cancelTask = useCallback(async () => {
    if (state.taskId) {
      await fetch(`/api/vibe/cancel/${state.taskId}`, { method: "POST" });
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setState(prev => ({ ...prev, stage: "cancelled", error: "Cancelled by user" }));
    }
  }, [state.taskId]);

  const approvePlan = useCallback(async () => {
    if (!state.taskId) return;
    await fetch(`/api/vibe/approve/${state.taskId}`, { method: "POST" });
  }, [state.taskId]);

  return {
    state,
    startTask,
    cancelTask,
    approvePlan,
    setState
  };
}
