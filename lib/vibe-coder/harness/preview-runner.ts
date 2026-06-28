import { VibePreviewHealth } from "../../../types/vibe-preview";

export class PreviewRunner {
  static async startPreview(workspacePath: string): Promise<VibePreviewHealth> {
    // Stub: In reality this checks if the dev server is running and hits it.
    return {
      state: "starting",
      localUrl: "http://localhost:5174",
      runtimeErrors: [],
      lastCheckMs: Date.now()
    };
  }

  static async checkHealth(url: string): Promise<VibePreviewHealth> {
    // Stub: Check the live preview server health
    return {
      state: "ready",
      localUrl: url,
      runtimeErrors: [],
      lastCheckMs: Date.now()
    };
  }
}
