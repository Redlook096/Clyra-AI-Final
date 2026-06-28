export class FlowVarietyEngine {
  /**
   * Decides when to show thinking animations or compact statuses
   * to ensure the build process feels dynamic and alive.
   */
  static shouldShowThinking(phase: string, taskIndex: number, totalTasks: number): boolean {
    // Always show thinking before major boundaries
    if (phase === "pre_scan" || phase === "pre_validation" || phase === "pre_preview") {
      return true;
    }
    
    // Show thinking sporadically during long task groups
    if (phase === "task_execution") {
      // Show every 3rd task, or on the first and last task
      return taskIndex === 0 || taskIndex === totalTasks - 1 || taskIndex % 3 === 0;
    }

    return false;
  }

  static getThinkingText(phase: string, context?: string): string {
    switch (phase) {
      case "pre_scan": return "Inspecting existing project structure and dependencies...";
      case "pre_validation": return "Running typecheck and linting on the new components...";
      case "pre_preview": return "Starting local dev server to capture live preview...";
      case "browser_test": return "Running automated UI interactions in the preview...";
      case "presentable_pass": return "Checking if the UI looks premium and handles all screen sizes...";
      default: return "Thinking...";
    }
  }
}
