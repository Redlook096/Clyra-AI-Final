import { SectionHeader } from "./SectionHeader";

const flow = ["Plan", "Generate file", "Run checks", "Fix errors", "Preview"];

export function CodeGenerationSection() {
  return (
    <section className="section code-section">
      <SectionHeader
        eyebrow="Code generation"
        title="One file at a time, never a mystery dump."
        copy="Each generated file appears in a focused mini code box, waits, expands, streams, closes, and then the next file begins."
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
