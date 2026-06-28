export type VibeValidationResult = {
  success: boolean;
  errors: string[];
  warnings: string[];
  filesScanned: string[];
  scriptsRun: string[];
  limitedValidation: boolean;
  timestampMs: number;
};

export type ErrorFixAttempt = {
  error: string;
  file: string;
  patchApplied: boolean;
  validationSuccessAfter: boolean;
  timestampMs: number;
};
