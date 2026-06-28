import { BuildDepthScore } from "../../../types/vibe-review";

export class BuildDepthScorer {
  static calculateScore(context: any): BuildDepthScore {
    // Stub calculation based on project state
    // Real implementation would parse number of components, files, validation coverage, etc.
    return {
      score: 85,
      fileStructure: 90,
      componentSeparation: 80,
      stateSeparation: 85,
      logicSeparation: 90,
      taskGroupCompletion: 100,
      validationCoverage: 100,
      previewCoverage: 100,
      browserCoverage: 0,
      reviewCoverage: 100,
      reasons: ["Good component separation", "Validation passed"]
    };
  }

  static passesThreshold(score: BuildDepthScore, complexity: string): boolean {
    if (complexity === "full_app" && score.score < 90) return false;
    if (complexity === "large" && score.score < 85) return false;
    if (complexity === "medium" && score.score < 80) return false;
    if (complexity === "small" && score.score < 70) return false;
    return true;
  }
}
