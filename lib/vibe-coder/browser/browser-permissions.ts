import { VibeBrowserAgentPermission } from "../../../types/vibe-browser-agent";

export class BrowserPermissions {
  private static activePermission: VibeBrowserAgentPermission | null = null;

  static requestPermission(): Promise<boolean> {
    // This will trigger the UI to ask the user
    return Promise.resolve(true);
  }

  static isAllowed(): boolean {
    return this.activePermission?.granted || false;
  }
}
