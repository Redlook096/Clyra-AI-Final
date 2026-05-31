export type VibeParsedSegment =
  | { type: "thinking"; body: string; complete: boolean }
  | { type: "analyze"; path: string; complete: boolean }
  | { type: "code"; file: string; added: number; removed: number; body: string; complete: boolean }
  | { type: "run"; body: string; complete: boolean }
  | { type: "text"; body: string };

const HIDDEN_HARNESS_NAMES =
  /\b(?:open[\s-]?code|opencode|aider|archon)\b/gi;

export function sanitizeVibeAgentContent(raw: string): string {
  return raw.replace(HIDDEN_HARNESS_NAMES, "the coding agent");
}

/**
 * Sandbox AI-supplied paths so they can never accidentally reference real Clyra source files
 * on disk. All paths are forced into a synthetic `vibe-project/` namespace, traversal segments
 * (`..`) are stripped, and absolute / null-byte / weird paths are rejected.
 *
 * The vibe coder runs entirely in-memory so the AI never has filesystem access, but this also
 * keeps UI labels honest — users cannot mistake a generated path for a real project file.
 */
const VIBE_SANDBOX_PREFIX = "vibe-project";

export function sandboxVibePath(rawPath: string): string {
  if (!rawPath) return `${VIBE_SANDBOX_PREFIX}/Untitled.tsx`;
  let p = rawPath.replace(/\\/g, "/").trim();
  p = p.replace(/^[a-zA-Z]+:\/\//, "");
  p = p.replace(/^[/]+/, "");
  p = p.replace(/\u0000/g, "");
  const parts = p.split("/").filter((s) => s && s !== ".");
  const cleaned: string[] = [];
  for (const part of parts) {
    if (part === "..") continue;
    cleaned.push(part);
  }
  if (cleaned.length === 0) return `${VIBE_SANDBOX_PREFIX}/Untitled.tsx`;
  if (cleaned[0] === VIBE_SANDBOX_PREFIX) return cleaned.join("/");
  return [VIBE_SANDBOX_PREFIX, ...cleaned].join("/");
}

const M = {
  thinkS: "<<<VIBE_THINKING>>>",
  thinkE: "<<<END_VIBE_THINKING>>>",
  anaS: /<<<VIBE_ANALYZE path="([^"]*)">>+/,
  anaE: "<<<END_VIBE_ANALYZE>>>",
  codeS:
    /<<<VIBE_CODE\s+file="([^"]*)"\s+added="(\d+)"\s+removed="(\d+)"(?:[ \t"']*>{1,3}[ \t"']*)+/,
  codeE: "<<<END_VIBE_CODE>>>",
  codeBareE: "<<<VIBE_CODE>>>",
  runS: "<<<VIBE_RUN>>>",
  runE: "<<<END_VIBE_RUN>>>",
} as const;

function findCodeBlockEnd(raw: string, start: number): {
  end: number;
  next: number;
  complete: boolean;
} {
  const explicitEnd = raw.indexOf(M.codeE, start);
  const bareEnd = raw.indexOf(M.codeBareE, start);
  const nextMarkers = [
    "<<<VIBE_CODE ",
    "<<<VIBE_THINKING>>>",
    "<<<VIBE_RUN>>>",
    "<<<VIBE_ANALYZE",
  ]
    .map((marker) => raw.indexOf(marker, start))
    .filter((index) => index !== -1);
  const nextMarker = nextMarkers.length > 0 ? Math.min(...nextMarkers) : -1;

  if (
    explicitEnd !== -1 &&
    (nextMarker === -1 || explicitEnd < nextMarker) &&
    (bareEnd === -1 || explicitEnd < bareEnd)
  ) {
    return { end: explicitEnd, next: explicitEnd + M.codeE.length, complete: true };
  }
  if (
    bareEnd !== -1 &&
    (nextMarker === -1 || bareEnd < nextMarker) &&
    (explicitEnd === -1 || bareEnd < explicitEnd)
  ) {
    return { end: bareEnd, next: bareEnd + M.codeBareE.length, complete: true };
  }
  if (nextMarker !== -1) {
    return { end: nextMarker, next: nextMarker, complete: true };
  }
  return { end: raw.length, next: raw.length, complete: false };
}

