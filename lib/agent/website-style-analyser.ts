import type { AnalyseWebsiteStyleTool } from "./research-tools";
import { fetchUrl } from "./research-tools";

const COLOUR_PATTERN = /#(?:[0-9a-fA-F]{3}){1,2}\b|rgb\([^)]+\)|hsl\([^)]+\)/g;

function extractColours(html: string): string[] {
  const found = html.match(COLOUR_PATTERN) || [];
  const normalized = found.map((c) => c.toLowerCase());
  return Array.from(new Set(normalized)).slice(0, 12);
}

function inferTypography(html: string): string {
  const fonts = Array.from(html.matchAll(/font-family:\s*([^;}"']+)/gi)).map((m) => m[1].trim());
  if (fonts.length) return fonts.slice(0, 3).join(", ");
  const googleFont = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"'&]+)/i)?.[1];
  if (googleFont) return decodeURIComponent(googleFont.replace(/\+/g, " "));
  return "Modern sans-serif with clear hierarchy";
}

export async function analyseWebsiteStyle(
  input: AnalyseWebsiteStyleTool["input"],
): Promise<AnalyseWebsiteStyleTool["output"]> {
  const fetched = await fetchUrl(input.url);
  const html = fetched.text || "";

  const colours = extractColours(html);
  const hasGrid = /display:\s*grid|grid-template/i.test(html);
  const hasFlex = /display:\s*flex/i.test(html);
  const hasHero = /<h1|hero|banner/i.test(html);
  const hasCards = /card|rounded|shadow/i.test(html);

  return {
    colours: colours.length ? colours : ["#0f172a", "#ffffff", "#3b82f6", "#f8fafc"],
    typography: inferTypography(html),
    layoutPatterns: [
      hasGrid ? "CSS grid sections" : "Stacked sections",
      hasFlex ? "Flex navigation and rows" : "Block layout",
      hasHero ? "Large hero with headline + CTA" : "Content-first opening",
    ],
    spacing: /gap:\s*\d|padding:\s*\d|space-y/i.test(html) ? "Generous section spacing with consistent gaps" : "Comfortable vertical rhythm",
    navigationStyle: /<nav|navbar|header/i.test(html) ? "Top navigation with primary links" : "Minimal top bar",
    heroStyle: hasHero ? "Bold headline, supporting copy, primary CTA" : "Direct value proposition block",
    buttonStyle: /rounded-(full|lg|xl)|border-radius/i.test(html) ? "Rounded buttons with clear hover states" : "Solid primary buttons",
    cardStyle: hasCards ? "Elevated cards with border/shadow" : "Flat content blocks with separators",
    animationStyle: /transition|animate|motion|@keyframes/i.test(html) ? "Subtle transitions and hover motion" : "Lightweight CSS transitions",
    overallTheme: fetched.blocked
      ? "Style could not be fully extracted — use inspired, original design direction"
      : "Clean modern product marketing with strong hierarchy and accessible contrast",
  };
}
