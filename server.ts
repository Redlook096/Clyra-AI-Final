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

  // ===== AI Clipper API =====

  app.post("/api/clipper/configure", (req, res) => {
    // Store subtitle config in memory (or just acknowledge)
    const defaults = {
      font_size: 52,
      font: "Impact",
      text_colour: "#FFFFFF",
      stroke_colour: "#000000",
      position: "bottom-centre",
    };
    const cfg = { ...defaults, ...(req.body || {}) };
    res.json({ success: true, config: cfg });
  });

  app.post("/api/clipper/start", async (req, res) => {
    const { url, config: cfg } = req.body || {};
    if (!url) {
      res.status(400).json({ error: "YouTube URL is required" });
      return;
    }

    // SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const send = (type: string, data: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    };

    const scriptPath = path.join(process.cwd(), "clipper-pipeline.py");

    try {
      // Step 1: Download
      send("progress", {
        step: "download",
        status: "running",
        message: "Downloading video...",
      });

      const { execSync } = await import("node:child_process");

      // Check if ffmpeg exists (also check ~/bin)
      const homeBin = path.join(homedir(), "bin");
      const ffmpegPath = path.join(homeBin, "ffmpeg");
      let ffmpegOk = false;
      try {
        execSync(`"${ffmpegPath}" -version`, { stdio: "pipe" });
        ffmpegOk = true;
      } catch {
        try {
          execSync("which ffmpeg", {
            stdio: "pipe",
            env: {
              ...process.env,
              PATH: `${process.env.PATH || ""}:${homeBin}`,
            },
          });
          ffmpegOk = true;
        } catch {
          // ffmpeg not found
        }
      }
      if (!ffmpegOk) {
        send("error", {
          step: "download",
          message:
            "ffmpeg is not installed. Install it with: brew install ffmpeg",
        });
        res.end();
        return;
      }

      // Run the Python pipeline script
      const proc = spawn("python3", [scriptPath, url, JSON.stringify(cfg)], {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
          PATH: `${process.env.PATH || ""}:${homeBin}`,
        },
        stdio: ["pipe", "pipe", "pipe"],
      });

      let buffer = "";
      proc.stdout.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const data = JSON.parse(trimmed);
            send(data.type || "progress", data);
          } catch {
            send("log", { message: trimmed });
          }
        }
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        send("log", { message: chunk.toString().trim() });
      });

      proc.on("close", (code: number | null) => {
        if (code !== 0) {
          send("error", { message: `Pipeline failed with code ${code}` });
        }
        res.end();
      });

      proc.on("error", (err: Error) => {
        send("error", { message: err.message });
        res.end();
      });
    } catch (err) {
      send("error", {
        message: err instanceof Error ? err.message : String(err),
      });
      res.end();
    }
  });

  // Serve output files BEFORE Vite (so they are not caught by SPA fallback)
  app.use(
    "/output",
    express.static(path.join(process.cwd(), "output"), {
      setHeaders: (res) => {
        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
      },
      fallthrough: false,
    }),
  );

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
