import { ClineAdapter, startClineTask } from "./cline-adapter";
import { VibeCoderEvent } from "./cline-events";
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import { promises as fs } from "node:fs";

const activeTasks = new Map<string, {
  adapter: ClineAdapter;
  events: VibeCoderEvent[];
  listeners: ((event: VibeCoderEvent) => void)[];
  approvePlan?: () => void;
}>();

function slugifyProjectName(input: string) {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 52);
  return cleaned || "clyra-vibe-project";
}

function safeProjectId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function registerClineRoutes(app: import("express").Application) {
  app.post("/api/vibe/start", async (req, res) => {
    const { prompt, projectId, planMode, workspacePath } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const taskId = randomUUID();
    const taskData = {
      adapter: new ClineAdapter(),
      events: [],
      listeners: [] as ((event: VibeCoderEvent) => void)[]
    };
    activeTasks.set(taskId, taskData);

    const apiKey = process.env.MY_LLM_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
    const provider = process.env.MY_LLM_BASE_URL
      ? "openai-compatible"
      : process.env.DEEPSEEK_API_KEY
        ? "deepseek"
        : process.env.ANTHROPIC_API_KEY
          ? "anthropic"
          : "cline";
    const model = process.env.MY_LLM_MODEL || (process.env.DEEPSEEK_API_KEY ? "deepseek-coder" : process.env.ANTHROPIC_API_KEY ? "claude-3-5-sonnet-20241022" : "default");

    taskData.adapter.on("event", (event: VibeCoderEvent) => {
      taskData.events.push(event);
      taskData.listeners.forEach(listener => listener(event));
    });

    const requestedProjectId = typeof projectId === "string" ? projectId : "";
    const shouldCreateFreshProject = !requestedProjectId || requestedProjectId === "project-advanced-vibe";
    const actualProjectId = shouldCreateFreshProject
      ? `${slugifyProjectName(prompt)}-${randomUUID().slice(0, 6)}`
      : safeProjectId(requestedProjectId);
    const resolvedWorkspacePath = path.resolve(
      workspacePath || path.join(process.cwd(), "projects", safeProjectId(actualProjectId), "files"),
    );

    // Ensure the directory exists before passing to cline
    await fs.mkdir(resolvedWorkspacePath, { recursive: true }).catch(console.error);

    taskData.adapter.startClineTask({
      projectId: actualProjectId,
      prompt,
      planMode: !!planMode,
      workspacePath: resolvedWorkspacePath,
      provider,
      model,
      apiKey,
    });

    res.json({ taskId, projectId: actualProjectId });
  });

  app.get("/api/vibe/events/:taskId", (req, res) => {
    const { taskId } = req.params;
    const taskData = activeTasks.get(taskId);

    if (!taskData) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send buffered events
    for (const event of taskData.events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const listener = (event: VibeCoderEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (event.type === "complete" || event.type === "error") {
        res.end();
        activeTasks.delete(taskId);
      }
    };

    taskData.listeners.push(listener);

    req.on("close", () => {
      taskData.listeners = taskData.listeners.filter(l => l !== listener);
    });
  });

  app.post("/api/vibe/cancel/:taskId", (req, res) => {
    const { taskId } = req.params;
    const taskData = activeTasks.get(taskId);
    if (taskData) {
      taskData.adapter.cancel();
      activeTasks.delete(taskId);
    }
    res.json({ success: true });
  });

  app.post("/api/vibe/approve/:taskId", (req, res) => {
    const { taskId } = req.params;
    const taskData = activeTasks.get(taskId);
    if (!taskData) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (taskData.approvePlan) {
      taskData.approvePlan();
      res.json({ success: true, resumed: true });
      return;
    }
    taskData.adapter.approvePlan();
    res.json({ success: true, resumed: true });
  });
}
