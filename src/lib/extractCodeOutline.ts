// Lightweight, regex-driven extractor that pulls top-level exports out of a TypeScript /
// TSX source file. Used by the Vibe agent's build summary to render a per-file outline.
//
// The goal is fast & good-enough, not a real TS parser. We look for top-level patterns
// like `export function …`, `export const …`, `export type …`, etc., and best-effort attach
// the immediately-preceding doc comment (a `// …` line, a single-line JSDoc, or a multi-line JSDoc).

export type CodeExportKind =
  | "component"
  | "function"
  | "const"
  | "type"
  | "interface"
  | "default";

export type CodeExportItem = {
  name: string;
  kind: CodeExportKind;
  doc?: string;
};

function getDocComment(lines: string[], idx: number): string | undefined {
  let i = idx - 1;
  while (i >= 0 && (lines[i] ?? "").trim() === "") i--;
  if (i < 0) return undefined;
  const line = (lines[i] ?? "").trim();

  // Single-line block: /** description */
  let m = line.match(/^\/\*\*\s*(.+?)\s*\*\/\s*$/);
  if (m) return m[1];

  // Single-line: // description
  m = line.match(/^\/\/\s*(.+)$/);
  if (m) return m[1];

  // Multi-line JSDoc terminator: */
  if (line === "*/") {
    const docLines: string[] = [];
    let j = i - 1;
    while (j >= 0) {
      const ln = (lines[j] ?? "").trim();
      if (ln === "/**") break;
      if (ln.startsWith("/**")) {
        const rest = ln.replace(/^\/\*\*\s*/, "");
        if (rest) docLines.unshift(rest);
        break;
      }
      const match = ln.match(/^\*\s?(.*)$/);
      if (match) docLines.unshift(match[1] ?? "");
      else docLines.unshift(ln);
      j--;
    }
    const joined = docLines.join(" ").replace(/\s+/g, " ").trim();
    return joined || undefined;
  }
  return undefined;
}

const PATTERNS: Array<{
  re: RegExp;
  build: (m: RegExpMatchArray) => Omit<CodeExportItem, "doc">;
}> = [
  {
    re: /^\s*export\s+default\s+(?:async\s+)?function\s+(\w+)/,
    build: (m) => ({ name: m[1] ?? "default", kind: "default" }),
  },
  {
    re: /^\s*export\s+(?:async\s+)?function\s+(\w+)/,
    build: (m) => {
      const name = m[1] ?? "";
      return {
        name,
        kind: /^[A-Z]/.test(name) ? "component" : "function",
      };
    },
  },
  {
    re: /^\s*export\s+const\s+(\w+)\s*[:=]/,
    build: (m) => {
      const name = m[1] ?? "";
      return {
        name,
        kind: /^[A-Z]/.test(name) ? "component" : "const",
      };
    },
  },
  {
    re: /^\s*export\s+(type|interface)\s+(\w+)/,
    build: (m) => ({
      name: m[2] ?? "",
      kind: (m[1] === "interface" ? "interface" : "type") as CodeExportKind,
    }),
  },
  {
    re: /^\s*export\s+default\s+(\w+)\s*;?\s*$/,
    build: (m) => ({ name: m[1] ?? "default", kind: "default" }),
  },
];

export function extractCodeOutline(code: string): CodeExportItem[] {
  if (!code) return [];
  const lines = code.split("\n");
  const out: CodeExportItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    for (const { re, build } of PATTERNS) {
      const m = line.match(re);
      if (!m) continue;
      const base = build(m);
      if (!base.name) break;
      const key = `${base.kind}:${base.name}`;
      if (seen.has(key)) break;
      seen.add(key);
      const doc = getDocComment(lines, i);
      out.push(doc ? { ...base, doc } : base);
      break;
    }
  }

  return out;
}
