import { stopDevServer, startDevServer, refreshPreview } from "../vibe-coder/preview/preview-runner";

export type PreviewSessionInfo = {
  projectId: string;
  url?: string;
  status: string;
  error?: string;
};

export class PreviewManager {
  private activeProjectId: string | null = null;

  constructor(private workspacePath: string) {}

  async clearPrevious(projectId: string) {
    if (this.activeProjectId && this.activeProjectId !== projectId) {
      await stopDevServer(this.activeProjectId).catch(() => {});
    }
    this.activeProjectId = projectId;
  }

  async startPreview(projectId: string, projectName: string): Promise<PreviewSessionInfo> {
    await this.clearPrevious(projectId);
    const session = await startDevServer({
      projectId,
      projectPath: this.workspacePath,
      projectName,
    });

    if (!session.url) {
      return {
        projectId,
        status: session.status,
        error: session.lastError?.message || "Preview did not become ready",
      };
    }

    const cacheBustedUrl = `${session.url}${session.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
    return {
      projectId,
      url: cacheBustedUrl,
      status: "ready",
    };
  }

  async refresh(projectId: string) {
    await refreshPreview(projectId);
  }

  async restart(projectId: string, projectName: string) {
    await stopDevServer(projectId).catch(() => {});
    return this.startPreview(projectId, projectName);
  }

  verifyWorkspaceBinding(projectId: string, taskProjectId: string): boolean {
    return projectId === taskProjectId;
  }
}
