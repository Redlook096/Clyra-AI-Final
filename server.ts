import dotenv from "dotenv";
import express from "express";
import path from "path";
import { startVibeServer } from "./vibe-server";

const _envRoot = process.cwd();
dotenv.config({ path: path.join(_envRoot, ".env") });
dotenv.config({ path: path.join(_envRoot, ".env.local"), override: true });
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { existsSync } from "node:fs";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const VIBE_PORT = Number(process.env.VIBE_PORT) || 5174;

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const handleClyraChat = async (
    req: express.Request,
    res: express.Response,
  ) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error:
          "Clyra API is not configured. Add DEEPSEEK_API_KEY to .env or .env.local (server reads this file on startup).",
      });
      return;
    }
    try {
      const upstream = await fetch(
        "https://api.deepseek.com/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(req.body),
        },
      );

      const contentType = upstream.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      res.status(upstream.status);

      if (!upstream.ok) {
        res.send(await upstream.text());
        return;
      }

      if (!upstream.body) {
        res.end();
        return;
      }

      Readable.fromWeb(
        upstream.body as import("stream/web").ReadableStream,
      ).pipe(res);
    } catch (err) {
      console.error("Clyra chat proxy error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: "Failed to reach Clyra chat API" });
      } else {
        res.end();
      }
    }
  };

  app.post("/api/clyra/chat", handleClyraChat);
  app.post("/api/deepseek/chat", handleClyraChat);

  // AI Clipper
  app.post("/api/clipper/start", async (req, res) => {
    const { url, config: cfg } = req.body || {};
    if (!url) { res.status(400).json({ error: "YouTube URL required" }); return; }
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    const send = (type, data) => { res.write(`data: ${JSON.stringify({ type, ...data })}

`); };
    const scriptPath = path.join(process.cwd(), "clipper-pipeline.py");
    const homeBin = path.join(homedir(), "bin");
    send("progress", { step: "captions", status: "running", message: "Starting..." });
    const proc = spawn("python3", [scriptPath, url, JSON.stringify(cfg || {})], {
      env: { ...process.env, PYTHONUNBUFFERED: "1", PATH: `${process.env.PATH || ""}:${homeBin}` },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let buf = "";
    proc.stdout.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split("\n"); buf = lines.pop() || "";
      for (const line of lines) {
        const t = line.trim(); if (!t) continue;
        try { const d = JSON.parse(t); send(d.type || "progress", d); }
        catch { send("log", { message: t }); }
      }
    });
    proc.stderr.on("data", (chunk) => { send("log", { message: chunk.toString().trim() }); });
    proc.on("close", (code) => {
      if (code !== 0) send("error", { message: `Pipeline failed code ${code}` });
      res.end();
    });
    proc.on("error", (err) => { send("error", { message: err.message }); res.end(); });
  });
  app.use("/output", express.static(path.join(process.cwd(), "output"), {
    setHeaders: (res) => { res.setHeader("Content-Type", "video/mp4"); res.setHeader("Accept-Ranges", "bytes"); },
    fallthrough: false
  }));

  app.get("/api/clipper/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename || "");
    if (!/^[\w.-]+\.mp4$/i.test(filename)) {
      res.status(400).json({ error: "Invalid clip filename" });
      return;
    }

    const filePath = path.join(process.cwd(), "output", filename);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "Clip not found" });
      return;
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.sendFile(filePath);
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const hmrPort = Number(process.env.HMR_PORT) || 24678;
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          host: "localhost",
          port: hmrPort,
          clientPort: hmrPort,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  if (process.env.DISABLE_VIBE_SERVER !== "true") {
    startVibeServer(VIBE_PORT).catch((error) => {
      console.error("Failed to start Vibe sandbox server:", error);
    });
  }
}

startServer();
