import { VibePlan } from "../../../types/vibe-plan";

export class SecurityPass {
  /**
   * Verifies that the plan and executed code do not contain security risks
   * or perform destructive actions without approval.
   */
  static checkPlanSecurity(plan: VibePlan): { safe: boolean; flaggedItems: string[] } {
    const flaggedItems: string[] = [];

    // Flag env edits
    const editsEnv = plan.proposedFileTree.some(f => f.path.includes('.env'));
    if (editsEnv) {
      flaggedItems.push("Plan attempts to modify environment variables.");
    }

    // Flag destructive file actions
    const avoidsFiles = plan.proposedFileTree.some((f: any) => f.action === "avoid" || f.action === "delete");
    if (avoidsFiles) {
      flaggedItems.push("Plan attempts to avoid/delete files. Requires explicit approval.");
    }

    // Flag database/auth integrations that might be insecure mocks
    const integratesAuth = plan.architecturePlan?.components?.some(c => /auth|login|supabase|firebase/i.test(c));
    if (integratesAuth && plan.goal.toLowerCase().includes("production")) {
      flaggedItems.push("Production auth integration detected. Ensure no hardcoded secrets.");
    }

    return {
      safe: flaggedItems.length === 0,
      flaggedItems
    };
  }
}
