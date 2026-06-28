export type AgentPhase = 
  | "idle"
  | "understanding"
  | "scanning"
  | "generating_plan"
  | "awaiting_approval"
  | "checkpointing"
  | "task_group_preparing"
  | "file_editing"
  | "validating"
  | "previewing"
  | "browser_testing"
  | "fixing"
  | "retesting"
  | "reviewing"
  | "complete"
  | "paused"
  | "failed";

export type AgentRenderableType = 
  | "thinking"
  | "compact_status"
  | "plan_card"
  | "checkpoint_status"
  | "mini_code_box_group"
  | "mini_code_box"
  | "validation_card"
  | "preview_card"
  | "browser_permission_card"
  | "browser_action_summary"
  | "error_card"
  | "review_card"
  | "build_complete"
  | "build_paused";

export interface RenderBlock {
  id: string;
  type: AgentRenderableType;
  phase: AgentPhase;
  taskId?: string;
  dependsOn?: string[];
  minVisibleMs?: number;
  delayBeforeMs?: number;
  delayAfterMs?: number;
  canSkipAnimation?: boolean;
  renderPolicy: "sequential" | "replace_current" | "background_status" | "requires_user_action";
  payload?: any;
}

export class AgentRenderQueue {
  private queue: RenderBlock[] = [];
  private activeBlocks: RenderBlock[] = [];
  private isPaused: boolean = false;
  private onQueueChange?: (active: RenderBlock[], queue: RenderBlock[]) => void;

  constructor(onQueueChange?: (active: RenderBlock[], queue: RenderBlock[]) => void) {
    this.onQueueChange = onQueueChange;
  }

  enqueue(block: RenderBlock) {
    this.queue.push(block);
    this.processQueue();
  }

  clear() {
    this.queue = [];
    this.activeBlocks = [];
    this.isPaused = false;
    this.notify();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
    this.processQueue();
  }

  skipAnimations() {
    // Instantly complete current animations but don't skip required logical blocks
    this.processQueue(true);
  }

  finishBlock(blockId: string) {
    this.activeBlocks = this.activeBlocks.filter(b => b.id !== blockId);
    this.processQueue();
  }

  unblock(blockId: string) {
    const block = this.activeBlocks.find(b => b.id === blockId);
    if (block) {
      block.renderPolicy = "background_status";
      this.notify();
      this.processQueue();
    }
  }

  private processQueue(skipTiming = false) {
    if (this.isPaused || this.queue.length === 0) {
      this.notify();
      return;
    }

    // Determine if we can move a block from queue to active
    const nextBlock = this.queue[0];

    // Gate checks
    if (this.isBlockedByGate(nextBlock)) {
      return; // Wait for active blocks to finish
    }

    // Move to active
    this.queue.shift();
    
    if (nextBlock.renderPolicy === "replace_current") {
      // Clear similar types
      this.activeBlocks = this.activeBlocks.filter(b => b.type !== nextBlock.type);
    }

    this.activeBlocks.push(nextBlock);
    this.notify();

    // If it has a natural delay, we might auto-finish it (unless it's a permanent block until code completes)
    if (skipTiming && nextBlock.canSkipAnimation !== false) {
      this.finishBlock(nextBlock.id);
    }
  }

  private isBlockedByGate(nextBlock: RenderBlock): boolean {
    if (nextBlock.renderPolicy === "background_status") return false;
    if (this.activeBlocks.some(b => b.renderPolicy === "requires_user_action")) return true;
    
    // Strict sequential rule: Wait for all current sequential blocks to finish
    if (nextBlock.renderPolicy === "sequential") {
      return this.activeBlocks.some(b => b.renderPolicy === "sequential" && b.type !== nextBlock.type);
    }
    
    return false;
  }

  private notify() {
    if (this.onQueueChange) {
      this.onQueueChange([...this.activeBlocks], [...this.queue]);
    }
  }

  getActiveBlocks() {
    return this.activeBlocks;
  }
}
