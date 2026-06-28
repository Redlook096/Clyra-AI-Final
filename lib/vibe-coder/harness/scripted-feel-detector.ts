export class ScriptedFeelDetector {
  /**
   * Tracks execution speed to detect if the AI is generating files too quickly
   * or bypassing validation steps, creating a "scripted demo" feel.
   */
  static checkPacing(fileCount: number, timeSpentMs: number): boolean {
    // If we generate more than 3 files in less than 2 seconds, it feels fake.
    if (fileCount >= 3 && timeSpentMs < 2000) {
      return true;
    }
    return false;
  }

  static getRecommendedDelay(fileCount: number): number {
    // Return artificial delay (ms) if needed to simulate real thinking/writing time
    return Math.min(fileCount * 800, 3000);
  }
}
