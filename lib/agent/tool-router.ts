import { promises as fs } from "node:fs";
import * as path from "node:path";

export type CheckpointRecord = {
  id: string;
  label: string;
  createdAt: string;
  files: string[];
};

export class CheckpointManager {
  constructor(private checkpointsRoot: string) {}

  async ensure() {
    await fs.mkdir(this.checkpointsRoot, { recursive: true });
  }

  async create(id: string, label: string, workspacePath: string): Promise<CheckpointRecord> {
    await this.ensure();
    const files = await this.listWorkspaceFiles(workspacePath);
    const record: CheckpointRecord = {
      id,
      label,
      createdAt: new Date().toISOString(),
      files,
    };
    await fs.writeFile(
      path.join(this.checkpointsRoot, `${id}.json`),
      `${JSON.stringify(record, null, 2)}\n`,
      "utf8",
    );
    return record;
  }

  private async listWorkspaceFiles(workspacePath: string): Promise<string[]> {
    const results: string[] = [];
    const walk = async (dir: string) => {
      let entries;
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (["node_modules", ".git", "dist"].includes(entry.name)) continue;
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(absolute);
        } else {
          results.push(path.relative(workspacePath, absolute).replace(/\\/g, "/"));
        }
      }
    };
    await walk(workspacePath);
    return results.sort();
  }
}

export type ApprovalDecision = "auto" | "require" | "deny";

export class ToolRouter {
  autoApproveReads = true;

  classifyCommand(command: string): ApprovalDecision {
    const lower = command.toLowerCase().trim();
    if (/\b(rm\s+-rf|git\s+reset|git\s+clean|drop\s+database|mkfs|dd\s+)/.test(lower)) return "deny";
    if (/\b(rm\b|delete\b|sudo\b|chmod\s+777|curl\s+.*\|\s*sh)/.test(lower)) return "require";
    if (/\b(npm|pnpm|yarn|bun)\s+(run\s+)?(build|lint|test|typecheck|dev|preview|install)\b/.test(lower)) return "auto";
    if (/^(ls|pwd|cat|head|tail|find|grep|rg|node\s+-v|npm\s+-v)\b/.test(lower)) return "auto";
    return "require";
  }

  classifyTool(toolName: string): ApprovalDecision {
    const lower = toolName.toLowerCase();
    if (this.autoApproveReads && (lower.includes("read") || lower.includes("search") || lower.includes("list"))) {
      return "auto";
    }
    if (lower.includes("write") || lower.includes("edit") || lower.includes("bash") || lower.includes("command")) {
      return "auto"; // yolo mode for vibe coder workspace
    }
    return "auto";
  }
}
