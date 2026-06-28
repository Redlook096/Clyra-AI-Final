import { SectionHeader } from "./SectionHeader";

const flow = ["Plan", "Generate file", "Run checks", "Fix errors", "Preview"];

export function CodeGenerationSection() {
  return (
    <section className="section code-section">
      <SectionHeader
        eyebrow="Workflow automation"
        title="Automations stay clear, visible, and easy to trust."
        copy="Each workflow step shows what changed, who owns it, what is blocked, and what happens next."
      />
      <div className="generation-flow">
        {flow.map((item) => (
          <article key={item}>
            <span>{item}</span>
            <p>{item === "Fix errors" ? "Patch the exact file from real terminal output." : "Keep the build controlled and inspectable."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
