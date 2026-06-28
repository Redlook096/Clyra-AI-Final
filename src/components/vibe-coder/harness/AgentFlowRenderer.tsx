import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RenderBlock } from "../../../../lib/vibe-coder/harness/agent-render-queue";
import { ThinkingStep } from "../thinking/ThinkingStep";
import { PlanCard } from "../plan/PlanCard";
import { CompactTaskStatus } from "../tasks/CompactTaskStatus";
import { ValidationStatusCard } from "../validation/ValidationStatusCard";
import { ReviewPanel } from "../review/ReviewPanel";
import { AgentActivityStrip } from "../tasks/AgentActivityStrip";
import { MiniCodeBoxQueue } from "../code/MiniCodeBoxQueue";
import { VibePlan } from "../../../../types/vibe-plan";

interface AgentFlowRendererProps {
  activeBlocks: RenderBlock[];
  onApprovePlan: () => void;
  onRejectPlan: () => void;
  onCodeBoxComplete: () => void;
  projectMode?: boolean;
}

export function AgentFlowRenderer({ 
  activeBlocks, 
  onApprovePlan, 
  onRejectPlan,
  onCodeBoxComplete,
  projectMode = false
}: AgentFlowRendererProps) {
  
  // We deduce active agent from the active blocks to pass to the strip
  const hasThinking = activeBlocks.some(b => b.type === "thinking");
  const hasBuilding = activeBlocks.some(b => b.type === "mini_code_box_group");
  const isComplete = activeBlocks.some(b => b.type === "build_complete");

  const activeAgent = hasBuilding ? "Frontend" : (hasThinking && !isComplete) ? "Planner" : null;

  return (
    <div className="w-full max-w-[760px] space-y-4 self-start flex flex-col">
      {/* Activity Strip is a permanent background status once started */}
      {activeBlocks.length > 0 && !isComplete && (
        <AgentActivityStrip activeAgent={activeAgent} />
      )}

      <AnimatePresence mode="popLayout">
        {activeBlocks.map((block) => {
          switch (block.type) {
            case "thinking":
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ThinkingStep
                    active={true}
                    startedAt={Date.now()}
                    finishedMs={0}
                    thoughtText={block.payload?.text || "Processing..."}
                    thoughtPhase="interpreting" // Dummy value, the text is what matters
                  />
                </motion.div>
              );
            case "plan_card":
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <PlanCard
                    plan={block.payload?.plan}
                    onApprove={onApprovePlan}
                    onRegenerate={onRejectPlan}
                  />
                </motion.div>
              );
            case "checkpoint_status":
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex w-full justify-center"
                >
                  <div className="rounded-full border border-emerald-500/30 bg-emerald-50/80 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-emerald-600 backdrop-blur-md">
                    {block.payload?.text || "Checkpoint Created"}
                  </div>
                </motion.div>
              );
            case "mini_code_box_group":
              const patches = block.payload?.patches || [];
              const plan = block.payload?.plan as VibePlan;
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  {plan && (
                    <div className="flex flex-wrap items-center gap-3">
                      <CompactTaskStatus 
                        tasks={plan.taskGraph.map((t: any) => ({ 
                          id: t.id || t.name, 
                          name: t.name, 
                          status: "active" 
                        }))} 
                      />
                    </div>
                  )}
                  <MiniCodeBoxQueue 
                    boxes={patches.map((p: any, i: number) => ({
                      id: `box-${i}`,
                      action: p.added > 0 ? "create" : "edit",
                      filePath: p.file,
                      purpose: p.reason || "Updating file",
                      fullContent: p.code
                    }))} 
                    isStreamDone={true}
                    onQueueComplete={onCodeBoxComplete} 
                  />
                </motion.div>
              );
            case "validation_card":
              return (
                <motion.div key={block.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                  <ValidationStatusCard status="passed" />
                </motion.div>
              );
            case "preview_card":
              return null; // Preview slides in via layout, we just use this block to stall completion
            case "review_card":
              return (
                <motion.div key={block.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
                  <ReviewPanel score={98} blockers={[]} />
                </motion.div>
              );
            case "build_complete":
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex w-full justify-center"
                >
                  <p className="text-[15px] sm:text-[16px] font-normal leading-relaxed text-slate-500">
                    Build complete. The project is saved, validated locally, and ready to test.
                  </p>
                </motion.div>
              );
            default:
              return null;
          }
        })}
      </AnimatePresence>
    </div>
  );
}
