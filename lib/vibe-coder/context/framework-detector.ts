export class FrameworkDetector {
  static detect(packageJson: string): string {
    if (packageJson.includes("next")) return "Next.js";
    if (packageJson.includes("vite") && packageJson.includes("react")) return "Vite React";
    return "Unknown";
  }
}
