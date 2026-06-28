import { useState, useCallback, useRef } from "react";
import { AgentRenderQueue, AgentPhase, RenderBlock } from "./agent-render-queue";
import { VibePlan } from "../../../types/vibe-plan";
import { VibePreviewState } from "../../../types/vibe-preview";

// Helper for waiting in async functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useStepOrchestrator() {
  const [activeBlocks, setActiveBlocks] = useState<RenderBlock[]>([]);
  const queueRef = useRef(new AgentRenderQueue((active) => {
    setActiveBlocks([...active]);
  }));
  const queue = queueRef.current;

  const [currentPhase, setCurrentPhase] = useState<AgentPhase>("idle");

  const startFlow = useCallback(async () => {
    setCurrentPhase("understanding");
    
    // 1. Thinking
    const thinkingId = `thinking-${Date.now()}`;
    queue.enqueue({
      id: thinkingId,
      type: "thinking",
      phase: "understanding",
      renderPolicy: "replace_current",
      payload: { text: "Analyzing your request, outlining basic functions and features..." }
    });

    await delay(1000); // Simulate some work before real planning kicks in
  }, [queue]);

  const onPlanReady = useCallback(async (plan: VibePlan) => {
    setCurrentPhase("awaiting_approval");
    
    queue.enqueue({
      id: `plan-card-${Date.now()}`,
      type: "plan_card",
      phase: "awaiting_approval",
      renderPolicy: "requires_user_action",
      payload: { plan }
    });
  }, [queue]);

  const onPlanApproved = useCallback(async (plan: VibePlan) => {
    // Finish plan card
    const planBlock = queue.getActiveBlocks().find(b => b.type === "plan_card");
    if (planBlock) queue.finishBlock(planBlock.id);

    setCurrentPhase("checkpointing");
    queue.enqueue({
      id: `checkpoint-${Date.now()}`,
      type: "checkpoint_status",
      phase: "checkpointing",
      renderPolicy: "sequential",
      payload: { text: "Plan Approved. Checkpointing project..." }
    });

    await delay(1000); // Simulate checkpoint wait
    const checkBlock = queue.getActiveBlocks().find(b => b.type === "checkpoint_status");
    if (checkBlock) queue.finishBlock(checkBlock.id);

    setCurrentPhase("task_group_preparing");
    queue.enqueue({
      id: `thinking-tasks-${Date.now()}`,
      type: "thinking",
      phase: "task_group_preparing",
      renderPolicy: "replace_current",
      payload: { text: "Preparing frontend and architecture execution..." }
    });
    
    await delay(1500);
    const thinkingBlock = queue.getActiveBlocks().find(b => b.type === "thinking");
    if (thinkingBlock) queue.finishBlock(thinkingBlock.id);
  }, [queue]);

  const onFilesReady = useCallback(async (patches: any[], plan: VibePlan) => {
    setCurrentPhase("file_editing");
    
    // Group boxes
    queue.enqueue({
      id: `boxes-${Date.now()}`,
      type: "mini_code_box_group",
      phase: "file_editing",
      renderPolicy: "sequential",
      payload: { patches, plan }
    });
  }, [queue]);

  const onPreviewReady = useCallback(async () => {
    const prevBlock = queue.getActiveBlocks().find(b => b.type === "preview_card");
    if (prevBlock) queue.unblock(prevBlock.id);

    setCurrentPhase("reviewing");
    queue.enqueue({
      id: `review-${Date.now()}`,
      type: "review_card",
      phase: "reviewing",
      renderPolicy: "sequential"
    });

    await delay(1500); // Review wait
    const revBlock = queue.getActiveBlocks().find(b => b.type === "review_card");
    if (revBlock) queue.unblock(revBlock.id);

    setCurrentPhase("complete");
    queue.enqueue({
      id: `complete-${Date.now()}`,
      type: "build_complete",
      phase: "complete",
      renderPolicy: "sequential"
    });
  }, [queue]);

  const onFilesComplete = useCallback(async () => {
    const boxBlock = queue.getActiveBlocks().find(b => b.type === "mini_code_box_group");
    if (boxBlock) queue.unblock(boxBlock.id);

    setCurrentPhase("validating");
    queue.enqueue({
      id: `validation-${Date.now()}`,
      type: "validation_card",
      phase: "validating",
      renderPolicy: "sequential"
    });

    await delay(2000); // Wait for real validation
    // Simulate pass
    
    const valBlock = queue.getActiveBlocks().find(b => b.type === "validation_card");
    if (valBlock) queue.unblock(valBlock.id);

    setCurrentPhase("previewing");
    queue.enqueue({
      id: `preview-${Date.now()}`,
      type: "preview_card",
      phase: "previewing",
      renderPolicy: "sequential"
    });
    
    await delay(1500); // Simulate preview load
    
    setCurrentPhase("browser_testing");
    queue.enqueue({
      id: `browser-${Date.now()}`,
      type: "browser_action_summary",
      phase: "browser_testing",
      renderPolicy: "sequential"
    });
    
    setTimeout(() => {
      onPreviewReady();
    }, 2000);
  }, [queue, onPreviewReady]);

  const clearQueue = useCallback(() => {
    queue.clear();
    setCurrentPhase("idle");
  }, [queue]);

  return {
    queue,
    activeBlocks,
    currentPhase,
    startFlow,
    onPlanReady,
    onPlanApproved,
    onFilesReady,
    onFilesComplete,
    onPreviewReady,
    clearQueue
  };
}
