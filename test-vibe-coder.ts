import { chromium, type Browser, type Page } from "playwright";

const BASE = "http://localhost:3000";

async function collectConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

async function testVibeCoderUI(page: Page) {
  console.log("1. Loading homepage...");
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('text="Hi there, I\'m Clyra"', { timeout: 30000 });
  console.log("   Homepage OK");

  console.log("2. Switching to Vibe Coder tab...");
  const vibeTab = page.locator(".clyra-workflow-tab", { hasText: "Vibe Coder" });
  await vibeTab.waitFor({ state: "visible", timeout: 30000 });
  await vibeTab.click();

  await page.waitForSelector('text="What should we build?"', { timeout: 30000 });
  console.log("   Vibe welcome screen OK");

  console.log("3. Checking composer and mode controls...");
  const vibeInput = page.locator('textarea[placeholder="Tell the coding agent what to build..."]');
  await vibeInput.waitFor({ state: "visible", timeout: 30000 });
  await vibeInput.click();
  await page.waitForTimeout(400);

  const planMode = page.locator("button", { hasText: /Plan/i }).first();
  const fastMode = page.locator("button", { hasText: /Fast/i }).first();
  if ((await planMode.count()) > 0 && (await fastMode.count()) > 0) {
    await fastMode.click();
    await page.waitForTimeout(200);
    await planMode.click();
    console.log("   Mode toggle OK");
  }

  console.log("4. Checking recent projects panel...");
  const recentBtn = page.locator("button", { hasText: /Recent projects|View projects|projects/i }).first();
  if ((await recentBtn.count()) > 0) {
    await recentBtn.click();
    await page.waitForTimeout(600);
    const backBtn = page.locator("button", { hasText: /Back|Home/i }).first();
    if ((await backBtn.count()) > 0) {
      await backBtn.click();
      console.log("   Projects panel navigation OK");
    }
  } else {
    console.log("   Projects entry not found (non-blocking)");
  }

  console.log("5. Tab round-trip...");
  const chatTab = page.locator(".clyra-workflow-tab", { hasText: "Chat" });
  await chatTab.click();
  await page.waitForSelector('text="Hi there, I\'m Clyra"', { timeout: 30000 });
  await vibeTab.click();
  await page.waitForSelector('text="What should we build?"', { timeout: 30000 });
  console.log("   Tab round-trip OK");

  await page.screenshot({ path: "qa-screenshots/vibe-coder-welcome.png", fullPage: true });
}

async function testVibeCoderAPI() {
  console.log("6. Testing vibe API endpoints...");

  const projectsRes = await fetch(`${BASE}/api/vibe/projects`);
  if (!projectsRes.ok) throw new Error(`projects list failed: ${projectsRes.status}`);
  const projectsData = await projectsRes.json() as { projects?: unknown[] };
  console.log(`   Projects API OK (${projectsData.projects?.length ?? 0} projects)`);

  const startRes = await fetch(`${BASE}/api/vibe/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "Build a tiny counter app with + and - buttons", planMode: false }),
  });
  if (!startRes.ok) throw new Error(`start task failed: ${startRes.status}`);
  const { taskId, projectId } = await startRes.json() as { taskId: string; projectId: string };
  if (!taskId || !projectId) throw new Error("start response missing taskId/projectId");
  console.log(`   Start task OK (task=${taskId.slice(0, 8)}…)`);

  const streamedEvents: Array<{ type: string; message?: string; recoverable?: boolean }> = [];
  const deadline = Date.now() + 120_000;

  await new Promise<void>((resolve, reject) => {
  void (async () => {
    try {
      const res = await fetch(`${BASE}/api/vibe/events/${taskId}`);
      if (!res.ok || !res.body) throw new Error(`events stream failed: ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (Date.now() < deadline) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const match = chunk.match(/data: (.+)/);
          if (!match) continue;
          const ev = JSON.parse(match[1]) as { type: string; message?: string; recoverable?: boolean };
          streamedEvents.push(ev);
          if (ev.type === "complete") {
            resolve();
            return;
          }
          if (ev.type === "error" && !ev.recoverable) {
            reject(new Error(ev.message || "Task failed"));
            return;
          }
        }
      }
      reject(new Error(`SSE timed out after 120s (events=${streamedEvents.length})`));
    } catch (error) {
      reject(error);
    }
  })();
  });

  console.log(`   SSE stream OK (${streamedEvents.length} events, completed)`);

  const projectRes = await fetch(`${BASE}/api/vibe/projects/${encodeURIComponent(projectId)}`);
  if (!projectRes.ok) throw new Error(`project fetch failed: ${projectRes.status}`);
  const projectData = await projectRes.json() as { files?: Array<{ path: string }> };
  const fileCount = projectData.files?.length ?? 0;
  if (fileCount === 0) throw new Error("Project has no generated files");
  console.log(`   Project files OK (${fileCount} files)`);
}

async function main() {
  const browser: Browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = await collectConsoleErrors(page);

  try {
    await testVibeCoderUI(page);
    await browser.close();

    await testVibeCoderAPI();

    const criticalErrors = consoleErrors.filter(
      (e) => !/favicon|404|Failed to load resource|net::ERR/.test(e),
    );
    if (criticalErrors.length > 0) {
      console.log("\nConsole errors:");
      criticalErrors.slice(0, 8).forEach((e) => console.log(`  - ${e}`));
    }

    console.log("\nAll Vibe Coder tests passed.");
  } catch (error) {
    console.error("\nTest failed:", error);
    await page.screenshot({ path: "qa-screenshots/vibe-coder-failure.png", fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(1);
  }
}

main();
