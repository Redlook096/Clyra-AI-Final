import type { PreviewError } from "../../../types/vibe-preview";

export async function checkPreviewHealth(url: string): Promise<{
  ok: boolean;
  status?: number;
  error?: PreviewError;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const ok = response.status >= 200 && response.status < 500;
    return ok
      ? { ok, status: response.status }
      : {
          ok: false,
          status: response.status,
          error: {
            title: "Preview did not respond cleanly",
            message: `Health check returned HTTP ${response.status}.`,
          },
        };
  } catch (error) {
    return {
      ok: false,
      error: {
        title: "Preview is not reachable",
        message: error instanceof Error ? error.message : "Connection failed.",
      },
    };
  }
}
