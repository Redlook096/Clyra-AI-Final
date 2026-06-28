import { AgentPhase } from "./agent-render-queue";

export class PhaseScheduler {
  private currentPhase: AgentPhase = "idle";
  
  public advanceTo(phase: AgentPhase) {
    this.currentPhase = phase;
    // Log or handle transitions
  }
  
  public getCurrentPhase(): AgentPhase {
    return this.currentPhase;
  }
}
