export type VisibleThoughtPhase =
  | "request_reading"
  | "project_scanning"
  | "framework_detection"
  | "package_detection"
  | "ui_detection"
  | "plan_generating"
  | "file_tree_generating"
  | "task_graph_generating"
  | "plan_refining"
  | "plan_ready"
  | "plan_approved"
  | "checkpointing"
  | "task_starting"
  | "file_editing"
  | "file_generating"
  | "validation"
  | "error_fixing"
  | "preview_refreshing"
  | "final_review";

export interface VisibleThoughtPreview {
  phase: VisibleThoughtPhase;
  text: string;
}

export function getVisibleThoughtPreview(
  phase: VisibleThoughtPhase,
  context?: { prompt?: string; projectName?: string },
): VisibleThoughtPreview {
  const target = context?.projectName || context?.prompt || "this build";
  const textByPhase: Record<VisibleThoughtPhase, string> = {
    request_reading:
      "I’m reading the request and matching it to the existing Vibe workspace before any code changes start.",
    project_scanning:
      "I’m checking the current project structure so the plan fits into this app instead of creating a separate system.",
    framework_detection:
      "I’m confirming the framework and runtime paths so generated files land where the preview can actually run them.",
    package_detection:
      "I’m detecting the package manager and available scripts so validation uses the project’s existing commands.",
    ui_detection:
      "I’m reading the current glassy interface patterns so the build keeps the same premium visual language.",
    plan_generating:
      `I’m turning ${target} into a detailed plan.md with file targets, task order, validation, and rollback points.`,
    file_tree_generating:
      "I’m mapping the proposed files into the saved project folder so every component has a clear place.",
    task_graph_generating:
      "I’m breaking the plan into dependent tasks so the build can progress step by step instead of rushing.",
    plan_refining:
      "I’m tightening the plan around preview, persistence, error states, checkpoints, and safe final review.",
    plan_ready:
      "I’m finalising the plan into a reviewable structure that can be expanded, commented on, approved, and executed.",
    plan_approved:
      "I’m saving the approved plan as the source of truth before the build follows it task by task.",
    checkpointing:
      "I’m preparing a safe checkpoint so file changes can be reviewed and rolled back if needed.",
    task_starting:
      "I’m reading the next task from plan.md and choosing the safest targeted change set.",
    file_editing:
      "I’m patching the listed files while keeping unrelated app surfaces untouched.",
    file_generating:
      "I’m creating the required project files inside the saved folder so the live preview can run from disk.",
    validation:
      "I’m running the available checks now so this task is verified before the next one starts.",
    error_fixing:
      "I’m matching the error to the affected file and preparing the smallest safe fix.",
    preview_refreshing:
      "I’m refreshing the live preview after the validated changes so the running app stays in sync.",
    final_review:
      "I’m checking saved files, task completion, preview status, and rollback points before marking the build ready.",
  };

  return { phase, text: textByPhase[phase] };
}
