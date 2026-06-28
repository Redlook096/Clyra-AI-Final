export interface VibeReviewResult {
  passed: boolean;
  blockers?: string[];
  warnings?: string[];
  missingFeatures?: string[];
  presentableScore?: number;
  securityIssues?: string[];
  score?: BuildDepthScore;
  missingWork?: string[];
  suggestedNextSteps?: string[];
}

export interface BuildDepthScore {
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
}
