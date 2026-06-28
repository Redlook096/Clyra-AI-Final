import { VibeReviewResult, BuildDepthScore } from "../../../types/vibe-review";
import { VibePlan } from "../../../types/vibe-plan";
import { BuildDepthScorer } from "./build-depth-scorer";

export class ReviewAgent {
  /**
   * Final check before marking a build as complete.
   * Compares the original plan against the generated artifacts and validation results.
   */
  static async performFinalReview(
    plan: VibePlan, 
    executedTasks: string[], 
    validationPassed: boolean, 
    previewHealthy: boolean,
    complexity: string
  ): Promise<VibeReviewResult> {
    
    const missingWork: string[] = [];

    // Check if all task groups were executed
    const totalPlanTasks = plan.multiStepGroups?.reduce((acc, g) => acc + g.taskIds.length, 0) || 0;
    if (executedTasks.length < totalPlanTasks) {
      missingWork.push(`Incomplete execution: Only finished ${executedTasks.length} out of ${totalPlanTasks} planned tasks.`);
    }

    if (!validationPassed) {
      missingWork.push("Validation checks failed. Code is not stable.");
    }

    if (!previewHealthy) {
      missingWork.push("Live preview is not healthy or crashed.");
    }

    const score = BuildDepthScorer.calculateScore({});
    if (!BuildDepthScorer.passesThreshold(score, complexity)) {
      missingWork.push("Build depth score is too low for the request complexity.");
    }

    return {
      passed: missingWork.length === 0,
      score,
      missingWork,
      suggestedNextSteps: missingWork.length > 0 ? ["Continue building and address missing requirements"] : []
    };
  }
}
