export interface VibeValidationResult {
  passed?: boolean;
  success?: boolean;
  errors: {
    file: string;
    message: string;
    line?: number;
  }[];
  warnings?: string[];
  filesScanned?: string[];
  scriptsRun: string[];
  limitedValidation?: boolean;
  timestampMs?: number;
}

export interface ErrorFixAttempt {
  error: string;
  file: string;
  patchApplied: boolean;
  validationSuccessAfter: boolean;
  timestampMs: number;
}
