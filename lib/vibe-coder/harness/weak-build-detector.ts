import { VibePlan } from "../../../types/vibe-plan";
import { DeepCodingModeReport } from "../../../types/vibe-deep-coding";

export class WeakBuildDetector {
  /**
   * Detects if the generated plan is too simplistic or 'weak' relative to the goal.
   * Prevents 3-file outputs for complex apps.
   */
  static isWeakPlan(plan: VibePlan, deepReport?: DeepCodingModeReport): { isWeak: boolean; reasons: string[] } {
    const reasons: string[] = [];
    
    // Check if it's a small patch vs a large build
    const isTinyRequest = this.isTinyRequest(plan.goal);
    if (isTinyRequest && (!deepReport || deepReport.complexity === "tiny")) return { isWeak: false, reasons };

    // Check file count against deep coding constraints
    const totalFiles = plan.proposedFileTree.length;
    if (deepReport && totalFiles < deepReport.minimumMeaningfulFiles) {
      reasons.push(`Too few files (${totalFiles}) for a ${deepReport.complexity} build (expected at least ${deepReport.minimumMeaningfulFiles}).`);
    } else if (totalFiles < 4) {
      reasons.push(`Too few files (${totalFiles}) for a complete app/page build.`);
    }

    // Check for giant single-file implementations
    const hasGiantFile = plan.proposedFileTree.some(f => f.action === "create" && (f.path === "src/App.tsx" || f.path === "src/main.tsx"));
    if (hasGiantFile && totalFiles < 5) {
      reasons.push("Looks like a giant single-file implementation without proper component separation.");
    }

    // Check for missing routing/structure if it's a 'dashboard' or 'app'
    const isComplexApp = /dashboard|app|saas|portal/i.test(plan.goal);
    if (isComplexApp && (!plan.architecturePlan.routes || plan.architecturePlan.routes.length < 2)) {
      reasons.push("Missing routing structure for a complex application.");
    }

    // Check for missing components
    if (!plan.architecturePlan.components || plan.architecturePlan.components.length < 3) {
      reasons.push("Missing component breakdown (expected at least 3 components).");
    }

    // Check UI states
    const uiLayout = plan.uiLayoutPlan?.sections?.join(" ").toLowerCase() || "";
    if (!uiLayout.includes("responsive") && !uiLayout.includes("mobile")) {
      reasons.push("Missing responsive/mobile design states.");
    }
    
    // Auth checks if required
    if (/login|auth|signup|register/i.test(plan.goal) && !uiLayout.includes("auth")) {
      reasons.push("Missing auth/login entry points.");
    }

    return {
      isWeak: reasons.length > 0,
      reasons
    };
  }

  private static isTinyRequest(goal: string): boolean {
    const tinyWords = ["fix", "tweak", "change color", "small edit", "patch", "typo", "move button"];
    return tinyWords.some(w => goal.toLowerCase().includes(w));
  }
}
