import { DeepCodingModeReport } from "../../../types/vibe-deep-coding";

const SERIOUS_BUILD_KEYWORDS = [
  "calculator", "landing page", "dashboard", "app", "saas app", 
  "homepage", "editor", "browser", "admin panel", "project management app", 
  "crm", "marketplace", "login/signup", "auth", "database feature", 
  "settings page", "profile page", "full ui feature", "build", "create", 
  "make", "fully build", "page", "system"
];

export class DeepCodingModeTracker {
  private report: DeepCodingModeReport;

  constructor(request: string) {
    const isSerious = this.detectSeriousBuild(request);
    const complexity = this.estimateComplexity(request);
    
    this.report = {
      enabled: isSerious,
      requestType: request,
      complexity,
      canComplete: !isSerious,
      minimumTaskGroups: this.getMinimumTaskGroups(complexity),
      completedTaskGroups: 0,
      minimumMeaningfulFiles: this.getMinimumFiles(complexity),
      meaningfulFilesChanged: 0,
      hasPlan: false,
      hasProjectScan: false,
      hasArchitecturePass: false,
      hasTaskGroups: false,
      hasMultiFileGeneration: false,
      hasValidation: false,
      hasPreview: false,
      hasBrowserTest: false,
      hasReview: false,
      weakReasons: [],
      requiredNextActions: []
    };
  }

  private detectSeriousBuild(request: string): boolean {
    const lower = request.toLowerCase();
    return SERIOUS_BUILD_KEYWORDS.some(kw => lower.includes(kw));
  }

  private estimateComplexity(request: string): "tiny" | "small" | "medium" | "large" | "full_app" {
    const lower = request.toLowerCase();
    if (lower.includes("full app") || lower.includes("saas") || lower.includes("marketplace")) return "full_app";
    if (lower.includes("dashboard") || lower.includes("crm") || lower.includes("admin")) return "large";
    if (lower.includes("calculator") || lower.includes("landing page")) return "medium";
    if (this.detectSeriousBuild(request)) return "small";
    return "tiny";
  }

  private getMinimumTaskGroups(complexity: string): number {
    switch (complexity) {
      case "full_app": return 10;
      case "large": return 6;
      case "medium": return 4;
      case "small": return 2;
      default: return 1;
    }
  }

  private getMinimumFiles(complexity: string): number {
    switch (complexity) {
      case "full_app": return 15;
      case "large": return 12;
      case "medium": return 8;
      case "small": return 5;
      default: return 1;
    }
  }

  public markGatePassed(gate: keyof DeepCodingModeReport) {
    if (gate in this.report && typeof this.report[gate] === "boolean") {
      (this.report as any)[gate] = true;
    }
    this.evaluateCompletion();
  }

  public incrementTaskGroups() {
    this.report.completedTaskGroups++;
    this.evaluateCompletion();
  }

  public incrementFiles() {
    this.report.meaningfulFilesChanged++;
    this.evaluateCompletion();
  }

  public addWeakReason(reason: string) {
    this.report.weakReasons.push(reason);
    this.report.canComplete = false;
  }

  private evaluateCompletion() {
    if (!this.report.enabled) {
      this.report.canComplete = true;
      return;
    }

    const checks = [
      this.report.hasPlan,
      this.report.hasProjectScan,
      this.report.hasArchitecturePass,
      this.report.hasTaskGroups,
      this.report.completedTaskGroups >= this.report.minimumTaskGroups,
      this.report.meaningfulFilesChanged >= this.report.minimumMeaningfulFiles,
      this.report.hasValidation,
      this.report.hasPreview,
      this.report.hasReview,
      this.report.weakReasons.length === 0
    ];

    this.report.canComplete = checks.every(Boolean);
  }

  public getReport(): DeepCodingModeReport {
    this.evaluateCompletion();
    return this.report;
  }
}
