export interface VibePlan {
  id: string;
  title: string;
  goal: string;
  userRequestInterpretation: {
    directRequirements: string[];
    impliedRequirements: string[];
    assumptions: string[];
    preserve: string[];
  };
  productExpansion: {
    feature: string;
    status: "required" | "scaffold" | "optional" | "requires_approval" | "future";
  }[];
  currentProjectScan: {
    framework: string;
    packageManager: string;
    stylingSystem: string;
    existingRoutes: string[];
  };
  proposedFileTree: {
    path: string;
    action: "create" | "edit" | "reuse" | "avoid";
    purpose: string;
  }[];
  uxFlow: string;
  uiLayoutPlan: {
    desktop: string;
    mobile: string;
    sections: string[];
  };
  architecturePlan: {
    components: string[];
    routes: string[];
    state: string;
  };
  taskGraph: import("./vibe-task").VibeTask[];
  multiStepGroups: {
    groupId: string;
    name: string;
    taskIds: string[];
  }[];
  validationPlan: string[];
  livePreviewPlan: string[];
  browserTestingPlan: string[];
  presentableQualityChecklist: string[];
  securityPlan: string[];
  qualityScore?: VibePlanQualityScore;
}

export interface VibePlanQualityScore {
  requestCoverage: number;
  productCompleteness: number;
  fileStructureQuality: number;
  taskClarity: number;
  overall: "Strong" | "Moderate" | "Weak";
}
