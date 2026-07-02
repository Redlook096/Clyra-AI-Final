import { chromium } from "playwright";
import { mkdir, rename } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.APP_URL || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "qa-screenshots");
const PROMPT = "Build a polished counter app with + and - buttons and a live display";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function selectFastMode(page: import("playwright").Page) {
  const modeButton = page.locator("button", { hasText: /Plan Mode|Fast Mode/ }).first();
  await modeButton.waitFor({ state: "visible", timeout: 15000 });
  const label = await modeButton.textContent();
  if (label?.includes("Fast")) return;

  await modeButton.click();
  await sleep(300);
  await page.locator("button", { hasText: "Fast Mode" }).click();
  await sleep(400);
}

async function recordVibeCoder() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: OUT_DIR,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();

  try {
    console.log("Recording Vibe Coder session…");

    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('text="Hi there, I\'m Clyra"', { timeout: 45000 }).catch(() => {});
    await sleep(1500);

    await page.locator(".clyra-workflow-tab", { hasText: "Vibe Coder" }).click();
    await page.waitForSelector('text="What should we build?"', { timeout: 30000 });
    await sleep(1000);

    await selectFastMode(page);

    const composer = page.locator('textarea[placeholder="Tell the coding agent what to build..."]').first();
    await composer.click();
    await composer.fill(PROMPT);
    await sleep(800);

    await page.locator('button[aria-label="Send Vibe request"]').click();
    await sleep(1500);

    const approve = page.locator("button", { hasText: /Approve and Build/i }).first();
    const approveVisible = await approve.isVisible().catch(() => false);
    if (approveVisible) {
      await sleep(2000);
      await approve.click();
      await sleep(1200);
    }

    const deadline = Date.now() + 75_000;
    let sawCode = false;
    let sawComplete = false;

    while (Date.now() < deadline) {
      sawComplete = await page
        .locator("text=/Build complete|Preview ready|Complete|files saved/i")
        .first()
        .isVisible()
        .catch(() => false);

      const fileCount = await page.locator("text=/package\\.json|App\\.tsx|Creating|Coding|Generating/i").count();
      if (fileCount > 0) sawCode = true;

      if (sawComplete && sawCode) break;
      if (sawComplete) {
        await sleep(2000);
        break;
      }
      await sleep(1200);
    }

    await sleep(4000);

    const hasPreview = await page.locator("iframe").first().isVisible().catch(() => false);
    if (hasPreview) await sleep(3000);

    await page.mouse.wheel(0, 400);
    await sleep(1500);

    console.log(`Captured build flow (code=${sawCode}, complete=${sawComplete}, preview=${hasPreview}).`);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (!video) throw new Error("No video was recorded");

    const webmPath = await video.path();
    const webmOut = path.join(OUT_DIR, "vibe-coder-demo.webm");
    await rename(webmPath, webmOut);
    console.log(`Saved: ${webmOut}`);
  }
}

recordVibeCoder().catch((error) => {
  console.error(error);
  process.exit(1);
});
