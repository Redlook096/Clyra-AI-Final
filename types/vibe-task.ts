export interface VibeTask {
  id: string;
  name: string;
  purpose: string;
  dependencies: string[];
  ownerAgent: "Planner" | "Architect" | "Frontend" | "Backend" | "Design" | "Terminal" | "BrowserTester" | "Fixer" | "Reviewer" | "Security";
  filesAffected: string[];
  exactWork: string;
  expectedOutput: string;
  validationMethod: string;
  requiresPreviewCheck: boolean;
  doneCriteria: string[];
  status: "pending" | "active" | "waiting" | "done" | "failed" | "needs_approval";
}

export interface FileSpec {
  filePath: string;
  action: "create" | "edit" | "delete" | "rename";
  purpose: string;
  exports: string[];
  importsNeeded: string[];
  dependsOn: string[];
  riskLevel: "low" | "medium" | "high";
  validation: string[];
}

export interface VibeTaskGroup {
  id: string;
  name: string;
  purpose: string;
  dependencies: string[];
  ownerAgent: string;
  filesAffected: string[];
  exactWork: string;
  expectedOutput: string;
  validationMethod: string;
  previewRequirement: boolean;
  browserTestRequirement: boolean;
  doneCriteria: string[];
  status: "pending" | "active" | "validation" | "preview" | "completed" | "failed";
}
