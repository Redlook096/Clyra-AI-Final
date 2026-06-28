export type VibeFlowPass = 
  | "request_classification"
  | "project_scan"
  | "architecture_pass"
  | "product_expansion"
  | "plan_generation"
  | "plan_quality_review"
  | "task_group_breakdown"
  | "file_specification"
  | "per_task_coding"
  | "per_file_patch"
  | "validation"
  | "error_fixing"
  | "preview"
  | "browser_test"
  | "final_review";

export type VibeFlowState = {
  currentPass: VibeFlowPass;
  completedPasses: VibeFlowPass[];
  buildComplete: boolean;
  buildPaused: boolean;
  pauseReason?: string;
  failedGates: string[];
};
