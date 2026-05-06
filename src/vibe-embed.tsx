import { useMemo } from "react";
import { buildVibePreviewSrcDoc } from "@/lib/buildVibePreviewSrcDoc";

const STORAGE_KEY = "clyra_vibe_preview_files";

export default function VibeEmbedRoot() {
  const srcDoc = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return "<!DOCTYPE html><html><body style=\"margin:0;padding:16px;font:13px system-ui;color:#64748b\">No preview session.</body></html>";
      }
      const files = JSON.parse(raw) as Record<string, string>;
      return buildVibePreviewSrcDoc(files);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return `<!DOCTYPE html><html><body style="margin:0;padding:16px;font:13px monospace;color:#b91c1c">${msg}</body></html>`;
    }
  }, []);

  return (
    <iframe
      title="Vibe preview"
      srcDoc={srcDoc}
      className="block h-dvh w-screen border-0 bg-white"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
