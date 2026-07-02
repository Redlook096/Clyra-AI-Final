import type { CoreSessionEvent } from "@cline/core";
import type { AgentEvent } from "@cline/shared";
import type { VibeCoderEvent } from "./cline-events";

export type ClineToolMapping = {
  read: string[];
  search: string[];
  write: string[];
  command: string[];
  web: string[];
  mcp: string[];
};

export const CLINE_TOOL_CATEGORIES: ClineToolMapping = {
  read: ["read_file", "read_files", "read", "list_directory", "list_dir"],
  search: ["search_files", "search_codebase", "search", "grep", "glob"],
  write: ["write_file", "edit_file", "apply_diff", "apply_patch", "replace_in_file", "create_file"],
  command: ["run_command", "bash", "execute_command", "terminal", "shell"],
  web: ["web_fetch", "fetch_url", "web_search", "browser"],
  mcp: ["mcp_"],
};

export function categorizeToolName(toolName: string): keyof ClineToolMapping | "unknown" {
  const lower = toolName.toLowerCase();
  for (const [category, names] of Object.entries(CLINE_TOOL_CATEGORIES)) {
    if (names.some((n) => lower.includes(n.replace(/_/g, "")) || lower.includes(n))) {
      return category as keyof ClineToolMapping;
    }
  }
  if (lower.startsWith("mcp")) return "mcp";
  return "unknown";
}

function mapAgentEvent(agentEvent: AgentEvent, workspacePath: string): VibeCoderEvent[] {
  const events: VibeCoderEvent[] = [];

  if (agentEvent.type === "content_start" || agentEvent.type === "content_end") {
    if (agentEvent.contentType === "text" || agentEvent.contentType === "reasoning") {
      // Only emit complete thoughts on content_end to avoid per-token spam
      if (agentEvent.type !== "content_end") return events;
      const text = String(agentEvent.text || agentEvent.reasoning || "").trim();
      if (text) events.push({ type: "thinking", text: text.slice(0, 600) });
      return events;
    }

    if (agentEvent.contentType === "tool") {
      const toolName = String(agentEvent.toolName || "");
      const category = categorizeToolName(toolName);
      const input = agentEvent.type === "content_start"
        ? ((agentEvent.input || {}) as Record<string, unknown>)
        : ({} as Record<string, unknown>);
      const filePath = String(input.path || input.filePath || input.file || "");

      if (category === "read" || category === "search") {
        events.push({
          type: "stage",
          stage: category === "search" ? "reviewing-file" : "inspecting-existing-project",
          message: category === "search"
            ? `Searching ${String(input.query || input.pattern || "project files")}`
            : `Reading ${filePath || "project files"}`,
        });
        return events;
      }

      if (category === "write" && filePath && agentEvent.type === "content_end") {
        const relative = relativizePath(filePath, workspacePath);
        const isCreate = toolName.toLowerCase().includes("create") || toolName.toLowerCase().includes("write");
        const output = agentEvent.output as Record<string, unknown> | undefined;
        const content = String(
          input.content || input.new_text || input.diff || input.text ||
          output?.content || output?.text || "",
        );
        events.push({
          type: "file_started",
          path: relative,
          language: relative.split(".").pop() || "text",
          action: isCreate ? "create" : "edit",
        });
        if (content) {
          events.push({ type: "file_delta", path: relative, delta: content });
          events.push({ type: "file_completed", path: relative, content });
        }
        return events;
      }

      if (category === "command" && agentEvent.type === "content_start") {
        const command = String(input.command || input.cmd || toolName);
        events.push({ type: "terminal_started", command });
        return events;
      }

      if (category === "web") {
        events.push({ type: "stage", stage: "researching-web", message: `Web tool: ${toolName}` });
        return events;
      }

      if (agentEvent.type === "content_end" && agentEvent.output != null) {
        const text = typeof agentEvent.output === "string"
          ? agentEvent.output
          : JSON.stringify(agentEvent.output);
        const truncated = text.length > 4000 ? `${text.slice(0, 4000)}\n…[truncated]` : text;
        if (truncated.length < 8000) {
          events.push({ type: "terminal_output", command: toolName || "tool", output: truncated });
          events.push({ type: "terminal_completed", command: toolName || "tool", exitCode: agentEvent.error ? 1 : 0 });
        }
      }
    }
    return events;
  }

  if (agentEvent.type === "notice") {
    const text = String(agentEvent.message || "").trim();
    if (text) events.push({ type: "status_update", message: text });
    return events;
  }

  if (agentEvent.type === "error") {
    events.push({
      type: "error",
      message: agentEvent.error?.message || "Cline error",
      recoverable: agentEvent.recoverable ?? true,
    });
  }

  return events;
}

export function mapClineSessionEventToVibeEvents(
  event: CoreSessionEvent,
  workspacePath: string,
): VibeCoderEvent[] {
  const events: VibeCoderEvent[] = [];

  if (event.type === "chunk" && event.payload.stream === "stderr") {
    events.push({ type: "terminal_output", command: "cline", output: event.payload.chunk });
    return events;
  }

  if (event.type === "status") {
    events.push({ type: "status_update", message: event.payload.status });
    return events;
  }

  if (event.type !== "agent_event") return events;

  const agentEvent = event.payload.event;
  if (!agentEvent) return events;

  return mapAgentEvent(agentEvent, workspacePath);
}

function relativizePath(filePath: string, workspacePath: string): string {
  return filePath.replace(workspacePath, "").replace(/^[/\\]/, "");
}

export function reportMissingTools(available: string[]): string[] {
  const expected = [
    "read_file", "search_files", "list_directory", "create_file", "edit_file",
    "apply_diff", "run_command", "web_fetch",
  ];
  const lower = available.map((t) => t.toLowerCase());
  return expected.filter((tool) => !lower.some((a) => a.includes(tool.replace(/_/g, ""))));
}
