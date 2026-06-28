export type BuildDepthScore = {
  score: number;
  fileStructure: number;
  componentSeparation: number;
  stateSeparation: number;
  logicSeparation: number;
  taskGroupCompletion: number;
  validationCoverage: number;
  previewCoverage: number;
  browserCoverage: number;
  reviewCoverage: number;
  reasons: string[];
};

export type VibeReviewResult = {
  passed: boolean;
  score: BuildDepthScore;
  missingWork: string[];
  suggestedNextSteps: string[];
};
