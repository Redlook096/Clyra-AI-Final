export type MiniCodeBoxState = 
  | "queued"
  | "opening"
  | "waiting_before_print"
  | "printing"
  | "waiting_after_print"
  | "collapsing"
  | "collapsed"
  | "manually_expanded"
  | "skipped"
  | "failed";

export interface MiniCodeBoxPayload {
  id: string;
  filePath: string;
  changeType: "created" | "edited" | "patched" | "renamed" | "deleted_pending_approval" | "error_fix" | "plan_update";
  taskId: string;
  ownerAgent: string;
  shortReason: string;
  linesAdded: number;
  linesRemoved: number;
  riskLevel: "safe" | "medium" | "high" | "needs_approval";
  diffOrCode: string;
  state: MiniCodeBoxState;
}

export class MiniCodeBoxQueueManager {
  private queue: MiniCodeBoxPayload[] = [];
  private activeId: string | null = null;
  private onQueueChange: (queue: MiniCodeBoxPayload[]) => void;

  constructor(onChange: (queue: MiniCodeBoxPayload[]) => void) {
    this.onQueueChange = onChange;
  }

  enqueue(payload: Omit<MiniCodeBoxPayload, "state">) {
    this.queue.push({ ...payload, state: "queued" });
    this.notify();
    this.processQueue();
  }

  private notify() {
    this.onQueueChange([...this.queue]);
  }

  private async processQueue() {
    if (this.activeId) return; // Already processing

    const next = this.queue.find((item) => item.state === "queued");
    if (!next) return;

    this.activeId = next.id;

    // Simulate strict timings
    await this.updateState(next.id, "opening", 500); // Wait 0.5 seconds
    
    // Simulate printing time (based on lines)
    const printTime = Math.min(Math.max(next.diffOrCode.split('\n').length * 30, 500), 4000);
    await this.updateState(next.id, "printing", printTime);
    
    await this.updateState(next.id, "waiting_after_print", 1000); // Wait 1 second
    await this.updateState(next.id, "collapsing", 300);
    await this.updateState(next.id, "collapsed", 1000); // Wait 1 second

    this.activeId = null;
    this.processQueue();
  }

  private async updateState(id: string, state: MiniCodeBoxState, delayMs: number) {
    const item = this.queue.find((i) => i.id === id);
    if (item) {
      item.state = state;
      this.notify();
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  skipAll() {
    this.queue.forEach(item => {
      if (item.state !== "collapsed" && item.state !== "manually_expanded") {
        item.state = "skipped";
      }
    });
    this.activeId = null;
    this.notify();
  }
}
