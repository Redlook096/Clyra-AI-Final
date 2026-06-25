import type { PreviewError } from "../../../types/vibe-preview";

export function parsePreviewError(log: string): PreviewError | null {
  const lower = log.toLowerCase();
  if (
    !lower.includes("error") &&
    !lower.includes("failed") &&
    !lower.includes("exception")
  ) {
    return null;
  }

  const fileMatch = log.match(/([A-Za-z0-9_./-]+\.(?:tsx|ts|jsx|js|css))(?::(\d+))?/);
  return {
    title: lower.includes("failed") ? "Preview build failed" : "Preview error",
    message: log.split("\n").slice(0, 6).join("\n").trim(),
    filePath: fileMatch?.[1],
    line: fileMatch?.[2] ? Number(fileMatch[2]) : undefined,
    raw: log,
  };
}
