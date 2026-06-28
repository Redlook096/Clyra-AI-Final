export type VibeRequestKind =
  | "tiny_edit"
  | "ui_tweak"
  | "bug_fix"
  | "feature_build"
  | "refactor"
  | "design_change"
  | "full_app_build"
  | "file_search_edit"
  | "preview_issue"
  | "review_request"
  | "explain_code"
  | "continue_previous_task"
  | "undo_rollback_request";

export interface VibeRouteDecision {
  kind: VibeRequestKind;
  label: string;
  intensity: "quick" | "focused" | "deep";
  flow: string[];
  reason: string;
}

const ROUTE_META: Record<
  VibeRequestKind,
  Omit<VibeRouteDecision, "kind" | "reason">
> = {
  tiny_edit: {
    label: "Tiny edit",
    intensity: "quick",
    flow: ["Locate target", "Patch", "Validate", "Refresh"],
  },
  ui_tweak: {
    label: "UI tweak",
    intensity: "focused",
    flow: ["Find component", "Match style", "Patch UI", "Preview pass"],
  },
  bug_fix: {
    label: "Bug fix",
    intensity: "focused",
    flow: ["Reproduce", "Map error", "Patch", "Validate"],
  },
  feature_build: {
    label: "Feature build",
    intensity: "deep",
    flow: ["Scan", "Plan.md", "Task graph", "Build", "Review"],
  },
  refactor: {
    label: "Refactor",
    intensity: "deep",
    flow: ["Risk scan", "Checkpoint", "Patch", "Full validation"],
  },
  design_change: {
    label: "Design change",
    intensity: "focused",
    flow: ["Inspect visuals", "Variant pass", "Patch", "Responsive check"],
  },
  full_app_build: {
    label: "Full app build",
    intensity: "deep",
    flow: ["Architecture", "Plan.md", "Files", "Preview", "Review"],
  },
  file_search_edit: {
    label: "File edit",
    intensity: "focused",
    flow: ["Search files", "Open target", "Patch", "Validate"],
  },
  preview_issue: {
    label: "Preview issue",
    intensity: "focused",
    flow: ["Read logs", "Health check", "Patch", "Restart preview"],
  },
  review_request: {
    label: "Review",
    intensity: "focused",
    flow: ["Inspect changes", "Risk pass", "Preview", "Report"],
  },
  explain_code: {
    label: "Explain code",
    intensity: "quick",
    flow: ["Read context", "Summarise", "Link files"],
  },
  continue_previous_task: {
    label: "Continue task",
    intensity: "focused",
    flow: ["Load state", "Resume plan", "Continue", "Review"],
  },
  undo_rollback_request: {
    label: "Rollback",
    intensity: "focused",
    flow: ["Find checkpoint", "Confirm scope", "Restore", "Validate"],
  },
};

export function classifyVibeRequest(input: string): VibeRouteDecision {
  const text = input.toLowerCase();
  let kind: VibeRequestKind = "feature_build";

  if (/\b(undo|rollback|revert|restore|go back)\b/.test(text)) {
    kind = "undo_rollback_request";
  } else if (/\b(continue|resume|keep going|carry on)\b/.test(text)) {
    kind = "continue_previous_task";
  } else if (/\b(explain|what does|walk me through|why does)\b/.test(text)) {
    kind = "explain_code";
  } else if (/\b(review|audit|check this|inspect)\b/.test(text)) {
    kind = "review_request";
  } else if (/\b(preview|localhost|blank|runtime|server|iframe)\b/.test(text)) {
    kind = "preview_issue";
  } else if (/\b(find file|search|open file|edit file|rename file)\b/.test(text)) {
    kind = "file_search_edit";
  } else if (/\b(app|dashboard|saas|platform|complete|full|workflow|system)\b/.test(text)) {
    kind = "full_app_build";
  } else if (/\b(refactor|cleanup|restructure|simplify)\b/.test(text)) {
    kind = "refactor";
  } else if (/\b(bug|fix|error|crash|broken|not working)\b/.test(text)) {
    kind = "bug_fix";
  } else if (/\b(color|style|spacing|animation|hover|glass|premium|layout)\b/.test(text)) {
    kind = "design_change";
  } else if (text.split(/\s+/).filter(Boolean).length < 7) {
    kind = "tiny_edit";
  } else if (/\b(button|card|modal|sidebar|input|tab)\b/.test(text)) {
    kind = "ui_tweak";
  }

  const meta = ROUTE_META[kind];
  return {
    kind,
    ...meta,
    reason: `Routed as ${meta.label.toLowerCase()} from the request wording and expected build depth.`,
  };
}

export function scorePlanQuality(markdown: string, taskCount: number) {
  const requiredSections = [
    "Goal",
    "Request Interpretation",
    "Current Project Scan",
    "Proposed File Tree",
    "Detailed Task Graph",
    "Validation Plan",
    "Live Preview Plan",
    "Checkpoint/Rollback Plan",
    "UI State Completion Pass",
    "Diff Risk Plan",
    "Final Review Checklist",
  ];
  const sectionScore = requiredSections.filter((section) =>
    markdown.includes(section),
  ).length;
  const score = Math.min(
    98,
    Math.round((sectionScore / requiredSections.length) * 74 + Math.min(taskCount, 8) * 3),
  );
  return {
    score,
    label: score >= 88 ? "Strong" : score >= 74 ? "Ready" : "Needs refinement",
  };
}

export function estimateBuildConfidence(args: {
  planQuality: number;
  hasPreviewPlan: boolean;
  hasCheckpointPlan: boolean;
  riskLevel?: "safe" | "medium" | "high";
}) {
  const riskPenalty =
    args.riskLevel === "high" ? 18 : args.riskLevel === "medium" ? 8 : 0;
  const score = Math.max(
    40,
    Math.min(
      97,
      args.planQuality +
        (args.hasPreviewPlan ? 4 : -6) +
        (args.hasCheckpointPlan ? 4 : -6) -
        riskPenalty,
    ),
  );
  return {
    score,
    label:
      score >= 90
        ? "High confidence"
        : score >= 75
          ? "Ready with checks"
          : "Needs review",
  };
}
