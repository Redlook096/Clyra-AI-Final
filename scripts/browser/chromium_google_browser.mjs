import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requestedUrl = process.argv[2] || "https://www.google.com";

let url = requestedUrl;
try {
  const parsed = new URL(requestedUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    url = "https://www.google.com";
  }
} catch {
  url = `https://www.google.com/search?q=${encodeURIComponent(requestedUrl)}`;
}

const userDataDir = path.join(__dirname, "..", ".chromium-google-profile");
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: null,
  args: ["--start-maximized"],
});

const page = context.pages()[0] || (await context.newPage());
await page.goto(url, { waitUntil: "domcontentloaded" }).catch(() => {});

context.on("close", () => {
  process.exit(0);
});
