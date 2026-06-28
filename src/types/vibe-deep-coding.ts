export type DeepCodingModeReport = {
  enabled: boolean;
  requestType: string;
  complexity: "tiny" | "small" | "medium" | "large" | "full_app";
  canComplete: boolean;
  minimumTaskGroups: number;
  completedTaskGroups: number;
  minimumMeaningfulFiles: number;
  meaningfulFilesChanged: number;
  hasPlan: boolean;
  hasProjectScan: boolean;
  hasArchitecturePass: boolean;
  hasTaskGroups: boolean;
  hasMultiFileGeneration: boolean;
  hasValidation: boolean;
  hasPreview: boolean;
  hasBrowserTest: boolean;
  hasReview: boolean;
  weakReasons: string[];
  requiredNextActions: string[];
};

export type DeepWorkBudget = {
  requiredScans: number;
  requiredArchitecturePasses: number;
  requiredPlanQualityPasses: number;
  requiredTaskGroups: number;
  requiredValidationPoints: number;
  requiredPreviewChecks: number;
  requiredReviewPasses: number;
  requiredCodingPasses: number;
  
  completedScans: number;
  completedArchitecturePasses: number;
  completedPlanQualityPasses: number;
  completedTaskGroups: number;
  completedValidationPoints: number;
  completedPreviewChecks: number;
  completedReviewPasses: number;
  completedCodingPasses: number;
};
