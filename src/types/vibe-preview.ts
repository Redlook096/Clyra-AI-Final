export type VibePreviewState = 
  | "idle"
  | "starting"
  | "compiling"
  | "running"
  | "ready"
  | "refreshing"
  | "runtime_error"
  | "build_failed"
  | "server_crashed"
  | "stopped";

export type VibePreviewHealth = {
  state: VibePreviewState;
  localUrl?: string;
  runtimeErrors: string[];
  lastCheckMs: number;
};
