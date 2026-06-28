export type VisibleThoughtPhase =
  | "request_reading"
  | "smart_router"
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
  | "design_review"
  | "rollback"
  | "background_task"
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
      `I'm reading the request before touching anything. The goal is to match it to the right agent route so the work lands in the correct layer. I'm checking whether this is a quick fix, a UI patch, a feature build, or something bigger. This step keeps the scope tight from the start.`,
    smart_router:
      `I'm choosing the right workflow depth so small fixes stay targeted and larger builds get a proper plan. A quick edit doesn't need a full task graph — it just needs a precise file target and a fast validation pass. I'm locking in the route before any code changes start.`,
    project_scanning:
      `I'm checking the current project structure so the plan fits into this app instead of creating a separate system. I'm reading the file tree, the existing components, and the active routes. This step prevents duplicate files and broken imports. The scan result will shape the entire plan.`,
    framework_detection:
      `I'm confirming the framework and runtime paths so generated files land where the preview can actually run them. I'm checking for React, Vite, Next.js, or custom configs. Getting this wrong early causes build failures that are harder to fix later.`,
    package_detection:
      `I'm detecting the package manager and available scripts so validation uses the project's own commands. I'm checking for npm, pnpm, yarn, or bun. I'm also looking at the existing dependencies to avoid adding packages that are already installed.`,
    ui_detection:
      `I'm reading the current interface patterns so the build keeps the same visual language. I'm checking the colour palette, spacing scale, border radius, and animation style. The goal is for the new code to feel native to the workspace, not like a different designer worked on it.`,
    plan_generating:
      `I'm turning ${target} into a structured plan with file targets, task order, validation steps, and rollback points. I'm deciding which components need to change, which ones can stay untouched, and what the safe execution order is. A clear plan now prevents scope creep later.`,
    file_tree_generating:
      `I'm mapping the proposed files into the saved project folder so every component has a clear place. I'm making sure new files don't collide with existing ones. I'm also checking that import paths will resolve correctly once the files are created.`,
    task_graph_generating:
      `I'm breaking the plan into ordered tasks so the build can progress step by step instead of rushing through everything at once. Each task has a clear scope, a validation method, and a known rollback point. The graph will stay hidden by default — you can expand it anytime.`,
    plan_refining:
      `I'm tightening the plan around preview, persistence, error states, checkpoints, and safe final review. I'm removing tasks that are out of scope and making sure each remaining task is specific enough to execute cleanly. This pass makes the approved plan reliable.`,
    plan_ready:
      `The plan is ready to review. I've structured it with the goal, file changes, task order, validation steps, and rollback points. You can expand the plan card to read the full detail, leave a comment on any section, or approve it to start the build. Nothing gets changed until you approve.`,
    plan_approved:
      `The plan is approved and saved as the source of truth. I'm not building from memory — every task will read plan.md before touching a file. I'm creating a checkpoint now so the workspace can be rolled back cleanly if something unexpected happens.`,
    checkpointing:
      `I'm creating a safe checkpoint before the build starts. This records the current file state so any change can be reviewed and reversed. I'm also noting the approved task graph so the build can resume from the right point if it gets interrupted.`,
    task_starting:
      `I'm reading the next task from plan.md and identifying the safest targeted change set. I'm checking which files are in scope, what the expected output looks like, and whether this task has any dependencies that need to be done first. I won't touch files outside this task's scope.`,
    file_editing:
      `I'm patching the listed files while keeping unrelated surfaces untouched. I'm making the smallest safe change that satisfies the task — not a full rewrite unless the task explicitly calls for one. I'm checking import paths and export shapes as I go.`,
    file_generating:
      `I'm creating the required project files inside the saved folder so the live preview can run from disk. I'm writing the file content, checking the imports, and making sure the component shape matches what the rest of the app expects. Each file will be validated before moving to the next.`,
    validation:
      `I'm running the available checks so this task is verified before the next one starts. I'm looking for TypeScript errors, broken imports, and any issue that would stop the preview from loading. If something fails, I'll fix it in the same step rather than moving forward with a broken build.`,
    error_fixing:
      `I'm matching the error to the affected file and preparing the smallest safe fix. I'm not rewriting the whole component — just the part that caused the failure. After the fix I'll rerun validation to confirm the error is gone before continuing.`,
    preview_refreshing:
      `I'm refreshing the live preview after the validated changes so the running app stays in sync with the saved files. I'm checking that the dev server picks up the new files correctly. If the preview doesn't load cleanly, I'll fix the issue before marking this step complete.`,
    design_review:
      `I'm checking the UI states and visual fit so the result feels native to the current workspace. I'm looking at hover states, empty states, loading states, and responsive behaviour. The goal is for the final output to look intentional and polished, not like it was dropped in from a different codebase.`,
    rollback:
      `I'm checking the latest checkpoint and the rollback path before touching anything risky. I want to confirm what was changed, what was validated, and what the safe restore point looks like. If the rollback goes ahead, it will return the workspace to the last known good state.`,
    background_task:
      `I'm keeping the build state saved so you can leave and return without replaying the whole run. The current task progress, file changes, and validation results are all persisted. You can pick up where you left off by reopening the project from your recent list.`,
    final_review:
      `I'm checking saved files, task completion, preview status, and rollback points before marking the build ready. I'm also doing a quick visual pass on the UI to confirm it looks polished and doesn't have obvious broken states. Nothing gets marked complete until this review passes.`,
  };

  return { phase, text: textByPhase[phase] };
}
