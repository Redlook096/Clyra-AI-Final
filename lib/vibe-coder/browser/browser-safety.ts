export class BrowserSafety {
  /**
   * Prevents the AI from navigating away from localhost
   * or executing harmful JS payloads.
   */
  static isSafeUrl(url: string): boolean {
    return url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");
  }
}
