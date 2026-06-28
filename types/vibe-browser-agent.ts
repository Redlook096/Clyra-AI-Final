export interface VibeBrowserAgentPermission {
  granted: boolean;
  timestamp: number;
}

export interface VibeBrowserAgentAction {
  type: "observe" | "click" | "type" | "scroll" | "navigate";
  target?: string;
  value?: string;
  result?: string;
  timestamp: number;
}
