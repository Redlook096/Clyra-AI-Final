import { DeepWorkBudget } from "../../../types/vibe-deep-coding";

export class DeepWorkBudgetTracker {
  private budget: DeepWorkBudget;

  constructor(complexity: "tiny" | "small" | "medium" | "large" | "full_app") {
    this.budget = {
      requiredScans: complexity === "tiny" ? 0 : 1,
      requiredArchitecturePasses: complexity === "tiny" ? 0 : 1,
      requiredPlanQualityPasses: complexity === "tiny" ? 0 : 1,
      requiredTaskGroups: this.getRequiredTaskGroups(complexity),
      requiredValidationPoints: complexity === "tiny" ? 0 : 2,
      requiredPreviewChecks: complexity === "tiny" ? 0 : 1,
      requiredReviewPasses: complexity === "tiny" ? 0 : 1,
      requiredCodingPasses: this.getRequiredTaskGroups(complexity),
      
      completedScans: 0,
      completedArchitecturePasses: 0,
      completedPlanQualityPasses: 0,
      completedTaskGroups: 0,
      completedValidationPoints: 0,
      completedPreviewChecks: 0,
      completedReviewPasses: 0,
      completedCodingPasses: 0,
    };
  }

  private getRequiredTaskGroups(complexity: string): number {
    switch (complexity) {
      case "full_app": return 10;
      case "large": return 6;
      case "medium": return 4;
      case "small": return 2;
      default: return 1;
    }
  }

  public recordAction(action: keyof DeepWorkBudget) {
    const key = String(action);
    if (key.startsWith("completed") && typeof this.budget[action] === "number") {
      (this.budget as any)[action]++;
    }
  }

  public isBudgetMet(): boolean {
    return (
      this.budget.completedScans >= this.budget.requiredScans &&
      this.budget.completedArchitecturePasses >= this.budget.requiredArchitecturePasses &&
      this.budget.completedPlanQualityPasses >= this.budget.requiredPlanQualityPasses &&
      this.budget.completedTaskGroups >= this.budget.requiredTaskGroups &&
      this.budget.completedValidationPoints >= this.budget.requiredValidationPoints &&
      this.budget.completedPreviewChecks >= this.budget.requiredPreviewChecks &&
      this.budget.completedReviewPasses >= this.budget.requiredReviewPasses &&
      this.budget.completedCodingPasses >= this.budget.requiredCodingPasses
    );
  }

  public getMissingWork(): string[] {
    const missing: string[] = [];
    if (this.budget.completedScans < this.budget.requiredScans) missing.push("Project Scans");
    if (this.budget.completedArchitecturePasses < this.budget.requiredArchitecturePasses) missing.push("Architecture Passes");
    if (this.budget.completedTaskGroups < this.budget.requiredTaskGroups) missing.push("Task Groups");
    if (this.budget.completedValidationPoints < this.budget.requiredValidationPoints) missing.push("Validation");
    if (this.budget.completedPreviewChecks < this.budget.requiredPreviewChecks) missing.push("Preview Checks");
    if (this.budget.completedReviewPasses < this.budget.requiredReviewPasses) missing.push("Reviews");
    return missing;
  }
}
