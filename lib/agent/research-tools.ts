import { promises as fs } from "node:fs";
import * as path from "node:path";

export type WebSearchTool = {
  name: "web_search";
  input: { query: string; maxResults?: number };
};

export type FetchUrlTool = {
  name: "fetch_url";
  input: { url: string };
};

export type ScreenshotPageTool = {
  name: "screenshot_page";
  input: { url: string; viewport?: "desktop" | "tablet" | "mobile" };
};

export type AnalyseWebsiteStyleTool = {
  name: "analyse_website_style";
  input: { url: string; screenshots?: string[] };
  output: {
    colours: string[];
    typography: string;
    layoutPatterns: string[];
    spacing: string;
    navigationStyle: string;
    heroStyle: string;
    buttonStyle: string;
    cardStyle: string;
    animationStyle: string;
    overallTheme: string;
  };
};

export type SaveResearchTool = {
  name: "save_research_context";
  input: {
    sources: string[];
    facts: string;
    designNotes: string;
    safetyNotes?: string;
  };
};

export type ResearchContext = {
  sources: string[];
  facts: string;
  designNotes: string;
  safetyNotes: string;
  savedAt: string;
};

function extractUrlsFromDuckDuckGoHtml(html: string, max = 6) {
  const urls: string[] = [];
  const seen = new Set<string>();
  const linkMatches = Array.from(html.matchAll(/href="\/l\/\?uddg=([^"&]+)[^"]*"/gi));
  for (const match of linkMatches) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (!decoded.startsWith("http")) continue;
      const url = decoded.split("#")[0];
      const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
      if (!host || seen.has(host)) continue;
      seen.add(host);
      urls.push(url);
    } catch {
      // ignore
    }
    if (urls.length >= max) break;
  }
  return urls;
}

export async function webSearch(query: string, maxResults = 6): Promise<string[]> {
  const encoded = encodeURIComponent(query);
  const ddgUrl = `https://r.jina.ai/http://https://duckduckgo.com/html/?q=${encoded}`;
  const response = await fetch(ddgUrl, {
    headers: { "user-agent": "Clyra-VibeCoder/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  const html = await response.text();
  return extractUrlsFromDuckDuckGoHtml(html, maxResults);
}

export async function fetchUrl(url: string): Promise<{ url: string; text: string; blocked: boolean }> {
  const attempts = [url, `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`];
  for (const attempt of attempts) {
    try {
      const response = await fetch(attempt, {
        headers: { "user-agent": "Clyra-VibeCoder/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      const text = await response.text();
      const blocked = /enable javascript|access denied|just a moment|captcha/i.test(text.slice(0, 1200));
      if ((response.ok || attempt.includes("r.jina.ai")) && text.trim() && !blocked) {
        return { url, text, blocked: false };
      }
    } catch {
      // try next
    }
  }
  return { url, text: "", blocked: true };
}

export async function saveResearchContext(
  agentRoot: string,
  input: SaveResearchTool["input"],
): Promise<ResearchContext> {
  const context: ResearchContext = {
    sources: input.sources,
    facts: input.facts,
    designNotes: input.designNotes,
    safetyNotes: input.safetyNotes || "Do not copy logos, exact text, images, or protected assets. Capture style direction only.",
    savedAt: new Date().toISOString(),
  };
  await fs.mkdir(agentRoot, { recursive: true });
  await fs.writeFile(path.join(agentRoot, "research-context.json"), `${JSON.stringify(context, null, 2)}\n`, "utf8");
  return context;
}

export function inferBrandResearchNeeded(prompt: string): boolean {
  return /\b(openai|apple|google|stripe|notion|linear|netflix|tesla|microsoft|amazon|shopify|figma|airbnb|uber|spotify)\b/i.test(prompt) ||
    /\b(landing page|homepage|website|recreate|clone|inspired by|like)\b/i.test(prompt) &&
      /\b(for|of)\s+[A-Z][A-Za-z0-9&.\-\s]{2,30}/.test(prompt);
}

export async function runBrandResearch(
  prompt: string,
  agentRoot: string,
  onStatus?: (message: string) => void,
): Promise<ResearchContext | null> {
  if (!inferBrandResearchNeeded(prompt)) return null;

  const brandMatch = prompt.match(/\b(?:for|of|like|inspired by)\s+([A-Za-z][A-Za-z0-9&.\-\s]{1,40})/i);
  const brand = brandMatch?.[1]?.replace(/\b(with|and|page|website)\b.*$/i, "").trim() || "target brand";
  onStatus?.(`Searching web context for ${brand}…`);

  const sources: string[] = [];
  const notes: string[] = [];

  try {
    const results = await webSearch(`${brand} official site product`, 6);
    for (const url of results.slice(0, 4)) {
      onStatus?.(`Fetching ${url}…`);
      const fetched = await fetchUrl(url);
      if (!fetched.blocked && fetched.text) {
        sources.push(url);
        const title = fetched.text.match(/^Title:\s*(.+)$/im)?.[1]?.trim();
        const desc = fetched.text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim();
        if (title) notes.push(`Title: ${title}`);
        if (desc) notes.push(`Description: ${desc}`);
      }
    }
  } catch (error) {
    notes.push(`Research error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return saveResearchContext(agentRoot, {
    sources,
    facts: notes.join("\n") || `Limited public research for ${brand}.`,
    designNotes: "Capture colour mood, typography direction, layout rhythm, spacing, navigation, buttons, cards, and animation feel only.",
    safetyNotes: "Build an original brand-inspired concept. Do not copy logos, exact text, images, CSS, or impersonation flows.",
  });
}
