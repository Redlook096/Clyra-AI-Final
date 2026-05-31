import dotenv from "dotenv";
import express from "express";
import path from "path";
import { startVibeServer } from "./vibe-server";

const _envRoot = process.cwd();
dotenv.config({ path: path.join(_envRoot, ".env") });
dotenv.config({ path: path.join(_envRoot, ".env.local"), override: true });
import { Readable } from "node:stream";
import { spawn, spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { existsSync } from "node:fs";
import { chromium, type BrowserContext, type Page } from "playwright";

let agenticContext: BrowserContext | null = null;
let agenticPage: Page | null = null;

function normalizeBrowserTarget(raw: unknown) {
  const input = String(raw || "").trim();
  if (!input) return "https://www.google.com";

  try {
    const url = new URL(input.includes("://") ? input : `https://${input}`);
    if (url.hostname.includes(".") && ["http:", "https:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    // Fall through to a Google search URL.
  }

  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
}

function isLikelyBrowserUrl(raw: string) {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.hostname.includes(".") && ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

async function getAgenticPage() {
  if (!agenticContext) {
    agenticContext = await chromium.launchPersistentContext(
      path.join(_envRoot, ".agentic-browser-profile"),
      {
        headless: true,
        viewport: { width: 1280, height: 820 },
        deviceScaleFactor: 2,
        locale: "en-AU",
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-search-engine-choice-screen",
          "--no-first-run",
          "--no-default-browser-check",
        ],
      },
    );
    await agenticContext.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });
  }

  agenticPage = agenticPage ?? agenticContext.pages()[0] ?? (await agenticContext.newPage());
  return agenticPage;
}

async function captureAgenticState(page: Page, action: string) {
  const screenshot = await page.screenshot({ type: "png", fullPage: false });
  return {
    action,
    url: page.url(),
    title: await page.title().catch(() => "Google"),
    screenshot: `data:image/png;base64,${screenshot.toString("base64")}`,
  };
}

async function runGoogleSearch(page: Page, query: string) {
  await page.goto("https://www.google.com", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

  const searchBox = page.locator('textarea[name="q"], input[name="q"]').first();
  await searchBox.click({ timeout: 8000 });
  await searchBox.fill(query, { timeout: 8000 });
  for (let press = 0; press < 3; press += 1) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(220);
  }
}

async function performAgenticInstruction(page: Page, rawInstruction: unknown) {
  const instruction = String(rawInstruction || "").trim();
  const lower = instruction.toLowerCase();
  if (!instruction) return "ready";

  if (/\b(back|go back|previous)\b/.test(lower)) {
    await page.goBack({ waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
    return "went back";
  }

  if (/\b(forward|go forward|next)\b/.test(lower)) {
    await page.goForward({ waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
    return "went forward";
  }

  if (/\b(reload|refresh)\b/.test(lower)) {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    return "reloaded";
  }

  if (/\b(scroll down|move down|page down)\b/.test(lower)) {
    await page.mouse.wheel(0, 720);
    return "scrolled down";
  }

  if (/\b(scroll up|move up|page up)\b/.test(lower)) {
    await page.mouse.wheel(0, -720);
    return "scrolled up";
  }

  if (/\b(open|click)\b.*\b(first|top)\b.*\b(result|link)\b/.test(lower)) {
    const clicked = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
      const candidate = anchors.find((anchor) => {
        const href = anchor.href || "";
        const text = (anchor.innerText || anchor.textContent || "").trim();
        return (
          /^https?:\/\//.test(href) &&
          text.length > 6 &&
          !href.includes("google.") &&
          !href.includes("/search?") &&
          !href.includes("webcache")
        );
      });
      candidate?.click();
      return Boolean(candidate);
    });
    if (clicked) return "opened first result";
  }

  const cleanedSearch = instruction
    .replace(/^(please\s+)?(search|google|find|look up|browse for|go search for)\s+/i, "")
    .trim();

  if (isLikelyBrowserUrl(cleanedSearch || instruction)) {
    await page.goto(normalizeBrowserTarget(cleanedSearch || instruction), {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
  } else {
    await runGoogleSearch(page, cleanedSearch || instruction);
  }
  return "searched";
}

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

  app.get("/api/browser/search", async (req, res) => {
    const query = String(req.query.q || "").trim();
    if (!query) {
      res.status(400).json({ error: "Search query required" });
      return;
    }

    res.json({
      query,
      provider: "Google",
      mode: "chromium",
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      results: [],
    });
  });

  app.post("/api/browser/chromium-google", (req, res) => {
    const rawUrl = String(req.body?.url || "https://www.google.com").trim();
    const scriptPath = path.join(_envRoot, "scripts", "chromium_google_browser.mjs");
    if (!existsSync(scriptPath)) {
      res.status(500).json({ error: "Chromium Google launcher is missing." });
      return;
    }

    const child = spawn(process.execPath, [scriptPath, rawUrl], {
      cwd: _envRoot,
      detached: true,
      stdio: "ignore",
      env: process.env,
    });
    child.unref();
    res.json({ status: "started", url: rawUrl });
  });

  app.post("/api/browser/native-google", (_req, res) => {
    const scriptPath = path.join(_envRoot, "scripts", "inbuilt_google_browser.py");
    if (!existsSync(scriptPath)) {
      res.status(500).json({ error: "Native Google browser launcher is missing." });
      return;
    }

    const check = spawnSync("python3", [scriptPath, "--check"], {
      cwd: _envRoot,
      encoding: "utf8",
      timeout: 5000,
    });

    if (check.status !== 0) {
      const details = (check.stderr || check.stdout || "").trim();
      res.status(503).json({
        error: details || "PyQt6 with QtWebEngine is not installed. Install PyQt6 and PyQt6-WebEngine to launch the native Google browser.",
      });
      return;
    }

    const child = spawn("python3", [scriptPath], {
      cwd: _envRoot,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    res.json({ status: "started" });
  });

  app.post("/api/agentic-browser/navigate", async (req, res) => {
    try {
      const page = await getAgenticPage();
      const url = normalizeBrowserTarget(req.body?.query || req.body?.url);
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
      res.json(await captureAgenticState(page, "navigated"));
    } catch (error) {
      const page = agenticPage;
      const message = error instanceof Error ? error.message : String(error);
      if (page && message.includes("ERR_ABORTED")) {
        await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
        res.json(await captureAgenticState(page, "navigation interrupted"));
        return;
      }
      console.error("Agentic browser navigate failed:", error);
      res.status(500).json({ error: "Agentic browser could not navigate." });
    }
  });

  app.post("/api/agentic-browser/reload", async (_req, res) => {
    try {
      const page = await getAgenticPage();
      await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
      res.json(await captureAgenticState(page, "reloaded"));
    } catch (error) {
      console.error("Agentic browser reload failed:", error);
      res.status(500).json({ error: "Agentic browser could not reload." });
    }
  });

  app.post("/api/agentic-browser/back", async (_req, res) => {
    try {
      const page = await getAgenticPage();
      await page.goBack({ waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
      await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
      res.json(await captureAgenticState(page, "back"));
    } catch (error) {
      console.error("Agentic browser back failed:", error);
      res.status(500).json({ error: "Agentic browser could not go back." });
    }
  });

  app.post("/api/agentic-browser/forward", async (_req, res) => {
    try {
      const page = await getAgenticPage();
      await page.goForward({ waitUntil: "domcontentloaded", timeout: 12000 }).catch(() => null);
      await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
      res.json(await captureAgenticState(page, "forward"));
    } catch (error) {
      console.error("Agentic browser forward failed:", error);
      res.status(500).json({ error: "Agentic browser could not go forward." });
    }
  });

  app.post("/api/agentic-browser/click", async (req, res) => {
    try {
      const page = await getAgenticPage();
      const x = Number(req.body?.x);
      const y = Number(req.body?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        res.status(400).json({ error: "Click coordinates required." });
        return;
      }
      await page.mouse.move(x, y, { steps: 10 });
      await page.mouse.click(x, y);
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      res.json(await captureAgenticState(page, "clicked"));
    } catch (error) {
      console.error("Agentic browser click failed:", error);
      res.status(500).json({ error: "Agentic browser could not click." });
    }
  });

  app.post("/api/agentic-browser/scroll", async (req, res) => {
    try {
      const page = await getAgenticPage();
      const deltaX = Number(req.body?.deltaX || 0);
      const deltaY = Number(req.body?.deltaY || 0);
      if (!Number.isFinite(deltaX) || !Number.isFinite(deltaY)) {
        res.status(400).json({ error: "Scroll delta required." });
        return;
      }
      await page.mouse.wheel(deltaX, deltaY);
      await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
      res.json(await captureAgenticState(page, "scrolled"));
    } catch (error) {
      console.error("Agentic browser scroll failed:", error);
      res.status(500).json({ error: "Agentic browser could not scroll." });
    }
  });

  app.post("/api/agentic-browser/type", async (req, res) => {
    try {
      const page = await getAgenticPage();
      const text = String(req.body?.text || "");
      if (!text) {
        res.status(400).json({ error: "Text required." });
        return;
      }
      await page.keyboard.type(text, { delay: 8 });
      await page.waitForLoadState("domcontentloaded", { timeout: 3000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
      res.json(await captureAgenticState(page, "typed"));
    } catch (error) {
      console.error("Agentic browser type failed:", error);
      res.status(500).json({ error: "Agentic browser could not type." });
    }
  });

  app.post("/api/agentic-browser/key", async (req, res) => {
    try {
      const page = await getAgenticPage();
      const key = String(req.body?.key || "");
      if (!key) {
        res.status(400).json({ error: "Key required." });
        return;
      }
      await page.keyboard.press(key);
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      res.json(await captureAgenticState(page, `pressed ${key}`));
    } catch (error) {
      console.error("Agentic browser key failed:", error);
      res.status(500).json({ error: "Agentic browser could not press that key." });
    }
  });

  app.post("/api/agentic-browser/act", async (req, res) => {
    try {
      const page = await getAgenticPage();
      const action = await performAgenticInstruction(page, req.body?.instruction);
      await page.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      res.json(await captureAgenticState(page, action));
    } catch (error) {
      console.error("Agentic browser act failed:", error);
      res.status(500).json({ error: "Agentic browser could not complete that instruction." });
    }
  });

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
