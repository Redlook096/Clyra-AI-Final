export class PresentableSoftwarePass {
  /**
   * Analyzes the generated code and preview state to ensure the final output
   * feels premium and not like a generic generated script.
   */
  static runPass(fileTree: any[], previewHtml?: string): { passed: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for CSS reset or layout structure
    const hasStyles = fileTree.some(f => f.path.endsWith('.css') || f.path.endsWith('.scss'));
    const usesTailwind = fileTree.some(f => f.content?.includes('className="'));
    
    if (!hasStyles && !usesTailwind) {
      warnings.push("No explicit styling detected. The output may look raw and unstyled.");
    }

    if (previewHtml) {
      if (!previewHtml.includes("flex") && !previewHtml.includes("grid")) {
        warnings.push("No modern layout systems (flex/grid) detected in the preview.");
      }
      if (!previewHtml.includes("hover:")) {
        warnings.push("Missing interactive states (hover/focus).");
      }
    }

    return {
      passed: warnings.length === 0,
      warnings
    };
  }
}
