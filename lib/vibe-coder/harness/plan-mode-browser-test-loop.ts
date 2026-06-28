import { AgentBrowserController } from "../browser/agent-browser-controller";
import { BrowserActions } from "../browser/browser-actions";
import { BrowserPermissions } from "../browser/browser-permissions";
import { VibeBrowserAgentAction } from "../../../types/vibe-browser-agent";

export class PlanModeBrowserTestLoop {
  private isTesting: boolean = false;

  async runTest(url: string, actions: VibeBrowserAgentAction[]) {
    this.isTesting = true;
    
    // First, ask for permission
    const granted = await BrowserPermissions.requestPermission();

    if (!granted) {
       this.isTesting = false;
       return false;
    }

    await AgentBrowserController.startSession(url);

    // Run actions with observation and verification
    for (const action of actions) {
      if (!this.isTesting) break;
      
      // 1. Observe
      const stateBefore = await AgentBrowserController.observeState();
      
      // 2. Act
      await BrowserActions.execute(action);
      
      // 3. Observe result
      const stateAfter = await AgentBrowserController.observeState();
      
      // 4. Verify
      const passed = this.verifyExpectation(action, stateBefore, stateAfter);
      
      // 5. Log
      console.log(`Action ${action.type}: ${passed ? "PASSED" : "FAILED"}`);
      
      if (!passed) {
        // Return issue mapping for ErrorFixer
        await AgentBrowserController.stopSession();
        this.isTesting = false;
        return { success: false, failedAction: action };
      }
    }

    await AgentBrowserController.stopSession();
    this.isTesting = false;
    return { success: true };
  }

  private verifyExpectation(action: any, before: any, after: any): boolean {
    // Stub verification logic
    return true;
  }

  cancel() {
    this.isTesting = false;
    AgentBrowserController.stopSession();
  }
}
