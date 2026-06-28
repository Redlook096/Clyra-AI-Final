export interface VibeMiniCodeBox {
  id: string;
  filePath: string;
  action: "create" | "update" | "delete";
  contentDiff: string;
  fullContent?: string;
  status: "queued" | "fading_in" | "expanding" | "typing" | "typed_waiting" | "collapsing" | "done" | "error";
  typingProgress: number; // 0 to 1
}
