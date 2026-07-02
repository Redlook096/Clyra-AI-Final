import { SectionHeader } from "./SectionHeader";

const flow = ["Plan", "Assign owner", "Run automation", "Resolve blockers", "Preview"];

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
            <p>{item === "Resolve blockers" ? "Resolve blockers with owner context and the smallest useful next action." : "Keep every handoff clear, owned, and easy to inspect."}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
