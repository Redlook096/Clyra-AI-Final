export type VibeTaskGroup = {
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
  status: "pending" | "in_progress" | "validation" | "preview" | "completed" | "failed";
};

export type FileSpec = {
  filePath: string;
  action: "create" | "edit" | "reuse" | "skip";
  purpose: string;
  exports: string[];
  importsNeeded: string[];
  dependsOn: string[];
  riskLevel: "safe" | "medium" | "high";
  validation: string[];
};
