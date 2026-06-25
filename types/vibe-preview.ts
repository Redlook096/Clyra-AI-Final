export type PreviewStatus =
  | "idle"
  | "starting"
  | "installing"
  | "compiling"
  | "running"
  | "ready"
  | "refreshing"
  | "runtime_error"
  | "build_failed"
  | "server_crashed"
  | "restarting"
  | "stopped";

export type VibePackageManager = "npm" | "pnpm" | "yarn" | "bun";

export type PreviewError = {
  title: string;
  message: string;
  filePath?: string;
  line?: number;
  raw?: string;
};

export type PreviewSession = {
  projectId: string;
  projectPath: string;
  packageManager: VibePackageManager;
  devCommand: string;
  port?: number;
  url?: string;
  status: PreviewStatus;
  processId?: string;
  startedAt?: number;
  lastHealthCheckAt?: number;
  lastError?: PreviewError;
};

export type PreviewLogLine = {
  id: string;
  time: string;
  level: "info" | "warn" | "error";
  message: string;
};
