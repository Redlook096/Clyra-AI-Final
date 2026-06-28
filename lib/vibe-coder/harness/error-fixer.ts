import { ErrorFixAttempt } from "../../../types/vibe-validation";

export class ErrorFixer {
  /**
   * Evaluates an error, creates a safe patch strategy, and increments attempt counts.
   */
  static getFixStrategy(errorLog: string, attemptCount: number): { action: "patch" | "abort"; prompt: string; attempt: ErrorFixAttempt } {
    if (attemptCount > 5) {
      return { 
        action: "abort", 
        prompt: "Exceeded maximum fix attempts. Reverting to checkpoint.",
        attempt: { error: errorLog, file: "unknown", patchApplied: false, validationSuccessAfter: false, timestampMs: Date.now() }
      };
    }

    return {
      action: "patch",
      prompt: `I encountered the following validation/runtime error:\n\n${errorLog}\n\nPlease analyze this, identify the exact file and line causing the issue, and provide a focused patch to resolve it without rewriting the entire file.`,
      attempt: { error: errorLog, file: "unknown", patchApplied: false, validationSuccessAfter: false, timestampMs: Date.now() }
    };
  }
}