function cleanCodeBody(body: string): string {
  return body
    .replace(/^\n/, "")
    .replace(/\n$/, "")
    .replace(/\s*<<<VIBE_CODE>>>\s*$/g, "")
    .replace(/\s*<<<END_VIBE_CODE>>>\s*$/g, "");
}

function pushText(segments: VibeParsedSegment[], buf: string) {
  const t = buf.trim();
  if (t) segments.push({ type: "text", body: buf });
}

/**
 * Incrementally parse streamed assistant content into ordered segments.
 * Incomplete trailing segments are still emitted with complete:false and partial body.
 */
export function parseVibeAgentContent(raw: string): VibeParsedSegment[] {
  raw = sanitizeVibeAgentContent(raw);
  const segments: VibeParsedSegment[] = [];
  let i = 0;
  let textBuf = "";

  const flushText = () => {
    if (textBuf) {
      pushText(segments, textBuf);
      textBuf = "";
    }
  };

  while (i < raw.length) {
    if (raw.startsWith(M.thinkS, i)) {
      flushText();
      i += M.thinkS.length;
      const end = raw.indexOf(M.thinkE, i);
      if (end === -1) {
        segments.push({ type: "thinking", body: raw.slice(i), complete: false });
        return segments;
      }
      segments.push({ type: "thinking", body: raw.slice(i, end).trim(), complete: true });
      i = end + M.thinkE.length;
      continue;
    }

    const anaMatch = raw.slice(i).match(M.anaS);
    if (anaMatch && anaMatch.index === 0) {
      flushText();
      const path = sandboxVibePath(anaMatch[1]!);
      i += anaMatch[0]!.length;
      const end = raw.indexOf(M.anaE, i);
      if (end === -1) {
        segments.push({ type: "analyze", path, complete: false });
        return segments;
      }
      segments.push({ type: "analyze", path, complete: true });
      i = end + M.anaE.length;
      continue;
    }

    const codeMatch = raw.slice(i).match(M.codeS);
    if (codeMatch && codeMatch.index === 0) {
      flushText();
      const file = sandboxVibePath(codeMatch[1]!);
      const added = parseInt(codeMatch[2]!, 10) || 0;
      const removed = parseInt(codeMatch[3]!, 10) || 0;
      i += codeMatch[0]!.length;
      const boundary = findCodeBlockEnd(raw, i);
      if (!boundary.complete) {
        segments.push({
          type: "code",
          file,
          added,
          removed,
          body: cleanCodeBody(raw.slice(i, boundary.end)),
          complete: false,
        });
        return segments;
      }
      segments.push({
        type: "code",
        file,
        added,
        removed,
        body: cleanCodeBody(raw.slice(i, boundary.end)),
        complete: true,
      });
      i = boundary.next;
      continue;
    }

    if (raw.startsWith(M.runS, i)) {
      flushText();
      i += M.runS.length;
      const end = raw.indexOf(M.runE, i);
      if (end === -1) {
        segments.push({ type: "run", body: raw.slice(i), complete: false });
        return segments;
      }
      segments.push({ type: "run", body: raw.slice(i, end).trim(), complete: true });
      i = end + M.runE.length;
      continue;
    }

    textBuf += raw[i]!;
    i++;
  }

  flushText();
  return segments;
}

/** Completed code blocks only — used to restore the live preview when reopening a saved chat. */
export function extractVibeFilesFromContent(content: string): Record<string, string> {
  const segments = parseVibeAgentContent(content);
  const m: Record<string, string> = {};
  for (const seg of segments) {
    if (seg.type === "code" && seg.complete && seg.body.trim()) {
      m[seg.file] = seg.body;
    }
  }
  return m;
}
