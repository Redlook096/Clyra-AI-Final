export class AgentBrowserController {
  static async startSession(url: string) {
    // Initiate AI browsing session within the preview iframe
    console.log(`Starting AI Browser testing session for ${url}`);
  }

  static async stopSession() {
    console.log(`Stopping AI Browser testing session`);
  }

  static async observeState() {
    return {
      url: "",
      title: "",
      timestamp: Date.now(),
    };
  }
}
