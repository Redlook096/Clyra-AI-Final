export class RulesLoader {
  static loadRules(files: { path: string, content: string }[]): string {
    const agentsMd = files.find(f => f.path.includes("AGENTS.md"));
    return agentsMd ? agentsMd.content : "";
  }
}
