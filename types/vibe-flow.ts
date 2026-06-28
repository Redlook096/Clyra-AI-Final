export type VibeFlowPhase = 
  | "idle"
  | "thinking"
  | "planning"
  | "plan_ready"
  | "user_review"
  | "task_execution"
  | "validation"
  | "live_preview"
  | "browser_test"
  | "fixing"
  | "presentable_pass"
  | "security_pass"
  | "final_review"
  | "complete"
  | "failed"
  | "paused";

export interface VibeFlowState {
  currentPhase: VibeFlowPhase;
  activeTaskId?: string;
  activeGroupId?: string;
  lastError?: string;
}

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
